# MODULE: storageUnit & storageRack (Không gian lưu trữ, Bản đồ 2D & Thuê kệ kho)

Bổ sung hợp đồng dữ liệu cho module `storageUnit` và `storageRack` vào `packages/shared`. Phạm vi mặc định là `packages/shared` (enums, types, schemas, constants, utils); chỉ làm `apps/web` hoặc `apps/mobile` khi mục Phạm vi ghi rõ.
Nếu thiếu thông tin hoặc có mâu thuẫn, hỏi lại, không tự suy đoán.

---

## Phạm vi

- **Nền tảng:** Cả hai (Mobile cho Khách hàng; Web cho Nhân viên cơ sở, Quản lý cơ sở, Quản lý vận hành và Quản trị viên).
- **Phân công Role & Khu vực Frontend:**

| Role                   | Nền tảng / Khu vực FE     | Trách nhiệm chính đối với Kho & Kệ                                                                                                                                                                                      |
| :--------------------- | :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customer`             | Mobile (Customer App)     | Xem danh sách kho trống (`/available`), xem sơ đồ mặt bằng 2D trực quan (`/map-layout`) để chọn vị trí phòng kho; xem danh sách kệ & tầng kệ (`/storage-racks/unit/:unitId`) để chọn thuê theo kệ kho (`STORAGE_RACK`). |
| `facility_staff`       | Web `/facility-staff/*`   | Tra cứu phòng kho, xem sơ đồ mặt bằng thực tế để dẫn khách nhận kho, kiểm tra trạng thái bảo trì, hỗ trợ kiểm đếm kệ kho.                                                                                               |
| `facility_manager`     | Web `/facility-manager/*` | Toàn quyền quản lý phòng kho chi nhánh: tạo/cập nhật phòng kho, bật/tắt bảo trì (`toggleMaintenance`), quản lý hệ thống kệ kho (`StorageRack`) và tầng kệ (`RackTier`).                                                 |
| `business_ops_manager` | Web `/business-ops/*`     | Giám sát mặt bằng toàn chuỗi, cấu hình bảng giá zone kệ chi nhánh (`rackZonePricing`), đối soát & giải phóng kho mồ côi (`reconcile`).                                                                                  |
| `system_admin`         | Web `/system-admin/*`     | Toàn quyền kiểm soát, xóa/khôi phục kho (`restoreStorageUnit`), quản trị đối soát toàn hệ thống.                                                                                                                        |

- **Vị trí hiển thị trên UI:** [Cần người dùng bổ sung]

---

## Mô tả Nghiệp vụ

Module `storageUnit` và `storageRack` cung cấp toàn bộ dữ liệu không gian vật lý cho hệ thống lưu trữ:

1. **Phòng kho vật lý (`StorageUnit`):** Đại diện cho từng phòng kho/khoang kho riêng biệt (Box, Container, Locker, Warehouse Room). Cung cấp 2 API cốt lõi cho màn hình đặt chỗ:
   - `GET /storage-units/facility/{facilityId}/available`: Lọc danh sách các phòng kho đang thực sự trống (`AVAILABLE`) để khách bấm chọn nhanh.
   - `GET /storage-units/facility/{facilityId}/map-layout`: Trả về toàn bộ mặt bằng 2D của cơ sở (tất cả các phòng kho kèm floor, zone, unitNumber và trạng thái `available`, `reserved`, `occupied`, `under_maintenance`, `pending_clearance`) để render bản đồ 2D cho khách hoặc nhân viên chọn kho trực quan.
2. **Kệ kho & Tầng kệ (`StorageRack` & `RackTier`):** Dành cho mô hình kho chia sẻ (`WAREHOUSE_RACK`). Khách hàng có thể thuê trọn gói từng kệ (`RentalTargetTypeEnum.STORAGE_RACK`) với đơn giá riêng (`rack.customPrice`) hoặc bảng giá khu vực (`PRIME`, `STANDARD`, `ECONOMY`).
3. **Vòng đời trạng thái an toàn:** Rào chắn `PENDING_CLEARANCE` chặn tuyệt đối không cho đưa kho về `AVAILABLE` hoặc bật bảo trì khi còn hàng tồn kho của khách (`MESSAGE_CODE_629`).

---

## Endpoints

### 1. Phòng kho vật lý (`StorageUnit`)

| Method | Path                                            | Mô tả                                                            | Role                                         | Phân trang |
| :----- | :---------------------------------------------- | :--------------------------------------------------------------- | :------------------------------------------- | :--------- |
| GET    | /storage-units                                  | Danh sách phòng kho (lọc cơ sở, tầng, khu, loại kho, trạng thái) | Public / Staff, Manager, Ops, Admin          | Dạng 1     |
| GET    | /storage-units/facility/{facilityId}/available  | **[Customer Booking]** Lấy danh sách kho trống đang mở bán       | Public / Customer, Staff, Manager            | —          |
| GET    | /storage-units/facility/{facilityId}/map-layout | **[Customer/Staff Map]** Toàn bộ sơ đồ mặt bằng 2D của cơ sở     | Public / Customer, Staff, Manager            | —          |
| GET    | /storage-units/{id}                             | Chi tiết phòng kho theo ID                                       | Public / Customer, Staff, Manager            | —          |
| POST   | /storage-units                                  | Tạo mới phòng kho vật lý                                         | facility_manager, Ops, Admin                 | —          |
| PATCH  | /storage-units/{id}                             | Cập nhật thông tin phòng kho (số phòng, tầng, khu, ghi chú)      | facility_manager, Ops, Admin                 | —          |
| PATCH  | /storage-units/{id}/maintenance                 | Bật/tắt bảo trì kho (chặn khi còn hàng tồn `629`)                | facility_staff, facility_manager, Ops, Admin | —          |
| DELETE | /storage-units/{id}                             | Xóa mềm phòng kho (chặn khi đang reserved/occupied)              | business_ops_manager, system_admin           | —          |
| POST   | /storage-units/{id}/restore                     | Khôi phục phòng kho đã xóa mềm                                   | business_ops_manager, system_admin           | —          |
| POST   | /storage-units/reconcile                        | **[Ops/Admin]** Đối soát & giải phóng các kho RESERVED mồ côi    | business_ops_manager, system_admin           | —          |

Query cho API danh sách phòng kho (`GET /storage-units`):

- `sortBy` cho phép: `unitNumber`, `floor`, `status`, `createdAt`, `updatedAt`, mặc định: `createdAt`
- `sortOrder`: `asc` | `desc`, mặc định: `desc`
- Các bộ lọc: `facilityId`, `unitTypeId`, `status`, `floor`, `zone`, `unitNumber`.

Query cho API kho trống (`GET /storage-units/facility/{facilityId}/available`):

- `unitTypeId`: string (lọc theo loại kho)
- `floor`: number (lọc theo tầng)
- `zone`: string (lọc theo khu vực)

---

### 2. Kệ kho & Tầng kệ (`StorageRack` & `RackTier`)

| Method | Path                          | Mô tả                                                        | Role                              | Phân trang |
| :----- | :---------------------------- | :----------------------------------------------------------- | :-------------------------------- | :--------- |
| GET    | /storage-racks                | Danh sách kệ kho (lọc cơ sở, khoang phòng, zone, trạng thái) | Staff, Manager, Ops, Admin        | Dạng 1     |
| GET    | /storage-racks/unit/{unitId}  | **[Rack Booking]** Lấy tất cả kệ & tầng kệ của 1 phòng kho   | Public / Customer, Staff, Manager | —          |
| GET    | /storage-racks/{id}           | Chi tiết kệ kho (kèm danh sách tiers)                        | Staff, Manager, Ops, Admin        | —          |
| POST   | /storage-racks                | Tạo mới kệ kho kèm số tầng tự động                           | facility_manager, Ops, Admin      | —          |
| PATCH  | /storage-racks/{id}           | Cập nhật thông tin kệ (dãy aisle, vị trí bay, zone, đơn giá) | facility_manager, Ops, Admin      | —          |
| PATCH  | /storage-racks/tiers/{tierId} | Cập nhật thông số tầng kệ (tải trọng tối đa, kích thước)     | facility_manager, Ops, Admin      | —          |
| DELETE | /storage-racks/{id}           | Xóa kệ kho                                                   | facility_manager, Ops, Admin      | —          |

Query cho API danh sách kệ (`GET /storage-racks`):

- `sortBy` cho phép: `rackCode`, `aisle`, `bay`, `tierCount`, `createdAt`, `updatedAt`, mặc định: `createdAt`
- `sortOrder`: `asc` | `desc`, mặc định: `desc`
- Các bộ lọc: `facilityId`, `storageUnitId`, `status`, `rackCode`, `aisle`, `zone`.

---

## Request Schemas (Thêm vào `packages/shared/src/schemas/request/`)

Thư viện validate: Zod `^4.6.5` (tương thích trực tiếp Zod v4 của FE).

### 1. StorageUnit Request Schemas (`src/modules/storageUnit/schemas/storageUnit.request.schema.ts`)

```ts
import { z } from "zod";
import { paginationQuerySchema } from "../../../common/schemas/pagination.schema.ts";
import { StorageUnitStatusEnum } from "../../../common/enums/storageUnit.enum.ts";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const storageUnitIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid storage unit ID format"),
});

export const facilityIdParamSchema = z.object({
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format"),
});

export const createStorageUnitSchema = z.object({
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format"),
  unitTypeId: z.string().regex(objectIdRegex, "Invalid unit type ID format"),
  unitNumber: z
    .string()
    .min(1, "Unit number is required")
    .max(50, "Unit number must not exceed 50 characters")
    .trim(),
  floor: z.number().int().min(1, "Floor must be at least 1").default(1),
  zone: z.string().max(100, "Zone must not exceed 100 characters").trim().optional(),
  status: z
    .enum([
      StorageUnitStatusEnum.AVAILABLE,
      StorageUnitStatusEnum.UNDER_MAINTENANCE,
      StorageUnitStatusEnum.INACTIVE,
    ])
    .default(StorageUnitStatusEnum.AVAILABLE)
    .optional(),
  images: z
    .array(z.string().url("Invalid image URL format"))
    .min(3, "Storage unit requires at least 3 images")
    .max(10, "Storage unit allows a maximum of 10 images")
    .optional(),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional(),
});

export const updateStorageUnitSchema = z.object({
  unitTypeId: z.string().regex(objectIdRegex, "Invalid unit type ID format").optional(),
  unitNumber: z
    .string()
    .min(1, "Unit number is required")
    .max(50, "Unit number must not exceed 50 characters")
    .trim()
    .optional(),
  floor: z.number().int().min(1, "Floor must be at least 1").optional(),
  zone: z.string().max(100, "Zone must not exceed 100 characters").trim().optional(),
  status: z.enum([StorageUnitStatusEnum.AVAILABLE, StorageUnitStatusEnum.INACTIVE]).optional(),
  images: z
    .array(z.string().url("Invalid image URL format"))
    .min(3, "Storage unit requires at least 3 images")
    .max(10, "Storage unit allows a maximum of 10 images")
    .optional(),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional(),
});

export const toggleMaintenanceSchema = z.object({
  isUnderMaintenance: z.boolean(),
  notes: z.string().max(1000, "Notes must not exceed 1000 characters").optional(),
});

export const storageUnitQuerySchema = paginationQuerySchema.extend({
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format").optional(),
  unitTypeId: z.string().regex(objectIdRegex, "Invalid unit type ID format").optional(),
  status: z.nativeEnum(StorageUnitStatusEnum).optional(),
  floor: z.coerce.number().int().min(1).optional(),
  zone: z.string().optional(),
  unitNumber: z.string().optional(),
  sortBy: z.enum(["unitNumber", "floor", "status", "createdAt", "updatedAt"]).default("createdAt"),
});

export const availableStorageUnitQuerySchema = z.object({
  unitTypeId: z.string().regex(objectIdRegex, "Invalid unit type ID format").optional(),
  floor: z.coerce.number().int().min(1).optional(),
  zone: z.string().optional(),
});

export type CreateStorageUnitRequest = z.infer<typeof createStorageUnitSchema>;
export type UpdateStorageUnitRequest = z.infer<typeof updateStorageUnitSchema>;
export type ToggleMaintenanceRequest = z.infer<typeof toggleMaintenanceSchema>;
export type StorageUnitQuery = z.infer<typeof storageUnitQuerySchema>;
export type AvailableStorageUnitQuery = z.infer<typeof availableStorageUnitQuerySchema>;
```

---

### 2. StorageRack Request Schemas (`src/modules/storageRack/schemas/storageRack.request.schema.ts`)

```ts
import z from "zod";
import { paginationQuerySchema } from "../../../common/schemas/pagination.schema.ts";
import {
  RackStatusEnum,
  RackTierStatusEnum,
  RackZoneEnum,
} from "../../../common/enums/storageRack.enum.ts";

const dimensionsSchema = z.object({
  length: z.number().positive("Length must be greater than 0"),
  width: z.number().positive("Width must be greater than 0"),
  height: z.number().positive("Height must be greater than 0"),
});

export const createStorageRackSchema = z.object({
  storageUnitId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format"),
  rackCode: z
    .string()
    .min(1, "Rack code is required")
    .max(20, "Rack code cannot exceed 20 characters")
    .trim(),
  aisle: z.string().trim().toUpperCase().optional(),
  bay: z.number().int().min(1).optional(),
  zone: z.enum(RackZoneEnum).optional(),
  customPrice: z.number().min(0).nullable().optional(),
  name: z.string().max(100).optional(),
  tierCount: z
    .number()
    .int("Tier count must be an integer")
    .min(1, "Tier count must be at least 1")
    .default(1),
  status: z.enum(RackStatusEnum).optional(),
  notes: z.string().max(1000).optional(),
  defaultTierMaxWeightKg: z.number().positive().optional(),
  defaultTierDimensions: dimensionsSchema.optional(),
});

export const updateStorageRackSchema = z.object({
  name: z.string().max(100).optional(),
  aisle: z.string().trim().toUpperCase().optional(),
  bay: z.number().int().min(1).optional(),
  zone: z.enum(RackZoneEnum).optional(),
  customPrice: z.number().min(0).nullable().optional(),
  status: z.enum(RackStatusEnum).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateRackTierSchema = z.object({
  maxWeightKg: z.number().positive().optional(),
  dimensions: dimensionsSchema.optional(),
  status: z.enum(RackTierStatusEnum).optional(),
  notes: z.string().max(1000).optional(),
});

export const storageRackIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid rack ID format"),
});

export const rackTierIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid rack tier ID format"),
});

export const storageUnitIdParamSchema = z.object({
  unitId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format"),
});

export const storageRackQuerySchema = paginationQuerySchema.extend({
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid facility ID format")
    .optional(),
  storageUnitId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid storage unit ID format")
    .optional(),
  status: z.enum(RackStatusEnum).optional(),
  rackCode: z.string().optional(),
  aisle: z.string().optional(),
  zone: z.enum(RackZoneEnum).optional(),
  sortBy: z
    .enum(["rackCode", "aisle", "bay", "tierCount", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateStorageRackRequest = z.infer<typeof createStorageRackSchema>;
export type UpdateStorageRackRequest = z.infer<typeof updateStorageRackSchema>;
export type UpdateRackTierRequest = z.infer<typeof updateRackTierSchema>;
export type StorageRackIdParam = z.infer<typeof storageRackIdParamSchema>;
export type RackTierIdParam = z.infer<typeof rackTierIdParamSchema>;
export type StorageUnitIdParam = z.infer<typeof storageUnitIdParamSchema>;
export type StorageRackQuery = z.infer<typeof storageRackQuerySchema>;
```

---

## Response Shapes (Thêm vào `packages/shared/src/types/`)

Mọi API đều trả về bọc trong `ApiResponse<T>`.

### 1. StorageUnit Response Shapes (`src/modules/storageUnit/schemas/storageUnit.response.schema.ts`)

```ts
export interface FacilitySnapshot {
  id: string;
  name: string;
  city: string;
  address: string;
  status: "active" | "inactive" | "under_maintenance";
}

export interface UnitTypeSnapshot {
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
}

export interface StorageUnitResponse {
  id: string;
  facilityId: string;
  unitTypeId: string;
  unitNumber: string;
  floor: number;
  zone?: string | null;
  status:
    "available" | "reserved" | "occupied" | "under_maintenance" | "inactive" | "pending_clearance";
  images: string[];
  notes?: string | null;
  facility?: FacilitySnapshot | null;
  unitType?: UnitTypeSnapshot | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Đối với API Reconcile
export interface ReconcileStorageUnitsResponse {
  reconciledCount: number;
  details: Array<{
    unitId: string;
    unitNumber: string;
    facilityId: string;
  }>;
}
```

### 2. StorageRack & RackTier Response Shapes (`src/modules/storageRack/schemas/storageRack.response.schema.ts`)

```ts
export interface RackTierResponse {
  id: string;
  facilityId: string;
  storageUnitId: string;
  storageRackId: string;
  tierNumber: number;
  tierCode: string; // e.g. "RK-01-T1"
  maxWeightKg?: number | null;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  } | null;
  volume?: number | null;
  status: "available" | "occupied" | "maintenance" | "inactive";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageRackResponse {
  id: string;
  facilityId: string;
  storageUnitId: string;
  rackCode: string; // e.g. "RK-01"
  aisle?: string | null; // e.g. "A"
  bay?: number | null; // e.g. 1
  zone?: "PRIME" | "STANDARD" | "ECONOMY" | null;
  customPrice?: number | null; // Đơn giá thuê riêng theo tháng nếu có
  currentContractId?: string | null;
  currentCustomerId?: string | null;
  name?: string | null;
  tierCount: number;
  status: "available" | "reserved" | "rented" | "active" | "maintenance" | "inactive";
  notes?: string | null;
  tiers?: RackTierResponse[] | null;
  facility?: {
    id: string;
    name: string;
    city?: string;
    address?: string;
    status?: string;
  } | null;
  storageUnit?: {
    id: string;
    unitNumber: string;
    floor?: number;
    zone?: string;
    status?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## Enums (Cập nhật `packages/shared/src/enums/`)

### 1. `StorageUnitStatusEnum` (`src/common/enums/storageUnit.enum.ts`)

```ts
export enum StorageUnitStatusEnum {
  AVAILABLE = "available",
  RESERVED = "reserved",
  OCCUPIED = "occupied",
  UNDER_MAINTENANCE = "under_maintenance",
  INACTIVE = "inactive",
  PENDING_CLEARANCE = "pending_clearance",
}
```

### 2. `RackStatusEnum`, `RackTierStatusEnum`, `RackZoneEnum` (`src/common/enums/storageRack.enum.ts`)

```ts
export enum RackZoneEnum {
  PRIME = "PRIME",
  STANDARD = "STANDARD",
  ECONOMY = "ECONOMY",
}

export enum RackStatusEnum {
  AVAILABLE = "available",
  RESERVED = "reserved",
  RENTED = "rented",
  ACTIVE = "active", // Tương thích ngược
  MAINTENANCE = "maintenance",
  INACTIVE = "inactive",
}

export enum RackTierStatusEnum {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  MAINTENANCE = "maintenance",
  INACTIVE = "inactive",
}
```

### 3. `RentalTargetTypeEnum` (`src/common/enums/rental.enum.ts`)

```ts
export enum RentalTargetTypeEnum {
  STORAGE_UNIT = "storage_unit",
  STORAGE_RACK = "storage_rack",
}
```

---

## Ma trận Hành động theo Trạng thái Phòng kho & Kệ

### A. Vòng đời Trạng thái Phòng kho (`StorageUnit`)

| Trạng thái hiện tại | Thao tác kích hoạt                      | Trạng thái tiếp theo                 | Role được phép          | Ghi chú điều kiện                                                                                    |
| :------------------ | :-------------------------------------- | :----------------------------------- | :---------------------- | :--------------------------------------------------------------------------------------------------- |
| `available`         | Khách đặt Reservation / Tạo Walk-in     | `reserved`                           | customer, staff         | Khóa nguyên tử 15 phút hoặc chờ check-in.                                                            |
| `available`         | Staff bật bảo trì (`toggleMaintenance`) | `under_maintenance`                  | staff, manager, admin   | Vệ sinh, khử trùng, sửa chữa thiết bị.                                                               |
| `reserved`          | Khách thanh toán & Check-in hợp đồng    | `occupied`                           | facility_manager        | Bắt buộc hợp đồng chuyển `ACTIVE`.                                                                   |
| `reserved`          | Hủy đơn / Hết hạn 15p / Hủy Walk-in     | `available`                          | system, customer, staff | Nhả kho tự động về trạng thái trống.                                                                 |
| `occupied`          | Nghiệm thu trả kho (`check-out`)        | `available` hoặc `under_maintenance` | staff, manager          | Nếu kho có hư hại chuyển sang bảo trì.                                                               |
| `occupied`          | Chấm dứt hợp đồng an toàn (`terminate`) | `pending_clearance`                  | manager, ops, admin     | Chờ dọn dẹp hàng bỏ lại / xử lý niêm phong tài sản.                                                  |
| `under_maintenance` | Staff tắt bảo trì (`toggleMaintenance`) | `available`                          | staff, manager, admin   | **Chặn nếu kho còn hàng tồn của khách** (`629`).                                                     |
| `pending_clearance` | Chuyển sang bảo trì                     | `under_maintenance`                  | staff, manager, admin   | **Bắt buộc số lượng hàng tồn bằng 0** (`countRemaining == 0`). Nghiêm cấm nhảy cóc sang `available`. |

### B. Vòng đời Trạng thái Kệ kho (`StorageRack`)

| Trạng thái hiện tại | Thao tác kích hoạt                | Trạng thái tiếp theo | Ghi chú điều kiện                              |
| :------------------ | :-------------------------------- | :------------------- | :--------------------------------------------- |
| `available`         | Đặt thuê kệ (`rentedRackIds`)     | `reserved`           | Phòng kho phòng chung vẫn giữ `AVAILABLE`.     |
| `reserved`          | Check-in hợp đồng thuê kệ         | `rented`             | Gán `currentContractId` & `currentCustomerId`. |
| `reserved`          | Hủy đơn đặt chỗ                   | `available`          | Nhả kệ về trống.                               |
| `rented`            | Check-out hợp đồng hoặc Terminate | `available`          | Dọn sạch liên kết hợp đồng.                    |

---

## Error Codes & Thông báo liên quan

| Message Code       | HTTP | Mẫu EN                                                                               | Mẫu VI (đề xuất)                                                                          | Ngữ cảnh ném lỗi                                                  |
| :----------------- | :--- | :----------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| `MESSAGE_CODE_001` | 200  | Operation successful                                                                 | Thao tác thành công                                                                       | Query danh sách, chi tiết, map layout.                            |
| `MESSAGE_CODE_002` | 201  | {0} created successfully                                                             | Tạo {0} thành công                                                                        | Tạo kho/kệ mới.                                                   |
| `MESSAGE_CODE_003` | 200  | {0} updated successfully                                                             | Cập nhật {0} thành công                                                                   | Cập nhật kho, đổi trạng thái bảo trì.                             |
| `MESSAGE_CODE_004` | 200  | {0} deleted successfully                                                             | Xóa {0} thành công                                                                        | Xóa mềm kho/kệ.                                                   |
| `MESSAGE_CODE_629` | 400  | Cannot change maintenance status or clear unit while customer inventory items remain | Không thể đổi trạng thái bảo trì hoặc mở kho khi vẫn còn hàng tồn kho của khách bên trong | Bật bảo trì từ `pending_clearance` hoặc tắt bảo trì khi còn hàng. |
| `MESSAGE_CODE_104` | 404  | {0} not found                                                                        | Không tìm thấy {0}                                                                        | Sai ID phòng kho hoặc kệ.                                         |
| `MESSAGE_CODE_105` | 400  | {0} already exists                                                                   | {0} đã tồn tại                                                                            | Trùng mã số phòng `unitNumber` trong cùng cơ sở.                  |

---

## Quy tắc Validate & Hướng dẫn UI/UX Sơ đồ Bản đồ 2D

1. **Hiển thị Mặt bằng 2D (`GET /storage-units/facility/{facilityId}/map-layout`):**
   - API trả về mảng tất cả các phòng kho của cơ sở kèm: `unitNumber`, `floor`, `zone`, `status`, `unitType` (kích thước `dimensions: { length, width, height }`).
   - Frontend gom nhóm theo tầng (`floor`) và khu vực (`zone`) để hiển thị dạng lưới (Grid Map) hoặc bản đồ Vector:
     - Xanh lá (`#22c55e`): `available` ➔ Cho phép khách click để chọn đặt chỗ.
     - Vàng cam (`#f59e0b`): `reserved` ➔ Đang có người giữ chỗ hoặc đang làm thủ tục.
     - Đỏ tím (`#ef4444`): `occupied` ➔ Đang có khách thuê lưu kho.
     - Xám chì (`#64748b`): `under_maintenance` ➔ Đang bảo trì, không thể bấm chọn.
     - Đỏ thẫm viền sọc (`#7f1d1d`): `pending_clearance` ➔ Đang niêm phong / chờ xử lý đồ bỏ lại.
2. **Cơ chế Thuê Kệ kho (`RentalTargetTypeEnum.STORAGE_RACK`):**
   - Nếu khách chọn loại kho có `category === 'warehouse_rack'`:
     - Gọi `GET /storage-racks/unit/{unitId}` để lấy danh sách các kệ kho bên trong.
     - Hiển thị theo dãy (`aisle`) và vị trí (`bay`), kèm huy hiệu zone (`PRIME`, `STANDARD`, `ECONOMY`).
     - Cho phép khách chọn nhiều kệ (`rentedRackIds: string[]`), tính tổng tiền cọc và tiền thuê dựa trên `customPrice` (nếu có) hoặc giá zone của cơ sở.
3. **Đối soát kho mồ côi (`POST /storage-units/reconcile`):**
   - Nút chức năng trên Dashboard của Business Ops Manager / System Admin.
   - Nhấn nút sẽ kích hoạt hệ thống rà quét tự động các phòng kho mang trạng thái `RESERVED` nhưng không có bất kỳ Reservation hay Contract nào đang active tương ứng và tự động trả về `AVAILABLE`.

---

## Hành vi UI/UX Mong muốn (Người dùng cung cấp)

- Làm mới (`invalidateQueries`) sau khi thành công: `['storageUnits']`, `['storageUnitMapLayout']`, `['availableUnits']`, `['storageRacks']`.
- Thông báo hoặc chuyển trang: [Cần người dùng bổ sung]
- Khóa dịch cần thêm: [Cần người dùng bổ sung]

---

## Thay đổi so với Contract trước

- **Bổ sung trạng thái `pending_clearance`** vào `StorageUnitStatusEnum` (thuộc task T2.10 chấm dứt hợp đồng an toàn).
- **Bổ sung endpoint `POST /storage-units/reconcile`** (T3.5 đối soát kho mồ côi).
- **Thêm chốt chặn nghiệp vụ `MESSAGE_CODE_629`** trên `toggleMaintenance` ngăn chuyển trạng thái khi kho còn hàng tồn.
- **Hỗ trợ đầy đủ luồng thuê kệ kho `StorageRack`** (`GET /storage-racks/unit/:unitId` và `rentedRackIds` cho Reservation/Contract).
