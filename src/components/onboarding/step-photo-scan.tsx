"use client";

import { FaceLandmarker } from "@mediapipe/tasks-vision";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
} from "framer-motion";
import { CameraOff, ImagePlus, ScanFace, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  LEFT_THRESHOLD,
  RIGHT_THRESHOLD,
  STRAIGHT_HI,
  STRAIGHT_LO,
  useHeadPose,
} from "@/lib/mediapipe/use-head-pose";

type Props = {
  onCapture: (files: File[]) => void;
};

type Phase = "requesting" | "denied" | "streaming" | "done";

// Capture state machine: idle → front → left → right → done. Each pose-gated
// step waits for the user to hold the target pose (and pass lighting /
// distance gates) for STEP_HOLD_MS, then silently snapshots a frame.
type CaptureStep = "idle" | "front" | "left" | "right" | "done";

const STEP_HOLD_MS: Record<"front" | "left" | "right", number> = {
  front: 700,
  left: 600,
  right: 600,
};

const TOO_CLOSE_HOLD_MS = 400;
const LOW_LIGHT_THRESHOLD = 70;
const LOW_LIGHT_SAMPLE_INTERVAL_MS = 700;
// Capture flash duration — the white screen-flash that plays right before we
// hand the 3 files off to the parent.
const FLASH_DURATION_MS = 420;
// We delay the parent's onCapture by slightly less than the flash so the
// flash animation gets to play but the parent doesn't sit waiting.
const FLASH_HANDOFF_MS = 360;

// FaceID ring geometry. SEGMENT_COUNT is divisible by 4 so the 12/3/6/9
// o'clock markers land on segment boundaries exactly.
const SEGMENT_COUNT = 72;
const HALF_SEGMENTS = SEGMENT_COUNT / 2;
const RING_VIEWBOX = 340;
const RING_INNER_R = 148;
const RING_OUTER_R = 164;

const COLOR_GRAY = "rgba(255,255,255,0.22)";
const COLOR_WHITE = "rgba(255,255,255,0.92)";
const COLOR_GREEN_DIM = "rgba(34,197,94,0.42)";
const COLOR_GREEN_NEON = "#00FF6A";
const COLOR_RED = "rgba(239,68,68,0.92)";

const STEP_HEADLINE: Record<CaptureStep, string> = {
  idle: "Mika đang khởi động camera…",
  front: "Nhìn thẳng vào ống kính để kiểm tra ánh sáng…",
  left: "Từ từ quay mặt sang trái…",
  right: "Giờ từ từ quay mặt sang phải…",
  done: "Scan hoàn tất ✨",
};

export function StepPhotoScan({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wireframeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const samplerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestedRef = useRef(false);

  // Captured Files accumulate here so the state-machine effect doesn't have
  // to round-trip through React state between async `toBlob` resolutions.
  const filesRef = useRef<File[]>([]);
  // Timestamp until which the wireframe should render at flash-opacity.
  const flashUntilRef = useRef(0);

  // Mirror of `step` for the motion-value subscription, which closes over
  // stale state otherwise.
  const stepRef = useRef<CaptureStep>("idle");
  // Monotonic per-step progress refs — once a segment lights up, it stays
  // lit even if the user wobbles back through center. Keeps the ring from
  // un-filling and re-filling on noisy frames.
  const leftProgressMaxRef = useRef(0);
  const rightProgressMaxRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("requesting");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<CaptureStep>("idle");
  const [lowLight, setLowLight] = useState(false);
  const [tooCloseStable, setTooCloseStable] = useState(false);
  // Ring fill (0..1) for the active turn step. Quantized to HALF_SEGMENTS
  // discrete stops so React only re-renders when a new tick should light up.
  const [leftProgress, setLeftProgress] = useState(0);
  const [rightProgress, setRightProgress] = useState(0);
  const [flashing, setFlashing] = useState(false);

  const { snapshot, landmarksRef, ratio } = useHeadPose(
    videoRef,
    phase === "streaming"
  );

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stopStream, [stopStream]);

  const requestCamera = useCallback(async () => {
    setError(null);
    setPhase("requesting");

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Trình duyệt không hỗ trợ camera. Bạn dùng tải ảnh nhé!");
      setPhase("denied");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      filesRef.current = [];
      leftProgressMaxRef.current = 0;
      rightProgressMaxRef.current = 0;
      setLeftProgress(0);
      setRightProgress(0);
      setPhase("streaming");
      setStep("front");
    } catch {
      setError(
        "Mika không truy cập được camera 😢 — bạn có thể tải ảnh có sẵn nhé."
      );
      setPhase("denied");
    }
  }, []);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    void requestCamera();
  }, [requestCamera]);

  // ─── Silent frame grab ────────────────────────────────────────────────
  // Mirrors the captured frame so the saved JPEG matches what the user saw
  // in the live preview (which is also CSS-flipped via scaleX(-1)).
  const grabFrame = useCallback((label: string): Promise<File | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return resolve(null);
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          resolve(
            new File([blob], `selfie-${label}-${Date.now()}.jpg`, {
              type: "image/jpeg",
            })
          );
        },
        "image/jpeg",
        0.95
      );
    });
  }, []);

  // ─── State-machine: pose + lighting + distance gating ────────────────
  useEffect(() => {
    if (phase !== "streaming") return;
    if (step === "idle" || step === "done") return;

    let ok = false;
    if (step === "front") {
      ok = snapshot.pose === "straight" && !lowLight && !tooCloseStable;
    } else if (step === "left") {
      ok = snapshot.pose === "left";
    } else if (step === "right") {
      ok = snapshot.pose === "right";
    }
    if (!ok) return;

    const t = setTimeout(() => {
      void (async () => {
        const file = await grabFrame(step);
        if (!file) return;
        filesRef.current = [...filesRef.current, file];
        flashUntilRef.current = performance.now() + 320;
        if (step === "front") {
          setStep("left");
        } else if (step === "left") {
          // Snap the left ring to fully lit when capture lands — guards
          // against a near-1 progress value where the last tick never
          // crossed the quantization boundary.
          leftProgressMaxRef.current = 1;
          setLeftProgress(1);
          setStep("right");
        } else if (step === "right") {
          rightProgressMaxRef.current = 1;
          setRightProgress(1);
          setStep("done");
          setPhase("done");
          stopStream();
          // Screen-flash, then hand off. Delay onCapture slightly so the
          // user actually sees the flash before the parent unmounts us.
          setFlashing(true);
          setTimeout(() => setFlashing(false), FLASH_DURATION_MS);
          setTimeout(
            () => onCapture(filesRef.current),
            FLASH_HANDOFF_MS
          );
        }
      })();
    }, STEP_HOLD_MS[step]);
    return () => clearTimeout(t);
  }, [
    phase,
    step,
    snapshot.pose,
    lowLight,
    tooCloseStable,
    grabFrame,
    onCapture,
    stopStream,
  ]);

  // ─── tooClose debounce — only flag after sustained 400ms ─────────────
  useEffect(() => {
    const delay = snapshot.tooClose ? TOO_CLOSE_HOLD_MS : 0;
    const t = setTimeout(() => setTooCloseStable(snapshot.tooClose), delay);
    return () => clearTimeout(t);
  }, [snapshot.tooClose]);

  // ─── Ring fill ↔ head-pose ratio ─────────────────────────────────────
  // Subscribe to the ratio MotionValue (no React re-renders per frame) and
  // only setState when the quantized progress crosses a new segment.
  useMotionValueEvent(ratio, "change", (r) => {
    if (Number.isNaN(r)) return;
    const cur = stepRef.current;
    if (cur === "left") {
      const raw = (r - STRAIGHT_HI) / (LEFT_THRESHOLD - STRAIGHT_HI);
      const clamped = Math.max(0, Math.min(1, raw));
      if (clamped > leftProgressMaxRef.current) {
        const quant = Math.round(clamped * HALF_SEGMENTS) / HALF_SEGMENTS;
        if (quant > leftProgressMaxRef.current) {
          leftProgressMaxRef.current = quant;
          setLeftProgress(quant);
        }
      }
    } else if (cur === "right") {
      const raw =
        (STRAIGHT_LO - r) / (STRAIGHT_LO - RIGHT_THRESHOLD);
      const clamped = Math.max(0, Math.min(1, raw));
      if (clamped > rightProgressMaxRef.current) {
        const quant = Math.round(clamped * HALF_SEGMENTS) / HALF_SEGMENTS;
        if (quant > rightProgressMaxRef.current) {
          rightProgressMaxRef.current = quant;
          setRightProgress(quant);
        }
      }
    }
  });

  // ─── Wireframe canvas RAF ────────────────────────────────────────────
  // Kept (subtler than before) for that "AI is looking at you" feel; clipped
  // to the circular camera frame by its parent's `overflow-hidden`.
  useEffect(() => {
    if (phase !== "streaming") return;
    const canvas = wireframeCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TESS = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
    let raf: number | null = null;

    const tick = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w && h) {
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        const lm = landmarksRef.current;
        if (lm && lm.length) {
          const path = new Path2D();
          for (let i = 0; i < TESS.length; i++) {
            const c = TESS[i];
            const a = lm[c.start];
            const b = lm[c.end];
            if (!a || !b) continue;
            path.moveTo(a.x * w, a.y * h);
            path.lineTo(b.x * w, b.y * h);
          }
          const flash = performance.now() < flashUntilRef.current;
          ctx.strokeStyle = flash
            ? "rgba(0,255,140,0.90)"
            : "rgba(255,255,255,0.26)";
          ctx.lineWidth = flash ? 2.4 : 1.1;
          ctx.stroke(path);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [phase, landmarksRef]);

  // ─── Low-light sampler ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "streaming") return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const canvas =
        samplerCanvasRef.current ??
        (samplerCanvasRef.current = document.createElement("canvas"));
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 32, 32);
      let sum = 0;
      try {
        const data = ctx.getImageData(0, 0, 32, 32).data;
        for (let i = 0; i < data.length; i += 4) {
          sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
      } catch {
        return;
      }
      const avg = sum / (32 * 32);
      setLowLight(avg < LOW_LIGHT_THRESHOLD);
    }, LOW_LIGHT_SAMPLE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phase]);

  const handleGalleryFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File này không phải ảnh hợp lệ — chọn file ảnh nhé.");
      return;
    }
    setError(null);
    stopStream();
    onCapture([file]);
  };

  const denied = phase === "denied";
  const requesting = phase === "requesting";
  const finished = phase === "done";

  // Top warning slot: only one warning at a time. tooClose is physical-safety
  // critical → wins. tooFast is a soft correction. lowLight is the lightest
  // hint and yields to both.
  const topWarning: "tooClose" | "tooFast" | "lowLight" | null = tooCloseStable
    ? "tooClose"
    : snapshot.tooFast
      ? "tooFast"
      : lowLight && !finished
        ? "lowLight"
        : null;

  const headline = requesting ? STEP_HEADLINE.idle : STEP_HEADLINE[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-10 overflow-hidden bg-black"
      style={{
        top: "calc(-1 * env(safe-area-inset-top))",
        height: "calc(100% + env(safe-area-inset-top))",
      }}
    >
      {/* ── Soft top-edge vignette so the headline reads against any skin */}
      {/* tone reflected by the rim glow.                                 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[44%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.0) 100%)",
        }}
      />

      {/* ── Layer 1 · Top warning bar ─────────────────────────────────── */}
      <AnimatePresence>
        {topWarning === "tooClose" && (
          <motion.div
            key="warn-close"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 24,
              mass: 0.85,
            }}
            className="absolute left-1/2 z-[40] -translate-x-1/2 rounded-2xl px-4 py-2 text-center text-[12px] font-semibold tracking-tight text-white"
            style={{
              top: "calc(env(safe-area-inset-top) + 70px)",
              background: "rgba(220,38,38,0.92)",
              boxShadow:
                "0 0 24px rgba(220,38,38,0.85), 0 0 56px rgba(220,38,38,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            You are too close to your smartphone
          </motion.div>
        )}
        {topWarning === "tooFast" && (
          <motion.div
            key="warn-fast"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="absolute left-1/2 z-[35] -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
            style={{
              top: "calc(env(safe-area-inset-top) + 70px)",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.20)",
            }}
          >
            Chậm lại một chút bạn ơi…
          </motion.div>
        )}
        {topWarning === "lowLight" && (
          <motion.div
            key="warn-light"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="absolute left-1/2 z-[35] -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-amber-50"
            style={{
              top: "calc(env(safe-area-inset-top) + 70px)",
              background: "rgba(245,158,11,0.32)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.20)",
            }}
          >
            💡 Hơi tối — Mika cần thêm ánh sáng nha
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layer 2 · Instruction headline (large white, above the ring) */}
      {!denied && (
        <div
          className="pointer-events-none absolute inset-x-0 z-[30] px-6 text-center"
          style={{ top: "calc(env(safe-area-inset-top) + 116px)" }}
        >
          <AnimatePresence mode="wait">
            <motion.h1
              key={`headline-${step}-${requesting}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-[320px] text-balance text-[19px] font-semibold leading-snug tracking-tight text-white"
              style={{
                textShadow: "0 1px 14px rgba(0,0,0,0.55)",
              }}
            >
              {headline}
            </motion.h1>
          </AnimatePresence>
        </div>
      )}

      {/* ── Layer 3 · FaceID ring + circular camera, centered ─────────── */}
      {!denied && (
        <div className="pointer-events-none absolute inset-0 z-[20] flex items-center justify-center">
          <div
            className="relative"
            style={{ width: RING_VIEWBOX, height: RING_VIEWBOX }}
          >
            {/* Outer rotating glow — simulates the 3D laser sweep over the */}
            {/* ring. Two counter-rotating sweeps stack to give a richer    */}
            {/* halo. Hidden during done so the green hold reads as final.  */}
            {!finished && (
              <>
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 4.6,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0% 84%, rgba(255,255,255,0.20) 88%, rgba(255,255,255,0.70) 92%, rgba(255,255,255,0.20) 96%, transparent 100%)",
                    WebkitMaskImage:
                      "radial-gradient(circle at center, transparent 38%, black 44%, black 52%, transparent 58%)",
                    maskImage:
                      "radial-gradient(circle at center, transparent 38%, black 44%, black 52%, transparent 58%)",
                  }}
                />
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full opacity-60"
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    background:
                      "conic-gradient(from 180deg, transparent 0% 90%, rgba(0,255,160,0.40) 95%, transparent 100%)",
                    WebkitMaskImage:
                      "radial-gradient(circle at center, transparent 40%, black 45%, black 51%, transparent 56%)",
                    maskImage:
                      "radial-gradient(circle at center, transparent 40%, black 45%, black 51%, transparent 56%)",
                  }}
                />
              </>
            )}

            {/* Hold-glow ring under the dashes — gives the camera an */}
            {/* iOS-style ambient halo that warms with progress.      */}
            <div
              aria-hidden
              className="absolute inset-[18px] rounded-full"
              style={{
                boxShadow:
                  step === "done"
                    ? "0 0 60px 4px rgba(0,255,106,0.55), inset 0 0 20px rgba(0,255,106,0.35)"
                    : tooCloseStable
                      ? "0 0 50px 2px rgba(239,68,68,0.55)"
                      : step === "left" || step === "right"
                        ? "0 0 38px rgba(0,255,140,0.25)"
                        : "0 0 28px rgba(255,255,255,0.10)",
                transition: "box-shadow 320ms ease-out",
              }}
            />

            {/* SVG dashed FaceID ring */}
            <FaceIDRing
              step={step}
              leftProgress={leftProgress}
              rightProgress={rightProgress}
              tooClose={tooCloseStable}
            />

            {/* Camera circle — clips both video and the wireframe canvas */}
            <div
              className="absolute overflow-hidden rounded-full bg-black"
              style={{
                inset: 24,
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 18px 40px rgba(0,0,0,0.55)",
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="absolute inset-0 size-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas
                ref={wireframeCanvasRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 size-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Layer 4 · Bottom: upload fallback + status pill ───────────── */}
      {!denied && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[30] flex flex-col items-center gap-3 px-6"
          style={{
            paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
          }}
        >
          <AnimatePresence mode="wait">
            {requesting ? (
              <motion.div
                key="req"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  backdropFilter: "blur(28px) saturate(180%)",
                  WebkitBackdropFilter: "blur(28px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.22)",
                }}
              >
                <ScanFace className="size-4" />
                Cho phép quyền camera để Mika scan da bạn nha
              </motion.div>
            ) : finished ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="rounded-full px-4 py-2 text-[12px] font-semibold text-emerald-50"
                style={{
                  background: "rgba(0,200,90,0.22)",
                  backdropFilter: "blur(28px) saturate(180%)",
                  WebkitBackdropFilter: "blur(28px) saturate(180%)",
                  border: "1px solid rgba(0,255,140,0.30)",
                }}
              >
                Đã chụp đủ 3 góc · Mika đang phân tích…
              </motion.div>
            ) : (
              <motion.span
                key={`status-${step}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.85, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28 }}
                className="rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-white/80"
                style={{
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {step === "front"
                  ? "STEP 1 · LIGHTING CHECK"
                  : step === "left"
                    ? "STEP 2 · LEFT PROFILE"
                    : "STEP 3 · RIGHT PROFILE"}
              </motion.span>
            )}
          </AnimatePresence>

          {!finished && !requesting && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="pointer-events-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform active:scale-[0.97]"
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(28px) saturate(180%)",
                WebkitBackdropFilter: "blur(28px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.22)",
                boxShadow:
                  "0 14px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <ImagePlus className="size-4" />
              Tải ảnh có sẵn
            </button>
          )}
        </div>
      )}

      {/* ── Layer 5 · Screen flash (capture moment) ───────────────────── */}
      <AnimatePresence>
        {flashing && (
          <motion.div
            key="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.95, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: FLASH_DURATION_MS / 1000, times: [0, 0.25, 1] }}
            className="pointer-events-none absolute inset-0 z-[60] bg-white"
          />
        )}
      </AnimatePresence>

      {/* ── Layer 6 · Permission denied overlay ───────────────────────── */}
      <AnimatePresence>
        {denied && (
          <PermissionFallback
            error={error}
            onRetry={() => void requestCamera()}
            onUseGallery={() => galleryInputRef.current?.click()}
          />
        )}
      </AnimatePresence>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleGalleryFile(e.target.files?.[0])}
      />
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FaceID dashed ring — 72 radial ticks around the camera circle.
//
// Color states:
//   - idle / requesting: gray
//   - front:             white, group opacity pulses (lighting check)
//   - left:              base dim-green; ticks light neon-green from the
//                        top (12 o'clock) going CCW down to 6 o'clock as
//                        leftProgress 0→1
//   - right:             left arc stays neon-green (carryover from prev
//                        step); right arc lights neon-green from the top
//                        going CW down to 6 o'clock as rightProgress 0→1
//   - done:              all neon-green
//   - tooClose:          all red (overrides any active step)
// ════════════════════════════════════════════════════════════════════════
function FaceIDRing({
  step,
  leftProgress,
  rightProgress,
  tooClose,
}: {
  step: CaptureStep;
  leftProgress: number;
  rightProgress: number;
  tooClose: boolean;
}) {
  const cx = RING_VIEWBOX / 2;
  const cy = RING_VIEWBOX / 2;

  // Pre-computed segment endpoints (stable across renders).
  const segments = useMemo(() => {
    return Array.from({ length: SEGMENT_COUNT }, (_, i) => {
      // i=0 sits at 12 o'clock; increasing i rotates clockwise.
      const angleDeg = (i * 360) / SEGMENT_COUNT - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      return {
        x1: cx + RING_INNER_R * cos,
        y1: cy + RING_INNER_R * sin,
        x2: cx + RING_OUTER_R * cos,
        y2: cy + RING_OUTER_R * sin,
      };
    });
  }, [cx, cy]);

  // Group-level pulse during the "front" lighting-check step. We pulse the
  // group opacity instead of each segment's stroke so the animation runs
  // entirely on the compositor.
  const pulseAnim =
    step === "front"
      ? { opacity: [0.32, 1, 0.32] as number[] }
      : { opacity: 1 };
  const pulseTransition =
    step === "front"
      ? {
          duration: 1.4,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }
      : { duration: 0.35 };

  // Override priority: tooClose > step state.
  const redOverride = tooClose && step !== "idle" && step !== "done";

  return (
    <svg
      viewBox={`0 0 ${RING_VIEWBOX} ${RING_VIEWBOX}`}
      className="absolute inset-0 size-full"
      aria-hidden
    >
      <motion.g animate={pulseAnim} transition={pulseTransition}>
        {segments.map((seg, i) => {
          let stroke = COLOR_GRAY;

          if (redOverride) {
            stroke = COLOR_RED;
          } else if (step === "idle") {
            stroke = COLOR_GRAY;
          } else if (step === "front") {
            stroke = COLOR_WHITE;
          } else if (step === "done") {
            stroke = COLOR_GREEN_NEON;
          } else if (step === "left") {
            // Distance from top going CCW (i=0 → 0, i=71 → 1, … i=36 → 36).
            const distCCW = (SEGMENT_COUNT - i) % SEGMENT_COUNT;
            const lit = distCCW <= leftProgress * HALF_SEGMENTS;
            stroke = lit ? COLOR_GREEN_NEON : COLOR_GREEN_DIM;
          } else if (step === "right") {
            // Left arc (i ≥ 36 or i === 0) is already lit from the prior
            // step. Right arc (i in [0, 36]) lights from top going CW.
            const onLeftArc = i === 0 || i >= HALF_SEGMENTS;
            const onRightArcLit = i <= rightProgress * HALF_SEGMENTS;
            const lit = onLeftArc || onRightArcLit;
            stroke = lit ? COLOR_GREEN_NEON : COLOR_GREEN_DIM;
          }

          return (
            <line
              key={i}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={stroke}
              strokeWidth={3.4}
              strokeLinecap="round"
            />
          );
        })}
      </motion.g>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Permission denied / fallback dialog
// ════════════════════════════════════════════════════════════════════════
function PermissionFallback({
  error,
  onRetry,
  onUseGallery,
}: {
  error: string | null;
  onRetry: () => void;
  onUseGallery: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-[70] flex items-center justify-center px-5"
      style={{
        background: "rgba(0,0,0,0.66)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
      }}
    >
      <motion.div
        initial={{ y: 16, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-[360px] rounded-[28px] p-6 text-center"
        style={{
          background: "rgba(255,255,255,0.16)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.30)",
        }}
      >
        <div
          className="mx-auto flex size-16 items-center justify-center rounded-3xl"
          style={{
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.22)",
          }}
        >
          <CameraOff className="size-7 text-white/85" />
        </div>
        <h2 className="mt-4 text-balance text-[18px] font-semibold tracking-tight text-white">
          Mika chưa được phép xem camera
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
          {error ??
            "Bạn có thể bật lại quyền camera trong cài đặt — hoặc tải ảnh có sẵn ngay tại đây."}
        </p>
        <div className="mt-5 flex flex-col items-stretch gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="h-12 rounded-full bg-white px-6 text-[14px] font-semibold text-foreground transition-opacity hover:opacity-90"
          >
            Thử lại camera
          </button>
          <button
            type="button"
            onClick={onUseGallery}
            className="flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-semibold text-white"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.22)",
            }}
          >
            <ImagePlus className="size-4" />
            Tải ảnh có sẵn
          </button>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-white/55">
          <Sparkles className="size-3" />
          Privacy-first · Camera chạy local trên trình duyệt
        </p>
      </motion.div>
    </motion.div>
  );
}
