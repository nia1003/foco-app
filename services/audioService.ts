// ─────────────────────────────────────────────
// audioService — expo-av Sound system (React Native)
// ─────────────────────────────────────────────
import { Audio } from 'expo-av';

export type SoundName =
  | 'tap'
  | 'type'
  | 'toggle_on'
  | 'toggle_off'
  | 'transition_up'
  | 'transition_down';

// 4 tap variants — picked round-robin for variety
const TAP_ASSETS = [
  require('../assets/sounds/tap_02.wav'),
  require('../assets/sounds/tap_03.wav'),
  require('../assets/sounds/tap_04.wav'),
  require('../assets/sounds/tap_05.wav'),
] as const;

const SOUND_ASSETS: Record<Exclude<SoundName, 'tap'>, any> = {
  type:            require('../assets/sounds/type_01.wav'),
  toggle_on:       require('../assets/sounds/toggle_on.wav'),
  toggle_off:      require('../assets/sounds/toggle_off.wav'),
  transition_up:   require('../assets/sounds/transition_up.wav'),
  transition_down: require('../assets/sounds/transition_down.wav'),
};

// ── internal state ────────────────────────────
let initialized = false;
let tapIndex = 0;
const tapPool: (Audio.Sound | null)[] = [null, null, null, null];
const sounds: Partial<Record<Exclude<SoundName, 'tap'>, Audio.Sound>> = {};

// Throttle state (tap 55ms, type 65ms)
let lastTap = 0;
let lastType = 0;

async function configureAudio() {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });
}

async function loadSound(asset: any): Promise<Audio.Sound> {
  const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: false });
  return sound;
}

// ── public API ────────────────────────────────
export const audioService = {
  async init() {
    if (initialized) return;
    try {
      await configureAudio();

      // Preload tap pool
      for (let i = 0; i < TAP_ASSETS.length; i++) {
        tapPool[i] = await loadSound(TAP_ASSETS[i]);
      }

      // Preload single sounds
      for (const [name, asset] of Object.entries(SOUND_ASSETS) as [Exclude<SoundName, 'tap'>, any][]) {
        sounds[name] = await loadSound(asset);
      }

      initialized = true;
    } catch (e) {
      console.warn('[audioService] init failed:', e);
    }
  },

  async play(name: SoundName, volume = 0.45) {
    if (!initialized) return;
    try {
      if (name === 'tap') {
        const now = Date.now();
        if (now - lastTap < 55) return;
        lastTap = now;
        const sound = tapPool[tapIndex % tapPool.length];
        tapIndex++;
        if (!sound) return;
        await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } else if (name === 'type') {
        const now = Date.now();
        if (now - lastType < 65) return;
        lastType = now;
        const sound = sounds.type;
        if (!sound) return;
        await sound.setVolumeAsync(0.2);
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } else {
        const sound = sounds[name];
        if (!sound) return;
        await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch {}
  },

  async playToggle(on: boolean) {
    await audioService.play(on ? 'toggle_on' : 'toggle_off', 0.5);
  },

  async cleanup() {
    try {
      for (const s of tapPool) await s?.unloadAsync();
      for (const s of Object.values(sounds)) await s?.unloadAsync();
    } catch {}
    initialized = false;
  },
};
