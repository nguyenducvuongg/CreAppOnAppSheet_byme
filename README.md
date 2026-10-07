# CreAppOnAppSheet_byme
Ứng dụng Google AppSheet quét mã QR & Barcode vận chuyển, tự động đồng bộ và gom nhóm theo tháng trên Google Sheets.

## 📁 Thư mục dự án:
- [ESSEN_HangHoan_SPX_Tiktok](./ESSEN_HangHoan_SPX_Tiktok/): Chứa toàn bộ mã nguồn và tài liệu cấu hình cho ứng dụng **ESSEN | Hàng hoàn SPX/Tiktok**:
  - `DATA_QUET.csv`: Cấu trúc bảng tính Google Sheet chuẩn (DATA_QUET).
  - `Code.gs`: Mã Google Apps Script tự động phân chia sheet theo tháng (`T9`, `T10`...), gộp ô ngày và định dạng giao diện kho vận chuyên nghiệp.
  - `HUONG_DAN_CAU_HINH_APPSHEET.md`: Hướng dẫn chi tiết từng bước cấu hình AppSheet (kèm tính năng quét liên tục và cảnh báo trùng mã).
- [QuanLy_PhieuTamUng](./QuanLy_PhieuTamUng/): Dự án nghiên cứu và ứng dụng **Quản lý, Phê duyệt đa cấp Phiếu Tạm Ứng & Quyết toán hoàn ứng**:
  - `PHIEU_TAM_UNG.csv` & `CHI_TIET_TAM_UNG.csv`: Cấu trúc bảng cơ sở dữ liệu phiếu và chi tiết dự toán.
  - `DANH_MUC_NHAN_VIEN.csv`: Danh mục phân quyền vai trò (Nhân viên, Trưởng phòng, Kế toán, Giám đốc).
  - `Code.gs`: Mã Google Apps Script tự động đọc số thành chữ, gửi email duyệt phiếu, cảnh báo quá hạn hoàn ứng, xuất mẫu in chuẩn Mẫu số 03-TT BTC.
  - `HUONG_DAN_CAU_HINH_APPSHEET.md`: Hướng dẫn chi tiết thiết lập ứng dụng AppSheet từ A-Z.
  - `index.html`: Bản ứng dụng Web Prototype tương tác trực tiếp chạy trên trình duyệt.
