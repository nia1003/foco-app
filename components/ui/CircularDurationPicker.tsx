import { Fonts } from '@/constants/fonts';
/**
 * CircularDurationPicker — drag the ring handle to pick minutes.
 * Tap the center number to type a value directly.
 */
import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '@/constants/theme';

const SIZE   = 280;
const CX     = SIZE / 2;
const CY     = SIZE / 2;
const RADIUS = 108;
const STROKE = 22;
const MIN_VAL = 5;
const MAX_VAL = 120;

function durToSvgAngle(d: number): number {
  const frac = (d - MIN_VAL) / (MAX_VAL - MIN_VAL);
  return frac * 2 * Math.PI - Math.PI / 2;
}

function polar(angle: number) {
  return { x: CX + RADIUS * Math.cos(angle), y: CY + RADIUS * Math.sin(angle) };
}

function arcPath(duration: number): string {
  const frac = (duration - MIN_VAL) / (MAX_VAL - MIN_VAL);
  if (frac <= 0) return '';
  if (frac >= 0.999) {
    return [
      `M ${CX} ${CY - RADIUS - 0.01}`,
      `A ${RADIUS} ${RADIUS} 0 1 1 ${CX} ${CY + RADIUS}`,
      `A ${RADIUS} ${RADIUS} 0 1 1 ${CX} ${CY - RADIUS - 0.01}`,
    ].join(' ');
  }
  const start = polar(-Math.PI / 2);
  const end   = polar(durToSvgAngle(duration));
  const large = frac > 0.5 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${end.x} ${end.y}`;
}

function touchAngle(dx: number, dy: number): number {
  let norm = Math.atan2(dy, dx) + Math.PI / 2;
  if (norm < 0) norm += 2 * Math.PI;
  if (norm >= 2 * Math.PI) norm -= 2 * Math.PI;
  return norm;
}

function durationFromAngle(angle: number): number {
  const dur = MIN_VAL + (angle / (2 * Math.PI)) * (MAX_VAL - MIN_VAL);
  return Math.round(Math.max(MIN_VAL, Math.min(MAX_VAL, dur)));
}

/** Integrate drag deltas so crossing 12 o'clock does not wrap 120 → 5. */
function durationFromDrag(
  angle: number,
  prevAngle: number | null,
  currentValue: number,
): number {
  if (prevAngle === null) return durationFromAngle(angle);

  let delta = angle - prevAngle;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;

  const range = MAX_VAL - MIN_VAL;
  const next = currentValue + (delta / (2 * Math.PI)) * range;
  return Math.round(Math.max(MIN_VAL, Math.min(MAX_VAL, next)));
}

interface Props {
  value: number;
  onChange: (v: number) => void;
  /** Notifies parent to disable ScrollView while dragging the ring */
  onInteractionActiveChange?: (active: boolean) => void;
  /** Open number pad when mounted (e.g. inside duration modal) */
  autoFocusInput?: boolean;
}

export function CircularDurationPicker({
  value,
  onChange,
  onInteractionActiveChange,
  autoFocusInput = false,
}: Props) {
  const [editing, setEditing] = useState(autoFocusInput);
  const [editText, setEditText] = useState(autoFocusInput ? String(value) : '');
  const valueRef = useRef(value);
  const lastAngleRef = useRef<number | null>(null);

  valueRef.current = value;

  useEffect(() => {
    if (autoFocusInput) {
      setEditing(true);
      setEditText(String(value));
    }
  }, [autoFocusInput]);

  useEffect(() => {
    if (editing) setEditText(String(value));
  }, [value, editing]);

  const handleAngle = durToSvgAngle(value);
  const handle = polar(handleAngle);

  const applyTouch = (dx: number, dy: number, isGrant: boolean) => {
    const angle = touchAngle(dx, dy);
    const next = durationFromDrag(angle, isGrant ? null : lastAngleRef.current, valueRef.current);
    lastAngleRef.current = angle;
    onChange(next);
  };

  const endInteraction = () => {
    lastAngleRef.current = null;
    onInteractionActiveChange?.(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        onInteractionActiveChange?.(true);
        const dx = evt.nativeEvent.locationX - CX;
        const dy = evt.nativeEvent.locationY - CY;
        if (Math.sqrt(dx * dx + dy * dy) > 20) applyTouch(dx, dy, true);
      },
      onPanResponderMove: (evt) => {
        const dx = evt.nativeEvent.locationX - CX;
        const dy = evt.nativeEvent.locationY - CY;
        applyTouch(dx, dy, false);
      },
      onPanResponderRelease: endInteraction,
      onPanResponderTerminate: endInteraction,
    }),
  ).current;

  function clampDuration(v: number) {
    return Math.max(MIN_VAL, Math.min(MAX_VAL, v));
  }

  function applyEditText(text: string) {
    if (text === '') return;
    const v = parseInt(text, 10);
    if (!isNaN(v)) onChange(clampDuration(v));
  }

  function commitEdit(text: string) {
    applyEditText(text);
    setEditing(false);
  }

  return (
    <View style={styles.wrap} {...panResponder.panHandlers}>
      <Svg width={SIZE} height={SIZE} pointerEvents="none">
        <Circle
          cx={CX} cy={CY} r={RADIUS}
          fill="none"
          stroke="rgba(20,16,28,0.08)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        <Path
          d={arcPath(value)}
          fill="none"
          stroke={Colors.pinkText}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        <Circle cx={CX} cy={CY - RADIUS} r={6} fill={Colors.pinkText} opacity={0.35} />
        <Circle cx={handle.x} cy={handle.y} r={15} fill="#fff" stroke={Colors.pinkText} strokeWidth={3} />
        <Circle cx={handle.x} cy={handle.y} r={5}  fill={Colors.pinkText} />
      </Svg>

      {/* Center — tap to type */}
      <View style={styles.center} pointerEvents="box-none">
        {editing ? (
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={(text) => {
              setEditText(text);
              applyEditText(text);
            }}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => commitEdit(editText)}
            onBlur={() => commitEdit(editText)}
          />
        ) : (
          <TouchableOpacity onPress={() => { setEditText(String(value)); setEditing(true); }} activeOpacity={0.7}>
            <Text style={styles.valText}>{value}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.unitText}>min</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE, height: SIZE,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valText: {
    fontFamily: Fonts.displayRegular,
    fontSize: 72, fontWeight: '400',
    color: Colors.ink,
    letterSpacing: -3, lineHeight: 80,
    textAlign: 'center',
  },
  editInput: {
    fontFamily: Fonts.displayRegular,
    fontSize: 72, fontWeight: '400',
    color: Colors.pinkText,
    letterSpacing: -3, lineHeight: 80,
    textAlign: 'center',
    minWidth: 120,
  },
  unitText: {
    fontSize: 16, fontWeight: '500',
    color: Colors.inkSoft,
    letterSpacing: 1,
  },
});
