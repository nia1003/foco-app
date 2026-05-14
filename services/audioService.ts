// ─────────────────────────────────────────────
// audioService — expo-av Sound wrapper
// ─────────────────────────────────────────────
import { Audio } from 'expo-av';

// Allow audio to play in silent mode and stay active in background
async function configureAudio() {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });
}

// Lazy sound cache
let tickSound: Audio.Sound | null = null;
let completeSound: Audio.Sound | null = null;
let initialized = false;

export const audioService = {
  async init() {
    if (initialized) return;
    try {
      await configureAudio();
      initialized = true;
    } catch (e) {
      console.warn('[audioService] init failed:', e);
    }
  },

  async playTick() {
    // Placeholder: load from assets when audio files are added
    // const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/tick.mp3'));
    // await sound.playAsync();
  },

  async playComplete() {
    // Placeholder: load from assets when audio files are added
    // const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/complete.mp3'));
    // await sound.playAsync();
  },

  async cleanup() {
    try {
      await tickSound?.unloadAsync();
      await completeSound?.unloadAsync();
    } catch {}
    tickSound = null;
    completeSound = null;
    initialized = false;
  },
};
