# MODULE: billing (Invoice & Recurring Billing Subsystem)

Bổ sung hợp đồng dữ liệu cho module này vào `packages/shared`. Phạm vi mặc định chỉ là `packages/shared` (enums, types, schemas, constants, utils); chỉ làm `apps/web` hoặc `apps/mobile` khi mục Phạm vi ghi rõ.
Nếu thiếu thông tin hoặc có mâu thuẫn, hỏi lại, không tự suy đoán.

## Phạm vi

- Nền tảng: Cả hai (Web & Mobile, suy ra từ role: Customer trên Mobile App, Staff/Manager/Admin trên Web)
- Role và khu vực FE:
  | Role                   | Nền tảng / khu vực FE                                                                                          |
  | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
  | `customer`             | Mobile (Customer App: Lịch sử hóa đơn, thanh toán QR, tải PDF)                                                 |
  | `facility_staff`       | Web `/facility-staff/invoices/*` (Tra cứu hóa đơn cơ sở, xác nhận thu tiền mặt quầy)                           |
  | `facility_manager`     | Web `/facility-manager/invoices/*` (Quản lý hóa đơn cơ sở, tạo hóa đơn phụ phí phát sinh, duyệt thu tiền quầy) |
  | `business_ops_manager` | Web `/business-ops/invoices/*` (Toàn hệ thống, kích hoạt job quét định kỳ T-7, quét quá hạn, nhắc nợ)          |
  | `system_admin`         | Web `/system-admin/invoices/*` (Toàn hệ thống, giám sát vận hành billing)                                      |
- Vị trí hiển thị trên UI: [Cần người dùng bổ sung]

## Mô tả

Phân hệ Quản lý Hóa đơn & Thanh toán Định kỳ (Billing & Invoicing): Quản lý toàn bộ vòng đời hóa đơn (kỳ đầu `first_period`, định kỳ `recurring` chu kỳ tháng/ngày, phát sinh phụ phí phụ lục nâng hạng/hư hại `incidental`, quyết toán trả kho `check_out_settlement`), tích hợp cổng SePay VietQR (dynamic payment order), xác nhận thu tiền mặt tại quầy (Maker-Checker chống gian lận), xuất hóa đơn định dạng ISO A4 chuẩn pháp lý có nhúng mã QR, và các mẻ quét ngầm tự động (T-7 sinh hóa đơn, T-3/T-1/T-0 nhắc hạn đa kênh, quá hạn khóa nợ hợp đồng sau 3 ngày ân hạn).

## Endpoints

| Method | Path                            | Mô tả                                                                     | Role                                                                                     | Phân trang                                |
| ------ | ------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| `GET`  | `/invoices`                     | Tra cứu danh sách hóa đơn theo bộ lọc và phân quyền cơ sở                 | `customer`, `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin` | Dạng 1 (`PaginatedData<InvoiceResponse>`) |
| `POST` | `/invoices/manual`              | Tạo hóa đơn phụ phí phát sinh thủ công (`INCIDENTAL`)                     | `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin`             | —                                         |
| `POST` | `/invoices/process-recurring`   | Kích hoạt thủ công mẻ quét sinh hóa đơn định kỳ ($T-7$)                   | `business_ops_manager`, `system_admin`                                                   | —                                         |
| `POST` | `/invoices/process-overdue`     | Kích hoạt thủ công mẻ quét hóa đơn quá hạn sau 3 ngày ân hạn              | `business_ops_manager`, `system_admin`                                                   | —                                         |
| `POST` | `/invoices/process-reminders`   | Kích hoạt thủ công mẻ gửi thông báo nhắc hạn thanh toán ($T-3, T-1, T-0$) | `business_ops_manager`, `system_admin`                                                   | —                                         |
| `GET`  | `/invoices/{id}`                | Xem chi tiết hóa đơn theo ID                                              | `customer`, `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin` | —                                         |
| `GET`  | `/invoices/{id}/pdf`            | Xuất HTML hóa đơn ISO A4 chuẩn in ấn pháp lý kèm VietQR                   | `customer`, `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin` | —                                         |
| `POST` | `/invoices/{id}/payments`       | Tạo hoặc lấy liên kết thanh toán SePay VietQR cho hóa đơn                 | `customer`, `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin` | —                                         |
| `POST` | `/invoices/{id}/confirm-manual` | Xác nhận thu tiền mặt/chuyển khoản quầy (Maker-Checker)                   | `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin`             | —                                         |
| `POST` | `/invoices/{id}/cancel`         | Hủy hóa đơn đang ở trạng thái `ISSUED` hoặc `OVERDUE`                     | `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin`             | —                                         |

Query cho API danh sách (`GET /invoices`):

- `contractId`: string (ObjectId 24 ký tự hex, tùy chọn)
- `customerId`: string (ObjectId 24 ký tự hex, tùy chọn)
- `facilityId`: string (ObjectId 24 ký tự hex, tùy chọn)
- `status`: `draft` | `issued` | `paid` | `overdue` | `cancelled` | `void` (tùy chọn)
- `type`: `first_period` | `recurring` | `incidental` | `check_out_settlement` (tùy chọn)
- `dueBefore`: ISO 8601 string (tùy chọn)
- `dueAfter`: ISO 8601 string (tùy chọn)
- `sortBy` cho phép: `createdAt`, `dueDate`, `totalAmount`, `status` — mặc định: `createdAt`
- `sortOrder`: `asc` | `desc` — mặc định: `desc`
- `page`: number (tối thiểu 1, mặc định 1)
- `limit`: number (tối đa 100, mặc định 10)

## Request schema (giữ nguyên, thêm vào `packages/shared/src/schemas/request/invoice.request.schema.ts`)

Thư viện validate: Zod (BE dùng `zod: ^4.6.5`, FE dùng Zod v4: cú pháp tương thích hoàn toàn 100%).

```ts
import { z } from "zod";
import { paginationQuerySchema } from "../../../common/schemas/pagination.schema.ts";
import {
  InvoiceStatusEnum,
  InvoiceTypeEnum,
  InvoiceItemTypeEnum,
} from "../../../common/enums/billing.enum.ts";
import { PaymentMethodEnum } from "../../../common/enums/payment.enum.ts";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const dateOrDatetimeRegex =
  /^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:?\d{2})?)?)$/;

export const invoiceIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid invoice ID format"),
});

export const invoiceItemInputSchema = z.object({
  name: z.string().min(1, "Item name is required").max(200),
  description: z.string().max(500).optional().nullable(),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  unitPrice: z
    .number()
    .int("Unit price must be an integer")
    .min(0, "Unit price must be non-negative"),
  amount: z
    .number()
    .int("Amount must be an integer")
    .min(0, "Amount must be non-negative")
    .optional(),
  itemType: z.nativeEnum(InvoiceItemTypeEnum),
});

export const createManualInvoiceSchema = z.object({
  contractId: z.string().regex(objectIdRegex, "Invalid contract ID format"),
  periodStartDate: z.string().regex(dateOrDatetimeRegex, "Invalid period start date format"),
  periodEndDate: z.string().regex(dateOrDatetimeRegex, "Invalid period end date format"),
  dueDate: z.string().regex(dateOrDatetimeRegex, "Invalid due date format"),
  items: z.array(invoiceItemInputSchema).min(1, "Invoice must have at least one item"),
  discountAmount: z
    .number()
    .int("Discount amount must be an integer")
    .min(0, "Discount amount must be non-negative")
    .default(0),
  taxAmount: z
    .number()
    .int("Tax amount must be an integer")
    .min(0, "Tax amount must be non-negative")
    .default(0),
  notes: z.string().max(1000).optional().nullable(),
});

export const invoiceQuerySchema = paginationQuerySchema.extend({
  contractId: z.string().regex(objectIdRegex, "Invalid contract ID format").optional(),
  customerId: z.string().regex(objectIdRegex, "Invalid customer ID format").optional(),
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format").optional(),
  status: z.nativeEnum(InvoiceStatusEnum).optional(),
  type: z.nativeEnum(InvoiceTypeEnum).optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "totalAmount", "status"]).default("createdAt"),
});

export const cancelInvoiceSchema = z.object({
  reason: z.string().min(5, "Cancellation reason must be at least 5 characters").max(500),
});

export const confirmManualInvoicePaymentSchema = z.object({
  proofImageUrl: z.string().url("Proof image URL must be a valid URL"),
  paymentMethod: z
    .enum([PaymentMethodEnum.CASH, PaymentMethodEnum.BANK_TRANSFER])
    .default(PaymentMethodEnum.CASH),
  referenceCode: z.string().max(100).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export type InvoiceIdParam = z.infer<typeof invoiceIdParamSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;
export type CreateManualInvoiceRequest = z.infer<typeof createManualInvoiceSchema>;
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>;
export type CancelInvoiceRequest = z.infer<typeof cancelInvoiceSchema>;
export type ConfirmManualInvoicePaymentRequest = z.infer<typeof confirmManualInvoicePaymentSchema>;
```

## Response (hình dạng dữ liệu, cập nhật `packages/shared/src/types/invoice.response.type.ts`)

Mọi API trả về `ApiResponse<T>`:

```ts
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  messageCode: string;
  message: string;
  data: T;
}
```

### Shape của Invoice & Items:

```ts
export interface InvoiceItemResponse {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  itemType: InvoiceItemTypeEnum;
}

export interface EntitySummary {
  id: string;
  name?: string;
  email?: string;
  code?: string;
}

export interface InvoiceResponse {
  id: string;
  invoiceCode: string;
  contractId: string;
  customerId: string;
  facilityId: string;
  facility?: EntitySummary | null;
  customer?: EntitySummary | null;
  contract?: EntitySummary | null;
  type: InvoiceTypeEnum;
  status: InvoiceStatusEnum;
  billingPeriodIndex: number;
  periodStartDate: string; // ISO 8601
  periodEndDate: string; // ISO 8601
  dueDate: string; // ISO 8601
  items: InvoiceItemResponse[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paidAt?: string | null;
  paymentId?: string | null;
  paymentMethod?: PaymentMethodEnum | null;
  notes?: string | null;
  issuedAt?: string | null;
  createdBy?: EntitySummary | null;
  confirmedBy?: EntitySummary | null;
  confirmedAt?: string | null;
  proofImageUrl?: string | null;
  cancelledBy?: EntitySummary | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePdfResponse {
  html: string;
  invoiceCode: string;
}

export interface RecurringInvoiceScanResult {
  scannedCount: number;
  generatedCount: number;
  skippedCount: number;
  failedCount: number;
}

export interface OverdueInvoiceScanResult {
  scannedCount: number;
  markedOverdueCount: number;
  contractsLockedCount: number;
  skippedCount: number;
  failedCount: number;
}

export interface RemindInvoicesScanResult {
  scannedCount: number;
  remindedT3Count: number;
  remindedT1Count: number;
  remindedT0Count: number;
  totalRemindedCount: number;
  skippedCount: number;
  failedCount: number;
}
```

- Dạng phân trang cho `GET /invoices`: **Dạng 1** (`ApiResponse<PaginatedData<InvoiceResponse>>`), trong đó `response.data` chứa:
  ```ts
  {
    items: InvoiceResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  }
  ```
- Tiền tệ: Số nguyên VND (`Math.round()`). Ngày tháng: ISO 8601 string.
- Tham chiếu: `contractId`, `customerId`, `facilityId` luôn có dạng string ID 24 ký tự hex. Các trường đối tượng `facility`, `customer`, `contract`, `createdBy`, `confirmedBy`, `cancelledBy` được populate dạng `EntitySummary` rút gọn hoặc null.

## Enums (cập nhật `packages/shared/src/enums/billing.enum.ts`)

### `BillingUnitEnum` (File BE: `src/common/enums/billing.enum.ts`)

```ts
export enum BillingUnitEnum {
  DAY = "day",
  MONTH = "month",
  ONE_TIME = "one_time",
}
```

### `InvoiceStatusEnum` (File BE: `src/common/enums/billing.enum.ts`)

```ts
export enum InvoiceStatusEnum {
  DRAFT = "draft",
  ISSUED = "issued",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
  VOID = "void",
}
```

### `InvoiceTypeEnum` (File BE: `src/common/enums/billing.enum.ts`)

```ts
export enum InvoiceTypeEnum {
  FIRST_PERIOD = "first_period",
  RECURRING = "recurring",
  INCIDENTAL = "incidental",
  CHECK_OUT_SETTLEMENT = "check_out_settlement",
}
```

### `InvoiceItemTypeEnum` (File BE: `src/common/enums/billing.enum.ts`)

```ts
export enum InvoiceItemTypeEnum {
  RENT = "rent",
  AMENITY = "amenity",
  DAMAGE_FEE = "damage_fee",
  OVERDUE_FEE = "overdue_fee",
  DISCOUNT = "discount",
  OTHER = "other",
}
```

## Ma trận hành động theo trạng thái

| Hành động                                                        | Trạng thái hóa đơn cho phép                      | Role được phép                                                                           | Ghi chú                                                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Lấy VietQR thanh toán (`POST /invoices/:id/payments`)            | `issued`, `overdue`                              | `customer`, `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin` | Tạo đơn thanh toán SePay QR, quét thanh toán tự động chuyển hóa đơn sang `paid` và phục hồi hợp đồng `active` nếu đang nợ            |
| Xác nhận thu tiền mặt quầy (`POST /invoices/:id/confirm-manual`) | `issued`, `overdue`                              | `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin`             | Bắt buộc có ảnh biên lai `proofImageUrl`. Áp dụng Maker-Checker cho hóa đơn `incidental`: người thu tiền phải khác người tạo hóa đơn |
| Xuất PDF ISO A4 (`GET /invoices/:id/pdf`)                        | `issued`, `paid`, `overdue`, `cancelled`, `void` | `customer` (hóa đơn của mình), nhân sự/quản lý (theo cơ sở hoặc toàn hệ thống)           | Trả về HTML A4 chuẩn in ấn pháp lý kèm VietQR động (chỉ hiện QR nếu chưa thanh toán)                                                 |
| Hủy hóa đơn (`POST /invoices/:id/cancel`)                        | `issued`, `overdue`                              | `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin`             | Bắt buộc nhập lý do tối thiểu 5 ký tự. Khách hàng không có quyền tự hủy                                                              |

## Error codes và thông báo (cập nhật `MESSAGE_CODE`, `MESSAGE_DICTIONARY_EN/VI`)

| Message Code       | HTTP | Mẫu EN                                         | Mẫu VI (đề xuất, cần xác nhận)                                          | Chủ thể `{0}`                              |
| ------------------ | ---- | ---------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| `MESSAGE_CODE_800` | 404  | {0} Not Found                                  | Không tìm thấy {0}                                                      | `Invoice`                                  |
| `MESSAGE_CODE_801` | 400  | Invalid Invoice Status Transition              | Chuyển đổi trạng thái hóa đơn không hợp lệ                              | —                                          |
| `MESSAGE_CODE_802` | 400  | Invoice Has Already Been Paid                  | Hóa đơn đã được thanh toán                                              | `Invoice`                                  |
| `MESSAGE_CODE_803` | 400  | Invoice Cannot Be Cancelled In Current Status  | Không thể hủy hóa đơn ở trạng thái hiện tại                             | `Invoice`                                  |
| `MESSAGE_CODE_804` | 400  | Invoice Due Date Must Be After Issue Date      | Hạn thanh toán phải sau ngày phát hành hóa đơn                          | —                                          |
| `MESSAGE_CODE_805` | 400  | Invoice Amount Must Match Payment Exactly      | Số tiền hóa đơn phải khớp chính xác với thanh toán                      | —                                          |
| `MESSAGE_CODE_806` | 400  | Proof Image URL Is Required For Manual Payment | Xác nhận thu tiền thủ công bắt buộc phải có ảnh chứng từ thanh toán     | —                                          |
| `MESSAGE_CODE_807` | 400  | Invoice Facility Mismatch                      | Cơ sở của hóa đơn không khớp                                            | —                                          |
| `MESSAGE_CODE_808` | 400  | Invoice Items Cannot Be Empty                  | Danh mục khoản mục hóa đơn không được để trống                          | —                                          |
| `MESSAGE_CODE_809` | 400  | Cannot Void Already Paid Invoice               | Không thể vô hiệu hóa hóa đơn đã được thanh toán                        | `Invoice`                                  |
| `MESSAGE_CODE_810` | 400  | Invoice Code Already Exists                    | Mã hóa đơn đã tồn tại                                                   | —                                          |
| `MESSAGE_CODE_320` | 403  | {0}                                            | Nhân viên xác nhận thu tiền phải khác với nhân viên lập hóa đơn phụ thu | `Confirmer must be different from Creator` |
| `MESSAGE_CODE_121` | 403  | User Must Have Role {0}                        | Bạn không có quyền thực hiện hành động này                              | Danh sách role được phép                   |
| `MESSAGE_CODE_122` | 403  | You Do Not Have Permission To Manage This {0}  | Bạn không có quyền quản lý cơ sở của hóa đơn này                        | `Facility`                                 |
| `MESSAGE_CODE_103` | 403  | Access Denied                                  | Bạn không có quyền truy cập hóa đơn này                                 | —                                          |

## Constants

| Tên Constant                              | Giá trị | Ý nghĩa                                                                                               |
| ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `RECURRING_INVOICE_LEAD_DAYS`             | `7`     | Mốc tự động sinh hóa đơn kỳ tiếp theo trước ngày bắt đầu chu kỳ mới ($T-7$)                           |
| `INVOICE_GRACE_PERIOD_DAYS`               | `3`     | Số ngày ân hạn sau ngày đáo hạn (DueDate) trước khi hóa đơn và hợp đồng bị phạt chuyển sang `OVERDUE` |
| `DAILY_RENTAL_FULL_CHARGE_THRESHOLD_DAYS` | `14`    | Hợp đồng thuê theo ngày $\le 14$ ngày thu trọn gói 1 lần; $> 14$ ngày chia chu kỳ 7 ngày              |
| `DAILY_RENTAL_CYCLE_DAYS`                 | `7`     | Độ dài chu kỳ thu tiền cho hợp đồng ngày dài hạn                                                      |

## Quy tắc validate/nghiệp vụ bổ sung (không nằm trong schema)

1. **Bảo vệ gian lận quầy (Maker-Checker):** Đối với hóa đơn phụ thu phát sinh (`INCIDENTAL`), nhân viên thu tiền mặt tại quầy (`confirmManualPayment`) **bắt buộc phải là người khác** so với nhân viên lập hóa đơn (`createdBy`), nếu cùng 1 nhân viên thực hiện sẽ bị hệ thống từ chối với lỗi 403 `MESSAGE_CODE_320`.
2. **Khóa nợ và Phục hồi tự động:** Khi hóa đơn bị quá hạn sau 3 ngày ân hạn, hợp đồng liên quan tự động chuyển sang trạng thái `OVERDUE` (khóa quyền truy cập kho và nhập xuất kho). Ngay khi khách hàng quét VietQR hoặc thanh toán thủ công hết nợ, hợp đồng được phục hồi về `ACTIVE` tức thì.
3. **Quyết toán cọc trả kho:** Khi làm thủ tục trả kho check-out (`checkOutContract`), hệ thống tự động sinh hóa đơn `CHECK_OUT_SETTLEMENT` cấn trừ tiền cọc với phí hư hại và phí trễ hạn. Nếu cọc dư sẽ tự động phát sinh `RefundRequest` hoàn tiền cho khách.
4. **Quyền riêng tư hóa đơn (Rule 14 Scoping):** Khách hàng (`CUSTOMER`) chỉ được xem và tải PDF hóa đơn của chính mình. Nhân viên cơ sở chỉ xem và thao tác trên hóa đơn thuộc cơ sở được phân công (`assignedFacilityId`). Quản trị viên vận hành và Admin hệ thống có quyền xem toàn hệ thống.
5. **Cơ chế bóc tách Tiện ích mua 1 lần (`ONE_TIME`) và Tiện ích thuê định kỳ (`MONTH` / `DAY`) trên Hóa đơn:**
   - **Hóa đơn kỳ đầu (`first_period` / Kỳ 1):** Bao gồm tiền thuê kho kỳ 1 + tiện ích thuê định kỳ kỳ 1 + **toàn bộ tiện ích mua 1 lần (`billingUnit === 'one_time'`, ví dụ: thùng carton, ổ khóa, dịch vụ bốc xếp ban đầu)**.
   - **Hóa đơn định kỳ các chu kỳ sau (`recurring` / Kỳ 2, 3... và sau khi gia hạn phụ lục `RENEW`):** Hệ thống tự động **loại bỏ hoàn toàn các tiện ích mua 1 lần**. Hóa đơn từng kỳ sau **CHỈ BAO GỒM**:
     - Tiền thuê phòng kho (`itemType: 'rent'`)
     - Tiền các tiện ích thuê định kỳ theo tháng/ngày (`itemType: 'amenity'` với `billingUnit === 'month'` hoặc `'day'`).
   - Tuyệt đối không bao giờ thu lặp lại tiện ích mua 1 lần ở các chu kỳ hóa đơn tiếp theo.

## Hành vi UI/UX mong muốn (người dùng cung cấp)

- Làm mới (`invalidateQueries`) sau khi thành công: [Cần người dùng bổ sung]
- Thông báo hoặc chuyển trang: [Cần người dùng bổ sung]
- Khóa dịch cần thêm vào `messages/{vi,en}.json` hoặc `locales/{vi,en}.json`: [Cần người dùng bổ sung]

## Thay đổi so với contract trước

Không có (module mới: phân hệ Hóa đơn & Thanh toán Định kỳ `Invoice & Billing` được xây dựng mới hoàn chỉnh).
