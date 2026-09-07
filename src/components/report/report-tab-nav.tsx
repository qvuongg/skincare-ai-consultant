"use client";

import { motion } from "framer-motion";
import { Layers, Sparkles, Wind } from "lucide-react";

export type ReportTabId = "metrics" | "lifestyle" | "routine";

type Props = {
  activeTab: ReportTabId;
  onChange: (tab: ReportTabId) => void;
  potentialGain?: number;
};

export function ReportTabNav({ activeTab, onChange, potentialGain = 0 }: Props) {
  const tabs: {
    id: ReportTabId;
    label: string;
    sub: string;
    icon: typeof Layers;
    badge?: string;
    badgeTone?: "emerald" | "rose";
  }[] = [
    {
      id: "metrics",
      label: "9 Chỉ Số",
      sub: "Đo lường AI",
      icon: Layers,
    },
    {
      id: "lifestyle",
      label: "Lối Sống",
      sub: "Mô phỏng",
      icon: Wind,
      badge: potentialGain > 0 ? `+${potentialGain}đ` : undefined,
      badgeTone: "emerald",
    },
    {
      id: "routine",
      label: "Phác Đồ",
      sub: "Gợi ý Routine",
      icon: Sparkles,
      badge: "Cá nhân hóa",
      badgeTone: "rose",
    },
  ];

  return (
    <div className="sticky top-[60px] z-30 py-1.5 backdrop-blur-md">
      <div
        className="flex items-center rounded-2xl p-1 shadow-sm transition-all"
        style={{
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(28px) saturate(190%)",
          WebkitBackdropFilter: "blur(28px) saturate(190%)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          boxShadow:
            "0 10px 30px rgba(31, 38, 135, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className="relative flex-1 py-2.5 px-2 rounded-xl text-center select-none transition-colors active:scale-98"
            >
              {/* Active animated background pill */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.9))",
                    boxShadow:
                      "0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)",
                    border: "1px solid rgba(255, 255, 255, 0.9)",
                  }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`size-3.5 ${
                      isActive ? "text-foreground" : "text-foreground/50"
                    }`}
                  />
                  <span
                    className={`text-[13px] font-bold tracking-tight ${
                      isActive ? "text-foreground" : "text-foreground/60"
                    }`}
                  >
                    {tab.label}
                  </span>

                  {tab.badge && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold leading-tight ${
                        tab.badgeTone === "rose"
                          ? "bg-rose-500/15 text-rose-700 animate-pulse"
                          : "bg-emerald-500/15 text-emerald-700"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-medium leading-none ${
                    isActive ? "text-foreground/75" : "text-foreground/40"
                  }`}
                >
                  {tab.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
