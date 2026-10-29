import api from "@/lib/api/axios";
import {
  cleanQueryParams,
  type ApiResponse,
  type CreateCustomerSkuRequest,
  type CustomerSkuQuery,
  type CustomerSkuResponse,
  type PaginatedData,
  type UpdateCustomerSkuRequest,
} from "@self-storage-system-fe/shared";

/** GET /customer-skus — the customer's own SKU catalog (BE scopes it to the caller). */
export async function getCustomerSkusApi(
  query: Partial<CustomerSkuQuery>
): Promise<PaginatedData<CustomerSkuResponse>> {
  const response = await api.get<ApiResponse<PaginatedData<CustomerSkuResponse>>>(
    "/customer-skus",
    { params: cleanQueryParams(query) }
  );
  return response.data.data;
}

/** GET /customer-skus/{id} */
export async function getCustomerSkuApi(id: string): Promise<CustomerSkuResponse> {
  const response = await api.get<ApiResponse<CustomerSkuResponse>>(`/customer-skus/${id}`);
  return response.data.data;
}

/** GET /customer-skus/barcode/{barcode} — 404 (MESSAGE_CODE_610) when not in the catalog. */
export async function getCustomerSkuByBarcodeApi(barcode: string): Promise<CustomerSkuResponse> {
  const response = await api.get<ApiResponse<CustomerSkuResponse>>(
    `/customer-skus/barcode/${encodeURIComponent(barcode)}`
  );
  return response.data.data;
}

/** POST /customer-skus */
export async function createCustomerSkuApi(
  payload: CreateCustomerSkuRequest
): Promise<CustomerSkuResponse> {
  const response = await api.post<ApiResponse<CustomerSkuResponse>>("/customer-skus", payload);
  return response.data.data;
}

/** PATCH /customer-skus/{id} */
export async function updateCustomerSkuApi(
  id: string,
  payload: UpdateCustomerSkuRequest
): Promise<CustomerSkuResponse> {
  const response = await api.patch<ApiResponse<CustomerSkuResponse>>(
    `/customer-skus/${id}`,
    payload
  );
  return response.data.data;
}

/** DELETE /customer-skus/{id} — fails with MESSAGE_CODE_613 while stock remains. */
export async function deleteCustomerSkuApi(id: string): Promise<void> {
  await api.delete(`/customer-skus/${id}`);
}
