// ─────────────────────────────────────────────
// SoundProvider — React context for audioService
// Usage: const { play, playToggle } = useSound();
// ─────────────────────────────────────────────
import { createContext, useCallback, useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { audioService, type SoundName } from '@/services/audioService';
import { usePreferencesStore } from '@/stores/preferencesStore';

type SoundContextValue = {
  play: (name: SoundName, volume?: number) => void;
  playToggle: (on: boolean) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: PropsWithChildren) {
  const soundEnabled = usePreferencesStore((s) => s.soundEnabled);

  const play = useCallback(
    (name: SoundName, volume?: number) => {
      if (!soundEnabled) return;
      void audioService.play(name, volume);
    },
    [soundEnabled],
  );

  const playToggle = useCallback(
    (on: boolean) => {
      if (!soundEnabled) return;
      void audioService.playToggle(on);
    },
    [soundEnabled],
  );

  const value = useMemo<SoundContextValue>(() => ({ play, playToggle }), [play, playToggle]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within SoundProvider');
  return ctx;
}
