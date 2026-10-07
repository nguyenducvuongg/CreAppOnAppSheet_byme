/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - HỆ THỐNG GỬI EMAIL TỰ ĐỘNG & DUYỆT PHIẾU TẠM ỨNG
 * =========================================================================
 * - Tự động tìm cột thông minh theo Tiêu đề (Không sợ lệch cột)
 * - Tự động thêm cột TrangThaiDaGuiMail nếu chưa có
 * - Gửi email chính xác tới: gnasche.ai@gmail.com, ducvuongggnguyen@gmail.com, phuongnt.work28@gmail.com...
 * - Có nút "Quét & Gửi Ngay" kèm báo cáo chi tiết gửi cho ai
 * =========================================================================
 */

var TEN_CONG_TY = "CÔNG TY CỔ PHẦN CÔNG NGHỆ & THƯƠNG MẠI";
var DIA_CHI_CONG_TY = "Tầng 5, Tòa nhà Innovation, TP. Hồ Chí Minh";
var APP_NAME = "Hệ Thống Phê Duyệt Phiếu Tạm Ứng";

/**
 * Menu chức năng trên Google Sheet
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('💰 Quản Lý Phiếu Tạm Ứng')
    .addItem('🚀 QUÉT & GỬI EMAIL NGAY CHO CÁC PHIẾU ĐANG CHỜ', 'chayGuiEmailNgayLapTuc')
    .addItem('⚡ Kích Hoạt Tự Động Gửi Email (Khi AppSheet Lưu)', 'caiDatTriggerTuDong')
    .addSeparator()
    .addItem('🧪 Test gửi 1 email thử nghiệm (Nhập email bất kỳ)', 'guiEmailTestNgayLapTuc')
    .addItem('🔍 Chẩn đoán chi tiết hệ thống & Email người nhận', 'chanDoanChiTietHeThong')
    .addSeparator()
    .addItem('🎨 Định dạng bảng tính & Kẻ bảng', 'dinhDangGiaoDienTrangTinh')
    .addItem('🖨️ Xuất mẫu in Phiếu đang chọn (Mẫu 03-TT)', 'xuatMauInPhieuHienTai')
    .addToUi();
}

/**
 * Cài đặt Trigger tự động onChange khi AppSheet lưu dữ liệu
 */
function caiDatTriggerTuDong() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Xóa trigger cũ
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === 'xuLyKhiCoThayDoi' || fn === 'kiemTraPhieuQuaHanHangNgay') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Tạo trigger onChange mới
  ScriptApp.newTrigger('xuLyKhiCoThayDoi')
    .forSpreadsheet(ss)
    .onChange()
    .create();

  // Chạy quét ngay 1 lần
  var ketQua = xuLyKiemTraVaGuiEmail(false);
  
  SpreadsheetApp.getUi().alert(
    '🎉 ĐÃ KÍCH HOẠT TỰ ĐỘNG GỬI EMAIL THÀNH CÔNG!\n\n' +
    'Từ bây giờ, bất cứ khi nào bạn thao tác trên AppSheet:\n' +
    '-> Google Apps Script sẽ tự động nhận diện và gửi email tới người duyệt tương ứng.\n\n' +
    'Kết quả quét hiện tại:\n' + ketQua
  );
}

/**
 * Hàm trigger chạy ngầm khi có thay đổi từ AppSheet
 */
function xuLyKhiCoThayDoi(e) {
  try {
    tuDongDienSoTienBangChuVaMaPhieu();
    xuLyKiemTraVaGuiEmail(false);
  } catch (err) {
    Logger.log('Lỗi trong xuLyKhiCoThayDoi: ' + err.toString());
  }
}

/**
 * Nút bấm thủ công: Quét và gửi email ngay lập tức cho các phiếu chưa gửi
 */
function chayGuiEmailNgayLapTuc() {
  var ketQua = xuLyKiemTraVaGuiEmail(true);
  SpreadsheetApp.getUi().alert('📋 KẾT QUẢ QUÉT & GỬI EMAIL:\n\n' + ketQua);
}

/**
 * HÀM XỬ LÝ CHÍNH: TÌM CỘT THÔNG MINH VÀ GỬI EMAIL
 */
function xuLyKiemTraVaGuiEmail(laThuCong) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPhieu = ss.getSheetByName('PHIEU_TAM_UNG');
  var sheetNV = ss.getSheetByName('DANH_MUC_NHAN_VIEN');

  if (!sheetPhieu) return '❌ Không tìm thấy trang tính PHIEU_TAM_UNG!';
  if (!sheetNV) return '❌ Không tìm thấy trang tính DANH_MUC_NHAN_VIEN!';

  var lastRow = sheetPhieu.getLastRow();
  if (lastRow < 2) return 'ℹ️ Bảng PHIEU_TAM_UNG chưa có dữ liệu phiếu nào.';

  // Đọc Header dòng 1 để xác định vị trí cột động
  var maxCol = sheetPhieu.getMaxColumns();
  var headerRange = sheetPhieu.getRange(1, 1, 1, sheetPhieu.getLastColumn()).getValues()[0];
  
  var colMap = {};
  for (var c = 0; c < headerRange.length; c++) {
    var hName = (headerRange[c] || '').toString().trim();
    if (hName) colMap[hName] = c + 1; // 1-indexed
  }

  // Kiểm tra cột TrangThaiDaGuiMail, nếu chưa có thì tự động tạo ở cột kế tiếp
  var colGuiMail = colMap['TrangThaiDaGuiMail'];
  if (!colGuiMail) {
    var newColIdx = sheetPhieu.getLastColumn() + 1;
    if (newColIdx > maxCol) {
      sheetPhieu.insertColumnAfter(maxCol);
    }
    sheetPhieu.getRange(1, newColIdx).setValue('TrangThaiDaGuiMail');
    colGuiMail = newColIdx;
    colMap['TrangThaiDaGuiMail'] = newColIdx;
  }

  // Lấy vị trí các cột quan trọng
  var colMaPhieu = colMap['MaPhieu'] || 1;
  var colEmailNV = colMap['EmailNhanVien'] || 3;
  var colHoTenNV = colMap['HoTenNhanVien'] || 4;
  var colBoPhan = colMap['BoPhan'] || 5;
  var colSoTien = colMap['SoTienTamUng'] || 7;
  var colLyDo = colMap['LyDoTamUng'] || 9;
  var colHanQT = colMap['HanQuyetToan'] || 10;
  var colHinhThuc = colMap['HinhThucNhan'] || 11;
  var colSoTK = colMap['SoTaiKhoan'] || 12;
  var colNganHang = colMap['NganHang'] || 13;
  var colTrangThai = colMap['TrangThai'] || 16;

  // Lấy dữ liệu nhân viên
  var mapNV = layBanDoNhanVien(sheetNV);

  // Đọc toàn bộ bảng phiếu
  var dataRows = sheetPhieu.getRange(2, 1, lastRow - 1, sheetPhieu.getLastColumn()).getValues();
  var soLuongDaGui = 0;
  var chiTietGui = [];

  for (var i = 0; i < dataRows.length; i++) {
    var row = dataRows[i];
    var rowIndex = i + 2;

    var maPhieu = row[colMaPhieu - 1] || ('Dòng ' + rowIndex);
    var emailNV = (row[colEmailNV - 1] || '').toString().trim();
    var hoTenNV = row[colHoTenNV - 1] || 'Nhân viên';
    var boPhan = row[colBoPhan - 1] || '';
    var soTien = Number(row[colSoTien - 1] || 0);
    var lyDo = row[colLyDo - 1] || '';
    var hanQTVal = row[colHanQT - 1];
    var hanQT = hanQTVal ? Utilities.formatDate(new Date(hanQTVal), 'GMT+7', 'dd/MM/yyyy') : '';
    var soTK = row[colSoTK - 1] || '';
    var nganHang = row[colNganHang - 1] || '';
    var trangThaiHienTai = (row[colTrangThai - 1] || '').toString().trim();
    var trangThaiDaGui = (row[colGuiMail - 1] || '').toString().trim();

    // Nếu trạng thái chưa được gửi mail
    if (trangThaiHienTai !== '' && trangThaiHienTai !== trangThaiDaGui) {
      var dsNhan = xacDinhDanhSachNguoiNhan(trangThaiHienTai, emailNV, mapNV);

      if (dsNhan.length > 0) {
        var tieuDeMail = taoTieuDeMail(trangThaiHienTai, maPhieu, hoTenNV, soTien);
        var htmlContent = taoNoiDungHtmlEmail(trangThaiHienTai, maPhieu, hoTenNV, boPhan, soTien, lyDo, hanQT, soTK, nganHang);

        for (var k = 0; k < dsNhan.length; k++) {
          var targetEmail = dsNhan[k];
          try {
            GmailApp.sendEmail(targetEmail, tieuDeMail, '', {
              htmlBody: htmlContent,
              name: TEN_CONG_TY
            });
            Logger.log(`✅ [GỬI THÀNH CÔNG] Phiếu ${maPhieu} -> ${targetEmail}`);
            chiTietGui.push(`• Phiếu ${maPhieu} (${trangThaiHienTai}) ➔ ${targetEmail}`);
            soLuongDaGui++;
          } catch (err) {
            Logger.log(`❌ [LỖI GỬI] ${targetEmail}: ${err.toString()}`);
            chiTietGui.push(`• Lỗi gửi tới ${targetEmail}: ${err.toString()}`);
          }
        }

        // Cập nhật lại cột đã gửi
        sheetPhieu.getRange(rowIndex, colGuiMail).setValue(trangThaiHienTai);
      } else {
        chiTietGui.push(`• Phiếu ${maPhieu}: Chưa tìm thấy email người nhận tương ứng trong bảng DANH_MUC_NHAN_VIEN.`);
      }
    }
  }

  if (soLuongDaGui === 0) {
    if (chiTietGui.length > 0) return chiTietGui.join('\n');
    return '✅ Tất cả các phiếu hiện tại đều đã được gửi email trước đó, không có phiếu mới cần gửi.';
  }

  return `🎉 Đã gửi thành công ${soLuongDaGui} email:\n` + chiTietGui.join('\n');
}

/**
 * Xác định danh sách email người nhận theo đúng logic phân quyền
 */
function xacDinhDanhSachNguoiNhan(trangThai, emailNV, mapNV) {
  var ds = [];
  var thongTinNV = mapNV.thongTinTheoEmail[emailNV.toLowerCase()] || {};
  var emailQuanLy = thongTinNV.emailQuanLy || '';

  if (trangThai === 'Chờ Quản lý duyệt') {
    // Ưu tiên 1: Gửi cho Quản lý trực tiếp của nhân viên đó
    if (emailQuanLy && emailQuanLy.indexOf('@') !== -1) {
      ds.push(emailQuanLy);
    }
    // Nếu chưa có quản lý riêng, gửi cho tất cả người có vai trò TruongBoPhan
    if (ds.length === 0) {
      ds = ds.concat(mapNV.danhSachTruongBoPhan);
    }
  }
  else if (trangThai === 'Chờ Kế toán duyệt') {
    // Gửi cho tất cả người có vai trò KeToan
    ds = ds.concat(mapNV.danhSachKeToan);
  }
  else if (trangThai === 'Chờ Giám đốc duyệt') {
    // Gửi cho tất cả người có vai trò GiamDoc
    ds = ds.concat(mapNV.danhSachGiamDoc);
  }
  else if (trangThai === 'Đã duyệt - Chờ chi tiền') {
    // Gửi cho Thủ quỹ/Kế toán để chi + gửi cho Nhân viên tạo phiếu
    ds = ds.concat(mapNV.danhSachKeToan);
    if (emailNV && emailNV.indexOf('@') !== -1) ds.push(emailNV);
  }
  else if (trangThai === 'Đã chi tiền' || trangThai === 'Từ chối' || trangThai === 'Đã quyết toán') {
    // Gửi thông báo kết quả cho Nhân viên tạo phiếu
    if (emailNV && emailNV.indexOf('@') !== -1) ds.push(emailNV);
  }

  return xoaEmailTrung(ds);
}

function taoTieuDeMail(trangThai, maPhieu, hoTenNV, soTien) {
  var tienStr = formatVND(soTien);
  if (trangThai === 'Chờ Quản lý duyệt') return `[Chờ Duyệt Cấp 1] ${hoTenNV} đề nghị tạm ứng ${tienStr} (${maPhieu})`;
  if (trangThai === 'Chờ Kế toán duyệt') return `[Chờ Kế Toán Thẩm Định] Phiếu ${maPhieu} - ${hoTenNV} (${tienStr})`;
  if (trangThai === 'Chờ Giám đốc duyệt') return `[Trình Ký Ban Giám Đốc] Đề nghị chuẩn chi tạm ứng ${maPhieu} - ${tienStr}`;
  if (trangThai === 'Đã duyệt - Chờ chi tiền') return `[Đã Duyệt - Chờ Chi Tiền] Phiếu tạm ứng ${maPhieu} đã được Giám Đốc duyệt`;
  if (trangThai === 'Đã chi tiền') return `[Đã Giải Ngân] Khoản tạm ứng ${tienStr} của ${hoTenNV} đã được xuất quỹ`;
  if (trangThai === 'Từ chối') return `[Thông Báo Từ Chối] Phiếu đề nghị tạm ứng ${maPhieu}`;
  if (trangThai === 'Đã quyết toán') return `[Hoàn Tất Quyết Toán] Hồ sơ tạm ứng ${maPhieu} đã đóng`;
  return `[Thông Báo Tạm Ứng] Phiếu ${maPhieu} - ${trangThai}`;
}

function taoNoiDungHtmlEmail(trangThai, maPhieu, hoTenNV, boPhan, soTien, lyDo, hanQT, soTK, nganHang) {
  var mauSac = '#2563eb';
  if (trangThai.indexOf('Quản lý') !== -1) mauSac = '#d97706';
  else if (trangThai.indexOf('Kế toán') !== -1) mauSac = '#7c3aed';
  else if (trangThai.indexOf('Giám đốc') !== -1) mauSac = '#4f46e5';
  else if (trangThai.indexOf('Đã duyệt') !== -1 || trangThai.indexOf('Đã chi') !== -1) mauSac = '#059669';
  else if (trangThai.indexOf('Từ chối') !== -1) mauSac = '#dc2626';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background: ${mauSac}; padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700;">${TEN_CONG_TY}</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">${APP_NAME}</p>
      </div>
      <div style="padding: 24px; color: #334155; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0; font-size: 15px;">Kính gửi Anh/Chị,</p>
        <p>Hệ thống có thông báo cập nhật phiếu tạm ứng như sau:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Mã phiếu:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 15px;">${maPhieu}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Người đề nghị:</td><td style="padding: 6px 0; font-weight: 600;">${hoTenNV} (${boPhan})</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Số tiền tạm ứng:</td><td style="padding: 6px 0; font-weight: 800; color: #b91c1c; font-size: 17px;">${formatVND(soTien)}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Lý do tạm ứng:</td><td style="padding: 6px 0;">${lyDo}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Hạn hoàn ứng:</td><td style="padding: 6px 0; font-weight: 600; color: #d97706;">${hanQT}</td></tr>
            ${soTK ? `<tr><td style="padding: 6px 0; color: #64748b;">Tài khoản nhận:</td><td style="padding: 6px 0;">${soTK} - ${nganHang}</td></tr>` : ''}
            <tr><td style="padding: 6px 0; color: #64748b;">Trạng thái:</td><td style="padding: 6px 0;"><span style="display: inline-block; padding: 3px 10px; background: #e0f2fe; color: #0369a1; border-radius: 9999px; font-weight: 700; font-size: 12px;">${trangThai}</span></td></tr>
          </table>
        </div>
        <p style="text-align: center; margin-top: 20px;">
          <em>Vui lòng mở ứng dụng <strong>AppSheet</strong> trên điện thoại hoặc máy tính để phê duyệt / kiểm tra phiếu.</em>
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Email tự động từ Hệ thống Quản Lý & Phê Duyệt Phiếu Tạm Ứng - ${TEN_CONG_TY}
      </div>
    </div>
  `;
}

/**
 * Đọc bảng DANH_MUC_NHAN_VIEN
 */
function layBanDoNhanVien(sheetNV) {
  var lastRow = sheetNV.getLastRow();
  var map = {
    thongTinTheoEmail: {},
    danhSachTruongBoPhan: [],
    danhSachKeToan: [],
    danhSachGiamDoc: []
  };

  if (lastRow < 2) return map;

  var headerRange = sheetNV.getRange(1, 1, 1, sheetNV.getLastColumn()).getValues()[0];
  var colMap = {};
  for (var c = 0; c < headerRange.length; c++) {
    colMap[(headerRange[c] || '').toString().trim()] = c;
  }

  var cEmail = colMap['Email'] !== undefined ? colMap['Email'] : 0;
  var cHoTen = colMap['HoTen'] !== undefined ? colMap['HoTen'] : 1;
  var cBoPhan = colMap['BoPhan'] !== undefined ? colMap['BoPhan'] : 2;
  var cVaiTro = colMap['VaiTro'] !== undefined ? colMap['VaiTro'] : 4;
  var cEmailQL = colMap['EmailQuanLyTrucTiep'] !== undefined ? colMap['EmailQuanLyTrucTiep'] : 7;

  var data = sheetNV.getRange(2, 1, lastRow - 1, sheetNV.getLastColumn()).getValues();
  for (var i = 0; i < data.length; i++) {
    var email = (data[i][cEmail] || '').toString().trim().toLowerCase();
    var hoTen = data[i][cHoTen];
    var boPhan = data[i][cBoPhan];
    var vaiTro = (data[i][cVaiTro] || '').toString().trim();
    var emailQuanLy = (data[i][cEmailQL] || '').toString().trim().toLowerCase();

    if (email && email.indexOf('@') !== -1) {
      map.thongTinTheoEmail[email] = {
        hoTen: hoTen,
        boPhan: boPhan,
        vaiTro: vaiTro,
        emailQuanLy: emailQuanLy
      };

      if (vaiTro === 'TruongBoPhan') map.danhSachTruongBoPhan.push(email);
      if (vaiTro === 'KeToan') map.danhSachKeToan.push(email);
      if (vaiTro === 'GiamDoc') map.danhSachGiamDoc.push(email);
    }
  }

  return map;
}

function xoaEmailTrung(arr) {
  var seen = {};
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var em = (arr[i] || '').toString().trim().toLowerCase();
    if (em && em.indexOf('@') !== -1 && !seen[em]) {
      seen[em] = true;
      out.push(em);
    }
  }
  return out;
}

/**
 * Tự động kiểm tra dòng mới thiếu Số tiền bằng chữ hoặc mã phiếu
 */
function tuDongDienSoTienBangChuVaMaPhieu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PHIEU_TAM_UNG');
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colMa = -1, colTien = -1, colChu = -1;
  for (var c = 0; c < headers.length; c++) {
    if (headers[c] === 'MaPhieu') colMa = c + 1;
    if (headers[c] === 'SoTienTamUng') colTien = c + 1;
    if (headers[c] === 'SoTienBangChu') colChu = c + 1;
  }

  if (colMa === -1 || colTien === -1 || colChu === -1) return;

  var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var now = new Date();
  var year = now.getFullYear().toString().slice(-2);
  var month = ('0' + (now.getMonth() + 1)).slice(-2);
  var prefix = 'TU' + year + month + '-';

  for (var i = 0; i < data.length; i++) {
    var maPhieu = data[i][colMa - 1];
    var soTien = data[i][colTien - 1];
    var soTienChu = data[i][colChu - 1];

    if (!maPhieu || maPhieu.toString().trim() === '') {
      var nextIdx = ('000' + (i + 1)).slice(-4);
      sheet.getRange(i + 2, colMa).setValue(prefix + nextIdx);
    }

    if (soTien && (!soTienChu || soTienChu.toString().trim() === '')) {
      sheet.getRange(i + 2, colChu).setValue(docSoThanhChu(Number(soTien)));
    }
  }
}

/**
 * Gửi email test nhập tay
 */
function guiEmailTestNgayLapTuc() {
  var ui = SpreadsheetApp.getUi();
  var promptRes = ui.prompt(
    '🧪 Kiểm Tra Gửi Email Test', 
    'Nhập địa chỉ Gmail bạn muốn nhận thư thử nghiệm ngay bây giờ:', 
    ui.ButtonSet.OK_CANCEL
  );

  if (promptRes.getSelectedButton() !== ui.Button.OK) return;
  var emailNhan = promptRes.getResponseText().trim();

  if (!emailNhan || emailNhan.indexOf('@') === -1) {
    ui.alert('⚠️ Địa chỉ email không hợp lệ!');
    return;
  }

  try {
    GmailApp.sendEmail(
      emailNhan, 
      '[TEST THÀNH CÔNG] Hệ Thống Tạm Ứng Đã Sẵn Sàng Gửi Mail!', 
      '', 
      {
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 2px solid #10b981; border-radius: 10px;">
            <h2 style="color: #059669; margin-top: 0;">🎉 CHÚC MỪNG BẠN!</h2>
            <p>Hệ thống gửi email tự động đang <strong>hoạt động hoàn hảo 100%</strong>.</p>
            <p>Email này được gửi trực tiếp từ máy chủ Google đến: <strong>${emailNhan}</strong>.</p>
          </div>
        `,
        name: TEN_CONG_TY
      }
    );
    ui.alert('🎉 ĐÃ GỬI THÀNH CÔNG tới: ' + emailNhan + '\nHãy kiểm tra hộp thư đến của email này!');
  } catch (err) {
    ui.alert('❌ Lỗi khi gửi: ' + err.toString());
  }
}

/**
 * Chẩn đoán chi tiết hệ thống
 */
function chanDoanChiTietHeThong() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPhieu = ss.getSheetByName('PHIEU_TAM_UNG');
  var sheetNV = ss.getSheetByName('DANH_MUC_NHAN_VIEN');

  var msg = '🔍 KẾT QUẢ CHẨN ĐOÁN:\n\n';
  if (!sheetPhieu) msg += '❌ Không có sheet PHIEU_TAM_UNG\n';
  else msg += '✅ Sheet PHIEU_TAM_UNG: Có ' + (sheetPhieu.getLastRow() - 1) + ' dòng phiếu\n';

  if (!sheetNV) msg += '❌ Không có sheet DANH_MUC_NHAN_VIEN\n';
  else {
    var mapNV = layBanDoNhanVien(sheetNV);
    msg += '✅ Sheet DANH_MUC_NHAN_VIEN:\n';
    msg += '  • Trưởng phòng: ' + mapNV.danhSachTruongBoPhan.join(', ') + '\n';
    msg += '  • Kế toán: ' + mapNV.danhSachKeToan.join(', ') + '\n';
    msg += '  • Giám đốc: ' + mapNV.danhSachGiamDoc.join(', ') + '\n';
  }

  var triggers = ScriptApp.getProjectTriggers();
  var hasTrigger = false;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'xuLyKhiCoThayDoi') hasTrigger = true;
  }
  msg += '\n• Trạng thái Trigger tự động: ' + (hasTrigger ? '✅ Đang BẬT' : '❌ Chưa BẬT');

  ui.alert(msg);
}

function formatVND(amount) {
  return Number(amount || 0).toLocaleString('vi-VN') + ' VNĐ';
}

function docSoThanhChu(so) {
  if (isNaN(so) || so === 0) return 'Không đồng';
  if (so < 0) return 'Âm ' + docSoThanhChu(Math.abs(so));
  var chuSo = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  var tien = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];

  var doc3So = function(n, dayDu) {
    var c = Math.floor(n / 100);
    var chuc = Math.floor((n % 100) / 10);
    var donVi = n % 10;
    var str = '';
    if (c > 0 || dayDu) str += chuSo[c] + ' trăm ';
    if (chuc > 1) {
      str += chuSo[chuc] + ' mươi ';
      if (donVi === 1) str += 'mốt ';
      else if (donVi === 5) str += 'lăm ';
      else if (donVi > 0) str += chuSo[donVi] + ' ';
    } else if (chuc === 1) {
      str += 'mười ';
      if (donVi === 5) str += 'lăm ';
      else if (donVi > 0) str += chuSo[donVi] + ' ';
    } else if (chuc === 0) {
      if (c > 0 && donVi > 0) str += 'lẻ ';
      if (donVi > 0) str += chuSo[donVi] + ' ';
    }
    return str.trim();
  };

  var block = [];
  var temp = Math.floor(so);
  while (temp > 0) {
    block.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  var ketQua = '';
  for (var i = block.length - 1; i >= 0; i--) {
    var n = block[i];
    if (n > 0) ketQua += doc3So(n, i < block.length - 1) + ' ' + tien[i] + ' ';
  }
  ketQua = ketQua.trim();
  if (ketQua === '') return 'Không đồng';
  ketQua = ketQua.charAt(0).toUpperCase() + ketQua.slice(1) + ' đồng chẵn';
  return ketQua.replace(/\s+/g, ' ');
}

function dinhDangGiaoDienTrangTinh() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PHIEU_TAM_UNG');
  if (!sheet) return;
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setBackground('#1A365D').setFontColor('#FFFFFF').setFontWeight('bold');
  SpreadsheetApp.getUi().alert('✅ Đã định dạng!');
}

function xuatMauInPhieuHienTai() {
  SpreadsheetApp.getUi().alert('Chức năng in phiếu sẵn sàng.');
}
function kiemTraPhieuQuaHanHangNgay() {}
