# SkincareAI — Product Specification

> **Tài liệu kỹ thuật & sản phẩm v1.0** · Dev-Ready Spec
> Web app tư vấn da bằng AI, tối ưu cho **Gen Z Việt Nam (18–24)**.
> Nguồn: `SkincareAI_ProductSpec_v1.xlsx` · Cập nhật: 2026-05-04

| Hạng mục | Giá trị |
|---|---|
| **Target** | Gen Z VN (18–24) |
| **Platform** | Web App (Next.js, App Router) |
| **Version** | 1.0 |
| **Status** | Draft → Dev-Ready |
| **Trục giá trị** | Skin Scan AI · Cá nhân hóa Routine · Affiliate / Paywall |

---

## Mục lục

1. [Tổng quan & Mục tiêu phát triển](#1-tổng-quan--mục-tiêu-phát-triển)
2. [Liquid Glass UI — Ngôn ngữ thiết kế chủ đạo](#2-liquid-glass-ui--ngôn-ngữ-thiết-kế-chủ-đạo)
3. [Logic Tư vấn Da (Skin Advisory Engine)](#3-logic-tư-vấn-da-skin-advisory-engine)
4. [User Flow End-to-End](#4-user-flow-end-to-end)
5. [Onboarding — Bộ câu hỏi đầu vào](#5-onboarding--bộ-câu-hỏi-đầu-vào)
6. [Skin Scan — Capture & AI Vision](#6-skin-scan--capture--ai-vision)
7. [Scoring Logic — Quy đổi điểm 100](#7-scoring-logic--quy-đổi-điểm-100)
8. [Output Report — Cấu trúc Skin Health Report](#8-output-report--cấu-trúc-skin-health-report)
9. [Routine Design — Engine cá nhân hóa](#9-routine-design--engine-cá-nhân-hóa)
10. [Email Template & Nurture Sequence](#10-email-template--nurture-sequence)
11. [Monetization — Affiliate + Paywall](#11-monetization--affiliate--paywall)
12. [API Specification](#12-api-specification)
13. [Tech Stack & Implementation Notes](#13-tech-stack--implementation-notes)

---

## 1. Tổng quan & Mục tiêu phát triển

SkincareAI là một web app cho phép user **scan da bằng camera/ảnh upload**, sau đó AI Vision sẽ phân tích **9 vùng mặt × 11 chỉ số sinh lý da**, kết hợp với **dữ liệu lifestyle từ onboarding** để tạo ra:

1. **Skin Health Score** (0–100) — điểm tổng hợp có giải thích.
2. **Báo cáo 7 mục** với heatmap khuôn mặt, phân tích chi tiết và flag cảnh báo.
3. **Routine cá nhân hóa** (AM / PM / Weekly) gắn với link affiliate (Shopee, Lazada, Tiki).
4. **Email nurture** 5 chặng (D+0, D+3, D+7, D+14, D+30) để re-engage và up-sell.

### 1.1 Hai trục mục tiêu phát triển ưu tiên

| # | Mục tiêu | Vì sao quan trọng | Đo bằng |
|---|---|---|---|
| **A** | **Logic Tư vấn Da** chính xác, có giải thích (xAI) — *xem §3 và §7* | Đây là core IP. Nếu output sai/khó hiểu, user mất niềm tin → không click affiliate, không trả phí. | Confidence ≥ 0.7 cho 90% case · Test set ≥ 200 ảnh có ground-truth · Recall acne ≥ 0.8 |
| **B** | **Liquid Glass UI** premium, mượt 60fps trên mobile — *xem §2* | Định vị cao cấp giúp upsell paywall, tạo viral moment trên TikTok/IG, khác biệt hoàn toàn với app skincare phổ thông. | LCP < 2.0s · CLS < 0.05 · Animation 60fps · A/B test conversion vs flat UI |

> **Tradeoff đã chấp nhận:** Liquid Glass UI tốn GPU và đòi hỏi tối ưu kỹ (backdrop-filter, sub-pixel rendering). Trade-off này được chấp nhận để giữ định vị "premium" — nhưng phải có **fallback** cho thiết bị yếu (xem §2.4).

### 1.2 Phạm vi v1.0

✅ **Trong scope**
- Web app responsive (mobile-first), no native app.
- Camera/upload → AI Vision → Report → Routine + Affiliate.
- Email gate (free tier) + 1 trong 2 mô hình monetize (xem §11).
- Hỗ trợ tiếng Việt là chính, copy theo tone Gen Z thân thiện.

❌ **Ngoài scope (Phase 2+)**
- Mobile native app (iOS/Android).
- Self-hosted vision model (v1 dùng API của Google Cloud Vision / AWS Rekognition).
- 1-on-1 chat với chuyên gia da liễu.
- Progress tracking timeline (chỉ enable từ scan thứ 2 trở đi).
- Percentile so sánh với người cùng độ tuổi (cần đủ data trước).

---

## 2. Liquid Glass UI — Ngôn ngữ thiết kế chủ đạo

> SkincareAI chọn **Liquid Glass** (cảm hứng từ Apple visionOS / iOS 18 design language) làm ngôn ngữ thiết kế chủ đạo. Concept đã có trong `design-lab/apple-liquid-glass-concept.html`.

### 2.1 Nguyên lý thiết kế

| Nguyên lý | Định nghĩa | Triển khai |
|---|---|---|
| **Translucency** | Bề mặt UI mờ, để màu nền và nội dung phía sau hắt qua. | `backdrop-filter: blur(24px) saturate(180%)` · background `rgba(255,255,255,0.6)` |
| **Depth & Layering** | Phân tầng z-index rõ ràng để tạo cảm giác 3D nhẹ. | Card hero ở layer cao nhất, score gauge nổi lên, content card lùi sau. |
| **Soft Light** | Ánh sáng mềm, gradient bo tròn, không có shadow cứng. | Inner highlight 1px `inset 0 1px 0 rgba(255,255,255,0.5)` + outer soft shadow. |
| **Fluid Motion** | Chuyển động dựa trên spring physics, không linear easing. | Framer Motion `type: 'spring', stiffness: 220, damping: 26` |
| **Adaptive Tint** | Bề mặt glass tự bắt màu theo nội dung phía sau. | Vary tint theo `score_band` (đỏ → xanh dương). |

### 2.2 Áp dụng vào các surface chính

| Surface | Cách thể hiện Liquid Glass |
|---|---|
| **Hero Score Card** | Gauge tròn nổi 3D, glass card bên trong có blur + adaptive tint theo điểm số. Animation fill-in khi mount (1.2s spring). |
| **Face Heatmap** | SVG mặt overlay trên glass background. 9 zone fade từ trong suốt → tint màu theo score, hover/tap để inspect. |
| **Detail Cards (§8.3)** | Glass card 16-20px blur, border 1px gradient, icon dạng pill nổi. Stack dọc, parallax nhẹ khi scroll. |
| **Routine Step Cards** | Glass card với product image làm backdrop được blur, làm nền tự nhiên cho text. |
| **Paywall / Modal** | Glass full-screen với content panel nổi giữa, blur mạnh hơn (32px) để nhấn hierarchy. |
| **CTA Buttons** | Glass primary với gradient + shimmer animation khi idle. Tap có haptic-style scale 0.98. |

### 2.3 Token hệ thống (Tailwind 4)

```css
/* Base glass surface */
--glass-bg: color-mix(in srgb, var(--surface) 60%, transparent);
--glass-blur: 24px;
--glass-saturate: 180%;
--glass-border: 1px solid color-mix(in srgb, white 40%, transparent);
--glass-highlight: inset 0 1px 0 color-mix(in srgb, white 50%, transparent);

/* Score band tints — sync với §7.C */
--tint-critical:  #E74C3C;  /* 0–39  · Cần cải thiện gấp */
--tint-poor:      #E67E22;  /* 40–59 · Cần cải thiện */
--tint-fair:      #F1C40F;  /* 60–74 · Khá ổn */
--tint-good:      #2ECC71;  /* 75–89 · Tốt */
--tint-excellent: #3498DB;  /* 90–100 · Xuất sắc */

/* Motion */
--ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
--dur-fast: 220ms;
--dur-base: 360ms;
--dur-slow: 720ms;
```

### 2.4 Hiệu năng & Fallback

> Liquid Glass đẹp nhưng **đắt GPU**. Phải có chiến lược fallback rõ ràng.

- **Detect**: kiểm tra `CSS.supports('backdrop-filter: blur(1px)')` + `navigator.deviceMemory < 4` + `prefers-reduced-motion`.
- **Fallback solid**: dùng surface đặc với gradient tinh tế thay backdrop-filter. Tắt parallax và shimmer.
- **Budget**: tối đa **3 surface dùng backdrop-filter cùng lúc** trong viewport. Các card khác dùng pre-rendered blur (CSS `filter: blur()` lên ảnh nền).
- **Mục tiêu**: 60fps trên iPhone 12 / Android mid-range (Pixel 6a). LCP < 2.0s, CLS < 0.05.

---

## 3. Logic Tư vấn Da (Skin Advisory Engine)

> **Đây là trái tim sản phẩm.** Logic dưới đây kết hợp 3 lớp: AI Vision → Lifestyle Modifiers → Personalization Rules. Spec chi tiết ở §6, §7, §9 — phần này tóm tắt **luồng tư duy** để dev/PM nắm được kiến trúc.

### 3.1 Pipeline 5 giai đoạn

```text
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 1. Onboarding│ → │ 2. Image     │ → │ 3. Score     │ → │ 4. Lifestyle │ → │ 5. Routine   │
│    (intent + │   │    Vision    │   │    Compute   │   │    Modifier  │   │    Generation│
│    context)  │   │    (11 chỉ   │   │    (weighted │   │    (±20 cap) │   │    (concern  │
│              │   │    số / 9    │   │    composite)│   │              │   │    → product)│
│              │   │    zone)     │   │              │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

### 3.2 Triết lý cốt lõi

1. **AI không chẩn đoán y tế.** Mọi phát hiện severity cao → flag đỏ + recommend gặp bác sĩ da liễu (§8.5.1).
2. **Giải thích được (xAI).** Mỗi điểm số đều có **lifestyle_modifiers[]** breakdown để user thấy rõ "vì sao điểm này".
3. **Không over-promise.** Routine luôn có tag *"hỗ trợ cải thiện"*, không bao giờ dùng từ "trị khỏi", "chắc chắn".
4. **Safety-first.** Ingredient từ `D4 known_allergies[]` được **blacklist tuyệt đối** trong toàn bộ recommendation (§9.B "Avoid").
5. **Budget-aware.** Mỗi step routine có 3 tier giá (< 200K / 200K-500K / > 500K) để fit `monthly_budget_vnd`.

### 3.3 Các quyết định "if-then" then chốt

| Điều kiện | Hành động | Vị trí spec |
|---|---|---|
| `redness_score > 70` | Bỏ AHA/BHA khỏi routine, dùng PHA + Centella | §9.A bước 8, §9.B "Da nhạy cảm" |
| `uses_sunscreen = never` AND `age > 25` | -8 điểm pigmentation/wrinkle + RED FLAG trong report | §7.B, §9.A bước 7 |
| `goals` chứa `acne` AND `goals` chứa `dark_spots` | Stack BHA (PM) + Vit C (AM); KHÔNG kết hợp Retinol + Vit C | §9.B, warning trong §9.A bước 4 |
| `age < 18` | Chỉ gợi ý sản phẩm gentle, không retinol/AHA mạnh | §5 A2 note |
| `skincare_experience = none` | Routine 3 bước (cleanser + moisturizer + SPF) | §5 B2 note |
| `confidence < 0.7` cho zone bất kỳ | Không show điểm zone đó, để placeholder "Cần ảnh rõ hơn" | §6 CAM-03 |

---

## 4. User Flow End-to-End

> Flow tổng từ social acquisition đến re-engagement. Có 7 stage.

### 4.1 ▶ Acquisition

| ID | Kênh / Màn hình | Hành động User | Hành động System | Note Dev |
|---|---|---|---|---|
| 1.1 | Social (TikTok / IG Reels) | Xem video skin scan demo | Tracking UTM source | Pixel event: `ViewContent` |
| 1.2 | Landing Page | Đọc value prop, xem demo GIF | Load LP < 2s | A/B test CTA copy |

### 4.2 ▶ Onboarding

| ID | Màn hình | Hành động User | System | Rẽ nhánh | Note |
|---|---|---|---|---|---|
| 2.1 | Onboarding Q1–3 | Trả lời mục tiêu, giới tính, tuổi | Lưu session, progress bar | → Q4–6 | Auto-save mỗi bước, chưa cần login |
| 2.2 | Onboarding Q4–8 | Lifestyle (ăn, ngủ, nước, sport) | Lưu session | → Q9–12 | — |
| 2.3 | Permission | Cấp quyền Camera & Location | Request permission API | Đồng ý → Skin Scan / Từ chối → Upload ảnh | Fallback bắt buộc |

### 4.3 ▶ Skin Scan

| ID | Màn hình | Hành động | System | Rẽ nhánh | Note |
|---|---|---|---|---|---|
| 3.1 | Scan Screen | Chụp 3 ảnh (chính diện, nghiêng L/R) | Hướng dẫn khung oval, đèn đủ | Đủ chất lượng → Process / Kém → Chụp lại | Min 720p, blur check trước submit |
| 3.2 | Processing | Chờ 8–15s | Gọi AI Vision API, phân tích 9 zone | Success → Email Gate / Error → Retry | Loading anim, timeout 30s |

### 4.4 ▶ Gate / Paywall

| ID | Màn hình | Hành động | System | Note |
|---|---|---|---|---|
| 4.1 | Email Gate | Nhập email | Validate, tạo user record | Free tier: nhận report qua email |
| 4.2 | Freemium Upsell *(Option A)* | Xem preview report bị blur | Hiện teaser 3 chỉ số | Click "Xem đầy đủ" → Paywall |
| 4.3 | Credit Model *(Option B)* | Xem thông báo cần credit | Hiện pricing options | Mua credit → Unlock / Skip → Email cơ bản |

### 4.5 ▶ Report Delivery

| ID | Màn hình | Hành động | System | Note |
|---|---|---|---|---|
| 5.1 | In-app Report | Xem report trên webapp | Render từ AI output | Lazy load ảnh, skeleton |
| 5.2 | Email Delivery | Nhận email report (2–3 phút) | Trigger email sau khi AI xử lý | HTML, tracking pixel open rate, retry 3× nếu fail |

### 4.6 ▶ Purchase Funnel

| ID | Màn hình | Hành động | System | Note |
|---|---|---|---|---|
| 6.1 | Routine Recommendation | Xem product list | Render product + affiliate link | UTM tracking từng link |
| 6.2 | Post-Purchase | Mua trên TMDT | Track affiliate conversion | 30 ngày sau → Gửi email re-scan |

### 4.7 ▶ Re-engagement

| ID | Màn hình | Hành động | System | Note |
|---|---|---|---|---|
| 7.1 | Email Nurture | Tips skincare hàng tuần | Automated sequence (D+3, D+7, D+30) | Chuỗi tối thiểu 5 email |
| 7.2 | Re-scan CTA | Click "Scan lại sau 30 ngày" | Onboarding rút gọn (skip câu đã có) | Pre-fill data cũ |

---

## 5. Onboarding — Bộ câu hỏi đầu vào

> Tổng cộng **17 câu** chia 5 nhóm. UX quan trọng: auto-save, progress bar, tone Gen Z thân thiện, không hỏi info vô lý.

### 5.A Thông tin cá nhân

| ID | Câu hỏi | Loại input | Options / Range | Validation | AI dùng để | UX Note |
|---|---|---|---|---|---|---|
| A1 | Tôi có thể gọi bạn là gì? | Text + Pronoun select | Tên (bắt buộc); Giới tính: Nữ/Nam/Không muốn nói | Tên 2–40 ký tự | Cá nhân hóa toàn bộ trải nghiệm | Hỏi đầu để tạo kết nối |
| A2 | Bạn bao nhiêu tuổi? | Slider discrete | 13–17 / 18–24 / 25–34 / 35–44 / 45–54 / 55+ | Required | Aging pattern, hormonal | Nếu < 18 → note "chỉ gợi ý sản phẩm an toàn cho teen" |
| A3 | Bạn đang ở đâu? | Auto-detect + dropdown | GPS → Tỉnh/Thành VN; ngoài VN: country picker | Optional, recommend | UV index, độ ẩm theo vùng | Giải thích lý do để giảm reluctance |

### 5.B Mục tiêu & Concerns

| ID | Câu hỏi | Loại | Options | Validation | AI dùng để |
|---|---|---|---|---|---|
| B1 | Bạn muốn cải thiện điều gì trên da? | Multi-select (max 3) | Trị mụn, mờ thâm, lỗ chân lông, lão hóa, dưỡng ẩm, làm trắng, kiểm soát dầu, da nhạy cảm | Min 1, max 3 | **Priority stack cho routine + weight scoring** |
| B2 | Bạn đã từng dùng skincare chưa? | Single | Chưa, < 6 tháng, 1–2 năm, 3+ năm | Required | Độ phức tạp routine (3 bước → layering) |
| B3 | Da bạn đang gặp vấn đề gì cụ thể? | Multi + text | Mụn nổi, mụn ẩn, thâm cũ, nám, khô, bong tróc, đỏ, oily, khác | Optional | Conditions cần address |

### 5.C Lifestyle

| ID | Câu hỏi | Loại | Options | AI dùng để |
|---|---|---|---|---|
| C1 | Ngủ bao nhiêu tiếng/ngày? | Slider | < 5h / 5–6h / 7–8h *(optimal)* / > 9h | Cortisol → acne hormonal · *Educational nudge: "< 6h tăng nguy cơ mụn 30%"* |
| C2 | Uống bao nhiêu nước/ngày? | Slider | < 1L / 1–1.5L / 1.5–2L / > 2L *(target)* | Hydration → TEWL |
| C3 | Thói quen ăn uống? | Multi | Ngọt, cay, chiên/béo, kích thích, healthy, đặc biệt | Sebum, inflammation, glycation |
| C4 | Tập thể dục bao nhiêu/tuần? | Slider | 0 / 1–2 / 3–4 / 5+ | Circulation, sweat-induced acne |
| C5 | Môi trường làm việc? | Single | Văn phòng/AC, ngoài trời, ô nhiễm, nhà máy, hybrid | Pollution, UV, AC-dry skin |
| C6 | Hút thuốc? | Single | Không, thỉnh thoảng, thường xuyên | Collagen degradation. *Frame nhẹ nhàng, không phán xét.* |
| C7 | Mức stress gần đây? | Emoji slider 5 mức | 😊 → 😰 | Cortisol → barrier disruption |

### 5.D Skincare hiện tại & Ngân sách

| ID | Câu hỏi | Options | Tác động AI |
|---|---|---|---|
| D1 | Hiện tại có dùng kem chống nắng? | Hàng ngày / không thường xuyên / Không | **Critical** — risk-flag photoaging trong report |
| D2 | Tẩy trang/rửa mặt mấy lần/ngày? | 0 / 1 / 2 / 3+ | Barrier disruption vs buildup |
| D3 | Ngân sách skincare/tháng? | Slider VND: < 200K / 200–500K / 500K–1M / 1–2M / > 2M | Filter product tier + affiliate |
| D4 | Dị ứng/không hợp thành phần nào? | Multi: Fragrance, Alcohol, Retinol, Vit C, AHA/BHA, Niacinamide, Không biết, Khác | **Ingredient blacklist tuyệt đối**. Flag đỏ trong report. |

### 5.E Permissions & Data

| ID | Hỏi | Options | Note |
|---|---|---|---|
| E1 | Cho phép Camera để scan? | Đồng ý → Camera / Không → Upload | Required (chọn 1). *"Ảnh không được lưu lại sau khi phân tích"* |
| E2 | Cho phép thư viện ảnh? | Đồng ý / Không | Conditional — chỉ hỏi nếu E1 = Không |
| E3 | Email để nhận Skin Report | Email validate real-time | Double opt-in preferred. *"Không spam"* |

---

## 6. Skin Scan — Capture & AI Vision

### 6.A Capture Requirements (Frontend)

| ID | Yêu cầu | Spec | Vì sao | Dev Action | Error State |
|---|---|---|---|---|---|
| **CAM-01** | Số ảnh | **3 bắt buộc** (chính diện + nghiêng L 45° + nghiêng R 45°) | Phủ 9 zone | Stepper 1/3 → 3/3 | Thiếu → block submit |
| **CAM-02** | Resolution | ≥ 720p (1280×720) | Đủ texture detail | Reject < 720p | "Ảnh quá mờ, chụp lại" |
| **CAM-03** | Blur detection | Laplacian variance > 100 | Mờ → AI sai | Run blur check pre-upload | "Giữ tay thẳng, chụp lại" |
| **CAM-04** | Ánh sáng | Ambient > 50 lux | Thiếu sáng → màu da sai | Cảnh báo nếu detect tối | "Ra chỗ sáng hơn" — *không bật flash* |
| **CAM-05** | Face in frame | 1 mặt, > 60% frame | AI phân tích đúng vùng | MediaPipe FaceMesh | "Đưa mặt vào khung oval" |
| **CAM-06** | Fallback upload | JPG/PNG, max 10MB | User không dùng camera | File picker | Yêu cầu không filter, không make-up nặng |
| **CAM-07** | Privacy notice | Modal trước capture | Compliance/trust | "Ảnh bị xóa sau 24h" | User không đồng ý → block |
| **CAM-08** | Upload progress | Realtime % | UX | Show % + "Đang phân tích..." | Timeout > 30s → retry |

### 6.B AI Analysis — 11 chỉ số sinh lý da

| Chỉ số | Mô tả | Method | Output | Vùng | Weight |
|---|---|---|---|---|---|
| **Hydration Level** | Độ ẩm/khô | Texture + flakiness | 0–100 | Toàn mặt, trọng tâm má | **15%** |
| **Sebum / Oiliness** | Bã nhờn | Specular highlight | 0–100 | T-zone | 10% |
| **Acne Detection** | Mụn + phân loại | YOLO/SAM object detection | Count + type + location | Toàn mặt | **20%** |
| **Pore Size** | Kích thước lỗ chân lông | Texture + edge | 0–100 *(100=lớn)* | Má, mũi | 8% |
| **Pigmentation** | Nám, tàn nhang, thâm | Color seg, HSV | 0–100 + heatmap | Gò má, trán | 12% |
| **Wrinkles / Fine Lines** | Nếp nhăn | Edge + depth est. | 0–100 + location | Trán, quanh mắt/miệng | 10% |
| **Skin Tone Evenness** | Đều màu | Color variance | 0–100 | Toàn mặt | 10% |
| **Redness / Sensitivity** | Đỏ, kích ứng | Red channel + pattern | 0–100 + location | Má, mũi, cằm | 8% |
| **Dark Circles** | Quầng thâm | Periorbital color | 0–100 | Quanh mắt | 5% |
| **Skin Texture** | Độ mịn | Surface roughness | 0–100 | Toàn mặt | 7% |
| **Blackheads / Sebaceous Filaments** | Mụn đầu đen | Pore content detection | Count + severity | Mũi, cằm | 5% |
| **Sagging / Elasticity *(35+)*** | Chảy xệ | Contour shape | 0–100 | Xương hàm, má | *5% — chỉ user 35+* |

> Phân loại Acne: `comedone` / `papule` / `pustule` / `nodule`.
> Phân loại Pigmentation: `melasma` vs `post-acne hyperpigmentation`.
> Phân loại Dark Circles: `vascular` vs `pigmented`.

---

## 7. Scoring Logic — Quy đổi điểm 100

### 7.A Composite Skin Health Score

| Metric | Weight | Source | Normalization | Range | Direction |
|---|---|---|---|---|---|
| Hydration Level | 15% | AI Vision | `raw_score` (đã normalize) | 0–100 | 0=Very Dry → 100=Hydrated |
| Acne Severity | 20% | AI Vision | `100 - (severe×10 + moderate×5 + mild×2)` *(min 0)* | 0–100 | 0=Severe → 100=Clear |
| Pigmentation | 12% | AI Vision | `100 - pigment_score` *(inverted)* | 0–100 | 0=Heavy → 100=Even |
| Sebum Control | 10% | AI Vision | Oily: `50 + (50 - oily)/2` · Dry: `oily/2` | 0–100 | **Optimal ~50–70** |
| Pore Appearance | 8% | AI Vision | `100 - pore_score` | 0–100 | 0=Large → 100=Minimal |
| Wrinkle Score | 10% | AI Vision | `100 - wrinkle_score` | 0–100 | 0=Many → 100=Smooth |
| Skin Tone Evenness | 10% | AI Vision | `raw_score` | 0–100 | 0=Uneven → 100=Even |
| Redness/Sensitivity | 8% | AI Vision | `100 - redness_score` | 0–100 | 0=Red → 100=Calm |
| Texture Smoothness | 7% | AI Vision | `raw_score` | 0–100 | 0=Rough → 100=Smooth |
| **TOTAL** | **100%** | | | | |

### 7.B Lifestyle Modifiers (cap ±20 điểm)

| Yếu tố | Giá trị | Modifier | Áp dụng | Logic |
|---|---|---|---|---|
| Giấc ngủ | < 6h/ngày | **−5** | Acne, Hydration | Sleep deprivation → cortisol → acne |
| Giấc ngủ | 7–8h *(optimal)* | **+3** | Overall | Skin repair |
| Nước uống | < 1.5L/ngày | **−5** | Hydration | TEWL |
| Chế độ ăn | Ngọt/cay/béo nhiều | **−5** | Acne, Sebum | High GI → insulin → sebum |
| Chế độ ăn | Healthy | **+5** | Overall | — |
| Stress | Level 4–5 | **−5** | Acne, Redness, Hydration | Cortisol → barrier disruption |
| Stress | Level 1–2 | **+3** | Overall | — |
| **Kem chống nắng** | **Không dùng + tuổi > 25** | **−8** | Pigmentation, Wrinkle | UV photoaging · **🚩 RED FLAG** |
| Hút thuốc | Thường xuyên | **−8** | Wrinkle, Texture, Tone | Collagen degradation |
| Exercise | 3+ buổi/tuần | **+3** | Overall | Circulation |
| Môi trường | Ngoài trời/ô nhiễm | **−5** | Pigmentation, Redness | Oxidative stress |

> **Cap:** Tổng modifier `clamp(-20, +20)`.
> **Final formula:** `final_score = clamp(0, 100, composite + capped_modifier)`.

### 7.C Score Band — Cách diễn giải cho User

| Range | Label | Màu UI | Message | CTA |
|---|---|---|---|---|
| 0–39 | 🔴 **Cần cải thiện gấp** | `#E74C3C` | "Da của bạn đang cần được chăm sóc đặc biệt. Đừng lo — chúng tôi có plan cho bạn." | Xem Routine ngay |
| 40–59 | 🟠 **Cần cải thiện** | `#E67E22` | "Da bạn đang ở mức trung bình. Một số thói quen nhỏ có thể tạo ra sự khác biệt lớn." | Cải thiện cùng SkincareAI |
| 60–74 | 🟡 **Khá ổn** | `#F1C40F` | "Da bạn đang khá tốt! Hãy cùng tối ưu thêm để đạt kết quả tốt nhất." | Xem tips cải thiện |
| 75–89 | 🟢 **Tốt** | `#2ECC71` | "Da bạn đang trong tình trạng tốt! Duy trì routine này và bạn sẽ thấy kết quả rõ rệt." | Xem routine duy trì |
| 90–100 | ✨ **Xuất sắc** | `#3498DB` *(glow)* | "Da bạn đang ở đỉnh cao! Chỉ cần duy trì và bảo vệ làn da tuyệt vời này." | **Chia sẻ kết quả** *(viral hook)* |

> Liquid Glass tint của hero card sẽ **adapt theo band** này (xem §2.3 token `--tint-*`).

---

## 8. Output Report — Cấu trúc Skin Health Report

> Báo cáo gồm **7 section**, render trên webapp + email. Áp dụng Liquid Glass cho mọi card.

### 8.1 Hero Section

| # | Sub | Nội dung | Source | Component |
|---|---|---|---|---|
| 1.1 | Greeting | "Chào [Tên], đây là Skin Report của bạn 🌟" | Onboarding A1 | H1, fade-in |
| 1.2 | Overall Score | Điểm tổng (vd 68/100) + gauge tròn | Scoring Engine | **Circular gauge animated, color theo band** |
| 1.3 | Score Label + Message | Badge + 1–2 câu nhận xét | Scoring Engine | Glass badge + paragraph |
| 1.4 | Skin Type Diagnosis | Da dầu / khô / hỗn hợp / nhạy cảm / thường | Sebum + Hydration | Badge with icon |
| 1.5 | Percentile *(Phase 2)* | "Tốt hơn X% người cùng tuổi/giới" | DB so sánh | Progress bar — *skip ở v1 nếu chưa đủ data* |

### 8.2 Heatmap / Face Map

| # | Sub | Nội dung | Source | Component |
|---|---|---|---|---|
| 2.1 | Visual face zone map | 9 vùng với màu theo điểm | AI per-zone | **SVG face overlay với color coding** 🔴→🟡→🟢 |
| 2.2 | Zone score table | Trán, Thái dương, Quanh mắt, Mũi, Gò má, Má, Quanh miệng, Cằm, Xương hàm | AI Vision | Table + icon |
| 2.3 | Predicted acne zone *(optional)* | Vùng dự đoán nổi mụn | AI pattern | Highlighted + warning — *chỉ show nếu confidence > 70%* |

### 8.3 Phân tích chi tiết từng chỉ số

> Mỗi card là 1 glass surface với: **Score bar · Tình trạng · Nguyên nhân · Ảnh hưởng**.

| # | Chỉ số | Nội dung chính | Note |
|---|---|---|---|
| 3.1 | Hydration | Score, mô tả, lifestyle factors, effects | Card + score bar |
| 3.2 | Acne | Số lượng + phân loại, vùng tập trung, nguyên nhân, dự báo | Card + mini face map. Phân loại comedone/inflammatory/hormonal |
| 3.3 | Pigmentation | Score + heatmap. Loại: post-acne / melasma / sun damage | Card + image overlay |
| 3.4 | Aging Signs | Wrinkle score, vị trí tĩnh, elasticity proxy, trend | Card + timeline. *Quan trọng cho user 25+* |
| 3.5 | Pore | Pore score, vùng lớn, di truyền vs sebum | Card + zone highlight |
| 3.6 | Skin Tone & Texture | Evenness, smoothness, dullness | Card |
| 3.7 | Sensitivity / Redness | Redness score, vùng kích ứng, risk rosacea/dermatitis/eczema | Card + warning. **Disclaimer: AI không chẩn đoán y tế** |

### 8.4 Lifestyle Impact Analysis

| # | Sub | Nội dung | Source |
|---|---|---|---|
| 4.1 | Sleep Impact | Phân tích + score ảnh hưởng (−X) | C1 + Modifier |
| 4.2 | Diet Impact | Thói quen + impact + gợi ý | C3 + Modifier |
| 4.3 | UV Protection Status | Risk level, tác động đã phát hiện | D1 + AI pigmentation. *Card đỏ nếu không SPF.* |
| 4.4 | Environment & Stress | Tổng hợp impact | C5, C7 + Modifier |
| 4.5 | **Potential Score** | "Da bạn có thể đạt X điểm nếu cải thiện [...]" | Projection | **Motivational hook — strong engagement** |

### 8.5 Flags — Điều kiện cần chú ý

| # | Loại | Nội dung | Source |
|---|---|---|---|
| 5.1 | 🚩 **Red Flags** | Mụn cấp 3–4, redness bất thường, texture changes — gợi ý gặp bác sĩ | AI severity high. **DISCLAIMER bắt buộc** |
| 5.2 | ⚠️ Ingredient Conflicts | Thành phần user dị ứng → blacklist khỏi mọi gợi ý | D4 |
| 5.3 | 🎯 Age-specific Flags | Teen acne / 25+ preventive aging / 35+ aging | A2 |

### 8.6 Routine Recommendation Preview

| # | Sub | Nội dung | Component |
|---|---|---|---|
| 6.1 | AM Routine summary | 3–5 bước sáng + product chips | Card list |
| 6.2 | PM Routine summary | 3–5 bước tối | Card list |
| 6.3 | Weekly treatments | 1–2 mask/exfoliant nếu phù hợp | Card |
| 6.4 | CTA full routine | "Xem đầy đủ Routine của bạn →" | **Primary glass CTA** |

### 8.7 Progress Tracking *(Future scan)*

| # | Sub | Nội dung |
|---|---|---|
| 7.1 | Rescan reminder | "Scan lại sau 30 ngày" + countdown |
| 7.2 | Timeline visual | So sánh điểm hiện tại vs scan trước — *chỉ show từ scan #2* |

---

## 9. Routine Design — Engine cá nhân hóa

### 9.A Routine Framework — 10 bước

| # | Bước | Khi nào | Điều kiện include | Category | Ingredient ưu tiên | Note Dev |
|---|---|---|---|---|---|---|
| **1** | Tẩy trang / Cleansing oil | **PM only** | Có make-up OR môi trường bụi/ô nhiễm | Cleansing oil, Micellar, Balm | Mineral-oil-free nếu da mụn; Jojoba cho da khô | Double cleansing nếu có make-up |
| **2** | Sữa rửa mặt | **Both** | Always *(required)* | Gel (dầu), Cream (khô), Foam (hỗn hợp) | pH 4.5–6.5, tránh SLS nếu nhạy cảm | < 200K: CeraVe/Cetaphil; > 500K: Tatcha/La Roche-Posay |
| **3** | Toner / Essence | **Both** | Always *(full routine)* | Hydrating toner, Exfoliating *(AHA/BHA, PM only)* | Glycerin, HA, Niacinamide; tránh alcohol nếu nhạy cảm | < 200K: Some By Mi/Klairs; > 1M: SK-II/Sulwhasoo |
| **4** | **Serum — Primary** | Both *(tùy active)* | Chọn theo top concern B1 | Vit C *(AM)*, Retinol *(PM)*, Niacinamide *(both)*, BHA *(PM)* | mụn → BHA; thâm → Vit C; lão hóa → Retinol | **⚠️ Warning: Retinol + Vit C không dùng chung** |
| **5** | Serum — Secondary | Tùy | Budget > 500K/tháng AND có concern thứ 2 | Eye cream, Spot treatment, Barrier serum | Caffeine, Benzoyl Peroxide, Ceramide | Max 2 serum để tránh over-layering |
| **6** | Dưỡng ẩm | **Both** | Always | Gel (dầu), Cream (khô), Lotion (hỗn hợp) | Ceramide, HA, Peptides; tránh mineral oil nếu mụn | < 200K: Neutrogena/Cetaphil; > 1M: La Mer/Tatcha |
| **7** | **Kem chống nắng (SPF)** | **AM only** | Always *(required)* | SPF30–50+ PA+++, Chemical vs Physical | Zinc Oxide (nhạy cảm), Tinosorb, Avobenzone | **🚩 RED FLAG nếu D1 = Không dùng** |
| **8** | Tẩy tế bào chết | **1–3×/tuần, PM** | `redness_score < 60` AND không viêm mụn nặng | AHA (Glycolic, Lactic), BHA (Salicylic), PHA (nhạy cảm) | AHA cho texture; BHA cho mụn/lỗ chân lông; PHA cho nhạy cảm | **Không recommend nếu redness > 70** |
| **9** | Mặt nạ / Treatment | **1–2×/tuần** | Budget > 500K AND user quan tâm | Clay (dầu), Sheet (khô), Brightening | Kaolin, Niacinamide, Aloe, Centella | < 200K: Innisfree; > 500K: Dr.Jart/Tatcha |
| **10** | Eye care | **Both** | Age > 25 AND (`dark_circle > 50` OR `wrinkle > 40`) | Eye cream, Eye serum, Patches | Caffeine, Retinol *(PM)*, Peptides | < 300K: Neutrogena; > 500K: Kiehl's |

### 9.B Personalization Logic — Concern → Routine Priority

| Concern | Skin Type Mod | Priority Serum | Key Ingredients | **Avoid** *(blacklist)* | Affiliate Cat | Budget |
|---|---|---|---|---|---|---|
| **Trị mụn** | Gel/foam cleanser, lightweight moist. | BHA *(PM)* + Niacinamide *(AM/PM)* | Salicylic 2%, Niacinamide 10%, Zinc, Tea Tree nhẹ | Coconut oil, mineral oil, fragrance nặng | Acne, BHA, oil-free moist. | All tiers |
| **Mờ thâm / sẹo** | Mọi loại da | Vit C *(AM)* + AHA/Retinol *(PM)* | Vit C 10–20%, Niacinamide, Alpha Arbutin, AHA, Retinol | Benzoyl Peroxide cao | Brightening, Vit C, AHA toner | All tiers |
| **Thu nhỏ lỗ chân lông** | Da dầu/hỗn hợp | BHA + Niacinamide | Salicylic, Niacinamide, Clay | Heavy oils | BHA, Niacinamide, Clay mask | Mid-High |
| **Chống lão hóa** | Mọi loại da *(25+)* | Retinol *(PM)* + Peptide moist. | Retinol 0.025–0.1%, Peptides, Vit C, SPF+++ | Fragrance, alcohol cao | Retinol, Anti-aging, SPF | Mid-High *(start retinol thấp)* |
| **Dưỡng ẩm / Khô da** | Da khô, nhạy cảm | HA serum + Ceramide moist. | HA, Ceramide, Glycerin, Squalane, Shea Butter | Alcohol, SLS, fragrance, AHA *(nếu nhạy cảm)* | Hydrating, Cream moist., Essence | All tiers |
| **Làm trắng / Đều màu** | Mọi loại da | Vit C + Niacinamide + AHA toner | Vit C, Niacinamide, Alpha Arbutin, Tranexamic Acid, AHA | — | Brightening full set | Mid-High. **SPF CRITICAL** |
| **Kiểm soát dầu** | Da dầu | Niacinamide serum + BHA toner | Niacinamide 10%, Salicylic, Clay, Zinc | Heavy creams, occlusive dày | Mattifying, BHA, oil-control SPF | All tiers |
| **Da nhạy cảm** | Da nhạy cảm | Centella serum + PHA toner *(thay AHA)* | Centella, Ceramide, PHA, Aloe, Panthenol | Fragrance, alcohol, AHA mạnh, retinol *(start mới)* | Gentle range, PHA, barrier | All tiers. **Patch test bắt buộc** |

---

## 10. Email Template & Nurture Sequence

> 5 email × 30 ngày. Subject lines luôn personalize với `[Tên]` và score. Tracking pixel + UTM bắt buộc.

### 10.1 EMAIL 1 — Report Delivery (gửi ngay sau khi có kết quả)

| Element | Nội dung | Note |
|---|---|---|
| **Subject A/B test** | A: `[Tên] ơi, da bạn đang ở mức X/100 🔍` · B: `Skin Report của [Tên] đã sẵn sàng ✨` · C: `Chúng tôi đã phân tích da của [Tên] — xem kết quả ngay` | Test 3 options |
| **Preheader** | "Da bạn cần cải thiện [X] điều này để đạt làn da khỏe mạnh hơn →" | ≤ 90 ký tự |
| **Section 1: Hero** | Logo + Greeting + Score badge lớn (X/100, color theo band) | HTML email, inline CSS, mobile-first. **Image alt text bắt buộc** |
| **Section 2: Score Summary** | Overall + label + Top 3 strengths + Top 3 areas to improve | Table layout, **icon PNG** *(không dùng emoji vì Outlook render lỗi)* |
| **Section 3: Key Findings** | 3 phát hiện nổi bật theo concern | 3 card layout |
| **Section 4: Routine Preview** | Top 3 sản phẩm: ảnh, tên, giá, link mua, vì sao phù hợp | Product card + CTA "Mua ngay". **UTM: `utm_source=email&utm_medium=report&utm_campaign=scan1`** |
| **Section 5: CTA Primary** | "Xem đầy đủ Skin Report của bạn →" | Large CTA, link về webapp |
| **Section 6: Re-scan CTA** | "Quay lại sau 30 ngày để thấy sự thay đổi của da bạn 📅" | Soft CTA |
| **Footer** | © SkincareAI · Privacy · Unsubscribe · Địa chỉ | **CAN-SPAM / GDPR compliant** |

### 10.2 Nurture Sequence (D+3 → D+30)

| Email | Khi gửi | Subject | Nội dung | Mục tiêu |
|---|---|---|---|---|
| **#2** | D+3 | `[Tên] ơi, 1 thói quen nhỏ giúp da bạn tốt hơn ngay tuần này 💡` | 1 lifestyle tip *(vd ngủ ít → tip + sản phẩm hỗ trợ giấc ngủ)* + link xem report | Single-focus |
| **#3** | D+7 | `Sản phẩm #1 dành riêng cho da [loại da]` | Deep dive 1 sản phẩm: ingredient breakdown, cách dùng, review tương tự, affiliate link | **Commission-focus** |
| **#4** | D+14 | `Da bạn đang thay đổi chưa? 🌱` | Reminder routine + checklist + soft upsell "Scan lại để thấy tiến độ" | Engagement + retention |
| **#5** | D+30 | `Đã 30 ngày — da [Tên] có khỏe hơn chưa? Scan ngay để biết 🔍` | Nhắc điểm cũ + FOMO ("user scan 2 lần cải thiện trung bình X điểm") + CTA Re-scan | **Strong re-engagement. Paywall gate nếu dùng Model B** |

---

## 11. Monetization — Affiliate + Paywall

### 11.A Model A — Affiliate

| Kênh | Commission | Cookie | Min payout | Tích hợp | Pros | Cons |
|---|---|---|---|---|---|---|
| **Shopee Affiliate** | 2–8% | 7 ngày | 500K VND | Shopee API / link generator | User lớn, quen Gen Z VN | Commission thấp, tracking yếu khi đổi device |
| **Lazada (Accesstrade)** | 3–10% | 30 ngày | 1M VND | Accesstrade API | Cookie dài | Ít phổ biến hơn Shopee |
| **Tiki** | 3–8% | 7 ngày | 500K VND | Tiki Affiliate portal | Uy tín | Traffic thấp hơn |
| **Brand Direct (DTC)** | 10–20% | 30–90 ngày | Negotiable | Custom link / promo code | **Commission cao nhất**, data chính xác | Effort cao, negotiate từng brand |
| **International** | 5–15% | 30 ngày | 50 USD | CJ Affiliate, ShareASale, Impact | Tiếp cận brand quốc tế | User VN prefer Shopee |

> **⚙️ UTM format chuẩn:**
> `?utm_source=skincareai&utm_medium=[email|webapp|report]&utm_campaign=[scan_report|routine|nurture]&utm_content=[product_id]`

### 11.B Model B — Paywall / Credit

| Tier | Tên | Giá | Số lần | Included | Excluded | Positioning |
|---|---|---|---|---|---|---|
| **FREE** | 🆓 Starter | 0đ | 1 lần *(first scan)* | Report tóm tắt (Overall + Top 3 issues) · Routine 3 bước · Email · Affiliate | Full 7 sections · Heatmap · Lifestyle analysis · Progress · AI flag chi tiết | **Acquisition** — lấy email, build trust |
| **BASIC** | ✨ Basic Scan | 19.000đ | Pay-per-use | Full report · Heatmap · Lifestyle · Routine đầy đủ · Email + in-app · Affiliate | Progress vs lần trước · Priority queue · Export PDF | **Impulse purchase** — dưới ngưỡng nhạy cảm |
| **VALUE** | 🌟 3-Pack | 49.000đ *(≈16K/lần)* | 3 scans / 90 ngày | Tất cả Basic + Progress tracking + Export PDF | Priority queue · 1-on-1 consult | **Best value** — commit 3 tháng |
| **PREMIUM** | 💎 Monthly Unlimited | 99.000đ/tháng | Unlimited | Tất cả Value + Priority AI < 10s + PDF chuyên nghiệp + Skin Journal + 1 chat consult/tháng | — | **Power user** |
| **GIFT** | 🎁 Gift Scan | 25.000đ | 1 lần, tặng | Tất cả Basic + Gift landing + Gift email đẹp | Progress | **Viral mechanism** |

### 11.C Paywall UX Flow — 5 chiến lược

| Approach | Mô tả | Điểm gate | Tâm lý học | Risk | Recommendation |
|---|---|---|---|---|---|
| **Freemium Blur Gate** | Hiện free, blur phần chi tiết | Sau Section 1 → blur Section 2+ | Curiosity gap | User frustrated nếu blur quá nhiều | ✅ **RECOMMENDED cho scan đầu** |
| **Progress Wall** | Scan #1 free, scan #2+ trả phí | Sau khi `user_scan_count ≥ 2` | Sunk cost | User đổi email để bypass | ✅ **RECOMMENDED kết hợp Blur Gate** |
| **Credit Pack (Upfront)** | Bán credit trước (3-pack, monthly) | Tại email gate | Anchoring (19K vs 49K/3) | Friction cao, drop-off | Dùng **upsell** sau free scan |
| **Gift Viral Loop** | Mua tặng bạn → bạn convert | Sau khi nhận report | Reciprocity + social proof | Abuse nếu không rate-limit | ✅ **Strong viral hack** |
| **Subscription Lock-in** | Monthly unlimited cho power user | Sau 2–3 basic scan | Convenience + savings | Churn nếu không thấy value | Phase 2, đủ user base |

> **Đề xuất combo tối ưu (v1):** **Freemium Blur Gate** *(scan đầu)* + **Progress Wall** *(scan thứ 2 trở đi)* + **Gift Viral Loop** *(growth)*. Hoãn Subscription đến Phase 2.

---

## 12. API Specification

### 12.1 `POST /api/v1/scan` — Submit scan + onboarding data

**Request body** *(JSON)*

| Field | Type | Constraint | Note |
|---|---|---|---|
| `images[]` | string[] | Required, 3 items, each > 100KB | base64 hoặc presigned S3 URLs. Face detection passed |
| `onboarding.name` | string | Required, 2–40 chars | A1 |
| `onboarding.gender` | enum | Required | `female` / `male` / `prefer_not_to_say` |
| `onboarding.age_range` | enum | Required | `13-17` / `18-24` / `25-34` / `35-44` / `45-54` / `55+` |
| `onboarding.location` | object | Optional | `{ city, country, lat, lng }` |
| `onboarding.goals[]` | enum[] | Required, max 3 | `acne` / `dark_spots` / `pores` / `anti_aging` / `hydration` / `brightening` / `oil_control` / `sensitive` |
| `onboarding.skincare_experience` | enum | Required | `none` / `beginner` / `intermediate` / `advanced` |
| `onboarding.concerns[]` | enum[] | Optional | `active_acne` / `closed_comedones` / `post_acne` / `melasma` / `dry` / `flaky` / `redness` / `oily` / `other` |
| `onboarding.sleep_hours` | enum | Required | `< 5` / `5-6` / `7-8` / `9+` |
| `onboarding.water_intake_l` | enum | Required | `< 1` / `1-1.5` / `1.5-2` / `2+` |
| `onboarding.diet[]` | enum[] | Required | `sweet` / `spicy` / `fatty` / `stimulants` / `healthy` / `special` |
| `onboarding.exercise_per_week` | enum | Required | `0` / `1-2` / `3-4` / `5+` |
| `onboarding.work_environment` | enum | Required | `office` / `outdoor` / `polluted` / `factory` / `hybrid` |
| `onboarding.smokes` | enum | Required | `no` / `occasionally` / `regularly` |
| `onboarding.stress_level` | int 1–5 | Required | — |
| `onboarding.uses_sunscreen` | enum | Required | `daily` / `sometimes` / `never` |
| `onboarding.cleansing_frequency` | enum | Required | `rarely` / `once` / `twice` / `more` |
| `onboarding.monthly_budget_vnd` | int | Required | VND (vd `300000`) |
| `onboarding.known_allergies[]` | enum[] | Optional | `fragrance` / `alcohol` / `retinol` / `vitamin_c` / `aha_bha` / `niacinamide` / `none` / `other` |
| `email` | string (email) | Required | Validate format |
| `user_tier` | enum | Required | `free` / `basic` / `value` / `premium` — quyết định độ sâu phân tích |

**Response**

| Field | Type | Note |
|---|---|---|
| `scan_id` | uuid | Dùng để poll kết quả |
| `status` | enum | `processing` / `complete` / `failed` |
| `estimated_wait_seconds` | int | — |

### 12.2 `GET /api/v1/scan/{scan_id}/result` — Poll result

| Field | Type | Note |
|---|---|---|
| `status` | enum | `processing` / `complete` / `failed`. **Poll mỗi 2s** |
| `ai_scores.overall` | float | Composite 0–100 *(sau lifestyle modifier)* |
| `ai_scores.hydration` | float | 0–100 |
| `ai_scores.acne_severity` | float | 0–100 *(100=clear)* |
| `ai_scores.pigmentation` | float | 0–100 *(100=even)* |
| `ai_scores.sebum` | float | 0–100 *(50–70=optimal)* |
| `ai_scores.pore_appearance` | float | 0–100 *(100=minimal)* |
| `ai_scores.wrinkle` | float | 0–100 *(100=smooth)* |
| `ai_scores.skin_tone_evenness` | float | 0–100 |
| `ai_scores.redness` | float | 0–100 *(100=calm)* |
| `ai_scores.texture` | float | 0–100 *(100=smooth)* |
| `ai_scores.dark_circles` | float | 0–100 *(100=no circles)* |
| `zone_scores{}` | object | `{ forehead, temple_l, temple_r, eye_l, eye_r, nose, cheek_l, cheek_r, mouth_area, chin, jawline }` 0–100 each |
| `acne_detail.count_by_type` | object | `{ comedone, papule, pustule, nodule }` |
| `acne_detail.zone_distribution` | object | `{ forehead: n, nose: n, ... }` |
| `skin_type` | enum | `oily` / `dry` / `combination` / `sensitive` / `normal` |
| `score_band` | enum | `critical` / `poor` / `fair` / `good` / `excellent` |
| `lifestyle_modifiers[]` | array | `{ factor, modifier_value, metric_affected, message }` — **breakdown để xAI** |
| `red_flags[]` | array | `{ type, severity, message, recommendation }` — empty nếu không có |
| `routine` | object | Xem §12.3. Chỉ full detail cho paid tier |
| `report_url` | url | Webapp xem full report |

### 12.3 `GET /api/v1/scan/{scan_id}/routine`

| Field | Type | Note |
|---|---|---|
| `am_routine[]` | array | `{ step_number, name, category, reason, ingredients_target[], ingredients_avoid[], budget_vnd_range, products[] }` |
| `pm_routine[]` | array | Same structure as am_routine |
| `weekly_treatments[]` | array | `{ name, frequency_per_week, category, reason, products[] }` |
| `products[].name` | string | — |
| `products[].brand` | string | — |
| `products[].price_vnd` | int | Giá ước tính |
| `products[].shopee_url` | url | UTM appended |
| `products[].lazada_url` | url | Optional |
| `products[].key_ingredients[]` | string[] | — |
| `products[].why_recommended` | string | 1–2 câu — **personalized to user's scores** |
| `products[].conflict_warnings[]` | string[] | Cảnh báo allergy/conflict — empty nếu không |

### 12.4 `POST /api/v1/payment/create-order`

**Request**

| Field | Type | Constraint |
|---|---|---|
| `user_id` | string | Required |
| `product_type` | enum | Required: `basic_scan` / `value_3pack` / `premium_monthly` / `gift_scan` |
| `payment_method` | enum | Required: `momo` / `zalopay` / `vnpay` / `stripe` |
| `gift_recipient_email` | string | Conditional *(chỉ với `gift_scan`)* |

**Response**

| Field | Type |
|---|---|
| `order_id` | uuid |
| `payment_url` | url *(redirect đến gateway)* |
| `expires_at` | datetime ISO 8601 |

---

## 13. Tech Stack & Implementation Notes

### 13.1 Recommended stack (theo spec gốc)

| Layer | Primary | Alternative / Phase 2 | Cost note |
|---|---|---|---|
| **Vision Model** | Google Cloud Vision API hoặc AWS Rekognition | Custom fine-tuned (YOLOv8 cho acne, MediaPipe FaceMesh) | ~500–2000 VND/scan |
| **LLM (report narrative)** | GPT-4o hoặc Claude Sonnet | — | ~2000 tokens ≈ 2000–5000 VND/report |
| **Email** | Resend / SendGrid / AWS SES | — | SES rẻ nhất khi scale |
| **Storage** | AWS S3 + auto-delete 24h | — | **Comply privacy promise** |
| **Queue** | BullMQ (Redis) hoặc AWS SQS | — | Scan processing async — không block user |
| **Database** | PostgreSQL (main) + Redis (session/cache) | — | — |

### 13.2 Mapping vào project hiện tại (Next.js + Supabase + Gemini)

| Spec layer | Triển khai trong repo | Ghi chú |
|---|---|---|
| Vision Model | `src/lib/gemini/` *(Google Generative AI)* | Dùng Gemini multi-modal cho v1. Schema validate bằng **Zod** *(theo CLAUDE.md)*. |
| Database | **Supabase Postgres** | Migration ở `supabase/`. Sync types với DB schema. |
| Auth / Email gate | **Supabase Auth** + Resend (transactional) | — |
| Storage | **Supabase Storage** *(thay AWS S3 ở v1)* + lifecycle policy 24h | Giữ promise xóa ảnh sau 24h. |
| Frontend | **Next.js App Router** + RSC default, `'use client'` chỉ khi cần | — |
| Styling | **Tailwind CSS 4** + Radix UI + Lucide + Framer Motion | Token Liquid Glass §2.3. |
| Queue | Supabase Edge Functions hoặc BullMQ self-host | Phụ thuộc scale Phase 1. |

### 13.3 Quality bar / Definition of Done cho v1.0

- [ ] **Logic tư vấn da**: 200 ảnh test có ground-truth, recall acne ≥ 0.8, confidence ≥ 0.7 cho 90% case.
- [ ] **Ingredient blacklist**: 100% sản phẩm gợi ý KHÔNG chứa thành phần trong `D4 known_allergies[]`. Có integration test.
- [ ] **Liquid Glass UI**: 60fps trên iPhone 12 / Pixel 6a, LCP < 2.0s, CLS < 0.05. Có fallback cho thiết bị yếu.
- [ ] **Privacy**: Ảnh tự xóa sau 24h. Có audit log.
- [ ] **xAI**: Mọi điểm số trong report đều có `lifestyle_modifiers[]` breakdown.
- [ ] **Disclaimer**: "AI không chẩn đoán y tế" hiện ở §8.5.1 và §8.3.7.
- [ ] **Compliance email**: CAN-SPAM/GDPR — unsubscribe, địa chỉ, double opt-in.
- [ ] **UTM tracking**: 100% affiliate link có UTM đúng format §11.A.
- [ ] **Tests**: `npm run lint` + `npx tsc --noEmit` clean. Unit test cho Scoring Engine và Routine Engine.

---

> **Tài liệu này là single source of truth cho v1.0.** Mọi thay đổi scope phải được phản ánh ngược lại trong `SkincareAI_ProductSpec_v1.xlsx` và file này. Ưu tiên §3 (Logic Tư vấn Da) và §2 (Liquid Glass UI) vì đây là hai trục mục tiêu phát triển chính.
