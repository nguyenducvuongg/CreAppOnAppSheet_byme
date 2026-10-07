/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - HỆ THỐNG QUẢN LÝ & DUYỆT PHIẾU TẠM ỨNG CÔNG TY
 * =========================================================================
 * - Tự động đồng bộ với Google AppSheet
 * - Tạo mã phiếu tự động (TU-YYMM-XXXX)
 * - Tự động chuyển đổi số tiền thành chữ tiếng Việt chuẩn xác
 * - Gửi email thông báo phê duyệt & từ chối tự động
 * - Cảnh báo nhắc nhở các phiếu quá hạn hoàn ứng
 * - Xuất mẫu in Phiếu Tạm Ứng chuẩn Mẫu 03-TT Bộ Tài Chính (HTML / PDF)
 * - Định dạng trang tính tài chính chuyên nghiệp
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
    .addItem('✉️ Gửi Email thông báo trạng thái phiếu', 'guiEmailThongBaoThuCong')
    .addItem('⏰ Kiểm tra & Cảnh báo phiếu quá hạn hoàn ứng', 'kiemTraPhieuQuaHan')
    .addSeparator()
    .addItem('⚡ Cài đặt Trigger tự động khi AppSheet thêm phiếu', 'caiDatTriggerTuDong')
    .addToUi();
}

/**
 * Cài đặt Trigger tự động chạy khi có chỉnh sửa hoặc AppSheet cập nhật
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
  
  // Tạo trigger onChange cho AppSheet
  ScriptApp.newTrigger('xuLyKhiCoThayDoi')
    .forSpreadsheet(ss)
    .onChange()
    .create();

  // Tạo trigger chạy quét quá hạn mỗi sáng lúc 8h
  ScriptApp.newTrigger('kiemTraPhieuQuaHanHangNgay')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();
    
  SpreadsheetApp.getUi().alert(
    '✅ ĐÃ CÀI ĐẶT TRIGGER TỰ ĐỘNG THÀNH CÔNG!\n\n' +
    '1. Hệ thống sẽ tự động cập nhật số tiền bằng chữ, mã phiếu khi có dữ liệu từ AppSheet.\n' +
    '2. Tự động kiểm tra và gửi email nhắc hoàn ứng mỗi 8:00 sáng hàng ngày.'
  );
}

/**
 * Trigger tự động khi AppSheet thêm hoặc sửa dữ liệu
 */
function xuLyKhiCoThayDoi(e) {
  tuDongDienSoTienBangChuVaMaPhieu();
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

  // Định dạng Header dòng 1
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground('#1A365D') // Navy Blue sang trọng
             .setFontColor('#FFFFFF')
             .setFontWeight('bold')
             .setFontFamily('Arial')
             .setFontSize(10)
             .setHorizontalAlignment('center')
             .setVerticalAlignment('middle')
             .setWrap(true);
  sheet.setRowHeight(1, 40);

  // Kẻ bảng và định dạng dữ liệu
  if (lastRow > 1) {
    var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    dataRange.setFontFamily('Arial')
             .setFontSize(10)
             .setVerticalAlignment('middle');
             
    // Kẻ viền mỏng
    dataRange.setBorder(true, true, true, true, true, true, '#CBD5E0', SpreadsheetApp.BorderStyle.SOLID);
    
    // Căn lề số tiền
    sheet.getRange(2, 7, lastRow - 1, 1).setNumberFormat('#,##0 "₫"').setHorizontalAlignment('right');
    sheet.getRange(2, 29, lastRow - 1, 2).setNumberFormat('#,##0 "₫"').setHorizontalAlignment('right');
    
    // Căn lề ngày
    sheet.getRange(2, 2, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd').setHorizontalAlignment('center');
    sheet.getRange(2, 10, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd').setHorizontalAlignment('center');
    sheet.getRange(2, 18, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm').setHorizontalAlignment('center');
    sheet.getRange(2, 21, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm').setHorizontalAlignment('center');
    sheet.getRange(2, 24, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm').setHorizontalAlignment('center');
  }

  // Tự động căn chỉnh độ rộng cột
  for (var c = 1; c <= Math.min(lastCol, 15); c++) {
    sheet.autoResizeColumn(c);
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

  // Lấy chi tiết các mục tạm ứng từ sheet CHI_TIET_TAM_UNG
  var htmlChiTiet = layBangChiTietHangMuc(maPhieu);

  var htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; margin: 25px; line-height: 1.5; color: #000; }
        .header-table { width: 100%; margin-bottom: 10px; }
        .header-table td { vertical-align: top; }
        .title { text-align: center; margin: 20px 0 10px 0; }
        .title h2 { margin: 0; font-size: 18pt; text-transform: uppercase; font-weight: bold; }
        .title p { margin: 5px 0 0 0; font-style: italic; font-size: 11pt; }
        .info-row { margin: 8px 0; }
        .dots { border-bottom: 1px dotted #000; display: inline-block; }
        .amount-highlight { font-weight: bold; font-size: 14pt; }
        table.detail-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        table.detail-table th, table.detail-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
        table.detail-table th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
        .signature-table { width: 100%; margin-top: 30px; text-align: center; page-break-inside: avoid; }
        .signature-table td { vertical-align: top; width: 20%; padding: 5px; }
        .signature-title { font-weight: bold; font-size: 12pt; }
        .signature-sub { font-style: italic; font-size: 10pt; }
        .signature-space { height: 70px; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-weight: bold; font-size: 10pt; border: 1px solid #1A365D; color: #1A365D; }
        @media print {
          .no-print { display: none; }
          body { margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <span class="status-badge">Trạng thái: ${trangThai}</span>
        <button onclick="window.print()" style="padding: 8px 16px; background: #0066cc; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-left: 10px;">
          🖨️ In Phiếu / Lưu PDF
        </button>
      </div>

      <table class="header-table">
        <tr>
          <td style="width: 60%;">
            <strong>${TEN_CONG_TY}</strong><br>
            <span>Địa chỉ: ${DIA_CHI_CONG_TY}</span><br>
            <span>Bộ phận: <strong>${boPhan}</strong></span>
          </td>
          <td style="width: 40%; text-align: center;">
            <strong>Mẫu số 03 - TT</strong><br>
            <span style="font-size: 10pt; font-style: italic;">(Ban hành theo Thông tư 200/2014/TT-BTC & TT 133/2016/TT-BTC)</span><br>
            <span style="font-weight: bold; font-size: 11pt;">Số: ${maPhieu}</span>
          </td>
        </tr>
      </table>

      <div class="title">
        <h2>PHIẾU TẠM ỨNG</h2>
        <p>Ngày ${ngayDeNghi.split('/')[0]} tháng ${ngayDeNghi.split('/')[1]} năm ${ngayDeNghi.split('/')[2]}</p>
      </div>

      <div class="info-row">- Họ và tên người đề nghị: <strong>${hoTen}</strong></div>
      <div class="info-row">- Bộ phận (Phòng ban): <strong>${boPhan}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - Chức vụ: <strong>${chucVu}</strong></div>
      <div class="info-row">- Số tiền tạm ứng: <span class="amount-highlight">${formatVND(soTien)}</span></div>
      <div class="info-row">- Viết bằng chữ: <em>${soTienChu}</em></div>
      <div class="info-row">- Lý do tạm ứng: ${lyDo}</div>
      <div class="info-row">- Thời hạn thanh toán (hoàn ứng): <strong>${hanQuyetToan}</strong></div>
      <div class="info-row">- Hình thức nhận tiền: <strong>${hinhThuc}</strong> ${soTK ? `(STK: ${soTK} - ${nganHang})` : ''}</div>

      <div style="margin-top: 15px;"><strong>Chi tiết các hạng mục tạm ứng:</strong></div>
      ${htmlChiTiet}

      <table class="signature-table">
        <tr>
          <td>
            <div class="signature-title">Giám đốc</div>
            <div class="signature-sub">(Ký, họ tên)</div>
            <div class="signature-space"></div>
            <div><strong>${rowData[22] ? rowData[22].split('@')[0] : ''}</strong></div>
          </td>
          <td>
            <div class="signature-title">Kế toán trưởng</div>
            <div class="signature-sub">(Ký, họ tên)</div>
            <div class="signature-space"></div>
            <div><strong>${rowData[19] ? rowData[19].split('@')[0] : ''}</strong></div>
          </td>
          <td>
            <div class="signature-title">Trưởng bộ phận</div>
            <div class="signature-sub">(Ký, họ tên)</div>
            <div class="signature-space"></div>
            <div><strong>${rowData[16] ? rowData[16].split('@')[0] : ''}</strong></div>
          </td>
          <td>
            <div class="signature-title">Thủ quỹ</div>
            <div class="signature-sub">(Ký, họ tên)</div>
            <div class="signature-space"></div>
            <div><strong>${rowData[26] || ''}</strong></div>
          </td>
          <td>
            <div class="signature-title">Người tạm ứng</div>
            <div class="signature-sub">(Ký, họ tên)</div>
            <div class="signature-space"></div>
            <div><strong>${hoTen}</strong></div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(900)
    .setHeight(700)
    .setTitle('In Phiếu Tạm Ứng - ' + maPhieu);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🖨️ Xem & In Phiếu: ' + maPhieu);
}

/**
 * Lấy bảng chi tiết các hạng mục chi từ sheet CHI_TIET_TAM_UNG
 */
function layBangChiTietHangMuc(maPhieu) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CHI_TIET_TAM_UNG');
  if (!sheet) return '<p><em>(Không có bảng chi tiết)</em></p>';

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return '<p><em>(Không có khoản chi tiết)</em></p>';

  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var rowsHtml = '';
  var stt = 1;
  var tong = 0;

  for (var i = 0; i < data.length; i++) {
    if (data[i][1] === maPhieu) {
      var hangMuc = data[i][2];
      var tien = Number(data[i][3]) || 0;
      var ghiChu = data[i][4] || '';
      tong += tien;
      rowsHtml += `
        <tr>
          <td style="text-align: center;">${stt++}</td>
          <td>${hangMuc}</td>
          <td style="text-align: right; font-weight: bold;">${formatVND(tien)}</td>
          <td>${ghiChu}</td>
        </tr>
      `;
    }
  }

  if (stt === 1) {
    return '<p><em>(Không có dòng chi tiết nào khớp với mã phiếu)</em></p>';
  }

  return `
    <table class="detail-table">
      <thead>
        <tr>
          <th style="width: 8%;">STT</th>
          <th style="width: 45%;">Nội dung / Hạng mục chi</th>
          <th style="width: 22%;">Số tiền</th>
          <th style="width: 25%;">Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr style="font-weight: bold; background: #fafafa;">
          <td colspan="2" style="text-align: right;">CỘNG:</td>
          <td style="text-align: right; color: #b30000;">${formatVND(tong)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  `;
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
  if (dsQuaHan.length > 5) {
    msg += '... và còn ' + (dsQuaHan.length - 5) + ' phiếu khác.\n';
  }
  msg += '\nBạn có muốn gửi Email tự động nhắc nhở đến những nhân viên này không?';

  var response = SpreadsheetApp.getUi().alert('Quản Lý Hoàn Ứng', msg, SpreadsheetApp.getUi().ButtonSet.YES_NO);
  if (response === SpreadsheetApp.getUi().Button.YES) {
    guiEmailNhacNhoQuaHan(dsQuaHan);
    SpreadsheetApp.getUi().alert('✅ Đã gửi email nhắc nhở hoàn ứng thành công!');
  }
}

/**
 * Hàm chạy trigger tự động mỗi sáng
 */
function kiemTraPhieuQuaHanHangNgay() {
  var dsQuaHan = layDanhSachPhieuQuaHan();
  if (dsQuaHan.length > 0) {
    guiEmailNhacNhoQuaHan(dsQuaHan);
  }
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
    var trangThai = row[15]; // Cột P
    var hanQuyetToan = row[9] ? new Date(row[9]) : null;

    // Phiếu đã chi tiền nhưng chưa quyết toán hoàn ứng
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

/**
 * Gửi email nhắc nhở hoàn ứng
 */
function guiEmailNhacNhoQuaHan(ds) {
  for (var i = 0; i < ds.length; i++) {
    var item = ds[i];
    if (!item.email || item.email.indexOf('@') === -1) continue;

    var subject = `[CẢNH BÁO QUÁ HẠN HOÀN ỨNG] Phiếu ${item.maPhieu} - ${item.hoTen}`;
    var body = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
        <h3 style="color: #c53030; margin-top: 0;">⚠️ THÔNG BÁO QUÁ HẠN THANH TOÁN TẠM ỨNG</h3>
        <p>Kính gửi Anh/Chị <strong>${item.hoTen}</strong>,</p>
        <p>Phòng Kế toán xin thông báo: Khoản tạm ứng theo phiếu <strong>${item.maPhieu}</strong> của Anh/Chị đã quá hạn quyết toán hoàn ứng.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 6px; background: #f7fafc; width: 40%;"><strong>Mã phiếu:</strong></td><td style="padding: 6px;">${item.maPhieu}</td></tr>
          <tr><td style="padding: 6px; background: #f7fafc;"><strong>Số tiền tạm ứng:</strong></td><td style="padding: 6px; font-weight: bold; color: #c53030;">${formatVND(item.soTien)}</td></tr>
          <tr><td style="padding: 6px; background: #f7fafc;"><strong>Hạn hoàn ứng:</strong></td><td style="padding: 6px; font-weight: bold;">${item.hanQuyetToan}</td></tr>
          <tr><td style="padding: 6px; background: #f7fafc;"><strong>Bộ phận:</strong></td><td style="padding: 6px;">${item.boPhan}</td></tr>
        </table>
        <p>Vui lòng tập hợp đầy đủ hóa đơn, chứng từ hợp lệ và gửi hồ sơ quyết toán hoàn ứng lên hệ thống AppSheet sớm nhất.</p>
        <p style="color: #718096; font-size: 12px; margin-top: 25px; border-top: 1px solid #edf2f7; pt: 10px;">
          Email tự động từ Hệ thống Quản lý Tạm ứng - ${TEN_CONG_TY}.
        </p>
      </div>
    `;

    MailApp.sendEmail({
      to: item.email,
      subject: subject,
      htmlBody: body
    });
  }
}

/**
 * Gửi email thông báo cho người duyệt khi có phiếu cần xử lý
 */
function guiEmailThongBaoThuCong() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PHIEU_TAM_UNG');
  var activeRow = sheet.getActiveCell().getRow();

  if (activeRow < 2) {
    SpreadsheetApp.getUi().alert('⚠️ Vui lòng chọn dòng phiếu bạn muốn gửi email thông báo!');
    return;
  }

  var row = sheet.getRange(activeRow, 1, 1, 31).getValues()[0];
  var maPhieu = row[0];
  var hoTen = row[3];
  var soTien = Number(row[6]);
  var trangThai = row[15];
  var emailNhan = '';
  var tieuDeVaiTro = '';

  if (trangThai === 'Chờ Quản lý duyệt') {
    emailNhan = row[16];
    tieuDeVaiTro = 'Trưởng bộ phận';
  } else if (trangThai === 'Chờ Kế toán duyệt') {
    emailNhan = row[19] || 'ketoan@congty.com';
    tieuDeVaiTro = 'Kế toán';
  } else if (trangThai === 'Chờ Giám đốc duyệt') {
    emailNhan = row[22] || 'giamdoc@congty.com';
    tieuDeVaiTro = 'Ban Giám Đốc';
  } else if (trangThai === 'Đã duyệt - Chờ chi tiền') {
    emailNhan = 'thuquy@congty.com';
    tieuDeVaiTro = 'Thủ quỹ';
  } else {
    emailNhan = row[2]; // Gửi cho nhân viên
    tieuDeVaiTro = 'Nhân viên';
  }

  if (!emailNhan || emailNhan.indexOf('@') === -1) {
    SpreadsheetApp.getUi().alert('⚠️ Chưa xác định được email người nhận cho trạng thái "' + trangThai + '"!');
    return;
  }

  var subject = `[${APP_NAME}] Phiếu ${maPhieu} - ${trangThai} (${formatVND(soTien)})`;
  var htmlBody = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; max-width: 600px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 24px;">
      <h2 style="color: #1e3a8a; margin-top: 0;">Thông Báo Phiếu Tạm Ứng</h2>
      <p>Kính gửi <strong>${tieuDeVaiTro}</strong>,</p>
      <p>Hệ thống có cập nhật trạng thái phiếu tạm ứng như sau:</p>
      <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Mã phiếu:</strong> ${maPhieu}</p>
        <p style="margin: 4px 0;"><strong>Người đề nghị:</strong> ${hoTen} (${row[4]})</p>
        <p style="margin: 4px 0;"><strong>Số tiền:</strong> <span style="font-weight: bold; color: #b91c1c; font-size: 16px;">${formatVND(soTien)}</span></p>
        <p style="margin: 4px 0;"><strong>Lý do:</strong> ${row[8]}</p>
        <p style="margin: 4px 0;"><strong>Trạng thái:</strong> <span style="color: #1d4ed8; font-weight: bold;">${trangThai}</span></p>
      </div>
      <p>Vui lòng mở ứng dụng <strong>AppSheet</strong> trên điện thoại hoặc máy tính để duyệt / kiểm tra phiếu.</p>
      <div style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 12px; color: #64748b;">
        Hệ thống Phê Duyệt Phiếu Tạm Ứng - Tự động từ Google Apps Script.
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: emailNhan,
    subject: subject,
    htmlBody: htmlBody
  });

  SpreadsheetApp.getUi().alert('✅ Đã gửi email thông báo tới: ' + emailNhan);
}

/**
 * Định dạng tiền tệ VNĐ
 */
function formatVND(amount) {
  return Number(amount || 0).toLocaleString('vi-VN') + ' VNĐ';
}

/**
 * Chuyển đổi số thành chữ tiếng Việt chuẩn xác
 */
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

    if (c > 0 || dayDu) {
      str += chuSo[c] + ' trăm ';
    }

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
      var s = doc3So(n, i < block.length - 1);
      ketQua += s + ' ' + tien[i] + ' ';
    }
  }

  ketQua = ketQua.trim();
  if (ketQua === '') return 'Không đồng';

  // Viết hoa chữ cái đầu và thêm chữ 'đồng chẵn'
  ketQua = ketQua.charAt(0).toUpperCase() + ketQua.slice(1) + ' đồng chẵn';
  return ketQua.replace(/\s+/g, ' ');
}
