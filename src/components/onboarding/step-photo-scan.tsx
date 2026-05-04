"use client";

import { AnimatePresence, motion, useTransform } from "framer-motion";
import {
  CameraOff,
  Check,
  ImagePlus,
  ScanFace,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  LEFT_THRESHOLD,
  RIGHT_THRESHOLD,
  STRAIGHT_HI,
  STRAIGHT_LO,
  useHeadPose,
} from "@/lib/mediapipe/use-head-pose";

type Props = {
  onCapture: (file: File) => void;
};

type Phase = "requesting" | "denied" | "streaming" | "captured";

// Sub-state inside `streaming`. Drives both the active instruction and the
// progress-ring fill source. Sequence:
//   lighting → straight → left → right → final → (capture)
type SubPhase = "lighting" | "straight" | "left" | "right" | "final";

type Instruction = {
  text: string;
  emoji?: string;
};

const INSTRUCTIONS: Instruction[] = [
  { text: "Nhìn thẳng vào ống kính…", emoji: "👀" },
  { text: "Nghiêng mặt sang trái một chút…", emoji: "↩️" },
  { text: "Nghiêng mặt sang phải nào…", emoji: "↪️" },
  { text: "Đủ ánh sáng rồi, giữ nguyên nhé!", emoji: "✨" },
];

// Map each sub-phase to the index of the instruction we want to display.
// `lighting` and `straight` share index 0 — the lighting check gates entry
// to the straight-pose check, but the user-facing copy is identical.
const SUB_PHASE_TO_INSTRUCTION: Record<SubPhase, number> = {
  lighting: 0,
  straight: 0,
  left: 1,
  right: 2,
  final: 3,
};

const LABOR_PHRASES = [
  "Measuring humidity…",
  "Detecting T-zone…",
  "Checking pigmentation…",
  "Scanning pore density…",
  "Mapping micro-textures…",
  "Calibrating color tone…",
];

const SCAN_STEP_MS = 1700;
const SCAN_TOTAL_MS = SCAN_STEP_MS * INSTRUCTIONS.length;
const LOW_LIGHT_THRESHOLD = 70;
const LOW_LIGHT_SAMPLE_INTERVAL_MS = 700;

// Hold-times to debounce pose transitions — a brief flicker into the right
// pose shouldn't fire a transition.
const LIGHTING_OK_HOLD_MS = 800;
const STRAIGHT_HOLD_MS = 700;

// If MediaPipe hasn't loaded by then, OR the user can't pass the lighting/
// straight gates within this window, drop to the timer-driven fallback flow.
// Without this the state machine can stall forever if the CDN is slow, the
// model 404s, or the user covers the camera.
const AI_STALL_TIMEOUT_MS = 6000;

// SVG mask: blur+darken everywhere EXCEPT the central rounded scan zone.
const SCAN_VIGNETTE_MASK =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><defs><mask id='m'><rect width='100' height='100' fill='white'/><rect x='10' y='18' width='80' height='64' rx='12' ry='12' fill='black'/></mask></defs><rect width='100' height='100' fill='white' mask='url(%23m)'/></svg>\")";

export function StepPhotoScan({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const samplerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const requestedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("requesting");
  const [error, setError] = useState<string | null>(null);
  const [subPhase, setSubPhase] = useState<SubPhase>("lighting");
  const [fallbackIdx, setFallbackIdx] = useState(0);
  const [useFallback, setUseFallback] = useState(false);
  const [laborIdx, setLaborIdx] = useState(0);
  const [lowLight, setLowLight] = useState(false);
  const [shutter, setShutter] = useState(false);

  // ─── Head-pose tracking (MediaPipe Face Landmarker) ──────────────────
  // Active only while the camera is streaming AND we haven't fallen back
  // to the timer-driven flow. The hook lazy-loads the WASM/model on first
  // call and is RAF-driven.
  const { ratio, snapshot } = useHeadPose(
    videoRef,
    phase === "streaming" && !useFallback
  );

  // Hard-stop the camera when we're done with it.
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
      setPhase("streaming");
      setSubPhase("lighting");
      setFallbackIdx(0);
      setUseFallback(false);
    } catch {
      setError(
        "Mika không truy cập được camera 😢 — bạn có thể tải ảnh có sẵn nhé."
      );
      setPhase("denied");
    }
  }, []);

  // Auto-request camera on mount.
  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    void requestCamera();
  }, [requestCamera]);

  const captureNow = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopStream();
        onCapture(file);
      },
      "image/jpeg",
      0.95
    );
  }, [onCapture, stopStream]);

  // ─── AI state machine (pose-driven) ──────────────────────────────────
  // Each branch sets a hold-timer that auto-cancels via the effect cleanup
  // when the dependency it's gated on flips. Reaching `final` triggers the
  // capture effect below.
  useEffect(() => {
    if (phase !== "streaming" || useFallback) return;

    if (subPhase === "lighting" && !lowLight) {
      const t = setTimeout(() => setSubPhase("straight"), LIGHTING_OK_HOLD_MS);
      return () => clearTimeout(t);
    }
    if (subPhase === "straight" && snapshot.pose === "straight") {
      const t = setTimeout(() => setSubPhase("left"), STRAIGHT_HOLD_MS);
      return () => clearTimeout(t);
    }
    if (subPhase === "left" && snapshot.pose === "left") {
      // Hold briefly so a single noisy frame near the threshold doesn't
      // pop us forward — and so the progress ring visibly hits 100% before
      // we move on.
      const t = setTimeout(() => setSubPhase("right"), 250);
      return () => clearTimeout(t);
    }
    if (subPhase === "right" && snapshot.pose === "right") {
      const t = setTimeout(() => setSubPhase("final"), 250);
      return () => clearTimeout(t);
    }
  }, [phase, useFallback, subPhase, snapshot.pose, lowLight]);

  // ─── Fallback gate ───────────────────────────────────────────────────
  // If MediaPipe never loads (CDN down, model 404, GPU rejected) OR the
  // user can't pass the lighting/straight gates within the window, drop
  // to the timer-driven flow so the scan completes anyway.
  useEffect(() => {
    if (phase !== "streaming" || useFallback) return;
    if (snapshot.loadError) {
      // Defer one tick so the setState happens from a callback, not the
      // effect body — keeps the React Compiler / lint rule happy.
      const tErr = setTimeout(() => setUseFallback(true), 0);
      return () => clearTimeout(tErr);
    }
    const t = setTimeout(() => {
      const stalledOnGate = subPhase === "lighting" || subPhase === "straight";
      if (!snapshot.ready || stalledOnGate) {
        setUseFallback(true);
      }
    }, AI_STALL_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [phase, useFallback, snapshot.ready, snapshot.loadError, subPhase]);

  // ─── Fallback timer cycle ────────────────────────────────────────────
  // Mirrors the old behavior: cycles instructions on a timer and triggers
  // capture at the end. Only runs when AI mode has bailed.
  useEffect(() => {
    if (phase !== "streaming" || !useFallback) return;
    const tick = setInterval(() => {
      setFallbackIdx((i) => Math.min(i + 1, INSTRUCTIONS.length - 1));
    }, SCAN_STEP_MS);
    const finish = setTimeout(() => {
      setSubPhase("final");
    }, SCAN_TOTAL_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(finish);
    };
  }, [phase, useFallback]);

  // ─── final → capture (shared by AI + fallback) ───────────────────────
  useEffect(() => {
    if (subPhase !== "final" || phase !== "streaming") return;
    // Defer the phase flip one tick so we're not calling setState in the
    // effect body (lint), then run the original 650ms checkmark + 220ms
    // shutter handoff.
    const t0 = setTimeout(() => setPhase("captured"), 0);
    const t1 = setTimeout(() => {
      setShutter(true);
      setTimeout(() => captureNow(), 220);
    }, 650);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, [subPhase, phase, captureNow]);

  // ─── Cycle labor-illusion phrases ────────────────────────────────────
  useEffect(() => {
    if (phase !== "streaming" && phase !== "captured") return;
    const tick = setInterval(() => {
      setLaborIdx((i) => (i + 1) % LABOR_PHRASES.length);
    }, 1100);
    return () => clearInterval(tick);
  }, [phase]);

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
    onCapture(file);
  };

  const captured = phase === "captured";
  const denied = phase === "denied";
  const requesting = phase === "requesting";

  // Resolve which instruction to display. In AI mode, derive from sub-phase;
  // in fallback, follow the timer counter.
  const displayInstructionIdx = useFallback
    ? fallbackIdx
    : SUB_PHASE_TO_INSTRUCTION[subPhase];

  // The "slow down" warning fires when MediaPipe sees fast movement OR when
  // the face is lost mid-pose-step. We hide it on lighting/final since those
  // gates don't depend on tracking the user's head.
  const isPoseGate = subPhase === "left" || subPhase === "right";
  const showSlowDown =
    !useFallback &&
    isPoseGate &&
    !captured &&
    (snapshot.tooFast || snapshot.pose === "lost");

  const TITLE_TOP = "calc(env(safe-area-inset-top) + 76px)";

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
      {/* ── Layer 0 · Live video (full-bleed base) ─────────────────────── */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 size-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* ── Layer 1 · Vignette (blur outside scan zone) ────────────────── */}
      {!denied && !requesting && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            backdropFilter: "blur(4px) brightness(0.8)",
            WebkitBackdropFilter: "blur(4px) brightness(0.8)",
            maskImage: SCAN_VIGNETTE_MASK,
            maskSize: "100% 100%",
            maskRepeat: "no-repeat",
            WebkitMaskImage: SCAN_VIGNETTE_MASK,
            WebkitMaskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
      )}

      {/* ── Layer 2 · Squircle border glow ─────────────────────────────── */}
      {!denied && !requesting && <SquircleGlow captured={captured} />}

      {/* ── Layer 3 · Head-turn progress ring (AI mode, pose gates) ────── */}
      {!denied && !requesting && !useFallback && isPoseGate && !captured && (
        <HeadTurnProgressRing ratio={ratio} subPhase={subPhase} />
      )}

      {/* ── Layer 4 · Full-height laser sweep ──────────────────────────── */}
      {!captured && !denied && !requesting && <FullHeightLaser />}

      {/* ── Layer 5 · Low-light screen-flash ───────────────────────────── */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[6]"
        animate={{
          backgroundColor: lowLight
            ? "rgba(255,255,255,0.18)"
            : "rgba(255,255,255,0)",
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* ── Layer 6 · Top floating glass title ─────────────────────────── */}
      {!denied && (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-5 sm:px-6"
          style={{ top: TITLE_TOP }}
        >
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.08,
              type: "spring",
              stiffness: 320,
              damping: 26,
            }}
            className="pointer-events-auto w-full max-w-[360px] rounded-[28px] px-4 py-3 text-center"
            style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow:
                "0 14px 40px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.30)",
            }}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Bước 09 · Photo Scan
            </span>
            <h1 className="mt-1 text-balance text-[17px] font-semibold leading-tight tracking-tight text-white">
              {captured
                ? "Scan hoàn tất ✨"
                : requesting
                  ? "Đang khởi động camera…"
                  : "Mika đang đọc làn da bạn…"}
            </h1>
          </motion.div>
        </div>
      )}

      {/* ── Layer 7 · Low-light hint chip ──────────────────────────────── */}
      <AnimatePresence>
        {lowLight && !captured && !denied && (
          <motion.div
            key="lowlight"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="absolute left-1/2 z-20 -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-amber-50"
            style={{
              top: "calc(env(safe-area-inset-top) + 168px)",
              background: "rgba(245,158,11,0.32)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.20)",
            }}
          >
            💡 Hơi tối — bật màn hình bù sáng cho bạn
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layer 8 · "Slow down" toast (AI pose-gate only) ────────────── */}
      <AnimatePresence>
        {showSlowDown && (
          <motion.div
            key="slowdown"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 24 }}
            className="absolute left-1/2 top-1/2 z-[22] -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-2 text-[13px] font-semibold text-white"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.40)",
            }}
          >
            🐢 Chậm lại một chút bạn ơi…
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layer 9 · Bottom instruction + capture controls ────────────── */}
      {!denied && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-5 sm:px-6"
          style={{
            paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
          }}
        >
          {!captured && !requesting && (
            <AnimatePresence mode="wait">
              <motion.span
                key={laborIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.85, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide text-cyan-200"
                style={{
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {LABOR_PHRASES[laborIdx]}
              </motion.span>
            </AnimatePresence>
          )}

          <div className="pointer-events-auto w-full max-w-[360px]">
            <AnimatePresence mode="wait">
              {captured ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 22,
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-[22px] px-4 py-3 text-center"
                  style={{
                    background: "rgba(34,197,94,0.18)",
                    backdropFilter: "blur(28px) saturate(180%)",
                    WebkitBackdropFilter: "blur(28px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    boxShadow:
                      "0 14px 36px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.30)",
                  }}
                >
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-emerald-50">
                    <Check className="size-4" strokeWidth={3} />
                    Scan hoàn tất, giữ nguyên 1s nha!
                  </span>
                  <p className="text-[11px] text-white/65">
                    Đang chuyển sang phân tích…
                  </p>
                </motion.div>
              ) : requesting ? (
                <motion.div
                  key="requesting"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-center gap-2 rounded-[22px] px-4 py-3 text-[13px] font-semibold tracking-tight text-white"
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
              ) : (
                <motion.div
                  key={`instr-${displayInstructionIdx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-center gap-2 rounded-[22px] px-4 py-3 text-[14px] font-semibold tracking-tight text-white"
                  style={{
                    background: "rgba(255,255,255,0.10)",
                    backdropFilter: "blur(28px) saturate(180%)",
                    WebkitBackdropFilter: "blur(28px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    boxShadow:
                      "0 14px 36px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.30)",
                  }}
                >
                  <span aria-hidden>
                    {INSTRUCTIONS[displayInstructionIdx].emoji}
                  </span>
                  {INSTRUCTIONS[displayInstructionIdx].text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!captured && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="pointer-events-auto flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold text-white transition-transform active:scale-[0.97]"
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

      {/* ── Layer 10 · Center checkmark on capture ─────────────────────── */}
      <AnimatePresence>
        {captured && (
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 460, damping: 18 }}
            className="absolute left-1/2 top-1/2 z-30 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white"
            style={{
              boxShadow:
                "0 16px 40px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            <Check className="size-10" strokeWidth={3.2} />
          </motion.span>
        )}
      </AnimatePresence>

      {/* ── Layer 11 · Shutter flash ───────────────────────────────────── */}
      <AnimatePresence>
        {shutter && (
          <motion.span
            key="shutter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-40 bg-white"
          />
        )}
      </AnimatePresence>

      {/* ── Layer 12 · Permission denied overlay ───────────────────────── */}
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
// Squircle border glow — three pulsing rings + a static crisp inner border.
// ════════════════════════════════════════════════════════════════════════
function SquircleGlow({ captured }: { captured: boolean }) {
  const tint = captured ? "34,197,94" : "165,243,252";
  const innerBorder = captured
    ? "rgba(34,197,94,0.95)"
    : "rgba(255,255,255,0.85)";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      {[0, 0.9, 1.8].map((delay, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="absolute"
          style={{
            width: "78%",
            height: "62%",
            maxWidth: "360px",
            maxHeight: "440px",
            borderRadius: "44px",
            border: `1.5px solid rgba(${tint},0.55)`,
            boxShadow: `0 0 0 1px rgba(${tint},0.18), 0 0 36px rgba(${tint},0.50), inset 0 0 28px rgba(${tint},0.16)`,
          }}
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.55, 0.95, 0.55],
          }}
          transition={{
            duration: 2.6,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div
        aria-hidden
        className="absolute"
        style={{
          width: "78%",
          height: "62%",
          maxWidth: "360px",
          maxHeight: "440px",
          borderRadius: "44px",
          border: `1.5px solid ${innerBorder}`,
          boxShadow: `inset 0 0 16px rgba(${tint},0.30)`,
        }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Head-turn progress ring — SVG circle around the squircle scan zone.
// Bound to the head-pose `ratio` motion value via `useTransform` so the
// stroke-dashoffset updates every animation frame WITHOUT triggering a
// React re-render. Only mounts during the `left` and `right` sub-phases.
// ════════════════════════════════════════════════════════════════════════
const RING_R = 168;
const RING_C = 2 * Math.PI * RING_R;

function HeadTurnProgressRing({
  ratio,
  subPhase,
}: {
  ratio: ReturnType<typeof useHeadPose>["ratio"];
  subPhase: SubPhase;
}) {
  // Map ratio to [0, 1] progress depending on which pose we're collecting.
  // `useTransform` reads the current `subPhase` from a closure — when
  // `subPhase` changes, this hook re-runs and rebuilds the transform with
  // the fresh closure, so the math stays in sync with the active gate.
  const dashOffset = useTransform(ratio, (r) => {
    if (Number.isNaN(r)) return RING_C;
    let p = 0;
    if (subPhase === "left") {
      p = (r - STRAIGHT_HI) / (LEFT_THRESHOLD - STRAIGHT_HI);
    } else if (subPhase === "right") {
      p = (STRAIGHT_LO - r) / (STRAIGHT_LO - RIGHT_THRESHOLD);
    }
    p = Math.max(0, Math.min(1, p));
    return RING_C * (1 - p);
  });

  // Tint the ring per direction so the user has a quick visual confirmation
  // they're turning the right way.
  const stroke =
    subPhase === "left"
      ? "rgba(165,243,252,0.95)"
      : "rgba(255,196,236,0.95)";
  const glowColor =
    subPhase === "left"
      ? "rgba(125,211,252,0.65)"
      : "rgba(244,114,182,0.55)";

  return (
    <motion.svg
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-[11] -translate-x-1/2 -translate-y-1/2"
      viewBox="0 0 400 400"
      style={{ width: "92%", height: "92%", maxWidth: "440px" }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Track */}
      <circle
        cx="200"
        cy="200"
        r={RING_R}
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="3"
      />
      {/* Progress */}
      <motion.circle
        cx="200"
        cy="200"
        r={RING_R}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={RING_C}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 200 200)"
        style={{
          filter: `drop-shadow(0 0 8px ${glowColor})`,
        }}
      />
    </motion.svg>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Full-height laser sweep
// ════════════════════════════════════════════════════════════════════════
function FullHeightLaser() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 z-[12] h-[3px]"
      style={{
        background:
          "linear-gradient(90deg, transparent 4%, rgba(165,243,252,0.95) 24%, rgba(255,255,255,1) 50%, rgba(165,243,252,0.95) 76%, transparent 96%)",
        boxShadow:
          "0 0 14px rgba(165,243,252,0.85), 0 0 32px rgba(125,211,252,0.55)",
      }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut" }}
    />
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
      className="absolute inset-0 z-30 flex items-center justify-center px-5"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(40px) saturate(160%)",
        WebkitBackdropFilter: "blur(40px) saturate(160%)",
      }}
    >
      <motion.div
        initial={{ y: 16, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-[360px] rounded-[28px] p-6 text-center"
        style={{
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
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
