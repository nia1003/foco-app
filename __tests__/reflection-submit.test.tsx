import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ReflectionScreen from '@/app/(app)/reflection';
import { completeSession } from '@/services/focoService';

const mockReplace = jest.fn();
const mockPayloadJson = JSON.stringify({
  user_id: 'user-1',
  pet_id: 'pet-1',
  task_id: null,
  planned_duration: 1500,
  actual_duration: 10,
  pause_count: 0,
  pause_total_sec: 0,
  left_app_count: 0,
  left_app_total_sec: 0,
  completed: false,
  early_stop: false,
  started_at: '2026-05-29T00:00:00.000Z',
  events: [],
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({
    payloadJson: mockPayloadJson,
    localStatsJson: JSON.stringify({ old_xp: 0 }),
    defaultCompletion: '100',
  }),
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => callback(), [callback]);
    },
  };
});

jest.mock('@/components/ui/AppBackground', () => {
  return {
    AppBackground: () => null,
  };
});

jest.mock('@/services/focoService', () => ({
  completeSession: jest.fn(),
  updateTaskProgress: jest.fn(() => Promise.resolve()),
}));

describe('Reflection submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      setTimeout(() => callback(Date.now()), 0);
      return 0;
    }) as typeof requestAnimationFrame;
  });

  it('shows an alert without triggering LogBox console errors when submit fails', async () => {
    jest.mocked(completeSession).mockRejectedValueOnce(new Error('network failed'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByTestId } = render(<ReflectionScreen />);

    fireEvent.press(getByTestId('reflection-submit-button'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Could not save session',
        expect.stringContaining('network failed'),
      );
    });

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    alertSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
