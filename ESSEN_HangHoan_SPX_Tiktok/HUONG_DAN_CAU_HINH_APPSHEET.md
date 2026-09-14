# HƯỚNG DẪN CHI TIẾT CẤU HÌNH APPSHEET QUÉT MÃ VẬN ĐƠN
### (Hỗ trợ quét liên tục nhiều đơn siêu tốc & Tự động hợp nhất ô ngày)

Tài liệu này hướng dẫn bạn từng bước từ lúc chuẩn bị Google Sheet đến khi hoàn thiện ứng dụng trên điện thoại để quét mã QR / Barcode vận chuyển.

---

## PHẦN 1: CHUẨN BỊ GOOGLE SHEETS & TỰ ĐỘNG GỘP Ô NGÀY

### Bước 1: Tạo bảng tính Google Sheet mới
1. Truy cập [Google Sheets](https://sheets.google.com) và tạo một bảng tính mới.
2. Đổi tên bảng tính thành: **`ESSEN | Hàng hoàn SPX/Tiktok`**.
3. Đổi tên trang tính đầu tiên thành: **`DATA_QUET`**.
4. Điền tiêu đề cho 4 cột tại dòng 1:
   - Ô **A1**: `ID`
   - Ô **B1**: `NgayQuet`
   - Ô **C1**: `MaVanDon`
   - Ô **D1**: `GhiChu`

*(Bạn cũng có thể mở tệp [DATA_QUET.csv](./DATA_QUET.csv) có sẵn trong thư mục để sao chép vào)*.

### Bước 2: Cài đặt Apps Script để tự động tạo Sheet theo Tháng (T9, T10...) và gộp ô chuẩn mẫu
1. Trên Google Sheets, chọn menu **Tiện ích mở rộng (Extensions)** ➔ **Apps Script**.
2. Xóa hết mã mặc định và dán toàn bộ nội dung từ tệp [Code.gs](./Code.gs).
3. Bấm **Lưu (Save / Biểu tượng đĩa mềm)** và đặt tên dự án là `QuanLyVanDonScript`.
4. Quay lại bảng tính Google Sheets và tải lại trang (F5):
   - Bạn sẽ thấy xuất hiện menu mới: **`📦 Quản Lý Vận Đơn`**.
   - Bấm vào menu chọn: **`⚡ Bật Tự Động Đồng Bộ (Khi AppSheet Quét Đơn Mới)`**.
   - (Lần đầu chạy, Google sẽ yêu cầu cấp quyền truy cập, bạn bấm *Nâng cao / Advanced* ➔ *Đi tới QuanLyVanDonScript (Không an toàn)* ➔ *Cho phép*).
   - **Hoàn tất!**
     - Hệ thống sẽ tự động tạo ra các trang tính tương ứng với từng tháng (ví dụ quét trong tháng 9 sẽ tạo sheet **`T9`**, tháng 10 sẽ tạo **`T10`**...).
     - Giao diện trên các sheet tháng sẽ được định dạng **chuẩn 100% theo mẫu**:
       + Dòng 1: Thanh tiêu đề màu Xanh lá cây (`KHO ĐIỂN`).
       + Dòng 2: Tiêu đề màu xám (`Ngày` | `STT` | `Mã vận đơn` | `Note`).
       + Dữ liệu: Cột Ngày hiển thị dạng `10/9` (hợp nhất ô theo ngày), Cột STT đếm từ 1 theo ngày, kẻ viền đen sắc nét.

> [!CAUTION]
> **QUY TẮC BẮT BUỘC ĐỂ HỆ THỐNG HOẠT ĐỘNG ỔN ĐỊNH**:
> - Giữ nguyên trang tính **`DATA_QUET`** làm nguồn nạp dữ liệu phẳng của AppSheet (không hợp nhất ô trên `DATA_QUET`).
> - Mọi thao tác xem, in ấn, báo cáo sẽ được xem trên các trang tính tháng: **`T9`**, **`T10`**, **`T11`**, **`T12`**...

---

## PHẦN 2: KHỞI TẠO ỨNG DỤNG APPSHEET

1. Trên Google Sheet, bấm menu **Tiện ích mở rộng (Extensions)** ➔ **AppSheet** ➔ **Tạo ứng dụng (Create an app)**.
2. Đăng nhập tài khoản Google của bạn. AppSheet sẽ tự động nhận diện bảng tính `DATA_QUET` và mở giao diện chỉnh sửa AppSheet.

---

## PHẦN 3: CẤU HÌNH DỮ LIỆU CỘT (DATA > COLUMNS)

Tại thanh điều hướng bên trái của AppSheet, chọn biểu tượng **Data** (hoặc bảng `DATA_QUET`):

| Tên Cột | Cấu hình bắt buộc | Chi tiết cài đặt |
| :--- | :--- | :--- |
| **`ID`** | Type: `Text` | - Tick chọn **Key**<br>- Bỏ tick **Show** (ẩn khỏi mắt người dùng)<br>- Initial Value: `UNIQUEID()` |
| **`NgayQuet`** | Type: `Date` | - Initial Value: `TODAY()`<br>- Bỏ tick **Editable** (để ngày luôn tự động lấy ngày hiện tại) |
| **`MaVanDon`** | Type: `Text` | - **Tick chọn `Scannable`** (kích hoạt camera quét mã)<br>- Tick chọn **`Required`** (bắt buộc phải có mã)<br>- **Cảnh báo trùng lặp (Valid_If)**: Xem chi tiết ở Phần 3.1 bên dưới |
| **`GhiChu`** | Type: `Text` | - Để mặc định, tùy chọn |

---

### PHẦN 3.1: CẤU HÌNH THÔNG BÁO & CHẶN QUÉT TRÙNG MÃ VẬN ĐƠN

Để ứng dụng phát hiện và bật cảnh báo khi bạn quét phải một mã vận đơn đã tồn tại:

1. Trong **Data > Columns > DATA_QUET**, bấm vào biểu tượng chiếc bút (Edit) bên cạnh cột **`MaVanDon`**.
2. Cuộn xuống mục **Data Validity**:
   - Tại ô **Valid_If**, dán công thức sau:
     - **Tùy chọn A (Mặc định - Chặn trùng trong toàn bộ lịch sử)**:
       ```excel
       NOT(IN([_THIS], SELECT(DATA_QUET[MaVanDon], [ID] <> [_THISROW].[ID])))
       ```
     - **Tùy chọn B (Chỉ chặn nếu trùng trong cùng ngày quét)**:
       ```excel
       NOT(IN([_THIS], SELECT(DATA_QUET[MaVanDon], AND([ID] <> [_THISROW].[ID], [NgayQuet] = [_THISROW].[NgayQuet]))))
       ```
     *(Giải thích: Công thức kiểm tra xem mã vừa quét đã tồn tại trước đó chưa)*.
   - Tại ô **Invalid value error**, nhập câu thông báo bạn muốn hiển thị, ví dụ:
     ```excel
     "⚠️ CẢNH BÁO: Mã vận đơn này đã được quét trước đó!"
     ```
3. **Cơ chế hoạt động khi quét liên tục (Auto-save)**:
   - Khi quét mã mới: Form hợp lệ ➔ Máy tự động lưu và mở tiếp camera.
   - Khi quét trúng mã đã có trong hệ thống: AppSheet sẽ **chặn lại ngay lập tức (không lưu vào Google Sheet)** và **bật khung cảnh báo màu đỏ** cùng dòng chữ *"⚠️ CẢNH BÁO: Mã vận đơn này đã được quét trước đó!"* để bạn nhận biết kiện hàng này đã qua kiểm đếm.

---

## PHẦN 4: THIẾT LẬP "QUÉT LIÊN TỤC NHIỀU ĐƠN SIÊU TỐC" (CONTINUOUS SCAN)

Quy trình này giúp bạn chỉ cần lia camera vào mã tem, máy bíp nhận diện là tự lưu và ngay lập tức mở lại camera cho đơn kế tiếp mà không cần bấm tay.

### Bước 1: Tạo Action vòng lặp quét tiếp
1. Vào menu bên trái chọn **Behaviors** ➔ **Actions** ➔ Bấm **`+ Add Action`** (hoặc Create a new action).
2. Thiết lập thông số:
   - **Action name**: `Quet_Tiep_Tuc`
   - **For a record of table**: `DATA_QUET`
   - **Do this**: `App: go to another view within this app`
   - **Target**: Dán công thức sau:
     ```excel
     LINKTOFORM("QUET_NHANH", "NgayQuet", TODAY())
     ```
   - **Prominence**: Chọn `Do not display` (để ẩn nút này trên màn hình).

### Bước 2: Cấu hình Form View quét nhanh
1. Vào menu bên trái chọn **UX** (hoặc **App** / **Views**).
2. Bấm **`+ Add View`** ➔ Chọn **Create a new view**:
   - **View name**: `QUET_NHANH`
   - **For this data**: `DATA_QUET`
   - **View type**: `Form`
3. Cuộn xuống phần **Form View Settings**:
   - **Column order**: Bấm Add để chọn hiển thị cột `MaVanDon` (có thể thêm `GhiChu` nếu muốn).
   - **Auto-save**: **BẬT (ON)** (tự động lưu ngay khi quét xong).
   - **Advance forms automatically**: **BẬT (ON)**.
4. Cuộn xuống mục **Behavior** ➔ **Event Actions**:
   - Tại dòng **Form Saved**: Chọn Action `Quet_Tiep_Tuc` vừa tạo ở Bước 1.

---

## PHẦN 5: CẤU HÌNH MÀN HÌNH THEO DÕI ĐƠN THEO NGÀY (UX VIEWS)

1. Tạo hoặc chỉnh sửa View danh sách đơn (Đặt tên: `DANH_SACH_DON`).
2. Cấu hình thông số:
   - **For this data**: `DATA_QUET`
   - **View type**: `Deck` hoặc `Table`.
   - **Sort by**: `NgayQuet` (Descending - mới nhất xếp trên).
   - **Group by**: 
     - Chọn cột: `NgayQuet`
     - Thứ tự: `Descending`
   - **Group aggregate**: Chọn `Count`.
3. **Kết quả**: Trên app, các mã vận đơn sẽ được tự động gom thành từng khối theo ngày tháng (ví dụ: `14/09 (25 đơn)`), bấm vào ngày nào sẽ sổ ra toàn bộ mã vận đơn quét của ngày đó!

---

## PHẦN 6: CÀI ĐẶT VÀ SỬ DỤNG TRÊN ĐIỆN THOẠI

1. Vào **Google Play Store (Android)** hoặc **App Store (iOS)** tìm kiếm và cài đặt ứng dụng: **`AppSheet`**.
2. Mở ứng dụng AppSheet và đăng nhập bằng tài khoản Google đã tạo app.
3. Mở ứng dụng `ESSEN | Hàng hoàn SPX/Tiktok` vừa tạo.
4. Lần đầu mở tính năng quét, điện thoại sẽ hỏi quyền camera ➔ Chọn **Cho phép khi dùng ứng dụng**.
5. Đưa camera vào mã vạch (Barcode) hoặc mã QR trên tem kiện hàng ➔ Máy quét thành công và ngay lập tức tiếp tục mở camera cho đơn kế tiếp.
6. Dữ liệu sẽ tự động đẩy về Google Sheets tức thì! Khi cần xuất báo cáo đẹp mắt, chỉ cần mở Google Sheet và bấm menu **`📦 Quản Lý Vận Đơn`** ➔ **`🔄 Cập nhật Sổ Theo Dõi (Gộp ngày)`**.
