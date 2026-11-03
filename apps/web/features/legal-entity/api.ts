import api from "@/lib/api/axios";
import type {
  ApiResponse,
  PaginatedData,
  LegalEntityItem,
  CreateLegalEntityRequest,
  UpdateLegalEntityRequest,
  LegalEntityQuery,
} from "./types";

/**
 * GET /legal-entities
 */
export async function fetchLegalEntities(
  query?: LegalEntityQuery
): Promise<PaginatedData<LegalEntityItem>> {
  const response = await api.get<ApiResponse<PaginatedData<LegalEntityItem>>>("/legal-entities", {
    params: query,
  });
  return response.data.data;
}

/**
 * GET /legal-entities/{id}
 */
export async function fetchLegalEntityById(id: string): Promise<LegalEntityItem> {
  const response = await api.get<ApiResponse<LegalEntityItem>>(`/legal-entities/${id}`);
  return response.data.data;
}

/**
 * POST /legal-entities
 */
export async function createLegalEntity(
  payload: CreateLegalEntityRequest
): Promise<LegalEntityItem> {
  const response = await api.post<ApiResponse<LegalEntityItem>>("/legal-entities", payload);
  return response.data.data;
}

/**
 * PATCH /legal-entities/{id}
 */
export async function updateLegalEntity(
  id: string,
  payload: UpdateLegalEntityRequest
): Promise<LegalEntityItem> {
  const response = await api.patch<ApiResponse<LegalEntityItem>>(`/legal-entities/${id}`, payload);
  return response.data.data;
}

/**
 * DELETE /legal-entities/{id}
 */
export async function deleteLegalEntity(id: string): Promise<LegalEntityItem> {
  const response = await api.delete<ApiResponse<LegalEntityItem>>(`/legal-entities/${id}`);
  return response.data.data;
}
