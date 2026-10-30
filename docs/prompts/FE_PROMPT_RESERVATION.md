# MODULE: reservation & Luồng Đặt chỗ End-to-End (Tích hợp: payment, contract, refundRequest, storageUnit, facilityTimeSlot)

Bổ sung hợp đồng dữ liệu cho module `reservation` và toàn bộ các module kết hợp trong luồng đặt kho tự quản vào `packages/shared`. Phạm vi mặc định là `packages/shared` (enums, types, schemas, constants, utils); chỉ làm `apps/web` hoặc `apps/mobile` khi mục Phạm vi ghi rõ.
Nếu thiếu thông tin hoặc có mâu thuẫn, hỏi lại, không tự suy đoán.

---

## Phạm vi

- **Nền tảng:** Cả hai (Mobile cho Khách hàng; Web cho Nhân viên cơ sở, Quản lý cơ sở, Quản lý vận hành và Quản trị viên).
- **Phân công Role & Khu vực Frontend:**

| Role                   | Nền tảng / Khu vực FE     | Trách nhiệm chính trong luồng Đặt chỗ                                                                                                                                                                                                  |
| :--------------------- | :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customer`             | Mobile (Customer App)     | Tra cứu kho trống, đặt giữ chỗ 15 phút, quét VietQR đóng cọc, phản hồi đổi kho, hủy đơn, ký hợp đồng điện tử khi check-in, theo dõi hoàn cọc.                                                                                          |
| `facility_staff`       | Web `/facility-staff/*`   | Xem danh sách đơn cơ sở, xác nhận thu cọc trực tiếp tại quầy, xác nhận đơn & tiếp nhận phân công đón tiếp, ghi nhận khách đến (`mark-arrived`), lập hợp đồng nháp check-in, hủy bản nháp sai (`VOID`).                                 |
| `facility_manager`     | Web `/facility-manager/*` | Toàn bộ quyền của Staff + Gia hạn ân hạn (`extend-grace`), xử lý đổi kho sự cố (`reassign-unit`), hủy khẩn cấp kho hư hỏng (`force-cancel`), ký nhận kho check-in kích hoạt hợp đồng & hoàn tất reservation, duyệt & chi trả hoàn cọc. |
| `business_ops_manager` | Web `/business-ops/*`     | Giám sát đơn đặt chỗ toàn chuỗi, kích hoạt tiến trình quét No-show / quá hạn, phê duyệt hoàn cọc vượt hạn mức cơ sở (> 10M VND), xử lý sự cố diện rộng.                                                                                |
| `system_admin`         | Web `/system-admin/*`     | Toàn quyền kiểm soát hệ thống, cấu hình tham số chính sách cọc & thời gian ân hạn, đối soát tài chính liên module.                                                                                                                     |

- **Vị trí hiển thị trên UI:** [Cần người dùng bổ sung]

---

## Mô tả & Bản đồ luồng nghiệp vụ End-to-End qua 7 Giai đoạn

Vòng đời đặt chỗ kho tự quản là một chuỗi phối hợp chặt chẽ giữa 5 module: **Discovery/StorageUnit ➔ Reservation ➔ Payment (VietQR/SePay) ➔ Contract (Check-in/Signing) ➔ RefundRequest**.

```
[Khách tìm kho & Ca hẹn] ──(1) POST /reservations──> [PENDING_PAYMENT] (Khóa kho & Tiện ích 15 phút)
                                                               │
                           ┌───────────────────────────────────┴───────────────────────────────────┐
                  (Khách thanh toán cọc)                                                  (Hết 15 phút / Chưa thanh toán)
                           │                                                                       │
           [POST /payments -> VietQR / Quầy]                                            [Cron / Job quét hết hạn]
                           │                                                                       │
                   [PAYMENT_SUCCESSFUL]                                                        [EXPIRED]
                           │                                                            (Mở kho & hoàn tiện ích)
            (Cơ sở xác nhận & Gán Staff)
                           │
             [POST /reservations/:id/confirm]
                           │
                      [CONFIRMED] ──────────────────────────┐
                           │                                │
            (Quá ngày hẹn check-in)                         │
                           │                                │
                   (Ân hạn thêm 24h)                        │
                           │                                │
                       [OVERDUE]                            │
                           │                                │
        ┌──────────────────┴──────────────────┐             │
(Khách đến trong ân hạn)             (Quá ân hạn No-show)   │
        │                                     │             │
        │                             [Tịch thu 100% cọc]   │
        │                             [Hủy đơn CANCELLED]   │
        │                                                   │
        └──────────────────────────┬────────────────────────┘
                                   │
              (Đón tiếp khách tại cơ sở: POST /mark-arrived)
                                   │
            (Nhân viên lập Hợp đồng nháp: POST /contracts)
                                   │
             (Khách ký hợp đồng trên Mobile: POST /customer-sign)
                                   │
         (Quản lý ký check-in bàn giao kho: POST /contracts/:id/check-in)
                                   │
                                   ▼
                             [COMPLETED]
         (Hợp đồng ACTIVE, Kho OCCUPIED, Hoàn tất chu trình đặt chỗ)
```

1. **Giai đoạn 1 — Tra cứu & Đặt giữ chỗ 15 phút (POST /reservations):** Khách chọn phòng kho vật lý, gói giá, tiện ích và ca hẹn check-in. Hệ thống dùng Atomic Lock chuyển kho sang `RESERVED`, trừ tồn kho tiện ích, thiết lập `expiresAt = now + 15 phút` và ném cảnh báo `immediateForfeitWarning` nếu đặt sát 24h.
2. **Giai đoạn 2 — Đóng cọc (Payment - Single Payment Invariant):** Tạo đơn thanh toán lấy VietQR động SePay hoặc nộp tiền mặt tại quầy (`confirm-manual`). Thanh toán đủ 100% cọc ➔ `PAYMENT_SUCCESSFUL`. Chuyển thiếu hoặc chuyển muộn khi đơn đã hủy ➔ ghi nhận `LATE_PAYMENT` và tự động đẩy sang hoàn tiền.
3. **Giai đoạn 3 — Xác nhận đơn & Phân công đón tiếp (POST /confirm):** Staff/Manager xác nhận đơn trước ngày hẹn, gán `assignedStaffId` ➔ `CONFIRMED`.
4. **Giai đoạn 4 — Quản lý biến động trước Check-in:**
   - **Đổi kho sự cố (`reassign-unit`):** Manager đổi sang kho ngang hạng hoặc nâng hạng miễn phí/có thỏa thuận. Khách đồng ý qua app (`respond-reassign: accept`) hoặc từ chối (`reject`) ➔ hủy do lỗi cơ sở, hoàn 100% cọc.
   - **Khách hủy đơn (`cancel`):** Hủy trước $\ge 24h$ hoàn 100% cọc; hủy sát giờ $< 24h$ hoặc đang `OVERDUE` mất 100% cọc.
   - **Cơ sở hủy khẩn cấp (`force-cancel`):** Kho bị sự cố (cháy nổ, ngập lụt), bắt buộc đính kèm biên bản sự cố, hoàn 100% cọc cho khách.
   - **Gia hạn ân hạn (`extend-grace`):** Cho phép Manager gia hạn thêm 1–72h nếu khách có lý do chính đáng.
5. **Giai đoạn 5 — Check-in & Thủ tục Hợp đồng:**
   - Nhân viên bấm **"Khách đã đến"** (`POST /mark-arrived`) ➔ ghi `arrivedAt = now`, miễn nhiễm hoàn toàn với cron No-show.
   - Lập Hợp đồng thuê nháp (`POST /contracts` nguồn `RESERVATION`).
   - Khách ký trước trên App (`customer-sign`).
   - Quản lý kiểm tra bàn giao thực tế và ký check-in (`check-in`) ➔ Hợp đồng `ACTIVE`, Kho `OCCUPIED`, Reservation chuyển thành công sang `COMPLETED`.
   - Nếu nháp sai thông tin, Staff bấm `VOID` hợp đồng nháp mà không làm ảnh hưởng đến đơn đặt chỗ.
6. **Giai đoạn 6 — Xử lý quá hạn & No-show:** Quá ngày hẹn chuyển `OVERDUE` (ân hạn 24h). Quá ân hạn mà `arrivedAt == null` ➔ hệ thống tự động hủy đơn, tịch thu 100% tiền cọc (`forfeitedAmount = depositAmount`).
7. **Giai đoạn 7 — Hoàn tiền cọc (RefundRequest & Maker-Checker):** Mọi khoản hoàn cọc chuyển sang `refundStatus = PENDING`, quản lý duyệt và giải ngân độc lập (người duyệt khác người thu cọc).

---

## Endpoints Toàn Luồng

### 1. Tra cứu & Chọn kho (Discovery)

| Method | Path                                                 | Mô tả                                         | Role                     | Phân trang |
| :----- | :--------------------------------------------------- | :-------------------------------------------- | :----------------------- | :--------- |
| GET    | /facilities                                          | Danh sách chi nhánh cơ sở kho                 | Public / Customer, Staff | Dạng 1     |
| GET    | /facility-unit-type-offerings                        | Danh sách bảng giá & loại kho của cơ sở       | Public / Customer, Staff | Dạng 1     |
| GET    | /facility-amenity-offerings                          | Danh sách tiện ích cho thuê kèm tại cơ sở     | Public / Customer, Staff | Dạng 1     |
| GET    | /facility-time-slots/facility/{facilityId}/available | Lấy các ca hẹn check-in còn trống trong ngày  | Public / Customer, Staff | —          |
| GET    | /storage-units/facility/{facilityId}/available       | Danh sách phòng kho vật lý đang trống         | Public / Customer, Staff | —          |
| GET    | /storage-units/facility/{facilityId}/map-layout      | Sơ đồ mặt bằng 2D toàn bộ phòng kho tại cơ sở | Customer, Staff, Manager | —          |

### 2. Vòng đời đơn Đặt chỗ (Core Reservation)

| Method | Path                                | Mô tả                                                | Role                                                                           | Phân trang |
| :----- | :---------------------------------- | :--------------------------------------------------- | :----------------------------------------------------------------------------- | :--------- |
| POST   | /reservations                       | Tạo đơn đặt giữ chỗ kho mới (khóa 15 phút)           | customer                                                                       | —          |
| GET    | /reservations                       | Danh sách đơn đặt chỗ có bộ lọc theo vai trò & cơ sở | customer, facility_staff, facility_manager, business_ops_manager, system_admin | Dạng 1     |
| GET    | /reservations/{id}                  | Chi tiết đơn đặt chỗ kèm snapshot giá & chính sách   | customer, facility_staff, facility_manager, business_ops_manager, system_admin | —          |
| POST   | /reservations/{id}/confirm          | Xác nhận đơn sau thanh toán & phân công nhân viên    | facility_staff, facility_manager, business_ops_manager, system_admin           | —          |
| POST   | /reservations/{id}/assign-staff     | Đổi nhân viên đón tiếp phụ trách đơn                 | facility_manager, business_ops_manager, system_admin                           | —          |
| POST   | /reservations/{id}/mark-arrived     | Ghi nhận khách đã đến cơ sở (chống hủy No-show)      | facility_staff, facility_manager, business_ops_manager, system_admin           | —          |
| POST   | /reservations/{id}/extend-grace     | Gia hạn thời gian ân hạn nhận kho (1–72 giờ)         | facility_manager, business_ops_manager, system_admin                           | —          |
| POST   | /reservations/{id}/reassign-unit    | Đổi kho hoặc gửi đề xuất đổi kho 2 bước              | facility_manager, business_ops_manager, system_admin                           | —          |
| POST   | /reservations/{id}/respond-reassign | Khách phản hồi chấp thuận / từ chối đổi kho          | customer (hoặc Staff thay mặt)                                                 | —          |
| POST   | /reservations/{id}/cancel           | Hủy đơn đặt chỗ (áp dụng phạt cọc 2 bậc)             | customer (chủ đơn), facility_manager                                           | —          |
| POST   | /reservations/{id}/force-cancel     | Hủy khẩn cấp do sự cố kho (hoàn 100% cọc)            | facility_manager, business_ops_manager, system_admin                           | —          |
| POST   | /reservations/{id}/confirm-refund   | Quản lý xác nhận đã hoàn cọc (Maker-Checker)         | facility_manager, business_ops_manager, system_admin                           | —          |
| POST   | /reservations/process-expired       | Quét xử lý đơn hết hạn giữ chỗ (15 phút)             | business_ops_manager, system_admin                                             | —          |
| POST   | /reservations/process-overdue       | Quét đơn trễ hẹn (OVERDUE) và đơn bỏ hẹn (No-show)   | business_ops_manager, system_admin                                             | —          |

Query cho API danh sách (`GET /reservations`):

- `sortBy` cho phép: `createdAt`, `startDate`, `checkInDate`, `totalAmount`, `updatedAt`, mặc định: `createdAt`
- `sortOrder`: `asc` | `desc`, mặc định: `desc`
- Các bộ lọc: `page`, `limit`, `customerId`, `facilityId`, `facilityUnitTypeOfferingId`, `storageUnitId`, `status`, `refundStatus`, `reservationCode`, `startDateFrom`, `startDateTo`, `checkInDateFrom`, `checkInDateTo`.

### 3. Thanh toán tiền cọc (Payment & VietQR)

| Method | Path                          | Mô tả                                          | Role                                       | Phân trang |
| :----- | :---------------------------- | :--------------------------------------------- | :----------------------------------------- | :--------- |
| POST   | /payments                     | Tạo đơn thanh toán cọc giữ chỗ lấy VietQR động | customer, facility_staff, facility_manager | —          |
| GET    | /payments/{id}                | Polling trạng thái thanh toán & lấy lại mã QR  | customer, facility_staff, facility_manager | —          |
| POST   | /payments/{id}/confirm-manual | Xác nhận thu cọc trực tiếp tại quầy (tiền mặt) | facility_staff, facility_manager           | —          |
| POST   | /payments/{id}/cancel         | Hủy yêu cầu thanh toán khi còn pending         | customer, facility_staff, facility_manager | —          |

### 4. Thủ tục Check-in & Ký Hợp đồng (Contract Integration)

| Method | Path                          | Mô tả                                               | Role                             | Phân trang |
| :----- | :---------------------------- | :-------------------------------------------------- | :------------------------------- | :--------- |
| POST   | /contracts                    | Lập Hợp đồng nháp DRAFT từ đơn Reservation          | facility_staff, facility_manager | —          |
| POST   | /contracts/{id}/customer-sign | Khách ký hợp đồng trên Mobile App (Bước 1)          | customer (chủ đơn)               | —          |
| POST   | /contracts/{id}/check-in      | Quản lý ký bàn giao kích hoạt ACTIVE & hoàn tất đơn | facility_manager, Ops, Admin     | —          |
| POST   | /contracts/{id}/cancel        | Hủy hợp đồng nháp (chọn `void` để tạo lại)          | facility_staff, facility_manager | —          |

### 5. Giải ngân hoàn tiền cọc (Refund Management)

| Method | Path                               | Mô tả                                               | Role                                         | Phân trang |
| :----- | :--------------------------------- | :-------------------------------------------------- | :------------------------------------------- | :--------- |
| GET    | /refund-requests                   | Danh sách yêu cầu hoàn tiền theo cơ sở & khách      | customer, Staff, Manager, Ops, Admin         | Dạng 1     |
| GET    | /refund-requests/{id}              | Chi tiết yêu cầu hoàn tiền (STK đã che mặt nạ)      | customer, Staff, Manager, Ops, Admin         | —          |
| POST   | /refund-requests/{id}/approve      | Quản lý phê duyệt yêu cầu hoàn cọc (Maker-Checker)  | facility_manager ($\le 10M$), Ops/Admin      | —          |
| POST   | /refund-requests/{id}/confirm-paid | Kế toán/Quản lý xác nhận đã chuyển khoản thành công | facility_staff, facility_manager, Ops, Admin | —          |

---

## Request Schemas (Thêm vào `packages/shared/src/schemas/request/`)

Thư viện validate: Zod `^4.6.5` (tương thích trực tiếp Zod v4 của FE).

### 1. Reservation Request Schemas (`src/modules/reservation/schemas/reservation.request.schema.ts`)

```ts
import { z } from "zod";
import { paginationQuerySchema } from "../../../common/schemas/pagination.schema.ts";
import { RefundStatusEnum, ReservationStatusEnum } from "../../../common/enums/reservation.enum.ts";
import { IncidentCategoryEnum } from "../../../common/enums/incident.enum.ts";

export const reservationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reservation ID format"),
});

export const reservationAmenityInputSchema = z.object({
  facilityAmenityOfferingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility amenity offering ID format"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const dateStringSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid date format (must be a valid ISO 8601 date string)",
});

export const createReservationSchema = z.object({
  facilityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format"),
  storageUnitId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format"),
  checkInDate: dateStringSchema,
  checkInTimeSlot: z.string().min(3).max(50).trim(),
  facilityUnitTypeOfferingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility unit type offering ID format")
    .optional(),
  startDate: dateStringSchema.optional(),
  rentalDuration: z.number().int().min(1, "Rental duration must be at least 1"),
  amenities: z.array(reservationAmenityInputSchema).optional().default([]),
  notes: z.string().max(1000).optional(),
  termsAccepted: z.boolean().optional(),
});

export const reassignStorageUnitSchema = z.object({
  newStorageUnitId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format"),
  reason: z.string().min(3).max(500),
  oldUnitStatus: z.enum(["under_maintenance", "available"]).default("under_maintenance").optional(),
  customerAgreed: z.boolean().optional().default(false),
});

export const respondUnitReassignSchema = z.object({
  action: z.enum(["accept", "reject"]),
  rejectReason: z.string().max(500).optional(),
});

export const confirmReservationSchema = z.object({
  assignedStaffId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid staff ID format"),
  notes: z.string().max(1000).optional(),
});

export const cancelReservationSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(500),
  refundBankName: z.string().min(2).max(100).optional(),
  refundAccountNumber: z
    .string()
    .regex(/^[0-9A-Za-z]{6,30}$/, "Invalid bank account number format")
    .optional(),
  refundAccountHolder: z.string().min(2).max(100).optional(),
});

export const assignReservationStaffSchema = z.object({
  staffId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid staff ID format"),
  notes: z.string().max(1000).optional(),
});

export const confirmRefundSchema = z.object({
  referenceCode: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const forceCancelReservationSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(10, "Reason must be at least 10 characters")
      .max(1000, "Reason cannot exceed 1000 characters"),
    incidentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid incident ID format")
      .optional(),
    incidentDetails: z
      .object({
        title: z
          .string()
          .trim()
          .min(3, "Title must be at least 3 characters")
          .max(200, "Title cannot exceed 200 characters"),
        category: z.nativeEnum(IncidentCategoryEnum).default(IncidentCategoryEnum.OTHER),
        description: z.string().trim().max(2000).optional(),
        images: z
          .array(z.string().url("Image must be a valid URL"))
          .min(1, "At least 1 evidence image is required"),
      })
      .optional(),
    refundBankName: z.string().trim().min(2).max(100).optional(),
    refundAccountNumber: z
      .string()
      .trim()
      .regex(/^[0-9A-Za-z]{6,30}$/, "Invalid bank account number format")
      .optional(),
    refundAccountHolder: z.string().trim().min(2).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.incidentId && !data.incidentDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Either incidentId (for existing incident) or incidentDetails (to create new incident) must be provided",
        path: ["incidentId"],
      });
    }
  });

export const extendGracePeriodSchema = z.object({
  extensionHours: z
    .number()
    .int("Extension hours must be an integer")
    .min(1, "Extension hours must be at least 1 hour")
    .max(72, "Extension hours cannot exceed 72 hours"),
  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason cannot exceed 500 characters"),
});

export const markCustomerArrivedSchema = z
  .object({
    notes: z.string().max(1000).optional(),
  })
  .optional()
  .default({});

export const reservationQuerySchema = paginationQuerySchema.extend({
  customerId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  facilityUnitTypeOfferingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  storageUnitId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  status: z.nativeEnum(ReservationStatusEnum).optional(),
  refundStatus: z.nativeEnum(RefundStatusEnum).optional(),
  reservationCode: z.string().optional(),
  startDateFrom: dateStringSchema.optional(),
  startDateTo: dateStringSchema.optional(),
  checkInDateFrom: dateStringSchema.optional(),
  checkInDateTo: dateStringSchema.optional(),
  sortBy: z
    .enum(["createdAt", "startDate", "checkInDate", "totalAmount", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateReservationRequest = z.infer<typeof createReservationSchema>;
export type ReassignStorageUnitRequest = z.infer<typeof reassignStorageUnitSchema>;
export type RespondUnitReassignRequest = z.infer<typeof respondUnitReassignSchema>;
export type ConfirmReservationRequest = z.infer<typeof confirmReservationSchema>;
export type CancelReservationRequest = z.infer<typeof cancelReservationSchema>;
export type AssignReservationStaffRequest = z.infer<typeof assignReservationStaffSchema>;
export type ConfirmRefundRequest = z.infer<typeof confirmRefundSchema>;
export type ForceCancelReservationRequest = z.infer<typeof forceCancelReservationSchema>;
export type ExtendGracePeriodRequest = z.infer<typeof extendGracePeriodSchema>;
export type MarkCustomerArrivedRequest = z.infer<typeof markCustomerArrivedSchema>;
export type ReservationQuery = z.infer<typeof reservationQuerySchema>;
export type ReservationIdParam = z.infer<typeof reservationIdParamSchema>;
```

### 2. Payment Request Schemas Cho Tiền Cọc (`src/modules/payment/schemas/payment.request.schema.ts`)

```ts
import { z } from "zod";
import { PaymentMethodEnum, PaymentPurposeEnum } from "../../../common/enums/payment.enum.ts";

export const createPaymentSchema = z.object({
  purpose: z.nativeEnum(PaymentPurposeEnum), // Dùng PaymentPurposeEnum.RESERVATION_DEPOSIT
  reservationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reservation ID format"),
  contractId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
});

export const confirmManualPaymentSchema = z.object({
  method: z
    .enum([PaymentMethodEnum.CASH, PaymentMethodEnum.BANK_TRANSFER])
    .default(PaymentMethodEnum.CASH),
  referenceCode: z.string().max(100).optional(),
  proofImageUrl: z.string().url("Proof image URL is required for manual payment verification"),
  note: z.string().min(2, "Note is required for manual payment verification").max(1000),
});
```

### 3. Contract Check-in Request Schemas (`src/modules/contract/schemas/contract.request.schema.ts`)

```ts
import { z } from "zod";
import {
  ContractSourceEnum,
  ContractCancellationTypeEnum,
} from "../../../common/enums/contract.enum.ts";

export const createContractFromReservationSchema = z.object({
  source: z.literal(ContractSourceEnum.RESERVATION),
  reservationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reservation ID format"),
  notes: z.string().max(1000).optional(),
});

export const cancelDraftContractSchema = z.object({
  cancellationType: z.nativeEnum(ContractCancellationTypeEnum), // 'void' để hủy nháp sai mà không hủy reservation; 'cancel' nếu khách đổi ý không thuê
  cancellationReason: z.string().min(3).max(500),
});
```

### 4. Discovery Lookup Query Schemas (Tra cứu Tiện ích, Ca hẹn, Gói giá & Kho)

```ts
export const availableTimeSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const availableStorageUnitQuerySchema = z.object({
  unitTypeId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  floor: z.coerce.number().int().optional(),
  zone: z.string().trim().optional(),
});

export const offeringQuerySchema = paginationQuerySchema.extend({
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format")
    .optional(),
  unitTypeId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid unit type ID format")
    .optional(),
  status: z.enum(["active", "inactive"]).optional(),
  billingUnit: z.enum(["day", "month", "year"]).optional(),
  sortBy: z.enum(["pricePerUnit", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const facilityAmenityOfferingQuerySchema = paginationQuerySchema.extend({
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format")
    .optional(),
  amenityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid amenity ID format")
    .optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
```

---

## Response Shapes (Cập nhật `packages/shared/src/types/`)

Mọi API Backend đều bọc dữ liệu chuẩn:

```ts
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  messageCode: string;
  message: string;
  data: T;
}
```

Phân trang cho danh sách đơn: **Dạng 1** (`response.data` chứa `{ items: T[], pagination: PaginationMeta }`).

### 1. `ReservationResponse` (File BE: `src/modules/reservation/schemas/reservation.response.schema.ts`)

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

export interface OfferingSnapshot {
  id: string;
  unitTypeId?: string | null;
  billingUnit: string;
  pricePerUnit: number;
  depositMultiplier?: number | null;
  minRentalDays?: number | null;
  status?: string | null;
}

export interface StorageUnitSnapshot {
  id: string;
  unitNumber: string;
  floor: number;
  zone?: string | null;
  status: string;
}

export interface ReservationPendingUnitChangeResponse {
  newStorageUnitId: string;
  newStorageUnit?: StorageUnitSnapshot | null;
  newFacilityUnitTypeOfferingId: string;
  newOffering?: OfferingSnapshot | null;
  newPricePerUnit: number;
  priceDifference?: number | null;
  reason: string;
  oldUnitStatus: string;
  proposedBy?: UserSnapshot | null;
  proposedAt: string;
}

export interface ReservationUnitChangeResponse {
  fromUnitId: string;
  toUnitId: string;
  fromUnit?: StorageUnitSnapshot | null;
  toUnit?: StorageUnitSnapshot | null;
  fromOfferingId?: string | null;
  toOfferingId?: string | null;
  fromPrice?: number | null;
  toPrice?: number | null;
  reason: string;
  status?: "pending" | "accepted" | "rejected" | null;
  proposedBy?: UserSnapshot | null;
  proposedAt?: string | null;
  decisionBy?: UserSnapshot | null;
  decisionAt?: string | null;
  rejectReason?: string | null;
  changedBy?: UserSnapshot | null;
  changedAt?: string | null;
}

export interface ReservationAmenityResponse {
  facilityAmenityOfferingId: string;
  amenityId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  billingUnit: "day" | "month";
  totalPrice: number;
}

export interface ReservationPolicySnapshotResponse {
  freeCancelHours: number;
  forfeitPercent: number;
  noShowGraceHours: number;
  cancellationMode?: "slot_start" | "calendar_day" | null;
}

export interface ReservationResponse {
  id: string;
  reservationCode: string;
  customerId: string;
  facilityId: string;
  facilityUnitTypeOfferingId: string;
  storageUnitId?: string | null;
  startDate: string;
  checkInDate: string;
  checkInTimeSlot: string;
  rentalDuration: number;
  billingUnit: "day" | "month";
  basePrice: number;
  depositAmount: number;
  amenities: ReservationAmenityResponse[];
  totalAmount: number;
  status:
    | "pending_payment"
    | "payment_successful"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "expired"
    | "overdue";
  expiresAt?: string | null;
  graceExpiresAt?: string | null;
  confirmedBy?: UserSnapshot | null;
  confirmedAt?: string | null;
  assignedStaffId?: string | null;
  assignedStaff?: UserSnapshot | null;
  assignedStaffAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: UserSnapshot | null;
  cancelledAt?: string | null;
  cancellationSource?: "customer" | "facility" | "system" | "facility_fault" | null;
  incidentId?: string | null;
  evidenceImages: string[];
  forceCancelledBy?: UserSnapshot | null;
  forceCancelledAt?: string | null;
  arrivedAt?: string | null;
  arrivedBy?: UserSnapshot | null;
  graceExtendedAt?: string | null;
  graceExtendedBy?: UserSnapshot | null;
  graceExtensionReason?: string | null;
  refundAmount: number;
  forfeitedAmount: number;
  refundStatus: "none" | "pending" | "refunded";
  refundedAt?: string | null;
  refundedBy?: UserSnapshot | null;
  refundReference?: string | null;
  refundNote?: string | null;
  paidAt?: string | null;
  paidAmount?: number | null;
  paymentId?: string | null;
  termsAccepted: boolean;
  policyVersion?: string | null;
  acceptedAt?: string | null;
  policySnapshot?: ReservationPolicySnapshotResponse | null;
  immediateForfeitWarning?: boolean | null;
  earlyCheckIn?: boolean | null;
  outOfSlot?: boolean | null;
  pendingUnitChange?: ReservationPendingUnitChangeResponse | null;
  unitChangeHistory: ReservationUnitChangeResponse[];
  notes?: string | null;
  customer?: UserSnapshot | null;
  facility?: FacilitySnapshot | null;
  offering?: OfferingSnapshot | null;
  storageUnit?: StorageUnitSnapshot | null;
  createdAt: string;
  updatedAt: string;
}
```

### 2. `PaymentResponse` Cho Tiền Cọc (`src/modules/payment/schemas/payment.response.schema.ts`)

```ts
export interface BankInfo {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface PaymentResponse {
  id: string;
  paymentCode: string;
  purpose: "reservation_deposit" | "contract_deposit" | "rent_first_period";
  reservationId?: string | null;
  contractId?: string | null;
  customerId: string;
  facilityId: string;
  amount: number;
  paidAmount: number;
  method: "cash" | "bank_transfer" | "qr_code";
  status: "pending" | "completed" | "failed" | "cancelled" | "partially_paid" | "late";
  qrUrl?: string | null; // Đường dẫn ảnh VietQR động đã nhúng sẵn số tiền và nội dung chuyển khoản
  bankInfo?: BankInfo | null;
  expiresAt?: string | null;
  paidAt?: string | null;
  referenceCode?: string | null;
  proofImageUrl?: string | null;
}
```

### 3. `AvailableTimeSlotItemResponse` Cho Đặt Lịch Check-in

```ts
export interface AvailableTimeSlotItemResponse {
  id: string;
  facilityId: string;
  slotName: string;
  startTime: string; // VD: "08:00"
  endTime: string; // VD: "10:00"
  maxCapacity: number;
  bookedCount: number;
  availableCapacity: number; // Sức chứa còn lại
  remainingCapacity?: number; // Alias tương thích
  isAvailable: boolean;
}
```

### 4. `FacilityUnitTypeOfferingResponse` & `FacilityAmenityOfferingResponse` (Gói giá & Tiện ích đi kèm)

```ts
export interface FacilityUnitTypeOfferingResponse {
  id: string;
  facility: {
    id: string;
    name: string;
    city: string;
    address: string;
    status: "active" | "inactive" | "under_maintenance";
  };
  unitType: {
    id: string;
    name: string;
    category?: "locker" | "closet" | "room" | "container" | "warehouse_rack" | null;
    area: number;
    volume: number;
    status: "active" | "inactive";
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  billingUnit: "day" | "month" | "year";
  pricePerUnit: number; // Đơn giá thuê cơ bản
  rackZonePricing?: {
    PRIME: number;
    STANDARD: number;
    ECONOMY: number;
  } | null;
  depositMultiplier: number; // Hệ số cọc (thường là 1)
  minRentalDays: number; // Số ngày thuê tối thiểu
  status: "active" | "inactive";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityAmenityOfferingResponse {
  id: string;
  facilityId: string;
  amenityId: string;
  amenity?: {
    id: string;
    name: string;
    type: "service" | "equipment" | "security" | "climate" | "logistics";
    description?: string | null;
    images?: string[];
  } | null;
  price: number;
  billingUnit: "per_use" | "per_day" | "per_month";
  totalQuantity: number;
  inUseQuantity: number;
  availableQuantity: number; // totalQuantity - inUseQuantity
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}
```

- **Quy tắc Serialize:**
  - Tiền tệ (`basePrice`, `depositAmount`, `totalAmount`, `refundAmount`, `forfeitedAmount`): số nguyên VND (`number`).
  - Ngày giờ: chuỗi ISO 8601 (`string`).
  - Trường liên kết ObjectId: trả về chuỗi hex 24 ký tự và kèm object snapshot đã populate (`customer`, `facility`, `storageUnit`, `offering`, `assignedStaff`).

---

## Enums (Cập nhật `packages/shared/src/enums/`)

### `ReservationStatusEnum` & Phụ trợ (`src/common/enums/reservation.enum.ts`)

```ts
export enum ReservationStatusEnum {
  PENDING_PAYMENT = "pending_payment",
  PAYMENT_SUCCESSFUL = "payment_successful",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  OVERDUE = "overdue",
}

export enum RefundStatusEnum {
  NONE = "none",
  PENDING = "pending",
  REFUNDED = "refunded",
}

export enum ReservationCancelSourceEnum {
  CUSTOMER = "customer",
  FACILITY = "facility",
  SYSTEM = "system",
  FACILITY_FAULT = "facility_fault",
}
```

### `PaymentEnums` (`src/common/enums/payment.enum.ts`)

```ts
export enum PaymentPurposeEnum {
  RESERVATION_DEPOSIT = "reservation_deposit",
  CONTRACT_DEPOSIT = "contract_deposit",
  RENT_FIRST_PERIOD = "rent_first_period",
}

export enum PaymentStatusEnum {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PARTIALLY_PAID = "partially_paid",
  LATE = "late",
}

export enum PaymentMethodEnum {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  QR_CODE = "qr_code",
}
```

### `ContractEnums` Liên quan Check-in (`src/common/enums/contract.enum.ts`)

```ts
export enum ContractSourceEnum {
  RESERVATION = "reservation",
  WALK_IN = "walk_in",
}

export enum ContractStatusEnum {
  DRAFT = "draft",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  TERMINATED = "terminated",
}

export enum ContractCancellationTypeEnum {
  VOID = "void", // Hủy bản nháp do nhân viên nhập sai; BẢO TOÀN reservation để tạo lại
  CANCEL = "cancel", // Khách đổi ý không thuê tại quầy; hủy luôn reservation và tính phạt cọc
}

export enum BillingUnitEnum {
  DAY = "day",
  MONTH = "month",
  YEAR = "year",
}

export enum FacilityUnitTypeOfferingStatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
```

---

## Ma trận Phân quyền & Hành động theo từng Role (Role-based E2E Matrix)

| Role                     | Màn hình / Khu vực                      | Hành động được phép thực hiện                                                                                                                                                                                                                                                                               | Ràng buộc bảo mật / Nghiệp vụ                                                                                                                            |
| :----------------------- | :-------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CUSTOMER**             | Mobile App                              | - Tạo đơn đặt chỗ (`POST /reservations`)<br>- Lấy mã QR & theo dõi thanh toán cọc<br>- Xem danh sách & chi tiết đơn của mình<br>- Phản hồi đề xuất đổi kho (`POST /respond-reassign`)<br>- Khách chủ động hủy đơn (`POST /cancel`)<br>- Ký hợp đồng nháp check-in (`POST /contracts/:id/customer-sign`)     | Chỉ xem và thao tác trên các đơn do chính tài khoản của mình tạo (`customerId === caller.userId`). Không được thao tác trên đơn người khác (chặn 403).   |
| **FACILITY_STAFF**       | Web Quầy giao dịch `/facility-staff/*`  | - Xác nhận thanh toán cọc tiền mặt tại quầy (`confirm-manual`)<br>- Xác nhận đơn & gán đón tiếp (`POST /confirm`)<br>- Ghi nhận khách đến (`POST /mark-arrived`)<br>- Lập hợp đồng nháp check-in (`POST /contracts`)<br>- Hủy bản nháp sai (`POST /contracts/:id/cancel` với `void`)                        | Chỉ được thao tác với các đơn thuộc cơ sở mà nhân viên được phân công công tác (`assertFacilityAccess`). Không được duyệt hoàn tiền hay đổi kho giá cao. |
| **FACILITY_MANAGER**     | Web Quản lý cơ sở `/facility-manager/*` | - Toàn quyền của Staff<br>- Đổi kho sự cố 2 bước (`POST /reassign-unit`)<br>- Gia hạn ân hạn nhận kho (`POST /extend-grace`)<br>- Hủy khẩn cấp sự cố phòng (`POST /force-cancel`)<br>- Ký bàn giao nhận kho check-in (`POST /contracts/:id/check-in`)<br>- Phê duyệt hoàn cọc $\le 10M$ VND (Maker-Checker) | Chỉ thao tác trong cơ sở của mình. Người duyệt hoàn tiền phải khác người xác nhận thu cọc ban đầu.                                                       |
| **BUSINESS_OPS_MANAGER** | Web Vận hành `/business-ops/*`          | - Giám sát đơn đặt chỗ toàn bộ các cơ sở<br>- Chạy quét tự động hết hạn 15m & No-show<br>- Phê duyệt hoàn tiền lớn $> 10,000,000$ VND<br>- Can thiệp xử lý tranh chấp và hủy khẩn cấp                                                                                                                       | Thao tác toàn hệ thống, chịu trách nhiệm rà soát kiểm soát rủi ro gian lận.                                                                              |
| **SYSTEM_ADMIN**         | Web Quản trị `/system-admin/*`          | - Toàn quyền cấu hình tham số chính sách (thời gian giữ chỗ, tỷ lệ hoàn cọc, ân hạn No-show)<br>- Chạy các tác vụ bảo trì hệ thống                                                                                                                                                                          | Toàn quyền kiểm soát và audit log hệ thống.                                                                                                              |

---

## Ma trận Hành động theo Trạng thái Đơn Đặt chỗ (State Machine)

| Hành động              | Trạng thái cho phép                                             | Role được phép                   | Ghi chú & Điều kiện nghiệp vụ                                                                                             |
| :--------------------- | :-------------------------------------------------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Đóng cọc VietQR**    | `pending_payment`                                               | `customer`                       | Quét mã VietQR SePay hoặc chuyển khoản trước khi `expiresAt` (15 phút).                                                   |
| **Thu cọc tiền mặt**   | `pending_payment`                                               | `facility_staff`, Manager        | Bắt buộc đính kèm ảnh biên lai giấy (`proofImageUrl`) và ghi chú.                                                         |
| **Xác nhận đơn**       | `payment_successful`                                            | Staff, Manager (cùng cơ sở)      | Chỉ xác nhận khi `checkInDate >= startOfDayVN(now)` và phân công nhân sự đón tiếp.                                        |
| **Ghi nhận khách đến** | `confirmed`, `overdue`                                          | Staff, Manager (cùng cơ sở)      | Ghi nhận `arrivedAt = now`. Đơn được **miễn nhiễm vĩnh viễn** khỏi cron hủy No-show.                                      |
| **Gia hạn ân hạn**     | `confirmed`, `overdue`                                          | Manager, Ops, Admin              | Gia hạn thêm từ 1 đến 72 giờ, bắt buộc nhập lý do giải trình.                                                             |
| **Đề xuất đổi kho**    | `payment_successful`, `confirmed`, `overdue`                    | Manager, Ops, Admin              | Kho mới phải cùng cơ sở, trống, đơn giá $\ge$ kho cũ. Khách đồng ý mới áp dụng giá mới.                                   |
| **Phản hồi đổi kho**   | Đơn có `pendingUnitChange`                                      | `customer` (hoặc Staff thay mặt) | `accept`: đổi kho & cập nhật giá; `reject`: hủy đơn lỗi cơ sở, hoàn 100% cọc.                                             |
| **Khách hủy đơn**      | `pending_payment`, `payment_successful`, `confirmed`, `overdue` | `customer` (chủ đơn)             | Trước giờ hẹn $\ge 24h$: hoàn 100% cọc. Sát giờ $< 24h$ hoặc `overdue`: mất 100% cọc. Chặn hủy nếu hợp đồng nháp đang mở. |
| **Cơ sở từ chối đơn**  | `pending_payment`, `payment_successful`                         | Manager (cùng cơ sở)             | Hoàn 100% cọc cho khách. Đã `confirmed` cơ sở bị cấm hủy thường (phải đổi kho hoặc force-cancel).                         |
| **Hủy khẩn cấp**       | `payment_successful`, `confirmed`, `overdue`                    | Manager, Ops, Admin              | Áp dụng khi thiên tai, hỏa hoạn, hư hỏng kho; bắt buộc biên bản sự cố, hoàn 100% cọc, VOID hợp đồng nháp nếu có.          |
| **Lập hợp đồng nháp**  | `confirmed`, `overdue`                                          | Staff, Manager (cùng cơ sở)      | Chặn tạo trước ngày hẹn nếu khách chưa đến (`423`), chặn tạo sau hạn chót nếu khách chưa đến (`424`).                     |
| **Check-in bàn giao**  | Hợp đồng DRAFT đã có khách ký                                   | Manager, Ops, Admin              | Kích hoạt hợp đồng `ACTIVE`, kho `OCCUPIED`, và chuyển đơn đặt chỗ sang `COMPLETED`.                                      |
| **Xác nhận hoàn cọc**  | `cancelled`, `expired` có `refundStatus = pending`              | Manager ($\le 10M$), Ops, Admin  | Giải ngân cọc qua ngân hàng, tuân thủ nghiêm ngặt Maker-Checker.                                                          |

---

## Error Codes và Thông báo (Cập nhật Từ điển Đa ngôn ngữ)

| Message Code       | HTTP | Mẫu EN                                                                        | Mẫu VI (Đề xuất)                                                                 | Chủ thể `{0}` |
| :----------------- | :--- | :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------- | :------------ |
| `MESSAGE_CODE_300` | 404  | Reservation Not Found                                                         | Không tìm thấy đơn đặt chỗ                                                       | Reservation   |
| `MESSAGE_CODE_301` | 400  | Invalid Reservation Status Transition                                         | Chuyển đổi trạng thái đơn đặt chỗ không hợp lệ                                   | Reservation   |
| `MESSAGE_CODE_303` | 400  | Reservation Cannot Be Cancelled                                               | Đơn đặt chỗ không thể hủy ở trạng thái hiện tại                                  | Reservation   |
| `MESSAGE_CODE_304` | 400  | Reservation Has Expired                                                       | Đơn đặt chỗ đã hết hạn giữ chỗ                                                   | Reservation   |
| `MESSAGE_CODE_305` | 400  | Storage Unit Is Not Available For Reservation                                 | Phòng kho hiện không còn trống để đặt chỗ                                        | Storage Unit  |
| `MESSAGE_CODE_307` | 400  | Insufficient Amenity Quantity For {0}                                         | Không đủ số lượng tiện ích khả dụng cho {0}                                      | Amenity       |
| `MESSAGE_CODE_309` | 400  | Storage Unit Has Just Been Booked By Another Customer                         | Phòng kho vừa được khách hàng khác giữ chỗ                                       | Storage Unit  |
| `MESSAGE_CODE_310` | 400  | Time Slot Has Reached Maximum Capacity                                        | Khung giờ hẹn này đã đạt số lượng tiếp đón tối đa                                | Time Slot     |
| `MESSAGE_CODE_311` | 400  | Invalid Or Inactive Check-in Time Slot                                        | Khung giờ hẹn không hợp lệ hoặc đang tạm đóng                                    | Time Slot     |
| `MESSAGE_CODE_312` | 400  | Facility Cannot Cancel A Confirmed Reservation                                | Cơ sở không được phép hủy đơn đã xác nhận (vui lòng đổi kho hoặc hủy khẩn cấp)   | Reservation   |
| `MESSAGE_CODE_313` | 400  | Check-in Date Is Too Far In The Future                                        | Ngày nhận kho vượt quá giới hạn đặt trước cho phép                               | Check-in Date |
| `MESSAGE_CODE_314` | 400  | Too Many Pending Reservations                                                 | Quý khách đã đạt giới hạn số đơn đặt chỗ đang chờ thanh toán                     | Customer      |
| `MESSAGE_CODE_315` | 400  | Check-in Time Slot Has Already Passed                                         | Khung giờ hẹn trong ngày hôm nay đã trôi qua                                     | Time Slot     |
| `MESSAGE_CODE_316` | 400  | Replacement Unit Tier Is Lower Than Reserved                                  | Không được phép đổi sang phòng kho có đơn giá thấp hơn gói đã đặt                | Storage Unit  |
| `MESSAGE_CODE_317` | 400  | Refund Is Not Pending                                                         | Đơn đặt chỗ không có khoản hoàn tiền nào đang chờ giải ngân                      | Refund        |
| `MESSAGE_CODE_318` | 400  | Reservation Has An Active Linked Contract                                     | Không thể hủy đơn do đang có hợp đồng thuê kho liên kết đang xử lý               | Contract      |
| `MESSAGE_CODE_319` | 400  | Check-in Date Has Already Passed                                              | Đã quá ngày hẹn nhận kho, không thể xác nhận đơn                                 | Reservation   |
| `MESSAGE_CODE_320` | 400  | Maker-Checker Violation                                                       | Người xác nhận hoàn tiền phải khác người xác nhận thu tiền                       | User          |
| `MESSAGE_CODE_322` | 400  | Reservation Terms Must Be Accepted                                            | Quý khách vui lòng đồng ý với Điều khoản & Chính sách đặt chỗ                    | Terms         |
| `MESSAGE_CODE_323` | 400  | Force Cancellation Requires Incident Details Or Incident ID                   | Hủy khẩn cấp yêu cầu đính kèm biên bản sự cố hoặc mã sự cố                       | Incident      |
| `MESSAGE_CODE_324` | 400  | Reservation Cannot Be Force Cancelled In Current Status                       | Trạng thái đơn hiện tại không hợp lệ để thực hiện hủy khẩn cấp                   | Reservation   |
| `MESSAGE_CODE_325` | 400  | Reservation Cannot Be Marked As Arrived In Current Status                     | Không thể ghi nhận khách đến cho đơn ở trạng thái hiện tại                       | Reservation   |
| `MESSAGE_CODE_326` | 400  | Customer Has Already Been Marked As Arrived                                   | Khách hàng đã được ghi nhận có mặt tại cơ sở trước đó                            | Reservation   |
| `MESSAGE_CODE_327` | 400  | Reservation Grace Period Cannot Be Extended In Current Status                 | Đơn không ở trạng thái hợp lệ để gia hạn thời gian ân hạn                        | Reservation   |
| `MESSAGE_CODE_328` | 400  | Check-in time slot requires at least {0} minutes preparation lead time        | Ca nhận kho trong ngày yêu cầu đặt trước tối thiểu {0} phút                      | Lead Time     |
| `MESSAGE_CODE_329` | 400  | Start date cannot exceed {0} days after check-in date                         | Ngày bắt đầu thuê không được vượt quá {0} ngày sau ngày nhận kho                 | Start Date    |
| `MESSAGE_CODE_330` | 400  | No Pending Unit Reassign Proposal Found                                       | Không tìm thấy đề xuất đổi kho nào đang chờ phản hồi                             | Proposal      |
| `MESSAGE_CODE_331` | 400  | Another Unit Reassign Proposal Is Already Pending                             | Đơn đặt chỗ đang có một đề xuất đổi kho khác chờ phản hồi                        | Proposal      |
| `MESSAGE_CODE_406` | 400  | Reservation Must Be Confirmed Or Overdue To Create Contract                   | Đơn đặt chỗ phải ở trạng thái xác nhận hoặc quá hạn ân hạn mới được tạo hợp đồng | Reservation   |
| `MESSAGE_CODE_414` | 400  | Customer Must Sign Contract Before Check-In                                   | Khách hàng phải hoàn tất ký hợp đồng trước khi quản lý bàn giao kho              | Contract      |
| `MESSAGE_CODE_422` | 400  | Cannot Void Contract: Linked Reservation Is No Longer Active                  | Không thể hủy bản nháp hợp đồng vì đơn đặt chỗ liên kết không còn hiệu lực       | Contract      |
| `MESSAGE_CODE_423` | 400  | Cannot Create Contract Draft Before Check-In Date Unless Customer Has Arrived | Chưa đến ngày hẹn nhận kho, không thể lập hợp đồng trừ khi khách đã đến          | Reservation   |
| `MESSAGE_CODE_424` | 400  | Reservation Check-In Deadline Has Expired                                     | Đã quá hạn chót nhận kho của đơn đặt chỗ, không thể lập hợp đồng                 | Reservation   |
| `MESSAGE_CODE_425` | 400  | Contract Dates Shifted And Customer Must Resign Updated Draft                 | Ngày thuê bị thay đổi do nhận kho trễ, khách hàng phải ký lại bản nháp           | Contract      |
| `MESSAGE_CODE_504` | 400  | Payment Amount Insufficient                                                   | Số tiền thanh toán không đủ tiền cọc yêu cầu                                     | Payment       |
| `MESSAGE_CODE_509` | 400  | Proof Image Required For Manual Payment                                       | Bắt buộc đính kèm ảnh chụp biên lai khi xác nhận thu tiền mặt                    | Payment       |
| `MESSAGE_CODE_514` | 403  | Refund Approver Cannot Be Requester                                           | Người phê duyệt hoàn tiền không được là người tạo yêu cầu                        | Refund        |

---

## Constants Dùng Chung

| Tên Constant                     | Giá trị        | Ý nghĩa nghiệp vụ                                                                                    |
| :------------------------------- | :------------- | :--------------------------------------------------------------------------------------------------- |
| `HOLD_MINUTES`                   | `15`           | Thời gian giữ chỗ và khóa phòng kho trước khi tự động hết hạn (`EXPIRED`).                           |
| `FREE_CANCEL_HOURS`              | `24`           | Mốc thời gian trước giờ check-in để khách được hủy miễn phí hoàn 100% tiền cọc.                      |
| `OVERDUE_GRACE_HOURS`            | `24`           | Thời gian ân hạn giữ kho mặc định sau ngày hẹn check-in trước khi tính No-show.                      |
| `SAME_DAY_LEAD_MINUTES`          | `120`          | Thời gian chuẩn bị tối thiểu cơ sở yêu cầu khi khách đặt lịch check-in trong ngày.                   |
| `MAX_START_DATE_OFFSET_DAYS`     | `3`            | Số ngày tối đa cho phép ngày bắt đầu tính tiền (`startDate`) lệch sau ngày nhận kho (`checkInDate`). |
| `MAX_ADVANCE_DAYS`               | `30`           | Giới hạn số ngày tối đa khách hàng được phép đặt chỗ trước.                                          |
| `MAX_PENDING_PER_CUSTOMER`       | `3`            | Giới hạn số đơn tối đa ở trạng thái `pending_payment` của 1 tài khoản khách hàng.                    |
| `MAX_ACTIVE_PER_CUSTOMER`        | `5`            | Giới hạn số đơn đang hoạt động cùng lúc của 1 khách hàng (chống đầu cơ găm phòng).                   |
| `DEFAULT_POLICY_VERSION`         | `'2026-10-v1'` | Phiên bản điều khoản & chính sách đặt chỗ mặc định được snapshot vào đơn.                            |
| `DEFAULT_OPS_APPROVAL_THRESHOLD` | `10000000`     | Ngưỡng hoàn tiền tối đa Quản lý cơ sở được duyệt (10M VND); vượt mức cần Ops duyệt.                  |
| `CHECKIN_SIGNING_BUFFER_MINUTES` | `30`           | Khoảng đệm cho phép nhân viên tiếp tục hoàn tất ký hợp đồng sau hạn chót nhận kho.                   |

---

## Quy tắc Validate & Nghiệp vụ Bổ sung Toàn Luồng

1. **Khóa Giữ Chỗ & Đồng Hồ Đếm Ngược 15 Phút (Hold Invariant):**
   - Khi tạo đơn, phòng kho lập tức chuyển sang `RESERVED` dưới sự bảo vệ của Database Partial Unique Index (không bao giờ xảy ra tình trạng 2 khách cùng giữ 1 phòng).
   - FE Mobile phải hiển thị đồng hồ đếm ngược 15 phút dựa trên trường `expiresAt`. Khi hết giờ, màn hình tự động chuyển sang trạng thái hết hạn và vô hiệu hóa nút thanh toán.
2. **Cảnh Báo Mất Cọc Ngay (`immediateForfeitWarning`):**
   - Nếu khách đặt lịch check-in trong vòng 24 giờ tới, cờ `immediateForfeitWarning = true`. FE phải bật hộp thoại xác nhận bắt buộc: _"Đơn đặt sát giờ hẹn, nếu hủy đơn sau khi thanh toán bạn sẽ không được hoàn lại tiền cọc. Bạn có chắc chắn muốn tiếp tục?"_
3. **Nguyên Tắc Thanh Toán Một Lần (Single Payment Invariant):**
   - Đơn đặt cọc chỉ chấp nhận thanh toán đủ 100% số tiền cọc trong một giao dịch duy nhất qua VietQR hoặc tiền mặt.
   - Nếu khách chuyển thiếu hoặc chuyển thừa, hệ thống không chấp nhận thanh toán một phần mà sẽ đẩy giao dịch vào danh sách xử lý hoàn tiền lại toàn bộ cho khách.
4. **Quy Trình Đổi Kho Sự Cố 2 Bước (Reassign Unit):**
   - Quản lý cơ sở chỉ được đổi sang kho cùng cơ sở và có đơn giá $\ge$ đơn giá kho ban đầu.
   - Nếu quản lý chọn `customerAgreed: false`, phòng mới được khóa tạm, đơn lưu vào `pendingUnitChange`.
   - Trên Mobile App của khách xuất hiện banner/sheet thông báo đề xuất đổi kho:
     - Khách bấm `Đồng ý` (`accept`): Kho mới chính thức được áp dụng, đơn giá thuê cập nhật theo gói mới (`[CHỐT D4]`).
     - Khách bấm `Từ chối` (`reject`): Hệ thống tự động giải phóng cả 2 phòng kho, hủy đơn với nguồn `facility_fault` và tạo lệnh hoàn tiền 100% cọc cho khách.
5. **Cơ Chế Miễn Nhiễm No-show Bằng `arrivedAt`:**
   - Ngay khi khách bước vào cơ sở, nhân viên tiếp đón bấm **"Khách đã đến"** (`POST /reservations/:id/mark-arrived`).
   - Sau khi ghi nhận `arrivedAt != null`, đơn **không bao giờ bị hệ thống tự động hủy No-show**, giúp nhân viên và khách an tâm hoàn tất thủ tục bàn giao, kiểm tra đồ đạc và ký hợp đồng dù có kéo dài qua thời gian ân hạn.
6. **Chuyển Giao Sang Hợp Đồng Thuê & Check-in Bàn Giao:**
   - Đơn `CONFIRMED` hoặc `OVERDUE` (đã đến) được nhân viên tạo hợp đồng nháp: `POST /contracts` với `source: 'reservation'`.
   - Khách ký hợp đồng trên Mobile App ➔ Quản lý kiểm tra thực tế phòng kho và ký check-in trên Web.
   - Khi check-in thành công: Hợp đồng chuyển `ACTIVE`, Phòng kho chuyển `OCCUPIED`, và Đơn đặt chỗ tự động chuyển thành `COMPLETED`.
   - **Xử lý nháp sai (`VOID`):** Nếu nhân viên tạo nháp hợp đồng bị sai thông tin, nhân viên hủy bản nháp bằng `cancellationType: 'void'`. Hành động này giải phóng bản nháp sai nhưng **giữ nguyên trạng thái `CONFIRMED` của Reservation**, cho phép nhân viên bấm tạo lại hợp đồng nháp mới mà không làm mất cọc của khách.
7. **Kiểm Soát Rủi Ro Tài Chính (Maker-Checker):**
   - Người xác nhận thu tiền cọc tại quầy tuyệt đối không được là người duyệt hoàn tiền cho chính đơn đó.
   - Thông tin số tài khoản ngân hàng nhận hoàn tiền của khách luôn được mã hóa và trả về FE dưới dạng che mặt nạ (`****1234`) để bảo vệ dữ liệu cá nhân.

---

## Hành vi UI/UX Mong Muốn (Người dùng cung cấp)

- Làm mới (`invalidateQueries`) sau khi thành công: [Cần người dùng bổ sung]
- Thông báo hoặc chuyển trang: [Cần người dùng bổ sung]
- Khóa dịch cần thêm vào `messages/{vi,en}.json` hoặc `locales/{vi,en}.json`: [Cần người dùng bổ sung]

---

## Thay đổi so với Contract Trước

- **Mở rộng phạm vi End-to-End:** Tích hợp trọn vẹn hợp đồng dữ liệu giữa `reservation` với 4 module kết hợp (`payment`, `contract`, `refundRequest`, `facilityTimeSlot`).
- **Thủ tục ký và Check-in:** Bổ sung chi tiết luồng ký 2 bước giữa Mobile App của Khách hàng (`POST /contracts/:id/customer-sign`) và Web Quản lý cơ sở (`POST /contracts/:id/check-in`) để chuyển đơn sang `COMPLETED`.
- **Hủy bản nháp hợp đồng (VOID):** Bổ sung cơ chế `cancellationType: 'void'` trên Hợp đồng nháp giúp bảo toàn đơn Reservation.
- **Thanh toán cọc đa kênh:** Bổ sung schema và response cho cổng VietQR SePay động và xác nhận thu cọc tiền mặt tại quầy (`confirm-manual` kèm `proofImageUrl`).
- **Kiểm soát hoàn tiền phân cấp:** Bổ sung luồng duyệt hoàn cọc với ngưỡng 10,000,000 VND và bảo vệ thông tin STK che mặt nạ.
- **Cơ chế chống No-show:** Chuẩn hóa trường `arrivedAt` và API `mark-arrived` ngăn chặn triệt để rủi ro hủy oan đơn của khách hàng tại hiện trường.
