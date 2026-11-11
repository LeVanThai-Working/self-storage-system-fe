import api from "@/lib/api/axios";
import type { ApiResponse } from "@self-storage-system-fe/shared";
import type {
  FacilitiesKpiQuery,
  FacilitiesKpiResponse,
  FinancialAnalyticsQuery,
  FinancialAnalyticsResponse,
  OverviewStatisticsResponse,
  ProductAndOperationsQuery,
  ProductAndOperationsResponse,
  RentalTrendsQuery,
  RentalTrendsResponse,
  StatisticsBaseQuery,
  RagAdvisorRequest,
  RagAdvisorResponse,
  RagEvalResponse,
} from "./types";

/**
 * GET /statistics/overview - Tổng quan toàn chuỗi, tỷ lệ lấp đầy, doanh thu, công nợ, cọc và việc cần xử lý
 */
export async function fetchOverviewStatistics(
  params?: StatisticsBaseQuery
): Promise<OverviewStatisticsResponse> {
  const { data } = await api.get<ApiResponse<OverviewStatisticsResponse>>("/statistics/overview", {
    params,
  });
  return data.data;
}

/**
 * GET /statistics/rental-trends - Xu hướng thuê theo thời gian, phát hiện giai đoạn cao điểm/thấp điểm
 */
export async function fetchRentalTrends(params?: RentalTrendsQuery): Promise<RentalTrendsResponse> {
  const { data } = await api.get<ApiResponse<RentalTrendsResponse>>("/statistics/rental-trends", {
    params,
  });
  return data.data;
}

/**
 * GET /statistics/facilities-kpi - Bảng xếp hạng & chấm điểm KPI chi nhánh (0–100 điểm, 4 trụ cột)
 */
export async function fetchFacilitiesKpi(
  params?: FacilitiesKpiQuery
): Promise<FacilitiesKpiResponse> {
  const { data } = await api.get<ApiResponse<FacilitiesKpiResponse>>("/statistics/facilities-kpi", {
    params,
  });
  return data.data;
}

/**
 * GET /statistics/financial-analytics - Phân tích doanh thu, đối soát SePay, tuổi nợ quá hạn & hoàn tiền
 */
export async function fetchFinancialAnalytics(
  params?: FinancialAnalyticsQuery
): Promise<FinancialAnalyticsResponse> {
  const { data } = await api.get<ApiResponse<FinancialAnalyticsResponse>>(
    "/statistics/financial-analytics",
    { params }
  );
  return data.data;
}

/**
 * GET /statistics/product-and-operations - Hiệu suất loại kho, phân khu kệ, tiện ích, phễu đặt chỗ & ra vào
 */
export async function fetchProductAndOperations(
  params?: ProductAndOperationsQuery
): Promise<ProductAndOperationsResponse> {
  const { data } = await api.get<ApiResponse<ProductAndOperationsResponse>>(
    "/statistics/product-and-operations",
    { params }
  );
  return data.data;
}

/**
 * POST /statistics/ai-rag-advisor - Gửi câu hỏi cho Trợ lý RAG phân tích số liệu, trả về cơ hội dòng tiền, khuyến nghị và trích dẫn nguồn
 */
export async function askRagAdvisor(payload: RagAdvisorRequest): Promise<RagAdvisorResponse> {
  const { data } = await api.post<ApiResponse<RagAdvisorResponse>>(
    "/statistics/ai-rag-advisor",
    payload
  );
  return data.data;
}

/**
 * GET /statistics/ai-rag-eval - Chạy bộ kiểm định chất lượng tự động 10 kịch bản (Golden Dataset) đo lường độ chính xác RAG
 */
export async function fetchRagEval(): Promise<RagEvalResponse> {
  const { data } = await api.get<ApiResponse<RagEvalResponse>>("/statistics/ai-rag-eval");
  return data.data;
}
