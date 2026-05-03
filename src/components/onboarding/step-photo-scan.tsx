"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  CameraOff,
  Check,
  ImagePlus,
  ScanFace,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (file: File) => void;
};

type Phase =
  | "permission"
  | "requesting"
  | "denied"
  | "streaming"
  | "captured";

type Instruction = {
  text: string;
  emoji?: string;
};

// Cycled while the laser is sweeping. Each step holds for ~SCAN_STEP_MS so the
// labor-illusion feels like real biometric work, not random copy.
const INSTRUCTIONS: Instruction[] = [
  { text: "Nhìn thẳng vào ống kính…", emoji: "👀" },
  { text: "Nghiêng mặt sang trái một chút…", emoji: "↩️" },
  { text: "Nghiêng mặt sang phải nào…", emoji: "↪️" },
  { text: "Đủ ánh sáng rồi, giữ nguyên nhé!", emoji: "✨" },
];

const LABOR_PHRASES = [
  "Measuring humidity…",
  "Detecting T-zone…",
  "Checking pigmentation…",
  "Scanning pore density…",
  "Mapping micro-textures…",
  "Calibrating color tone…",
];

const SCAN_STEP_MS = 1700; // per instruction
const SCAN_TOTAL_MS = SCAN_STEP_MS * INSTRUCTIONS.length;
const LOW_LIGHT_THRESHOLD = 70; // 0..255 average gray
const LOW_LIGHT_SAMPLE_INTERVAL_MS = 700;

export function StepPhotoScan({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const samplerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [phase, setPhase] = useState<Phase>("permission");
  const [error, setError] = useState<string | null>(null);
  const [instructionIdx, setInstructionIdx] = useState(0);
  const [laborIdx, setLaborIdx] = useState(0);
  const [lowLight, setLowLight] = useState(false);
  const [shutter, setShutter] = useState(false);

  // Hard-stop the camera the moment we're done with it (unmount, denial,
  // capture). Keeping the stream alive shows the indicator dot and drains
  // battery — both bad for an onboarding step the user just left.
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
        // iOS Safari needs an explicit play() after srcObject assignment.
        await videoRef.current.play().catch(() => {});
      }
      setPhase("streaming");
      setInstructionIdx(0);
    } catch {
      setError(
        "Mika không truy cập được camera 😢 — bạn có thể tải ảnh có sẵn nhé."
      );
      setPhase("denied");
    }
  }, []);

  // ─── Frame capture ──────────────────────────────────────────────────────
  // Snapshots the current video frame, un-mirrors it (we mirror the preview
  // for natural selfie feel but want the stored image oriented as the camera
  // sees it), and hands the resulting File to the parent's existing pipeline.
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
        // Stop the stream right before handing off — the parent will navigate
        // to the analysis screen and we don't want the camera light lingering.
        stopStream();
        onCapture(file);
      },
      "image/jpeg",
      0.95
    );
  }, [onCapture, stopStream]);

  // ─── Cycle scan instructions while streaming ─────────────────────────────
  useEffect(() => {
    if (phase !== "streaming") return;
    const tick = setInterval(() => {
      setInstructionIdx((i) => Math.min(i + 1, INSTRUCTIONS.length - 1));
    }, SCAN_STEP_MS);

    const finish = setTimeout(() => {
      setPhase("captured");
      // Brief checkmark moment, then shutter + capture.
      setTimeout(() => {
        setShutter(true);
        setTimeout(() => {
          captureNow();
        }, 220);
      }, 650);
    }, SCAN_TOTAL_MS);

    return () => {
      clearInterval(tick);
      clearTimeout(finish);
    };
  }, [phase, captureNow]);

  // ─── Cycle labor-illusion phrases ────────────────────────────────────────
  useEffect(() => {
    if (phase !== "streaming" && phase !== "captured") return;
    const tick = setInterval(() => {
      setLaborIdx((i) => (i + 1) % LABOR_PHRASES.length);
    }, 1100);
    return () => clearInterval(tick);
  }, [phase]);

  // ─── Low-light sampler ───────────────────────────────────────────────────
  // Samples a 32×32 thumbnail of the live video every ~700ms and computes
  // average luma. If too dark, we whiten the glass overlay so the user's
  // screen acts as a fill light — borrowed from iOS True Tone selfie tricks.
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
        // Some browsers throw on tainted canvases — bail silently.
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

  const isStreaming = phase === "streaming" || phase === "captured";
  const captured = phase === "captured";

  return (
    <div className="flex flex-1 flex-col">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
          <span className="size-1.5 rounded-full bg-foreground/70" />
          Bước 09 · Photo Scan
        </span>
        <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
          {isStreaming
            ? "Mika đang đọc làn da bạn…"
            : "Check-var làn da thực tế nào!"}
        </h1>
        <p className="text-[14px] leading-relaxed text-foreground/65">
          {isStreaming
            ? "Giữ điện thoại cách mặt ~25cm, nhìn theo hướng dẫn nha."
            : "Cho phép camera để Mika scan trực tiếp — chính xác hơn nhiều so với ảnh có sẵn."}
        </p>
      </header>

      {/* ── Permission / denied dialog ──────────────────────────────── */}
      {(phase === "permission" ||
        phase === "requesting" ||
        phase === "denied") && (
        <PermissionDialog
          phase={phase}
          error={error}
          onAllow={requestCamera}
          onUseGallery={() => galleryInputRef.current?.click()}
        />
      )}

      {/* ── Camera Squircle frame ───────────────────────────────────── */}
      {isStreaming && (
        <div className="mt-6 flex flex-col items-center">
          <CameraSquircle
            videoRef={videoRef}
            instruction={INSTRUCTIONS[instructionIdx]}
            laborPhrase={LABOR_PHRASES[laborIdx]}
            captured={captured}
            lowLight={lowLight}
            shutter={shutter}
          />

          <div className="mt-5 min-h-[60px] w-full text-center">
            <AnimatePresence mode="wait">
              {captured ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 18,
                  }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className="flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/85 px-3.5 py-1.5 text-[13px] font-semibold text-emerald-700 backdrop-blur">
                    <Check className="size-4" strokeWidth={3} />
                    Scan hoàn tất, giữ nguyên 1s nha!
                  </span>
                  <p className="text-[11px] text-foreground/45">
                    Ảnh sẽ tự chụp & chuyển sang phân tích.
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  key={instructionIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-center gap-2 text-[15px] font-semibold tracking-tight text-foreground"
                >
                  <span aria-hidden>{INSTRUCTIONS[instructionIdx].emoji}</span>
                  {INSTRUCTIONS[instructionIdx].text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Hidden gallery input — shared by permission dialog AND footer pill */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleGalleryFile(e.target.files?.[0])}
      />

      {/* Floating glass pill — gallery fallback, always available */}
      {phase !== "captured" && (
        <div className="mt-auto flex flex-col items-center gap-2 pt-6">
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-3 text-[13px] font-semibold text-foreground/80 transition-colors active:scale-[0.97]"
            style={{
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow:
                "0 12px 28px rgba(31,38,135,0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            <ImagePlus className="size-4" />
            Tải ảnh có sẵn
          </button>
          <p className="text-[10px] text-foreground/40">
            <Camera className="mr-1 inline size-3" />
            Ảnh được resize 2K, nén JPEG q=0.9 trước khi gửi.
          </p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Permission dialog — Liquid Glass surface with friendly Vietnamese copy
// ════════════════════════════════════════════════════════════════════════
function PermissionDialog({
  phase,
  error,
  onAllow,
  onUseGallery,
}: {
  phase: Phase;
  error: string | null;
  onAllow: () => void;
  onUseGallery: () => void;
}) {
  const denied = phase === "denied";
  const requesting = phase === "requesting";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="relative mt-8 overflow-hidden p-6 sm:p-7"
      style={{
        borderRadius: "2rem",
        background:
          "linear-gradient(135deg, rgba(168,85,247,0.16), rgba(255,255,255,0.65) 60%)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow:
          "0 24px 60px rgba(168,85,247,0.18), inset 0 1px 0 rgba(255,255,255,0.95)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
        }}
      />

      <div className="flex flex-col items-center text-center">
        <motion.span
          initial={{ scale: 0.85, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 16 }}
          className="flex size-16 items-center justify-center rounded-3xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.22), rgba(59,130,246,0.18))",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.85), 0 12px 28px rgba(168,85,247,0.25)",
          }}
        >
          {denied ? (
            <CameraOff className="size-7 text-foreground/70" />
          ) : (
            <ScanFace className="size-7 text-purple-700" strokeWidth={2.2} />
          )}
        </motion.span>

        <h2 className="mt-4 text-balance text-[20px] font-semibold tracking-tight text-foreground">
          {denied
            ? "Mika chưa được phép xem camera"
            : "Cho phép Mika nhìn ngắm làn da bạn nhé?"}
        </h2>
        <p className="mt-1.5 max-w-[320px] text-[13px] leading-relaxed text-foreground/65">
          {denied
            ? "Bạn có thể bật lại quyền camera trong cài đặt trình duyệt — hoặc tải ảnh có sẵn ngay tại đây."
            : "Camera chỉ chạy ngay trên máy bạn — Mika không lưu video, chỉ chụp 1 ảnh selfie để phân tích."}
        </p>

        {error && (
          <p className="mt-3 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-3 py-2 text-[12px] text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:justify-center">
          {!denied && (
            <button
              type="button"
              onClick={onAllow}
              disabled={requesting}
              className="h-12 rounded-full bg-foreground px-6 text-[14px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {requesting ? "Đang kết nối camera…" : "Cho phép camera"}
            </button>
          )}
          <button
            type="button"
            onClick={onUseGallery}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/65 bg-white/55 px-6 text-[14px] font-semibold text-foreground/80 backdrop-blur"
          >
            <ImagePlus className="size-4" />
            Tải ảnh có sẵn
          </button>
        </div>

        <p className="mt-4 flex items-center gap-1 text-[11px] text-foreground/45">
          <Sparkles className="size-3" />
          Privacy-first · Camera chạy local trên trình duyệt
        </p>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Camera Squircle — live video + Iris glow + oval guide + laser scan +
// labor-illusion edge text + low-light screen-flash + shutter overlay
// ════════════════════════════════════════════════════════════════════════
function CameraSquircle({
  videoRef,
  instruction,
  laborPhrase,
  captured,
  lowLight,
  shutter,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  instruction: Instruction;
  laborPhrase: string;
  captured: boolean;
  lowLight: boolean;
  shutter: boolean;
}) {
  // Used for the cycling labor-illusion phrase along the bottom edge.
  void instruction;

  return (
    <div className="relative w-full max-w-[360px]">
      {/* Iris glow rings — slow concentric pulse around the squircle */}
      <div className="pointer-events-none absolute -inset-4">
        {[0, 0.9, 1.8].map((delay, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute inset-0"
            style={{
              borderRadius: "2.4rem",
              background: captured
                ? "radial-gradient(circle, rgba(34,197,94,0.32), rgba(59,130,246,0.20) 55%, transparent 75%)"
                : "radial-gradient(circle, rgba(168,85,247,0.32), rgba(59,130,246,0.22) 55%, transparent 75%)",
            }}
            animate={{
              scale: [0.96, 1.06, 0.96],
              opacity: [0.0, 0.55, 0.0],
            }}
            transition={{
              duration: 2.6,
              delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{
          borderRadius: "2rem",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: captured
            ? "0 28px 60px rgba(34,197,94,0.30), 0 0 0 2px rgba(34,197,94,0.55), inset 0 1px 0 rgba(255,255,255,0.6)"
            : "0 28px 60px rgba(168,85,247,0.28), 0 0 0 2px rgba(168,85,247,0.55), inset 0 1px 0 rgba(255,255,255,0.6)",
          background: "rgba(0,0,0,0.85)",
        }}
      >
        {/* Live video — mirrored for natural selfie feel */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 size-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Low-light screen-flash overlay — whitens to bounce light onto face */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          animate={{
            backgroundColor: lowLight
              ? "rgba(255,255,255,0.28)"
              : "rgba(255,255,255,0)",
            backdropFilter: lowLight
              ? "brightness(1.15) saturate(110%)"
              : "brightness(1) saturate(100%)",
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Oval face-guide — FaceID-style */}
        <FaceGuide captured={captured} />

        {/* Laser scan bar — sweeps top↔bottom inside the oval area */}
        {!captured && <LaserScan />}

        {/* Labor-illusion edge phrases */}
        <LaborEdge phrase={laborPhrase} />

        {/* Specular highlight strip on top edge */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
          }}
        />

        {/* Low-light hint chip */}
        <AnimatePresence>
          {lowLight && !captured && (
            <motion.span
              key="lowlight"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-amber-100/85 px-3 py-1 text-[10px] font-semibold text-amber-800 backdrop-blur"
            >
              💡 Hơi tối — bật màn hình bù sáng cho bạn
            </motion.span>
          )}
        </AnimatePresence>

        {/* Center checkmark — pops on capture */}
        <AnimatePresence>
          {captured && (
            <motion.span
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 460,
                damping: 18,
              }}
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

        {/* Shutter flash — quick white wipe */}
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
      </div>
    </div>
  );
}

function FaceGuide({ captured }: { captured: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 size-full"
    >
      <defs>
        <linearGradient id="faceGuide" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor={captured ? "rgba(34,197,94,0.95)" : "rgba(168,85,247,0.85)"}
          />
          <stop
            offset="1"
            stopColor={captured ? "rgba(59,130,246,0.85)" : "rgba(59,130,246,0.85)"}
          />
        </linearGradient>
      </defs>
      <motion.ellipse
        cx="50"
        cy="50"
        rx="28"
        ry="36"
        fill="none"
        stroke="url(#faceGuide)"
        strokeWidth="0.8"
        strokeDasharray="4 3"
        animate={{
          strokeDashoffset: captured ? 0 : [0, -14],
          opacity: captured ? 1 : [0.55, 0.95, 0.55],
        }}
        transition={{
          strokeDashoffset: { duration: 4, repeat: Infinity, ease: "linear" },
          opacity: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      {/* Tick marks at 12/3/6/9 around the oval — adds a biometric vibe */}
      {[
        ["50", "12", "50", "16"],
        ["50", "84", "50", "88"],
        ["20.5", "48", "16.5", "48"],
        ["79.5", "48", "83.5", "48"],
      ].map((coords, i) => (
        <line
          key={i}
          x1={coords[0]}
          y1={coords[1]}
          x2={coords[2]}
          y2={coords[3]}
          stroke={captured ? "rgba(34,197,94,0.95)" : "rgba(168,85,247,0.85)"}
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function LaserScan() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-6 z-20 h-[3px] rounded-full"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(165,243,252,0.95), rgba(255,255,255,1), rgba(165,243,252,0.95), transparent)",
        boxShadow:
          "0 0 12px rgba(165,243,252,0.85), 0 0 28px rgba(125,211,252,0.55)",
        backdropFilter: "brightness(1.2)",
        WebkitBackdropFilter: "brightness(1.2)",
        top: "12%",
      }}
      animate={{ top: ["12%", "82%", "12%"] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function LaborEdge({ phrase }: { phrase: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={phrase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-full bg-black/45 px-2.5 py-1 font-mono text-[10px] tracking-wide text-cyan-200 backdrop-blur"
        >
          {phrase}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
