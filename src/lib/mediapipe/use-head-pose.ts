"use client";

import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { useMotionValue, type MotionValue } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";

import { getFaceLandmarker } from "./face-landmarker";

// Canonical FaceMesh indices used for yaw estimation:
//   1   — nose tip
//   234 — face's right edge (image-LEFT in raw camera coords)
//   454 — face's left edge  (image-RIGHT in raw camera coords)
const NOSE = 1;
const RIGHT_EDGE = 234;
const LEFT_EDGE = 454;

// Thresholds from product spec — kept as exported constants so the progress
// ring component can derive its fill from the same numbers.
export const STRAIGHT_LO = 0.8;
export const STRAIGHT_HI = 1.2;
export const LEFT_THRESHOLD = 2.5;
export const RIGHT_THRESHOLD = 0.4;

// Frame-to-frame ratio velocity above which we nudge the user to slow down.
// Tuned for ~60Hz RAF; assumes the spec ratio of [0.4, 2.5] should take >300ms
// to traverse in a controlled turn.
const FAST_DELTA_PER_MS = 0.006;
// "Lost face" requires this much consecutive blank time — a single dropped
// frame shouldn't kick the user out of the flow.
const LOST_TIMEOUT_MS = 500;
// Once flagged "too fast", stay flagged for this long so the warning sticks
// long enough to read instead of flickering on/off every frame.
const TOO_FAST_HOLD_MS = 1500;

export type HeadPose = "straight" | "left" | "right" | "between" | "lost";

export type HeadPoseSnapshot = {
  pose: HeadPose;
  tooFast: boolean;
  ready: boolean; // landmarker loaded
  loadError: boolean;
};

export type UseHeadPoseResult = {
  // High-frequency signal — bind directly to motion-based UI (progress rings)
  // so we don't trigger a React re-render every animation frame.
  ratio: MotionValue<number>;
  // Coarse-grained, re-render-safe view of the same stream.
  snapshot: HeadPoseSnapshot;
};

export function useHeadPose(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean
): UseHeadPoseResult {
  const ratio = useMotionValue(Number.NaN);
  const [snapshot, setSnapshot] = useState<HeadPoseSnapshot>({
    pose: "lost",
    tooFast: false,
    ready: false,
    loadError: false,
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let raf: number | null = null;
    let landmarker: FaceLandmarker | null = null;

    let prevRatio = Number.NaN;
    let prevTime = 0;
    let lastSeen = 0;
    let tooFastUntil = 0;

    let curPose: HeadPose = "lost";
    let curTooFast = false;

    const commit = (next: Partial<HeadPoseSnapshot>) => {
      if (cancelled) return;
      setSnapshot((s) => {
        const merged = { ...s, ...next };
        if (
          merged.pose === s.pose &&
          merged.tooFast === s.tooFast &&
          merged.ready === s.ready &&
          merged.loadError === s.loadError
        ) {
          return s;
        }
        return merged;
      });
    };

    void (async () => {
      try {
        landmarker = await getFaceLandmarker();
      } catch (err) {
        console.error("FaceLandmarker load failed", err);
        commit({ loadError: true });
        return;
      }
      if (cancelled) return;
      commit({ ready: true });

      const tick = () => {
        if (cancelled) return;
        const video = videoRef.current;
        if (!video || video.readyState < 2 || !landmarker) {
          raf = requestAnimationFrame(tick);
          return;
        }

        const now = performance.now();
        let result;
        try {
          result = landmarker.detectForVideo(video, now);
        } catch {
          // Some browsers throw on tainted canvases or when the video is
          // momentarily detached — bail this frame, try again next.
          raf = requestAnimationFrame(tick);
          return;
        }

        const landmarks = result.faceLandmarks?.[0];
        if (!landmarks) {
          if (now - lastSeen > LOST_TIMEOUT_MS && curPose !== "lost") {
            curPose = "lost";
            ratio.set(Number.NaN);
            commit({ pose: "lost" });
          }
          // Even when face is lost, decay the too-fast flag so it doesn't
          // stick forever after a flicker.
          if (curTooFast && now > tooFastUntil) {
            curTooFast = false;
            commit({ tooFast: false });
          }
          raf = requestAnimationFrame(tick);
          return;
        }

        lastSeen = now;
        const nose = landmarks[NOSE];
        const right = landmarks[RIGHT_EDGE];
        const left = landmarks[LEFT_EDGE];
        if (!nose || !right || !left) {
          raf = requestAnimationFrame(tick);
          return;
        }

        const distLeft = Math.abs(nose.x - left.x);
        const distRight = Math.abs(nose.x - right.x);
        const r = distRight > 1e-6 ? distLeft / distRight : Number.NaN;

        if (!Number.isNaN(r)) {
          ratio.set(r);

          let nextPose: HeadPose = "between";
          if (r > LEFT_THRESHOLD) nextPose = "left";
          else if (r < RIGHT_THRESHOLD) nextPose = "right";
          else if (r >= STRAIGHT_LO && r <= STRAIGHT_HI) nextPose = "straight";

          if (nextPose !== curPose) {
            curPose = nextPose;
            commit({ pose: nextPose });
          }

          if (!Number.isNaN(prevRatio)) {
            const dt = now - prevTime;
            if (dt > 0) {
              const speed = Math.abs(r - prevRatio) / dt;
              if (speed > FAST_DELTA_PER_MS) {
                tooFastUntil = now + TOO_FAST_HOLD_MS;
                if (!curTooFast) {
                  curTooFast = true;
                  commit({ tooFast: true });
                }
              } else if (curTooFast && now > tooFastUntil) {
                curTooFast = false;
                commit({ tooFast: false });
              }
            }
          }
          prevRatio = r;
          prevTime = now;
        }

        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [enabled, videoRef, ratio]);

  return { ratio, snapshot };
}
