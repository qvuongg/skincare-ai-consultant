import type { Metadata } from "next";

import { HomeClient } from "./home-client";

// Page-level metadata override. The root layout already sets a base title +
// description from the i18n bundle; this narrows it for the homepage with
// social-share fields tuned for the Gen Z VN positioning.
export const metadata: Metadata = {
  title: "Casa Mika · Soi da bằng AI, routine cá nhân hóa trong 60 giây",
  description:
    "Phân tích AI 468 điểm mốc trên khuôn mặt. Routine tinh gọn — chỉ giữ những bước da bạn thực sự cần. Adaptive theo UV & độ ẩm Đà Nẵng. Miễn phí, dưới 60 giây.",
  keywords: [
    "soi da AI",
    "phân tích da",
    "skincare routine",
    "AI da liễu",
    "Casa Mika",
    "Mika",
  ],
  openGraph: {
    title: "Casa Mika · Soi da bằng AI",
    description:
      "Quét 468 điểm mốc, phát hiện vấn đề tiềm ẩn dưới da, gợi ý routine tinh gọn cá nhân hoá. Miễn phí, không cần app.",
    type: "website",
    locale: "vi_VN",
    siteName: "Casa Mika",
  },
  twitter: {
    card: "summary_large_image",
    title: "Casa Mika · Soi da bằng AI",
    description:
      "Routine cá nhân hóa trong 60 giây — miễn phí, không cài app.",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
