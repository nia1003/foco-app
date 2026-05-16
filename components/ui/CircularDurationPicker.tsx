/**
 * CircularDurationPicker — drag the ring handle to pick minutes.
 * Full-circle track: 5 min at top, 120 min just before top (clockwise).
 */
import React, { useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '@/constants/theme';

const SIZE   = 280;
const CX     = SIZE / 2;
const CY     = SIZE / 2;
const RADIUS = 108;
const STROKE = 22;
const MIN_VAL = 5;
const MAX_VAL = 120;

// duration → angle in SVG space (0 = top = -π/2 in math, clockwise)
function durToSvgAngle(d: number): number {
  const frac = (d - MIN_VAL) / (MAX_VAL - MIN_VAL);
  return frac * 2 * Math.PI - Math.PI / 2; // SVG: 0 = right, +y = down
}

// SVG angle → cartesian on the ring
function polar(angle: number) {
  return {
    x: CX + RADIUS * Math.cos(angle),
    y: CY + RADIUS * Math.sin(angle),
  };
}

// Build SVG arc path from top to current handle position
function arcPath(duration: number): string {
  const frac = (duration - MIN_VAL) / (MAX_VAL - MIN_VAL);
  if (frac <= 0) return '';
  if (frac >= 0.999) {
    // Near-full circle: two half-arcs to avoid degenerate case
    return [
      `M ${CX} ${CY - RADIUS - 0.01}`,
      `A ${RADIUS} ${RADIUS} 0 1 1 ${CX} ${CY + RADIUS}`,
      `A ${RADIUS} ${RADIUS} 0 1 1 ${CX} ${CY - RADIUS - 0.01}`,
    ].join(' ');
  }
  const start = polar(-Math.PI / 2); // top
  const end   = polar(durToSvgAngle(duration));
  const large = frac > 0.5 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${end.x} ${end.y}`;
}

// Touch (dx, dy from center) → duration
function touchToDuration(dx: number, dy: number): number {
  // atan2 gives angle from positive X, positive Y = down
  const rawAngle = Math.atan2(dy, dx); // -π to π
  // Shift so 0 = top (add π/2), then normalize to [0, 2π)
  let norm = rawAngle + Math.PI / 2;
  if (norm < 0) norm += 2 * Math.PI;
  if (norm >= 2 * Math.PI) norm -= 2 * Math.PI;
  const dur = MIN_VAL + (norm / (2 * Math.PI)) * (MAX_VAL - MIN_VAL);
  return Math.round(Math.max(MIN_VAL, Math.min(MAX_VAL, dur)));
}

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function CircularDurationPicker({ value, onChange }: Props) {
  const handleAngle = durToSvgAngle(value);
  const handle = polar(handleAngle);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (evt) => {
        const dx = evt.nativeEvent.locationX - CX;
        const dy = evt.nativeEvent.locationY - CY;
        if (Math.sqrt(dx * dx + dy * dy) > 20) onChange(touchToDuration(dx, dy));
      },
      onPanResponderMove: (evt) => {
        const dx = evt.nativeEvent.locationX - CX;
        const dy = evt.nativeEvent.locationY - CY;
        onChange(touchToDuration(dx, dy));
      },
    })
  ).current;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} {...panResponder.panHandlers}>
        {/* Track ring */}
        <Circle
          cx={CX} cy={CY} r={RADIUS}
          fill="none"
          stroke="rgba(20,16,28,0.08)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <Path
          d={arcPath(value)}
          fill="none"
          stroke={Colors.pinkText}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Start dot at top */}
        <Circle
          cx={CX} cy={CY - RADIUS}
          r={6}
          fill={Colors.pinkText}
          opacity={0.35}
        />
        {/* Handle */}
        <Circle
          cx={handle.x} cy={handle.y}
          r={15}
          fill="#fff"
          stroke={Colors.pinkText}
          strokeWidth={3}
        />
        {/* Handle inner dot */}
        <Circle
          cx={handle.x} cy={handle.y}
          r={5}
          fill={Colors.pinkText}
        />
      </Svg>

      {/* Center label (pointer-events none so touches pass to SVG) */}
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.valText}>{value}</Text>
        <Text style={styles.unitText}>min</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
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
    fontFamily: 'Fraunces_400Regular',
    fontSize: 72,
    fontWeight: '400',
    color: Colors.ink,
    letterSpacing: -3,
    lineHeight: 80,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.inkSoft,
    letterSpacing: 1,
  },
});
