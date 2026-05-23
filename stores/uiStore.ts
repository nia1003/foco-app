import { create } from 'zustand';

// UI state for cross-component coordination.
// homeTabBarVisible removed — the home screen now uses an EmbeddedTabBar
// inside the dark section that naturally slides with the content block.
interface UIState {
  // Reserved for future UI state
  _placeholder: boolean;
}

export const useUIStore = create<UIState>(() => ({
  _placeholder: true,
}));
