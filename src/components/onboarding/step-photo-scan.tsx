"use client";

import { motion } from "framer-motion";
import { Camera, ImagePlus, Lightbulb, ScanFace } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  onCapture: (file: File) => void;
};

export function StepPhotoScan({ onCapture }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File này không phải ảnh hợp lệ — chọn file ảnh nhé.");
      return;
    }
    setError(null);
    onCapture(file);
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
          <span className="size-1.5 rounded-full bg-foreground/70" />
          Bước 05 · Photo Scan
        </span>
        <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Check-var làn da thực tế nào!
        </h1>
        <p className="text-[14px] leading-relaxed text-foreground/65">
          Ảnh selfie sạch giúp Mika đọc đúng tình trạng — không filter, không
          beauty mode nha.
        </p>
      </header>

      <div className="mt-8 flex flex-1 flex-col items-center justify-center">
        <div className="relative flex size-[260px] items-center justify-center sm:size-[300px]">
          {[0, 0.7, 1.4].map((delay, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(168,85,247,0.35), rgba(59,130,246,0.25) 55%, transparent 75%)",
              }}
              animate={{
                scale: [0.9, 1.35, 0.9],
                opacity: [0.0, 0.55, 0.0],
              }}
              transition={{
                duration: 2.4,
                delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          <motion.span
            aria-hidden
            className="absolute inset-3 rounded-full"
            style={{
              border: "1px solid rgba(168,85,247,0.45)",
              boxShadow:
                "0 0 40px rgba(168,85,247,0.35), inset 0 0 30px rgba(255,255,255,0.5)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />

          <motion.button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 420, damping: 16 }}
            className="relative flex size-[180px] flex-col items-center justify-center gap-2 text-foreground"
            style={{
              borderRadius: "2.5rem",
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(255,255,255,0.65))",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow:
                "0 24px 60px rgba(168,85,247,0.30), 0 0 0 2px rgba(168,85,247,0.45), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
            aria-label="Chụp ảnh selfie"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
              }}
            />
            <span
              className="flex size-14 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(168,85,247,0.18)",
                color: "rgb(126,34,206)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              <ScanFace className="size-7" strokeWidth={2.2} />
            </span>
            <p className="text-[15px] font-semibold tracking-tight">
              Chụp selfie ngay
            </p>
            <p className="text-[11px] text-foreground/55">
              Tap để mở camera
            </p>
          </motion.button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="mt-6 flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-5 py-3 text-[13px] font-semibold text-foreground/75 backdrop-blur"
        >
          <ImagePlus className="size-4" />
          Tải ảnh có sẵn từ máy
        </button>
      </div>

      <div
        className="mt-6 flex items-start gap-3 p-4 text-[12px] leading-relaxed text-foreground/65"
        style={{
          borderRadius: "1.25rem",
          background: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.55)",
        }}
      >
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <ul className="space-y-1">
          <li>
            <span className="font-semibold text-foreground/80">Ánh sáng:</span>{" "}
            quay mặt về cửa sổ hoặc đèn trắng, tránh bóng gắt.
          </li>
          <li>
            <span className="font-semibold text-foreground/80">Mặt mộc:</span>{" "}
            tắt beauty mode, không trang điểm dày.
          </li>
          <li>
            <span className="font-semibold text-foreground/80">Khoảng cách:</span>{" "}
            cách camera ~25cm, nhìn thẳng ống kính.
          </li>
        </ul>
      </div>

      {error && (
        <p className="mt-3 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-[12px] text-red-600">
          {error}
        </p>
      )}

      <p className="mt-4 pb-2 text-center text-[11px] text-foreground/45">
        <Camera className="mr-1 inline size-3" />
        Ảnh được resize 2K, nén JPEG q=0.9 trước khi gửi.
      </p>
    </div>
  );
}
