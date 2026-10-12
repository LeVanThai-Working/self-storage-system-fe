import { create } from "zustand";

export type ExploreViewTab = "facilities" | "sizeGuide";

interface ExploreSearchState {
  search: string;
  page: number;
  activeTab: ExploreViewTab;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setActiveTab: (activeTab: ExploreViewTab) => void;
  resetSearch: () => void;
}

export const useExploreSearchStore = create<ExploreSearchState>((set) => ({
  search: "",
  page: 1,
  activeTab: "facilities",
  setSearch: (search: string) =>
    set((state) => ({
      search,
      page: 1,
      activeTab: search.trim().length > 0 ? "facilities" : state.activeTab,
    })),
  setPage: (page: number) => set({ page }),
  setActiveTab: (activeTab: ExploreViewTab) => set({ activeTab }),
  resetSearch: () => set({ search: "", page: 1 }),
}));
