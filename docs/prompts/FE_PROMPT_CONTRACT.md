# MODULE: contract

Bổ sung hợp đồng dữ liệu cho module này vào `packages/shared`. Phạm vi mặc định chỉ là `packages/shared` (enums, types, schemas, constants, utils); chỉ làm `apps/web` hoặc `apps/mobile` khi mục Phạm vi ghi rõ.
Nếu thiếu thông tin hoặc có mâu thuẫn, hỏi lại, không tự suy đoán.

## Phạm vi

- Nền tảng: Cả hai (Web cho nhân viên, quản lý cơ sở và quản trị hệ thống; Mobile cho khách hàng ký hợp đồng và phụ lục) (suy ra từ role, cần xác nhận)
- Role và khu vực FE:
  - `customer`: Mobile (Customer App) — Ký hợp đồng nháp, ký phụ lục, xem hợp đồng, đồng ý hoặc khiếu nại quyết toán cọc
  - `facility_staff`: Web `/facility-staff/*` — Tạo hợp đồng nháp từ đơn đặt chỗ/vãng lai, hủy bản nháp sai (VOID), nghiệm thu trả kho
  - `facility_manager`: Web `/facility-manager/*` — Quản lý hợp đồng cơ sở, ký nhận kho (check-in) kích hoạt ACTIVE, duyệt phụ lục, ký phụ lục (`staff-sign`), chấm dứt hợp đồng an toàn (`terminate`), quét nợ quá hạn
  - `business_ops_manager`: Web `/business-ops/*` — Giám sát hợp đồng toàn chuỗi cơ sở, xử lý tranh chấp quyết toán cọc
  - `system_admin`: Web `/system-admin/*` — Toàn quyền quản trị hệ thống
- Vị trí hiển thị trên UI: [Cần người dùng bổ sung]

## Mô tả

Quản lý toàn bộ vòng đời hợp đồng thuê kho và phụ lục hợp đồng (Contract & Addendum):

1. Khởi tạo từ đơn đặt chỗ (`RESERVATION`) hoặc khách vãng lai tại quầy (`WALK_IN`).
2. Quy trình ký 2 bên & Ký tay số hóa (Digitized Paper Contract):
   - Xuất PDF nháp từ `GET /contracts/{id}/draft-pdf` in ra giấy A4 tại quầy.
   - Khách hàng và Quản lý cơ sở ký tay (chữ ký sống) trực tiếp trên giấy A4.
   - Khách hàng xác nhận trên Mobile App (`POST /customer-sign`).
   - Quản lý cơ sở chụp ảnh/scan các trang hợp đồng có đầy đủ chữ ký 2 bên, upload lên Cloudinary và gọi `POST /contracts/{id}/check-in` đính kèm `signedContractFileUrls[]` (bắt buộc tối thiểu 1 file scan) để hệ thống băm SHA-256 lưu vết, chuyển hợp đồng sang `ACTIVE` và kho sang `OCCUPIED`.
3. Tự động kiểm soát trượt ngày check-in: Nếu check-in muộn làm dời chu kỳ thuê, hệ thống thu hồi chữ ký cũ, lưu `signatureHistory` và ném mã lỗi 400 `MESSAGE_CODE_425` bắt buộc khách ký lại bản nháp đã cập nhật ngày trước khi kích hoạt.
4. Tách biệt rõ ràng giữa Hủy bản nháp sai (`cancellationType: 'void'`, bảo toàn đơn đặt chỗ và giữ nguyên phòng kho) và Khách hủy không thuê (`cancellationType: 'cancel'`, tính phạt theo chính sách cọc).
5. Vòng đời cọc 6 trạng thái (`depositStatus`), tự động liên kết với thực thể `RefundRequest` (`DEPOSIT_SETTLEMENT`) khi check-out thanh lý hợp đồng.
6. Quản lý phụ lục hợp đồng: Gia hạn (`RENEW`) và Điều chuyển kho sự cố (`UNIT_CHANGE`) với luồng duyệt và ký 2 bước. (Vô hiệu hóa hoàn toàn endpoint gia hạn cũ `POST /renew`).
7. Chấm dứt hợp đồng an toàn (`POST /terminate`): Bắt buộc tối thiểu 1 biên bản và 1 ảnh hiện trường băm SHA-256 chống giả mạo, chặn lạm quyền nợ quá hạn khi nợ dưới 5 ngày (`428`), chuyển kho sang `PENDING_CLEARANCE` và tịch thu 100% cọc.
8. Chốt chặn an toàn tài sản: Chặn check-out khi kho còn hàng (`420`) hoặc còn sự cố mở (`421`); chặn kích hoạt đổi kho `UNIT_CHANGE` khi kho cũ còn hàng (`629`).

## Endpoints

| Method | Path                                                 | Mô tả                                                         | Role                                                                                        | Phân trang |
| :----- | :--------------------------------------------------- | :------------------------------------------------------------ | :------------------------------------------------------------------------------------------ | :--------- |
| POST   | /contracts                                           | Tạo hợp đồng nháp DRAFT (từ Reservation hoặc Walk-in)         | facility_staff, facility_manager, business_ops_manager, system_admin                        | —          |
| GET    | /contracts                                           | Danh sách hợp đồng có bộ lọc theo cơ sở & phân trang          | customer, facility_staff, facility_manager, business_ops_manager, system_admin              | Dạng 1     |
| GET    | /contracts/{id}                                      | Chi tiết hợp đồng kèm tiện ích, phụ lục và lịch sử            | customer, facility_staff, facility_manager, business_ops_manager, system_admin              | —          |
| POST   | /contracts/{id}/customer-sign                        | Khách hàng ký hợp đồng nháp (Bước ký 1 trên Mobile)           | customer (chủ hợp đồng)                                                                     | —          |
| POST   | /contracts/{id}/check-in                             | Quản lý ký bàn giao kho & kích hoạt ACTIVE (Bước ký 2)        | facility_manager, business_ops_manager, system_admin                                        | —          |
| POST   | /contracts/{id}/cancel                               | Hủy hợp đồng DRAFT (hỗ trợ luồng CANCEL hoặc VOID)            | customer (chỉ cancel), facility_staff, facility_manager, business_ops_manager, system_admin | —          |
| POST   | /contracts/{id}/renew                                | **@deprecated** Vô hiệu hóa (trả 400 MESSAGE_CODE_416)        | —                                                                                           | —          |
| POST   | /contracts/{id}/addendums                            | Tạo yêu cầu phụ lục (RENEW hoặc UNIT_CHANGE)                  | customer (chỉ RENEW), facility_manager, business_ops_manager, system_admin                  | —          |
| POST   | /contracts/{id}/addendums/{addendumId}/approve       | Quản lý duyệt phụ lục PENDING_APPROVAL -> DRAFT               | facility_manager, business_ops_manager, system_admin                                        | —          |
| POST   | /contracts/{id}/addendums/{addendumId}/reject        | Quản lý từ chối yêu cầu phụ lục                               | facility_manager, business_ops_manager, system_admin                                        | —          |
| POST   | /contracts/{id}/addendums/{addendumId}/customer-sign | Khách hàng ký phụ lục DRAFT (Bước ký 1 trên Mobile)           | customer (chủ hợp đồng)                                                                     | —          |
| POST   | /contracts/{id}/addendums/{addendumId}/staff-sign    | Quản lý ký phụ lục DRAFT & áp dụng hiệu lực (Bước ký 2)       | facility_manager, business_ops_manager, system_admin                                        | —          |
| POST   | /contracts/{id}/addendums/{addendumId}/cancel        | Hủy phụ lục (giải phóng kho mới nếu UNIT_CHANGE)              | customer, facility_manager, business_ops_manager, system_admin                              | —          |
| POST   | /contracts/{id}/check-out                            | Nghiệm thu trả kho & quyết toán thanh lý hợp đồng             | facility_staff, facility_manager, business_ops_manager, system_admin                        | —          |
| POST   | /contracts/{id}/terminate                            | Chấm dứt hợp đồng an toàn (kèm biên bản & ảnh hiện trường)    | facility_manager, business_ops_manager, system_admin                                        | —          |
| POST   | /contracts/{id}/settlement/confirm                   | Khách hàng đồng ý quyết toán cọc sau check-out                | customer (chủ hợp đồng)                                                                     | —          |
| POST   | /contracts/{id}/settlement/dispute                   | Khách hàng khiếu nại tranh chấp phí bồi thường hư hại cọc     | customer (chủ hợp đồng)                                                                     | —          |
| POST   | /contracts/walk-in                                   | Tạo hợp đồng khách vãng lai tại quầy (inline KYC)             | facility_staff, facility_manager, business_ops_manager, system_admin                        | —          |
| GET    | /contracts/{id}/draft-pdf                            | Xuất bản in PDF/HTML nháp cho 2 bên ký sống                   | customer, facility_staff, facility_manager, business_ops_manager, system_admin              | —          |
| POST   | /contracts/process-overdue                           | Quét hàng loạt hợp đồng quá hạn endDate sang OVERDUE          | facility_manager, business_ops_manager, system_admin                                        | —          |
| POST   | /legal-entities                                      | Tạo mới pháp nhân doanh nghiệp                                | business_ops_manager, system_admin                                                          | —          |
| GET    | /legal-entities                                      | Danh sách pháp nhân doanh nghiệp (phân trang)                 | facility_manager, business_ops_manager, system_admin                                        | Dạng 1     |
| GET    | /legal-entities/{id}                                 | Chi tiết pháp nhân doanh nghiệp                               | facility_manager, business_ops_manager, system_admin                                        | —          |
| PATCH  | /legal-entities/{id}                                 | Cập nhật thông tin pháp nhân                                  | business_ops_manager, system_admin                                                          | —          |
| DELETE | /legal-entities/{id}                                 | Xóa mềm pháp nhân                                             | system_admin                                                                                | —          |
| POST   | /signing-authorizations                              | Cấp văn bản ủy quyền ký cho Quản lý cơ sở                     | business_ops_manager, system_admin                                                          | —          |
| GET    | /signing-authorizations                              | Danh sách văn bản ủy quyền ký (phân trang)                    | facility_manager, business_ops_manager, system_admin                                        | Dạng 1     |
| GET    | /signing-authorizations/{id}                         | Chi tiết văn bản ủy quyền ký                                  | facility_manager, business_ops_manager, system_admin                                        | —          |
| PATCH  | /signing-authorizations/{id}                         | Cập nhật văn bản ủy quyền ký                                  | business_ops_manager, system_admin                                                          | —          |
| POST   | /signing-authorizations/{id}/revoke                  | Thu hồi hiệu lực văn bản ủy quyền ký                          | business_ops_manager, system_admin                                                          | —          |
| POST   | /upload/signature                                    | **[Upload Chứng từ]** Tạo chữ ký tải trực tiếp lên Cloudinary | customer, facility_staff, facility_manager, Ops, Admin                                      | —          |

Query cho API danh sách (`GET /contracts`):

- `sortBy` cho phép: `createdAt`, `startDate`, `endDate`, `contractCode`, `updatedAt`, mặc định: `createdAt`
- `sortOrder`: `asc` | `desc`, mặc định: `desc`
- Các bộ lọc query khác: `page` (default: 1), `limit` (default: 10, max: 100), `customerId`, `facilityId`, `storageUnitId`, `facilityUnitTypeOfferingId`, `status`, `source`, `contractCode`, `startDateFrom`, `startDateTo`, `endDateFrom`, `endDateTo`.

## Request schema (giữ nguyên, thêm vào `packages/shared/src/schemas/request/`)

Thư viện validate: Zod `^4.6.5` (BE dùng Zod v4, tương thích trực tiếp với FE).

### `src/modules/contract/schemas/contract.request.schema.ts`

```ts
import { z } from "zod";
import { paginationQuerySchema } from "../../../common/schemas/pagination.schema.ts";
import { BillingUnitEnum } from "../../../common/enums/billing.enum.ts";
import {
  ContractAddendumTypeEnum,
  ContractCancellationTypeEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  ContractTerminationTypeEnum,
  ViolationCategoryEnum,
} from "../../../common/enums/contract.enum.ts";

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

export const dateStringSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid date format (must be ISO-8601)",
});

export const contractAmenityInputSchema = z.object({
  facilityAmenityOfferingId: objectIdSchema,
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const createContractSchema = z
  .object({
    source: z.nativeEnum(ContractSourceEnum),
    reservationId: objectIdSchema.optional(),

    customerId: objectIdSchema.optional(),
    facilityId: objectIdSchema.optional(),
    storageUnitId: objectIdSchema.optional(),
    facilityUnitTypeOfferingId: objectIdSchema.optional(),

    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),

    billingUnit: z.nativeEnum(BillingUnitEnum).optional(),
    rentalPrice: z.number().min(0).optional(),
    depositAmount: z.number().min(0).optional(),

    amenities: z.array(contractAmenityInputSchema).optional(),
    assignedStaffId: objectIdSchema.optional(),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.source === ContractSourceEnum.RESERVATION) {
      if (!data.reservationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "reservationId is required when source is RESERVATION",
          path: ["reservationId"],
        });
      }
    } else if (data.source === ContractSourceEnum.WALK_IN) {
      if (!data.customerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "customerId is required for WALK_IN contracts",
          path: ["customerId"],
        });
      }
      if (!data.facilityId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "facilityId is required for WALK_IN contracts",
          path: ["facilityId"],
        });
      }
      if (!data.storageUnitId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "storageUnitId is required for WALK_IN contracts",
          path: ["storageUnitId"],
        });
      }
      if (!data.facilityUnitTypeOfferingId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "facilityUnitTypeOfferingId is required for WALK_IN contracts",
          path: ["facilityUnitTypeOfferingId"],
        });
      }
      if (!data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "startDate is required for WALK_IN contracts",
          path: ["startDate"],
        });
      }
      if (!data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endDate is required for WALK_IN contracts",
          path: ["endDate"],
        });
      }
      if (!data.billingUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "billingUnit is required for WALK_IN contracts",
          path: ["billingUnit"],
        });
      }
      if (data.rentalPrice === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "rentalPrice is required for WALK_IN contracts",
          path: ["rentalPrice"],
        });
      }
      if (data.depositAmount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "depositAmount is required for WALK_IN contracts",
          path: ["depositAmount"],
        });
      }
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate).getTime();
        const end = new Date(data.endDate).getTime();
        if (end <= start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "endDate must be greater than startDate",
            path: ["endDate"],
          });
        }
      }
    }
  });

export const checkInContractSchema = z.object({
  termsAccepted: z.boolean().default(true),
  actualCheckInDate: dateStringSchema.optional(),
  signedContractFileUrls: z
    .array(z.string().url("Invalid URL format for signed contract file"))
    .min(1, "At least 1 signed contract scan/photo is required"),
  notes: z.string().max(1000).optional(),
});

export const customerSignContractSchema = z.object({
  termsAccepted: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});

export const cancelContractSchema = z
  .object({
    cancellationType: z
      .enum(ContractCancellationTypeEnum)
      .default(ContractCancellationTypeEnum.CANCEL),
    cancellationReason: z.string().min(1, "Cancellation reason is required").max(1000),
    refundBankName: z.string().min(2).max(100).optional(),
    refundAccountNumber: z
      .string()
      .regex(/^[0-9A-Za-z]{6,30}$/, "Invalid bank account number format")
      .optional(),
    refundAccountHolder: z.string().min(2).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.cancellationType === ContractCancellationTypeEnum.VOID) {
      if (!data.cancellationReason || data.cancellationReason.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cancellation reason for VOID must be at least 3 characters",
          path: ["cancellationReason"],
        });
      }
    }
  });

export const renewContractSchema = z.object({
  newEndDate: dateStringSchema,
  note: z.string().max(1000).optional(),
});

export const createContractAddendumSchema = z
  .object({
    type: z.nativeEnum(ContractAddendumTypeEnum),
    newEndDate: dateStringSchema.optional(),
    newStorageUnitId: objectIdSchema.optional(),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === ContractAddendumTypeEnum.RENEW) {
      if (!data.newEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "newEndDate is required when addendum type is RENEW",
          path: ["newEndDate"],
        });
      }
    } else if (data.type === ContractAddendumTypeEnum.UNIT_CHANGE) {
      if (!data.newStorageUnitId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "newStorageUnitId is required when addendum type is UNIT_CHANGE",
          path: ["newStorageUnitId"],
        });
      }
    }
  });

export const approveContractAddendumSchema = z.object({
  assignedStaffId: objectIdSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export const rejectContractAddendumSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required").max(1000),
});

export const signContractAddendumSchema = z.object({
  termsAccepted: z.boolean().default(true),
  damageFee: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const cancelContractAddendumSchema = z.object({
  cancellationReason: z.string().min(1, "Cancellation reason is required").max(1000),
});

export const checkOutContractSchema = z.object({
  damageFee: z.number().min(0).default(0),
  inspectionNotes: z.string().max(1000).optional(),
  inspectionPhotos: z.array(z.string()).optional(),
  actualCheckOutDate: dateStringSchema.optional(),
});

export const terminateContractSchema = z
  .object({
    terminationType: z.nativeEnum(ContractTerminationTypeEnum),
    violationCategory: z.nativeEnum(ViolationCategoryEnum).optional().nullable(),
    reason: z.string().min(1, "Termination reason is required").max(2000).optional(),
    terminationReason: z.string().min(1, "Termination reason is required").max(2000).optional(),
    reportFileUrls: z
      .array(z.string().url("Invalid report file URL"))
      .min(1, "At least one report file is required"),
    evidenceFileUrls: z
      .array(z.string().url("Invalid evidence photo URL"))
      .min(1, "At least one evidence photo is required"),
  })
  .superRefine((data, ctx) => {
    if (!data.reason && !data.terminationReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Termination reason is required",
        path: ["reason"],
      });
    }
    if (data.terminationType === ContractTerminationTypeEnum.VIOLATION && !data.violationCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Violation category is required when termination type is VIOLATION",
        path: ["violationCategory"],
      });
    }
  });

export const disputeSettlementSchema = z.object({
  disputeReason: z.string().min(1, "Dispute reason is required").max(1000),
});

export const contractQuerySchema = paginationQuerySchema.extend({
  customerId: objectIdSchema.optional(),
  facilityId: objectIdSchema.optional(),
  storageUnitId: objectIdSchema.optional(),
  facilityUnitTypeOfferingId: objectIdSchema.optional(),
  status: z.nativeEnum(ContractStatusEnum).optional(),
  source: z.nativeEnum(ContractSourceEnum).optional(),
  contractCode: z.string().optional(),
  startDateFrom: dateStringSchema.optional(),
  startDateTo: dateStringSchema.optional(),
  endDateFrom: dateStringSchema.optional(),
  endDateTo: dateStringSchema.optional(),
});

export const contractIdParamSchema = z.object({
  id: objectIdSchema,
});

export const contractAddendumParamSchema = z.object({
  id: objectIdSchema,
  addendumId: objectIdSchema,
});

export type DisputeSettlementRequest = z.infer<typeof disputeSettlementSchema>;
export type CreateContractRequest = z.infer<typeof createContractSchema>;
export type CheckInContractRequest = z.infer<typeof checkInContractSchema>;
export type CustomerSignContractRequest = z.infer<typeof customerSignContractSchema>;
export type CancelContractRequest = z.infer<typeof cancelContractSchema>;
export type RenewContractRequest = z.infer<typeof renewContractSchema>;
export type CreateContractAddendumRequest = z.infer<typeof createContractAddendumSchema>;
export type ApproveContractAddendumRequest = z.infer<typeof approveContractAddendumSchema>;
export type RejectContractAddendumRequest = z.infer<typeof rejectContractAddendumSchema>;
export type SignContractAddendumRequest = z.infer<typeof signContractAddendumSchema>;
export type CancelContractAddendumRequest = z.infer<typeof cancelContractAddendumSchema>;
export type CheckOutContractRequest = z.infer<typeof checkOutContractSchema>;
export type TerminateContractRequest = z.infer<typeof terminateContractSchema>;
export type ContractQuery = z.infer<typeof contractQuerySchema>;
```

### `src/modules/upload/schemas/upload.request.schema.ts` (API Upload File/Ảnh Chứng từ)

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
    .default("self-storage/contracts")
    .optional(),
});

export type CloudinarySignatureRequest = z.infer<typeof cloudinarySignatureRequestSchema>;
```

## Response (hình dạng dữ liệu, cập nhật `packages/shared/src/types/`)

Mọi API trả về bọc chuẩn `ApiResponse<T>`.

### Dạng phân trang cho danh sách (`GET /contracts`): Dạng 1

- `response.data.data` là `{ items: ContractResponse[], pagination: PaginationMeta }`

### `ContractResponse` (File BE: `src/modules/contract/schemas/contract.response.schema.ts`)

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

export interface ContractAmenityResponse {
  facilityAmenityOfferingId: string;
  amenityId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  billingUnit: "day" | "month";
  totalPrice: number;
  addedAt: string;
}

export interface ContractAddendumResponse {
  id: string;
  addendumCode: string;
  type: "renew" | "unit_change";
  previousEndDate?: string | null;
  newEndDate?: string | null;
  previousStorageUnitId?: string | null;
  previousStorageUnit?: StorageUnitSnapshot | null;
  newStorageUnitId?: string | null;
  newStorageUnit?: StorageUnitSnapshot | null;
  amenities: ContractAmenityResponse[];
  totalPeriodicPrice: number;
  damageFee: number;
  status: "pending_approval" | "draft" | "active" | "rejected" | "cancelled";
  requestedBy?: UserSnapshot | null;
  requestedAt: string;
  approvedBy?: UserSnapshot | null;
  approvedAt?: string | null;
  assignedStaffId?: string | null;
  assignedStaff?: UserSnapshot | null;
  customerSigned: boolean;
  customerSignedAt?: string | null;
  staffSigned: boolean;
  staffSignedAt?: string | null;
  completedAt?: string | null;
  rejectionReason?: string | null;
  rejectedBy?: UserSnapshot | null;
  rejectedAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: UserSnapshot | null;
  cancelledAt?: string | null;
  notes?: string | null;
}

export interface ContractRenewalResponse {
  previousEndDate: string;
  newEndDate: string;
  renewedAt: string;
  renewedBy?: UserSnapshot | null;
  note?: string | null;
}

export interface ContractSignatureHistoryResponse {
  party: "customer" | "staff";
  signedAt: string;
  previousStartDate: string;
  previousEndDate: string;
  resetAt: string;
  resetReason: string;
}

export interface ContractTerminationFileResponse {
  url: string;
  fileHash?: string | null;
  uploadedAt: string;
}

export interface ContractTerminationHistoryResponse {
  terminationType: "mutual" | "customer_request" | "violation";
  violationCategory?: "prohibited_goods" | "overdue_payment" | "property_damage" | null;
  reason: string;
  reportFiles: ContractTerminationFileResponse[];
  evidenceFiles: ContractTerminationFileResponse[];
  terminatedBy?: UserSnapshot | null;
  terminatedAt: string;
  storageUnitStatus:
    "available" | "reserved" | "occupied" | "under_maintenance" | "pending_clearance" | "inactive";
  depositStatus: "held" | "applied" | "partially_refunded" | "refunded" | "forfeited" | "disputed";
  forfeitedAmount: number;
}

export interface ContractResponse {
  id: string;
  contractCode: string;
  source: "reservation" | "walk_in";
  reservationId?: string | null;
  customerId: string;
  facilityId: string;
  storageUnitId: string;
  facilityUnitTypeOfferingId: string;
  assignedStaffId?: string | null;
  startDate: string;
  endDate: string;
  actualCheckInDate?: string | null;
  actualCheckOutDate?: string | null;
  billingUnit: "day" | "month";
  rentalPrice: number;
  depositAmount: number;
  depositPaidAt?: string | null;
  depositPaymentId?: string | null;
  firstPeriodPaidAt?: string | null;
  firstPeriodPaymentId?: string | null;
  totalPeriodicPrice: number;
  amenities: ContractAmenityResponse[];
  addendums: ContractAddendumResponse[];
  renewals: ContractRenewalResponse[];
  renewalCount: number;
  inspectedBy?: UserSnapshot | null;
  damageFee: number;
  overdueFee: number;
  refundAmount: number;
  forfeitedAmount: number;
  additionalPaymentRequired: number;
  inspectionNotes?: string | null;
  inspectionPhotos: string[];
  depositStatus?:
    "held" | "applied" | "partially_refunded" | "refunded" | "forfeited" | "disputed" | null;
  settlementConfirmedAt?: string | null;
  disputedAt?: string | null;
  disputeReason?: string | null;
  cancellationType?: "void" | "cancel" | null;
  cancellationReason?: string | null;
  cancelledBy?: UserSnapshot | null;
  cancelledAt?: string | null;
  terminationType?: "mutual" | "customer_request" | "violation" | null;
  violationCategory?: "prohibited_goods" | "overdue_payment" | "property_damage" | null;
  terminationReason?: string | null;
  terminatedBy?: UserSnapshot | null;
  terminatedAt?: string | null;
  reportFiles: ContractTerminationFileResponse[];
  evidenceFiles: ContractTerminationFileResponse[];
  terminationHistory: ContractTerminationHistoryResponse[];
  status: "draft" | "active" | "overdue" | "completed" | "cancelled" | "terminated";
  termsAccepted: boolean;
  customerSigned: boolean;
  customerSignedAt?: string | null;
  staffSigned: boolean;
  staffSignedAt?: string | null;
  signedContractFileUrls?: string[];
  signatureHistory: ContractSignatureHistoryResponse[];
  earlyCheckIn?: boolean | null;
  outOfSlot?: boolean | null;
  notes?: string | null;
  customer?: UserSnapshot | null;
  facility?: FacilitySnapshot | null;
  offering?: OfferingSnapshot | null;
  storageUnit?: StorageUnitSnapshot | null;
  assignedStaff?: UserSnapshot | null;
  createdAt: string;
  updatedAt: string;
}
```

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

> **⚡ QUY TRÌNH CLIENT-SIDE UPLOAD (BẮT BUỘC KHI CHECK-IN SCAN, WALK-IN CCCD & TERMINATE):**
>
> 1. Gọi `POST /upload/signature` với `{ folder: 'self-storage/contracts' }` để nhận chữ ký.
> 2. Gửi file trực tiếp từ Client lên Cloudinary: `POST https://api.cloudinary.com/v1_1/${cloudName}/auto/upload` với `FormData`:
>    - `file`: File / Blob
>    - `api_key`: `apiKey`
>    - `timestamp`: `timestamp`
>    - `signature`: `signature`
>    - `folder`: `folder`
> 3. Cloudinary trả về `{ secure_url: string }`.
> 4. Truyền URL này vào payload hợp đồng: `signedContractFileUrls: [secure_url]`, `idCardFrontImageUrl: secure_url`, `reportFileUrls: [secure_url]`.

- **Trường tham chiếu:** `customerId`, `facilityId`, `storageUnitId`, `facilityUnitTypeOfferingId`, `assignedStaffId`, `reservationId` là chuỗi hex ObjectId (24 ký tự). Dữ liệu đối tượng mở rộng được populate trả kèm qua các snapshot objects tương ứng: `customer`, `facility`, `offering`, `storageUnit`, `assignedStaff`.
- **Kiểu serialize:**
  - Tiền tệ (`rentalPrice`, `depositAmount`, `totalPeriodicPrice`, `damageFee`, `overdueFee`, `refundAmount`, `forfeitedAmount`, `additionalPaymentRequired`): số nguyên VND (`number`).
  - Ngày giờ (`startDate`, `endDate`, `actualCheckInDate`, `actualCheckOutDate`, `createdAt`, `updatedAt`...): chuỗi ISO 8601 (`string`).

## Enums (cập nhật `packages/shared/src/enums/`)

### `ContractStatusEnum` (File BE: `src/common/enums/contract.enum.ts`)

```ts
export enum ContractStatusEnum {
  DRAFT = "draft",
  ACTIVE = "active",
  OVERDUE = "overdue",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  TERMINATED = "terminated",
}
```

### `ContractSourceEnum` (File BE: `src/common/enums/contract.enum.ts`)

```ts
export enum ContractSourceEnum {
  RESERVATION = "reservation",
  WALK_IN = "walk_in",
}
```

### `ContractDepositStatusEnum` (File BE: `src/common/enums/contract.enum.ts`)

```ts
export enum ContractDepositStatusEnum {
  HELD = "held",
  APPLIED = "applied",
  PARTIALLY_REFUNDED = "partially_refunded",
  REFUNDED = "refunded",
  FORFEITED = "forfeited",
  DISPUTED = "disputed",
}
```

### `ContractCancellationTypeEnum` (File BE: `src/common/enums/contract.enum.ts`)

```ts
export enum ContractCancellationTypeEnum {
  VOID = "void",
  CANCEL = "cancel",
}
```

### `ContractTerminationTypeEnum` (File BE: `src/common/enums/contract.enum.ts`)

```ts
export enum ContractTerminationTypeEnum {
  MUTUAL = "mutual",
  CUSTOMER_REQUEST = "customer_request",
  VIOLATION = "violation",
}
```

### `ViolationCategoryEnum` (File BE: `src/common/enums/contract.enum.ts`)

```ts
export enum ViolationCategoryEnum {
  PROHIBITED_GOODS = "prohibited_goods",
  OVERDUE_PAYMENT = "overdue_payment",
  PROPERTY_DAMAGE = "property_damage",
}
```

### `ContractAddendumStatusEnum` (File BE: `src/common/enums/contract.enum.ts`)

```ts
export enum ContractAddendumStatusEnum {
  PENDING_APPROVAL = "pending_approval",
  DRAFT = "draft",
  ACTIVE = "active",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}
```

### `ContractAddendumTypeEnum` (File BE: `src/common/enums/contract.enum.ts`)

````ts
export enum ContractAddendumTypeEnum {
  RENEW = 'renew',
  UNIT_CHANGE = 'unit_change',
}

### `CloudinaryFolderEnum` (File BE: `src/common/enums/upload.enum.ts`)

```ts
export enum CloudinaryFolderEnum {
  AMENITIES = 'self-storage/amenities',
  FACILITIES = 'self-storage/facilities',
  UNIT_TYPES = 'self-storage/unit-types',
  AVATARS = 'self-storage/avatars',
  CONTRACTS = 'self-storage/contracts',
  GENERAL = 'self-storage/general',
}
````

## Ma trận hành động theo trạng thái

| Hành động                                           | Trạng thái cho phép | Role được phép                                                     | Ghi chú / Điều kiện nghiệp vụ                                                                                                                   |
| :-------------------------------------------------- | :------------------ | :----------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Khách ký hợp đồng** (`customer-sign`)             | `draft`             | `customer` (chủ hợp đồng)                                          | Khách ký trước trên Mobile App. Hợp đồng vẫn ở `draft`.                                                                                         |
| **Quản lý ký nhận kho** (`check-in`)                | `draft`             | `facility_manager`, Ops, Admin                                     | Bắt buộc `customerSigned === true`. Kích hoạt `active`, kho sang `occupied`. Nếu trượt ngày thì ném lỗi 400 `425` bắt buộc ký lại.              |
| **Hủy hợp đồng nháp sai** (`cancel` với `void`)     | `draft`             | `facility_staff`, `facility_manager`, Ops, Admin                   | Cấm `customer`. Giữ nguyên đơn đặt chỗ và giữ nguyên khóa kho; walk-in hoàn 100% cọc.                                                           |
| **Khách hủy hợp đồng nháp** (`cancel` với `cancel`) | `draft`             | `customer` (chủ hợp đồng)                                          | Hủy đơn đặt chỗ kèm theo, tính cọc hoàn/phạt theo snapshot chính sách đơn; walk-in mất 100% cọc.                                                |
| **Tạo phụ lục RENEW**                               | `active`, `overdue` | `customer` (ra `pending_approval`), Manager/Ops/Admin (ra `draft`) | Gia hạn ngày thuê `newEndDate > endDate`. Bỏ API renew cũ.                                                                                      |
| **Tạo phụ lục UNIT_CHANGE**                         | `active`            | `facility_manager`, Ops, Admin                                     | Điều chuyển kho sự cố; khóa tạm kho mới sang `reserved` và chuyển phụ lục vào `draft`.                                                          |
| **Khách ký phụ lục** (`customer-sign`)              | Phụ lục `draft`     | `customer` (chủ hợp đồng)                                          | Khách ký trước; phụ lục vẫn ở `draft` chờ quản lý ký.                                                                                           |
| **Quản lý ký phụ lục** (`staff-sign`)               | Phụ lục `draft`     | `facility_manager`, Ops, Admin                                     | Bắt buộc khách đã ký trước. Với `unit_change`, chặn lỗi 400 `629` nếu kho cũ còn hàng tồn.                                                      |
| **Nghiệm thu trả kho** (`check-out`)                | `active`, `overdue` | `facility_staff`, `facility_manager`, Ops, Admin                   | Đánh giá hư hại, tính phí trễ hạn (1.5x); chặn 400 `420` nếu kho còn hàng, chặn 400 `421` nếu còn sự cố mở.                                     |
| **Chấm dứt hợp đồng** (`terminate`)                 | `active`, `overdue` | `facility_manager`, Ops, Admin                                     | Bắt buộc đính kèm biên bản & ảnh hiện trường băm SHA-256; nợ nần `< 5 ngày` bị chặn 400 `428`; kho sang `pending_clearance`; cọc tịch thu 100%. |
| **Xác nhận quyết toán cọc** (`settlement/confirm`)  | Sau `check-out`     | `customer` (chủ hợp đồng)                                          | Khách đồng ý số tiền hoàn cọc sau khi trừ hư hại & phí trễ hạn.                                                                                 |
| **Khiếu nại quyết toán cọc** (`settlement/dispute`) | Sau `check-out`     | `customer` (chủ hợp đồng)                                          | Chuyển cọc sang `disputed` để Quản lý vận hành (Ops) giải quyết.                                                                                |

## Error codes và thông báo (cập nhật `MESSAGE_CODE`, `MESSAGE_DICTIONARY_EN/VI`, `ENTITY_SUBJECT_DICTIONARY`)

| Message Code       | HTTP | Mẫu EN                                                                                                         | Mẫu VI (đề xuất, cần xác nhận)                                                            | Chủ thể `{0}` |
| :----------------- | :--- | :------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :------------ |
| `MESSAGE_CODE_400` | 404  | Contract Not Found                                                                                             | Không tìm thấy hợp đồng                                                                   | Contract      |
| `MESSAGE_CODE_401` | 400  | Invalid Contract Status Transition                                                                             | Chuyển đổi trạng thái hợp đồng không hợp lệ                                               | Contract      |
| `MESSAGE_CODE_402` | 400  | Storage Unit Is Not Available For Contract                                                                     | Phòng kho không khả dụng để lập hợp đồng                                                  | Storage Unit  |
| `MESSAGE_CODE_403` | 400  | Contract Has Already Been Checked In                                                                           | Hợp đồng đã được ký nhận kho và kích hoạt trước đó                                        | Contract      |
| `MESSAGE_CODE_404` | 400  | Contract Extension Date Must Be Greater Than Current End Date                                                  | Ngày gia hạn mới phải lớn hơn ngày kết thúc hiện tại                                      | Contract      |
| `MESSAGE_CODE_405` | 400  | Cannot Delete Entity With Active Contracts                                                                     | Không thể xóa đối tượng đang có hợp đồng hoạt động                                        | Entity        |
| `MESSAGE_CODE_406` | 400  | Reservation Must Be Confirmed Or Completed To Create Contract                                                  | Đơn đặt chỗ phải ở trạng thái đã xác nhận để lập hợp đồng                                 | Reservation   |
| `MESSAGE_CODE_407` | 400  | Storage Unit Facility Mismatch                                                                                 | Phòng kho không thuộc cơ sở của hợp đồng                                                  | Storage Unit  |
| `MESSAGE_CODE_408` | 400  | Insufficient Amenity Quantity For Contract                                                                     | Không đủ số lượng tiện ích khả dụng cho hợp đồng                                          | Amenity       |
| `MESSAGE_CODE_409` | 404  | Contract Addendum Not Found                                                                                    | Không tìm thấy phụ lục hợp đồng                                                           | Addendum      |
| `MESSAGE_CODE_410` | 400  | Invalid Contract Addendum Status Transition                                                                    | Chuyển đổi trạng thái phụ lục hợp đồng không hợp lệ                                       | Addendum      |
| `MESSAGE_CODE_411` | 400  | Contract Terms Must Be Accepted                                                                                | Quý khách vui lòng đồng ý với Điều khoản hợp đồng                                         | Terms         |
| `MESSAGE_CODE_412` | 400  | Party Has Already Signed                                                                                       | Bên ký đã hoàn tất ký trước đó                                                            | Party         |
| `MESSAGE_CODE_414` | 400  | Customer Must Sign Contract Before Check-In                                                                    | Khách hàng phải ký hợp đồng trước khi Quản lý hoàn tất nhận kho                           | Customer      |
| `MESSAGE_CODE_415` | 400  | Customer Must Sign Contract Addendum Before Staff Sign                                                         | Khách hàng phải ký phụ lục trước khi Quản lý ký duyệt                                     | Customer      |
| `MESSAGE_CODE_416` | 400  | Direct Contract Renewal Is Deprecated. Please Use Contract Addendum (RENEW) via POST /contracts/{id}/addendums | Tính năng gia hạn trực tiếp đã đóng. Vui lòng tạo phụ lục gia hạn (RENEW)                 | Contract      |
| `MESSAGE_CODE_417` | 400  | Contract Deposit Settlement Disputed                                                                           | Quyết toán cọc đang trong quá trình giải quyết tranh chấp                                 | Settlement    |
| `MESSAGE_CODE_418` | 400  | Contract Inspection Photos Required For Damage Assessment                                                      | Bắt buộc đính kèm ảnh hiện trường khi có phát sinh chi phí hư hại                         | Photos        |
| `MESSAGE_CODE_419` | 400  | Deposit Settlement Already Confirmed                                                                           | Quyết toán tiền cọc đã được xác nhận trước đó                                             | Settlement    |
| `MESSAGE_CODE_420` | 400  | Cannot Check Out Contract While Customer Inventory Remains                                                     | Không thể nghiệm thu trả kho: vẫn còn hàng hóa của khách lưu trong kho                    | Inventory     |
| `MESSAGE_CODE_421` | 400  | Cannot Check Out Contract While Open Incidents Exist                                                           | Không thể nghiệm thu trả kho: hợp đồng đang có sự cố hư hỏng chưa đóng                    | Incident      |
| `MESSAGE_CODE_422` | 400  | Cannot Void Contract: Linked Reservation Is No Longer Active                                                   | Không thể hủy vô hiệu (VOID): đơn đặt chỗ liên kết không còn hoạt động                    | Reservation   |
| `MESSAGE_CODE_423` | 400  | Cannot Create Contract Draft Before Check-In Date Unless Customer Has Arrived                                  | Chưa đến ngày hẹn nhận kho và khách chưa có mặt tại cơ sở                                 | Contract      |
| `MESSAGE_CODE_424` | 400  | Reservation Check-In Deadline Has Expired                                                                      | Đã quá hạn nhận kho của đơn đặt chỗ và khách chưa có mặt tại cơ sở                        | Reservation   |
| `MESSAGE_CODE_425` | 400  | Contract dates were adjusted. Customer must re-sign the updated draft before check-in                          | Ngày thuê đã thay đổi do nhận kho trễ. Khách hàng cần ký lại bản nháp đã cập nhật         | Contract      |
| `MESSAGE_CODE_426` | 400  | Contract Termination Requires At Least One Report File And One Evidence Photo                                  | Chấm dứt hợp đồng yêu cầu tối thiểu 1 biên bản thanh lý và 1 ảnh hiện trường              | Files         |
| `MESSAGE_CODE_427` | 400  | Violation Termination Requires Violation Category                                                              | Chấm dứt do vi phạm yêu cầu phân loại hành vi vi phạm cụ thể                              | Category      |
| `MESSAGE_CODE_428` | 400  | Overdue Payment Termination Requires Overdue Grace Period Exceeded (At Least 5 Days Overdue)                   | Chấm dứt do nợ tiền yêu cầu hợp đồng phải ở trạng thái quá hạn (OVERDUE) tối thiểu 5 ngày | Overdue       |
| `MESSAGE_CODE_629` | 400  | Cannot Put Storage Unit Under Maintenance While Customer Inventory Remains                                     | Không thể chuyển kho sang bảo trì: vẫn còn hàng hóa của khách trong kho                   | Storage Unit  |

## Constants

| Tên Constant                     | Giá trị | Ý nghĩa                                                                                             |
| :------------------------------- | :------ | :-------------------------------------------------------------------------------------------------- |
| `OVERDUE_PENALTY_MULTIPLIER`     | `1.5`   | Hệ số phạt trễ hạn tính trên đơn giá ngày thuê thực tế                                              |
| `STANDARD_DAYS_PER_MONTH`        | `30`    | Số ngày chuẩn dùng để quy đổi đơn giá ngày đối với gói thuê theo tháng                              |
| `OVERDUE_TERMINATION_GRACE_DAYS` | `5`     | Số ngày quá hạn tối thiểu trước khi Quản lý được phép chấm dứt vì lý do nợ tiền (`OVERDUE_PAYMENT`) |
| `CHECKIN_SIGNING_BUFFER_MINUTES` | `30`    | Thời gian đệm cho phép lập hợp đồng nháp sau hạn chót nhận kho nếu khách chưa đến                   |

## Quy tắc validate/nghiệp vụ bổ sung (không nằm trong schema)

1. **Gate tạo hợp đồng nháp (`POST /contracts`)**:
   - Nếu ngày hiện tại chưa đến ngày hẹn `checkInDate`: Chỉ cho phép tạo nếu khách đã có mặt tại cơ sở (`arrivedAt != null`). Nếu chưa đến ném lỗi 400 `MESSAGE_CODE_423`.
   - Nếu đã quá hạn nhận kho (bao gồm 30 phút đệm): Chặn tạo hợp đồng nếu khách chưa đến, ném lỗi 400 `MESSAGE_CODE_424`.
2. **Quy trình ký 2 bên & Ký tay số hóa (Digitized Paper Contract - `check-in`)**:
   - Xuất PDF nháp từ `GET /contracts/{id}/draft-pdf` in ra giấy A4 tại quầy.
   - Khách hàng và Quản lý cơ sở ký tay (chữ ký sống) trực tiếp trên giấy A4.
   - Khách hàng xác nhận trên Mobile App (`POST /customer-sign`).
   - Quản lý cơ sở chụp ảnh/scan các trang hợp đồng có đầy đủ chữ ký 2 bên, upload lên Cloudinary và gọi `POST /contracts/{id}/check-in` đính kèm `signedContractFileUrls[]` (bắt buộc tối thiểu 1 file scan) để hệ thống băm SHA-256 lưu vết, chuyển hợp đồng sang `ACTIVE` và kho sang `OCCUPIED`.
   - Nếu check-in trễ làm ngày bắt đầu dời sang ngày mới (`actualCheckInDate > startDate`): Hệ thống tự động thu hồi chữ ký cũ của khách (`customerSigned = false`), lưu lịch sử vào `signatureHistory` và ném lỗi 400 `MESSAGE_CODE_425`. Khách hàng bắt buộc phải ký lại bản nháp đã điều chỉnh trước khi Quản lý có thể kích hoạt hợp đồng.
3. **Phân biệt nút VOID và CANCEL trên bản nháp DRAFT**:
   - Nút **"Hủy nháp sai (VOID)"**: Chỉ hiển thị cho Nhân viên/Quản lý cơ sở. Bắt buộc nhập lý do tối thiểu 3 ký tự. Giữ nguyên đơn đặt chỗ và giữ nguyên khóa giữ phòng kho để nhân viên tạo lại bản nháp mới ngay lập tức.
   - Nút **"Khách hủy hợp đồng (CANCEL)"**: Khách hàng hoặc Quản lý bấm. Đơn đặt chỗ liên kết sẽ bị hủy, tính toán hoàn cọc hoặc tịch thu theo snapshot chính sách.
4. **Quy tắc Chấm dứt hợp đồng an toàn (`POST /terminate`)**:
   - Form bắt buộc upload tối thiểu 1 file biên bản (`reportFileUrls`) và 1 ảnh hiện trường (`evidenceFileUrls`).
   - Chọn loại: `MUTUAL`, `CUSTOMER_REQUEST`, `VIOLATION`. Nếu chọn `VIOLATION`, bắt buộc chọn danh mục: `PROHIBITED_GOODS` (hàng cấm), `OVERDUE_PAYMENT` (nợ tiền), `PROPERTY_DAMAGE` (phá hoại tài sản).
   - Rào chắn chống lạm quyền: Nếu chọn `OVERDUE_PAYMENT`, hợp đồng bắt buộc phải đang ở `OVERDUE` và quá hạn ít nhất 5 ngày (`OVERDUE_TERMINATION_GRACE_DAYS = 5`). Nếu vi phạm ném lỗi 400 `MESSAGE_CODE_428`.
   - Phòng kho chuyển sang trạng thái `PENDING_CLEARANCE` và cọc bị tịch thu 100% (`forfeitedAmount = depositAmount`).
5. **Chốt chặn tồn kho khách hàng**:
   - Chặn check-out khi kho còn hàng (`countRemainingByStorageUnit > 0`, lỗi 400 `MESSAGE_CODE_420`).
   - Chặn kích hoạt đổi kho `UNIT_CHANGE` khi kho cũ còn hàng (`countRemainingByStorageUnit > 0`, lỗi 400 `MESSAGE_CODE_629`).
   - Chặn chuyển kho từ `PENDING_CLEARANCE` sang bảo trì `UNDER_MAINTENANCE` khi kho còn hàng (lỗi 400 `MESSAGE_CODE_629`).
6. **Chốt chặn sự cố hư hỏng**: Chặn check-out nếu hợp đồng đang có sự cố hư hỏng chưa đóng (lỗi 400 `MESSAGE_CODE_421`). Chi phí bồi thường hư hại từ sự cố (`damageFee`) sẽ được cộng dồn đồng bộ nguyên tử vào hợp đồng khi sự cố được nghiệm thu đóng.

## Hành vi UI/UX mong muốn (người dùng cung cấp)

- Làm mới (`invalidateQueries`) sau khi thành công: [Cần người dùng bổ sung]
- Thông báo hoặc chuyển trang: [Cần người dùng bổ sung]
- Khóa dịch cần thêm vào `messages/{vi,en}.json` hoặc `locales/{vi,en}.json`: [Cần người dùng bổ sung]

## Thay đổi so với contract trước

- **Endpoints thay đổi & vô hiệu hóa**:
  - `POST /contracts/{id}/renew`: Đã vô hiệu hóa hoàn toàn (trả 400 `MESSAGE_CODE_416`), chuyển 100% sang tạo phụ lục `POST /contracts/{id}/addendums`.
  - `POST /contracts/{id}/terminate`: Mở rộng thêm `terminationType`, `violationCategory`, `reportFileUrls`, `evidenceFileUrls`.
  - `POST /contracts/{id}/cancel`: Mở rộng thêm `cancellationType` (`void` vs `cancel`), thông tin tài khoản nhận hoàn cọc.
- **Request schemas mở rộng**:
  - `terminateContractSchema`: bắt buộc biên bản & ảnh hiện trường, phân loại vi phạm.
  - `cancelContractSchema`: thêm `cancellationType`, thông tin ngân hàng.
- **Response schema (`ContractResponse`) mở rộng**:
  - Thêm `depositStatus: ContractDepositStatusEnum` (6 trạng thái).
  - Thêm `cancellationType: 'void' | 'cancel'`.
  - Thêm `signatureHistory: ContractSignatureHistoryResponse[]` (lưu vết thu hồi chữ ký khi trượt ngày).
  - Thêm `earlyCheckIn: boolean`, `outOfSlot: boolean` (cờ cảnh báo mềm).
  - Thêm `firstPeriodPaidAt: string`, `firstPeriodPaymentId: string`.
  - Thêm `terminationType`, `violationCategory`, `reportFiles`, `evidenceFiles`, `terminationHistory`.
- **Enums mới**:
  - `ContractDepositStatusEnum` (`held`, `applied`, `partially_refunded`, `refunded`, `forfeited`, `disputed`).
  - `ContractCancellationTypeEnum` (`void`, `cancel`).
  - `ContractTerminationTypeEnum` (`mutual`, `customer_request`, `violation`).
  - `ViolationCategoryEnum` (`prohibited_goods`, `overdue_payment`, `property_damage`).
  - `StorageUnitStatusEnum`: bổ sung `pending_clearance`.
