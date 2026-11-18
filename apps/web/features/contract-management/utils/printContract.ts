import { toast } from "sonner";
import type {
  ContractAddendumResponse,
  ContractAmenityItemResponse,
  ContractResponse,
} from "../types";
import {
  calculateContractFinancialSummary,
  type ContractFinancialSummary,
  getAmenityBillingModeLabel,
  getAmenityItemSubtotal,
  getBillingUnitLabel,
  getContractAddendumStatusLabelVi,
  getContractStatusLabelVi,
  isContractDepositSatisfied,
  isContractFirstPeriodPaid,
  isOneTimeAmenity,
  resolveContractErrorMessage,
} from "../utils";

export interface OpenPrintableHtmlResult {
  opened: boolean;
  downloadedFallback: boolean;
}

interface PrintPartyContext {
  currentDay: string;
  currentMonth: string;
  currentYear: number;
  contractCode: string;
  contractCreatedAtStr: string;
  contractStatusLabelVi: string;
  depositStatusLabelVi: string;
  firstPeriodStatusLabelVi: string;
  companyName: string;
  taxCode: string;
  companyAddress: string;
  legalRep: string;
  legalRepTitle: string;
  facilityName: string;
  facilityAddress: string;
  managerName: string;
  managerTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerIdCard: string;
  customerDob: string;
  unitNumber: string;
  isRackRental: boolean;
  rentalTargetDesc: string;
  rentalTargetShort: string;
  billingUnitVi: string;
  startDateStr: string;
  endDateStr: string;
  rentalPriceStr: string;
  depositAmountStr: string;
  recurringAmenitiesTotalStr: string;
  oneTimeAmenitiesTotalStr: string;
  totalPeriodicStr: string;
  firstPeriodTotalStr: string;
  financial: ContractFinancialSummary;
}

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

function escapeHtml(value?: string | null): string {
  if (!value) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function computeExtensionDays(
  previousEndDate?: string | null,
  newEndDate?: string | null
): number | null {
  if (!previousEndDate || !newEndDate) return null;
  const prevMs = new Date(previousEndDate).getTime();
  const nextMs = new Date(newEndDate).getTime();
  if (Number.isNaN(prevMs) || Number.isNaN(nextMs) || nextMs <= prevMs) return null;
  return Math.ceil((nextMs - prevMs) / (1000 * 60 * 60 * 24));
}

function extractPrintContractContext(contract: ContractResponse): PrintPartyContext {
  const now = new Date();
  const currentDay = String(now.getDate()).padStart(2, "0");
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = now.getFullYear();

  const cRaw = contract as unknown as Record<string, unknown>;
  const facilityRaw = contract.facility as unknown as Record<string, unknown> | undefined;
  const customerRaw = contract.customer as unknown as Record<string, unknown> | undefined;
  const customerSnapshot = cRaw.customerSnapshot as Record<string, unknown> | undefined;
  const legalEntityRaw =
    (cRaw.legalEntity as Record<string, unknown> | undefined) ??
    (facilityRaw?.legalEntity as Record<string, unknown> | undefined);
  const legalRepObj = legalEntityRaw?.legalRepresentative as Record<string, unknown> | undefined;

  const companyNameRaw =
    (legalEntityRaw?.companyName as string | undefined) ??
    "CÔNG TY TNHH HỆ THỐNG LƯU TRỮ THÔNG MINH SSM";
  const taxCodeRaw = (legalEntityRaw?.taxCode as string | undefined) ?? "0109998888";
  const companyAddressRaw =
    (legalEntityRaw?.registeredAddress as string | undefined) ?? "Tòa nhà SSM, Hà Nội, Việt Nam";
  const legalRepRaw = (legalRepObj?.name as string | undefined) ?? "Lê Văn Thái";
  const legalRepTitleRaw = (legalRepObj?.title as string | undefined) ?? "Tổng Giám Đốc";

  const facilityNameRaw = contract.facility?.name ?? "Cơ sở Lưu trữ SSM";
  const facilityAddressRaw = contract.facility?.address ?? companyAddressRaw;

  // Đại diện ký Bên cho thuê (Bên A) bắt buộc là Quản lý cơ sở (Facility Manager)
  const managerNameRaw =
    ((cRaw.facilityManager as Record<string, unknown> | undefined)?.name as string | undefined) ??
    ((facilityRaw?.manager as Record<string, unknown> | undefined)?.name as string | undefined) ??
    (facilityRaw?.managerName as string | undefined) ??
    "Quản lý cơ sở";
  const managerTitleRaw = "Quản lý cơ sở";

  const unitNumberRaw =
    contract.storageUnit?.unitNumber ??
    (cRaw.unitNumber as string | undefined) ??
    "Theo thông tin phòng kho";

  const customerNameRaw =
    contract.customer?.name ?? (customerSnapshot?.name as string | undefined) ?? "Khách Hàng";
  const customerEmailRaw =
    contract.customer?.email ?? (customerSnapshot?.email as string | undefined) ?? "";
  const customerPhoneRaw =
    contract.customer?.phoneNumber ?? (customerSnapshot?.phoneNumber as string | undefined) ?? "";
  const customerAddressRaw =
    (customerSnapshot?.address as string | undefined) ??
    (customerRaw?.address as string | undefined) ??
    "Việt Nam";
  const customerIdCardRaw =
    (customerSnapshot?.idCardNumberMasked as string | undefined) ??
    ((customerRaw?.idCardNumber as string | undefined)
      ? `****${String(customerRaw?.idCardNumber).slice(-4)}`
      : "Đã xác minh hồ sơ KYC");
  const customerDobRaw = customerSnapshot?.dateOfBirth
    ? formatDateVn(String(customerSnapshot.dateOfBirth))
    : "Theo hồ sơ khách hàng";

  const isRackRental = Boolean(contract.rentedRackIds && contract.rentedRackIds.length > 0);
  const unitNumber = escapeHtml(unitNumberRaw);
  const rentalTargetDesc = isRackRental
    ? `Thuê kệ kho chuyên dụng (${contract.rentedRackIds?.length ?? 0} tầng kệ) tại vị trí ${unitNumber}`
    : `Phòng kho vật lý số ${unitNumber}`;

  const financial = calculateContractFinancialSummary(contract);

  return {
    currentDay,
    currentMonth,
    currentYear,
    contractCode: escapeHtml(contract.contractCode || contract.id),
    contractCreatedAtStr: formatDateVn(contract.createdAt),
    contractStatusLabelVi: escapeHtml(getContractStatusLabelVi(contract.status)),
    depositStatusLabelVi: isContractDepositSatisfied(contract) ? "Đã đặt cọc" : "Chưa đặt cọc",
    firstPeriodStatusLabelVi: isContractFirstPeriodPaid(contract)
      ? "Đã thanh toán"
      : "Chưa thanh toán",
    companyName: escapeHtml(companyNameRaw),
    taxCode: escapeHtml(taxCodeRaw),
    companyAddress: escapeHtml(companyAddressRaw),
    legalRep: escapeHtml(legalRepRaw),
    legalRepTitle: escapeHtml(legalRepTitleRaw),
    facilityName: escapeHtml(facilityNameRaw),
    facilityAddress: escapeHtml(facilityAddressRaw),
    managerName: escapeHtml(managerNameRaw),
    managerTitle: escapeHtml(managerTitleRaw),
    customerName: escapeHtml(customerNameRaw),
    customerEmail: escapeHtml(customerEmailRaw),
    customerPhone: escapeHtml(customerPhoneRaw),
    customerAddress: escapeHtml(customerAddressRaw),
    customerIdCard: escapeHtml(customerIdCardRaw),
    customerDob: escapeHtml(customerDobRaw),
    unitNumber,
    isRackRental,
    rentalTargetDesc,
    rentalTargetShort: isRackRental ? "Kệ kho lưu trữ" : "Phòng kho",
    billingUnitVi: escapeHtml(getBillingUnitLabel(contract.billingUnit, "vi")),
    startDateStr: formatDateVn(contract.startDate),
    endDateStr: formatDateVn(contract.endDate),
    rentalPriceStr: formatVndNumber(contract.rentalPrice),
    depositAmountStr: formatVndNumber(contract.depositAmount),
    recurringAmenitiesTotalStr: formatVndNumber(financial.recurringAmenitiesTotal),
    oneTimeAmenitiesTotalStr: formatVndNumber(financial.oneTimeAmenitiesTotal),
    totalPeriodicStr: formatVndNumber(financial.displayPeriodicPrice),
    firstPeriodTotalStr: formatVndNumber(financial.firstPeriodTotalAmount),
    financial,
  };
}

const SHARED_PRINT_STYLES = `
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

    /* Tiêu đề Hợp đồng / Phụ lục */
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
    .contract-subtitle {
      font-size: 13pt;
      font-weight: bold;
      margin: 0 0 6px 0;
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
    .legal-basis-list {
      text-align: justify;
      font-size: 12pt;
      font-style: italic;
      margin: 8px 0 10px 0;
    }
    .legal-basis-list p {
      margin: 2px 0;
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
`;

function renderNationalHeaderHtml(): string {
  return `<!-- Quốc hiệu & Tiêu ngữ chuẩn Việt Nam -->
    <table class="header-table">
      <tr>
        <td>
          <div class="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div class="national-subtitle">Độc lập - Tự do - Hạnh phúc</div>
          <div class="national-rule"></div>
        </td>
      </tr>
    </table>`;
}

function renderPartiesHtml(ctx: PrintPartyContext): string {
  return `<!-- BÊN CHO THUÊ (BÊN A) -->
    <div class="party-card">
      <div class="section-heading">BÊN CHO THUÊ (BÊN A):</div>
      <table class="party-grid">
        <tr>
          <td class="col-label">Tên tổ chức</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${ctx.companyName}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Mã số thuế</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${ctx.taxCode}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Địa chỉ trụ sở</td>
          <td class="col-colon">:</td>
          <td class="col-val">${ctx.companyAddress}</td>
        </tr>
        <tr>
          <td class="col-label">Đại diện pháp luật</td>
          <td class="col-colon">:</td>
          <td class="col-val">Ông/Bà <strong>${ctx.legalRep}</strong> — Chức vụ: ${ctx.legalRepTitle}</td>
        </tr>
        <tr>
          <td class="col-label">Cơ sở cho thuê</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${ctx.facilityName}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Địa chỉ cơ sở kho</td>
          <td class="col-colon">:</td>
          <td class="col-val">${ctx.facilityAddress}</td>
        </tr>
        <tr>
          <td class="col-label">Đại diện ký kết</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${ctx.managerName}</strong> — Chức vụ: ${ctx.managerTitle}</td>
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
          <td class="col-val">Ông/Bà <strong>${ctx.customerName}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Ngày sinh</td>
          <td class="col-colon">:</td>
          <td class="col-val">${ctx.customerDob}</td>
        </tr>
        <tr>
          <td class="col-label">Số CCCD / Hộ chiếu</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${ctx.customerIdCard}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Số điện thoại liên hệ</td>
          <td class="col-colon">:</td>
          <td class="col-val"><strong>${ctx.customerPhone}</strong></td>
        </tr>
        <tr>
          <td class="col-label">Hòm thư điện tử (Email)</td>
          <td class="col-colon">:</td>
          <td class="col-val">${ctx.customerEmail}</td>
        </tr>
        <tr>
          <td class="col-label">Địa chỉ thường trú</td>
          <td class="col-colon">:</td>
          <td class="col-val">${ctx.customerAddress}</td>
        </tr>
      </table>
    </div>`;
}

function renderSignaturesHtml(ctx: PrintPartyContext): string {
  return `<!-- Khối chữ ký 2 bên -->
    <table class="signatures-table">
      <tr>
        <td>
          <p class="sig-role">ĐẠI DIỆN BÊN B (BÊN THUÊ)</p>
          <p class="sig-guide"><em>(Ký, ghi rõ họ tên)</em></p>
          <div class="sig-space"></div>
          <p class="sig-name">${ctx.customerName}</p>
          <p class="sig-org">Khách hàng thuê kho</p>
        </td>
        <td>
          <p class="sig-role">ĐẠI DIỆN BÊN A (BÊN CHO THUÊ)</p>
          <p class="sig-guide"><em>(Ký tên, đóng dấu chi nhánh)</em></p>
          <div class="sig-space"></div>
          <p class="sig-name">${ctx.managerName}</p>
          <p class="sig-org">${ctx.managerTitle} — ${ctx.facilityName}</p>
        </td>
      </tr>
    </table>`;
}

function formatPeriodicSummaryNote(ctx: PrintPartyContext): string {
  return ctx.financial.recurringAmenitiesTotal > 0
    ? `Kho ${ctx.rentalPriceStr} đ + Tiện ích định kỳ ${ctx.recurringAmenitiesTotalStr} đ`
    : "Giá thuê kho";
}

function renderAmenitiesBreakdownTableHtml(
  items: ContractAmenityItemResponse[],
  heading: string
): string {
  if (items.length === 0) return "";

  const rowsHtml = items
    .map((am, index) => {
      const name = escapeHtml(am.name || am.facilityAmenityOfferingId);
      const billingModeLabel = escapeHtml(getAmenityBillingModeLabel(am.billingUnit, "vi"));
      const unitLabel = escapeHtml(getBillingUnitLabel(am.billingUnit, "vi"));
      const unitPriceStr = formatVndNumber(am.pricePerUnit);
      const subtotalStr = formatVndNumber(getAmenityItemSubtotal(am));
      const suffix = isOneTimeAmenity(am) ? "" : ` <small>/ ${unitLabel}</small>`;

      return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td><strong>${name}</strong></td>
          <td class="text-center">${am.quantity}</td>
          <td class="text-center">${billingModeLabel}</td>
          <td class="text-right">${unitPriceStr} đ <small>/ ${unitLabel}</small></td>
          <td class="text-right"><strong>${subtotalStr} đ</strong>${suffix}</td>
        </tr>`;
    })
    .join("");

  return `
    <div style="font-size: 12pt; font-weight: bold; margin: 10px 0 4px 0;">
      ${escapeHtml(heading)}
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 7%;">STT</th>
          <th style="width: 31%;">Tên tiện ích</th>
          <th style="width: 8%;">SL</th>
          <th style="width: 22%;">Hình thức tính phí</th>
          <th style="width: 16%;">Đơn giá</th>
          <th style="width: 16%;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>`;
}

function renderPrintableHtmlDocument({
  title,
  toolbarLabel,
  statusLabelVi,
  printButtonLabel,
  pageBodyHtml,
}: {
  title: string;
  toolbarLabel: string;
  statusLabelVi: string;
  printButtonLabel: string;
  pageBodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
${SHARED_PRINT_STYLES}
  </style>
</head>
<body>
  <!-- Thanh công cụ điều khiển in (Chỉ hiển thị trên màn hình, tự ẩn khi in) -->
  <div class="screen-toolbar">
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <span style="font-weight: bold;">${toolbarLabel}</span>
      <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-size: 12px;">Trạng thái: ${statusLabelVi}</span>
      <span style="background: rgba(255,255,255,0.16); padding: 2px 8px; border-radius: 4px; font-size: 12px;">Khổ A4 • Chuẩn in ấn</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn-print" onclick="window.print()">
        ${printButtonLabel}
      </button>
      <button class="btn-close" onclick="window.close()">Đóng</button>
    </div>
  </div>

  <div class="page-wrapper">
    ${renderNationalHeaderHtml()}
    ${pageBodyHtml}
  </div>
</body>
</html>`;
}

/**
 * Mở cửa sổ xem trước & in tài liệu HTML khổ A4; nếu trình duyệt chặn popup thì tự động tải file HTML.
 */
export function openPrintableHtmlDocument(
  htmlContent: string,
  fallbackFilename: string,
  fallbackNotice?: string
): OpenPrintableHtmlResult {
  if (typeof window === "undefined") {
    return { opened: false, downloadedFallback: false };
  }

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
    }, 300);
    return { opened: true, downloadedFallback: false };
  }

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fallbackFilename;
  link.click();
  URL.revokeObjectURL(blobUrl);
  if (fallbackNotice) {
    toast.success(fallbackNotice);
  }
  return { opened: false, downloadedFallback: true };
}

/**
 * Tạo HTML và mở cửa sổ in phụ lục gia hạn hợp đồng (tự động tải file HTML nếu popup bị chặn).
 */
export function openRenewalAddendumPrintDocument(
  contract: ContractResponse,
  addendum: ContractAddendumResponse,
  locale: "vi" | "en" = "vi",
  onError?: (message: string) => void
): OpenPrintableHtmlResult {
  try {
    const htmlContent = buildRenewalAddendumHtml(contract, addendum);
    const fallbackNotice =
      locale === "en"
        ? "Renewal addendum HTML downloaded. Open and press Ctrl+P to print."
        : "Đã tải bản in phụ lục gia hạn. Vui lòng mở file và bấm Ctrl+P để in.";
    return openPrintableHtmlDocument(
      htmlContent,
      `Phu-luc-gia-han-${addendum.addendumCode || addendum.id}.html`,
      fallbackNotice
    );
  } catch (err: unknown) {
    const message = resolveContractErrorMessage(err, locale);
    if (onError) {
      onError(message);
    } else {
      toast.error(message);
    }
    return { opened: false, downloadedFallback: false };
  }
}

/**
 * Tạo HTML mẫu in Hợp đồng thuê kho lưu trữ chuẩn A4 (Nghị định 30/2020/NĐ-CP).
 */
export function buildProfessionalContractHtml(contract: ContractResponse): string {
  const ctx = extractPrintContractContext(contract);
  const { recurringAmenities, oneTimeAmenities, recurringAmenitiesTotal, oneTimeAmenitiesTotal } =
    ctx.financial;
  const hasAnyAmenities = recurringAmenities.length > 0 || oneTimeAmenities.length > 0;
  const orderedAmenities = [...recurringAmenities, ...oneTimeAmenities];

  const pageBodyHtml = `
    <!-- Tiêu đề Hợp đồng -->
    <div class="contract-title-block">
      <div class="contract-main-title">HỢP ĐỒNG THUÊ KHO LƯU TRỮ TÀI SẢN</div>
      <div class="contract-code-tag">
        Mã số hợp đồng: <strong>${ctx.contractCode}</strong>/HĐTK-SSM • Trạng thái: <strong>${ctx.contractStatusLabelVi}</strong>
      </div>
      <div class="contract-preamble">
        Hôm nay, ngày ${ctx.currentDay} tháng ${ctx.currentMonth} năm ${ctx.currentYear}, tại văn phòng chi nhánh ${ctx.facilityName}, chúng tôi gồm có:
      </div>
    </div>

    ${renderPartiesHtml(ctx)}

    <p class="clause-p-no-indent" style="margin-top: 10px;">
      Hai bên cùng thống nhất ký kết Hợp đồng thuê kho lưu trữ tài sản cá nhân/doanh nghiệp với các điều khoản chi tiết như sau:
    </p>

    <!-- NỘI DUNG ĐIỀU KHOẢN -->
    <div class="clause-heading">Điều 1: Đối tượng, Vị trí và Thời hạn thuê</div>
    <p class="clause-p">
      1.1. Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê không gian lưu trữ: <strong>${ctx.rentalTargetDesc}</strong> bố trí tại cơ sở ${ctx.facilityName}.
    </p>
    <p class="clause-p">
      1.2. Thời hạn thuê kho được xác định từ ngày <strong>${ctx.startDateStr}</strong> đến hết ngày <strong>${ctx.endDateStr}</strong>. Hai bên có thể lập phụ lục gia hạn trước ngày đáo hạn ít nhất 07 ngày.
    </p>

    <div class="clause-heading">Điều 2: Giá thuê, Tiền đặt cọc và Chi phí dịch vụ</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 34%;">Hạng mục</th>
          <th style="width: 24%;">Thời hạn / Hình thức</th>
          <th style="width: 20%;">Tiền cọc bảo đảm</th>
          <th style="width: 22%;">Chi phí</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${ctx.rentalTargetShort} ${ctx.unitNumber}</strong><br>
            <small style="color: #444;">${ctx.facilityName} • Giá thuê kho cơ bản</small>
          </td>
          <td class="text-center">
            Từ <strong>${ctx.startDateStr}</strong><br>
            đến <strong>${ctx.endDateStr}</strong>
          </td>
          <td class="text-right">
            <strong style="color: #047857;">${ctx.depositAmountStr} đ</strong><br>
            <small>(${ctx.depositStatusLabelVi})</small>
          </td>
          <td class="text-right">
            <strong>${ctx.rentalPriceStr} đ</strong><br>
            <small>/ ${ctx.billingUnitVi}</small>
          </td>
        </tr>
        ${
          recurringAmenities.length > 0
            ? `<tr>
                <td>
                  Tiện ích thuê định kỳ (${recurringAmenities.length} hạng mục)<br>
                  <small style="color: #444;">Thu lặp lại mỗi ${ctx.billingUnitVi} cùng tiền thuê kho</small>
                </td>
                <td class="text-center"><small>Định kỳ theo ${ctx.billingUnitVi}</small></td>
                <td class="text-center"><small>—</small></td>
                <td class="text-right">
                  <strong>+${ctx.recurringAmenitiesTotalStr} đ</strong><br>
                  <small>/ ${ctx.billingUnitVi}</small>
                </td>
              </tr>`
            : ""
        }
        <tr style="background-color: #f8fafc;">
          <td colspan="3">
            <strong>Tổng chi phí định kỳ hàng ${ctx.billingUnitVi}</strong>
            <small style="color: #444;">(${formatPeriodicSummaryNote(ctx)})</small>
          </td>
          <td class="text-right">
            <strong style="font-size: 13pt;">${ctx.totalPeriodicStr} đ</strong><br>
            <small>/ ${ctx.billingUnitVi}</small>
          </td>
        </tr>
        ${
          oneTimeAmenities.length > 0
            ? `<tr>
                <td>
                  Tiện ích trả 1 lần (${oneTimeAmenities.length} hạng mục)<br>
                  <small style="color: #444;">Chỉ thu 1 lần ở kỳ thuê đầu, không tính kỳ sau</small>
                </td>
                <td class="text-center"><small>Trả 1 lần (kỳ đầu)</small></td>
                <td class="text-center"><small>—</small></td>
                <td class="text-right">
                  <strong>+${ctx.oneTimeAmenitiesTotalStr} đ</strong>
                </td>
              </tr>`
            : ""
        }
        ${
          hasAnyAmenities
            ? `<tr style="background-color: #ecfdf5;">
                <td colspan="3">
                  <strong>Tổng tiền thuê kỳ đầu tiên</strong>
                  <small style="color: #444;">(${
                    oneTimeAmenitiesTotal > 0
                      ? `${ctx.totalPeriodicStr} đ định kỳ + ${ctx.oneTimeAmenitiesTotalStr} đ trả 1 lần • `
                      : ""
                  }chưa gồm tiền đặt cọc • ${ctx.firstPeriodStatusLabelVi})</small>
                </td>
                <td class="text-right">
                  <strong style="font-size: 13pt; color: #047857;">${ctx.firstPeriodTotalStr} đ</strong>
                </td>
              </tr>`
            : ""
        }
      </tbody>
    </table>

    ${renderAmenitiesBreakdownTableHtml(orderedAmenities, "Chi tiết các tiện ích đi kèm theo hợp đồng:")}

    <p class="clause-p">
      2.1. <strong>Giá thuê &amp; Chi phí tiện ích:</strong> Giá thuê không gian lưu trữ cơ bản là <strong>${ctx.rentalPriceStr} VND/${ctx.billingUnitVi}</strong>${
        recurringAmenitiesTotal > 0
          ? `, cộng phí tiện ích thuê định kỳ là <strong>${ctx.recurringAmenitiesTotalStr} VND/${ctx.billingUnitVi}</strong>`
          : ""
      }; tổng chi phí định kỳ mỗi chu kỳ thanh toán là <strong>${ctx.totalPeriodicStr} VND/${ctx.billingUnitVi}</strong>.${
        oneTimeAmenitiesTotal > 0
          ? ` Riêng các tiện ích trả 1 lần có tổng giá trị <strong>${ctx.oneTimeAmenitiesTotalStr} VND</strong> được thanh toán một lần duy nhất trong kỳ thuê đầu tiên (tổng tiền thuê kỳ đầu: <strong>${ctx.firstPeriodTotalStr} VND</strong>), không thu lặp lại ở các chu kỳ tiếp theo.`
          : ""
      }
    </p>
    <p class="clause-p">
      2.2. <strong>Tiền cọc bảo đảm:</strong> Bên B thanh toán khoản đặt cọc <strong>${ctx.depositAmountStr} VND</strong> ngay khi đặt chỗ hoặc ký hợp đồng (${ctx.depositStatusLabelVi}). Khoản cọc này được hoàn trả đầy đủ khi thanh lý hợp đồng nếu không xảy ra hư hỏng tài sản hoặc nợ đọng tiền thuê.
    </p>
    <p class="clause-p">
      2.3. <strong>Phương thức thanh toán:</strong> Thanh toán chuyển khoản tự động qua cổng VietQR/SePay hoặc nộp trực tiếp tại quầy cơ sở có phát hành biên lai thu tiền.
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

    ${renderSignaturesHtml(ctx)}
  `;

  return renderPrintableHtmlDocument({
    title: `Hợp Đồng Thuê Kho - ${ctx.contractCode}`,
    toolbarLabel: `Hợp đồng thuê kho: ${ctx.contractCode}`,
    statusLabelVi: ctx.contractStatusLabelVi,
    printButtonLabel: "🖨️ In hợp đồng / Lưu PDF (Ctrl + P)",
    pageBodyHtml,
  });
}

/**
 * Tạo HTML mẫu in Phụ lục gia hạn thời hạn thuê kho chuẩn A4 (Nghị định 30/2020/NĐ-CP).
 */
export function buildRenewalAddendumHtml(
  contract: ContractResponse,
  addendum: ContractAddendumResponse
): string {
  const ctx = extractPrintContractContext(contract);
  const { recurringAmenities, oneTimeAmenities, recurringAmenitiesTotal } = ctx.financial;
  const addendumCode = escapeHtml(addendum.addendumCode || addendum.id);
  const addendumStatusLabelVi = escapeHtml(getContractAddendumStatusLabelVi(addendum.status));
  const requestedAtStr = formatDateVn(addendum.requestedAt);
  const previousEndIso = addendum.previousEndDate || contract.endDate;
  const previousEndDateStr = formatDateVn(previousEndIso);
  const newEndDateStr = formatDateVn(addendum.newEndDate);
  const extensionDays = computeExtensionDays(previousEndIso, addendum.newEndDate);
  const sanitizedNotes = escapeHtml(addendum.notes?.trim());

  const pageBodyHtml = `
    <!-- Tiêu đề Phụ lục gia hạn -->
    <div class="contract-title-block">
      <div class="contract-main-title">PHỤ LỤC HỢP ĐỒNG THUÊ KHO</div>
      <div class="contract-subtitle">V/v: Gia hạn thời hạn thuê kho lưu trữ tài sản</div>
      <div class="contract-code-tag">
        Phụ lục số: <strong>${addendumCode}</strong>/PLGH-SSM • Kèm theo Hợp đồng số: <strong>${ctx.contractCode}</strong>/HĐTK-SSM • Trạng thái phụ lục: <strong>${addendumStatusLabelVi}</strong>
      </div>
      <div class="legal-basis-list">
        <p>- Căn cứ Bộ luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam hiện hành;</p>
        <p>- Căn cứ Hợp đồng thuê kho lưu trữ tài sản số <strong>${ctx.contractCode}</strong>/HĐTK-SSM ký ngày <strong>${ctx.contractCreatedAtStr}</strong> giữa <strong>${ctx.companyName}</strong> (${ctx.facilityName}) và Ông/Bà <strong>${ctx.customerName}</strong>;</p>
        <p>- Căn cứ nhu cầu gia hạn thời hạn thuê kho của Bên B (đề nghị ngày ${requestedAtStr}) và sự chấp thuận của Bên A.</p>
      </div>
      <div class="contract-preamble">
        Hôm nay, ngày ${ctx.currentDay} tháng ${ctx.currentMonth} năm ${ctx.currentYear}, tại văn phòng chi nhánh ${ctx.facilityName}, hai bên gồm có:
      </div>
    </div>

    ${renderPartiesHtml(ctx)}

    <p class="clause-p-no-indent" style="margin-top: 10px;">
      Sau khi bàn bạc, hai bên thống nhất ký kết Phụ lục gia hạn Hợp đồng thuê kho số <strong>${ctx.contractCode}</strong>/HĐTK-SSM với các nội dung cụ thể như sau:
    </p>

    <!-- NỘI DUNG ĐIỀU KHOẢN PHỤ LỤC -->
    <div class="clause-heading">Điều 1: Nội dung gia hạn thời hạn thuê kho</div>
    <p class="clause-p">
      1.1. Hai bên thống nhất giữ nguyên đối tượng thuê tại Hợp đồng gốc là: <strong>${ctx.rentalTargetDesc}</strong> tại cơ sở ${ctx.facilityName} (thời hạn trước gia hạn từ ngày <strong>${ctx.startDateStr}</strong> đến hết ngày <strong>${previousEndDateStr}</strong>).
    </p>
    <p class="clause-p">
      1.2. Bên A đồng ý cho Bên B gia hạn tiếp thời hạn thuê không gian lưu trữ nêu trên đến hết ngày <strong>${newEndDateStr}</strong>${
        extensionDays !== null
          ? ` (gia hạn thêm <strong>${extensionDays} ngày</strong> kể từ ngày hết hạn cũ)`
          : ""
      }.
    </p>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 34%;">Hạng mục</th>
          <th style="width: 22%;">Thời hạn trước gia hạn</th>
          <th style="width: 22%;">Thời hạn sau gia hạn</th>
          <th style="width: 22%;">Chi phí</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${ctx.rentalTargetShort} ${ctx.unitNumber}</strong><br>
            <small style="color: #444;">${ctx.facilityName} • Giá thuê kho cơ bản</small>
          </td>
          <td class="text-center">
            Từ <strong>${ctx.startDateStr}</strong><br>
            đến <strong>${previousEndDateStr}</strong>
          </td>
          <td class="text-center">
            Đến hết <strong style="color: #047857;">${newEndDateStr}</strong>${
              extensionDays !== null ? `<br><small>(+${extensionDays} ngày)</small>` : ""
            }
          </td>
          <td class="text-right">
            <strong>${ctx.rentalPriceStr} đ</strong><br>
            <small>/ ${ctx.billingUnitVi}</small>
          </td>
        </tr>
        ${
          recurringAmenities.length > 0
            ? `<tr>
                <td>
                  Tiện ích thuê định kỳ duy trì (${recurringAmenities.length} hạng mục)<br>
                  <small style="color: #444;">Tiếp tục tính phí lặp lại mỗi ${ctx.billingUnitVi}</small>
                </td>
                <td class="text-center"><small>Định kỳ theo ${ctx.billingUnitVi}</small></td>
                <td class="text-center"><small>Tiếp tục duy trì</small></td>
                <td class="text-right">
                  <strong>+${ctx.recurringAmenitiesTotalStr} đ</strong><br>
                  <small>/ ${ctx.billingUnitVi}</small>
                </td>
              </tr>`
            : ""
        }
        ${
          oneTimeAmenities.length > 0
            ? `<tr>
                <td>
                  Tiện ích trả 1 lần ở Hợp đồng gốc (${oneTimeAmenities.length} hạng mục)<br>
                  <small style="color: #444;">Đã thanh toán kỳ đầu, không thu lại khi gia hạn</small>
                </td>
                <td class="text-center"><small>Đã thanh toán</small></td>
                <td class="text-center"><small>Không tính phí lại</small></td>
                <td class="text-right"><em>0 đ</em></td>
              </tr>`
            : ""
        }
        <tr style="background-color: #ecfdf5;">
          <td colspan="3">
            <strong>Tổng chi phí định kỳ khi gia hạn</strong>
            <small style="color: #444;">(${formatPeriodicSummaryNote(ctx)})</small>
          </td>
          <td class="text-right">
            <strong style="font-size: 13pt; color: #047857;">${ctx.totalPeriodicStr} đ</strong><br>
            <small>/ ${ctx.billingUnitVi}</small>
          </td>
        </tr>
      </tbody>
    </table>

    ${renderAmenitiesBreakdownTableHtml(
      recurringAmenities,
      "Chi tiết tiện ích thuê định kỳ tiếp tục duy trì trong thời gian gia hạn:"
    )}

    <div class="clause-heading">Điều 2: Giá thuê, Tiền đặt cọc và Thỏa thuận thanh toán</div>
    <p class="clause-p">
      2.1. <strong>Giá thuê &amp; Phí dịch vụ:</strong> Trong thời gian gia hạn đến hết ngày <strong>${newEndDateStr}</strong>, đơn giá thuê kho cơ bản là <strong>${ctx.rentalPriceStr} VND/${ctx.billingUnitVi}</strong>${
        recurringAmenitiesTotal > 0
          ? `, cộng phí tiện ích thuê định kỳ duy trì là <strong>${ctx.recurringAmenitiesTotalStr} VND/${ctx.billingUnitVi}</strong>`
          : ""
      }; tổng chi phí định kỳ áp dụng thống nhất là <strong>${ctx.totalPeriodicStr} VND/${ctx.billingUnitVi}</strong>.${
        oneTimeAmenities.length > 0
          ? " Các tiện ích trả 1 lần đã thanh toán tại Hợp đồng gốc không bị tính phí lại trong thời gian gia hạn."
          : ""
      }
    </p>
    <p class="clause-p">
      2.2. <strong>Tiền đặt cọc bảo đảm:</strong> Khoản tiền cọc <strong>${ctx.depositAmountStr} VND</strong> đã nộp theo Hợp đồng gốc (${ctx.depositStatusLabelVi}) tiếp tục được bảo lưu làm tài sản bảo đảm cho toàn bộ thời gian gia hạn và sẽ được quyết toán hoàn trả khi thanh lý hợp đồng.
    </p>
    <p class="clause-p">
      2.3. <strong>Phương thức thanh toán:</strong> Bên B thanh toán cước phí gia hạn đúng kỳ hạn qua cổng chuyển khoản tự động VietQR/SePay hoặc trực tiếp tại quầy giao dịch cơ sở.
    </p>
    ${
      sanitizedNotes
        ? `<p class="clause-p">
            2.4. <strong>Ghi chú thỏa thuận bổ sung:</strong> ${sanitizedNotes}
          </p>`
        : ""
    }

    <div class="clause-heading">Điều 3: Hiệu lực Phụ lục và Quy trình Ký kết Số hóa</div>
    <p class="clause-p">
      3.1. Phụ lục này là một bộ phận không tách rời của Hợp đồng thuê kho số <strong>${ctx.contractCode}</strong>/HĐTK-SSM. Mọi điều khoản khác không được sửa đổi, bổ sung tại Phụ lục này vẫn giữ nguyên hiệu lực thi hành.
    </p>
    <p class="clause-p">
      3.2. <strong>Quy trình ký kết sống số hóa:</strong> Sau khi Bên B xác nhận trên ứng dụng, hai bên ký sống trực tiếp trên bản in giấy A4 tại quầy chi nhánh. Quản lý cơ sở chịu trách nhiệm chụp/scan bản phụ lục có đủ chữ ký 2 bên tải lên hệ thống để lưu hồ sơ pháp lý và kích hoạt thời hạn thuê mới.
    </p>
    <p class="clause-p">
      3.3. Phụ lục được lập thành 02 (hai) bản in có giá trị pháp lý như nhau, mỗi bên giữ 01 bản kể từ ngày ký.
    </p>

    ${renderSignaturesHtml(ctx)}
  `;

  return renderPrintableHtmlDocument({
    title: `Phụ Lục Gia Hạn Hợp Đồng - ${addendumCode}`,
    toolbarLabel: `Phụ lục gia hạn: ${addendumCode} (HĐ ${ctx.contractCode})`,
    statusLabelVi: addendumStatusLabelVi,
    printButtonLabel: "🖨️ In phụ lục gia hạn / Lưu PDF (Ctrl + P)",
    pageBodyHtml,
  });
}
