module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|expo-.*|@expo-google-fonts/.*|@react-native-async-storage/async-storage|@react-navigation/.*|react-native-svg|react-native-reanimated|react-native-worklets|nativewind|react-native-css-interop)/)',
  ],
};
