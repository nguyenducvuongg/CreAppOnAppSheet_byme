# 💼 DỰ ÁN NGHIÊN CỨU & PHÁT TRIỂN: HỆ THỐNG QUẢN LÝ & DUYỆT PHIẾU TẠM ỨNG CÔNG TY

Dự án cung cấp giải pháp toàn diện cho nghiệp vụ **Quản lý, Phê duyệt đa cấp và Thanh quyết toán hoàn ứng** cho doanh nghiệp, hỗ trợ triển khai linh hoạt trên cả **Google AppSheet + Google Apps Script** và **Ứng dụng Web Dashboard**.

---

## 📂 Cấu trúc thư mục dự án

```
QuanLy_PhieuTamUng/
├── PHIEU_TAM_UNG.csv             # Cấu trúc bảng chính (Header thông tin phiếu)
├── CHI_TIET_TAM_UNG.csv          # Bảng phụ (Chi tiết từng hạng mục chi phí dự toán)
├── DANH_MUC_NHAN_VIEN.csv        # Danh mục nhân sự & phân quyền vai trò (Role-based)
├── DANH_MUC_HANG_MUC.csv         # Danh mục phân loại chi phí (Công tác phí, Tiếp khách...)
├── Code.gs                       # Mã nguồn Google Apps Script (Trigger, Email, In Mẫu 03-TT)
├── HUONG_DAN_CAU_HINH_APPSHEET.md# Tài liệu hướng dẫn thiết lập chi tiết trên Google AppSheet
├── index.html                    # Ứng dụng Web Prototype tương tác trực tiếp trên trình duyệt
└── README.md                     # Tài liệu giới thiệu tổng quan dự án
```

---

## 🚀 Các tính năng chính

### 1. Quy trình Phê duyệt đa cấp chuẩn mực
- **Cấp 1 - Trưởng bộ phận**: Xét duyệt nhu cầu công tác / mua sắm theo đề xuất của nhân viên.
- **Cấp 2 - Kế toán**: Thẩm định tính hợp lệ của hồ sơ, đối chiếu hạn mức ngân sách và tài khoản nhận tiền.
- **Cấp 3 - Ban Giám Đốc**: Phê duyệt chuẩn chi ngân sách công ty.
- **Giải ngân - Thủ quỹ**: Thực hiện chi tiền mặt hoặc chuyển khoản ngân hàng (hỗ trợ sinh mã QR VietQR tự động).
- **Quyết toán - Hoàn ứng**: Nhân viên nộp chứng từ hóa đơn, hệ thống tự động tính chênh lệch thừa/thiếu để hoàn quỹ hoặc chi thêm.

### 2. Tự động hóa thông minh (Automations & Apps Script)
- **Đọc số tiền thành chữ**: Tự động chuyển đổi số tiền (ví dụ: `5.000.000` ➔ `Năm triệu đồng chẵn`).
- **Gửi Email thông báo**: Tự động gửi email thông báo khi có phiếu cần duyệt, khi được duyệt hoặc bị từ chối.
- **Cảnh báo quá hạn hoàn ứng**: Tự động quét hàng ngày và gửi email nhắc nhở nhân viên khi tới hạn mà chưa quyết toán.
- **In Mẫu số 03-TT BTC**: Xuất phiếu in chuẩn quy định Bộ Tài Chính (Thông tư 200/2014/TT-BTC & TT 133/2016/TT-BTC).

---

## 🖥️ Cách sử dụng nhanh

### Tùy chọn 1: Trải nghiệm ngay Ứng dụng Web Prototype
Mở tệp `index.html` trực tiếp trên bất kỳ trình duyệt nào (Chrome, Safari, Edge):
- Chuyển đổi vai trò người dùng (Nhân viên, Trưởng phòng, Kế toán, Giám đốc) để thử nghiệm phân quyền.
- Tạo phiếu đề nghị tạm ứng với nhiều hạng mục chi.
- Bấm duyệt từng cấp, từ chối, giải ngân và quyết toán.
- Bấm in phiếu chuẩn mẫu Mẫu 03-TT có xem trước bản in.

### Tùy chọn 2: Triển khai trên Google AppSheet
Xem chi tiết từng bước trong tệp [HUONG_DAN_CAU_HINH_APPSHEET.md](./HUONG_DAN_CAU_HINH_APPSHEET.md):
1. Nhập 4 tệp CSV vào một Google Sheet mới.
2. Dán mã nguồn từ [Code.gs](./Code.gs) vào **Extensions ➔ Apps Script**.
3. Kết nối với **AppSheet** và cấu hình theo hướng dẫn.
