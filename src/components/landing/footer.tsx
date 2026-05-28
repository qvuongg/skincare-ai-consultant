"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { GLASS, GPU, SPRING } from "./landing-tokens";

type ColumnLink = { label: string; href: string };
type Column = { title: string; links: ColumnLink[] };

const COLUMNS: Column[] = [
  {
    title: "Sản phẩm",
    links: [
      { label: "Soi da AI", href: "/onboarding" },
      { label: "Routine cá nhân hóa", href: "/onboarding" },
      { label: "Theo dõi tiến trình", href: "/onboarding" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Câu hỏi thường gặp", href: "#faq" },
      { label: "Hướng dẫn quét", href: "/onboarding" },
      { label: "Liên hệ team", href: "mailto:hi@mikacasa.com" },
    ],
  },
  {
    title: "Pháp lý",
    links: [
      { label: "Chính sách bảo mật", href: "#" },
      { label: "Điều khoản sử dụng", href: "#" },
      { label: "Quy định cookie", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={SPRING}
        className="mx-auto max-w-7xl rounded-[2rem] p-8 sm:p-10"
        style={{ ...GLASS, ...GPU }}
      >
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 items-center justify-center text-white"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(59,130,246,0.95))",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.55)",
                  boxShadow:
                    "0 8px 18px rgba(168,85,247,0.30), inset 0 1px 0 rgba(255,255,255,0.65)",
                }}
              >
                <Sparkles className="size-5" strokeWidth={2.4} />
              </span>
              <span className="text-[16px] font-semibold tracking-tight text-foreground">
                Mika Casa
              </span>
            </div>
            <p className="mt-4 max-w-[34ch] text-[13.5px] leading-relaxed text-foreground/65">
              Soi da bằng AI, routine cá nhân hóa, đúng ngân sách. Mika nói
              thật về làn da của bạn — không upsell, không lòng vòng.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <FooterColumn key={col.title} column={col} />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-foreground/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-foreground/55">
            © {new Date().getFullYear()} Mika Casa · Làm tại Đà Nẵng với
            cà phê và lòng tin vào làn da bạn.
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/45">
            v1.0 · beta
          </p>
        </div>
      </motion.div>
    </footer>
  );
}

function FooterColumn({ column }: { column: Column }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
        {column.title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {column.links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-[13.5px] font-medium text-foreground/75 transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
