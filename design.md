# Onboarding UX Design Review (Casa Mika)

## Mục tiêu
Hoàn thiện onboarding theo hướng:
- **Giảm drop-off** ở các bước đầu (đặc biệt trước bước chụp ảnh).
- **Tăng trust** trước khi xin quyền vị trí/camera.
- **Tăng tỉ lệ hoàn tất** qua micro-interactions và save progress.
- **Tạo đầu ra có thể hành động ngay** sau scan (routine + sản phẩm + CTA rõ ràng).

## Đánh giá nhanh flow hiện tại
Flow hiện tại: `Goal → Name → Skin Type → Lifestyle → Photo Scan → Review`.

Điểm mạnh:
- Visual hiện đại, animation mượt, CTA rõ ràng.
- Có loading phrases ở bước phân tích giúp giảm cảm giác chờ đợi.
- Có fallback khi không lấy được GPS.

Điểm cần cải thiện:
1. **Thiếu màn “Expectations/Consent” trước khi xin data nhạy cảm** (location/camera).
2. **Lifestyle đặt trước photo scan** có thể làm tăng ma sát (người dùng chưa thấy giá trị mà đã phải cho GPS).
3. **Chưa có progress save/restore rõ ràng** nếu reload hoặc thoát app.
4. **Review dài, chưa có “quick summary card” ở đầu** cho người lướt nhanh.
5. **Chưa có màn kết thúc onboarding rõ ràng** (next action: theo dõi routine, nhắc lịch, mua sản phẩm).

---

## Luồng onboarding đề xuất (theo thứ tự)

### 0) Welcome + Value Proposition (màn mới)
**Mục tiêu:** tạo trust và set kỳ vọng trước khi bắt đầu.

Nội dung:
- Headline: “Quét da 60 giây, nhận routine cá nhân hóa trong 5 giây”.
- 3 bullet lợi ích: cá nhân hóa theo mục tiêu, thời tiết, thói quen.
- Mini note: “Không thay thế tư vấn y khoa”.
- CTA: `Bắt đầu`.

UX notes:
- Hiển thị “6 bước · ~1 phút” để giảm lo lắng.
- Có link “Xem demo kết quả” (optional).

---

### 1) Goal (giữ lại, chỉnh nhẹ)
- Giữ 3 nhóm goal hiện tại.
- Thêm option thứ 4: **“Chưa chắc / khám phá”** để giảm ép buộc lựa chọn.
- Thêm one-line preview dưới mỗi card: “Bạn sẽ nhận routine tập trung trị mụn/chống lão hóa…”

---

### 2) Name (giữ lại)
- Hợp lý và nhẹ nhàng.
- Bổ sung skip nhỏ: “Dùng tên mặc định” để không chặn flow.

---

### 3) Skin Type Self-check (giữ lại, đổi copy)
- Giữ 4 lựa chọn hiện tại.
- Thêm label mềm: “Ước lượng ban đầu” để giảm áp lực chọn đúng.
- Thêm tooltip ngắn: cách tự nhận biết loại da trong 10 giây.

---

### 4) Permission Primer (màn mới, rất nên có)
**Mục tiêu:** giải thích vì sao cần quyền trước khi popup hệ điều hành xuất hiện.

Nội dung chia 2 block:
1. **Vị trí (optional):** dùng để tính UV/độ ẩm.
2. **Camera (required để scan):** dùng 1 ảnh selfie mặt mộc.

CTA:
- `Tiếp tục` (mặc định)
- `Bỏ qua vị trí` (secondary)

UX notes:
- Nói rõ ảnh chỉ dùng cho phân tích phiên hiện tại (hoặc chính sách lưu trữ cụ thể).

---

### 5) Photo Scan (đưa lên sớm hơn)
**Đề xuất thứ tự mới:** đưa bước scan ảnh **trước** Lifestyle.

Lý do:
- Người dùng thấy “core value” sớm hơn.
- Giảm cảm giác phải điền form dài trước khi nhận kết quả.

Chỉnh sửa UX:
- Thêm overlay guide khuôn mặt (oval framing).
- Thêm quality check cơ bản: quá tối / quá mờ / không thấy mặt rõ.
- Nếu fail quality: gợi ý chụp lại với message cụ thể.

---

### 6) Lifestyle Quick Inputs (rút gọn)
- Sau khi có ảnh, mới hỏi thêm context lifestyle.
- Cho phép **Skip** toàn bộ bước này.
- Nếu không có GPS, default sang city gần nhất theo locale hoặc để null (không hardcode cố định một thành phố).

Nội dung giữ:
- Water slider, sleep slider.
- Weather card chỉ hiển thị khi có data thật.

---

### 7) Deep Analysis Loading (giữ, cải tiến)
- Giữ phrases động.
- Thêm “stage indicator” (Ví dụ: 1/3 Chuẩn hóa ảnh → 2/3 Phân tích vùng da → 3/3 Tạo routine).
- Nếu >8s: hiện fallback text “đang lâu hơn dự kiến” + nút retry mềm.

---

### 8) Review Result (giữ, tái cấu trúc)
Đề xuất cấu trúc mới trên cùng màn:
1. **Quick Summary Card (mới):**
   - Loại da
   - 2 concern chính
   - 1 insight lifestyle quan trọng nhất
2. **Routine AM/PM**
3. **Ingredient focus**
4. **Sản phẩm gợi ý**
5. **Disclaimer**

CTA cuối màn:
- Primary: `Lưu routine của tôi`
- Secondary: `Scan lại`
- Tertiary: `Chia sẻ kết quả`

---

### 9) Onboarding Completion (màn mới)
**Mục tiêu:** chốt hành trình và mở vòng lặp quay lại app.

Nội dung:
- Thành công: “Routine của bạn đã sẵn sàng”.
- Tùy chọn:
  - Nhắc lịch sáng/tối (notification/email).
  - Theo dõi tiến triển da theo tuần.
  - Mở dashboard cá nhân.

CTA:
- `Vào dashboard`
- `Thiết lập nhắc lịch`

---

## Thứ tự flow khuyến nghị (final)
1. Welcome
2. Goal
3. Name
4. Skin Type
5. Permission Primer
6. Photo Scan
7. Lifestyle (optional)
8. Analysis Loading
9. Review
10. Completion

---

## Ưu tiên triển khai (MVP -> nâng cao)

### Ưu tiên P0 (nên làm ngay)
1. Thêm màn **Welcome**.
2. Thêm màn **Permission Primer**.
3. Đổi thứ tự: Photo Scan trước Lifestyle.
4. Thêm **Quick Summary Card** ở đầu Review.

### Ưu tiên P1
1. Thêm quality check ảnh.
2. Cho phép skip Lifestyle.
3. Thêm Completion screen.

### Ưu tiên P2
1. Save/restore state onboarding qua localStorage + server draft.
2. A/B test copy cho Goal và CTA cuối.
3. Theo dõi funnel analytics theo từng step.

---

## Metric cần theo dõi sau khi chỉnh
- Step completion rate từng màn.
- Drop-off tại Permission và Photo Scan.
- Tỉ lệ hoàn tất onboarding.
- Thời gian hoàn tất trung bình.
- Tỉ lệ click CTA “Lưu routine” và “Thiết lập nhắc lịch”.

---

## Gợi ý copy ngắn cho các màn mới

### Welcome
- Title: “Scan da trong 60 giây ✨”
- Subtitle: “Nhận routine cá nhân hóa theo da, mục tiêu và môi trường sống.”

### Permission Primer
- Title: “Cho Mika xin 2 quyền để tư vấn chính xác hơn”
- Vị trí: “Để tính UV/độ ẩm nơi bạn đang ở (có thể bỏ qua).”
- Camera: “Để phân tích ảnh da mặt ở phiên này.”

### Completion
- Title: “Xong rồi, đây là routine dành cho bạn 🎉”
- Subtitle: “Bật nhắc lịch để duy trì đều đặn mỗi ngày.”
