import { FacilityKpiTierEnum, StatisticsGranularityEnum } from "../enums/statistics.enum";
import { BillingUnitEnum, InvoiceItemTypeEnum } from "../enums/billing.enum";
import { PaymentMethodEnum, PaymentTransactionResultEnum } from "../enums/payment.enum";
import { RefundRequestReasonEnum } from "../enums/refundRequest.enum";
import { UnitTypeCategoryEnum } from "../enums/unitType.enum";
import { RackZoneEnum } from "../enums/storageRack.enum";

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
