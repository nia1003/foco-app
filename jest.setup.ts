const mockSecureStore = new Map<string, string>();

process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore.set(key, value);
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStore.get(key) ?? null)),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStore.delete(key);
    return Promise.resolve();
  }),
  __mockSecureStore: mockSecureStore,
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
