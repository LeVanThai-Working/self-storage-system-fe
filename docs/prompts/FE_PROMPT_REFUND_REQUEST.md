# MODULE: refundRequest

Bổ sung hợp đồng dữ liệu cho module này vào `packages/shared`. Phạm vi mặc định chỉ là `packages/shared` (enums, types, schemas, constants, utils); chỉ làm `apps/web` hoặc `apps/mobile` khi mục Phạm vi ghi rõ.
Nếu thiếu thông tin hoặc có mâu thuẫn, hỏi lại, không tự suy đoán.

## Phạm vi

- Nền tảng: Cả hai (Web cho Vận hành cơ sở, Kế toán và Quản trị; Mobile cho khách hàng xem lịch sử hoàn tiền) (suy ra từ role, cần xác nhận)
- Role và khu vực FE:
  - `customer`: Mobile (Customer App) — Xem danh sách & chi tiết các yêu cầu hoàn tiền của mình; hủy yêu cầu khi còn chờ duyệt
  - `facility_staff`: Web `/facility-staff/*` — Tạo yêu cầu hoàn tiền thủ công (Maker), xem danh sách thuộc cơ sở
  - `facility_manager`: Web `/facility-manager/*` — Duyệt yêu cầu hoàn tiền (`<= 10M VND`), từ chối, xác nhận đã chi trả tiền (`confirm-paid`), xem danh sách thuộc cơ sở
  - `business_ops_manager`: Web `/business-ops/*` — Phê duyệt các yêu cầu hoàn tiền lớn vượt ngưỡng (`> 10M VND`), giám sát hàng đợi hoàn tiền toàn hệ thống
  - `system_admin`: Web `/system-admin/*` — Toàn quyền kiểm soát và quản trị
- Vị trí hiển thị trên UI: [Cần người dùng bổ sung]

## Mô tả

Quản lý tập trung mọi luồng tiền hoàn (Refund) trong hệ thống tự động và thủ công:

1. Nguồn hoàn tiền đa dạng: Khách hủy đơn đặt chỗ trước hạn, Cơ sở từ chối đơn hoặc không bàn giao được kho (`FACILITY_FAULT`), Chuyển khoản thiếu hoặc thừa (`AMOUNT_MISMATCH`), Khách chuyển khoản muộn vào đơn đã hủy/hết hạn (`LATE_PAYMENT`), và Quyết toán cọc dư sau khi thanh lý hợp đồng (`DEPOSIT_SETTLEMENT`).
2. Quy trình phê duyệt & chi trả chặt chẽ: `PENDING_APPROVAL` ➔ `APPROVED` ➔ `PAID` (Trạng thái `PAID` là bất biến, không thể sửa đổi hoặc hoàn tác).
3. Cơ chế kiểm soát rủi ro & gian lận tài chính:
   - **Maker-Checker**: Người tạo yêu cầu hoàn tiền tuyệt đối không được tự phê duyệt yêu cầu của chính mình (chặn 403 `MESSAGE_CODE_514`).
   - **Phân cấp phê duyệt (OPS Threshold)**: Quản lý cơ sở chỉ được duyệt các khoản $\le 10,000,000$ VND (`DEFAULT_OPS_APPROVAL_THRESHOLD`). Khoản hoàn tiền lớn hơn bắt buộc phải do Quản lý vận hành (`BUSINESS_OPS_MANAGER`) hoặc Quản trị viên (`SYSTEM_ADMIN`) duyệt.
   - **Bảo mật thông tin tài khoản ngân hàng**: Thông tin STK được mã hóa AES-256-GCM trong DB và luôn được che mặt nạ dạng `****1234` khi trả về FE theo Nghị định 13/2023/NĐ-CP.
   - **Bất biến tổng tiền (Invariant)**: Tổng số tiền hoàn hợp lệ cho một đơn hàng không được phép vượt quá số tiền thực tế khách đã đóng trừ đi các khoản tiền phạt/tịch thu hợp lệ (chặn 400 `MESSAGE_CODE_513`).

## Endpoints

| Method | Path                               | Mô tả                                               | Role                                                                           | Phân trang |
| :----- | :--------------------------------- | :-------------------------------------------------- | :----------------------------------------------------------------------------- | :--------- |
| POST   | /refund-requests                   | Tạo yêu cầu hoàn tiền mới (Maker)                   | facility_staff, facility_manager, business_ops_manager, system_admin, customer | —          |
| GET    | /refund-requests                   | Danh sách yêu cầu hoàn tiền có bộ lọc & phân trang  | customer, facility_staff, facility_manager, business_ops_manager, system_admin | Dạng 1     |
| GET    | /refund-requests/{id}              | Chi tiết yêu cầu hoàn tiền (STK đã che mặt nạ)      | customer, facility_staff, facility_manager, business_ops_manager, system_admin | —          |
| POST   | /refund-requests/{id}/approve      | Quản lý phê duyệt yêu cầu hoàn tiền (Checker)       | facility_manager, business_ops_manager, system_admin                           | —          |
| POST   | /refund-requests/{id}/reject       | Quản lý từ chối yêu cầu hoàn tiền                   | facility_manager, business_ops_manager, system_admin                           | —          |
| POST   | /refund-requests/{id}/confirm-paid | Kế toán/Quản lý xác nhận đã chuyển khoản thành công | facility_staff, facility_manager, business_ops_manager, system_admin           | —          |
| POST   | /refund-requests/{id}/cancel       | Người tạo hủy yêu cầu hoàn tiền khi còn chờ duyệt   | customer, facility_staff, facility_manager, business_ops_manager, system_admin | —          |

Query cho API danh sách (`GET /refund-requests`):

- `sortBy` cho phép: `amount`, `createdAt`, `status`, mặc định: `createdAt`
- `sortOrder`: `asc` | `desc`, mặc định: `desc`
- Các bộ lọc query khác: `page` (default: 1), `limit` (default: 10, max: 100), `facilityId`, `customerId`, `reservationId`, `contractId`, `status`, `reason`.

## Request schema (giữ nguyên, thêm vào `packages/shared/src/schemas/request/`)

Thư viện validate: Zod `^4.6.5` (BE dùng Zod v4, tương thích trực tiếp với FE).

### `src/modules/refundRequest/schemas/refundRequest.request.schema.ts`

```ts
import { z } from "zod";
import { paginationQuerySchema } from "../../../common/schemas/pagination.schema.ts";
import {
  RefundRequestReasonEnum,
  RefundRequestStatusEnum,
} from "../../../common/enums/refundRequest.enum.ts";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const refundRequestIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid refund request ID format"),
});

export const createRefundRequestSchema = z
  .object({
    reservationId: z.string().regex(objectIdRegex).optional(),
    contractId: z.string().regex(objectIdRegex).optional(),
    paymentId: z.string().regex(objectIdRegex).optional(),
    facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format"),
    customerId: z.string().regex(objectIdRegex, "Invalid customer ID format"),
    amount: z.number().int().positive("Refund amount must be a positive integer"),
    reason: z.nativeEnum(RefundRequestReasonEnum),
    refundBankName: z.string().max(100).optional(),
    refundAccountNumber: z.string().min(4).max(30).optional(),
    refundAccountHolder: z.string().max(100).optional(),
    note: z.string().max(1000).optional(),
  })
  .refine((data) => !!data.reservationId || !!data.contractId, {
    message: "Either reservationId or contractId must be provided",
  });

export const approveRefundRequestSchema = z.object({
  note: z.string().max(1000).optional(),
});

export const rejectRefundRequestSchema = z.object({
  rejectionReason: z.string().min(3, "Rejection reason must be at least 3 characters").max(500),
});

export const confirmPaidRefundSchema = z.object({
  referenceCode: z.string().min(3, "Bank reference code is required for paid refunds").max(100),
  proofImageUrl: z.string().url("Proof image URL must be a valid URL").optional(),
  note: z.string().max(1000).optional(),
});

export const cancelRefundRequestSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(500),
});

export const refundRequestQuerySchema = paginationQuerySchema.extend({
  facilityId: z.string().regex(objectIdRegex).optional(),
  customerId: z.string().regex(objectIdRegex).optional(),
  reservationId: z.string().regex(objectIdRegex).optional(),
  contractId: z.string().regex(objectIdRegex).optional(),
  status: z.nativeEnum(RefundRequestStatusEnum).optional(),
  reason: z.nativeEnum(RefundRequestReasonEnum).optional(),
  sortBy: z.enum(["amount", "createdAt", "status"]).default("createdAt"),
});

export type CreateRefundRequest = z.infer<typeof createRefundRequestSchema>;
export type ApproveRefundRequest = z.infer<typeof approveRefundRequestSchema>;
export type RejectRefundRequest = z.infer<typeof rejectRefundRequestSchema>;
export type ConfirmPaidRefund = z.infer<typeof confirmPaidRefundSchema>;
export type CancelRefundRequest = z.infer<typeof cancelRefundRequestSchema>;
export type RefundRequestQuery = z.infer<typeof refundRequestQuerySchema>;
export type RefundRequestIdParam = z.infer<typeof refundRequestIdParamSchema>;
```

## Response (hình dạng dữ liệu, cập nhật `packages/shared/src/types/`)

Mọi API trả về bọc chuẩn `ApiResponse<T>`.

### Dạng phân trang cho danh sách (`GET /refund-requests`): Dạng 1

- `response.data.data` là `{ items: RefundRequestResponse[], pagination: PaginationMeta }`

### `RefundRequestResponse` (File BE: `src/modules/refundRequest/schemas/refundRequest.response.schema.ts`)

```ts
export interface EntitySummary {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface RefundRequestResponse {
  id: string;
  refundCode: string;
  reservationId: string | null;
  contractId: string | null;
  paymentId: string | null;
  facility: EntitySummary | string;
  customer: EntitySummary | string;
  amount: number;
  reason:
    | "customer_cancel"
    | "facility_cancel"
    | "system_cancel"
    | "late_payment"
    | "amount_mismatch"
    | "deposit_settlement"
    | "facility_fault";
  status: "pending_approval" | "approved" | "paid" | "rejected" | "cancelled";

  // Dữ liệu ngân hàng bảo mật (Luôn được che mặt nạ khi trả về)
  refundBankName: string | null;
  refundAccountNumberMasked: string | null;
  refundAccountHolder: string | null;

  // Đối soát & chứng từ
  referenceCode: string | null;
  proofImageUrl: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  note: string | null;

  // Người thực hiện & Dấu thời gian
  requestedBy: EntitySummary | string;
  requestedAt: string;
  approvedBy: (EntitySummary | string) | null;
  approvedAt: string | null;
  rejectedBy: (EntitySummary | string) | null;
  rejectedAt: string | null;
  paidBy: (EntitySummary | string) | null;
  paidAt: string | null;
  cancelledBy: (EntitySummary | string) | null;
  cancelledAt: string | null;

  createdAt: string;
  updatedAt: string;
}
```

- **Trường tham chiếu:** `reservationId`, `contractId`, `paymentId` là chuỗi hex ObjectId (24 ký tự) hoặc `null`. Các trường `facility`, `customer`, `requestedBy`, `approvedBy`, `paidBy` trả về object tóm tắt `EntitySummary` gồm `{ id, name, email, role }`.
- **Kiểu serialize:**
  - Tiền tệ (`amount`): số nguyên VND (`number`).
  - Ngày giờ (`requestedAt`, `approvedAt`, `paidAt`, `createdAt`, `updatedAt`...): chuỗi ISO 8601 (`string`).

## Enums (cập nhật `packages/shared/src/enums/`)

### `RefundRequestStatusEnum` (File BE: `src/common/enums/refundRequest.enum.ts`)

```ts
export enum RefundRequestStatusEnum {
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  PAID = "paid",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}
```

### `RefundRequestReasonEnum` (File BE: `src/common/enums/refundRequest.enum.ts`)

```ts
export enum RefundRequestReasonEnum {
  CUSTOMER_CANCEL = "customer_cancel",
  FACILITY_CANCEL = "facility_cancel",
  SYSTEM_CANCEL = "system_cancel",
  LATE_PAYMENT = "late_payment",
  AMOUNT_MISMATCH = "amount_mismatch",
  DEPOSIT_SETTLEMENT = "deposit_settlement",
  FACILITY_FAULT = "facility_fault",
}
```

## Ma trận hành động theo trạng thái

| Hành động                                  | Trạng thái cho phép | Role được phép                                                         | Ghi chú / Điều kiện nghiệp vụ                                                                                                                   |
| :----------------------------------------- | :------------------ | :--------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tạo yêu cầu hoàn tiền**                  | —                   | Khách, Staff, Manager, Ops, Admin, System                              | Yêu cầu phải liên kết `reservationId` hoặc `contractId`.                                                                                        |
| **Phê duyệt yêu cầu** (`approve`)          | `pending_approval`  | `facility_manager` ($\le 10M$), `business_ops_manager`, `system_admin` | Áp dụng Maker-Checker: người duyệt phải khác người tạo. Khoản tiền $> 10M$ bắt buộc Ops/Admin duyệt.                                            |
| **Từ chối yêu cầu** (`reject`)             | `pending_approval`  | `facility_manager`, `business_ops_manager`, `system_admin`             | Bắt buộc nhập lý do từ chối `rejectionReason` tối thiểu 3 ký tự.                                                                                |
| **Xác nhận đã hoàn tiền** (`confirm-paid`) | `approved`          | `facility_staff`, `facility_manager`, Ops, Admin                       | Bắt buộc nhập mã tham chiếu giao dịch ngân hàng `referenceCode` $\ge 3$ ký tự, đính kèm ảnh chứng từ `proofImageUrl`. Sau khi PAID là bất biến. |
| **Hủy yêu cầu hoàn tiền** (`cancel`)       | `pending_approval`  | Người tạo yêu cầu (`requestedBy`)                                      | Bắt buộc nhập lý do hủy `cancellationReason`. Chỉ hủy được khi chưa duyệt.                                                                      |

## Error codes và thông báo (cập nhật `MESSAGE_CODE`, `MESSAGE_DICTIONARY_EN/VI`, `ENTITY_SUBJECT_DICTIONARY`)

| Message Code       | HTTP | Mẫu EN                                         | Mẫu VI (đề xuất, cần xác nhận)                                                         | Chủ thể `{0}`  |
| :----------------- | :--- | :--------------------------------------------- | :------------------------------------------------------------------------------------- | :------------- |
| `MESSAGE_CODE_121` | 403  | Insufficient Permissions                       | Bạn không có quyền thực hiện hành động này (vượt quá hạn mức phê duyệt 10,000,000 VND) | Role           |
| `MESSAGE_CODE_122` | 403  | Facility Access Denied                         | Bạn không có quyền thao tác trên yêu cầu hoàn tiền thuộc cơ sở khác                    | Facility       |
| `MESSAGE_CODE_511` | 404  | Refund Request Not Found                       | Không tìm thấy yêu cầu hoàn tiền                                                       | Refund Request |
| `MESSAGE_CODE_512` | 400  | Invalid Refund Request Status Transition       | Chuyển đổi trạng thái yêu cầu hoàn tiền không hợp lệ                                   | Refund Request |
| `MESSAGE_CODE_513` | 400  | Total Refund Amount Exceeds Net Settled Amount | Tổng số tiền hoàn vượt quá số tiền thực tế khách đã đóng trừ tiền phạt                 | Amount         |
| `MESSAGE_CODE_514` | 403  | Refund Approver Cannot Be Requester            | Người phê duyệt không thể là người tạo yêu cầu hoàn tiền (Vi phạm Maker-Checker)       | Approver       |
| `MESSAGE_CODE_515` | 400  | Reference Code Is Required For Paid Refund     | Bắt buộc nhập mã tham chiếu giao dịch ngân hàng khi xác nhận đã chuyển tiền            | Reference Code |
| `MESSAGE_CODE_516` | 400  | Paid Refund Cannot Be Modified                 | Yêu cầu hoàn tiền đã hoàn tất chi trả (PAID) không thể chỉnh sửa hay hủy bỏ            | Refund Request |

## Constants

| Tên Constant             | Giá trị      | Ý nghĩa                                                                     |
| :----------------------- | :----------- | :-------------------------------------------------------------------------- |
| `OPS_APPROVAL_THRESHOLD` | `10_000_000` | Ngưỡng số tiền hoàn tiền (VND) bắt buộc Quản lý vận hành (Ops) phê duyệt    |
| `ESTIMATED_SLA_DAYS`     | `3`          | Số ngày làm việc cam kết xử lý hoàn tiền hiển thị trên giao diện khách hàng |

## Quy tắc validate/nghiệp vụ bổ sung (không nằm trong schema)

1. **Maker-Checker khi duyệt hoàn tiền**:
   - Nhân viên hoặc Quản lý đã khởi tạo đơn hoàn tiền (`requestedBy`) không được phép bấm nút Duyệt (`POST /{id}/approve`).
   - Nếu cùng một người cố tình duyệt yêu cầu của mình, Backend ném lỗi 403 `MESSAGE_CODE_514`. FE cần ẩn hoặc disable nút "Duyệt" đối với các yêu cầu do chính tài khoản đang đăng nhập tạo ra.
2. **Kiểm soát hạn mức duyệt (OPS Threshold)**:
   - Quản lý cơ sở (`facility_manager`) chỉ có quyền duyệt các khoản tiền hoàn $\le 10,000,000$ VND.
   - Đối với các khoản $> 10,000,000$ VND, nút "Duyệt" trên Web của Quản lý cơ sở cần hiển thị badge: "Cần Quản lý vận hành (Ops) phê duyệt". Nếu Quản lý cơ sở gọi API, Backend sẽ chặn lỗi 403 `MESSAGE_CODE_121`.
3. **Tính bất biến của trạng thái `PAID`**:
   - Khi đã chi trả tiền (`confirm-paid`), yêu cầu hoàn tiền chuyển sang `PAID` và bị khóa cứng vĩnh viễn (`PAID` là terminal state). Mọi nỗ lực chỉnh sửa, duyệt lại hay hủy đều bị từ chối 400 `MESSAGE_CODE_516`.
4. **Hiển thị số tài khoản ngân hàng**:
   - Backend không bao giờ trả về số tài khoản đầy đủ ra API nhằm tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
   - Trường `refundAccountNumberMasked` luôn có định dạng che mặt nạ (ví dụ: `****6789`). FE hiển thị trực tiếp chuỗi này lên giao diện xác nhận.
5. **Hiển thị SLA dự kiến**:
   - Trên màn hình chi tiết hoàn tiền của Khách hàng (Mobile App), hiển thị thông điệp cam kết xử lý: "Thời gian hoàn tiền dự kiến trong vòng 3 ngày làm việc kể từ khi yêu cầu được phê duyệt".

## Hành vi UI/UX mong muốn (người dùng cung cấp)

- Làm mới (`invalidateQueries`) sau khi thành công: [Cần người dùng bổ sung]
- Thông báo hoặc chuyển trang: [Cần người dùng bổ sung]
- Khóa dịch cần thêm vào `messages/{vi,en}.json` hoặc `locales/{vi,en}.json`: [Cần người dùng bổ sung]

## Thay đổi so với contract trước

- **Module mới hoàn toàn**: Được thiết kế và xây dựng trong Phase 1 (T1.1..T1.4) nhằm thống nhất toàn bộ các nguồn hoàn tiền rải rác về một thực thể độc lập duy nhất có kiểm soát phân quyền và đối soát ngân hàng.
- Trước đây: Tiền hoàn chỉ được lưu dưới dạng cờ dẫn xuất `refundAmount` và `refundStatus` trên đơn đặt chỗ.
- Hiện tại: Mọi nghiệp vụ hủy đơn, chuyển thừa, chuyển muộn, cọc dư sau check-out đều tự động tạo một bản ghi `RefundRequest` tương ứng. (Các trường `refundAmount` và `refundStatus` cũ trên `Reservation` và `Contract` vẫn được Backend duy trì đồng bộ để đảm bảo tương thích ngược).
