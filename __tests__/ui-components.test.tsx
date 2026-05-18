import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PomodoroDotPicker } from '@/components/ui/PomodoroDotPicker';
import { Radius, Spacing } from '@/constants/theme';

describe('baseline UI components', () => {
  it('renders a pill-shaped button and handles presses', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button label="Start focus" onPress={onPress} />);

    const button = getByRole('button', { name: 'Start focus' });
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(StyleSheet.flatten(button.props.style)).toEqual(
      expect.objectContaining({ borderRadius: Radius.full }),
    );
  });

  it('renders Card with the Phase 0 rounded surface token', () => {
    const { UNSAFE_getByType, getByText } = render(
      <Card>
        <Text>Card body</Text>
      </Card>,
    );

    const card = UNSAFE_getByType(View);
    expect(getByText('Card body')).toBeTruthy();
    expect(StyleSheet.flatten(card.props.style)).toEqual(
      expect.objectContaining({ borderRadius: Radius['2xl'] }),
    );
  });

  it('renders Input with label, hint, and lg radius', () => {
    const { getByLabelText, getByText, UNSAFE_getByType } = render(
      <Input label="Email" hint="Use your school email" value="" onChangeText={jest.fn()} />,
    );

    const input = getByLabelText('Email');
    const wrapper = UNSAFE_getByType(View).props.children[1];

    expect(input).toBeTruthy();
    expect(getByText('Use your school email')).toBeTruthy();
    expect(StyleSheet.flatten(wrapper.props.style)).toEqual(
      expect.objectContaining({ borderRadius: Radius.lg }),
    );
  });

  it('toggles password visibility from the Input control', () => {
    const { getByLabelText, getByRole, UNSAFE_getByType } = render(
      <Input label="Password" isPassword value="secret" onChangeText={jest.fn()} />,
    );

    expect(getByLabelText('Password').props.secureTextEntry).toBe(true);
    fireEvent.press(getByRole('button', { name: 'Show password' }));

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.secureTextEntry).toBe(false);
  });

  it('renders pomodoro dots with md gap and emits selected count', () => {
    const onChange = jest.fn();
    const { getByRole, UNSAFE_getAllByType } = render(
      <PomodoroDotPicker value={2} max={4} onChange={onChange} />,
    );

    fireEvent.press(getByRole('button', { name: '3 pomodoros' }));

    const dotRow = UNSAFE_getAllByType(View)[1];
    const dots = UNSAFE_getAllByType(TouchableOpacity);
    expect(onChange).toHaveBeenCalledWith(3);
    expect(dots).toHaveLength(4);
    expect(StyleSheet.flatten(dotRow.props.style)).toEqual(
      expect.objectContaining({ gap: Spacing.md }),
    );
  });
});
