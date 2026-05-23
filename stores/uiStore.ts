import { create } from 'zustand';

interface UIState {
  homeTabBarVisible: boolean;
  setHomeTabBarVisible: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  homeTabBarVisible: true,
  setHomeTabBarVisible: (homeTabBarVisible) => set({ homeTabBarVisible }),
}));
