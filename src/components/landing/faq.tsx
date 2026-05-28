"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

import { GLASS, GLASS_LIGHT, GPU, SPRING, fadeUp, stagger } from "./landing-tokens";

type FaqItem = {
  q: string;
  a: string;
};

const FAQS: FaqItem[] = [
  {
    q: "Mika có lưu ảnh khuôn mặt của tôi không?",
    a: "Không. Ảnh chỉ tồn tại trong phiên xử lý ngay tại thời điểm bạn quét — phân tích xong là Mika dọn sạch. Báo cáo chỉ lưu các con số chỉ số, không lưu hình.",
  },
  {
    q: "AI có chính xác không? Có thay được bác sĩ da liễu không?",
    a: "Mika đo lường khách quan các đặc điểm bề mặt da với độ chính xác cao, nhưng KHÔNG phải bác sĩ. Nếu bạn có vấn đề da nghiêm trọng (mụn viêm nặng, viêm da, dị ứng) — hãy đi khám. Mika tốt nhất ở vai trò: gợi ý routine hằng ngày + theo dõi tiến trình.",
  },
  {
    q: "Tôi chưa có routine nào, bắt đầu được không?",
    a: "Được. Đa số người dùng Mika bắt đầu từ con số 0 — bạn chỉ cần điền độ tuổi, ngân sách và môi trường sống. Mika sẽ đề xuất 3–5 sản phẩm cốt lõi đúng cho da bạn, không bắt mua hết.",
  },
  {
    q: "Dưới 18 tuổi có dùng được không?",
    a: "Nếu bạn 13–17 tuổi, hãy hỏi ý kiến phụ huynh trước. Mika có chế độ thiếu niên với các đề xuất nhẹ hơn (sữa rửa mặt + dưỡng ẩm + SPF), tránh hoạt chất mạnh như AHA/BHA nồng độ cao hay retinol.",
  },
  {
    q: "Có cần mua sản phẩm của Mika không?",
    a: "Không có. Mika không sản xuất mỹ phẩm. Mọi đề xuất là sản phẩm có sẵn trên thị trường, kèm link tham khảo. Mika không nhận hoa hồng theo cách lừa bạn — bạn được biết rõ link nào có affiliate, link nào không.",
  },
  {
    q: "Nên quét lại bao lâu một lần?",
    a: "Khuyến nghị 2–4 tuần / lần. Đủ thời gian cho hoạt chất phát huy mà chưa quá dài để bạn quên context cũ. Mika tự overlay tiến trình giữa hai lần quét để bạn thấy rõ chỉ số nào đang cải thiện.",
  },
];

export function Faq() {
  const [openId, setOpenId] = useState<number | null>(0);

  return (
    <section className="px-6 py-20 lg:py-28">
      <WarmPanel>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="relative mx-auto max-w-3xl"
        >
          <motion.div variants={fadeUp} className="mb-10 text-center">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/65"
              style={GLASS_LIGHT}
            >
              <span className="size-1.5 rounded-full bg-orange-500" />
              Trả lời thẳng
            </span>
            <h2 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]">
              Câu hỏi thường gặp.
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-pretty text-[15px] leading-relaxed text-foreground/65 sm:text-[16px]">
              Vẫn còn thắc mắc? Nhắn cho team Mika qua trang Hỗ trợ — thường
              được trả lời trong 24h.
            </p>
          </motion.div>

          <motion.ul variants={fadeUp} className="space-y-3">
            {FAQS.map((item, idx) => (
              <FaqRow
                key={idx}
                item={item}
                open={openId === idx}
                onToggle={() => setOpenId(openId === idx ? null : idx)}
              />
            ))}
          </motion.ul>
        </motion.div>
      </WarmPanel>
    </section>
  );
}

// Warm cream/peach backdrop panel — breaks the all-white-glass rhythm of
// the page. Plays the inverse role of ProcessTimeline's DarkPanel.
function WarmPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-[2.5rem] px-6 py-16 sm:px-10 lg:px-16 lg:py-24"
      style={{
        background:
          "linear-gradient(180deg, #fff7ed 0%, #fef3c7 50%, #fce7f3 100%)",
        boxShadow:
          "0 40px 80px rgba(251,146,60,0.10), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 0 0 1px rgba(255,255,255,0.6)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[5%] -top-[10%] size-[45%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(251,146,60,0.30), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[15%] right-[5%] size-[50%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(244,114,182,0.25), transparent 65%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      className="overflow-hidden rounded-2xl"
      style={{ ...GLASS, ...GPU }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
      >
        <span className="text-[15px] font-semibold tracking-tight text-foreground sm:text-[16px]">
          {item.q}
        </span>
        <motion.span
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground/70"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={SPRING}
        >
          <Plus className="size-4" strokeWidth={2.6} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ...SPRING, stiffness: 140 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-[14px] leading-relaxed text-foreground/70 sm:px-6 sm:pb-6">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
