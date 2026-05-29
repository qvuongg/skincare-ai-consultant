# Landing Page — Phase C · Visual Variety Pass

> Tài liệu thiết kế và changelog cho **Phase C** của trang chủ Mika Casa.
> Mục tiêu: phá bỏ cảm giác "AI-generated template" mà bản Phase B mắc phải,
> đưa vào real-looking imagery (SVG + CSS), variation chất liệu, và slot sẵn
> cho ảnh thật do team cung cấp.
> Cập nhật: 2026-05-28.

---

## Mục lục

1. [Bối cảnh](#1-bối-cảnh)
2. [Chẩn đoán "AI smell"](#2-chẩn-đoán-ai-smell)
3. [Mục tiêu Phase C](#3-mục-tiêu-phase-c)
4. [Thay đổi theo section](#4-thay-đổi-theo-section)
5. [Component mới](#5-component-mới)
6. [Material & color rhythm](#6-material--color-rhythm)
7. [Image slot wiring](#7-image-slot-wiring)
8. [Cấu trúc file & line count](#8-cấu-trúc-file--line-count)
9. [Caveats & hạn chế](#9-caveats--hạn-chế)
10. [Bước tiếp theo](#10-bước-tiếp-theo)

---

## 1. Bối cảnh

| Phase | Nội dung chính | Kết quả |
|---|---|---|
| **A** | Thay layout 480px-only bằng full-width landing với 4 section (Nav · Hero · SliderDemo · FinalCta) | Quá ngắn, thiếu trust signals |
| **B** | Thêm 6 section: ProcessTimeline, MetricsGrid, ReportPreview, SocialProof, FAQ, Footer + sticky mobile CTA | Đủ section nhưng feedback: "đơn điệu, trông rất AI làm" |
| **C** | Visual variety pass — face scanner, dark/warm panels, photographic textures, before/after, horizontal scroll | ✅ Hoàn tất |

User feedback dẫn tới Phase C (nguyên văn):

> "tôi thấy bản này cũng tạm được, nhưng vẫn hơi đơn điệu, nên có 1 vài hình
> ảnh thực tế ko, ví dụ như kiểu từng vùng mụn trên khuôn mặt. Hiện tại trông
> hơi ít màu sắc, và trông rất AI làm."

---

## 2. Chẩn đoán "AI smell"

6 thói quen mà template AI hay rơi vào, được nhận diện trong bản Phase B:

1. **Mọi section dùng đúng MỘT chất liệu kính trắng** — không có panel màu đậm, không moment tối, không texture photographic, không variation material.
2. **Trang sản phẩm soi da nhưng không có một khuôn mặt nào** — hô "468 điểm mốc" mà không show được 1 lần. Đây là tell lớn nhất.
3. **Mọi section có cùng anatomy** — `eyebrow chip → title → subtitle → content`. Lặp đúng 8 lần liên tiếp.
4. **Palette quá nhạt** — mesh background pastel + glass trắng + chỉ duy nhất iris CTA có saturation cao. Không có nhịp màu.
5. **MetricsGrid là 11 thẻ giống hệt nhau** — cùng kích cỡ, cùng layout, chỉ đổi icon + chữ.
6. **Không có data visualization đa dạng** — chỉ progress bar 4 cái và 1 ring SVG. Thiếu heatmap, scatter, before/after, animated face landmark.

---

## 3. Mục tiêu Phase C

Approach **A+C** (theo lựa chọn của user — sẽ cấp 4–6 ảnh sau):

- **A:** Build SVG illustration + CSS-driven mock — nhìn vẫn pro, không cần licence ảnh thật.
- **C:** Face mesh "wireframe abstract" làm centerpiece, không cần ảnh người.
- **Image slot:** chuẩn bị sẵn `imageSrc` props ở các component có khả năng host ảnh thật.

Cụ thể 7 changes:

| # | Thay đổi | Component |
|---|---|---|
| 1 | Build FaceScanVisualizer (468 landmark dot + mesh line + scan sweep + HUD chrome) | `face-scan-visualizer.tsx` (mới) |
| 2 | Rework Hero — bỏ 3 floating card, dùng FaceScanVisualizer làm right column | `hero.tsx` |
| 3 | Dark Process Timeline — slate/violet panel với mesh blob | `process-timeline.tsx` |
| 4 | Restructure MetricsGrid — featured face heatmap + detail grid | `metrics-grid.tsx` |
| 5 | Build SkinMacro — 4 CSS-gradient texture "macro skin" với AI hotspot + crosshair | `skin-macro.tsx` (mới) |
| 6 | Build BeforeAfter — slider kéo so sánh tuần 0 vs tuần 4 | `before-after.tsx` (mới) |
| 7 | SocialProof testimonials → horizontal scroll-snap | `social-proof.tsx` |
| 8 | FAQ → warm peach/cream panel | `faq.tsx` |

(Có thêm change #8 — FAQ warm panel — được làm chung với batch.)

---

## 4. Thay đổi theo section

### 4.1 Hero — Face Scanner thay 3 value-prop card

**Trước:**
- 3 floating `ValueCard` (AI Vision 3D / Routine Tinh Gọn / Bối Cảnh Cá Nhân Hóa) overlap nhau với z-index lệch + parallax.
- Lặp lại thông tin mà các section khác cover sâu hơn (Process Timeline, Metrics Grid).

**Sau:**
- Right column = `FaceScanVisualizer` (xem §5.1).
- Left column: badge + headline + sub + IrisCta + **stat chip strip** (3 chip: `468 điểm mốc khuôn mặt` · `11 chỉ số đo lường` · `60s mỗi lượt quét`).
- `value-card.tsx` bị xóa, không còn được dùng.

**Lý do:** chính FaceScanVisualizer đang demo "AI Vision 3D" + "11 chỉ số" — không cần card text nữa. Routine và bối cảnh đã được kể ở Process Timeline (dark) và sub-headline.

### 4.2 ProcessTimeline → dark panel

**Trước:** Glass card trên light mesh background — không phá nhịp.

**Sau:** Wrapped trong `<DarkPanel>` component (local) với:
- Background: `linear-gradient(180deg, #0f172a, #1e1b4b, #0f172a)` (slate-violet sandwich).
- 3 mesh blob: tím (top-left), xanh (bottom-right), teal (middle-right).
- Faint grid pattern 44×44px.
- Card: `DARK_GLASS` token (`rgba(255,255,255,0.06)` background, viền trắng mờ).
- Step number giờ dùng mono font + accent color của bước đó.
- Connector line đậm hơn (alpha 0.65 thay vì 0.45).

**Effect:** chuyển từ "light glass" sang "scanner room" — tạo material contrast.

### 4.3 MetricsGrid — featured face heatmap

**Trước:** Grid 11 thẻ giống hệt (cùng kích cỡ, cùng padding).

**Sau:** Layout 2 phần:

1. **Featured card (full width):**
   - Left (lg): `FaceHeatmap` — SVG khuôn mặt nhạt với 11 hotspot pulse, mỗi hotspot màu theo accent của metric đó.
   - Right (lg): copy "Bản đồ chỉ số" + chip strip 11 màu.
2. **Detail grid (dưới):** vẫn 11 thẻ — giờ là "đọc tiếp" sau khi đã nhìn vào face.

**Position của hotspots** được hardcode theo giải phẫu da:
- Hydration → trán (240, 145)
- Sebum → vùng chữ T (240, 320)
- Acne → má trái (165, 295)
- Pore → má phải (315, 295)
- Pigmentation → vùng zygomatic trái (145, 250)
- Wrinkle → trán cao (240, 110)
- Tone evenness → cheek phải (335, 250)
- Redness → má dưới trái (175, 340)
- Texture → má dưới phải (305, 340)
- Dark circles → vùng mắt (200, 235)
- Blackheads → mũi/cằm (240, 360)

### 4.4 SkinMacro (mới) — "đây là cái AI nhìn"

Section hoàn toàn mới, đặt giữa MetricsGrid và SliderDemo. Cấu trúc:

- Header: badge "Tầm nhìn vi mô" + h2 "Đây là cái AI đang thấy. Còn mắt thường thì chưa."
- Grid 4 cột (2×2 trên mobile): 4 macro card.

Mỗi card có:
- **Texture preview** (aspect-square): composite của 4–7 radial-gradient layer mô phỏng skin macro.
- **AI hotspot markers**: 3–5 chấm màu pulse trên texture.
- **Crosshair viewfinder**: 8 corner tick + center crosshair (SVG `vector-effect="non-scaling-stroke"`).
- **AI metric badge** (góc trái dưới): chip đen mờ với mono font + dot xanh active.
- **Caption** (dưới preview): tên + 1 dòng mô tả.

4 macro types:
- **Da khô** (`Độ ẩm 32`) — base beige + cracks suggestion.
- **Da dầu** (`Bã nhờn 78`) — peach base + highlights phản chiếu.
- **Da mụn** (`Mụn viêm 64`) — pink base + 5 hotspot đỏ inflamed.
- **Sắc tố** (`Pigmentation 71`) — sand base + 4 patches nâu.

### 4.5 BeforeAfter (mới) — slider kéo

Section mới đặt sau ReportPreview. Cấu trúc:

- Header: badge "Tiến trình có thật" + h2 "Sau 4 tuần. **Cùng một khuôn mặt.**" (phần sau gradient iris)
- Grid 2 cột:
  - **Left (1.4fr):** comparison slider 16:10 — drag handle dọc với grip arrow.
  - **Right (1fr):** 3 stat card showing improvement (Mụn viêm 64→28, Độ ẩm 32→71, Đỏ da 58→24).

Implementation:
- Track `<div ref>` với `onPointerDown/Move` set position (0–100%).
- "BEFORE" layer full inset, "AFTER" layer với `clip-path: inset(0 0 0 X%)`.
- Handle: SVG arrow trong circle trắng + glow line dọc.
- Keyboard: ← → tăng giảm 5% mỗi lần.
- Aria: `role="slider" aria-valuemin/max/now`.

CSS texture giống vocabulary của SkinMacro (composite radial-gradient).

### 4.6 SocialProof testimonials → horizontal scroll

**Trước:** Grid 3 cột tĩnh.

**Sau:** `flex overflow-x-auto snap-x snap-mandatory` rail:
- Mỗi card `width: min(86vw, 380px)`.
- `scrollbar-width: none` (ẩn scrollbar).
- `scroll-padding-left/right: 1rem` để first/last card không crash vào section gutter.
- Trailing spacer 1px để last card snap đúng.
- Edge fade overlay (chỉ hiện trên `lg:` — pseudo white-gradient mask 2 bên).
- Hint text "Vuốt ngang để xem thêm →" dưới rail.

### 4.7 FAQ → warm panel

**Trước:** FAQ items trên light mesh background trong suốt.

**Sau:** Wrapped trong `<WarmPanel>` (local component, đối xứng với DarkPanel):
- Background: `linear-gradient(180deg, #fff7ed, #fef3c7, #fce7f3)` — peach → cream → pink.
- 2 blob: orange top-left, pink bottom-right.
- Border + inset shadow ấm.
- Eyebrow dot đổi từ indigo sang orange.

---

## 5. Component mới

### 5.1 `face-scan-visualizer.tsx` (517 dòng)

Centerpiece của Phase C. Stylized face mesh trong viewBox 480×600:

**Layers (back to front):**
1. Slate-violet panel background với 2 iris blob + grid pattern.
2. **Face outline** SVG path (`stroke-dasharray` animation `pathLength: 0 → 1`).
3. **Mesh lines** — ~70 line connecting adjacent dots (triangulation).
4. **Dot landmarks** — ~130 hardcoded positions trong DOTS array, staggered fade-in.
5. **Hotspot pulses** — 4 colored hotspot (Hydration, Pore, Sebum, Dark Circle) với outer ring pulse + solid core + white center.
6. **Scan line** — gradient horizontal line sweeping `y: 8% → 92% → 8%` mỗi 4.5s.
7. **HUD chrome:**
   - Top: `AI SCAN · ACTIVE` (emerald pulse dot) + `468 LANDMARKS`.
   - Bottom: `MODEL · FaceMesh v3.2` + `METRICS · 11/11`.
8. **Hotspot annotation chips** — floating ở mép trái/phải với connector dashed line.

**Animation timeline:**
- 0.0–1.4s: Face outline draws.
- 1.0–2.6s: Mesh lines fade in (stagger 15ms each).
- 1.4–3.0s: Dots populate (stagger 12ms each).
- 2.4s+: Scan line bắt đầu loop.
- 2.6–3.8s: 4 hotspots fade in + start pulse loop.

**Reduced motion:** scan line + hotspot pulse + HUD pulse đều disabled.

### 5.2 `skin-macro.tsx` (282 dòng)

4 macro card với CSS composite gradient. Mỗi card được data-driven từ MACROS array:

```ts
type Macro = {
  id: string;
  label: string;            // "Da khô"
  metric: string;           // "Độ ẩm 32"
  body: string;             // 1 dòng mô tả
  background: string;       // CSS composite (multiple radial-gradient)
  hotspots?: Array<{ x: string; y: string; color: string; size: number }>;
  imageSrc?: string;        // SLOT cho ảnh thật
};
```

Khi `imageSrc` được set, `<img>` overlay lên CSS texture (object-cover).

### 5.3 `before-after.tsx` (332 dòng)

Comparison slider component với props:

```ts
type Props = {
  beforeSrc?: string;       // SLOT
  afterSrc?: string;        // SLOT
};
```

3 STATS hardcode (Mụn viêm / Độ ẩm / Đỏ da) — bạn có thể sửa ở line ~25.

---

## 6. Material & color rhythm

Material rhythm cuối Phase C:

```
Nav (light glass)
  ↓
Hero (light glass + DARK face scanner sub-panel)
  ↓
Process (DARK slate-violet panel)             ← contrast moment 1
  ↓
Metrics (light glass + featured face heatmap)
  ↓
SkinMacro (photographic textures + viewfinder chrome)
  ↓
SliderDemo (light glass)
  ↓
Report (light glass + phone frame)
  ↓
BeforeAfter (photographic textures + draggable comparison)
  ↓
SocialProof (light glass + horizontal scroll)
  ↓
FAQ (WARM peach/cream panel)                  ← contrast moment 2
  ↓
FinalCta + Footer (light glass)
```

Mỗi section giờ có anatomy riêng — đã giải quyết được tell #3 (cùng anatomy lặp lại).

---

## 7. Image slot wiring

Tổng 6 slot cho ảnh thật user sẽ cấp:

### 7.1 SkinMacro — 4 macro photo

File: `src/components/landing/skin-macro.tsx`, sửa MACROS array:

```ts
const MACROS: Macro[] = [
  { id: "dry", imageSrc: "/macros/dry.jpg", ... },
  { id: "oily", imageSrc: "/macros/oily.jpg", ... },
  { id: "acne", imageSrc: "/macros/acne.jpg", ... },
  { id: "pigment", imageSrc: "/macros/pigment.jpg", ... },
];
```

Thả ảnh vào `public/macros/`. Aspect square được ưu tiên (component dùng `aspect-square`).

### 7.2 BeforeAfter — 2 ảnh tiến trình

File: `src/app/home-client.tsx`, truyền props:

```tsx
<BeforeAfter
  beforeSrc="/progress/week-0.jpg"
  afterSrc="/progress/week-4.jpg"
/>
```

Thả ảnh vào `public/progress/`. Aspect 16:10 được ưu tiên.

### 7.3 (Optional) FaceScanVisualizer face image

Hiện tại centerpiece là SVG. Nếu muốn thay bằng ảnh khuôn mặt thật + dot overlay:
- Thêm `imageSrc` prop vào `FaceScanVisualizer`.
- Khi set, render `<img>` làm background layer (z thấp nhất), giữ SVG dot/mesh overlay phía trên.
- Phải align dot positions với ảnh thật (manual tweak DOTS array hoặc dùng MediaPipe landmarks thực tế).

Chưa wire vì không chắc user có muốn ảnh face thật ở đây — hiện SVG đang đủ "wow" và không yêu cầu model release từ người trong ảnh.

---

## 8. Cấu trúc file & line count

```
src/app/home-client.tsx                                56 dòng (composition root)
src/components/landing/
├─ landing-tokens.ts                                   49
├─ iris-cta.tsx                                        68
├─ nav-bar.tsx                                        114
├─ hero.tsx                                           150
├─ face-scan-visualizer.tsx          [NEW]            517
├─ process-timeline.tsx              [updated dark]   312
├─ metrics-grid.tsx                  [restructured]   385
├─ skin-macro.tsx                    [NEW]            282
├─ slider-demo.tsx                                    378
├─ report-preview.tsx                                 349
├─ before-after.tsx                  [NEW]            332
├─ social-proof.tsx                  [updated scroll] 299
├─ faq.tsx                           [updated warm]   174
├─ final-cta.tsx                                      130
├─ footer.tsx                                         114
└─ sticky-mobile-cta.tsx                               62
                                            Total: 3771 dòng / 16 file
```

File bị xóa trong Phase C:
- `value-card.tsx` (79 dòng) — không còn dùng sau khi Hero rework.

---

## 9. Caveats & hạn chế

### 9.1 Visual verification chưa được thực hiện

Tôi (AI engineer) không có browser screenshot tool. Tất cả verification ở Phase C chỉ ở mức:
- ✅ `npx tsc --noEmit` clean.
- ✅ `npx eslint src/components/landing/` clean.
- ✅ `npm run build` pass (~3s compile + static prerender of `/`).
- ✅ `curl localhost:3000/` trả 200 OK với đầy đủ text content của 11 section.

**Không verified bằng mắt:**
- FaceScanVisualizer dot positions có "đọc ra mặt người" không, hay quá abstract.
- Dark Process panel có jarring với section liền trước không.
- 11 hotspot trên FaceHeatmap có đúng giải phẫu không.
- BeforeAfter slider handle có đủ rõ khi kéo không.
- Horizontal scroll testimonials có natural trên mobile không.
- Warm FAQ panel có "nóng" quá so với phần trên không.

### 9.2 Testimonial là placeholder

3 testimonial trong `social-proof.tsx` (Lan/Khoa/My) là **placeholder content**, kèm disclaimer `*Phản hồi từ beta tester, lược trích và biên tập gọn.` ở dưới rail.

Khi có testimonial thật:
- Sửa TESTIMONIALS array ở đầu file.
- Cập nhật initial + meta + body.
- Nếu có avatar thật, đổi từ initials block sang `<img>` 36×36 rounded.

### 9.3 BeforeAfter stats là placeholder

`STATS` array trong `before-after.tsx` (3 metric với delta) là placeholder. Khi có data thật từ beta test, sửa values.

### 9.4 Performance check chưa làm

Phase C thêm nhiều animation (`AnimatePresence`, `useTransform`, infinite scan-line, hotspot pulse loops). Chưa benchmark:
- FPS trên iPhone 12-tier device khi cuộn toàn trang.
- `will-change` budget — GPU đã được ép qua `GPU` token nhưng nhiều layer compose có thể vẫn nặng.
- Hot-load size sau khi gzip.

Khi launch beta, cần:
- Lighthouse mobile run.
- Chrome DevTools Performance trace khi cuộn full page.
- Bundle analyze (Next.js `@next/bundle-analyzer`).

---

## 10. Bước tiếp theo

### 10.1 User-supplied images (4–6 ảnh)

User sẽ cấp:
- 4 ảnh macro da (dry / oily / acne / pigmented) → `public/macros/*.jpg`
- 2 ảnh tiến trình (week 0 / week 4) → `public/progress/*.jpg`

Wire bằng cách sửa MACROS array + truyền props cho `<BeforeAfter>`.

### 10.2 Optional polish

- **Lazy load** face scanner dưới `lg:` breakpoint — Hero phone version có thể dùng tĩnh + còn lại lazy.
- **Reduce motion fallback** — kiểm tra mọi animation có hide đúng khi `useLowPower().reduced === true`.
- **Theme dark mode** — currently chỉ light theme; Process panel + FAQ panel đã có "dark moment", nếu support dark mode toàn trang cần re-tune contrast.
- **i18n** — toàn bộ copy đang VN hardcode trong component. Nếu mở rộng EN, cần move sang `src/lib/translations.ts`.

### 10.3 Optional sections (Phase D nếu cần)

- **Pricing / Tier** — hiện freemium 100%, nhưng nếu launch paid tier thì cần section riêng.
- **Press / Awards** — khi có logo báo chí / award.
- **Brand story** — "Made in Đà Nẵng" deeper story với team photo.

---

## Phụ lục — Token reference

Các token shared dùng xuyên Phase C, định nghĩa ở `landing-tokens.ts`:

| Token | Giá trị | Mục đích |
|---|---|---|
| `SPRING` | `{ type: "spring", stiffness: 100, damping: 20 }` | Mọi transition (soft bouncy Apple Showcase 2026) |
| `GPU` | `{ willChange: "transform, opacity", transform: "translateZ(0)" }` | Ép compositor layer cho mọi animated surface |
| `fadeUp` | `{ hidden: { opacity: 0, y: 36 }, show: { opacity: 1, y: 0, transition: SPRING } }` | Scroll-reveal variant |
| `stagger` | `{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }` | Parent variant |
| `GLASS` | `rgba(255,255,255,0.55)` + blur(28px) saturate(180%) + viền + shadow | Card base trên light bg |
| `GLASS_LIGHT` | `rgba(255,255,255,0.55)` + blur(20px) — nhẹ hơn GLASS | Chip / pill / eyebrow |

Token local trong Phase C (không được export, chỉ dùng trong 1 file):
- `DARK_GLASS` — trong `process-timeline.tsx`, base `rgba(255,255,255,0.06)`.
- `BEFORE_BG` / `AFTER_BG` — composite gradient trong `before-after.tsx`.
