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

export enum RagQueryComplexityEnum {
  SIMPLE = "simple",
  COMPLEX = "complex",
}

export enum RagGroundingStatusEnum {
  GROUNDED = "grounded",
  INSUFFICIENT_DATA = "insufficient_data",
  OUT_OF_SCOPE_REJECTED = "out_of_scope_rejected",
}

export enum AiInsightCategoryEnum {
  PRICING_AND_PROMOTION = "pricing_and_promotion",
  OCCUPANCY_AND_CAPACITY = "occupancy_and_capacity",
  UPSELL_AND_PRODUCT_MIX = "upsell_and_product_mix",
  CASHFLOW_AND_DEBT = "cashflow_and_debt",
  OPERATIONS_AND_SLA = "operations_and_sla",
}

export enum AiInsightPriorityEnum {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum AiInsightFocusAreaEnum {
  ALL = "all",
  REVENUE_GROWTH = "revenue_growth",
  OCCUPANCY = "occupancy",
  DEBT_COLLECTION = "debt_collection",
  OPERATIONAL_EFFICIENCY = "operational_efficiency",
}

export enum AiAdvisorProviderEnum {
  GEMINI = "gemini",
  GROUNDED_DETERMINISTIC_FALLBACK = "grounded_deterministic_fallback",
}

export enum RagChunkTypeEnum {
  OVERVIEW = "overview",
  RENTAL_TRENDS = "rental_trends",
  FACILITY_KPI = "facility_kpi",
  FINANCIAL_ANALYTICS = "financial_analytics",
  PRODUCT_AND_OPERATIONS = "product_and_operations",
  PLAYBOOK_PRICING = "playbook_pricing",
  PLAYBOOK_DEBT = "playbook_debt",
  PLAYBOOK_OPERATIONS = "playbook_operations",
  PLAYBOOK_UPSELL = "playbook_upsell",
}

export const RAG_CHUNK_TYPE_LABELS_VN: Record<RagChunkTypeEnum, string> = {
  [RagChunkTypeEnum.OVERVIEW]: "Báo cáo Tổng quan Điều hành & Lợi nhuận",
  [RagChunkTypeEnum.RENTAL_TRENDS]: "Báo cáo Xu hướng Thời gian & Nhu cầu Thuê",
  [RagChunkTypeEnum.FACILITY_KPI]: "Bảng điểm KPI & Hiệu suất Chi nhánh",
  [RagChunkTypeEnum.FINANCIAL_ANALYTICS]: "Báo cáo Phân tích Tài chính, Dòng tiền & Tuổi nợ",
  [RagChunkTypeEnum.PRODUCT_AND_OPERATIONS]: "Báo cáo Hiệu suất Sản phẩm & Phễu Vận hành",
  [RagChunkTypeEnum.PLAYBOOK_PRICING]: "Cẩm nang Chiến lược Giá & Tối ưu Công suất",
  [RagChunkTypeEnum.PLAYBOOK_DEBT]: "Quy định Quản trị Công nợ & Xử lý Vi phạm",
  [RagChunkTypeEnum.PLAYBOOK_OPERATIONS]: "Cẩm nang Giảm Thất thoát & Tối ưu Vận hành",
  [RagChunkTypeEnum.PLAYBOOK_UPSELL]: "Chiến lược Bán kèm Tiện ích & Giữ chân Khách hàng",
};
