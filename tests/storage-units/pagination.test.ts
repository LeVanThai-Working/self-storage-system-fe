import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../apps/web/lib/api/axios";
import {
  fetchAllStorageUnits,
  fetchStorageUnits,
} from "../../apps/web/features/storage-unit-management/api";
import { StorageUnitStatusEnum } from "../../packages/shared/src/enums/storageUnit.enum";

vi.mock("../../apps/web/lib/api/axios", () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());

function pageResult(page: number, count: number, hasNextPage: boolean) {
  return {
    data: {
      data: {
        items: Array.from({ length: count }, (_, index) => ({
          id: `${page}-${index}`,
          unitNumber: `Unit ${page}-${index}`,
        })),
        pagination: { page, limit: 100, hasNextPage },
      },
    },
  };
}

describe("Storage unit API pagination", () => {
  it("caps an oversized single-page request at 100", async () => {
    vi.mocked(api.get).mockResolvedValue(pageResult(1, 100, true));
    await fetchStorageUnits("facility-a", { page: 2, limit: 200, sortBy: "unitNumber" });
    expect(api.get).toHaveBeenCalledWith("/storage-units", {
      params: {
        facilityId: "facility-a",
        page: 2,
        limit: 100,
        sortBy: "unitNumber",
        sortOrder: "asc",
      },
    });
  });

  it("loads units beyond the original 200-record cutoff using pages of 100", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(pageResult(1, 100, true))
      .mockResolvedValueOnce(pageResult(2, 100, true))
      .mockResolvedValueOnce(pageResult(3, 37, false));
    const items = await fetchAllStorageUnits("facility-a", {
      sortBy: "unitNumber",
      zone: " Z1 ",
      floor: 0,
      status: StorageUnitStatusEnum.AVAILABLE,
    });
    expect(items).toHaveLength(237);
    expect(items.at(-1)?.id).toBe("3-36");
    expect(api.get).toHaveBeenCalledTimes(3);
    for (const page of [1, 2, 3]) {
      expect(api.get).toHaveBeenNthCalledWith(page, "/storage-units", {
        params: {
          facilityId: "facility-a",
          page,
          limit: 100,
          sortBy: "unitNumber",
          sortOrder: "asc",
          zone: "Z1",
          floor: 0,
          status: "available",
        },
      });
    }
  });

  it("stops on hasNextPage even when the final page is full", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResult(1, 100, false));
    expect(await fetchAllStorageUnits("facility-a")).toHaveLength(100);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("returns an empty lookup for a facility with no units", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResult(1, 0, false));
    expect(await fetchAllStorageUnits("facility-a")).toEqual([]);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("propagates a later page failure rather than returning an incomplete lookup", async () => {
    const error = new Error("Page 2 unavailable");
    vi.mocked(api.get)
      .mockResolvedValueOnce(pageResult(1, 100, true))
      .mockRejectedValueOnce(error);
    await expect(fetchAllStorageUnits("facility-a")).rejects.toBe(error);
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
