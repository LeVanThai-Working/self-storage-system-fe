# MODULE: payment

Bổ sung hợp đồng dữ liệu cho module này vào `packages/shared`. Phạm vi mặc định chỉ là `packages/shared` (enums, types, schemas, constants, utils); chỉ làm `apps/web` hoặc `apps/mobile` khi mục Phạm vi ghi rõ.
Nếu thiếu thông tin hoặc có mâu thuẫn, hỏi lại, không tự suy đoán.

## Phạm vi

- Nền tảng: Cả hai (Web cho nhân viên/quản lý cơ sở và quản trị hệ thống; Mobile cho khách hàng quét mã VietQR và xem trạng thái thanh toán) (suy ra từ role, cần xác nhận)
- Role và khu vực FE:
  - `customer`: Mobile (Customer App) & Web Portal
  - `facility_staff`: Web `/facility-staff/*`
  - `facility_manager`: Web `/facility-manager/*`
  - `business_ops_manager`: Web `/business-ops/*`
  - `system_admin`: Web `/system-admin/*`
- Vị trí hiển thị trên UI: [Cần người dùng bổ sung]

## Mô tả

Quản lý toàn bộ giao dịch thanh toán trong hệ thống kho tự quản:

1. Tạo và hiển thị mã VietQR động tự động điền sẵn thông tin (số tiền, nội dung chuyển khoản) tích hợp cổng SePay cho: đặt cọc giữ chỗ (`reservation_deposit`), đặt cọc hợp đồng (`contract_deposit`), và tiền thuê kỳ đầu (`rent_first_period`).
2. Thực thi nguyên tắc thanh toán một lần duy nhất (**Single Payment Invariant**): không chấp nhận trả góp, trả thiếu hay cộng dồn nhiều lần; chuyển sai số tiền sẽ tự động tạo yêu cầu hoàn tiền (`RefundRequest`).
3. Xác nhận thanh toán thủ công tại quầy (tiền mặt / chuyển khoản trực tiếp) tuân thủ nguyên tắc **Maker-Checker** và bắt buộc đính kèm ảnh biên lai chứng từ (`proofImageUrl`).
4. Tra cứu và đối soát giao dịch ngân hàng không khớp mã (**Unmatched Transactions Reconciliation**).
5. Quét và cập nhật tự động các đơn quá hạn thanh toán (`process-expired`).

## Endpoints

| Method | Path                               | Mô tả                                                                                       | Role                                                                           | Phân trang |
| :----- | :--------------------------------- | :------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------- | :--------- |
| POST   | /payments/sepay/webhook            | Webhook tiếp nhận biến động số dư SePay (Xác thực qua header `Authorization: Apikey <KEY>`) | Public / Webhook                                                               | —          |
| POST   | /payments                          | Tạo hoặc lấy lại đơn thanh toán đang chờ kèm link VietQR động                               | customer, facility_staff, facility_manager, business_ops_manager, system_admin | —          |
| POST   | /payments/process-expired          | Quét và hết hạn các đơn thanh toán pending đã quá hạn (Batch / Cron)                        | system_admin, business_ops_manager                                             | —          |
| GET    | /payments                          | Danh sách đơn thanh toán có phân trang và bộ lọc                                            | customer, facility_staff, facility_manager, business_ops_manager, system_admin | Dạng 1     |
| GET    | /payments/transactions/unmatched   | Danh sách giao dịch ngân hàng không khớp mã (UNMATCHED) để đối soát                         | facility_manager, business_ops_manager, system_admin                           | Dạng 1     |
| POST   | /payments/transactions/{id}/assign | Gán thủ công giao dịch không khớp vào đơn thanh toán chỉ định                               | facility_manager, business_ops_manager, system_admin                           | —          |
| GET    | /payments/{id}                     | Chi tiết đơn thanh toán (dùng để polling kiểm tra trạng thái và lấy link QR)                | customer, facility_staff, facility_manager, business_ops_manager, system_admin | —          |
| POST   | /payments/{id}/cancel              | Hủy đơn thanh toán khi còn ở trạng thái `pending`                                           | customer, facility_staff, facility_manager, business_ops_manager, system_admin | —          |
| POST   | /payments/{id}/confirm-manual      | Xác nhận thanh toán trực tiếp tại quầy bằng tiền mặt/chuyển khoản (kèm ảnh biên lai)        | facility_staff, facility_manager, business_ops_manager, system_admin           | —          |
| POST   | /upload/signature                  | **[Upload Biên lai]** Tạo chữ ký tải ảnh biên lai chuyển khoản/tiền mặt lên Cloudinary      | facility_staff, facility_manager, business_ops_manager, system_admin           | —          |

Query cho API danh sách đơn thanh toán (`GET /payments`):

- `sortBy` cho phép: `createdAt`, `amount`, `paidAmount`, `expiresAt`, `paidAt`, `status`, `updatedAt`, mặc định: `createdAt`
- `sortOrder`: `asc` | `desc`, mặc định: `desc`
- Các bộ lọc query khác: `page` (default: 1), `limit` (default: 10, max: 100), `customerId`, `facilityId`, `reservationId`, `contractId`, `purpose`, `status`, `paymentCode`, `createdAtFrom`, `createdAtTo`.

Query cho API đối soát giao dịch ngân hàng (`GET /payments/transactions/unmatched`):

- `sortBy` cho phép: `createdAt`, `transferAmount`, `transactionDate`, mặc định: `createdAt`
- `sortOrder`: `asc` | `desc`, mặc định: `desc`
- Các bộ lọc query khác: `page` (default: 1), `limit` (default: 10, max: 100), `result` (default: `unmatched`), `gateway`, `accountNumber`, `code`.

## Request schema (giữ nguyên, thêm vào `packages/shared/src/schemas/request/`)

Thư viện validate: Zod `^4.6.5` (BE dùng Zod v4, tương thích trực tiếp với FE).

### `src/modules/payment/schemas/payment.request.schema.ts`

```ts
import { z } from "zod";
import { paginationQuerySchema } from "../../../common/schemas/pagination.schema.ts";
import {
  PaymentMethodEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  PaymentTransactionResultEnum,
} from "../../../common/enums/payment.enum.ts";

export const paymentIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid payment ID format"),
});

export const createPaymentSchema = z
  .object({
    purpose: z.nativeEnum(PaymentPurposeEnum),
    reservationId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid reservation ID format")
      .optional(),
    contractId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid contract ID format")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.purpose === PaymentPurposeEnum.RESERVATION_DEPOSIT) {
        return !!data.reservationId;
      }
      if (
        data.purpose === PaymentPurposeEnum.CONTRACT_DEPOSIT ||
        data.purpose === PaymentPurposeEnum.RENT_FIRST_PERIOD
      ) {
        return !!data.contractId;
      }
      return false;
    },
    {
      message:
        "Must provide reservationId for RESERVATION_DEPOSIT, or contractId for CONTRACT_DEPOSIT or RENT_FIRST_PERIOD",
    }
  );

export const confirmManualPaymentSchema = z.object({
  method: z
    .enum([PaymentMethodEnum.CASH, PaymentMethodEnum.BANK_TRANSFER])
    .default(PaymentMethodEnum.CASH),
  referenceCode: z.string().max(100).optional(),
  proofImageUrl: z.string().url("Proof image URL is required for manual payment verification"),
  note: z.string().min(2, "Note is required for manual payment verification").max(1000),
});

export const cancelPaymentSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(500),
});

export const paymentQuerySchema = paginationQuerySchema.extend({
  customerId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  reservationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  contractId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  purpose: z.nativeEnum(PaymentPurposeEnum).optional(),
  status: z.nativeEnum(PaymentStatusEnum).optional(),
  paymentCode: z.string().optional(),
  createdAtFrom: z.string().optional(),
  createdAtTo: z.string().optional(),
});

export const sepayWebhookSchema = z.object({
  id: z.number(),
  gateway: z.string().nullish(),
  transactionDate: z.string().nullish(),
  accountNumber: z.string().nullish(),
  subAccount: z.string().nullish(),
  code: z.string().nullish(),
  content: z.string().nullish(),
  transferType: z.string().nullish(),
  transferAmount: z.number(),
  accumulated: z.number().nullish(),
  referenceCode: z.string().nullish(),
  description: z.string().nullish(),
});

export interface SepayWebhookPayload {
  id: number;
  gateway?: string | null;
  transactionDate?: string | null;
  accountNumber?: string | null;
  subAccount?: string | null;
  code?: string | null;
  content?: string | null;
  transferType?: string | null;
  transferAmount: number;
  accumulated?: number | null;
  referenceCode?: string | null;
  description?: string | null;
}

export type CreatePaymentRequest = z.infer<typeof createPaymentSchema>;
export type ConfirmManualPaymentRequest = z.infer<typeof confirmManualPaymentSchema>;
export type CancelPaymentRequest = z.infer<typeof cancelPaymentSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>;

export const paymentTransactionIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid transaction ID format"),
});

export const assignUnmatchedTransactionSchema = z.object({
  paymentCode: z.string().min(3).max(50).trim(),
});

export const unmatchedTransactionQuerySchema = paginationQuerySchema.extend({
  result: z.nativeEnum(PaymentTransactionResultEnum).optional(),
  gateway: z.string().optional(),
  accountNumber: z.string().optional(),
  code: z.string().optional(),
});

export type PaymentTransactionIdParam = z.infer<typeof paymentTransactionIdParamSchema>;
export type AssignUnmatchedTransactionRequest = z.infer<typeof assignUnmatchedTransactionSchema>;
export type UnmatchedTransactionQuery = z.infer<typeof unmatchedTransactionQuerySchema>;
```

### `src/modules/upload/schemas/upload.request.schema.ts` (API Upload Ảnh Biên lai Thanh toán)

```ts
export const cloudinarySignatureRequestSchema = z.object({
  folder: z
    .string()
    .trim()
    .min(1, "Folder cannot be empty")
    .regex(
      /^[\w\-/]+$/,
      "Folder can only contain alphanumeric characters, hyphens, underscores and slashes"
    )
    .default("self-storage/general")
    .optional(),
});

export type CloudinarySignatureRequest = z.infer<typeof cloudinarySignatureRequestSchema>;
```

### Shared Pagination Schema (`src/common/schemas/pagination.schema.ts`)

```ts
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  sortBy: z.string().trim().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
```

---

## Response (hình dạng dữ liệu, cập nhật `packages/shared/src/types/`)

Mọi API trả về `ApiResponse<T>`.

### Các DTO Response (`src/modules/payment/schemas/payment.response.schema.ts`)

```ts
export interface UserSnapshot {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role?: string | null;
}

export interface FacilitySnapshot {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
}

export interface BankInfo {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface PaymentResponse {
  id: string;
  paymentCode: string;
  purpose: PaymentPurposeEnum;
  reservationId?: string | null;
  contractId?: string | null;
  customerId: string;
  facilityId: string;
  amount: number;
  paidAmount: number;
  overpaidAmount: number;
  method: PaymentMethodEnum;
  status: PaymentStatusEnum;
  qrUrl?: string | null;
  bankInfo?: BankInfo | null;
  expiresAt?: string | null;
  paidAt?: string | null;
  sepayTransactionId?: number | null;
  referenceCode?: string | null;
  confirmedBy?: UserSnapshot | null;
  confirmedAt?: string | null;
  proofImageUrl?: string | null;
  cancelledBy?: UserSnapshot | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  note?: string | null;
  customer?: UserSnapshot | null;
  facility?: FacilitySnapshot | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransactionResponse {
  id: string;
  sepayId: number;
  gateway?: string | null;
  transactionDate?: string | null;
  accountNumber?: string | null;
  subAccount?: string | null;
  code?: string | null;
  content?: string | null;
  transferType?: string | null;
  transferAmount?: number | null;
  accumulated?: number | null;
  referenceCode?: string | null;
  description?: string | null;
  matchedPaymentId?: string | null;
  result: PaymentTransactionResultEnum;
  createdAt: string;
  updatedAt: string;
}
```

- **Trường tham chiếu:**
  - `customerId`, `facilityId`: Trả về dạng string ID.
  - `customer`, `facility`: Trả về snapshot object hoặc `null` nếu chưa populate.
  - `confirmedBy`, `cancelledBy`: Snapshot object của người thực hiện (`id`, `name`, `email`, `role`).
  - `bankInfo`: Object chứa tài khoản thụ hưởng (`bankCode`, `accountNumber`, `accountName`).
  - `qrUrl`: Link ảnh VietQR động của SePay. **Chỉ trả về khi `status === 'pending'`**, trả về `null` khi đơn đã `paid`, `expired`, hoặc `cancelled`.
- **Kiểu dữ liệu đặc thù:**
  - Tiền tệ (`amount`, `paidAmount`, `overpaidAmount`, `transferAmount`, `accumulated`): Số nguyên VND (kiểu `number`).
  - Ngày giờ (`createdAt`, `updatedAt`, `expiresAt`, `paidAt`, `confirmedAt`, `cancelledAt`): Chuỗi ISO 8601 UTC.
  - Decimal: Không có Decimal thô, toàn bộ số tiền đều được làm tròn số nguyên VND.
- **Dạng phân trang:** Dạng 1 (`ApiResponse<PaginatedData<T>>`), trong đó `response.data.data` là `{ items: T[], pagination: PaginationMeta }`.

### `CloudinarySignatureResponse` (File BE: `src/modules/upload/schemas/upload.response.schema.ts`)

```ts
export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}
```

> **⚡ QUY TRÌNH UPLOAD ẢNH BIÊN LAI THỦ CÔNG (`proofImageUrl`):**
>
> 1. Gọi `POST /upload/signature` với `{ folder: 'self-storage/general' }`.
> 2. Gửi file ảnh biên lai trực tiếp lên Cloudinary: `POST https://api.cloudinary.com/v1_1/${cloudName}/auto/upload` với `FormData` (`file`, `api_key`, `timestamp`, `signature`, `folder`).
> 3. Cloudinary trả về `{ secure_url: string }`.
> 4. Gửi `proofImageUrl: secure_url` vào payload `POST /payments/:id/confirm-manual`.

---

## Enums (cập nhật `packages/shared/src/enums/`)

### `PaymentStatusEnum` (File BE: `src/common/enums/payment.enum.ts`)

```ts
export enum PaymentStatusEnum {
  PENDING = "pending",
  /** @deprecated T1.8 single payment invariant: Underpayment no longer changes status to partially_paid */
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}
```

### `PaymentPurposeEnum` (File BE: `src/common/enums/payment.enum.ts`)

```ts
export enum PaymentPurposeEnum {
  RESERVATION_DEPOSIT = "reservation_deposit",
  CONTRACT_DEPOSIT = "contract_deposit",
  RENT_FIRST_PERIOD = "rent_first_period",
}
```

### `PaymentMethodEnum` (File BE: `src/common/enums/payment.enum.ts`)

```ts
export enum PaymentMethodEnum {
  SEPAY_QR = "sepay_qr",
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
}
```

### `PaymentTransactionResultEnum` (File BE: `src/common/enums/payment.enum.ts`)

```ts
export enum PaymentTransactionResultEnum {
  RECEIVED = "received",
  MATCHED = "matched",
  /** @deprecated T1.8 single payment invariant: Underpayment is recorded as amount_mismatch */
  PARTIALLY_MATCHED = "partially_matched",
  UNMATCHED = "unmatched",
  AMOUNT_MISMATCH = "amount_mismatch",
  LATE = "late",
  IGNORED = "ignored",
}
```

---

### `CloudinaryFolderEnum` (File BE: `src/common/enums/upload.enum.ts`)

```ts
export enum CloudinaryFolderEnum {
  GENERAL = "self-storage/general",
  CONTRACTS = "self-storage/contracts",
}
```

---

## Ma trận hành động theo trạng thái

| Hành động                                                             | Trạng thái cho phép                                                                  | Role                                                                                     | Ghi chú & Ràng buộc                                                                                                                                                  |
| :-------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tạo / Lấy đơn thanh toán (`POST /payments`)                           | Chưa có đơn, hoặc đơn cũ đã `expired`/`cancelled`                                    | `customer`, `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin` | Nếu đang có đơn `pending` còn hạn, API tự động trả về đơn hiện tại (idempotent), không sinh thêm đơn trùng lặp.                                                      |
| Polling / Xem chi tiết (`GET /payments/{id}`)                         | Mọi trạng thái (`pending`, `paid`, `expired`, `cancelled`)                           | `customer`, `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin` | Khách hàng chỉ xem được đơn của mình. Trả về `qrUrl` động khi `pending`.                                                                                             |
| Hủy đơn thanh toán (`POST /payments/{id}/cancel`)                     | `pending`                                                                            | `customer`, `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin` | Khách hàng chỉ hủy được đơn của mình. Không thể hủy khi đơn đã `paid`, `expired` hoặc `cancelled`. Yêu cầu lý do tối thiểu 3 ký tự.                                  |
| Xác nhận thanh toán thủ công (`POST /payments/{id}/confirm-manual`)   | `pending`                                                                            | `facility_staff`, `facility_manager`, `business_ops_manager`, `system_admin`             | Thu ngân/nhân viên thu tiền mặt hoặc nhận chuyển khoản trực tiếp. Bắt buộc upload biên lai (`proofImageUrl`) và ghi chú (`note` min 2 ký tự). Áp dụng Maker-Checker. |
| Tra cứu giao dịch không khớp (`GET /payments/transactions/unmatched`) | Các kết quả giao dịch: `unmatched`, `amount_mismatch`, `late`, `ignored`, `received` | `facility_manager`, `business_ops_manager`, `system_admin`                               | Kế toán / Quản lý đối soát các giao dịch ngân hàng bị thiếu mã hoặc sai mã chuyển khoản.                                                                             |
| Gán giao dịch không khớp (`POST /payments/transactions/{id}/assign`)  | Transaction: `unmatched`<br>Payment: `pending`                                       | `facility_manager`, `business_ops_manager`, `system_admin`                               | Gán giao dịch ngân hàng mồ côi vào mã thanh toán. Số tiền chuyển phải khớp 100% với `payment.amount`. Chuyển đơn sang `paid` và transaction sang `matched`.          |
| Quét đơn quá hạn (`POST /payments/process-expired`)                   | `pending` (có `expiresAt < now`)                                                     | `system_admin`, `business_ops_manager`                                                   | Batch / Cron job chạy định kỳ để tự động đóng các đơn quá hạn.                                                                                                       |

---

## Error codes và thông báo (cập nhật `MESSAGE_CODE`, `MESSAGE_DICTIONARY_EN/VI`)

| Message Code       | HTTP | Mẫu EN                                                  | Mẫu VI (đề xuất, cần xác nhận)                                                   | Chủ thể `{0}`            |
| :----------------- | :--- | :------------------------------------------------------ | :------------------------------------------------------------------------------- | :----------------------- |
| `MESSAGE_CODE_001` | 200  | Action Successfully                                     | Thao tác thành công                                                              | —                        |
| `MESSAGE_CODE_002` | 201  | {0} Created Successfully                                | Tạo {0} thành công                                                               | `Payment`                |
| `MESSAGE_CODE_003` | 200  | {0} Updated Successfully                                | Cập nhật {0} thành công                                                          | `Payment`, `Transaction` |
| `MESSAGE_CODE_101` | 400  | Invalid Request                                         | Yêu cầu không hợp lệ                                                             | —                        |
| `MESSAGE_CODE_102` | 401  | Unauthorized Access                                     | Chưa xác thực danh tính                                                          | —                        |
| `MESSAGE_CODE_103` | 403  | Access Denied                                           | Bạn không có quyền truy cập đơn thanh toán này                                   | —                        |
| `MESSAGE_CODE_104` | 404  | {0} Not Found                                           | Không tìm thấy {0}                                                               | `User`                   |
| `MESSAGE_CODE_106` | 500  | Internal Server Error                                   | Lỗi cấu hình hạ tầng thanh toán                                                  | —                        |
| `MESSAGE_CODE_121` | 403  | User Must Have Role {0}                                 | Bạn không có vai trò hợp lệ để thực hiện thao tác này                            | `FACILITY_STAFF, ...`    |
| `MESSAGE_CODE_122` | 403  | You Do Not Have Permission To Manage {0}                | Bạn không có quyền quản lý cơ sở của đơn thanh toán này                          | `Facility`               |
| `MESSAGE_CODE_300` | 404  | Reservation Not Found                                   | Không tìm thấy thông tin đơn đặt chỗ                                             | —                        |
| `MESSAGE_CODE_304` | 400  | Reservation Has Expired                                 | Đơn đặt chỗ đã hết hạn thanh toán giữ chỗ                                        | —                        |
| `MESSAGE_CODE_400` | 404  | Contract Not Found                                      | Không tìm thấy thông tin hợp đồng                                                | —                        |
| `MESSAGE_CODE_401` | 400  | Invalid Contract Status Transition                      | Hợp đồng không ở trạng thái hợp lệ để thanh toán                                 | —                        |
| `MESSAGE_CODE_500` | 404  | Payment Not Found                                       | Không tìm thấy thông tin đơn thanh toán                                          | —                        |
| `MESSAGE_CODE_501` | 400  | Invalid Payment Status Transition                       | Trạng thái đơn thanh toán không hợp lệ để thực hiện thao tác                     | —                        |
| `MESSAGE_CODE_502` | 400  | Payment Has Expired                                     | Đơn thanh toán đã hết hạn hoặc đã bị hủy trước đó                                | —                        |
| `MESSAGE_CODE_503` | 401  | Invalid SePay Webhook Authentication                    | Xác thực Webhook cổng thanh toán không hợp lệ                                    | —                        |
| `MESSAGE_CODE_504` | 400  | Payment Amount Insufficient                             | Số tiền thanh toán không đủ (legacy)                                             | —                        |
| `MESSAGE_CODE_505` | 400  | Order Is Not Awaiting Payment                           | Đơn hàng không ở trạng thái chờ thanh toán                                       | —                        |
| `MESSAGE_CODE_506` | 400  | Contract Deposit Not Paid                               | Tiền cọc hợp đồng chưa được thanh toán                                           | —                        |
| `MESSAGE_CODE_507` | 400  | Payment Already Settled                                 | Đơn thanh toán này đã được thanh toán hoàn tất trước đó                          | —                        |
| `MESSAGE_CODE_508` | 400  | Payment Account Mismatch                                | Số tài khoản thụ hưởng không khớp với hệ thống                                   | —                        |
| `MESSAGE_CODE_509` | 400  | Proof Image Is Required For Manual Payment Confirmation | Bắt buộc cung cấp ảnh chụp chứng từ/biên lai khi xác nhận thủ công               | —                        |
| `MESSAGE_CODE_510` | 404  | Payment Transaction Not Found                           | Không tìm thấy giao dịch ngân hàng tương ứng                                     | —                        |
| `MESSAGE_CODE_517` | 400  | Payment Transaction Already Assigned                    | Giao dịch ngân hàng đã được gán hoặc không ở trạng thái UNMATCHED                | —                        |
| `MESSAGE_CODE_518` | 400  | Payment Transaction Amount Mismatch                     | Số tiền giao dịch ngân hàng không khớp với số tiền của đơn thanh toán            | —                        |
| `MESSAGE_CODE_519` | 400  | Contract First Period Rent Not Paid                     | Tiền thuê kỳ đầu của hợp đồng chưa được thanh toán                               | —                        |
| `MESSAGE_CODE_520` | 400  | Contract Deposit Must Be Paid Before First Period Rent  | Hợp đồng bắt buộc phải thanh toán tiền cọc trước khi thanh toán tiền thuê kỳ đầu | —                        |
| `MESSAGE_CODE_521` | 400  | Contract First Period Rent Already Paid                 | Tiền thuê kỳ đầu của hợp đồng này đã được thanh toán xong                        | —                        |

---

## Constants

| Tên Constant                       | Giá trị                                                                                         | Ý nghĩa                                                                                           |
| :--------------------------------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `DEFAULT_PAYMENT_CODE_LENGTH`      | `8`                                                                                             | Độ dài ký tự ngẫu nhiên trong mã thanh toán (không chứa O/0/1/I để tránh nhầm lẫn)                |
| `SEPAY_PAYMENT_CODE_PREFIX`        | `'SSM'`                                                                                         | Tiền tố mã thanh toán trên hệ thống (ví dụ: `SSM7A8B9C2`)                                         |
| `SEPAY_LATE_GRACE_MINUTES`         | `2` phút                                                                                        | Khoảng thời gian đệm trễ mạng/ngân hàng khi đối chiếu `transactionDate` của SePay với `expiresAt` |
| `DEFAULT_EXPIRATION_HOLDING_HOURS` | `24` giờ                                                                                        | Thời hạn thanh toán mặc định cho cọc hợp đồng và tiền thuê kỳ đầu nếu tạo trực tiếp               |
| `VietQR Dynamic URL`               | `https://qr.sepay.vn/img?acc={accountNumber}&bank={bankCode}&amount={amount}&des={paymentCode}` | Mẫu URL tạo ảnh mã QR VietQR động theo chuẩn Napas                                                |

---

## Quy tắc validate/nghiệp vụ bổ sung (không nằm trong schema)

1. **Nguyên tắc Thanh toán Một Lần Duy Nhất (Single Payment Invariant - T1.8):**
   - Hệ thống **không** hỗ trợ thanh toán nhiều lần cộng dồn (`partially_paid` và `partially_matched` đã bị bãi bỏ / deprecated).
   - Mỗi đơn thanh toán phải được trả đúng chính xác 100% số tiền yêu cầu trong một giao dịch chuyển khoản duy nhất.
   - Nếu khách hàng chuyển khoản thừa hoặc thiếu qua ngân hàng:
     - Giao dịch ngân hàng được đánh dấu kết quả là `amount_mismatch`.
     - Đơn thanh toán gốc **không** bị thay đổi (vẫn giữ trạng thái `pending`).
     - Hệ thống tự động tạo một yêu cầu hoàn tiền (`RefundRequest`) cho toàn bộ số tiền mà khách vừa chuyển với lý do `AMOUNT_MISMATCH`.
2. **VietQR Động và Kỹ thuật Polling Trạng thái:**
   - Link `qrUrl` do SePay tạo động: khách chỉ cần mở ứng dụng ngân hàng và quét mã, hệ thống ngân hàng sẽ tự điền đúng số tiền và nội dung chuyển khoản (`paymentCode`).
   - Phía Frontend (Mobile hoặc Web): khi mở màn hình thanh toán hiển thị QR, FE nên thiết lập cơ chế polling gọi `GET /payments/{id}` mỗi 2 - 3 giây/lần.
   - Ngay khi `status === 'paid'`, màn hình thanh toán lập tức đóng và hiển thị màn hình chúc mừng / chuyển tiếp quy trình.
3. **Thứ tự Thanh toán Hợp đồng (T1.6):**
   - Hợp đồng tạo trực tiếp có 2 khoản tiền cần thanh toán:
     1. Tiền cọc hợp đồng (`CONTRACT_DEPOSIT`): Bắt buộc thanh toán trước.
     2. Tiền thuê kỳ đầu (`RENT_FIRST_PERIOD`): Chỉ được tạo sau khi tiền cọc đã được thanh toán (`depositPaidAt` có dữ liệu). Nếu cố tạo trước sẽ bị chặn bởi lỗi `MESSAGE_CODE_520`.
4. **Xác nhận Thanh toán Thủ công & Maker-Checker (T0.3):**
   - Nhân viên cơ sở hoặc Quản lý thực hiện tại quầy (`POST /payments/{id}/confirm-manual`).
   - Bắt buộc phải đính kèm đường link ảnh biên lai/chứng từ thực tế (`proofImageUrl`) đã upload lên hệ thống lưu trữ (Cloudinary/S3) và ghi chú (`note` tối thiểu 2 ký tự).
   - **Ràng buộc Maker-Checker:** Nhân viên đã xác nhận thanh toán thủ công cho đơn này sẽ **bị hệ thống từ chối** nếu sau này người đó cố duyệt/xác nhận hoàn cọc (`confirmRefund`) cho chính đơn đặt chỗ hoặc hợp đồng đó.
5. **Đối soát Giao dịch Ngân hàng Mồ côi (Reconciliation - T1.3):**
   - Trường hợp khách hàng tự gõ thông tin chuyển khoản và quên nhập mã thanh toán hoặc sai mã: giao dịch SePay sẽ rơi vào danh sách `UNMATCHED`.
   - Quản lý / Kế toán kiểm tra sao kê tại `GET /payments/transactions/unmatched` và dùng `POST /payments/transactions/{id}/assign` kèm `paymentCode` để gán vào đơn thanh toán tương ứng.
   - Khi gán thủ công, hệ thống kiểm tra số tiền chuyển phải khớp 100% với đơn thanh toán (`MESSAGE_CODE_518` nếu lệch số tiền).
6. **Thời gian Đệm Trễ mạng (Grace Period):**
   - Khi khách hàng quét mã vào những phút cuối cùng trước khi hết hạn: SePay ghi nhận `transactionDate` của ngân hàng. Hệ thống cấp thêm 2 phút đệm kỹ thuật (`lateGraceMinutes`). Nếu giao dịch ngân hàng nằm trong khoảng `expiresAt + 2 phút`, giao dịch vẫn được chấp nhận hợp lệ. Nếu vượt quá, giao dịch bị đánh dấu là `LATE` và tự động kích hoạt tạo `RefundRequest`.

---

## Hành vi UI/UX mong muốn (người dùng cung cấp)

- Làm mới (`invalidateQueries`) sau khi thành công:
  - Khi tạo đơn thanh toán thành công: làm mới query `['payments', id]`, `['reservations', reservationId]`, `['contracts', contractId]`.
  - Khi polling thấy `status === 'paid'`: invalidate query reservation/contract tương ứng để cập nhật trạng thái đơn hàng.
  - Khi xác nhận thủ công hoặc gán giao dịch: làm mới `['payments']`, `['unmatchedTransactions']`.
  - [Cần người dùng bổ sung cụ thể]
- Thông báo hoặc chuyển trang:
  - Sau khi quét mã thành công: hiển thị modal xác nhận thành công và tự động chuyển sang trang chi tiết hợp đồng / đơn đặt chỗ.
  - Sau khi xác nhận thanh toán thủ công tại quầy: hiển thị thông báo Toast thành công.
  - [Cần người dùng bổ sung cụ thể]
- Khóa dịch cần thêm vào `messages/{vi,en}.json` hoặc `locales/{vi,en}.json`: [Cần người dùng bổ sung]

---

## Thay đổi so với contract trước

1. **Bổ sung mục đích thanh toán mới (`RENT_FIRST_PERIOD` - T1.6):**
   - Thêm enum member `PaymentPurposeEnum.RENT_FIRST_PERIOD = 'rent_first_period'` để thu tiền thuê kỳ đầu cho hợp đồng thuê trước ngày nhận kho.
   - Thêm mã lỗi `MESSAGE_CODE_519`, `MESSAGE_CODE_520`, `MESSAGE_CODE_521` kiểm soát thứ tự đóng cọc trước - đóng tiền thuê sau.
2. **Triển khai nguyên tắc Thanh toán Một lần Duy nhất (Single Payment Invariant - T1.8):**
   - Đánh dấu `@deprecated` các trạng thái `PaymentStatusEnum.PARTIALLY_PAID` và `PaymentTransactionResultEnum.PARTIALLY_MATCHED`.
   - Loại bỏ khái niệm thanh toán thiếu và cộng dồn; mọi thanh toán sai số tiền đều giữ nguyên đơn pending và tự động sinh yêu cầu hoàn tiền (`RefundRequest`).
3. **Thắt chặt Xác nhận Thanh toán Thủ công (Maker-Checker & Biên lai - T0.3):**
   - Schema `confirmManualPaymentSchema` bắt buộc có `proofImageUrl` (link ảnh biên lai) và `note` (min 2 ký tự).
   - Bổ sung mã lỗi `MESSAGE_CODE_509` nếu thiếu ảnh chứng từ.
4. **Bổ sung tính năng Đối soát Giao dịch Ngân hàng Mồ côi (Reconciliation - T1.3):**
   - Thêm 2 endpoint mới: `GET /payments/transactions/unmatched` và `POST /payments/transactions/{id}/assign`.
   - Thêm các schema đi kèm: `unmatchedTransactionQuerySchema`, `assignUnmatchedTransactionSchema`, `paymentTransactionIdParamSchema`.
   - Thêm mã lỗi `MESSAGE_CODE_510`, `MESSAGE_CODE_517`, `MESSAGE_CODE_518`.
