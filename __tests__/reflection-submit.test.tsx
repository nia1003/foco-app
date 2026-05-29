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

  it('sends only one completion request when submit is pressed twice quickly', async () => {
    jest.mocked(completeSession).mockResolvedValueOnce({
      session_id: 'session-1',
      pet_id: 'pet-1',
      xp_gained: 10,
      new_xp: 10,
      new_level: 1,
      level_up: false,
      focus_type: 'steadiness',
      xp_next_level: 100,
      quality_score: 85,
      ended_at: '2026-05-29T00:01:00.000Z',
    });

    const { getByTestId } = render(<ReflectionScreen />);
    const button = getByTestId('reflection-submit-button');

    fireEvent.press(button);
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    expect(completeSession).toHaveBeenCalledTimes(1);
  });

  it('passes advanced XP to the reward route', async () => {
    jest.mocked(completeSession).mockResolvedValueOnce({
      session_id: 'session-1',
      pet_id: 'pet-1',
      xp_gained: 12,
      new_xp: 12,
      new_level: 1,
      level_up: false,
      focus_type: 'steadiness',
      xp_next_level: 100,
      quality_score: 85,
      ended_at: '2026-05-29T00:01:00.000Z',
    });

    const { getByTestId } = render(<ReflectionScreen />);

    fireEvent.press(getByTestId('reflection-submit-button'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    const routeArg = mockReplace.mock.calls[0][0];
    const result = JSON.parse(routeArg.params.result);
    expect(result.old_xp).toBe(0);
    expect(result.xp_gained).toBe(12);
    expect(result.new_xp).toBe(12);
    expect(result.new_xp).toBeGreaterThan(result.old_xp);
  });

  it('blocks reward navigation when companion XP does not advance', async () => {
    jest.mocked(completeSession).mockResolvedValueOnce({
      session_id: 'session-1',
      pet_id: 'pet-1',
      xp_gained: 12,
      new_xp: 0,
      new_level: 1,
      level_up: false,
      focus_type: 'steadiness',
      xp_next_level: 100,
      quality_score: 85,
      ended_at: '2026-05-29T00:01:00.000Z',
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByTestId } = render(<ReflectionScreen />);

    fireEvent.press(getByTestId('reflection-submit-button'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Could not save session',
        expect.stringContaining('companion XP did not increase'),
      );
    });

    expect(mockReplace).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
