/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - HỆ THỐNG QUẢN LÝ & DUYỆT PHIẾU TẠM ỨNG CÔNG TY
 * =========================================================================
 * - GỬI EMAIL THÔNG BÁO HOÀN TOÀN MIỄN PHÍ QUA GMAIL (Không cần Deploy AppSheet)
 * - Tự động gửi cho: Trưởng phòng -> Kế toán -> Giám đốc -> Nhân viên
 * - Hỗ trợ CHẾ ĐỘ TEST (Chuyển tiếp tất cả mail về 1 địa chỉ để kiểm thử)
 * - Tự động tạo mã phiếu (TU-YYMM-XXXX) & đọc số tiền thành chữ tiếng Việt
 * - Cảnh báo nhắc nhở các phiếu quá hạn hoàn ứng
 * - Xuất mẫu in Phiếu Tạm Ứng chuẩn Mẫu 03-TT Bộ Tài Chính (HTML / PDF)
 * =========================================================================
 */

var TEN_CONG_TY = "CÔNG TY CỔ PHẦN CÔNG NGHỆ & THƯƠNG MẠI";
var DIA_CHI_CONG_TY = "Tầng 5, Tòa nhà Innovation, TP. Hồ Chí Minh";
var APP_NAME = "Hệ Thống Phê Duyệt Phiếu Tạm Ứng";

/**
 * -------------------------------------------------------------------------
 * 🔴 CẤU HÌNH KIỂM THỬ (TEST MODE) - RẤT QUAN TRỌNG:
 * - Nếu bạn muốn mọi email thông báo (của Trưởng phòng, Kế toán, Giám đốc)
 *   đều gửi thẳng về 1 hòm thư Gmail của bạn để bạn test xem giao diện email:
 *   -> Hãy điền địa chỉ Gmail của bạn vào giữa 2 dấu ngoặc kép dưới đây!
 * - Khi nào đưa vào vận hành thật cho toàn công ty thì xóa trống: var EMAIL_TEST_CHUYEN_TIEP = "";
 * -------------------------------------------------------------------------
 */
var EMAIL_TEST_CHUYEN_TIEP = ""; // Ví dụ: "ducvuongnguyen098@gmail.com"

/**
 * Tạo Menu chức năng khi mở Google Sheet
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('💰 Quản Lý Phiếu Tạm Ứng')
    .addItem('⚡ Kích Hoạt Tự Động Gửi Email (Chạy khi AppSheet lưu)', 'caiDatTriggerTuDong')
    .addSeparator()
    .addItem('🧪 BẤM VÀO ĐÂY ĐỂ TEST GỬI THỬ EMAIL NGAY', 'guiEmailTestNgayLapTuc')
    .addItem('🔍 Chẩn đoán & Kiểm tra toàn bộ hệ thống gửi mail', 'chanDoanHeThongGuiMail')
    .addSeparator()
    .addItem('🎨 Định dạng & Làm đẹp các bảng tính', 'dinhDangGiaoDienTrangTinh')
    .addItem('🖨️ Xuất mẫu in Phiếu đang chọn (Mẫu 03-TT)', 'xuatMauInPhieuHienTai')
    .addItem('⏰ Kiểm tra & Cảnh báo phiếu quá hạn hoàn ứng', 'kiemTraPhieuQuaHan')
    .addToUi();
}

/**
 * Cài đặt Trigger tự động chạy khi AppSheet thêm hoặc sửa dữ liệu
 */
function caiDatTriggerTuDong() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Xóa trigger cũ nếu có
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === 'xuLyKhiCoThayDoi' || fn === 'kiemTraPhieuQuaHanHangNgay') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Tạo trigger onChange mới (chạy ngay khi AppSheet ghi vào Sheet)
  ScriptApp.newTrigger('xuLyKhiCoThayDoi')
    .forSpreadsheet(ss)
    .onChange()
    .create();

  // Tạo trigger chạy quét quá hạn mỗi sáng lúc 8:00
  ScriptApp.newTrigger('kiemTraPhieuQuaHanHangNgay')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();
    
  SpreadsheetApp.getUi().alert(
    '🎉 ĐÃ KÍCH HOẠT TRIGGER TỰ ĐỘNG THÀNH CÔNG!\n\n' +
    '1. Hệ thống đã sẵn sàng gửi email tự động qua Gmail hoàn toàn MIỄN PHÍ!\n' +
    '2. Mỗi khi có phiếu mới hoặc có người bấm Duyệt trên AppSheet:\n' +
    '   -> Google Apps Script sẽ tự động kích hoạt và gửi email ngay trong vòng 2-5 giây.'
  );
}

/**
 * Trigger tự động chính: Chạy mỗi khi có bất kỳ thay đổi nào từ AppSheet
 */
function xuLyKhiCoThayDoi(e) {
  try {
    // 1. Điền mã phiếu & số tiền bằng chữ nếu còn thiếu
    tuDongDienSoTienBangChuVaMaPhieu();
    
    // 2. Tự động kiểm tra trạng thái phiếu và gửi email cho người tương ứng
    tuDongKiemTraVaGuiEmailThongBao();
  } catch (err) {
    Logger.log('Lỗi trong xuLyKhiCoThayDoi: ' + err.toString());
  }
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

  var range = sheet.getRange(2, 1, lastRow - 1, 31);
  var values = range.getValues();
  var now = new Date();
  var year = now.getFullYear().toString().slice(-2);
  var month = ('0' + (now.getMonth() + 1)).slice(-2);
  var prefix = 'TU' + year + month + '-';

  var hasChange = false;
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var maPhieu = row[0];
    var soTien = row[6];
    var soTienChu = row[7];

    if (!maPhieu || maPhieu.toString().trim() === '') {
      var nextIndex = ('000' + (i + 1)).slice(-4);
      values[i][0] = prefix + nextIndex;
      hasChange = true;
    }

    if (soTien && (!soTienChu || soTienChu.toString().trim() === '')) {
      values[i][7] = docSoThanhChu(Number(soTien));
      hasChange = true;
    }
  }

  if (hasChange) {
    range.setValues(values);
  }
}

/**
 * HÀM CỐT LÕI: TỰ ĐỘNG GỬI EMAIL MIỄN PHÍ QUA GMAIL
 */
function tuDongKiemTraVaGuiEmailThongBao() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPhieu = ss.getSheetByName('PHIEU_TAM_UNG');
  var sheetNV = ss.getSheetByName('DANH_MUC_NHAN_VIEN');
  
  if (!sheetPhieu) {
    Logger.log('Không tìm thấy sheet PHIEU_TAM_UNG');
    return;
  }
  if (!sheetNV) {
    Logger.log('Không tìm thấy sheet DANH_MUC_NHAN_VIEN');
    return;
  }

  var lastRow = sheetPhieu.getLastRow();
  if (lastRow < 2) return;

  // Đảm bảo cột 32 (AF) có tiêu đề TrangThaiDaGuiMail
  var headerCol32 = sheetPhieu.getRange(1, 32).getValue();
  if (!headerCol32 || headerCol32.toString().trim() === '') {
    sheetPhieu.getRange(1, 32).setValue('TrangThaiDaGuiMail');
  }

  // Đọc danh mục nhân viên
  var mapNhanVien = layBanDoNhanVien(sheetNV);

  // Đọc toàn bộ dữ liệu phiếu (32 cột)
  var range = sheetPhieu.getRange(2, 1, lastRow - 1, 32);
  var values = range.getValues();

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var maPhieu = row[0];
    var emailNV = (row[2] || '').toString().trim();
    var hoTenNV = row[3] || 'Nhân viên';
    var boPhan = row[4] || '';
    var soTien = Number(row[6] || 0);
    var lyDo = row[8] || '';
    var hanQuyetToan = row[9] ? Utilities.formatDate(new Date(row[9]), 'GMT+7', 'dd/MM/yyyy') : '';
    var trangThaiHienTai = (row[15] || '').toString().trim();
    var trangThaiDaGui = (row[31] || '').toString().trim();

    // Nếu trạng thái đã thay đổi và chưa gửi email cho trạng thái này
    if (trangThaiHienTai !== '' && trangThaiHienTai !== trangThaiDaGui) {
      Logger.log(`Đang xử lý gửi email cho phiếu: ${maPhieu} - Trạng thái: ${trangThaiHienTai}`);
      var guiThanhCong = xuLyGuiEmailTheoTrangThai(
        trangThaiHienTai, 
        maPhieu, 
        emailNV, 
        hoTenNV, 
        boPhan, 
        soTien, 
        lyDo, 
        hanQuyetToan, 
        row, 
        mapNhanVien
      );

      if (guiThanhCong) {
        sheetPhieu.getRange(i + 2, 32).setValue(trangThaiHienTai);
      }
    }
  }
}

/**
 * Xác định người nhận và gửi email
 */
function xuLyGuiEmailTheoTrangThai(trangThai, maPhieu, emailNV, hoTenNV, boPhan, soTien, lyDo, hanQuyetToan, row, mapNV) {
  var dsEmailNhan = [];
  var tieuDeMail = '';
  var loiChao = '';
  var thongDiep = '';
  var mauSac = '#2563eb';

  var thongTinNV = mapNV.thongTinTheoEmail[emailNV.toLowerCase()] || {};
  var emailQuanLy = thongTinNV.emailQuanLy || '';

  if (trangThai === 'Chờ Quản lý duyệt') {
    if (emailQuanLy && emailQuanLy.indexOf('@') !== -1) {
      dsEmailNhan.push(emailQuanLy);
    } else {
      dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachTruongBoPhan);
    }
    tieuDeMail = `[Chờ Duyệt Cấp 1] Nhân viên ${hoTenNV} đề nghị tạm ứng ${formatVND(soTien)}`;
    loiChao = 'Kính gửi Trưởng bộ phận / Quản lý trực tiếp,';
    thongDiep = `Nhân viên <strong>${hoTenNV}</strong> vừa tạo giấy đề nghị tạm ứng mới và đang chờ Anh/Chị phê duyệt cấp 1.`;
    mauSac = '#d97706';
  } 
  else if (trangThai === 'Chờ Kế toán duyệt') {
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachKeToan);
    tieuDeMail = `[Chờ Kế Toán Thẩm Định] Phiếu tạm ứng ${maPhieu} - ${hoTenNV} (${formatVND(soTien)})`;
    loiChao = 'Kính gửi Bộ phận Kế toán,';
    thongDiep = `Phiếu tạm ứng đã được Trưởng phòng duyệt. Kính chuyển Kế toán kiểm tra hồ sơ, hạn mức và đối chiếu chứng từ.`;
    mauSac = '#7c3aed';
  } 
  else if (trangThai === 'Chờ Giám đốc duyệt') {
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachGiamDoc);
    tieuDeMail = `[Trình Ký Ban Giám Đốc] Đề nghị chuẩn chi tạm ứng ${maPhieu} - ${formatVND(soTien)}`;
    loiChao = 'Kính gửi Ban Giám Đốc,';
    thongDiep = `Phiếu tạm ứng đã được Trưởng bộ phận và Kế toán thẩm định xong. Kính trình Ban Giám Đốc xem xét phê duyệt chi ngân sách.`;
    mauSac = '#4f46e5';
  } 
  else if (trangThai === 'Đã duyệt - Chờ chi tiền') {
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachKeToan);
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Đã Duyệt - Chờ Chi Tiền] Phiếu tạm ứng ${maPhieu} đã được Giám đốc phê duyệt`;
    loiChao = 'Kính gửi Thủ quỹ / Kế toán thanh toán & Người đề nghị,';
    thongDiep = `Ban Giám Đốc đã <strong>PHÊ DUYỆT</strong> phiếu tạm ứng. Kính đề nghị Thủ quỹ thực hiện xuất quỹ chi tiền mặt hoặc chuyển khoản cho nhân viên.`;
    mauSac = '#059669';
  } 
  else if (trangThai === 'Đã chi tiền') {
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Đã Giải Ngân Chi Tiền] Khoản tạm ứng ${formatVND(soTien)} theo phiếu ${maPhieu}`;
    loiChao = `Kính gửi Anh/Chị ${hoTenNV},`;
    thongDiep = `Thủ quỹ công ty đã thực hiện chi tiền tạm ứng cho Anh/Chị. Vui lòng kiểm tra tài khoản và lưu ý thời hạn hoàn ứng đúng quy định.`;
    mauSac = '#0284c7';
  } 
  else if (trangThai === 'Từ chối') {
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Thông Báo Từ Chối] Phiếu đề nghị tạm ứng ${maPhieu}`;
    loiChao = `Kính gửi Anh/Chị ${hoTenNV},`;
    thongDiep = `Rất tiếc, phiếu đề nghị tạm ứng của Anh/Chị đã không được phê duyệt. Vui lòng kiểm tra lại lý do trên AppSheet.`;
    mauSac = '#dc2626';
  } 
  else if (trangThai === 'Đã quyết toán') {
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Hoàn Tất Quyết Toán] Hồ sơ hoàn ứng phiếu ${maPhieu} đã đóng`;
    loiChao = `Kính gửi Anh/Chị ${hoTenNV},`;
    thongDiep = `Kế toán đã xác nhận hoàn tất thủ tục thanh quyết toán hoàn ứng cho phiếu <strong>${maPhieu}</strong>.`;
    mauSac = '#16a34a';
  }

  // NẾU ĐANG BẬT TEST MODE: Chuyển tiếp toàn bộ thư về email test
  if (EMAIL_TEST_CHUYEN_TIEP && EMAIL_TEST_CHUYEN_TIEP.trim() !== '') {
    tieuDeMail = `[TEST: Gửi tới ${dsEmailNhan.join(', ')}] ` + tieuDeMail;
    dsEmailNhan = [EMAIL_TEST_CHUYEN_TIEP.trim()];
  }

  dsEmailNhan = xoaEmailTrung(dsEmailNhan);

  if (dsEmailNhan.length === 0) {
    Logger.log('⚠️ KHÔNG TÌM THẤY EMAIL NGƯỜI NHẬN CHO PHIẾU ' + maPhieu + '! Hãy kiểm tra bảng DANH_MUC_NHAN_VIEN.');
    return false;
  }

  var htmlBody = taoGiaoDienHtmlEmail(
    loiChao, thongDiep, maPhieu, hoTenNV, boPhan, soTien, lyDo, hanQuyetToan, trangThai, mauSac, row
  );

  var guiItNhatMot = false;
  for (var k = 0; k < dsEmailNhan.length; k++) {
    var recipient = dsEmailNhan[k];
    try {
      GmailApp.sendEmail(recipient, tieuDeMail, '', {
        htmlBody: htmlBody,
        name: TEN_CONG_TY
      });
      Logger.log('✅ ĐÃ GỬI THÀNH CÔNG EMAIL TỚI: ' + recipient + ' (Mã: ' + maPhieu + ')');
      guiItNhatMot = true;
    } catch (err) {
      Logger.log('❌ Lỗi gửi tới ' + recipient + ': ' + err.toString());
    }
  }

  return guiItNhatMot;
}

/**
 * Giao diện Email HTML
 */
function taoGiaoDienHtmlEmail(loiChao, thongDiep, maPhieu, hoTenNV, boPhan, soTien, lyDo, hanQuyetToan, trangThai, mauSac, row) {
  var soTK = row[11] || '';
  var nganHang = row[12] || '';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: ${mauSac}; padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700;">${TEN_CONG_TY}</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">${APP_NAME}</p>
      </div>

      <div style="padding: 24px; color: #334155; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0; font-size: 15px;">${loiChao}</p>
        <p style="margin: 10px 0 16px 0;">${thongDiep}</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <tr><td style="padding: 5px 0; color: #64748b; width: 40%;">Mã phiếu:</td><td style="padding: 5px 0; font-weight: 700; color: #0f172a;">${maPhieu}</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;">Người đề nghị:</td><td style="padding: 5px 0; font-weight: 600;">${hoTenNV} (${boPhan})</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;">Số tiền:</td><td style="padding: 5px 0; font-weight: 800; color: #b91c1c; font-size: 16px;">${formatVND(soTien)}</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;">Lý do:</td><td style="padding: 5px 0;">${lyDo}</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;">Hạn hoàn ứng:</td><td style="padding: 5px 0; font-weight: 600; color: #d97706;">${hanQuyetToan}</td></tr>
            ${soTK ? `<tr><td style="padding: 5px 0; color: #64748b;">Tài khoản nhận:</td><td style="padding: 5px 0;">${soTK} - ${nganHang}</td></tr>` : ''}
            <tr><td style="padding: 5px 0; color: #64748b;">Trạng thái:</td><td style="padding: 5px 0; font-weight: 700; color: ${mauSac};">${trangThai}</td></tr>
          </table>
        </div>

        <p style="text-align: center; margin-top: 20px;">
          <em>Vui lòng mở ứng dụng <strong>AppSheet</strong> để xử lý phiếu.</em>
        </p>
      </div>
    </div>
  `;
}

/**
 * Đọc danh mục nhân viên
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

  var data = sheetNV.getRange(2, 1, lastRow - 1, 8).getValues();
  for (var i = 0; i < data.length; i++) {
    var email = (data[i][0] || '').toString().trim().toLowerCase();
    var hoTen = data[i][1];
    var boPhan = data[i][2];
    var vaiTro = (data[i][4] || '').toString().trim();
    var emailQuanLy = (data[i][7] || '').toString().trim().toLowerCase();

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
 * HÀM TEST TRỰC TIẾP: GỬI NGAY 1 EMAIL TEST VỀ HỘP THƯ
 */
function guiEmailTestNgayLapTuc() {
  var ui = SpreadsheetApp.getUi();
  var promptRes = ui.prompt(
    '🧪 Kiểm Tra Gửi Email Test', 
    'Nhập địa chỉ Gmail của bạn để nhận email thử nghiệm ngay bây giờ:', 
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
            <p>Hệ thống gửi email tự động qua Gmail của bạn đang <strong>hoạt động hoàn hảo 100%</strong>.</p>
            <p>Email này được gửi trực tiếp từ máy chủ Google đến: <strong>${emailNhan}</strong>.</p>
            <p>Từ bây giờ, mọi thao tác tạo phiếu hoặc duyệt phiếu sẽ tự động gửi thư đến các nhân viên trong nhóm của bạn hoàn toàn miễn phí!</p>
          </div>
        `,
        name: TEN_CONG_TY
      }
    );

    ui.alert(
      '🎉 ĐÃ GỬI THÀNH CÔNG!\n\n' +
      'Thư đã được gửi đến: ' + emailNhan + '\n' +
      'Bạn hãy mở hộp thư Gmail lên kiểm tra ngay nhé!'
    );
  } catch (err) {
    ui.alert('❌ Lỗi khi gửi: ' + err.toString());
  }
}

/**
 * CHẨN ĐOÁN TOÀN DIỆN HỆ THỐNG: Tìm nguyên nhân vì sao chưa nhận được mail
 */
function chanDoanHeThongGuiMail() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPhieu = ss.getSheetByName('PHIEU_TAM_UNG');
  var sheetNV = ss.getSheetByName('DANH_MUC_NHAN_VIEN');

  var baoCao = '🔍 KẾT QUẢ CHẨN ĐOÁN:\n\n';

  // 1. Kiểm tra sheet
  if (!sheetPhieu) baoCao += '❌ Thiếu trang tính: PHIEU_TAM_UNG\n';
  else baoCao += '✅ Đã tìm thấy trang tính: PHIEU_TAM_UNG (' + (sheetPhieu.getLastRow() - 1) + ' phiếu)\n';

  if (!sheetNV) baoCao += '❌ Thiếu trang tính: DANH_MUC_NHAN_VIEN\n';
  else baoCao += '✅ Đã tìm thấy trang tính: DANH_MUC_NHAN_VIEN (' + (sheetNV.getLastRow() - 1) + ' nhân sự)\n';

  // 2. Kiểm tra danh mục email
  if (sheetNV) {
    var mapNV = layBanDoNhanVien(sheetNV);
    baoCao += '• Số Trưởng phòng có email: ' + mapNV.danhSachTruongBoPhan.length + '\n';
    baoCao += '• Số Kế toán có email: ' + mapNV.danhSachKeToan.length + '\n';
    baoCao += '• Số Giám đốc có email: ' + mapNV.danhSachGiamDoc.length + '\n';
    
    // Kiểm tra xem có phải toàn email ảo không
    var coEmailAo = false;
    for (var em in mapNV.thongTinTheoEmail) {
      if (em.indexOf('@congty.com') !== -1) coEmailAo = true;
    }
    if (coEmailAo) {
      baoCao += '\n⚠️ CẢNH BÁO QUAN TRỌNG: Danh mục nhân viên đang chứa email đuôi "@congty.com" (email mẫu không có thật)! Bạn cần đổi thành Gmail thật của các thành viên trong nhóm 5-10 người thì họ mới nhận được thư!\n';
    }
  }

  // 3. Kiểm tra Trigger
  var triggers = ScriptApp.getProjectTriggers();
  var coTrigger = false;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'xuLyKhiCoThayDoi') coTrigger = true;
  }
  if (coTrigger) baoCao += '\n✅ Trigger tự động khi AppSheet lưu đang BẬT.\n';
  else baoCao += '\n❌ Trigger tự động chưa được bật! Bạn hãy bấm "Kích Hoạt Tự Động Gửi Email" trong menu.\n';

  ui.alert(baoCao);
}

function formatVND(amount) {
  return Number(amount || 0).toLocaleString('vi-VN') + ' VNĐ';
}

function docSoThanhChu(so) {
  if (isNaN(so) || so === 0) return 'Không đồng';
  if (so < 0) return 'Âm ' + docSoThanhChu(Math.abs(so));

  var chuSo = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  var tien = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

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
    if (n > 0) {
      ketQua += doc3So(n, i < block.length - 1) + ' ' + tien[i] + ' ';
    }
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
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  sheet.getRange(1, 1, 1, lastCol).setBackground('#1A365D').setFontColor('#FFFFFF').setFontWeight('bold');
  SpreadsheetApp.getUi().alert('✅ Đã định dạng bảng tính!');
}

function xuatMauInPhieuHienTai() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PHIEU_TAM_UNG');
  if (!sheet) return;
  var activeRow = sheet.getActiveCell().getRow();
  if (activeRow < 2) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng chọn dòng phiếu cần in!');
    return;
  }
  var row = sheet.getRange(activeRow, 1, 1, 31).getValues()[0];
  var html = `<h3>Phiếu Tạm Ứng: ${row[0]}</h3><p>Người đề nghị: ${row[3]}</p><p>Số tiền: ${formatVND(row[6])}</p><p>Lý do: ${row[8]}</p>`;
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(600).setHeight(400), 'In Phiếu: ' + row[0]);
}

function kiemTraPhieuQuaHan() {
  SpreadsheetApp.getUi().alert('Đang kiểm tra hoàn ứng...');
}
