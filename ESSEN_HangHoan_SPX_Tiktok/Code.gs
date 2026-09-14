/**
 * GOOGLE APPS SCRIPT - QUẢN LÝ VẬN ĐƠN THEO TỪNG THÁNG (T9, T10, T11...)
 * - Tự động chia dữ liệu theo từng sheet Tháng (T1 -> T12).
 * - Giao diện chuẩn 100% theo mẫu:
 *   + Dòng 1: Thanh tiêu đề màu Xanh Lá (KHO ĐIỂN)
 *   + Dòng 2: Tiêu đề xám (Ngày | STT | Mã vận đơn | Note)
 *   + Dữ liệu: Hợp nhất (Merge) ô Ngày theo định dạng d/M (ví dụ 10/9), STT đánh số theo ngày, kẻ viền đen rõ nét.
 * - Tự động đồng bộ ngay khi quét mã trên AppSheet qua trigger onChange.
 */

// Tên hiển thị ở dòng 1 của các sheet Tháng (Bạn có thể đổi nếu muốn)
var TEN_KHO = "KHO ĐIỂN"; // Hoặc đổi thành "ESSEN | Hàng hoàn SPX/Tiktok"

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📦 ESSEN | Hàng hoàn SPX/Tiktok')
    .addItem('🔄 Cập nhật tất cả các Sheet Tháng (T9, T10...)', 'capNhatTatCaCacThang')
    .addItem('⚡ Bật Tự Động Đồng Bộ (Khi AppSheet Quét Đơn Mới)', 'caiDatTuDongCapNhat')
    .addToUi();
}

/**
 * Cài đặt Trigger onChange để tự động cập nhật mỗi khi AppSheet quét đơn mới
 */
function caiDatTuDongCapNhat() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Xóa trigger cũ nếu có
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'tuDongDongBoKhiThemDon') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Tạo trigger onChange mới
  ScriptApp.newTrigger('tuDongDongBoKhiThemDon')
    .forSpreadsheet(ss)
    .onChange()
    .create();
    
  // Chạy đồng bộ ngay lập tức
  capNhatTatCaCacThang();
  
  SpreadsheetApp.getUi().alert(
    '✅ ĐÃ BẬT TỰ ĐỘNG ĐỒNG BỘ THÀNH CÔNG!\n\n' +
    'Từ bây giờ, mỗi khi bạn quét mã trên điện thoại qua AppSheet:\n' +
    'Hệ thống sẽ tự động phân loại vào đúng sheet Tháng (ví dụ T9, T10...), gộp ô ngày và đánh số STT theo đúng giao diện mẫu!'
  );
}

function tuDongDongBoKhiThemDon(e) {
  capNhatTatCaCacThang();
}

/**
 * Hàm chính: Đọc dữ liệu từ DATA_QUET, phân chia theo tháng và tạo/cập nhật các sheet T9, T10...
 */
function capNhatTatCaCacThang() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNguon = ss.getSheetByName('DATA_QUET');
  
  if (!sheetNguon) {
    return;
  }
  
  var dataNguon = sheetNguon.getDataRange().getValues();
  if (dataNguon.length <= 1) {
    return;
  }
  
  var headers = dataNguon[0];
  var colNgayIdx = headers.indexOf('NgayQuet');
  var colMaIdx = headers.indexOf('MaVanDon');
  var colGhiChuIdx = headers.indexOf('GhiChu');
  
  if (colNgayIdx === -1 || colMaIdx === -1) {
    return;
  }
  
  // Gom dữ liệu theo Tháng -> theo Ngày
  // Cấu trúc: dataByMonth[thang] = [ { ngayRaw, ngayHienThi, ma, ghiChu }, ... ]
  var dataByMonth = {};
  var lastParsedDate = null;
  
  for (var i = 1; i < dataNguon.length; i++) {
    var row = dataNguon[i];
    var ngayVal = row[colNgayIdx];
    var maVal = row[colMaIdx];
    var ghiChuVal = (colGhiChuIdx !== -1) ? row[colGhiChuIdx] : '';
    
    if (!maVal || maVal.toString().trim() === '') continue;
    
    var parsed = parseDateInfo(ngayVal, lastParsedDate);
    if (!parsed) continue;
    lastParsedDate = parsed; // Lưu lại phòng khi ô dưới bị trống
    
    var thangKey = 'T' + parsed.month; // Ví dụ: "T9", "T10"
    
    if (!dataByMonth[thangKey]) {
      dataByMonth[thangKey] = [];
    }
    
    dataByMonth[thangKey].push({
      day: parsed.day,
      month: parsed.month,
      year: parsed.year,
      ngayHienThi: parsed.day + '/' + parsed.month, // Định dạng "10/9", "14/9"
      dateSortKey: parsed.year * 10000 + parsed.month * 100 + parsed.day,
      ma: maVal.toString().trim(),
      ghiChu: ghiChuVal ? ghiChuVal.toString().trim() : ''
    });
  }
  
  // Duyệt qua từng tháng để cập nhật sheet tương ứng
  for (var sheetName in dataByMonth) {
    xuatDuLieuChoSheetThang(ss, sheetName, dataByMonth[sheetName]);
  }
}

/**
 * Xuất dữ liệu và định dạng cho 1 Sheet Tháng cụ thể (ví dụ: T9)
 */
function xuatDuLieuChoSheetThang(ss, sheetName, danhSachDon) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Xóa trắng toàn bộ sheet để render mới
  sheet.clear();
  
  // 1. DÒNG 1: Tiêu đề KHO ĐIỂN (Nền xanh lá cây #00FF00)
  var row1Values = [[TEN_KHO, TEN_KHO, TEN_KHO, TEN_KHO]];
  var rangeRow1 = sheet.getRange(1, 1, 1, 4);
  rangeRow1.setValues(row1Values);
  rangeRow1.setBackground('#00FF00'); // Xanh neon / green
  rangeRow1.setFontColor('#000000');
  rangeRow1.setFontWeight('bold');
  rangeRow1.setFontStyle('italic');
  rangeRow1.setHorizontalAlignment('center');
  rangeRow1.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 28);
  
  // 2. DÒNG 2: Header Ngày | STT | Mã vận đơn | Note (Nền xám #D9D9D9)
  var row2Values = [['Ngày', 'STT', 'Mã vận đơn', 'Note']];
  var rangeRow2 = sheet.getRange(2, 1, 1, 4);
  rangeRow2.setValues(row2Values);
  rangeRow2.setBackground('#D9D9D9'); // Xám nhạt
  rangeRow2.setFontColor('#000000');
  rangeRow2.setFontWeight('bold');
  rangeRow2.setHorizontalAlignment('center');
  rangeRow2.setVerticalAlignment('middle');
  sheet.setRowHeight(2, 28);
  
  if (danhSachDon.length === 0) return;
  
  // 3. Chuẩn bị dữ liệu và đánh số STT theo ngày
  // Đảm bảo dữ liệu sắp xếp theo ngày
  danhSachDon.sort(function(a, b) {
    return a.dateSortKey - b.dateSortKey;
  });
  
  var outputRows = [];
  var dateGroupInfo = []; // Lưu vị trí bắt đầu và số lượng đơn của từng ngày để Merge
  var currentNgay = '';
  var currentSTT = 0;
  var currentGroupStart = 0;
  
  for (var i = 0; i < danhSachDon.length; i++) {
    var don = danhSachDon[i];
    
    if (don.ngayHienThi !== currentNgay) {
      // Đóng nhóm ngày trước nếu có
      if (currentNgay !== '') {
        dateGroupInfo.push({
          startRow: 3 + currentGroupStart,
          count: i - currentGroupStart,
          ngay: currentNgay
        });
      }
      currentNgay = don.ngayHienThi;
      currentGroupStart = i;
      currentSTT = 1; // STT đếm lại từ 1 cho ngày mới
    } else {
      currentSTT++;
    }
    
    outputRows.push([
      don.ngayHienThi,
      currentSTT,
      don.ma,
      don.ghiChu
    ]);
  }
  
  // Đóng nhóm cuối cùng
  if (currentNgay !== '') {
    dateGroupInfo.push({
      startRow: 3 + currentGroupStart,
      count: danhSachDon.length - currentGroupStart,
      ngay: currentNgay
    });
  }
  
  // Điền dữ liệu các dòng
  var startDataRow = 3;
  var dataRange = sheet.getRange(startDataRow, 1, outputRows.length, 4);
  dataRange.setValues(outputRows);
  
  // Định dạng căn lề
  sheet.getRange(startDataRow, 1, outputRows.length, 1).setHorizontalAlignment('center'); // Ngày
  sheet.getRange(startDataRow, 2, outputRows.length, 1).setHorizontalAlignment('center'); // STT
  sheet.getRange(startDataRow, 3, outputRows.length, 1).setHorizontalAlignment('center'); // Mã vận đơn
  sheet.getRange(startDataRow, 4, outputRows.length, 1).setHorizontalAlignment('left');   // Note
  
  // 4. HỢP NHẤT (MERGE) CỘT NGÀY CHO CÙNG MỘT NGÀY
  for (var g = 0; g < dateGroupInfo.length; g++) {
    var group = dateGroupInfo[g];
    var cellNgay = sheet.getRange(group.startRow, 1, group.count, 1);
    if (group.count > 1) {
      cellNgay.merge();
    }
    cellNgay.setVerticalAlignment('middle');
    cellNgay.setHorizontalAlignment('center');
  }
  
  // 5. KẺ VIỀN ĐEN ĐẬM CHUẨN MẪU (BORDERS)
  var totalRows = outputRows.length + 2; // Gồm dòng 1, dòng 2 và data
  var fullTableRange = sheet.getRange(1, 1, totalRows, 4);
  fullTableRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  
  // 6. CĂN CHỈNH ĐỘ RỘNG CỘT CHO ĐẸP MẮT
  sheet.setColumnWidth(1, 110); // Cột Ngày
  sheet.setColumnWidth(2, 65);  // Cột STT
  sheet.setColumnWidth(3, 230); // Cột Mã vận đơn
  sheet.setColumnWidth(4, 300); // Cột Note
  
  // Đóng băng 2 dòng tiêu đề
  sheet.setFrozenRows(2);
}

/**
 * Xử lý bóc tách Ngày, Tháng, Năm từ dữ liệu nguồn
 */
function parseDateInfo(val, fallback) {
  if (!val || val.toString().trim() === '') {
    return fallback;
  }
  
  var d, m, y;
  if (val instanceof Date) {
    d = val.getDate();
    m = val.getMonth() + 1;
    y = val.getFullYear();
    return { day: d, month: m, year: y };
  }
  
  var str = val.toString().trim();
  // Dạng DD/MM/YYYY hoặc D/M/YYYY
  if (str.indexOf('/') !== -1) {
    var parts = str.split('/');
    if (parts.length >= 2) {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parts.length >= 3 ? parseInt(parts[2], 10) : new Date().getFullYear();
      if (!isNaN(d) && !isNaN(m)) {
        return { day: d, month: m, year: y };
      }
    }
  }
  
  // Dạng YYYY-MM-DD
  if (str.indexOf('-') !== -1) {
    var partsDash = str.split('-');
    if (partsDash.length === 3) {
      y = parseInt(partsDash[0], 10);
      m = parseInt(partsDash[1], 10);
      d = parseInt(partsDash[2].substring(0, 2), 10);
      if (!isNaN(d) && !isNaN(m)) {
        return { day: d, month: m, year: y };
      }
    }
  }
  
  return fallback;
}
