import { create } from "zustand";
import type {
  PublicUnitTypeOfferingResponse,
  PublicAmenityOfferingResponse,
  StorageUnitResponse,
} from "@self-storage-system-fe/shared";

export interface ReservationHandoffPayload {
  facilityId: string;
  facilityName: string;
  unitTypeId: string;
  offering: PublicUnitTypeOfferingResponse;
  availableAmenities: PublicAmenityOfferingResponse[];
  storageUnitId?: string;
  selectedUnit?: StorageUnitResponse;
}

interface ReservationHandoffState {
  handoffPayload: ReservationHandoffPayload | null;
  pendingRedirectAfterLogin: boolean;
  setHandoffPayload: (
    payload: ReservationHandoffPayload,
    options?: { pendingRedirectAfterLogin?: boolean }
  ) => void;
  clearHandoffPayload: () => void;
  consumePendingRedirect: () => boolean;
}

export const useReservationHandoffStore = create<ReservationHandoffState>((set, get) => ({
  handoffPayload: null,
  pendingRedirectAfterLogin: false,

  setHandoffPayload: (payload, options) => {
    set({
      handoffPayload: payload,
      pendingRedirectAfterLogin: options?.pendingRedirectAfterLogin ?? false,
    });
  },

  clearHandoffPayload: () => {
    set({
      handoffPayload: null,
      pendingRedirectAfterLogin: false,
    });
  },

  consumePendingRedirect: () => {
    const shouldRedirect = get().pendingRedirectAfterLogin && !!get().handoffPayload;
    if (shouldRedirect) {
      set({ pendingRedirectAfterLogin: false });
    }
    return shouldRedirect;
  },
}));
