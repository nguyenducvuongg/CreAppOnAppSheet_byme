/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - HỆ THỐNG GỬI EMAIL TỰ ĐỘNG THEO ĐÚNG QUY TRÌNH THỰC TẾ
 * =========================================================================
 * QUY TRÌNH DUYỆT 5 BƯỚC:
 * 1. Nhân viên lập phiếu -> Gửi Kế toán kiểm tra (Chờ Kế toán duyệt)
 * 2. Kế toán duyệt -> Gửi Bạn phụ trách để trình Sếp (Kế toán đã duyệt - Chờ trình Sếp)
 * 3. Bạn bấm Trình Sếp -> Gửi Sếp xem xét (Chờ Sếp duyệt)
 * 4. Sếp phê duyệt -> Báo Bạn in phiếu giấy Mẫu 03-TT đưa Kế toán (Sếp đã duyệt - Chờ in phiếu)
 * 5. Bạn chuyển Kế toán -> Kế toán xuất tiền mặt / chuyển khoản (Đã xuất tiền)
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
    .addItem('🖨️ Xuất mẫu in Phiếu đang chọn (Mẫu 03-TT)', 'xuatMauInPhieuHienTai')
    .addItem('🎨 Định dạng bảng tính đẹp', 'dinhDangGiaoDienTrangTinh')
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

  // Quét gửi ngay
  var ketQua = xuLyKiemTraVaGuiEmail(false);
  
  SpreadsheetApp.getUi().alert(
    '🎉 ĐÃ KÍCH HOẠT QUY TRÌNH GỬI EMAIL TỰ ĐỘNG THÀNH CÔNG!\n\n' +
    'Quy trình vận hành:\n' +
    '1. Nvien tạo phiếu ➔ Gửi Kế toán\n' +
    '2. Kế toán duyệt ➔ Gửi Bạn để Trình Sếp\n' +
    '3. Bạn Trình Sếp ➔ Gửi Sếp\n' +
    '4. Sếp duyệt ➔ Báo Bạn in phiếu đưa Kế toán\n' +
    '5. Kế toán xuất tiền ➔ Báo Nhân viên nhận tiền\n\n' +
    'Kết quả quét hiện tại:\n' + ketQua
  );
}

/**
 * Hàm trigger ngầm khi có thay đổi từ AppSheet
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
  SpreadsheetApp.getUi().alert('📋 KẾT QUẢ QUÉT & GỬI EMAIL THEO QUY TRÌNH MỚI:\n\n' + ketQua);
}

/**
 * HÀM XỬ LÝ CHÍNH: QUÉT & GỬI EMAIL ĐÚNG THEO QUY TRÌNH 5 BƯỚC
 */
function xuLyKiemTraVaGuiEmail(laThuCong) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPhieu = ss.getSheetByName('PHIEU_TAM_UNG');
  var sheetNV = ss.getSheetByName('DANH_MUC_NHAN_VIEN');

  if (!sheetPhieu) return '❌ Không tìm thấy trang tính PHIEU_TAM_UNG!';
  if (!sheetNV) return '❌ Không tìm thấy trang tính DANH_MUC_NHAN_VIEN!';

  var lastRow = sheetPhieu.getLastRow();
  if (lastRow < 2) return 'ℹ️ Bảng PHIEU_TAM_UNG chưa có dòng dữ liệu nào.';

  // Đọc Header dòng 1
  var maxCol = sheetPhieu.getMaxColumns();
  var headerRange = sheetPhieu.getRange(1, 1, 1, sheetPhieu.getLastColumn()).getValues()[0];
  
  var colMap = {};
  for (var c = 0; c < headerRange.length; c++) {
    var hName = (headerRange[c] || '').toString().trim();
    if (hName) colMap[hName] = c + 1;
  }

  // Tự động tạo cột TrangThaiDaGuiMail nếu chưa có
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

  // Lấy vị trí cột
  var colMaPhieu = colMap['MaPhieu'] || 1;
  var colEmailNV = colMap['EmailNhanVien'] || 3;
  var colHoTenNV = colMap['HoTenNhanVien'] || 4;
  var colBoPhan = colMap['BoPhan'] || 5;
  var colSoTien = colMap['SoTienTamUng'] || 7;
  var colLyDo = colMap['LyDoTamUng'] || 9;
  var colHanQT = colMap['HanQuyetToan'] || 10;
  var colSoTK = colMap['SoTaiKhoan'] || 12;
  var colNganHang = colMap['NganHang'] || 13;
  var colTrangThai = colMap['TrangThai'] || 16;

  // Lấy danh bạ email
  var mapNV = layBanDoNhanVien(sheetNV);

  // Đọc dữ liệu
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

    // Nếu trạng thái chưa gửi mail
    if (trangThaiHienTai !== '' && trangThaiHienTai !== trangThaiDaGui) {
      var ketQuaGui = xuLyGuiEmailQuyTrinhMoi(
        trangThaiHienTai, 
        maPhieu, 
        emailNV, 
        hoTenNV, 
        boPhan, 
        soTien, 
        lyDo, 
        hanQT, 
        soTK, 
        nganHang, 
        mapNV
      );

      if (ketQuaGui.thanhCong) {
        sheetPhieu.getRange(rowIndex, colGuiMail).setValue(trangThaiHienTai);
        soLuongDaGui += ketQuaGui.soNguoiNhan;
        chiTietGui.push(`• [${maPhieu}] ${trangThaiHienTai} ➔ ${ketQuaGui.danhSachNhan.join(', ')}`);
      } else {
        chiTietGui.push(`• [${maPhieu}] Bỏ qua: ${ketQuaGui.lyDo}`);
      }
    }
  }

  if (soLuongDaGui === 0) {
    if (chiTietGui.length > 0) return chiTietGui.join('\n');
    return '✅ Tất cả các phiếu hiện tại đều đã được gửi email trước đó, không có cập nhật mới.';
  }

  return `🎉 Đã gửi thành công ${soLuongDaGui} email:\n` + chiTietGui.join('\n');
}

/**
 * XỬ LÝ GỬI EMAIL CHÍNH XÁC THEO 5 BƯỚC:
 * 1. Chờ Kế toán duyệt -> Gửi Kế toán
 * 2. Kế toán đã duyệt - Chờ trình Sếp -> Gửi Bạn phụ trách (gnasche.ai@gmail.com / TruongBoPhan)
 * 3. Chờ Sếp duyệt -> Gửi Sếp (phuongnt.work28@gmail.com / GiamDoc)
 * 4. Sếp đã duyệt - Chờ in phiếu -> Báo Bạn in phiếu & Kế toán chuẩn bị tiền
 * 5. Chờ Kế toán xuất tiền -> Gửi Kế toán
 * 6. Đã xuất tiền -> Gửi Nhân viên
 * 7. Từ chối -> Gửi Nhân viên
 */
function xuLyGuiEmailQuyTrinhMoi(trangThai, maPhieu, emailNV, hoTenNV, boPhan, soTien, lyDo, hanQT, soTK, nganHang, mapNV) {
  var dsEmailNhan = [];
  var tieuDeMail = '';
  var loiChao = '';
  var thongDiep = '';
  var mauSac = '#2563eb';
  var tienStr = formatVND(soTien);

  // BƯỚC 1: Nhân viên tạo phiếu -> Gửi Kế toán thẩm định
  if (trangThai === 'Chờ Kế toán duyệt' || trangThai === 'Chờ Quản lý duyệt') {
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachKeToan);
    tieuDeMail = `[Kế Toán Thẩm Định] Nhân viên ${hoTenNV} đề nghị tạm ứng ${tienStr} (${maPhieu})`;
    loiChao = 'Kính gửi Bộ phận Kế toán,';
    thongDiep = `Nhân viên <strong>${hoTenNV}</strong> vừa tạo giấy đề nghị tạm ứng số tiền <strong>${tienStr}</strong>. Kính đề nghị Kế toán kiểm tra chứng từ, định mức dự toán trước khi chuyển trình Sếp.`;
    mauSac = '#7c3aed'; // Màu tím
  }
  // BƯỚC 2: Kế toán duyệt xong -> Gửi Bạn ("Tôi") để Trình Sếp
  else if (trangThai === 'Kế toán đã duyệt - Chờ trình Sếp') {
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachTruongBoPhan);
    tieuDeMail = `[Kế Toán Đã Duyệt] Cần Bạn trình Sếp phiếu tạm ứng ${maPhieu} - ${hoTenNV}`;
    loiChao = 'Kính gửi Bạn phụ trách / Trưởng nhóm,';
    thongDiep = `Kế toán đã kiểm tra và thẩm định xong phiếu tạm ứng của <strong>${hoTenNV}</strong> (${tienStr}). Vui lòng mở AppSheet bấm nút <strong>"🚀 Trình Sếp phê duyệt"</strong> để chuyển lên Ban Giám Đốc.`;
    mauSac = '#d97706'; // Màu cam
  }
  // BƯỚC 3: Bạn bấm Trình Sếp -> Gửi Sếp (Giám đốc)
  else if (trangThai === 'Chờ Sếp duyệt' || trangThai === 'Chờ Giám đốc duyệt') {
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachGiamDoc);
    tieuDeMail = `[Trình Ký Ban Giám Đốc] Đề nghị Sếp duyệt tạm ứng ${tienStr} cho ${hoTenNV} (${maPhieu})`;
    loiChao = 'Kính gửi Sếp (Ban Giám Đốc),';
    thongDiep = `Hồ sơ tạm ứng của nhân viên <strong>${hoTenNV}</strong> đã được Kế toán thẩm định và trình lên Sếp. Kính mong Sếp xem xét và bấm phê duyệt trên AppSheet.`;
    mauSac = '#4f46e5'; // Màu chàm
  }
  // BƯỚC 4: Sếp duyệt xong -> Báo Bạn in phiếu giấy & Kế toán chuẩn bị tiền
  else if (trangThai === 'Sếp đã duyệt - Chờ in phiếu' || trangThai === 'Đã duyệt - Chờ chi tiền') {
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachTruongBoPhan); // Gửi Bạn để in phiếu
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachKeToan);       // Gửi Kế toán chuẩn bị quỹ
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV); // Báo tin vui cho nhân viên
    tieuDeMail = `[Sếp Đã Duyệt] Vui lòng in phiếu tạm ứng ${maPhieu} chuyển Kế toán xuất tiền`;
    loiChao = 'Kính gửi Bạn phụ trách & Kế toán,';
    thongDiep = `Sếp đã <strong>PHÊ DUYỆT</strong> khoản tạm ứng <strong>${tienStr}</strong> của ${hoTenNV}. Bạn hãy mở ứng dụng để in Phiếu Tạm Ứng (Mẫu 03-TT) chuyển sang phòng Kế toán để thực hiện xuất tiền.`;
    mauSac = '#059669'; // Màu xanh lá
  }
  // BƯỚC 5A: Chờ Kế toán xuất tiền
  else if (trangThai === 'Chờ Kế toán xuất tiền') {
    dsEmailNhan = dsEmailNhan.concat(mapNV.danhSachKeToan);
    tieuDeMail = `[Kế Toán Xuất Tiền] Đã nhận phiếu in ${maPhieu} - Xuất quỹ ${tienStr}`;
    loiChao = 'Kính gửi Kế toán / Thủ quỹ,';
    thongDiep = `Phiếu tạm ứng đã được trình Sếp duyệt và in phiếu xong. Kính đề nghị Kế toán thực hiện chi tiền mặt hoặc chuyển khoản cho nhân viên.`;
    mauSac = '#0284c7'; // Xanh cyan
  }
  // BƯỚC 5B: Đã xuất tiền xong -> Báo Nhân viên nhận tiền
  else if (trangThai === 'Đã xuất tiền' || trangThai === 'Đã chi tiền') {
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Đã Xuất Quỹ] Khoản tạm ứng ${tienStr} của bạn đã được chi tiền (${maPhieu})`;
    loiChao = `Kính gửi Anh/Chị ${hoTenNV},`;
    thongDiep = `Kế toán đã thực hiện xuất quỹ chi tiền tạm ứng cho Anh/Chị. Vui lòng kiểm tra tài khoản và lưu giữ đầy đủ hóa đơn chứng từ để quyết toán hoàn ứng đúng hạn (${hanQT}).`;
    mauSac = '#16a34a';
  }
  // TỪ CHỐI
  else if (trangThai === 'Từ chối') {
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Thông Báo Từ Chối] Phiếu đề nghị tạm ứng ${maPhieu} không được duyệt`;
    loiChao = `Kính gửi Anh/Chị ${hoTenNV},`;
    thongDiep = `Rất tiếc, phiếu đề nghị tạm ứng của Anh/Chị đã không được duyệt. Vui lòng kiểm tra lại lý do trên AppSheet hoặc liên hệ quản lý.`;
    mauSac = '#dc2626'; // Màu đỏ
  }
  // ĐÃ QUYẾT TOÁN HOÀN ỨNG
  else if (trangThai === 'Đã quyết toán') {
    if (emailNV && emailNV.indexOf('@') !== -1) dsEmailNhan.push(emailNV);
    tieuDeMail = `[Hoàn Tất Quyết Toán] Hồ sơ tạm ứng ${maPhieu} đã đóng thành công`;
    loiChao = `Kính gửi Anh/Chị ${hoTenNV},`;
    thongDiep = `Kế toán đã xác nhận hoàn tất hồ sơ quyết toán hoàn ứng cho phiếu ${maPhieu}. Công nợ tạm ứng đã được tất toán.`;
    mauSac = '#16a34a';
  }

  dsEmailNhan = xoaEmailTrung(dsEmailNhan);

  if (dsEmailNhan.length === 0) {
    return { thanhCong: false, lyDo: 'Chưa tìm thấy email tương ứng trong DANH_MUC_NHAN_VIEN.' };
  }

  var htmlContent = taoGiaoDienHtmlChuan(
    loiChao, thongDiep, maPhieu, hoTenNV, boPhan, soTien, lyDo, hanQT, soTK, nganHang, trangThai, mauSac
  );

  var soGui = 0;
  for (var k = 0; k < dsEmailNhan.length; k++) {
    var targetEmail = dsEmailNhan[k];
    try {
      GmailApp.sendEmail(targetEmail, tieuDeMail, '', {
        htmlBody: htmlContent,
        name: TEN_CONG_TY
      });
      Logger.log(`✅ [GỬI THÀNH CÔNG] ${maPhieu} -> ${targetEmail}`);
      soGui++;
    } catch (err) {
      Logger.log(`❌ [LỖI GỬI] ${targetEmail}: ${err.toString()}`);
    }
  }

  return { thanhCong: (soGui > 0), soNguoiNhan: soGui, danhSachNhan: dsEmailNhan };
}

/**
 * Giao diện Email HTML chuyên nghiệp
 */
function taoGiaoDienHtmlChuan(loiChao, thongDiep, maPhieu, hoTenNV, boPhan, soTien, lyDo, hanQT, soTK, nganHang, trangThai, mauSac) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background: ${mauSac}; padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 700;">${TEN_CONG_TY}</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">${APP_NAME}</p>
      </div>
      <div style="padding: 24px; color: #334155; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0; font-size: 15px;">${loiChao}</p>
        <p style="margin: 10px 0 16px 0;">${thongDiep}</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Mã phiếu:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 15px;">${maPhieu}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Người đề nghị:</td><td style="padding: 6px 0; font-weight: 600;">${hoTenNV} (${boPhan})</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Số tiền tạm ứng:</td><td style="padding: 6px 0; font-weight: 800; color: #b91c1c; font-size: 17px;">${formatVND(soTien)}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Lý do tạm ứng:</td><td style="padding: 6px 0;">${lyDo}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Hạn hoàn ứng:</td><td style="padding: 6px 0; font-weight: 600; color: #d97706;">${hanQT}</td></tr>
            ${soTK ? `<tr><td style="padding: 6px 0; color: #64748b;">Tài khoản nhận:</td><td style="padding: 6px 0;">${soTK} - ${nganHang}</td></tr>` : ''}
            <tr><td style="padding: 6px 0; color: #64748b;">Trạng thái hiện tại:</td><td style="padding: 6px 0;"><span style="display: inline-block; padding: 3px 10px; background: #e0f2fe; color: #0369a1; border-radius: 9999px; font-weight: 700; font-size: 12px;">${trangThai}</span></td></tr>
          </table>
        </div>
        <p style="text-align: center; margin-top: 20px;">
          <em>Vui lòng mở ứng dụng <strong>AppSheet</strong> trên điện thoại hoặc máy tính để xử lý bước tiếp theo.</em>
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

      if (vaiTro === 'TruongBoPhan' || vaiTro === 'QuanLy') map.danhSachTruongBoPhan.push(email);
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
            <p>Hệ thống gửi email tự động theo đúng quy trình 5 bước đang <strong>hoạt động hoàn hảo 100%</strong>.</p>
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
    msg += '  • Bạn ("Tôi" - Trình Sếp / Trưởng bộ phận): ' + mapNV.danhSachTruongBoPhan.join(', ') + '\n';
    msg += '  • Kế toán (Duyệt & Chi tiền): ' + mapNV.danhSachKeToan.join(', ') + '\n';
    msg += '  • Sếp (Ban Giám Đốc phê duyệt): ' + mapNV.danhSachGiamDoc.join(', ') + '\n';
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

/**
 * Xuất Mẫu In Phiếu Tạm Ứng chuẩn Mẫu 03-TT
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

  var row = sheet.getRange(activeRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  var maPhieu = row[0] || 'Chưa có';
  var ngayDeNghi = Utilities.formatDate(new Date(row[1] || new Date()), 'GMT+7', 'dd/MM/yyyy');
  var hoTen = row[3] || '';
  var boPhan = row[4] || '';
  var chucVu = row[5] || '';
  var soTien = Number(row[6] || 0);
  var soTienChu = row[7] || docSoThanhChu(soTien);
  var lyDo = row[8] || '';
  var hanQT = row[9] ? Utilities.formatDate(new Date(row[9]), 'GMT+7', 'dd/MM/yyyy') : '';
  var hinhThuc = row[10] || 'Chuyển khoản';
  var soTK = row[11] || '';
  var nganHang = row[12] || '';
  var trangThai = row[15] || '';

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
        .signature-table { width: 100%; margin-top: 35px; text-align: center; }
        .signature-table td { vertical-align: top; width: 25%; padding: 5px; }
        .signature-title { font-weight: bold; font-size: 12pt; }
        .signature-space { height: 65px; }
        @media print {
          .no-print { display: none; }
          body { margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; border: 1px solid #1a365d; font-weight: bold; color: #1a365d;">Trạng thái: ${trangThai}</span>
        <button onclick="window.print()" style="padding: 8px 16px; background: #0066cc; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-left: 10px;">
          🖨️ In Phiếu / Xuất PDF
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
      <div class="info-row">- Bộ phận (Phòng ban): <strong>${boPhan}</strong> &nbsp;&nbsp;&nbsp;&nbsp; - Chức vụ: <strong>${chucVu}</strong></div>
      <div class="info-row">- Số tiền tạm ứng: <strong style="font-size: 14pt; color: #b91c1c;">${formatVND(soTien)}</strong></div>
      <div class="info-row">- Viết bằng chữ: <em>${soTienChu}</em></div>
      <div class="info-row">- Lý do tạm ứng: ${lyDo}</div>
      <div class="info-row">- Thời hạn thanh toán hoàn ứng: <strong>${hanQT}</strong></div>
      <div class="info-row">- Hình thức nhận: <strong>${hinhThuc}</strong> ${soTK ? `(STK: ${soTK} - ${nganHang})` : ''}</div>

      <table class="signature-table">
        <tr>
          <td><div class="signature-title">Giám đốc (Sếp)</div><div style="font-size: 10pt; font-style: italic;">(Ký, họ tên)</div><div class="signature-space"></div><strong>${row[22] ? row[22].split('@')[0] : ''}</strong></td>
          <td><div class="signature-title">Kế toán trưởng</div><div style="font-size: 10pt; font-style: italic;">(Ký, họ tên)</div><div class="signature-space"></div><strong>${row[19] ? row[19].split('@')[0] : ''}</strong></td>
          <td><div class="signature-title">Người trình duyệt</div><div style="font-size: 10pt; font-style: italic;">(Ký, họ tên)</div><div class="signature-space"></div><strong>${row[16] ? row[16].split('@')[0] : ''}</strong></td>
          <td><div class="signature-title">Người đề nghị</div><div style="font-size: 10pt; font-style: italic;">(Ký, họ tên)</div><div class="signature-space"></div><strong>${hoTen}</strong></td>
        </tr>
      </table>
    </body>
    </html>
  `;

  var htmlOutput = HtmlService.createHtmlOutput(htmlContent).setWidth(900).setHeight(700).setTitle('In Phiếu Tạm Ứng - ' + maPhieu);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🖨️ In Phiếu Tạm Ứng: ' + maPhieu);
}
