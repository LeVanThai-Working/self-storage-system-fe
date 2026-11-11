import { create } from "zustand";
import { AiInsightFocusAreaEnum } from "./types";

interface StatisticsFilterState {
  fromDate?: string;
  toDate?: string;
  facilityId?: string;
  focusArea: AiInsightFocusAreaEnum;
  isChatOpen: boolean;
  setFilters: (filters: { fromDate?: string; toDate?: string; facilityId?: string }) => void;
  setFocusArea: (area: AiInsightFocusAreaEnum) => void;
  setIsChatOpen: (isOpen: boolean) => void;
  toggleChat: () => void;
}

export const useStatisticsFilterStore = create<StatisticsFilterState>((set) => ({
  fromDate: undefined,
  toDate: undefined,
  facilityId: undefined,
  focusArea: AiInsightFocusAreaEnum.ALL,
  isChatOpen: false,
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  setFocusArea: (focusArea) => set({ focusArea }),
  setIsChatOpen: (isChatOpen) => set({ isChatOpen }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
}));
