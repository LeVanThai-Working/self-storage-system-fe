# MODULE: statistics

Bổ sung hợp đồng dữ liệu cho module này vào `packages/shared`. Phạm vi mặc định chỉ là `packages/shared` (enums, types, schemas, constants, utils); chỉ làm `apps/web` hoặc `apps/mobile` khi mục Phạm vi ghi rõ.
Nếu thiếu thông tin hoặc có mâu thuẫn, hỏi lại, không tự suy đoán.

## Phạm vi

- Nền tảng: `web` (suy ra từ role, cần xác nhận)
- Role và khu vực FE:
  | Role                   | Nền tảng / khu vực FE                                                               |
  | ---------------------- | ----------------------------------------------------------------------------------- |
  | `business_ops_manager` | Web `/business-ops/*` (xem toàn hệ thống hoặc lọc theo `facilityId`)                |
  | `system_admin`         | Web `/system-admin/*` (xem toàn hệ thống hoặc lọc theo `facilityId`)                |
  | `facility_manager`     | Web `/facility-manager/*` (tự động khóa vào `assignedFacilityId` của quản lý cơ sở) |
- Vị trí hiển thị trên UI: [Cần người dùng bổ sung]

## Mô tả

Cung cấp bộ API thống kê điều hành chuỗi kho tự quản cho `business_ops_manager`, `system_admin` và `facility_manager`: tổng quan vận hành & việc cần xử lý (`overview`), xu hướng thuê theo thời gian / giai đoạn cao điểm – thấp điểm / ca giờ (`rental-trends`), bảng xếp hạng & chấm điểm KPI chi nhánh (`facilities-kpi`), phân tích tài chính / tuổi nợ quá hạn / hoàn tiền (`financial-analytics`), và hiệu quả danh mục kho / kệ / tiện ích / phễu đặt chỗ (`product-and-operations`).

## Endpoints

| Method | Path                                 | Mô tả                                                                                                            | Role                                                       | Phân trang |
| ------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| GET    | `/statistics/overview`               | Tổng quan toàn chuỗi, tỷ lệ lấp đầy kho/kệ/diện tích, doanh thu, công nợ, cọc đang giữ và số việc cần xử lý      | `business_ops_manager`, `system_admin`, `facility_manager` | —          |
| GET    | `/statistics/rental-trends`          | Xu hướng thuê theo thời gian, tự động phát hiện giai đoạn cao điểm (`peakPeriods`) & thấp điểm (`lowPeriods`)    | `business_ops_manager`, `system_admin`, `facility_manager` | —          |
| GET    | `/statistics/facilities-kpi`         | Bảng xếp hạng & chấm điểm KPI các chi nhánh (0–100 điểm, 4 trụ cột, phân hạng `kpiTier`, `RevPAU`, `RevPAM`)     | `business_ops_manager`, `system_admin`, `facility_manager` | —          |
| GET    | `/statistics/financial-analytics`    | Phân tích doanh thu theo khoản mục hóa đơn, kênh thanh toán, đối soát SePay, tuổi nợ quá hạn (AR Aging) & hoàn   | `business_ops_manager`, `system_admin`, `facility_manager` | —          |
| GET    | `/statistics/product-and-operations` | Hiệu suất loại kho (`UnitType`), phân khu kệ (`RackZone`), tỷ lệ gắn tiện ích (`Amenity`), phễu đặt chỗ & ra/vào | `business_ops_manager`, `system_admin`, `facility_manager` | —          |

Query cho API `GET /statistics/facilities-kpi`:

- `sortBy` cho phép: `'kpiScore' | 'occupancyRate' | 'collectedRevenue' | 'conversionRate' | 'collectionRate'`, mặc định: `'kpiScore'`
- `sortOrder`: `'asc' | 'desc'`, mặc định: `'desc'`
- `tier` (tùy chọn): `'excellent' | 'good' | 'average' | 'needs_improvement'`
- `city` (tùy chọn): chuỗi tên thành phố (`1..100` ký tự)

Query cho API `GET /statistics/rental-trends` và `GET /statistics/financial-analytics`:

- `granularity` cho phép: `'day' | 'week' | 'month' | 'quarter'`, mặc định: `'day'`

Query chung cho cả 5 API:

- `fromDate` (tùy chọn): chuỗi ngày hợp lệ (`YYYY-MM-DD` hoặc ISO 8601). Mặc định: `toDate - 30 ngày` (theo múi giờ `Asia/Ho_Chi_Minh`).
- `toDate` (tùy chọn): chuỗi ngày hợp lệ (`YYYY-MM-DD` hoặc ISO 8601). Mặc định: ngày hiện tại (theo múi giờ `Asia/Ho_Chi_Minh`).
- `facilityId` (tùy chọn): MongoDB ObjectId (`24` ký tự hex). Nếu caller là `facility_manager`, backend tự động giới hạn vào `assignedFacilityId` và trả `403 MESSAGE_CODE_122` nếu truyền `facilityId` của cơ sở khác.

## Request schema (giữ nguyên, thêm vào `packages/shared/src/schemas/request/`)

Thư viện validate: Zod `^4.6.5` (cùng phiên bản v4 với FE).

### `src/modules/statistics/schemas/statistics.request.schema.ts`

```ts
import { z } from "zod";
import {
  StatisticsGranularityEnum,
  FacilityKpiTierEnum,
  FacilityKpiSortByEnum,
} from "../../../common/enums/statistics.enum.ts";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const statisticsBaseQuerySchema = z.object({
  fromDate: z
    .string()
    .trim()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Invalid fromDate format",
    })
    .optional(),
  toDate: z
    .string()
    .trim()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Invalid toDate format",
    })
    .optional(),
  facilityId: z.string().trim().regex(objectIdRegex, "Invalid facility ID format").optional(),
});

export const rentalTrendsQuerySchema = statisticsBaseQuerySchema.extend({
  granularity: z
    .enum([
      StatisticsGranularityEnum.DAY,
      StatisticsGranularityEnum.WEEK,
      StatisticsGranularityEnum.MONTH,
      StatisticsGranularityEnum.QUARTER,
    ])
    .default(StatisticsGranularityEnum.DAY)
    .optional(),
});

export const facilitiesKpiQuerySchema = statisticsBaseQuerySchema.extend({
  city: z.string().trim().min(1).max(100).optional(),
  tier: z
    .enum([
      FacilityKpiTierEnum.EXCELLENT,
      FacilityKpiTierEnum.GOOD,
      FacilityKpiTierEnum.AVERAGE,
      FacilityKpiTierEnum.NEEDS_IMPROVEMENT,
    ])
    .optional(),
  sortBy: z
    .enum([
      FacilityKpiSortByEnum.KPI_SCORE,
      FacilityKpiSortByEnum.OCCUPANCY_RATE,
      FacilityKpiSortByEnum.COLLECTED_REVENUE,
      FacilityKpiSortByEnum.CONVERSION_RATE,
      FacilityKpiSortByEnum.COLLECTION_RATE,
    ])
    .default(FacilityKpiSortByEnum.KPI_SCORE)
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const financialAnalyticsQuerySchema = statisticsBaseQuerySchema.extend({
  granularity: z
    .enum([
      StatisticsGranularityEnum.DAY,
      StatisticsGranularityEnum.WEEK,
      StatisticsGranularityEnum.MONTH,
      StatisticsGranularityEnum.QUARTER,
    ])
    .default(StatisticsGranularityEnum.DAY)
    .optional(),
});

export type StatisticsBaseQuery = z.infer<typeof statisticsBaseQuerySchema>;
export type RentalTrendsQuery = z.infer<typeof rentalTrendsQuerySchema>;
export type FacilitiesKpiQuery = z.infer<typeof facilitiesKpiQuerySchema>;
export type FinancialAnalyticsQuery = z.infer<typeof financialAnalyticsQuerySchema>;
```

## Response (hình dạng dữ liệu, cập nhật `packages/shared/src/types/`)

Mọi API trả về `ApiResponse<T>`.

- Trường tham chiếu: `scopedFacilityId`, `facility.id`, `unitTypeId`, `amenityId` đều trả về dạng `string` (hoặc `string | null` với `scopedFacilityId`); thông tin định danh (`name`, `code`, `city`, `category`) được trả trực tiếp trong cùng object thống kê.
- Tiền: số nguyên VND (`number` đã `Math.round`). Tỷ lệ phần trăm & điểm KPI: `number` làm tròn tối đa 2 chữ số thập phân. Ngày: chuỗi ISO 8601 (`fromDate`, `toDate`) hoặc nhãn kỳ theo `granularity` (`YYYY-MM-DD`, `YYYY-Www`, `YYYY-MM`, `YYYY-Qn`).

### `GET /statistics/overview` → `OverviewStatisticsResponse`

```ts
export interface OverviewStatisticsResponse {
  period: {
    fromDate: string;
    toDate: string;
    scopedFacilityId: string | null;
  };
  facilities: {
    totalActive: number;
  };
  occupancy: {
    storageUnits: {
      total: number;
      available: number;
      occupied: number;
      reserved: number;
      underMaintenance: number;
      pendingClearance: number;
      inactive: number;
      occupancyRate: number;
      areaOccupancyRate: number;
      totalAreaM2: number;
      occupiedAreaM2: number;
    };
    storageRacks: {
      total: number;
      available: number;
      rented: number;
      reserved: number;
      maintenance: number;
      inactive: number;
      occupancyRate: number;
    };
  };
  financials: {
    collectedRevenue: number;
    previousPeriodCollectedRevenue: number;
    revenueGrowthPercent: number;
    refundedAmount: number;
    netRevenue: number;
    heldDeposits: number;
    overdueReceivables: number;
    forfeitedAmount: number;
  };
  contractsAndBookings: {
    activeContracts: number;
    overdueContracts: number;
    newReservationsInPeriod: number;
    completedReservationsInPeriod: number;
  };
  actionRequired: {
    pendingApprovals: number;
    pendingOpsRefunds: number;
    unmatchedSepayTransactions: number;
    openHighCriticalIncidents: number;
  };
}
```

### `GET /statistics/rental-trends` → `RentalTrendsResponse`

```ts
export interface RentalTrendPoint {
  period: string;
  reservationsCreated: number;
  completedReservations: number;
  cancelledReservations: number;
  contractsCheckedIn: number;
  contractsEnded: number;
  collectedRevenue: number;
  varianceFromAvgPercent: number;
}

export interface DayOfWeekItem {
  dayOfWeek: number; // 1 = Chủ Nhật, 2 = Thứ Hai ... 7 = Thứ Bảy
  dayName: string;
  reservationsCreated: number;
  contractsCheckedIn: number;
  accessSchedulesCount: number;
  totalActivity: number;
}

export interface TimeSlotDemandItem {
  timeSlot: string;
  reservationCount: number;
  completedReservationCount: number;
  accessScheduleCount: number;
  totalDemandCount: number;
  configuredMaxCapacityPerDay: number;
  demandSharePercent: number;
}

export interface HourOfDayItem {
  hour: number; // 0..23 (múi giờ Asia/Ho_Chi_Minh)
  label: string; // "00:00" .. "23:00"
  reservationCount: number;
}

export interface RentalTrendsResponse {
  period: {
    fromDate: string;
    toDate: string;
    granularity: StatisticsGranularityEnum;
    scopedFacilityId: string | null;
  };
  timeSeries: RentalTrendPoint[];
  peakAndLowAnalysis: {
    averageReservationsPerPeriod: number;
    peakPeriods: RentalTrendPoint[];
    lowPeriods: RentalTrendPoint[];
  };
  dayOfWeekDistribution: {
    busiestDay: DayOfWeekItem | null;
    quietestDay: DayOfWeekItem | null;
    items: DayOfWeekItem[];
  };
  timeSlotDemand: TimeSlotDemandItem[];
  hourOfDayDistribution: HourOfDayItem[];
  durationBreakdown: {
    byBillingUnit: Array<{
      billingUnit: BillingUnitEnum;
      reservationCount: number;
      sharePercent: number;
      totalDepositAmount: number;
    }>;
    byDurationBucket: Array<{
      bucket: string; // 'short_term_lte_14d' | '1_month' | '2_to_3_months' | '4_to_6_months' | 'long_term_gt_6m'
      label: string;
      reservationCount: number;
      sharePercent: number;
    }>;
  };
}
```

### `GET /statistics/facilities-kpi` → `FacilitiesKpiResponse`

```ts
export interface FacilityKpiItem {
  rank: number;
  facility: {
    id: string;
    code: string | null;
    name: string;
    city: string;
    status: string;
  };
  kpiScore: number;
  kpiTier: FacilityKpiTierEnum;
  componentScores: {
    occupancyScore: number;
    collectionScore: number;
    conversionAndRetentionScore: number;
    operationalQualityScore: number;
  };
  occupancy: {
    totalActiveUnits: number;
    occupiedOrReservedUnits: number;
    maintenanceOrClearanceUnits: number;
    unitOccupancyRate: number;
    maintenanceDragRate: number;
    totalActiveRacks: number;
    rentedOrReservedRacks: number;
    rackOccupancyRate: number;
    areaOccupancyRate: number;
  };
  financial: {
    collectedRevenue: number;
    refundedAmount: number;
    netRevenue: number;
    revPAU: number;
    revPAM: number;
    invoicedAmount: number;
    overdueAmount: number;
    invoiceCollectionRate: number;
  };
  conversionAndRetention: {
    reservationsCreated: number;
    reservationsPaid: number;
    reservationsCompleted: number;
    reservationConversionRate: number;
    contractsCreated: number;
    walkInContracts: number;
    walkInRatioPercent: number;
    renewedContracts: number;
    renewalRate: number;
  };
  operations: {
    facilityFaultCount: number;
    totalIncidents: number;
    openIncidents: number;
    facilityLiableIncidents: number;
    totalRepairCost: number;
    avgReservationConfirmMinutes: number | null;
    avgIncidentResolveHours: number | null;
    supportCompletionRate: number;
  };
  alerts: string[];
}

export interface FacilitiesKpiResponse {
  period: {
    fromDate: string;
    toDate: string;
    scopedFacilityId: string | null;
  };
  summary: {
    totalFacilitiesEvaluated: number;
    averageKpiScore: number;
    excellentCount: number;
    goodCount: number;
    averageCount: number;
    needsImprovementCount: number;
  };
  highlights: {
    topPerformers: FacilityKpiItem[];
    underperformers: FacilityKpiItem[];
  };
  items: FacilityKpiItem[];
}
```

### `GET /statistics/financial-analytics` → `FinancialAnalyticsResponse`

```ts
export interface FinancialAnalyticsResponse {
  period: {
    fromDate: string;
    toDate: string;
    granularity: StatisticsGranularityEnum;
    scopedFacilityId: string | null;
  };
  revenueTimeSeries: Array<{
    period: string;
    invoicedAmount: number;
    collectedAmount: number;
    refundedAmount: number;
    netCollectedAmount: number;
  }>;
  revenueByItemType: Array<{
    itemType: InvoiceItemTypeEnum;
    invoicedAmount: number;
    paidAmount: number;
    itemCount: number;
    sharePercent: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: PaymentMethodEnum;
    count: number;
    totalPaidAmount: number;
    sharePercent: number;
  }>;
  sepayReconciliation: Array<{
    result: PaymentTransactionResultEnum;
    count: number;
    totalTransferAmount: number;
  }>;
  overdueAging: {
    totalOverdueInvoices: number;
    totalOverdueAmount: number;
    buckets: Array<{
      bucket: string; // '1_to_3_days' | '4_to_7_days' | '8_to_15_days' | 'over_15_days'
      label: string;
      invoiceCount: number;
      overdueAmount: number;
    }>;
  };
  refundAnalytics: {
    totalRequests: number;
    totalRequestedAmount: number;
    totalPaidAmount: number;
    byReason: Array<{
      reason: RefundRequestReasonEnum;
      count: number;
      totalAmount: number;
      paidAmount: number;
    }>;
  };
}
```

### `GET /statistics/product-and-operations` → `ProductAndOperationsResponse`

```ts
export interface ProductAndOperationsResponse {
  period: {
    fromDate: string;
    toDate: string;
    scopedFacilityId: string | null;
  };
  unitTypePerformance: Array<{
    unitTypeId: string;
    name: string;
    category: UnitTypeCategoryEnum;
    area: number;
    totalUnits: number;
    availableUnits: number;
    occupiedOrReservedUnits: number;
    maintenanceUnits: number;
    occupancyRate: number;
    activeContractCount: number;
    periodicRevenue: number;
  }>;
  rackZonePerformance: Array<{
    zone: RackZoneEnum;
    totalRacks: number;
    availableRacks: number;
    rentedRacks: number;
    reservedRacks: number;
    maintenanceRacks: number;
    occupancyRate: number;
  }>;
  amenityPerformance: {
    totalOfferings: number;
    totalQuantity: number;
    inUseQuantity: number;
    utilizationRate: number;
    contractAttachRate: number;
    topAmenities: Array<{
      amenityId: string;
      name: string;
      totalQuantity: number;
      totalRevenue: number;
    }>;
  };
  bookingFunnel: {
    totalCreated: number;
    paidCount: number;
    confirmedCount: number;
    arrivedCount: number;
    completedCount: number;
    expiredCount: number;
    cancelledCount: number;
    facilityFaultCancelCount: number;
    overdueCount: number;
    overallConversionRate: number;
  };
  warehouseTraffic: {
    accessSchedules: {
      totalScheduled: number;
      completedCount: number;
      noShowCount: number;
      cancelledCount: number;
      totalVisitors: number;
      completionRate: number;
    };
    inventoryMovements: {
      inboundCount: number;
      inboundQuantity: number;
      outboundCount: number;
      outboundQuantity: number;
      moveCount: number;
      adjustCount: number;
    };
  };
}
```

## Enums (cập nhật `packages/shared/src/enums/`)

### `StatisticsGranularityEnum`, `FacilityKpiTierEnum`, `FacilityKpiSortByEnum` (File BE: `src/common/enums/statistics.enum.ts`)

```ts
export enum StatisticsGranularityEnum {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  QUARTER = "quarter",
}

export enum FacilityKpiTierEnum {
  EXCELLENT = "excellent",
  GOOD = "good",
  AVERAGE = "average",
  NEEDS_IMPROVEMENT = "needs_improvement",
}

export enum FacilityKpiSortByEnum {
  KPI_SCORE = "kpiScore",
  OCCUPANCY_RATE = "occupancyRate",
  COLLECTED_REVENUE = "collectedRevenue",
  CONVERSION_RATE = "conversionRate",
  COLLECTION_RATE = "collectionRate",
}
```

## Error codes và thông báo (cập nhật `MESSAGE_CODE`, `MESSAGE_DICTIONARY_EN/VI`, `ENTITY_SUBJECT_DICTIONARY`)

| Message Code     | HTTP | Mẫu EN                                                        | Mẫu VI (đề xuất, cần xác nhận)                                               | Chủ thể `{0}` |
| ---------------- | ---- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------- |
| MESSAGE_CODE_820 | 400  | Invalid Statistics Date Range Or Exceeds Maximum Allowed Days | Khoảng thời gian thống kê không hợp lệ hoặc vượt quá số ngày tối đa cho phép | —             |
| MESSAGE_CODE_102 | 401  | Unauthorized Access                                           | Truy cập trái phép (chưa xác thực)                                           | —             |
| MESSAGE_CODE_103 | 403  | Access Denied                                                 | Từ chối truy cập (không có quyền xem thống kê)                               | —             |
| MESSAGE_CODE_122 | 403  | {0} Is Not Assigned To This Facility                          | {0} không được phân công phụ trách cơ sở này                                 | User          |

## Quy tắc validate/nghiệp vụ bổ sung (không nằm trong schema)

- **Giới hạn khoảng ngày truy vấn:** `fromDate` không được lớn hơn `toDate`, và tổng số ngày truy vấn không được vượt quá `366` ngày (mặc định `STATISTICS_MAX_RANGE_DAYS = 366`). Nếu vi phạm sẽ trả lỗi `400 MESSAGE_CODE_820`.
- **Chuẩn hóa múi giờ Việt Nam (`Asia/Ho_Chi_Minh`):** `fromDate` được chuẩn hóa về `00:00:00.000` giờ VN và `toDate` được chuẩn hóa về `23:59:59.999` giờ VN. Nếu không truyền `fromDate`/`toDate`, mặc định lấy `30` ngày gần nhất tính đến cuối ngày hôm nay theo giờ VN.
- **Quy tắc phát hiện giai đoạn cao điểm (`peakPeriods`) & thấp điểm (`lowPeriods`):**
  - Tính trung bình số đơn đặt chỗ trên các kỳ có phát sinh hoạt động (`averageReservationsPerPeriod`).
  - `peakPeriods`: các kỳ có `reservationsCreated >= averageReservationsPerPeriod * 1.25` (tối thiểu `>= 1`), sắp xếp giảm dần theo nhu cầu.
  - `lowPeriods`: các kỳ có `reservationsCreated <= averageReservationsPerPeriod * 0.75`, sắp xếp tăng dần theo nhu cầu.
- **Công thức chấm điểm KPI chi nhánh (`kpiScore` thang 0–100):**
  - 4 trụ cột: Hiệu suất lấp đầy (`30%`, mục tiêu chuẩn `80%`), Hiệu quả thu phí & kiểm soát nợ (`25%`), Chuyển đổi & giữ chân khách hàng (`20%`, mục tiêu chuyển đổi `70%`), Chất lượng vận hành & SLA (`25%`, trừ điểm khi có hủy do lỗi cơ sở `FACILITY_FAULT`, sự cố `FACILITY_LIABLE` hoặc trễ SLA).
  - Phân hạng `kpiTier`: `excellent` (`>= 85`), `good` (`70` – `< 85`), `average` (`50` – `< 70`), `needs_improvement` (`< 50`).

## Hành vi UI/UX mong muốn (người dùng cung cấp)

- Làm mới (`invalidateQueries`) sau khi thành công: [Cần người dùng bổ sung]
- Thông báo hoặc chuyển trang: [Cần người dùng bổ sung]
- Khóa dịch cần thêm vào `messages/{vi,en}.json` hoặc `locales/{vi,en}.json`: [Cần người dùng bổ sung]

## Thay đổi so với contract trước

- Không có (module mới `statistics`).
