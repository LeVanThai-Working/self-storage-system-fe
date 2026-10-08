import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: "light",
  setThemeMode: (mode) => {
    set({ themeMode: mode });
  },
  toggleTheme: () => {
    const current = get().themeMode;
    const next = current === "dark" ? "light" : "dark";
    set({ themeMode: next });
  },
}));
