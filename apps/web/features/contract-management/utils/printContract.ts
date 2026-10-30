import type { ContractResponse } from "../types";

function formatDateVn(dateString?: string | null): string {
  if (!dateString) return "...";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "...";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatVndNumber(amount?: number | null): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "0";
  return new Intl.NumberFormat("vi-VN").format(amount);
}

/**
 * Tạo tài liệu HTML in ấn hợp đồng chuẩn khổ A4 theo thể thức văn bản hành chính Việt Nam (Nghị định 30/2020/NĐ-CP).
 * Tối ưu hóa hoàn hảo cho máy in hoặc xuất "Save as PDF" của trình duyệt.
 */
export function buildProfessionalContractHtml(contract: ContractResponse): string {
  const now = new Date();
  const currentDay = String(now.getDate()).padStart(2, "0");
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = now.getFullYear();

  const companyName = "CÔNG TY TNHH HỆ THỐNG LƯU TRỮ THÔNG MINH SSM";
  const taxCode = "0109998888";
  const companyAddress = "Tòa nhà SSM, Hà Nội, Việt Nam";
  const legalRep = "Lê Văn Thái";
  const legalRepTitle = "Tổng Giám Đốc";

  const facilityName = contract.facility?.name ?? "Cơ sở Lưu trữ SSM";
  const facilityAddress = contract.facility?.address ?? companyAddress;

  const cRaw = contract as unknown as Record<string, unknown>;
  const facilityRaw = contract.facility as unknown as Record<string, unknown> | undefined;
  const customerRaw = contract.customer as unknown as Record<string, unknown> | undefined;
  const customerSnapshot = cRaw.customerSnapshot as Record<string, unknown> | undefined;

  // Đại diện ký Bên cho thuê (Bên A) bắt buộc là Quản lý cơ sở (Facility Manager)
  const managerName =
    ((cRaw.facilityManager as Record<string, unknown> | undefined)?.name as string | undefined) ??
    ((facilityRaw?.manager as Record<string, unknown> | undefined)?.name as string | undefined) ??
    (facilityRaw?.managerName as string | undefined) ??
    "Quản lý cơ sở";
  const managerTitle = "Quản lý cơ sở";

  const unitNumber =
    contract.storageUnit?.unitNumber ??
    (cRaw.unitNumber as string | undefined) ??
    "Theo thông tin phòng kho";

  const customerName =
    contract.customer?.name ?? (customerSnapshot?.name as string | undefined) ?? "Khách Hàng";
  const customerEmail =
    contract.customer?.email ?? (customerSnapshot?.email as string | undefined) ?? "";
  const customerPhone =
    contract.customer?.phoneNumber ?? (customerSnapshot?.phoneNumber as string | undefined) ?? "";
  const customerAddress =
    (customerSnapshot?.address as string | undefined) ??
    (customerRaw?.address as string | undefined) ??
    "Việt Nam";
  const customerIdCard =
    (customerSnapshot?.idCardNumberMasked as string | undefined) ??
    ((customerRaw?.idCardNumber as string | undefined)
      ? `****${String(customerRaw?.idCardNumber).slice(-4)}`
      : "Đã xác minh hồ sơ KYC");
  const customerDob = customerSnapshot?.dateOfBirth
    ? formatDateVn(String(customerSnapshot.dateOfBirth))
    : "Theo hồ sơ khách hàng";

  const startDateStr = formatDateVn(contract.startDate);
  const endDateStr = formatDateVn(contract.endDate);
  const rentalPriceStr = formatVndNumber(contract.rentalPrice);
  const depositAmountStr = formatVndNumber(contract.depositAmount);
  const totalPeriodicStr = formatVndNumber(contract.totalPeriodicPrice ?? contract.rentalPrice);
  const amenitiesTotalStr = formatVndNumber(contract.amenitiesTotalPrice ?? 0);

  const isRackRental = Boolean(contract.rentedRackIds && contract.rentedRackIds.length > 0);
  const rentalTargetDesc = isRackRental
    ? `Thuê kệ kho chuyên dụng (${contract.rentedRackIds?.length ?? 0} tầng kệ) tại vị trí ${unitNumber}`
    : `Phòng kho vật lý số ${unitNumber}`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hợp Đồng Thuê Kho - ${contract.contractCode}</title>
  <style>
    /* Reset & ISO A4 Paper Setup */
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 25mm; /* Trên Phải Dưới Trái (Trái rộng để đóng gáy) */
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: #525659;
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.45;
      color: #000;
    }

    /* Screen Preview Container (Giả lập trang in trên màn hình) */
    .screen-toolbar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      background: #1e293b;
      color: #fff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
    }

    .screen-toolbar .btn-print {
      background: #059669;
      color: #fff;
      border: none;
      padding: 9px 20px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .screen-toolbar .btn-print:hover {
      background: #047857;
    }

    .screen-toolbar .btn-close {
      background: #475569;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    .screen-toolbar .btn-close:hover {
      background: #334155;
    }

    .page-wrapper {
      width: 210mm;
      min-height: 297mm;
      margin: 25px auto;
      padding: 20mm 15mm 20mm 25mm;
      background: #fff;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      position: relative;
    }

    @media print {
      body {
        background-color: transparent;
      }
      .screen-toolbar {
        display: none !important;
      }
      .page-wrapper {
        width: 100%;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }

    /* Quốc hiệu & Tiêu ngữ */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-bottom: 18px;
    }
    .header-table td {
      border: none;
      padding: 0;
      vertical-align: top;
      text-align: center;
    }

    .national-title {
      font-size: 12.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    .national-subtitle {
      font-size: 13pt;
      font-weight: bold;
      margin-top: 3px;
    }
    .national-rule {
      width: 140px;
      height: 1px;
      background-color: #000;
      margin: 4px auto 0 auto;
    }

    /* Tiêu đề Hợp đồng */
    .contract-title-block {
      text-align: center;
      margin-top: 15px;
      margin-bottom: 20px;
    }
    .contract-main-title {
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 4px 0;
    }
    .contract-code-tag {
      font-size: 12pt;
      font-style: italic;
      color: #111;
      margin: 0 0 6px 0;
    }
    .contract-preamble {
      font-size: 12pt;
      font-style: italic;
      margin-top: 6px;
    }

    /* Tiêu đề Mục & Điều khoản */
    .section-heading {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 14px;
      margin-bottom: 4px;
      color: #000;
    }
    .clause-heading {
      font-size: 13pt;
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 3px;
      color: #000;
    }

    /* Thẻ thông tin 2 bên A - B */
    .party-card {
      margin-bottom: 12px;
    }
    .party-grid {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin: 2px 0 6px 0;
    }
    .party-grid td {
      border: none;
      padding: 2.5px 4px;
      font-size: 12.5pt;
      vertical-align: top;
    }
    .col-label {
      width: 155px;
      color: #333;
    }
    .col-colon {
      width: 15px;
      text-align: center;
    }
    .col-val {
      font-weight: normal;
    }
    .col-val strong {
      color: #000;
    }

    /* Bảng Tổng hợp Thông số thuê (Specifications Table) */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 14px 0;
    }
    .data-table th, .data-table td {
      border: 1px solid #222;
      padding: 6px 8px;
      text-align: left;
      font-size: 12pt;
    }
    .data-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: center;
    }
    .text-center {
      text-align: center !important;
    }
    .text-right {
      text-align: right !important;
    }

    /* Đoạn văn bản & Thụt lề chuẩn */
    p.clause-p {
      text-align: justify;
      text-justify: inter-word;
      margin: 4px 0;
      text-indent: 1cm;
    }
    p.clause-p-no-indent {
      text-align: justify;
      text-justify: inter-word;
      margin: 4px 0;
    }

    /* Khối Chữ ký (Table chống vỡ trang) */
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
      margin-top: 25px;
      page-break-inside: avoid;
    }
    .signatures-table td {
      border: none;
      width: 50%;
      vertical-align: top;
      text-align: center;
      padding: 0 10px;
    }
    .sig-role {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0;
    }
    .sig-guide {
      font-size: 11pt;
      font-style: italic;
      color: #444;
      margin: 3px 0 0 0;
    }
    .sig-space {
      height: 85px;
    }
    .sig-name {
      font-size: 13pt;
      font-weight: bold;
      margin: 0;
    }
    .sig-org {
      font-size: 11pt;
      color: #333;
      margin: 2px 0 0 0;
    }

  </style>
</head>
<body>
  <!-- Thanh công cụ điều khiển in (Chỉ hiển thị trên màn hình, tự ẩn khi in) -->
  <div class="screen-toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-weight: bold;">Hợp đồng thuê kho: ${contract.contractCode}</span>
      <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-size: 12px;">Khổ A4 • Chuẩn in ấn</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn-print" onclick="window.print()">
        🖨️ In hợp đồng / Lưu PDF (Ctrl + P)
      </button>
      <button class="btn-close" onclick="window.close()">Đóng</button>
    </div>
  </div>

  <div class="page-wrapper">
    <!-- Quốc hiệu & Tiêu ngữ chuẩn Việt Nam -->
    <table class="header-table">
      <tr>
        <td>
          <div class="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div class="national-subtitle">Độc lập - Tự do - Hạnh phúc</div>
          <div class="national-rule"></div>
        </td>
      </tr>
    </table>

    <!-- Tiêu đề Hợp đồng -->
    <div class="contract-title-block">
      <div class="contract-main-title">HỢP ĐỒNG THUÊ KHO LƯU TRỮ TÀI SẢN</div>
      <div class="contract-code-tag">Mã số hợp đồng: <strong>${contract.contractCode}</strong>/HĐTK-SSM</div>
      <div class="contract-preamble">
        Hôm nay, ngày ${currentDay} tháng ${currentMonth} năm ${currentYear}, tại văn phòng chi nhánh ${facilityName}, chúng tôi gồm có:
      </div>
    </div>

    <!-- BÊN CHO THUÊ (BÊN A) -->
    <div class="party-card">
      <div class="section-heading">BÊN CHO THUÊ (BÊN A):</div>
      <table class="party-grid">
        <tr>
          <td class="col-label">Tên tổ chức</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${companyName}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Mã số thuế</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${taxCode}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Địa chỉ trụ sở</td>
          <td class="col-colon">:</td>
          <td class="col-val">${companyAddress}</td>
        </tr>
        <tr>
          <td class="col-label">Đại diện pháp luật</td>
          <td class="col-colon">:</td>
          <td class="col-val">Ông/Bà <strong>${legalRep}</strong> — Chức vụ: ${legalRepTitle}</td>
        </tr>
        <tr>
          <td class="col-label">Cơ sở cho thuê</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${facilityName}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Địa chỉ cơ sở kho</td>
          <td class="col-colon">:</td>
          <td class="col-val">${facilityAddress}</td>
        </tr>
        <tr>
          <td class="col-label">Đại diện ký kết</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${managerName}</strong> — Chức vụ: ${managerTitle}</td>
        </tr>
      </table>
    </div>

    <!-- BÊN THUÊ KHO (BÊN B) -->
    <div class="party-card">
      <div class="section-heading">BÊN THUÊ KHO (BÊN B):</div>
      <table class="party-grid">
        <tr>
          <td class="col-label">Họ và tên khách hàng</td>
          <td class="col-colon">:</td>
          <td class="col-val">Ông/Bà <strong>${customerName}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Ngày sinh</td>
          <td class="col-colon">:</td>
          <td class="col-val">${customerDob}</td>
        </tr>
        <tr>
          <td class="col-label">Số CCCD / Hộ chiếu</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${customerIdCard}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Số điện thoại liên hệ</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${customerPhone}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Hòm thư điện tử (Email)</td>
          <td class="col-colon">:</td>
          <td class="col-val">${customerEmail}</td>
        </tr>
        <tr>
          <td class="col-label">Địa chỉ thường trú</td>
          <td class="col-colon">:</td>
          <td class="col-val">${customerAddress}</td>
        </tr>
      </table>
    </div>

    <p class="clause-p-no-indent" style="margin-top: 10px;">
      Hai bên cùng thống nhất ký kết Hợp đồng thuê kho lưu trữ tài sản cá nhân/doanh nghiệp với các điều khoản chi tiết như sau:
    </p>

    <!-- NỘI DUNG ĐIỀU KHOẢN -->
    <div class="clause-heading">Điều 1: Đối tượng, Vị trí và Thời hạn thuê</div>
    <p class="clause-p">
      1.1. Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê không gian lưu trữ: <strong>${rentalTargetDesc}</strong> bố trí tại cơ sở ${facilityName}.
    </p>
    <p class="clause-p">
      1.2. Thời hạn thuê kho được xác định từ ngày <strong>${startDateStr}</strong> đến hết ngày <strong>${endDateStr}</strong>. Hai bên có thể lập phụ lục gia hạn trước ngày đáo hạn ít nhất 07 ngày.
    </p>

    <div class="clause-heading">Điều 2: Giá thuê, Tiền đặt cọc và Chi phí dịch vụ</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 25%;">Hạng mục thuê</th>
          <th style="width: 25%;">Thời hạn thuê</th>
          <th style="width: 16%;">Đơn giá thuê</th>
          <th style="width: 17%;">Tiền cọc bảo đảm</th>
          <th style="width: 17%;">Tổng phí định kỳ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${isRackRental ? "Kệ kho lưu trữ" : "Phòng kho"} ${unitNumber}</strong><br>
            <small style="color: #444;">${facilityName}</small>
          </td>
          <td class="text-center">
            Từ <strong>${startDateStr}</strong><br>
            đến <strong>${endDateStr}</strong>
          </td>
          <td class="text-right">
            <strong>${rentalPriceStr} đ</strong><br>
            <small>/ tháng</small>
          </td>
          <td class="text-right">
            <strong style="color: #047857;">${depositAmountStr} đ</strong>
          </td>
          <td class="text-right">
            <strong style="font-size: 13pt;">${totalPeriodicStr} đ</strong>
          </td>
        </tr>
        ${
          contract.amenities && contract.amenities.length > 0
            ? `<tr>
                <td colspan="4"><em>Tổng chi phí tiện ích cho thuê kèm (${contract.amenities.length} tiện ích)</em></td>
                <td class="text-right"><strong>${amenitiesTotalStr} đ</strong></td>
              </tr>`
            : ""
        }
      </tbody>
    </table>

    <p class="clause-p">
      2.1. <strong>Tiền cọc bảo đảm:</strong> Bên B thanh toán khoản đặt cọc <strong>${depositAmountStr} VND</strong> ngay khi đặt chỗ hoặc ký hợp đồng. Khoản cọc này được hoàn trả đầy đủ khi thanh lý hợp đồng nếu không xảy ra hư hỏng tài sản hoặc nợ đọng tiền thuê.
    </p>
    <p class="clause-p">
      2.2. <strong>Phương thức thanh toán:</strong> Thanh toán chuyển khoản tự động qua cổng VietQR/SePay hoặc nộp trực tiếp tại quầy cơ sở có phát hành biên lai thu tiền.
    </p>

    <div class="clause-heading">Điều 3: Cam kết An toàn và Quy định Ký kết Số hóa</div>
    <p class="clause-p">
      3.1. Bên B cam kết tuyệt đối không lưu giữ hàng cấm, vũ khí, chất cháy nổ, hóa chất độc hại, hàng tươi sống hoặc tài sản trái quy định pháp luật.
    </p>
    <p class="clause-p">
      3.2. <strong>Quy trình ký kết sống số hóa:</strong> Hợp đồng này được hai bên ký sống trực tiếp trên bản in giấy A4 tại quầy chi nhánh. Sau đó, bản scan có đầy đủ chữ ký 2 bên được Quản lý cơ sở chụp/scan đưa vào hệ thống số hóa, băm mật mã <strong>SHA-256</strong> để bảo toàn giá trị pháp lý cao nhất và làm căn cứ kích hoạt mở kho.
    </p>
    <p class="clause-p">
      3.3. Hợp đồng được lập thành 02 (hai) bản in có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để thực hiện.
    </p>

    <!-- Khối chữ ký 2 bên -->
    <table class="signatures-table">
      <tr>
        <td>
          <p class="sig-role">ĐẠI DIỆN BÊN B (BÊN THUÊ)</p>
          <p class="sig-guide"><em>(Ký, ghi rõ họ tên)</em></p>
          <div class="sig-space"></div>
          <p class="sig-name">${customerName}</p>
          <p class="sig-org">Khách hàng thuê kho</p>
        </td>
        <td>
          <p class="sig-role">ĐẠI DIỆN BÊN A (BÊN CHO THUÊ)</p>
          <p class="sig-guide"><em>(Ký tên, đóng dấu chi nhánh)</em></p>
          <div class="sig-space"></div>
          <p class="sig-name">${managerName}</p>
          <p class="sig-org">${managerTitle} — ${facilityName}</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
