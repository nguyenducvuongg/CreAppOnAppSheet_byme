/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - HỆ THỐNG QUẢN LÝ & DUYỆT PHIẾU TẠM ỨNG CÔNG TY
 * =========================================================================
 * - Tự động đồng bộ với Google AppSheet khi thêm hoặc sửa dữ liệu
 * - GỬI EMAIL THÔNG BÁO HOÀN TOÀN MIỄN PHÍ QUA GMAIL (Không cần Deploy AppSheet)
 * - Tự động gửi cho: Trưởng phòng -> Kế toán -> Giám đốc -> Nhân viên
 * - Tự động tạo mã phiếu (TU-YYMM-XXXX) & đọc số tiền thành chữ tiếng Việt
 * - Cảnh báo nhắc nhở các phiếu quá hạn hoàn ứng
 * - Xuất mẫu in Phiếu Tạm Ứng chuẩn Mẫu 03-TT Bộ Tài Chính (HTML / PDF)
 * =========================================================================
 */

var TEN_CONG_TY = "CÔNG TY CỔ PHẦN CÔNG NGHỆ & THƯƠNG MẠI";
var DIA_CHI_CONG_TY = "Tầng 5, Tòa nhà Innovation, TP. Hồ Chí Minh";
var APP_NAME = "Hệ Thống Phê Duyệt Phiếu Tạm Ứng";

/**
 * Tạo Menu chức năng khi mở Google Sheet
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('💰 Quản Lý Phiếu Tạm Ứng')
    .addItem('🎨 Định dạng & Làm đẹp các bảng tính', 'dinhDangGiaoDienTrangTinh')
    .addItem('🖨️ Xuất mẫu in Phiếu đang chọn (Mẫu 03-TT)', 'xuatMauInPhieuHienTai')
    .addItem('✉️ Gửi Email thông báo phiếu đang chọn', 'guiEmailThongBaoThuCong')
    .addItem('🧪 Gửi Thử Email Test Ngay (Kiểm tra gửi thư)', 'guiEmailTestNgayLapTuc')
    .addItem('⏰ Kiểm tra & Cảnh báo phiếu quá hạn hoàn ứng', 'kiemTraPhieuQuaHan')
    .addSeparator()
    .addItem('⚡ Cài đặt Trigger tự động gửi Email khi AppSheet lưu', 'caiDatTriggerTuDong')
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
  
  // Tạo trigger onChange mới (chạy ngay khi AppSheet lưu vào Sheet)
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
    '✅ ĐÃ KÍCH HOẠT TỰ ĐỘNG GỬI EMAIL QUA GOOGLE APPS SCRIPT THÀNH CÔNG!\n\n' +
    '1. Hoàn toàn MIỄN PHÍ - không cần trả phí Deploy AppSheet!\n' +
    '2. Mỗi khi nhân viên tạo phiếu hoặc sếp bấm duyệt trên AppSheet:\n' +
    '   -> Hệ thống sẽ tự động gửi email thông báo từ chính hộp thư Gmail của bạn đến đúng người cần duyệt.\n' +
    '3. Thư gửi thẳng vào Hộp thư đến (Inbox), không bị vào Spam.'
  );
}

/**
 * Trigger tự động chính: Chạy mỗi khi có bất kỳ thay đổi nào từ AppSheet
 */
function xuLyKhiCoThayDoi(e) {
  // 1. Điền mã phiếu & số tiền bằng chữ nếu còn thiếu
  tuDongDienSoTienBangChuVaMaPhieu();
  
  // 2. Tự động kiểm tra trạng thái phiếu và gửi email cho người tương ứng
  tuDongKiemTraVaGuiEmailThongBao();
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
    var soTien = row[6]; // Cột G (index 6): SoTienTamUng
    var soTienChu = row[7]; // Cột H (index 7): SoTienBangChu

    // Nếu thiếu mã phiếu
    if (!maPhieu || maPhieu.toString().trim() === '') {
      var nextIndex = ('000' + (i + 1)).slice(-4);
      values[i][0] = prefix + nextIndex;
      hasChange = true;
    }

    // Nếu có số tiền nhưng chưa có chữ
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
 * HÀM CỐT LÕI: TỰ ĐỘNG GỬI EMAIL MIỄN PHÍ KHI CÓ PHIẾU MỚI HOẶC DUYỆT PHIẾU
 * - Đọc dữ liệu từ PHIEU_TAM_UNG
 * - Dùng cột AF (cột 32): TrangThaiDaGuiMail để tránh gửi trùng lặp
 */
function tuDongKiemTraVaGuiEmailThongBao() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPhieu = ss.getSheetByName('PHIEU_TAM_UNG');
  var sheetNV = ss.getSheetByName('DANH_MUC_NHAN_VIEN');
  if (!sheetPhieu || !sheetNV) return;

  var lastRow = sheetPhieu.getLastRow();
  if (lastRow < 2) return;

  // Đảm bảo cột 32 (AF) có tiêu đề TrangThaiDaGuiMail
  var headerCol32 = sheetPhieu.getRange(1, 32).getValue();
  if (!headerCol32 || headerCol32.toString().trim() === '') {
    sheetPhieu.getRange(1, 32).setValue('TrangThaiDaGuiMail');
  }

  // Đọc danh mục nhân viên để tra cứu email quản lý, kế toán, giám đốc
  var mapNhanVien = layBanDoNhanVien(sheetNV);

  // Đọc toàn bộ dữ liệu phiếu (32 cột)
  var range = sheetPhieu.getRange(2, 1, lastRow - 1, 32);
  var values = range.getValues();

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var maPhieu = row[0];
    var emailNV = row[2];
    var hoTenNV = row[3];
    var boPhan = row[4];
    var soTien = Number(row[6] || 0);
    var lyDo = row[8];
    var hanQuyetToan = row[9] ? Utilities.formatDate(new Date(row[9]), 'GMT+7', 'dd/MM/yyyy') : '';
    var trangThaiHienTai = (row[15] || '').toString().trim();
    var trangThaiDaGui = (row[31] || '').toString().trim();

    // Nếu trạng thái đã thay đổi và chưa gửi email cho trạng thái này
    if (trangThaiHienTai !== '' && trangThaiHienTai !== trangThaiDaGui) {
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
        // Ghi lại trạng thái đã gửi vào cột 32 để không bao giờ gửi trùng
        sheetPhieu.getRange(i + 2, 32).setValue(trangThaiHienTai);
      }
    }
  }
}

/**
 * Xử lý xác định người nhận và gửi email theo từng trạng thái
 */
function xuLyGuiEmailTheoTrangThai(trangThai, maPhieu, emailNV, hoTenNV, boPhan, soTien, lyDo, hanQuyetToan, row, mapNV) {
  var dsEmailNhan = [];
  var tieuDeMail = '';
  var loiChao = '';
  var thongDiep = '';
  var mauSac = '#2563eb'; // Xanh dương mặc định

  var thongTinNV = mapNV.thongTinTheoEmail[emailNV] || {};
  var emailQuanLy = thongTinNV.emailQuanLy || '';

  if (trangThai === 'Chờ Quản lý duyệt') {
    // Gửi cho Trưởng phòng / Quản lý trực tiếp
    if (emailQuanLy && emailQuanLy.indexOf('@') !== -1) {
      dsEmailNhan.push(emailQuanLy);
    } else {
      // Nếu không có quản lý trực tiếp, gửi cho tất cả TruongBoPhan
      dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachTruongBoPhan);
    }
    tieuDeMail = `[Chờ Duyệt Cấp 1] Nhân viên ${hoTenNV} đề nghị tạm ứng ${formatVND(soTien)}`;
    loiChao = 'Kính gửi Trưởng bộ phận / Quản lý trực tiếp,';
    thongDiep = `Nhân viên <strong>${hoTenNV}</strong> vừa tạo giấy đề nghị tạm ứng mới và đang chờ Anh/Chị phê duyệt cấp 1.`;
    mauSac = '#d97706'; // Màu cam
  } 
  else if (trangThai === 'Chờ Kế toán duyệt') {
    // Gửi cho phòng Kế toán
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachKeToan);
    tieuDeMail = `[Chờ Kế Toán Thẩm Định] Phiếu tạm ứng ${maPhieu} - ${hoTenNV} (${formatVND(soTien)})`;
    loiChao = 'Kính gửi Bộ phận Kế toán,';
    thongDiep = `Phiếu tạm ứng đã được Trưởng phòng duyệt. Kính chuyển Kế toán kiểm tra hồ sơ, hạn mức và đối chiếu chứng từ.`;
    mauSac = '#7c3aed'; // Màu tím
  } 
  else if (trangThai === 'Chờ Giám đốc duyệt') {
    // Gửi cho Ban Giám Đốc
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachGiamDoc);
    tieuDeMail = `[Trình Ký Ban Giám Đốc] Đề nghị chuẩn chi tạm ứng ${maPhieu} - ${formatVND(soTien)}`;
    loiChao = 'Kính gửi Ban Giám Đốc,';
    thongDiep = `Phiếu tạm ứng đã được Trưởng bộ phận và Kế toán thẩm định xong. Kính trình Ban Giám Đốc xem xét phê duyệt chi ngân sách.`;
    mauSac = '#4f46e5'; // Màu chàm indigo
  } 
  else if (trangThai === 'Đã duyệt - Chờ chi tiền') {
    // Gửi cho Kế toán / Thủ quỹ để giải ngân + gửi cho Nhân viên báo tin vui
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachKeToan);
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Đã Duyệt - Chờ Chi Tiền] Phiếu tạm ứng ${maPhieu} đã được Giám đốc phê duyệt`;
    loiChao = 'Kính gửi Thủ quỹ / Kế toán thanh toán & Người đề nghị,';
    thongDiep = `Ban Giám Đốc đã <strong>PHÊ DUYỆT</strong> phiếu tạm ứng. Kính đề nghị Thủ quỹ thực hiện xuất quỹ chi tiền mặt hoặc chuyển khoản cho nhân viên.`;
    mauSac = '#059669'; // Màu xanh lá
  } 
  else if (trangThai === 'Đã chi tiền') {
    // Gửi thông báo cho Nhân viên đã nhận được tiền
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Đã Giải Ngân Chi Tiền] Khoản tạm ứng ${formatVND(soTien)} theo phiếu ${maPhieu}`;
    loiChao = `Kính gửi Anh/Chị ${hoTenNV},`;
    thongDiep = `Thủ quỹ công ty đã thực hiện chi tiền tạm ứng cho Anh/Chị. Vui lòng kiểm tra tài khoản và lưu ý thời hạn hoàn ứng đúng quy định.`;
    mauSac = '#0284c7'; // Xanh cyan
  } 
  else if (trangThai === 'Từ chối') {
    // Báo cho Nhân viên biết phiếu bị từ chối
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Thông Báo Từ Chối] Phiếu đề nghị tạm ứng ${maPhieu}`;
    loiChao = `Kính gửi Anh/Chị ${hoTenNV},`;
    thongDiep = `Rất tiếc, phiếu đề nghị tạm ứng của Anh/Chị đã không được phê duyệt. Vui lòng liên hệ quản lý trực tiếp để biết thêm chi tiết hoặc làm lại đơn.`;
    mauSac = '#dc2626'; // Màu đỏ
  } 
  else if (trangThai === 'Đã quyết toán') {
    // Báo cho Nhân viên đã hoàn tất quyết toán
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Hoàn Tất Quyết Toán] Hồ sơ hoàn ứng phiếu ${maPhieu} đã đóng`;
    loiChao = `Kính gửi Anh/Chị ${hoTenNV},`;
    thongDiep = `Kế toán đã xác nhận hoàn tất thủ tục thanh quyết toán hoàn ứng cho phiếu <strong>${maPhieu}</strong>. Hồ sơ công nợ tạm ứng này đã được đóng thành công.`;
    mauSac = '#16a34a'; // Xanh lá đậm
  }

  // Loại bỏ email trùng lặp và email trống
  dsEmailNhan = xoaEmailTrung(dsEmailNhan);

  if (dsEmailNhan.length === 0) {
    Logger.log('Không tìm thấy người nhận hợp lệ cho phiếu ' + maPhieu);
    return false;
  }

  var htmlBody = taoGiaoDienHtmlEmail(
    loiChao, 
    thongDiep, 
    maPhieu, 
    hoTenNV, 
    boPhan, 
    soTien, 
    lyDo, 
    hanQuyetToan, 
    trangThai, 
    mauSac, 
    row
  );

  try {
    for (var k = 0; k < dsEmailNhan.length; k++) {
      var recipient = dsEmailNhan[k];
      MailApp.sendEmail({
        to: recipient,
        subject: tieuDeMail,
        htmlBody: htmlBody
      });
      Logger.log('✅ Đã gửi email thành công tới: ' + recipient + ' (Phiếu: ' + maPhieu + ' - Trạng thái: ' + trangThai + ')');
    }
    return true;
  } catch (err) {
    Logger.log('❌ Lỗi gửi email: ' + err.toString());
    return false;
  }
}

/**
 * Tạo giao diện Email HTML chuyên nghiệp, sang trọng
 */
function taoGiaoDienHtmlEmail(loiChao, thongDiep, maPhieu, hoTenNV, boPhan, soTien, lyDo, hanQuyetToan, trangThai, mauSac, row) {
  var hinhThucNhan = row[10] || 'Chuyển khoản';
  var soTK = row[11] || '';
  var nganHang = row[12] || '';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <!-- Header -->
      <div style="background: ${mauSac}; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">${TEN_CONG_TY}</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">${APP_NAME}</p>
      </div>

      <!-- Body Content -->
      <div style="padding: 24px 28px; color: #334155; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0; font-size: 15px;">${loiChao}</p>
        <p style="margin: 12px 0 18px 0;">${thongDiep}</p>

        <!-- Ticket Card -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Mã phiếu:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 15px;">${maPhieu}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Người đề nghị:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${hoTenNV} (${boPhan})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Số tiền tạm ứng:</td>
              <td style="padding: 6px 0; font-weight: 800; color: #b91c1c; font-size: 17px;">${formatVND(soTien)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Mục đích / Lý do:</td>
              <td style="padding: 6px 0; color: #334155;">${lyDo}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Hạn hoàn ứng:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #d97706;">${hanQuyetToan}</td>
            </tr>
            ${soTK ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Tài khoản nhận:</td>
              <td style="padding: 6px 0; color: #334155;">${soTK} - ${nganHang}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Trạng thái hiện tại:</td>
              <td style="padding: 6px 0;">
                <span style="display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 9999px; font-weight: 700; font-size: 12px;">
                  ${trangThai}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <p style="margin: 20px 0 10px 0; text-align: center;">
          <em>Vui lòng mở ứng dụng <strong>AppSheet</strong> trên điện thoại hoặc máy tính để duyệt / kiểm tra phiếu.</em>
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Email thông báo tự động từ Hệ thống Quản Lý & Phê Duyệt Phiếu Tạm Ứng.<br>
        Địa chỉ: ${DIA_CHI_CONG_TY}
      </div>
    </div>
  `;
}

/**
 * Đọc bảng DANH_MUC_NHAN_VIEN để lập bản đồ quyền hạn
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
 * HÀM TEST NHANH: Bấm để kiểm tra gửi email ngay lập tức về hộp thư của bạn
 */
function guiEmailTestNgayLapTuc() {
  var emailHienTai = Session.getActiveUser().getEmail();
  if (!emailHienTai) {
    emailHienTai = SpreadsheetApp.getUi().prompt('Kiểm tra gửi email', 'Nhập địa chỉ email nhận thư test:', SpreadsheetApp.getUi().ButtonSet.OK_CANCEL).getResponseText();
  }

  if (!emailHienTai || emailHienTai.indexOf('@') === -1) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng nhập địa chỉ email hợp lệ!');
    return;
  }

  var subject = `[TEST THÀNH CÔNG] Thử nghiệm gửi email từ Hệ Thống Tạm Ứng`;
  var body = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #10b981; border-radius: 8px;">
      <h3 style="color: #059669; margin-top: 0;">🎉 CHÚC MỪNG BẠN!</h3>
      <p>Hệ thống gửi email tự động qua Google Apps Script đang <strong>hoạt động hoàn hảo 100%</strong>.</p>
      <p>Hệ thống có thể gửi thông báo tới bất kỳ ai trong danh sách 5 - 10 người của bạn hoàn toàn miễn phí mà không cần trả phí mua gói AppSheet Deploy!</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
      <span style="font-size: 12px; color: #6b7280;">Thời gian gửi: ${new Date().toLocaleString('vi-VN')}</span>
    </div>
  `;

  MailApp.sendEmail({
    to: emailHienTai,
    subject: subject,
    htmlBody: body
  });

  SpreadsheetApp.getUi().alert(
    '🎉 ĐÃ GỬI THÀNH CÔNG!\n\n' +
    'Hệ thống vừa gửi 1 email thử nghiệm đến: ' + emailHienTai + '\n' +
    'Bạn hãy mở hộp thư Gmail lên kiểm tra nhé!'
  );
}

/**
 * Định dạng giao diện các Sheet chuyên nghiệp
 */
function dinhDangGiaoDienTrangTinh() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PHIEU_TAM_UNG');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('❌ Không tìm thấy trang tính PHIEU_TAM_UNG!');
    return;
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground('#1A365D')
             .setFontColor('#FFFFFF')
             .setFontWeight('bold')
             .setFontFamily('Arial')
             .setFontSize(10)
             .setHorizontalAlignment('center')
             .setVerticalAlignment('middle')
             .setWrap(true);
  sheet.setRowHeight(1, 40);

  if (lastRow > 1) {
    var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    dataRange.setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle');
    dataRange.setBorder(true, true, true, true, true, true, '#CBD5E0', SpreadsheetApp.BorderStyle.SOLID);
    
    sheet.getRange(2, 7, lastRow - 1, 1).setNumberFormat('#,##0 "₫"').setHorizontalAlignment('right');
    sheet.getRange(2, 2, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd').setHorizontalAlignment('center');
  }

  SpreadsheetApp.getUi().alert('✅ Đã định dạng bảng tính theo chuẩn giao diện tài chính!');
}

/**
 * Xuất Mẫu In Phiếu Tạm Ứng (Chuẩn Mẫu 03 - TT Bộ Tài Chính)
 */
function xuatMauInPhieuHienTai() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PHIEU_TAM_UNG');
  if (!sheet) return;

  var activeRow = sheet.getActiveCell().getRow();
  if (activeRow < 2) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng nhấp chọn vào dòng phiếu bạn muốn in trước!');
    return;
  }

  var rowData = sheet.getRange(activeRow, 1, 1, 31).getValues()[0];
  var maPhieu = rowData[0] || 'Chưa có';
  var ngayDeNghi = Utilities.formatDate(new Date(rowData[1] || new Date()), 'GMT+7', 'dd/MM/yyyy');
  var hoTen = rowData[3] || '';
  var boPhan = rowData[4] || '';
  var chucVu = rowData[5] || '';
  var soTien = Number(rowData[6] || 0);
  var soTienChu = rowData[7] || docSoThanhChu(soTien);
  var lyDo = rowData[8] || '';
  var hanQuyetToan = rowData[9] ? Utilities.formatDate(new Date(rowData[9]), 'GMT+7', 'dd/MM/yyyy') : '';
  var hinhThuc = rowData[10] || 'Chuyển khoản';
  var soTK = rowData[11] || '';
  var nganHang = rowData[12] || '';
  var trangThai = rowData[15] || '';

  var htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; margin: 25px; line-height: 1.5; color: #000; }
        .header-table { width: 100%; margin-bottom: 10px; }
        .title { text-align: center; margin: 20px 0 10px 0; }
        .title h2 { margin: 0; font-size: 18pt; text-transform: uppercase; font-weight: bold; }
        .info-row { margin: 8px 0; }
        .signature-table { width: 100%; margin-top: 30px; text-align: center; }
        .signature-table td { vertical-align: top; width: 20%; padding: 5px; }
        .signature-title { font-weight: bold; font-size: 12pt; }
        .signature-space { height: 70px; }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="width: 60%;">
            <strong>${TEN_CONG_TY}</strong><br>
            <span>Địa chỉ: ${DIA_CHI_CONG_TY}</span><br>
            <span>Bộ phận: <strong>${boPhan}</strong></span>
          </td>
          <td style="width: 40%; text-align: center;">
            <strong>Mẫu số 03 - TT</strong><br>
            <span style="font-size: 10pt; font-style: italic;">(Ban hành theo Thông tư 200/2014/TT-BTC)</span><br>
            <span style="font-weight: bold; font-size: 11pt;">Số: ${maPhieu}</span>
          </td>
        </tr>
      </table>

      <div class="title">
        <h2>PHIẾU TẠM ỨNG</h2>
        <p>Ngày ${ngayDeNghi.split('/')[0]} tháng ${ngayDeNghi.split('/')[1]} năm ${ngayDeNghi.split('/')[2]}</p>
      </div>

      <div class="info-row">- Họ và tên người đề nghị: <strong>${hoTen}</strong></div>
      <div class="info-row">- Bộ phận (Phòng ban): <strong>${boPhan}</strong> &nbsp;&nbsp; - Chức vụ: <strong>${chucVu}</strong></div>
      <div class="info-row">- Số tiền tạm ứng: <strong style="font-size: 14pt;">${formatVND(soTien)}</strong></div>
      <div class="info-row">- Viết bằng chữ: <em>${soTienChu}</em></div>
      <div class="info-row">- Lý do tạm ứng: ${lyDo}</div>
      <div class="info-row">- Thời hạn thanh toán (hoàn ứng): <strong>${hanQuyetToan}</strong></div>
      <div class="info-row">- Hình thức nhận: <strong>${hinhThuc}</strong> ${soTK ? `(STK: ${soTK} - ${nganHang})` : ''}</div>

      <table class="signature-table">
        <tr>
          <td><div class="signature-title">Giám đốc</div><div class="signature-space"></div><strong>${rowData[22] ? rowData[22].split('@')[0] : ''}</strong></td>
          <td><div class="signature-title">Kế toán trưởng</div><div class="signature-space"></div><strong>${rowData[19] ? rowData[19].split('@')[0] : ''}</strong></td>
          <td><div class="signature-title">Trưởng bộ phận</div><div class="signature-space"></div><strong>${rowData[16] ? rowData[16].split('@')[0] : ''}</strong></td>
          <td><div class="signature-title">Thủ quỹ</div><div class="signature-space"></div><strong>${rowData[26] || ''}</strong></td>
          <td><div class="signature-title">Người tạm ứng</div><div class="signature-space"></div><strong>${hoTen}</strong></td>
        </tr>
      </table>
    </body>
    </html>
  `;

  var htmlOutput = HtmlService.createHtmlOutput(htmlContent).setWidth(900).setHeight(700).setTitle('In Phiếu Tạm Ứng - ' + maPhieu);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🖨️ Xem & In Phiếu: ' + maPhieu);
}

/**
 * Gửi email thông báo thủ công cho dòng đang chọn
 */
function guiEmailThongBaoThuCong() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PHIEU_TAM_UNG');
  var activeRow = sheet.getActiveCell().getRow();

  if (activeRow < 2) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng chọn dòng phiếu bạn muốn gửi email!');
    return;
  }

  sheet.getRange(activeRow, 32).setValue(''); // Xóa cờ đã gửi để kích hoạt gửi lại
  tuDongKiemTraVaGuiEmailThongBao();
  SpreadsheetApp.getUi().alert('✅ Đã gửi lại email thông báo cho dòng ' + activeRow + '!');
}

/**
 * Kiểm tra các phiếu tạm ứng đã chi tiền nhưng quá hạn hoàn ứng
 */
function kiemTraPhieuQuaHan() {
  var dsQuaHan = layDanhSachPhieuQuaHan();
  if (dsQuaHan.length === 0) {
    SpreadsheetApp.getUi().alert('🎉 Tuyệt vời! Không có phiếu nào bị quá hạn hoàn ứng.');
    return;
  }

  var msg = '⚠️ CẢNH BÁO: Tìm thấy ' + dsQuaHan.length + ' phiếu tạm ứng quá hạn thanh toán:\n\n';
  for (var i = 0; i < Math.min(dsQuaHan.length, 5); i++) {
    var p = dsQuaHan[i];
    msg += '• ' + p.maPhieu + ' - ' + p.hoTen + ' (' + formatVND(p.soTien) + ') - Hạn: ' + p.hanQuyetToan + '\n';
  }
  msg += '\nBạn có muốn gửi Email tự động nhắc nhở đến những nhân viên này không?';

  var response = SpreadsheetApp.getUi().alert('Quản Lý Hoàn Ứng', msg, SpreadsheetApp.getUi().ButtonSet.YES_NO);
  if (response === SpreadsheetApp.getUi().Button.YES) {
    guiEmailNhacNhoQuaHan(dsQuaHan);
    SpreadsheetApp.getUi().alert('✅ Đã gửi email nhắc nhở hoàn ứng thành công!');
  }
}

function kiemTraPhieuQuaHanHangNgay() {
  var dsQuaHan = layDanhSachPhieuQuaHan();
  if (dsQuaHan.length > 0) guiEmailNhacNhoQuaHan(dsQuaHan);
}

function layDanhSachPhieuQuaHan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PHIEU_TAM_UNG');
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 31).getValues();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var result = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var trangThai = row[15];
    var hanQuyetToan = row[9] ? new Date(row[9]) : null;

    if (trangThai === 'Đã chi tiền' && hanQuyetToan && hanQuyetToan < today) {
      result.push({
        maPhieu: row[0],
        email: row[2],
        hoTen: row[3],
        boPhan: row[4],
        soTien: Number(row[6]),
        hanQuyetToan: Utilities.formatDate(hanQuyetToan, 'GMT+7', 'dd/MM/yyyy')
      });
    }
  }
  return result;
}

function guiEmailNhacNhoQuaHan(ds) {
  for (var i = 0; i < ds.length; i++) {
    var item = ds[i];
    if (!item.email || item.email.indexOf('@') === -1) continue;

    var subject = `[CẢNH BÁO QUÁ HẠN HOÀN ỨNG] Phiếu ${item.maPhieu} - ${item.hoTen}`;
    var body = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
        <h3 style="color: #c53030; margin-top: 0;">⚠️ THÔNG BÁO QUÁ HẠN THANH TOÁN TẠM ỨNG</h3>
        <p>Kính gửi Anh/Chị <strong>${item.hoTen}</strong>,</p>
        <p>Khoản tạm ứng theo phiếu <strong>${item.maPhieu}</strong> của Anh/Chị đã quá hạn quyết toán (${item.hanQuyetToan}).</p>
        <p>Vui lòng tập hợp hóa đơn và làm thủ tục quyết toán hoàn ứng sớm nhất.</p>
      </div>
    `;

    MailApp.sendEmail({
      to: item.email,
      subject: subject,
      htmlBody: body
    });
  }
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
