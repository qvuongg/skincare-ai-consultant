"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Share2, Sparkles, Home, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { MeshGradient } from "@/components/onboarding/mesh-gradient";
import { ScoreReport } from "@/components/report/score-report";
import type { ReportContext } from "@/components/report/insights";
import type { ScanReportPayload } from "@/components/report/types";
import { REPORT_SPRING } from "@/components/report/types";

type Props = {
  reportId: string;
  result: ScanReportPayload;
  ctx: ReportContext;
  skinType: string | null;
  createdAt?: string;
};

/**
 * Bulletproof copy helper that gracefully falls back to textarea + execCommand('copy')
 * if navigator.clipboard throws (e.g. Document not focused or restricted environment).
 */
async function copyToClipboardSafe(text: string): Promise<boolean> {
  // 1. Try modern Clipboard API if supported and document has focus
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText rejected, attempting fallback:", err);
    }
  }

  // 2. Hidden textarea fallback
  if (typeof document !== "undefined") {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "-9999px";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (success) return true;
    } catch (fallbackErr) {
      console.error("document.execCommand fallback copy failed:", fallbackErr);
    }
  }

  return false;
}

export function ReportClientShell({
  reportId,
  result,
  ctx,
  skinType,
  createdAt,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== "undefined" && window.location.href) {
      return window.location.href;
    }
    return `https://casamika.vn/report/${reportId}`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    const success = await copyToClipboardSafe(url);
    if (success) {
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    const title = `Báo cáo làn da (${result.overall_score}/100) của ${ctx.userName || "bạn"} - Mika AI`;
    const text = `Xem kết quả phân tích 11 chỉ số da và routine phác đồ cá nhân hóa của ${ctx.userName || "tôi"} tại Mika AI!`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.warn("navigator.share failed, fallback to copy:", err);
        } else {
          return; // User canceled share sheet, do not copy
        }
      }
    }

    // Fallback if Web Share is not supported or failed
    await handleCopyLink();
  };

  const handleShareZalo = () => {
    const url = getShareUrl();
    const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(url)}`;
    if (typeof window !== "undefined") {
      window.open(zaloUrl, "_blank", "noopener,noreferrer,width=600,height=550");
    }
  };

  const handleShareFacebook = () => {
    const url = getShareUrl();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (typeof window !== "undefined") {
      window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=550");
    }
  };

  const handleShareMessenger = () => {
    const url = getShareUrl();
    // Use messenger scheme on mobile, or web dialog on desktop
    const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(url)}`;
    if (typeof window !== "undefined") {
      window.open(messengerUrl, "_blank", "noopener,noreferrer,width=600,height=550");
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div className="relative min-h-dvh flex flex-col overflow-x-hidden">
      <MeshGradient />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-emerald-950 bg-emerald-100/95 border border-emerald-300 shadow-xl backdrop-blur-md"
          >
            <Check className="size-4 text-emerald-600" />
            Đã sao chép liên kết báo cáo vào bộ nhớ tạm!
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="relative z-10 mx-auto flex w-full max-w-[480px] flex-1 flex-col"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* Sticky Action Header */}
        <header className="sticky top-0 z-40 px-5 pt-3 pb-2.5 sm:px-6">
          <div
            className="flex items-center justify-between rounded-full border border-white/60 px-3.5 py-2 shadow-sm transition-all"
            style={{
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
            }}
          >
            {/* Logo / Brand */}
            <Link
              href="/"
              className="flex items-center gap-2 group transition-transform active:scale-95"
              title="Về trang chủ"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-sm">
                <Sparkles className="size-3.5" />
              </div>
              <span className="text-[13px] font-semibold tracking-tight text-foreground/80 group-hover:text-foreground">
                Mika AI
              </span>
            </Link>

            {/* Middle Badge (optional date) */}
            <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/5 text-[11px] font-medium text-foreground/60">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {formattedDate ? `Scan: ${formattedDate}` : "Báo cáo chính thức"}
            </div>

            {/* Right Share Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 hover:bg-white px-3 py-1 text-[12px] font-semibold text-foreground/85 shadow-sm transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Share2 className="size-3.5 text-foreground/65" />
                    <span>Chia sẻ</span>
                  </>
                )}
              </button>

              <Link
                href="/"
                className="flex size-7 items-center justify-center rounded-full border border-white/70 bg-white/50 hover:bg-white text-foreground/60 hover:text-foreground transition-all active:scale-95"
                title="Trang chủ"
              >
                <Home className="size-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className="flex flex-1 flex-col px-5 pt-3 sm:px-6"
          style={{
            paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
          }}
        >
          {/* Core Score Report */}
          <ScoreReport
            result={result}
            ctx={ctx}
            skinType={skinType}
            onRetry={() => router.push("/onboarding")}
          />

          {/* Dedicated Viral Share Section */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...REPORT_SPRING, delay: 0.38 }}
            className="mt-6 flex flex-col gap-3.5 rounded-[24px] border border-white/60 p-5 shadow-lg"
            style={{
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-700">
                  <Sparkles className="size-3" /> Chia sẻ kết quả
                </span>
                <h3 className="text-[16px] font-bold tracking-tight text-foreground mt-0.5">
                  Khoe điểm số & Gửi phác đồ cho bạn bè
                </h3>
                <p className="text-[12px] text-foreground/65 mt-1 leading-relaxed">
                  Báo cáo này được bảo lưu với đường dẫn riêng. Bạn có thể gửi cho bạn bè hoặc chuyên gia da liễu để tham khảo.
                </p>
              </div>
            </div>

            {/* Social Channels Row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Zalo Button */}
              <button
                type="button"
                onClick={handleShareZalo}
                className="flex items-center justify-center gap-1.5 h-11 rounded-xl border border-sky-300/40 bg-sky-50/80 hover:bg-sky-100/90 text-[12px] font-semibold text-sky-900 transition-all active:scale-95 shadow-sm"
              >
                <div className="flex size-5 items-center justify-center rounded-full bg-[#0068FF] text-white text-[10px] font-black">
                  Z
                </div>
                <span>Zalo</span>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={handleShareFacebook}
                className="flex items-center justify-center gap-1.5 h-11 rounded-xl border border-blue-300/40 bg-blue-50/80 hover:bg-blue-100/90 text-[12px] font-semibold text-blue-900 transition-all active:scale-95 shadow-sm"
              >
                <div className="flex size-5 items-center justify-center rounded-full bg-[#1877F2] text-white text-[11px] font-black">
                  f
                </div>
                <span>Facebook</span>
              </button>

              {/* Messenger Button */}
              <button
                type="button"
                onClick={handleShareMessenger}
                className="flex items-center justify-center gap-1.5 h-11 rounded-xl border border-purple-300/40 bg-purple-50/80 hover:bg-purple-100/90 text-[12px] font-semibold text-purple-900 transition-all active:scale-95 shadow-sm"
              >
                <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#00B2FF] to-[#006AFF] text-white text-[10px] font-bold">
                  💬
                </div>
                <span>Messenger</span>
              </button>
            </div>

            {/* Copy Link Big Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-foreground/15 bg-foreground text-background text-[13px] font-semibold shadow-md transition-all hover:bg-foreground/90 active:scale-98"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-400" />
                  <span>Đã sao chép liên kết báo cáo!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>Sao chép liên kết báo cáo</span>
                </>
              )}
            </button>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
