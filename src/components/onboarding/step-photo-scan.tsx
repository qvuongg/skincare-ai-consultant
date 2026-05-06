"use client";

import { FaceLandmarker } from "@mediapipe/tasks-vision";
import { AnimatePresence, motion } from "framer-motion";
import { CameraOff, Check, ImagePlus, ScanFace, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useHeadPose } from "@/lib/mediapipe/use-head-pose";

type Props = {
  onCapture: (files: File[]) => void;
};

type Phase = "requesting" | "denied" | "streaming" | "done";

// Capture state machine: idle (camera not yet streaming) → front → left →
// right → done. Each pose-gated step waits for the user to hold the target
// pose (and pass lighting / distance gates) for STEP_HOLD_MS, then silently
// snapshots a frame and advances.
type CaptureStep = "idle" | "front" | "left" | "right" | "done";

const STEP_HOLD_MS: Record<"front" | "left" | "right", number> = {
  front: 700,
  left: 600,
  right: 600,
};

// `tooClose` must hold for this long before the warning shows — keeps a
// brief lean-in from popping the bar on/off every frame.
const TOO_CLOSE_HOLD_MS = 400;

const LOW_LIGHT_THRESHOLD = 70;
const LOW_LIGHT_SAMPLE_INTERVAL_MS = 700;

// Wireframe "scan locked" cue — when a capture lands, draw the mesh at
// boosted opacity for this window so the user feels the AI confirm the angle.
const FLASH_DURATION_MS = 320;

const STEP_COPY: Record<
  CaptureStep,
  { headline: string; status: string; emoji?: string }
> = {
  idle: { headline: "Mika đang khởi động camera…", status: "" },
  front: {
    headline: "Nhìn thẳng vào ống kính",
    status: "Đang lấy thông tin chính diện…",
    emoji: "👀",
  },
  left: {
    headline: "Quay mặt sang trái một chút",
    status: "Đang lấy thông tin góc trái…",
    emoji: "↩️",
  },
  right: {
    headline: "Giờ quay mặt sang phải nào",
    status: "Đang lấy thông tin góc phải…",
    emoji: "↪️",
  },
  done: {
    headline: "Scan hoàn tất ✨",
    status: "Đang chuyển sang phân tích…",
  },
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

  const [phase, setPhase] = useState<Phase>("requesting");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<CaptureStep>("idle");
  const [lowLight, setLowLight] = useState(false);
  const [tooCloseStable, setTooCloseStable] = useState(false);

  const { snapshot, landmarksRef } = useHeadPose(
    videoRef,
    phase === "streaming"
  );

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
      ok =
        snapshot.pose === "straight" && !lowLight && !tooCloseStable;
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
        flashUntilRef.current = performance.now() + FLASH_DURATION_MS;
        if (step === "front") setStep("left");
        else if (step === "left") setStep("right");
        else if (step === "right") {
          setStep("done");
          setPhase("done");
          stopStream();
          onCapture(filesRef.current);
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
  // Both branches go through setTimeout (the false branch with 0ms) so the
  // setState always runs async — keeps React Compiler / `set-state-in-effect`
  // happy. Same pattern as the legacy `useFallback` defer.
  useEffect(() => {
    const delay = snapshot.tooClose ? TOO_CLOSE_HOLD_MS : 0;
    const t = setTimeout(() => setTooCloseStable(snapshot.tooClose), delay);
    return () => clearTimeout(t);
  }, [snapshot.tooClose]);

  // ─── Wireframe canvas RAF ────────────────────────────────────────────
  // One Path2D per frame, single stroke — much cheaper than DrawingUtils
  // (which strokes per connector) on the ~2.5k connectors in the tesselation.
  // Keeps the 60fps target on mid-tier phones.
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
            ? "rgba(255, 90, 90, 0.92)"
            : "rgba(255, 0, 0, 0.40)";
          ctx.lineWidth = flash ? 3 : 1.4;
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
  const copy = STEP_COPY[step];

  // Top warning slot: only one warning at a time (image_9.png shows a single
  // bar). Distance is the higher-priority physical correction so it wins
  // over low-light, which is just a soft hint.
  const topWarning: "tooClose" | "lowLight" | null = tooCloseStable
    ? "tooClose"
    : lowLight && !finished
      ? "lowLight"
      : null;

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
      {/* ── Layer 0 · Live video ───────────────────────────────────────── */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 size-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* ── Layer 1 · Red 3D wireframe ─────────────────────────────────── */}
      {/* Canvas mirrors the video the same way (scaleX(-1)) so MediaPipe's */}
      {/* raw normalized landmarks land on the displayed (mirrored) face   */}
      {/* without flipping coordinates manually. Both share object-cover so */}
      {/* the same crop applies to landmarks and pixels.                   */}
      <canvas
        ref={wireframeCanvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 size-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* ── Layer 2 · Top "too close" warning bar ──────────────────────── */}
      <AnimatePresence>
        {topWarning === "tooClose" && (
          <motion.div
            key="tooclose"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 24,
              mass: 0.85,
            }}
            className="absolute left-1/2 z-[24] -translate-x-1/2 rounded-full px-4 py-2 text-center text-[12px] font-semibold tracking-tight text-white"
            style={{
              top: "calc(env(safe-area-inset-top) + 24px)",
              background: "rgba(220,38,38,0.92)",
              boxShadow:
                "0 0 24px rgba(220,38,38,0.85), 0 0 56px rgba(220,38,38,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            You are too close to your smartphone
          </motion.div>
        )}
        {topWarning === "lowLight" && (
          <motion.div
            key="lowlight"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="absolute left-1/2 z-20 -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-amber-50"
            style={{
              top: "calc(env(safe-area-inset-top) + 24px)",
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

      {/* ── Layer 3 · Header glass title ───────────────────────────────── */}
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
              {requesting
                ? "Đang khởi động camera…"
                : finished
                  ? "Scan hoàn tất ✨"
                  : "Mika đang đọc làn da bạn…"}
            </h1>
          </motion.div>
        </div>
      )}

      {/* ── Layer 4 · Bottom instruction + silent status ───────────────── */}
      {!denied && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-5 sm:px-6"
          style={{
            paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
          }}
        >
          {phase === "streaming" && copy.status && (
            <AnimatePresence mode="wait">
              <motion.span
                key={`status-${step}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.9, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28 }}
                className="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide text-cyan-200"
                style={{
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {copy.status}
              </motion.span>
            </AnimatePresence>
          )}

          <div className="pointer-events-auto w-full max-w-[360px]">
            <AnimatePresence mode="wait">
              {finished ? (
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
                    Đã chụp đủ 3 góc, giữ nguyên 1s nha!
                  </span>
                  <p className="text-[11px] text-white/65">
                    Mika đang chuyển sang phân tích…
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
                  key={`instr-${step}`}
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
                  {copy.emoji && <span aria-hidden>{copy.emoji}</span>}
                  {copy.headline}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!finished && (
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

      {/* ── Layer 5 · Permission denied overlay ────────────────────────── */}
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
