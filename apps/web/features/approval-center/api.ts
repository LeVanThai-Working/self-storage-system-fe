import api from "@/lib/api/axios";
import type { ApiResponse as Envelope } from "@self-storage-system-fe/shared";
import {
  ApprovalRequestStatusEnum,
  ApprovalRequestTargetTypeEnum,
  type ApprovalCenterListResponse,
  type ApprovalCenterQueryParams,
  type ApprovalRequestDetail,
  type ReviewApprovalRequestPayload,
} from "./types";

/**
 * 1. Bảng tiếp nhận đề xuất: Lấy danh sách các đề xuất gửi từ các chi nhánh (Ops Manager & Admin).
 * Endpoint: GET /approval-requests
 */
export const getApprovalRequests = async (
  params?: ApprovalCenterQueryParams
): Promise<ApprovalCenterListResponse> => {
  const queryParams: Record<string, unknown> = {
    page: params?.page || 1,
    limit: params?.limit || 10,
    sortBy: params?.sortBy || "createdAt",
    sortOrder: params?.sortOrder || "desc",
  };

  if (params?.status && (params.status as string) !== "ALL") {
    queryParams.status = params.status;
  }
  if (params?.targetType && (params.targetType as string) !== "ALL") {
    queryParams.targetType = params.targetType;
  }
  if (params?.facilityId && (params.facilityId as string) !== "ALL") {
    queryParams.facilityId = params.facilityId;
  }
  if (params?.search?.trim()) {
    queryParams.search = params.search.trim();
  }

  try {
    const { data } = await api.get<Envelope<ApprovalCenterListResponse>>("/approval-requests", {
      params: queryParams,
    });

    return {
      items: data.data?.items || [],
      pagination: data.data?.pagination || {
        page: Number(queryParams.page),
        limit: Number(queryParams.limit),
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  } catch (_error) {
    // Backend fallback: Nếu DB có bản ghi unit_type bị lỗi reference/populate gây 500 khi query approved/ALL,
    // fallback truy vấn các targetType an toàn để lấy đầy đủ dữ liệu người dùng cần (vd: offering, amenity).
    try {
      const safeTargetTypes: ApprovalRequestTargetTypeEnum[] = [
        ApprovalRequestTargetTypeEnum.FACILITY_UNIT_TYPE_OFFERING,
        ApprovalRequestTargetTypeEnum.FACILITY_AMENITY_OFFERING,
        ApprovalRequestTargetTypeEnum.AMENITY,
      ];

      // Nếu người dùng đang lọc một targetType cụ thể
      if (params?.targetType && (params.targetType as string) !== "ALL") {
        if (params.targetType === ApprovalRequestTargetTypeEnum.UNIT_TYPE) {
          // unit_type chỉ query an toàn nếu status là pending
          if (params.status === ApprovalRequestStatusEnum.PENDING) {
            const { data } = await api.get<Envelope<ApprovalCenterListResponse>>(
              "/approval-requests",
              {
                params: queryParams,
              }
            );
            return {
              items: data.data?.items || [],
              pagination: data.data?.pagination || {
                page: Number(queryParams.page),
                limit: Number(queryParams.limit),
                totalItems: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
              },
            };
          }
          return {
            items: [],
            pagination: {
              page: Number(queryParams.page),
              limit: Number(queryParams.limit),
              totalItems: 0,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          };
        }
      }

      const requests = safeTargetTypes.map((tt) =>
        api
          .get<Envelope<ApprovalCenterListResponse>>("/approval-requests", {
            params: {
              ...queryParams,
              targetType: tt,
              page: 1,
              limit: 50,
            },
          })
          .then((res) => res.data.data?.items || [])
          .catch(() => [] as ApprovalRequestDetail[])
      );

      // Nếu không lọc status hoặc status là pending, bổ sung unit_type pending
      if (!queryParams.status || queryParams.status === ApprovalRequestStatusEnum.PENDING) {
        requests.push(
          api
            .get<Envelope<ApprovalCenterListResponse>>("/approval-requests", {
              params: {
                ...queryParams,
                targetType: ApprovalRequestTargetTypeEnum.UNIT_TYPE,
                status: ApprovalRequestStatusEnum.PENDING,
                page: 1,
                limit: 50,
              },
            })
            .then((res) => res.data.data?.items || [])
            .catch(() => [] as ApprovalRequestDetail[])
        );
      }

      const results = await Promise.all(requests);
      let allItems = results.flat();

      if (queryParams.facilityId && queryParams.facilityId !== "ALL") {
        allItems = allItems.filter((i) => i.facilityId === queryParams.facilityId);
      }
      if (queryParams.status && queryParams.status !== "ALL") {
        allItems = allItems.filter((i) => i.status === queryParams.status);
      }
      if (queryParams.search) {
        const q = String(queryParams.search).toLowerCase();
        allItems = allItems.filter(
          (i) =>
            i.reason?.toLowerCase().includes(q) ||
            i.facility?.name?.toLowerCase().includes(q) ||
            i.requester?.name?.toLowerCase().includes(q)
        );
      }

      // Sắp xếp
      allItems.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return queryParams.sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });

      const pageNum = Number(queryParams.page);
      const limitNum = Number(queryParams.limit);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedItems = allItems.slice(startIndex, startIndex + limitNum);

      return {
        items: paginatedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: allItems.length,
          totalPages: Math.ceil(allItems.length / limitNum) || 1,
          hasNextPage: startIndex + limitNum < allItems.length,
          hasPrevPage: pageNum > 1,
        },
      };
    } catch {
      return {
        items: [],
        pagination: {
          page: Number(queryParams.page),
          limit: Number(queryParams.limit),
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  }
};

/**
 * 2. Modal xem chi tiết thay đổi / Diff view: Lấy toàn bộ payload chi tiết của đề xuất,
 * bao gồm dữ liệu cũ và dữ liệu mới đề xuất (giá cũ vs giá mới, thông tin tiện ích xin mở thêm...).
 * Endpoint: GET /approval-requests/{id}
 */
export const getApprovalRequestById = async (id: string): Promise<ApprovalRequestDetail> => {
  const { data } = await api.get<Envelope<ApprovalRequestDetail>>(`/approval-requests/${id}`);
  return data.data;
};

/**
 * 3. Nút Duyệt / Từ chối: Gửi quyết định phê duyệt hoặc từ chối đề xuất.
 * BE sẽ tự động cập nhật cơ sở dữ liệu nếu được duyệt.
 * Endpoint: PATCH /approval-requests/{id}/review
 * - Duyệt:   { action: "approve", notes?: "..." }
 * - Từ chối: { action: "reject", rejectionReason: "...", notes?: "..." }
 */
export const reviewApprovalRequest = async (
  id: string,
  payload: ReviewApprovalRequestPayload
): Promise<ApprovalRequestDetail> => {
  const body: Record<string, unknown> = {
    action: payload.action,
  };

  if (payload.action === "approve") {
    if (payload.notes?.trim()) {
      body.notes = payload.notes.trim();
    }
  } else {
    // Với reject, gửi cả rejectionReason và notes để đảm bảo tương thích 100% Swagger schema & backend
    const reason = payload.rejectionReason?.trim() || payload.notes?.trim() || "";
    body.rejectionReason = reason;
    body.notes = reason;
  }

  const { data } = await api.patch<Envelope<ApprovalRequestDetail>>(
    `/approval-requests/${id}/review`,
    body
  );
  return data.data;
};
