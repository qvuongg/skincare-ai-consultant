"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Dumbbell,
  Droplets,
  Moon,
  Loader2,
  MapPin,
  Sun,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LiquidGlassSlider,
  type SliderVibe,
} from "@/components/onboarding/liquid-glass-slider";

export type LifestyleData = {
  location: string | null;
  uv_index: number | null;
  humidity: number | null;
  water_liters: number;
  sleep_hours: number;
  exercise_sessions: number;
};

function waterVibe(l: number): SliderVibe {
  if (l < 1) return { label: "Da đang khát nước, nạp thêm đi", emoji: "💦" };
  if (l < 1.5) return { label: "Tạm ổn, ráng thêm 1 chai nữa", emoji: "🥤" };
  if (l < 2.25) return { label: "Đủ chuẩn, da bouncy như jelly", emoji: "💧" };
  return { label: "Hydration goddess — chuẩn level pro", emoji: "🌊" };
}

function sleepVibe(h: number): SliderVibe {
  if (h < 6) return { label: "Cú đêm chính hiệu — da dễ xỉn", emoji: "🌙" };
  if (h < 7) return { label: "Hơi thiếu, mai cố ngủ sớm hơn nhé", emoji: "😴" };
  if (h < 8.5) return { label: "Vừa đẹp, glow tự nhiên", emoji: "🛏️" };
  return { label: "Sleeping beauty mode activated", emoji: "✨" };
}

function exerciseVibe(n: number): SliderVibe {
  if (n <= 0) return { label: "Đang tạm nghỉ ngơi", emoji: "🛋️" };
  if (n <= 3) return { label: "Có vận động nhẹ nhàng", emoji: "🚶" };
  if (n <= 5) return { label: "Rất năng suất!", emoji: "🏃‍♂️" };
  return { label: "Chiến thần thể thao", emoji: "🏋️‍♀️" };
}

type Props = {
  value: LifestyleData;
  onChange: (next: LifestyleData) => void;
  onNext: () => void;
};

const GEO_TIMEOUT_MS = 8000;

const DA_NANG_MOCK = {
  location: "Đà Nẵng, Việt Nam",
  uv_index: 11,
  humidity: 78,
};

function uvBadge(uv: number) {
  if (uv >= 11) return { label: "Cực điểm Tím", tone: "rgb(168, 85, 247)" };
  if (uv >= 8) return { label: "Rất cao Đỏ", tone: "rgb(239, 68, 68)" };
  if (uv >= 6) return { label: "Cao Cam", tone: "rgb(249, 115, 22)" };
  if (uv >= 3) return { label: "Vừa Vàng", tone: "rgb(234, 179, 8)" };
  return { label: "Thấp Xanh", tone: "rgb(34, 197, 94)" };
}

function skinMood(humidity: number) {
  if (humidity < 40) return "khát nước nha";
  if (humidity < 60) return "ổn định nhưng nên cấp ẩm thêm";
  if (humidity < 80) return "hơi bí, cần thoáng";
  return "bí bách & dễ đổ dầu";
}

export function StepLifestyle({ value, onChange, onNext }: Props) {
  // Track whether we ended up using the Đà Nẵng mock — drives the inline
  // "đang dùng dữ liệu mock" notice. Loading state is derived from `value`.
  const [usedFallback, setUsedFallback] = useState(false);
  const fetchedRef = useRef(false);

  const isReady = value.location !== null && value.uv_index !== null;
  const weatherState: "loading" | "ready" | "fallback" = !isReady
    ? "loading"
    : usedFallback
    ? "fallback"
    : "ready";

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Already-resolved (e.g. step revisit via Back) — nothing to fetch.
    if (value.location !== null && value.uv_index !== null) return;

    const controller = new AbortController();
    let cancelled = false;

    // Defined inside the effect but only invoked from async callbacks
    // (queueMicrotask, geolocation, fetch) — never sync from the effect body.
    const applyFallback = () => {
      if (cancelled) return;
      onChange({
        ...value,
        location: DA_NANG_MOCK.location,
        uv_index: DA_NANG_MOCK.uv_index,
        humidity: DA_NANG_MOCK.humidity,
      });
      setUsedFallback(true);
    };

    const hasGeo =
      typeof navigator !== "undefined" && "geolocation" in navigator;

    if (!hasGeo) {
      queueMicrotask(applyFallback);
    } else {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `/api/weather?lat=${latitude}&lon=${longitude}`,
              { signal: controller.signal }
            );
            if (!res.ok) throw new Error("weather");
            const json = (await res.json()) as {
              uv: number;
              humidity: number;
              city: string;
            };
            if (cancelled) return;
            onChange({
              ...value,
              location: json.city,
              uv_index: Math.round(json.uv),
              humidity: Math.round(json.humidity),
            });
          } catch {
            applyFallback();
          }
        },
        () => applyFallback(),
        {
          enableHighAccuracy: false,
          timeout: GEO_TIMEOUT_MS,
          maximumAge: 60_000,
        }
      );
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
    // Run once on mount; `value`/`onChange` would retrigger every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uv = value.uv_index;
  const humidity = value.humidity;
  const uvInfo = uv !== null ? uvBadge(uv) : null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur">
          <span className="size-1.5 rounded-full bg-foreground/70" />
          Bước 08 · Lifestyle
        </span>
        <h1 className="text-balance text-[28px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Check nhanh nhịp sống thường ngày…
        </h1>
        <p className="text-[14px] leading-relaxed text-foreground/65">
          Mika cần 4 tín hiệu sau để hiểu da bạn đang sống trong môi trường nào.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-5">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden p-5"
          style={{
            borderRadius: "1.75rem",
            background:
              "linear-gradient(135deg, rgba(255,200,150,0.18), rgba(255,255,255,0.55))",
            backdropFilter: "blur(30px) saturate(180%)",
            WebkitBackdropFilter: "blur(30px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow:
              "0 14px 36px rgba(31,38,135,0.10), inset 0 1px 0 rgba(255,255,255,0.85)",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
            }}
          />
          <div className="flex items-start gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/65 text-foreground/75"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}
            >
              <MapPin className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
                Vị trí & Thời tiết
              </p>
              {weatherState === "loading" && (
                <p className="mt-1 flex items-center gap-2 text-[14px] text-foreground/65">
                  <Loader2 className="size-3.5 animate-spin" />
                  Đang dò vị trí cho da bạn…
                </p>
              )}
              {(weatherState === "ready" || weatherState === "fallback") &&
                value.location && (
                  <p className="mt-1 text-[15px] font-medium leading-snug text-foreground">
                    Bạn đang ở{" "}
                    <span className="font-semibold">{value.location}</span>.
                    Chỉ số UV đang ở mức{" "}
                    <span
                      className="font-semibold"
                      style={{ color: uvInfo?.tone }}
                    >
                      {uvInfo?.label}
                    </span>
                    , da{" "}
                    <span className="font-semibold">
                      {humidity !== null ? skinMood(humidity) : "đang chờ data"}
                    </span>{" "}
                    đó!
                  </p>
                )}
              {weatherState === "fallback" && (
                <p className="mt-1 text-[11px] text-foreground/45">
                  Mika chưa truy cập được GPS — đang dùng dữ liệu mock của Đà
                  Nẵng.
                </p>
              )}
            </div>
          </div>

          {uv !== null && humidity !== null && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div
                className="flex items-center gap-2.5 rounded-2xl bg-white/55 px-3 py-2.5"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}
              >
                <Sun className="size-4 text-orange-500" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-wide text-foreground/55">
                    UV Index
                  </p>
                  <p className="text-[15px] font-semibold tabular-nums text-foreground">
                    {uv}
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-2.5 rounded-2xl bg-white/55 px-3 py-2.5"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}
              >
                <Droplets className="size-4 text-sky-500" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-wide text-foreground/55">
                    Độ ẩm
                  </p>
                  <p className="text-[15px] font-semibold tabular-nums text-foreground">
                    {humidity}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2.5"
        >
          <p className="px-1 text-[14px] font-semibold tracking-tight text-foreground">
            Hôm nay uống bao nhiêu lít nước?
          </p>
          <LiquidGlassSlider
            value={value.water_liters}
            onChange={(n) => onChange({ ...value, water_liters: n })}
            min={0}
            max={3}
            step={0.25}
            icon={Droplets}
            label="Lượng nước"
            display={`${value.water_liters.toFixed(2).replace(/\.?0+$/, "")} L`}
            fillFrom="rgba(125, 211, 252, 0.55)"
            fillTo="rgba(59, 130, 246, 0.65)"
            iconTint="rgba(186, 230, 253, 0.7)"
            vibe={waterVibe(value.water_liters)}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2.5"
        >
          <p className="px-1 text-[14px] font-semibold tracking-tight text-foreground">
            Số tiếng ngủ trung bình?
          </p>
          <LiquidGlassSlider
            value={value.sleep_hours}
            onChange={(n) => onChange({ ...value, sleep_hours: n })}
            min={4}
            max={12}
            step={0.5}
            icon={Moon}
            label="Giấc ngủ"
            display={`${value.sleep_hours.toFixed(1).replace(/\.0$/, "")} giờ`}
            fillFrom="rgba(196, 181, 253, 0.55)"
            fillTo="rgba(99, 102, 241, 0.65)"
            iconTint="rgba(221, 214, 254, 0.7)"
            vibe={sleepVibe(value.sleep_hours)}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2.5"
        >
          <p className="px-1 text-[14px] font-semibold tracking-tight text-foreground">
            Tần suất vận động (Buổi/tuần)
          </p>
          <LiquidGlassSlider
            value={value.exercise_sessions}
            onChange={(n) =>
              onChange({ ...value, exercise_sessions: Math.round(n) })
            }
            min={0}
            max={7}
            step={1}
            icon={Dumbbell}
            label="Vận động"
            display={
              value.exercise_sessions >= 7
                ? "7+ buổi"
                : `${value.exercise_sessions} buổi`
            }
            fillFrom="rgba(254, 215, 170, 0.55)"
            fillTo="rgba(244, 63, 94, 0.65)"
            iconTint="rgba(255, 228, 230, 0.75)"
            vibe={exerciseVibe(value.exercise_sessions)}
          />
        </motion.section>
      </div>

      <footer className="mt-auto flex flex-col gap-2 pt-8">
        <Button
          size="lg"
          onClick={onNext}
          className="h-14 w-full rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/85"
        >
          Tiếp tục <ArrowRight className="size-4" />
        </Button>
      </footer>
    </div>
  );
}
