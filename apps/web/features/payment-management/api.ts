import api from "@/lib/api/axios";
import type { ApiResponse } from "@self-storage-system-fe/shared";
import type {
  AssignUnmatchedTransactionRequest,
  CancelPaymentRequest,
  ConfirmManualPaymentRequest,
  CreatePaymentRequest,
  PaymentPaginatedData,
  PaymentQuery,
  PaymentResponse,
  PaymentTransactionPaginatedData,
  UnmatchedTransactionQuery,
} from "./types";

/**
 * GET /payments - Danh sách đơn thanh toán có phân trang và bộ lọc
 */
export async function fetchPayments(params?: PaymentQuery): Promise<PaymentPaginatedData> {
  const { data } = await api.get<ApiResponse<PaymentPaginatedData>>("/payments", {
    params,
  });
  return data.data;
}

/**
 * GET /payments/{id} - Chi tiết đơn thanh toán (dùng để polling kiểm tra trạng thái và lấy link QR)
 */
export async function fetchPaymentById(id: string): Promise<PaymentResponse> {
  const { data } = await api.get<ApiResponse<PaymentResponse>>(`/payments/${id}`);
  return data.data;
}

/**
 * POST /payments - Tạo hoặc lấy lại đơn thanh toán đang chờ kèm link VietQR động
 */
export async function createPayment(payload: CreatePaymentRequest): Promise<PaymentResponse> {
  const { data } = await api.post<ApiResponse<PaymentResponse>>("/payments", payload);
  return data.data;
}

/**
 * POST /payments/{id}/cancel - Hủy đơn thanh toán khi còn ở trạng thái pending
 */
export async function cancelPayment(
  id: string,
  payload: CancelPaymentRequest
): Promise<PaymentResponse> {
  const { data } = await api.post<ApiResponse<PaymentResponse>>(`/payments/${id}/cancel`, payload);
  return data.data;
}

/**
 * POST /payments/{id}/confirm-manual - Xác nhận thanh toán trực tiếp tại quầy bằng tiền mặt/chuyển khoản (kèm ảnh biên lai)
 */
export async function confirmManualPayment(
  id: string,
  payload: ConfirmManualPaymentRequest
): Promise<PaymentResponse> {
  const { data } = await api.post<ApiResponse<PaymentResponse>>(
    `/payments/${id}/confirm-manual`,
    payload
  );
  return data.data;
}

/**
 * GET /payments/transactions/unmatched - Danh sách giao dịch ngân hàng không khớp mã (UNMATCHED) để đối soát
 */
export async function fetchUnmatchedTransactions(
  params?: UnmatchedTransactionQuery
): Promise<PaymentTransactionPaginatedData> {
  const { data } = await api.get<ApiResponse<PaymentTransactionPaginatedData>>(
    "/payments/transactions/unmatched",
    { params }
  );
  return data.data;
}

/**
 * POST /payments/transactions/{id}/assign - Gán thủ công giao dịch không khớp vào đơn thanh toán chỉ định
 */
export async function assignUnmatchedTransaction(
  transactionId: string,
  payload: AssignUnmatchedTransactionRequest
): Promise<PaymentResponse> {
  const { data } = await api.post<ApiResponse<PaymentResponse>>(
    `/payments/transactions/${transactionId}/assign`,
    payload
  );
  return data.data;
}

/**
 * POST /payments/process-expired - Quét và hết hạn các đơn thanh toán pending đã quá hạn (Batch / Cron)
 */
export async function processExpiredPayments(): Promise<{
  processedCount?: number;
  message?: string;
}> {
  const { data } = await api.post<ApiResponse<{ processedCount?: number; message?: string }>>(
    "/payments/process-expired"
  );
  return data.data;
}
