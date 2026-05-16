// ─────────────────────────────────────────────
// SoundProvider — React context for audioService
// Usage: const { play, playToggle } = useSound();
// ─────────────────────────────────────────────
import { createContext, useCallback, useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { audioService, type SoundName } from '@/services/audioService';

type SoundContextValue = {
  play: (name: SoundName, volume?: number) => void;
  playToggle: (on: boolean) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: PropsWithChildren) {
  const play = useCallback((name: SoundName, volume?: number) => {
    void audioService.play(name, volume);
  }, []);

  const playToggle = useCallback((on: boolean) => {
    void audioService.playToggle(on);
  }, []);

  const value = useMemo<SoundContextValue>(() => ({ play, playToggle }), [play, playToggle]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within SoundProvider');
  return ctx;
}
