# BÀN GIAO BỔ SUNG FRONTEND: CẬP NHẬT LUỒNG CỌC & TIỆN ÍCH (PHƯƠNG ÁN B), SỬA ENUM SỰ CỐ & QUẢN LÝ ỦY QUYỀN KÝ

> **Tài liệu bổ sung (Addendum Handover):** Tài liệu này cập nhật các điểm chốt nghiệp vụ mới và bổ sung contract cho Frontend sau khi các file `FE_PROMPT_RESERVATION.md`, `FE_PROMPT_CONTRACT.md`, `FE_PROMPT_PAYMENT.md` đã được bàn giao. Các prompt trước vẫn giữ nguyên giá trị, FE chỉ cần áp dụng các phần điều chỉnh và bổ sung được nêu chi tiết dưới đây.

---

## TỔNG HỢP CÁC ĐIỂM FRONTEND CẦN ĐIỀU CHỈNH & BỔ SUNG

| STT | Khu vực ảnh hưởng                                                                            | Nội dung điều chỉnh                                                                                                                                                                                                                                                                  | Mức độ ưu tiên         |
| :-- | :------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------- |
| 1   | **Mobile Customer App** (`CreateReservationView.tsx`, `EditReservationModal.tsx`)            | Sửa công thức hiển thị tổng tiền đặt chỗ: **Chỉ thu tiền cọc kho** (`depositAmount = basePrice * depositMultiplier`), **KHÔNG cộng tiền tiện ích vào số tiền cần thanh toán cọc ngay**. Tiện ích chỉ hiển thị ghi chú "Đã giữ trước, thanh toán cùng tiền thuê kỳ đầu khi nhận kho". | **P0 (Critical)**      |
| 2   | **Web Quản lý cơ sở** (`ReservationActionModals.tsx` & `packages/shared`)                    | Cập nhật `IncidentCategoryEnum` cho form **Hủy khẩn cấp đơn đặt chỗ** (`force-cancel`), chỉ dùng đúng 6 giá trị Backend quy định.                                                                                                                                                    | **P0 (Fix Bug 400)**   |
| 3   | **Web Business Ops / Admin** (`/business-ops/signing-authorizations` hoặc `/system-admin/*`) | Bổ sung giao diện và contract quản trị **Văn bản ủy quyền ký** (`SigningAuthorization`) để cấp quyền cho Quản lý cơ sở trước khi ký check-in (tránh lỗi 400 `MESSAGE_CODE_431`).                                                                                                     | **P1 (Tính năng mới)** |
| 4   | **Mobile & Web Contract Detail** (`contracts/[id].tsx`, `ContractDetailView.tsx`)            | Hiển thị khoản thanh toán **Tiền thuê kỳ đầu** (`RENT_FIRST_PERIOD`) bao gồm cả tiện ích mua 1 lần; sau khi check-in (`ACTIVE`), hiển thị đúng **Giá thuê định kỳ hàng tháng/chu kỳ** đã loại trừ tiện ích 1 lần.                                                                    | **P1**                 |
| 5   | **Mobile Customer App & Web Quản lý** (`contracts/[id].tsx`, `ContractDetailView.tsx`)       | Đặc tả chuẩn hóa **Luồng Khách hàng yêu cầu gia hạn hợp đồng (RENEW)**: Mobile khách gửi yêu cầu (`pending_approval`) ➔ Quản lý Web duyệt (`approve`) ➔ Khách ký số (`customer-sign`) ➔ Quản lý ký (`staff-sign`) kích hoạt hiệu lực. Xóa bỏ modal gọi API cũ deprecated `/renew`.   | **P1 (Quan trọng)**    |
| 6   | **Web Quản lý hoàn tiền** (`/facility-manager/refunds`)                                      | Quy trình hoàn tiền cọc trên Production: chuyển sang thực hiện qua module `/refund-requests` (`approve` & `confirm-paid`), không dùng nút test `confirm-refund` trên trang reservation.                                                                                              | **P1**                 |

---

## PHẦN 1: ĐIỀU CHỈNH LUỒNG TÍNH TIỀN CỌC & TIỆN ÍCH (PHƯƠNG ÁN B)

### 1.1. Bối cảnh & Nghiệp vụ đã chốt

- **Đặt chỗ (Reservation):** Khi khách hàng đặt phòng kho có chọn thêm tiện ích (kể cả tiện ích thuê theo tháng như máy hút ẩm, hay tiện ích mua đứt 1 lần như thùng carton, ổ khóa), Backend chỉ thu tiền cọc bảo đảm kho lưu trữ:
  $$\text{depositAmount} = \text{basePrice} \times \text{depositMultiplier}$$
  $$\text{totalAmount (trên Reservation)} = \text{depositAmount}$$
  Tiện ích được hệ thống khóa giữ chỗ nguyên tử (atomic lock) nhưng **chưa thu tiền**.
- **Tiền thuê kỳ đầu (Contract Draft -> Check-in):**
  Toàn bộ tiện ích mua 1 lần (`billingUnit === 'one_time'`) cùng với tiền thuê kỳ đầu và tiện ích định kỳ kỳ đầu sẽ được thu tập trung vào một lần duy nhất qua khoản thanh toán **Tiền thuê kỳ đầu (`RENT_FIRST_PERIOD`)**:
  $$\text{totalPeriodicPrice (Hợp đồng Draft)} = \text{rentalPrice} + \text{recurringAmenitiesTotal} + \text{oneTimeAmenitiesTotal}$$
- **Hợp đồng sau khi nhận kho (Contract Active):**
  Khi Quản lý ký check-in, Backend tự động cập nhật lại `totalPeriodicPrice` của hợp đồng chỉ còn giá thuê thực tế hàng tháng:
  $$\text{totalPeriodicPrice (Hợp đồng Active)} = \text{rentalPrice} + \text{recurringAmenitiesTotal}$$
  Các hóa đơn định kỳ tự động từ kỳ 2 trở đi (`generateRecurringInvoice`) sẽ **loại bỏ hoàn toàn** các tiện ích mua 1 lần.

### 1.2. Hướng dẫn sửa đổi trên Mobile (`apps/mobile`)

#### A. File `apps/mobile/features/reservations/components/CreateReservationView.tsx`:

- **Vấn đề hiện tại:** Đoạn code dòng ~318 đang viết:
  ```ts
  const totalAmount = depositAmount + amenitiesTotal;
  ```
  Sau đó UI hiển thị `Estimated Total Amount: formatVnd(totalAmount)` ngay trên nút bấm đặt chỗ, làm khách hàng tưởng rằng phải thanh toán cả cọc + tiện ích ngay lúc đặt phòng, nhưng khi mở mã VietQR thì chỉ thu `depositAmount`.
- **Cách điều chỉnh:**
  1. Giữ nguyên tính toán `depositAmount = basePrice * depositMultiplier`.
  2. Sửa nhãn tóm tắt chi phí (Summary Card):
     - **Tiền đặt cọc giữ kho (×depositMultiplier):** `{formatVnd(depositAmount)}`
     - **Tiện ích đi kèm đã chọn:** `{formatVnd(amenitiesTotal)}` _(ghi chú: Đã giữ chỗ — Thanh toán cùng tiền thuê kỳ đầu khi nhận kho)_.
     - **Tổng thanh toán ngay khi đặt chỗ:** `{formatVnd(depositAmount)}` _(Đổi biến hiển thị từ `totalAmount` thành `depositAmount`)_.

#### B. File `apps/mobile/features/reservations/components/EditReservationModal.tsx`:

- Tương tự, tại modal chỉnh sửa đơn đặt chỗ: hiển thị `estimatedDepositAmount = basePrice * depositMultiplier` là số tiền cọc; không cộng dồn tiện ích vào số tiền cọc cần bù/hoàn.

#### C. File `apps/mobile/app/contracts/[id].tsx`:

- **Giai đoạn DRAFT (Trước Check-in):** Mục `2. Tiền thuê kỳ đầu` hiển thị `{formatVnd(contract.totalPeriodicPrice)}`. Nút "Thanh toán tiền thuê kỳ đầu" (`RENT_FIRST_PERIOD`) giữ nguyên, số tiền này đã bao gồm tiền thuê kỳ 1 + tiện ích định kỳ kỳ 1 + tiện ích mua 1 lần.
- **Giai đoạn ACTIVE (Sau Check-in):** Mục `Tổng giá thuê định kỳ` hiển thị `{formatVnd(contract.totalPeriodicPrice)} / tháng`. Backend đã tự động trừ sạch tiện ích mua 1 lần, FE chỉ cần render trực tiếp `contract.totalPeriodicPrice`.

---

## PHẦN 2: SỬA LỖI ENUM SỰ CỐ KHI HỦY KHẨN CẤP (`force-cancel`)

### 2.1. Mã lỗi Backend trả về

```json
{
  "statusCode": 400,
  "messageCode": "MESSAGE_CODE_101",
  "message": "Invalid Request",
  "errors": [
    {
      "field": "incidentDetails.category",
      "message": "Invalid option: expected one of \"structural\"|\"electrical\"|\"water_leak\"|\"security\"|\"cleanliness\"|\"other\""
    }
  ]
}
```

### 2.2. Điều chỉnh trên `packages/shared`

Trong file `packages/shared/src/enums/incident.enum.ts`, đảm bảo enum `IncidentCategoryEnum` chỉ chứa đúng 6 giá trị sau:

```ts
export enum IncidentCategoryEnum {
  STRUCTURAL = "structural",
  ELECTRICAL = "electrical",
  WATER_LEAK = "water_leak",
  SECURITY = "security",
  CLEANLINESS = "cleanliness",
  OTHER = "other",
}
```

### 2.3. Điều chỉnh trên Web (`apps/web/features/reservation-management/components/ReservationActionModals.tsx`)

Tại modal **Hủy khẩn cấp (Force Cancel Reservation)**:

- Cập nhật danh sách lựa chọn trong Dropdown "Loại sự cố / Phân loại sự cố" (`incidentDetails.category`):
  1. `structural`: Sự cố kết cấu / Phòng kho hư hỏng
  2. `electrical`: Sự cố chập điện / Mất điện
  3. `water_leak`: Sự cố rò rỉ nước / Ngập úng
  4. `security`: Sự cố an ninh / Khóa cửa hỏng
  5. `cleanliness`: Sự cố vệ sinh / Ô nhiễm môi trường
  6. `other`: Sự cố khác
- Đặt giá trị mặc định cho dropdown là `structural`.
- Loại bỏ hoàn toàn các option cũ không hợp lệ như `FACILITY_DAMAGE`, `UNIT_DEFECT`.

---

## PHẦN 3: BỔ SUNG QUẢN LÝ VĂN BẢN ỦY QUYỀN KÝ (`SigningAuthorization`)

### 3.1. Tại sao cần màn hình này?

Khi Quản lý cơ sở (`facility_manager`) ký nhận bàn giao kho (`POST /contracts/:id/check-in`), Backend bắt buộc kiểm tra xem người ký có **Văn bản ủy quyền ký đang có hiệu lực (`status === 'active'`)** do Pháp nhân công ty cấp cho cơ sở đó hay không. Nếu không có, Backend trả lỗi `400 MESSAGE_CODE_431`. Do đó, Quản lý vận hành (`business_ops_manager`) hoặc Admin (`system_admin`) cần màn hình để tạo và quản lý ủy quyền ký.

### 3.2. Phạm vi & Role

- **Nền tảng:** Web (`apps/web`).
- **Role truy cập:**
  - `system_admin`, `business_ops_manager`: Toàn quyền Tạo mới (`POST`), Cập nhật (`PATCH`), Thu hồi (`POST /revoke`), Tra cứu (`GET`).
  - `facility_manager`: Xem danh sách và chi tiết văn bản ủy quyền của cơ sở mình (`GET`).
- **Đường dẫn đề xuất trên Web:**
  - Quản lý vận hành: `/business-ops/signing-authorizations`
  - Quản trị viên: `/system-admin/signing-authorizations`

### 3.3. Danh sách Endpoints Backend

| Method  | Path                                  | Mô tả                                                                                    | Role cho phép                                              |
| :------ | :------------------------------------ | :--------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
| `POST`  | `/signing-authorizations`             | Cấp mới văn bản ủy quyền ký                                                              | `system_admin`, `business_ops_manager`                     |
| `GET`   | `/signing-authorizations`             | Danh sách văn bản ủy quyền (phân trang, lọc theo cơ sở, người được ủy quyền, trạng thái) | `system_admin`, `business_ops_manager`, `facility_manager` |
| `GET`   | `/signing-authorizations/{id}`        | Chi tiết văn bản ủy quyền ký                                                             | `system_admin`, `business_ops_manager`, `facility_manager` |
| `PATCH` | `/signing-authorizations/{id}`        | Cập nhật ngày hết hạn (`validTo`), link file scan, ghi chú                               | `system_admin`, `business_ops_manager`                     |
| `POST`  | `/signing-authorizations/{id}/revoke` | Thu hồi hiệu lực văn bản ủy quyền                                                        | `system_admin`, `business_ops_manager`                     |

### 3.4. Request Schemas (`packages/shared/src/schemas/request/`)

```ts
import { z } from "zod";
import { paginationQuerySchema } from "./pagination.schema";

export const dateStringSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid date format (must be ISO-8601)",
});

export const createSigningAuthorizationSchema = z
  .object({
    legalEntityId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Legal Entity ID format"),
    authorizedUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID format"),
    facilityIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Facility ID format"))
      .min(1, "At least one facility must be authorized"),
    authorizationNumber: z.string().min(3).max(100),
    issuedDate: dateStringSchema,
    validFrom: dateStringSchema,
    validTo: dateStringSchema,
    documentUrl: z.string().url("Invalid document URL"),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine((data) => new Date(data.validTo).getTime() >= new Date(data.validFrom).getTime(), {
    message: "validTo must be greater than or equal to validFrom",
    path: ["validTo"],
  });

export const updateSigningAuthorizationSchema = z.object({
  validTo: dateStringSchema.optional(),
  documentUrl: z.string().url().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const signingAuthorizationQuerySchema = paginationQuerySchema.extend({
  authorizedUserId: z.string().optional(),
  legalEntityId: z.string().optional(),
  facilityId: z.string().optional(),
  status: z.enum(["active", "revoked", "expired"]).optional(),
  sortBy: z.enum(["issuedDate", "validFrom", "validTo", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateSigningAuthorizationRequest = z.infer<typeof createSigningAuthorizationSchema>;
export type UpdateSigningAuthorizationRequest = z.infer<typeof updateSigningAuthorizationSchema>;
export type SigningAuthorizationQuery = z.infer<typeof signingAuthorizationQuerySchema>;
```

### 3.5. Response Types (`packages/shared/src/types/`)

```ts
export interface SigningAuthorizationItem {
  id: string;
  legalEntityId:
    | {
        _id: string;
        companyName: string;
        taxCode: string;
      }
    | string;
  authorizedUserId:
    | {
        _id: string;
        name: string;
        email: string;
        phoneNumber?: string;
        role: string;
      }
    | string;
  facilityIds: Array<
    | {
        _id: string;
        name: string;
        code: string;
      }
    | string
  >;
  authorizationNumber: string;
  issuedDate: string; // ISO 8601
  validFrom: string; // ISO 8601
  validTo: string; // ISO 8601
  documentUrl: string;
  fileHash?: string | null;
  status: "active" | "revoked" | "expired";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## PHẦN 4: QUY TRÌNH HOÀN TIỀN TRÊN MÔI TRƯỜNG PRODUCTION

1. **Khóa endpoint demo:**
   Endpoint `POST /reservations/:id/confirm-refund` chỉ là endpoint giả lập cho môi trường Local / Testing. Khi chạy trên Render hoặc môi trường `production`, Backend sẽ chặn và trả lỗi `400 MESSAGE_CODE_321: Demo Refund Simulation Is Disabled In This Environment`.
2. **Quy trình hoàn tiền thật:**
   Khi đơn đặt chỗ hoặc hợp đồng phát sinh hoàn tiền (ví dụ khách hủy trước 24h, cơ sở hủy khẩn cấp do sự cố kho, hoặc hoàn trả cọc sau khi thanh lý hợp đồng):
   - Backend tự động sinh ra một bản ghi trong thực thể `RefundRequest` với trạng thái `PENDING`.
   - Nhân viên / Quản lý cơ sở truy cập màn hình **Quản lý Hoàn tiền** (`/facility-manager/refunds`):
     - **Bước 1 — Duyệt hoàn tiền (`POST /refund-requests/:id/approve`):** Kiểm tra thông tin tài khoản ngân hàng của khách và hạn mức chi trả.
     - **Bước 2 — Chuyển khoản & Xác nhận chi trả (`POST /refund-requests/:id/confirm-paid`):** Sau khi kế toán/thủ quỹ chuyển khoản qua ngân hàng thực tế, bấm "Xác nhận đã hoàn tiền", nhập mã giao dịch ngân hàng và đính kèm URL ảnh chứng từ / ủy nhiệm chi chuyển khoản (sử dụng API upload ảnh `POST /upload/signature`).
   - FE trên trang chi tiết đơn đặt chỗ chỉ cần hiển thị Badge trạng thái cọc: `Đang chờ duyệt hoàn tiền` hoặc `Đã hoàn tiền`, không cần gọi nút `confirm-refund`.

---

## PHẦN 5: ĐẶC TẢ CHI TIẾT LUỒNG KHÁCH HÀNG YÊU CẦU GIA HẠN HỢP ĐỒNG (RENEW ADDENDUM)

### 5.1. Khách hàng có được tự gia hạn không?

- **Câu trả lời:** Khách hàng **ĐƯỢC PHÉP gửi yêu cầu gia hạn** từ Mobile Customer App.
- **NHƯNG:** Khách hàng **KHÔNG THỂ tự bấm để gia hạn thành công ngay lập tức** (hệ thống không cho phép tự động kéo dài hợp đồng mà không qua kiểm soát lịch phòng kho).
- Toàn bộ việc gia hạn bắt buộc đi qua **Quy trình Phụ lục hợp đồng 4 bước (Contract Addendum - RENEW)**:
  1. `Khách gửi yêu cầu gia hạn (Mobile)` ➔ Phụ lục sinh ra ở trạng thái `pending_approval`.
  2. `Quản lý cơ sở xem xét & Phê duyệt (Web)` ➔ Phụ lục chuyển sang `draft`.
  3. `Khách hàng ký số phụ lục (Mobile)` ➔ Khách xác nhận điều khoản ngày thuê mới.
  4. `Quản lý ký hoàn tất (Web)` ➔ Phụ lục kích hoạt `active`, ngày `contract.endDate` chính thức được dời sang ngày mới.

> **Lưu ý đặc biệt cho FE:**
>
> - Endpoint cũ `POST /contracts/{id}/renew` đã bị **vô hiệu hóa hoàn toàn (deprecated)**, Backend trả lỗi `400 MESSAGE_CODE_416: Direct Contract Renewal Is Deprecated. Please Use Contract Addendum (RENEW) via POST /contracts/{id}/addendums`.
> - FE cần gỡ bỏ mọi lời gọi trực tiếp đến `POST /contracts/{id}/renew` và chuyển 100% sang luồng Phụ lục dưới đây.

```
[Khách hàng trên Mobile]                      [Quản lý cơ sở trên Web]
           │                                              │
(1) Bấm "Yêu cầu gia hạn"                                 │
    POST /contracts/{id}/addendums                        │
    (type: 'renew', newEndDate)                           │
           │                                              │
           ▼                                              │
   [pending_approval] ───────────────────────────> (Nhận yêu cầu gia hạn)
                                                          │
                                            (2) Kiểm tra & Phê duyệt
                                                POST .../addendums/{id}/approve
                                                          │
           ┌──────────────────────────────────────────────┘
           ▼
        [draft]
           │
(3) Khách nhận thông báo & Ký số
    POST .../addendums/{id}/customer-sign
           │
           ▼
     [customerSigned] ───────────────────────────> (4) Quản lý ký hoàn tất
                                                       POST .../addendums/{id}/staff-sign
                                                          │
                                                          ▼
                                                       [active]
                                           (contract.endDate được gia hạn mới)
```

---

### 5.2. Đặc tả API cho Luồng Gia hạn

#### Bước 1: Khách hàng gửi yêu cầu gia hạn (`customer`)

- **API:** `POST /contracts/{id}/addendums`
- **Role:** `customer` (chủ hợp đồng) hoặc `facility_manager` / `business_ops_manager` / `system_admin`.
- **Điều kiện hợp đồng:** Hợp đồng đang ở trạng thái `active` hoặc `overdue`.
- **Request Body:**
  ```json
  {
    "type": "renew",
    "newEndDate": "2027-08-31T23:59:59.999Z",
    "notes": "Tôi muốn gia hạn thêm 3 tháng lưu trữ đồ đạc gia đình"
  }
  ```
  _(Validate: `newEndDate` bắt buộc phải lớn hơn `contract.endDate` hiện tại, nếu không Backend ném mã lỗi 400 `MESSAGE_CODE_404`)._
- **Trạng thái sinh ra:**
  - Nếu do `customer` tạo: Phụ lục có trạng thái `status: "pending_approval"`.
  - Nếu do Quản lý tạo trực tiếp tại quầy: Phụ lục có trạng thái `status: "draft"`.

#### Bước 2: Quản lý cơ sở phê duyệt hoặc từ chối (`facility_manager`)

- **Phê duyệt:** `POST /contracts/{id}/addendums/{addendumId}/approve`
  - Body: `{ "notes": "Đồng ý gia hạn khoang số 102" }` _(notes optional)_.
  - Kết quả: Phụ lục chuyển từ `pending_approval` sang `draft` để mở khóa cho khách hàng ký.
- **Từ chối:** `POST /contracts/{id}/addendums/{addendumId}/reject`
  - Body: `{ "rejectionReason": "Khoang kho đã có khách khác đặt trước từ tháng sau" }` _(bắt buộc tối thiểu 5 ký tự)_.
  - Kết quả: Phụ lục chuyển sang `rejected`.

#### Bước 3: Khách hàng ký số xác nhận phụ lục trên Mobile (`customer`)

- **API:** `POST /contracts/{id}/addendums/{addendumId}/customer-sign`
- **Role:** `customer` (chủ hợp đồng).
- **Điều kiện:** Phụ lục đang ở `status === 'draft'` và `customerSigned === false`.
- **Request Body:**
  ```json
  {
    "termsAccepted": true,
    "notes": "Đã đọc và đồng ý gia hạn"
  }
  ```
- **Kết quả:** Phụ lục được ghi nhận `customerSigned: true`, `customerSignedAt: now`.

#### Bước 4: Quản lý cơ sở ký xác nhận & áp dụng hiệu lực (`facility_manager`)

- **API:** `POST /contracts/{id}/addendums/{addendumId}/staff-sign`
- **Role:** `facility_manager`, `business_ops_manager`, `system_admin`.
- **Điều kiện:** Bắt buộc khách hàng đã ký trước (`customerSigned === true`).
- **Request Body:**
  ```json
  {
    "signedAddendumFileUrls": ["https://res.cloudinary.com/.../phu-luc-gia-han-da-ky.pdf"],
    "notes": "Đã kiểm tra và lưu bản scan có chữ ký sống"
  }
  ```
- **Kết quả:**
  - Phụ lục chuyển sang `status: "active"`, `completedAt: now`.
  - `contract.endDate` được cập nhật chính thức thành `addendum.newEndDate`.
  - Một bản ghi lịch sử gia hạn được thêm vào mảng `contract.renewals`.
  - Hệ thống tự động tạo lịch sinh hóa đơn tiền thuê cho chu kỳ mới.

---

### 5.3. Hướng dẫn triển khai UI/UX trên Frontend

#### A. Trên Mobile App (`apps/mobile/app/contracts/[id].tsx`):

1. **Nút "Yêu cầu gia hạn hợp đồng":**
   - Chỉ hiển thị khi hợp đồng đang ở trạng thái `ACTIVE` hoặc `OVERDUE`.
   - Ẩn hoặc disable nếu hợp đồng đã có một phụ lục đang chờ xử lý (`pending_approval` hoặc `draft`).
2. **Modal Gửi Yêu Cầu Gia Hạn (`RequestRenewalModal`):**
   - DatePicker chọn `newEndDate` (giới hạn ngày tối thiểu phải lớn hơn `contract.endDate` hiện tại ít nhất 1 ngày/1 tháng tùy đơn vị thuê).
   - Ô nhập ghi chú lý do gia hạn.
   - Bấm "Gửi yêu cầu" ➔ gọi `POST /contracts/{id}/addendums`.
3. **Danh sách Phụ lục Hợp đồng:**
   - Nếu phụ lục ở trạng thái `pending_approval`: Hiển thị thẻ vàng: `Đang chờ Quản lý cơ sở phê duyệt gia hạn đến ngày [DD/MM/YYYY]`. Khách có thể bấm nút "Hủy yêu cầu" (`POST .../cancel`) nếu đổi ý.
   - Nếu phụ lục ở trạng thái `draft` và `customerSigned === false`: Hiển thị thẻ xanh/cam kèm nút nổi bật: **"Ký phụ lục gia hạn"**. Bấm vào mở Modal điều khoản và checkbox đồng ý để gọi `customer-sign`.
   - Nếu phụ lục đã `active`: Hiển thị trong tab Lịch sử gia hạn kèm `newEndDate`.

#### B. Trên Web Quản Lý (`apps/web/features/contract-management`):

1. Tại bảng chi tiết Hợp đồng ([`ContractDetailView.tsx`](file:///d:/Studying/FALL2026/WDP\self-storage-system-fe\apps\web\features\contract-management\components\ContractDetailView.tsx)):
   - Tab "Phụ lục hợp đồng": Khi có phụ lục `type === 'renew'` ở trạng thái `pending_approval`:
     - Nút **"Phê duyệt"** (mở popup xác nhận gọi `POST .../approve`).
     - Nút **"Từ chối"** (mở popup nhập lý do từ chối gọi `POST .../reject`).
   - Khi phụ lục đã được khách ký (`draft` và `customerSigned === true`):
     - Nút **"Ký nhận & Kích hoạt phụ lục"** (mở popup tải lên file scan chữ ký gọi `POST .../staff-sign`).
2. Gỡ bỏ hoặc thay thế hoàn toàn modal cũ `RenewContractModal` (gọi endpoint deprecated `/renew`).

---

---

## BẢNG MÃ LỖI (MESSAGE_CODE) THAM KHẢO CHO BẢN GIAO BỔ SUNG

| Message Code       | HTTP Status | Mẫu câu tiếng Anh                                                                                              | Bản dịch tiếng Việt gợi ý                                                                                 | Ghi chú                                          |
| :----------------- | :---------- | :------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- | :----------------------------------------------- |
| `MESSAGE_CODE_101` | 400         | Invalid Request                                                                                                | Yêu cầu không hợp lệ                                                                                      | Kiểm tra lại dữ liệu gửi lên (Zod validation)    |
| `MESSAGE_CODE_319` | 400         | Check-in date cannot be in the past                                                                            | Ngày nhận kho không được ở trong quá khứ                                                                  | Đơn đặt chỗ quá ngày check-in                    |
| `MESSAGE_CODE_321` | 400         | Demo Refund Simulation Is Disabled In This Environment                                                         | Chức năng giả lập hoàn tiền bị khóa trong môi trường này                                                  | Sử dụng luồng duyệt hoàn tiền `/refund-requests` |
| `MESSAGE_CODE_404` | 400         | Contract Extension Date Must Be Greater Than Current End Date                                                  | Ngày gia hạn mới phải lớn hơn ngày kết thúc hiện tại                                                      | Lỗi chọn ngày gia hạn mới không hợp lệ           |
| `MESSAGE_CODE_416` | 400         | Direct Contract Renewal Is Deprecated. Please Use Contract Addendum (RENEW) via POST /contracts/{id}/addendums | Tính năng gia hạn trực tiếp đã đóng. Vui lòng tạo phụ lục gia hạn (RENEW)                                 | Khi FE vô tình gọi endpoint cũ `/renew`          |
| `MESSAGE_CODE_425` | 400         | Contract dates were adjusted. Customer must re-sign the updated draft before check-in                          | Thời hạn hợp đồng đã bị thay đổi do nhận kho muộn. Khách hàng phải ký lại bản nháp mới trước khi check-in | Khi check-in trễ ngày                            |
| `MESSAGE_CODE_429` | 404         | Legal Entity not found or inactive                                                                             | Pháp nhân không tồn tại hoặc đã ngừng hoạt động                                                           | Khi cấp văn bản ủy quyền ký                      |
| `MESSAGE_CODE_431` | 400         | Facility Manager does not have an active signing authorization                                                 | Quản lý cơ sở chưa có văn bản ủy quyền ký còn hiệu lực                                                    | Cần cấp ủy quyền ký trước                        |
| `MESSAGE_CODE_432` | 400         | Signed contract scan file is required for check-in                                                             | Bắt buộc tải lên bản scan hợp đồng đã ký sống                                                             | Quản lý cần upload ảnh scan hợp đồng             |
| `MESSAGE_CODE_520` | 400         | Contract deposit must be paid before first period rent                                                         | Phải hoàn tất đóng cọc trước khi thanh toán tiền thuê kỳ đầu                                              | Luồng thanh toán kỳ 1                            |
| `MESSAGE_CODE_521` | 400         | First period rent has already been paid                                                                        | Tiền thuê kỳ đầu đã được thanh toán                                                                       | Tránh thanh toán trùng                           |
