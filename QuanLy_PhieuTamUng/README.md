# 💼 HỆ THỐNG QUẢN LÝ & KÝ DUYỆT PHIẾU TẠM ỨNG DOANH NGHIỆP
### (Tối ưu hóa bảng tính & Vận hành theo Quy trình thực tế 5 bước)

Hệ thống được thiết kế tinh gọn, chuẩn hóa theo thực tế vận hành doanh nghiệp Việt Nam và tuân thủ chế độ kế toán theo **Mẫu số 03 - TT (Thông tư 200/2014/TT-BTC & Thông tư 133/2016/TT-BTC)**.

---

## 🔄 QUY TRÌNH DUYỆT 5 BƯỚC THỰC TẾ
```
[1. Nhân viên lập đơn] ➔ [2. Kế toán duyệt] ➔ [3. Tôi trình Sếp] ➔ [4. Sếp duyệt] ➔ [5. Tôi in phiếu đưa KT xuất tiền] ➔ [6. Đã xuất tiền & Quyết toán]
```

1. **Bước 1 (Nhân viên)**: Nhân viên tạo giấy đề nghị tạm ứng, tự điền số tiền cần xin và đính kèm dự toán/kế hoạch.
2. **Bước 2 (Kế toán)**: Kế toán thẩm định hồ sơ, kiểm tra định mức chi phí và bấm duyệt chuyển sang Bạn ("Tôi").
3. **Bước 3 (Bạn phụ trách - "Tôi")**: Kiểm tra nội dung công việc và bấm **"🚀 Trình Sếp phê duyệt"**.
4. **Bước 4 (Sếp - Ban Giám Đốc)**: Sếp xem xét trên điện thoại/máy tính và bấm phê duyệt chuẩn chi.
5. **Bước 5 (Bạn phụ trách & Kế toán)**: Bạn bấm in **Phiếu Tạm Ứng (Mẫu 03-TT)** giấy chuyển sang phòng Kế toán. Kế toán thực hiện chi tiền mặt hoặc chuyển khoản ngân hàng.
6. **Bước 6 (Hoàn ứng)**: Nhân viên đi công tác/mua sắm về nộp hóa đơn VAT để quyết toán tất toán tạm ứng.

---

## 📂 DANH MỤC CÁC TỆP TRONG DỰ ÁN

```
QuanLy_PhieuTamUng/
├── PHIEU_TAM_UNG.csv             # Bảng chính gồm 35 cột tinh gọn chuẩn nghiệp vụ
├── CHI_TIET_TAM_UNG.csv          # Bảng phụ bóc tách các mục chi phí dự toán (Tùy chọn)
├── DANH_MUC_NHAN_VIEN.csv        # Danh bạ nhân sự, phân quyền 4 vai trò & STK nhận tiền
├── DANH_MUC_HANG_MUC.csv         # 6 Khoản mục chi phí chuẩn theo chế độ kế toán
├── Code.gs                       # Kịch bản Apps Script gửi email tự động & 1-click tạo sheet
├── HUONG_DAN_CAU_HINH_APPSHEET.md# Cẩm nang cấu hình Actions, Slices, Column Rules từ A-Z
├── index.html                    # Ứng dụng Web tương tác mô phỏng 100% quy trình thực tế
└── README.md                     # Tài liệu tổng quan
```

---

## ⚡ KHỞI TẠO BẢNG TÍNH GOOGLE SHEETS TRONG 30 GIÂY

Không cần phải gõ tay hoặc import thủ công từng file CSV:
1. Mở một Google Spreadsheet trống.
2. Vào **Tiện ích mở rộng (Extensions)** ➔ **Apps Script**.
3. Dán toàn bộ mã từ file [`Code.gs`](./Code.gs) vào và bấm **Lưu**.
4. Tải lại trang Google Sheet (F5) ➔ Nhấp vào menu **`💰 Quản Lý Phiếu Tạm Ứng`** ➔ Chọn:
   👉 **`🛠️ Khởi tạo / Tinh gọn 4 Sheet Chuẩn Doanh Nghiệp`**.
5. Toàn bộ 4 tab (`PHIEU_TAM_UNG`, `CHI_TIET_TAM_UNG`, `DANH_MUC_NHAN_VIEN`, `DANH_MUC_HANG_MUC`) sẽ được tự động tạo lập, kẻ bảng, đóng băng dòng tiêu đề Navy sang trọng và nạp sẵn dữ liệu mẫu!
6. Bấm tiếp: **`⚡ Kích Hoạt Tự Động Gửi Email (Khi AppSheet Lưu)`** để kích hoạt gửi email thông báo hoàn toàn miễn phí.
