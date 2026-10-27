# HƯỚNG DẪN CẤU HÌNH BẢNG TÍNH & APPSHEET TINH GỌN DOANH NGHIỆP
### (Tối ưu cho Quy trình 5 bước: Nhân viên ➔ Kế toán duyệt ➔ Bạn trình Sếp ➔ Sếp duyệt ➔ Bạn in phiếu đưa Kế toán xuất tiền)

---

## 🚀 CÁCH KHỞI TẠO BẢNG TÍNH NHANH NHẤT (1 CÚ CLICK)

Nếu bạn vừa tạo 1 file Google Sheets mới hoặc muốn chuẩn hóa lại bảng tính hiện tại mà không phải gõ tay từng tên cột:
1. Mở file Google Sheets của bạn.
2. Vào **Tiện ích mở rộng (Extensions)** ➔ **Apps Script**.
3. Dán toàn bộ nội dung từ file [`Code.gs`](./Code.gs) vào và bấm **Lưu (Save)**.
4. Tải lại trang Google Sheet (F5) ➔ Trên thanh menu sẽ xuất hiện: **`💰 Quản Lý Phiếu Tạm Ứng`**.
5. Nhấp chọn: **`🛠️ Khởi tạo / Tinh gọn 4 Sheet Chuẩn Doanh Nghiệp`**.
6. Hệ thống sẽ tự động tạo đủ 4 Tab dữ liệu chuẩn với tiêu đề Navy chuyên nghiệp, đóng băng dòng 1, định dạng số tiền VND, và nạp sẵn dữ liệu mẫu!

---

## 📊 CẤU TRÚC 4 SHEET ĐÃ TINH GỌN CHO DOANH NGHIỆP

Hệ thống được tổ chức thành **4 Tab (Trang tính)** trong cùng 1 file Google Spreadsheet:

### 1. Sheet `PHIEU_TAM_UNG` (Bảng chính - Quản lý phiếu và lịch sử phê duyệt)
Bao gồm 35 cột được chia thành các nhóm nghiệp vụ rõ ràng:

| Nhóm nghiệp vụ | Tên cột trên Google Sheet | Kiểu dữ liệu AppSheet | Ý nghĩa & Ghi chú |
| :--- | :--- | :--- | :--- |
| **Thông tin phiếu** | `MaPhieu` | `Text` (Key) | Mã phiếu dạng `TU2610-0001` (Tự sinh) |
| | `NgayDeNghi` | `Date` | Ngày làm đơn (Mặc định `TODAY()`) |
| | `EmailNhanVien` | `Ref` ➔ `DANH_MUC_NHAN_VIEN` | Email người xin tạm ứng (`USEREMAIL()`) |
| | `HoTenNhanVien` | `Text` | Tên nhân viên (Formula: `[EmailNhanVien].[HoTen]`) |
| | `BoPhan` | `Text` | Phòng ban (Formula: `[EmailNhanVien].[BoPhan]`) |
| | `ChucVu` | `Text` | Chức vụ (Formula: `[EmailNhanVien].[ChucVu]`) |
| | `HangMucChi` | `Ref` ➔ `DANH_MUC_HANG_MUC` | Phân loại chi phí (Công tác phí, Tiếp khách,...) |
| | `SoTienTamUng` | `Price` | **Nhân viên tự nhập số tiền cần tạm ứng** |
| | `SoTienBangChu` | `Text` | Số tiền viết bằng chữ (Tự động chuyển đổi) |
| | `LyDoTamUng` | `LongText` | Mục đích xin tạm ứng |
| | `HanQuyetToan` | `Date` | Thời hạn cam kết nộp hóa đơn hoàn ứng |
| | `HinhThucNhan` | `Enum` | `Chuyển khoản` hoặc `Tiền mặt` |
| | `SoTaiKhoan` | `Text` | Số tài khoản nhận tiền |
| | `NganHang` | `Text` | Tên ngân hàng |
| | `ChuTaiKhoan` | `Text` | Tên chủ tài khoản |
| | `ChungTuDinhKem` | `File` / `Image` | Báo giá, kế hoạch công tác kèm theo |
| | `TrangThai` | `Enum` | Trạng thái phiếu (Ẩn trên Form, đổi qua nút bấm) |
| **BƯỚC 1: Kế toán duyệt** | `KeToanDuyet` | `Email` | Email kế toán thẩm định |
| | `NgayKeToanDuyet` | `DateTime` | Thời điểm kế toán duyệt |
| | `NhanXetKeToan` | `Text` | Nhận xét kiểm tra định mức hồ sơ |
| **BƯỚC 2: Tôi trình Sếp** | `NguoiTrinh` | `Email` | Email Bạn (Trưởng bộ phận) phụ trách |
| | `NgayTrinh` | `DateTime` | Thời điểm Bạn bấm chuyển Sếp |
| | `GhiChuTrinh` | `Text` | Ý kiến đề xuất gửi Sếp |
| **BƯỚC 3: Sếp phê duyệt** | `SepDuyet` | `Email` | Email Sếp (Ban Giám Đốc) |
| | `NgaySepDuyet` | `DateTime` | Thời điểm Sếp phê duyệt |
| | `NhanXetSep` | `Text` | Ý kiến chỉ đạo của Sếp |
| **BƯỚC 4: Kế toán xuất tiền** | `NgayChiTien` | `Date` | Ngày kế toán xuất quỹ / chuyển khoản |
| | `NguoiChiTien` | `Text` / `Email` | Thủ quỹ / Kế toán viên chi tiền |
| | `ChungTuChi` | `File` / `Image` | Ủy nhiệm chi ngân hàng hoặc Phiếu chi tiền mặt |
| **BƯỚC 5: Quyết toán hoàn ứng**| `NgayQuyetToan` | `Date` | Ngày nhân viên nộp hóa đơn quyết toán |
| | `SoTienThucChi` | `Price` | Tổng số tiền chi thực tế theo hóa đơn VAT |
| | `TienThuaThieu` | `Price` | Số tiền nhân viên nộp lại quỹ hoặc được chi thêm |
| | `ChungTuQuyetToan` | `File` / `Image` | Hóa đơn đỏ VAT, vé tàu xe thực tế |
| | `GhiChuQuyetToan` | `Text` | Ghi chú hoàn tất quyết toán |
| **Hệ thống tự động** | `TrangThaiDaGuiMail` | `Text` | Lưu vết trạng thái đã gửi mail (chống gửi trùng) |

---

### 2. Sheet `CHI_TIET_TAM_UNG` (Bảng phụ - Dự toán chi tiết bóc tách)
Dùng khi một khoản tạm ứng lớn cần liệt kê chi tiết nhiều khoản mục nhỏ (ví dụ đi công tác 5 triệu gồm: Vé xe 600k, Khách sạn 1tr4, Ăn uống 1tr5, Tiếp khách 1tr5):
- `ID`: Mã dòng chi tiết (Key - `Text`, Initial: `UNIQUEID()`)
- `MaPhieu`: `Ref` ➔ `PHIEU_TAM_UNG` (IsPartOf: TRUE)
- `HangMucChi`: `Text` (Nội dung chi)
- `SoTien`: `Price` (Số tiền của mục đó)
- `GhiChu`: `Text` (Ghi chú chi tiết)

---

### 3. Sheet `DANH_MUC_NHAN_VIEN` (Bảng danh bạ & Phân quyền vai trò)
- `Email`: `Email` (Key) - Địa chỉ Gmail nhân viên dùng đăng nhập AppSheet
- `HoTen`: `Text` - Họ và tên đầy đủ
- `BoPhan`: `Enum` - Phòng ban (Kinh Doanh, Kỹ Thuật, Kế Toán, Hành Chính, Ban Giám Đốc)
- `ChucVu`: `Text` - Chức danh công việc
- `VaiTro`: `Enum` - Phân quyền hệ thống gồm 4 vai trò:
  - `NhanVien`: Nhân viên lập phiếu đề nghị
  - `KeToan`: Kế toán (Duyệt thẩm định & Xuất quỹ chi tiền)
  - `TruongBoPhan` (hoặc `QuanLy`): Bạn ("Tôi") - Tiếp nhận phiếu đã soát, trình Sếp & in phiếu giấy
  - `GiamDoc`: Sếp (Ban Giám Đốc phê duyệt chuẩn chi)
- `SoTaiKhoan`: `Text` - Số tài khoản ngân hàng mặc định
- `NganHang`: `Text` - Tên ngân hàng
- `SoDienThoai`: `Phone` - Số điện thoại liên hệ
- `TrangThai`: `Enum` (`Đang làm việc`, `Đã nghỉ việc`)

---

### 4. Sheet `DANH_MUC_HANG_MUC` (Khoản mục chi phí)
- `MaHangMuc`: `Text` (Key - `HM01`, `HM02`,...)
- `TenHangMuc`: `Text` (Công tác phí, Tiếp khách, Mua sắm vật tư, Sự kiện & Hội thảo, Phúc lợi & Công đoàn, Vận hành khác)
- `MoTa`: `Text`

---

## 🛠️ CẤU HÌNH CHI TIẾT TRÊN APPSHEET

### 1. Bảo vệ cột `TrangThai` (Không cho chỉnh sửa tự do khi tạo phiếu)
- Vào **Data** ➔ Table **`PHIEU_TAM_UNG`** ➔ Cột **`TrangThai`**:
  - **Type**: `Enum`.
  - **Values**: Nhập 7 giá trị:
    1. `Chờ Kế toán duyệt` *(Mặc định)*
    2. `Kế toán đã duyệt - Chờ trình Sếp`
    3. `Chờ Sếp duyệt`
    4. `Sếp đã duyệt - Chờ in phiếu`
    5. `Chờ Kế toán xuất tiền`
    6. `Đã xuất tiền`
    7. `Đã quyết toán`
    8. `Từ chối`
  - **Initial value**: `"Chờ Kế toán duyệt"`
  - **App Formula**: **ĐỂ TRỐNG HOÀN TOÀN**
  - **Editable?**: **TICK CHỌN (TRUE)**
  - **Show?**: Bấm biểu tượng ✏️ ➔ Cuộn xuống ô `Show?` ➔ Nhập công thức:
    ```excel
    CONTEXT("ViewType") <> "Form"
    ```
    *(Tác dụng: Ẩn cột này khi mở Form tạo/sửa phiếu, nhân viên không thể tự ý sửa trạng thái, nhưng các nút Actions vẫn hoạt động 100%).*

---

### 2. Cột `SoTienTamUng` (Nhân viên tự nhập số tiền xin)
- **Type**: `Price`
- **App Formula**: **ĐỂ TRỐNG**
- **Editable?**: **TICK CHỌN (TRUE)**
- **Require?**: **TICK CHỌN (TRUE)**
- **Valid_If**: `[_THIS] > 0`

---

## 🎯 CẤU HÌNH 6 ACTIONS (NÚT BẤM DUYỆT THEO 5 BƯỚC)

Vào mục **Actions** ➔ Chọn Table **`PHIEU_TAM_UNG`**:

### 🔹 Action 1: Kế toán duyệt thẩm định
- **Action name**: `KeToan_Duyet`
- **Do this**: `Data: set the values of some columns in this row`
- **Set these columns**:
  - `TrangThai` = `"Kế toán đã duyệt - Chờ trình Sếp"`
  - `KeToanDuyet` = `USEREMAIL()`
  - `NgayKeToanDuyet` = `NOW()`
- **Only if this condition is true**:
  ```excel
  AND(
    [TrangThai] = "Chờ Kế toán duyệt",
    OR(
      LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "KeToan",
      USEREMAIL() = "ducvuongggnguyen@gmail.com"
    )
  )
  ```
- **Appearance**: Display: `📋 Kế toán duyệt`, Icon: `clipboard-check`.

---

### 🔹 Action 2: Trình Sếp phê duyệt (Dành cho Bạn - "Tôi")
- **Action name**: `Toi_Trinh_Sep`
- **Do this**: `Data: set the values of some columns in this row`
- **Set these columns**:
  - `TrangThai` = `"Chờ Sếp duyệt"`
  - `NguoiTrinh` = `USEREMAIL()`
  - `NgayTrinh` = `NOW()`
- **Only if this condition is true**:
  ```excel
  AND(
    [TrangThai] = "Kế toán đã duyệt - Chờ trình Sếp",
    OR(
      LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "TruongBoPhan",
      LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "QuanLy",
      USEREMAIL() = "gnasche.ai@gmail.com"
    )
  )
  ```
- **Appearance**: Display: `🚀 Trình Sếp phê duyệt`, Icon: `paper-plane`.

---

### 🔹 Action 3: Sếp phê duyệt (Dành cho Sếp)
- **Action name**: `Sep_Phe_Duyet`
- **Do this**: `Data: set the values of some columns in this row`
- **Set these columns**:
  - `TrangThai` = `"Sếp đã duyệt - Chờ in phiếu"`
  - `SepDuyet` = `USEREMAIL()`
  - `NgaySepDuyet` = `NOW()`
- **Only if this condition is true**:
  ```excel
  AND(
    [TrangThai] = "Chờ Sếp duyệt",
    OR(
      LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "GiamDoc",
      USEREMAIL() = "phuongnt.work28@gmail.com"
    )
  )
  ```
- **Appearance**: Display: `👑 Sếp phê duyệt`, Icon: `shield-check`.

---

### 🔹 Action 4: Đã in phiếu & Chuyển Kế toán (Dành cho Bạn)
- **Action name**: `Da_In_Chuyen_KeToan`
- **Do this**: `Data: set the values of some columns in this row`
- **Set these columns**:
  - `TrangThai` = `"Chờ Kế toán xuất tiền"`
- **Only if this condition is true**:
  ```excel
  AND(
    [TrangThai] = "Sếp đã duyệt - Chờ in phiếu",
    OR(
      LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "TruongBoPhan",
      USEREMAIL() = "gnasche.ai@gmail.com"
    )
  )
  ```
- **Appearance**: Display: `🖨️ Đã in & Chuyển Kế toán`, Icon: `print`.

---

### 🔹 Action 5: Kế toán xác nhận xuất tiền
- **Action name**: `KeToan_XuatTien`
- **Do this**: `Data: set the values of some columns in this row`
- **Set these columns**:
  - `TrangThai` = `"Đã xuất tiền"`
  - `NgayChiTien` = `TODAY()`
  - `NguoiChiTien` = `LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "HoTen")`
- **Only if this condition is true**:
  ```excel
  AND(
    [TrangThai] = "Chờ Kế toán xuất tiền",
    OR(
      LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "KeToan",
      USEREMAIL() = "ducvuongggnguyen@gmail.com"
    )
  )
  ```
- **Appearance**: Display: `💵 Kế toán đã xuất tiền`, Icon: `cash-register`.

---

### 🔹 Action 6: Từ chối phiếu (Kế toán hoặc Sếp)
- **Action name**: `Tu_Choi_Phieu`
- **Do this**: `Data: set the values of some columns in this row`
- **Set these columns**:
  - `TrangThai` = `"Từ chối"`
- **Only if this condition is true**:
  ```excel
  AND(
    IN([TrangThai], LIST("Chờ Kế toán duyệt", "Chờ Sếp duyệt")),
    OR(
      LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "KeToan",
      LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "GiamDoc"
    )
  )
  ```
- **Appearance**: Display: `❌ Từ chối`, Color: Đỏ.

---

## 🔍 THIẾT LẬP BỘ LỌC (SLICES) THEO TỪNG VAI TRÒ

### 1. Slice: `Phieu_Cua_Toi` (Nhân viên xem phiếu của chính mình)
- **Table**: `PHIEU_TAM_UNG`
- **Row filter condition**: `[EmailNhanVien] = USEREMAIL()`

### 2. Slice: `Can_Toi_Xu_Ly` (Hiển thị đúng việc cần làm của từng người)
- **Table**: `PHIEU_TAM_UNG`
- **Row filter condition**:
  ```excel
  OR(
    /* Kế toán thấy việc cần duyệt thẩm định & việc cần xuất tiền */
    AND(
      IN([TrangThai], LIST("Chờ Kế toán duyệt", "Chờ Kế toán xuất tiền")),
      LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "KeToan"
    ),
    /* Bạn thấy phiếu cần trình Sếp & phiếu Sếp đã duyệt cần in */
    AND(
      IN([TrangThai], LIST("Kế toán đã duyệt - Chờ trình Sếp", "Sếp đã duyệt - Chờ in phiếu")),
      OR(
        LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "TruongBoPhan",
        USEREMAIL() = "gnasche.ai@gmail.com"
      )
    ),
    /* Sếp thấy phiếu đang chờ Sếp chuẩn chi */
    AND(
      [TrangThai] = "Chờ Sếp duyệt",
      LOOKUP(USEREMAIL(), "DANH_MUC_NHAN_VIEN", "Email", "VaiTro") = "GiamDoc"
    )
  )
  ```
