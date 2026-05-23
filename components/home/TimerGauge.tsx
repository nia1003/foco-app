import React, { useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const MIN_VAL = 5;
const MAX_VAL = 60;
const STEP = 5;

const GAUGE_W = 260;
const GAUGE_H = 130;
const R = 94;
const CX = GAUGE_W / 2;
const CY = GAUGE_H - 6; // arc base sits near bottom of SVG

function valToRad(v: number): number {
  const pct = (v - MIN_VAL) / (MAX_VAL - MIN_VAL);
  return Math.PI * (1 - pct); // π (left) → 0 (right)
}

function pt(rad: number, r: number) {
  return {
    x: CX + r * Math.cos(rad),
    y: CY - r * Math.sin(rad),
  };
}

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function TimerGauge({ value, onChange }: Props) {
  const valueRef    = useRef(value);
  valueRef.current  = value;
  // Keep onChange ref fresh so PanResponder never holds a stale callback
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const dragStart = useRef({ x: 0, val: value });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => {
        dragStart.current = { x: gs.x0, val: valueRef.current };
      },
      onPanResponderMove: (_, gs) => {
        const dx = gs.moveX - dragStart.current.x;
        const steps = Math.round(dx / 13);
        const raw = dragStart.current.val + steps * STEP;
        const snapped = Math.max(MIN_VAL, Math.min(MAX_VAL, Math.round(raw / STEP) * STEP));
        if (snapped !== valueRef.current) onChangeRef.current(snapped);
      },
    }),
  ).current;

  // Arc path: left → top → right (top semicircle)
  const arcL = pt(Math.PI, R);
  const arcR = pt(0, R);
  const arcPath =
    `M${arcL.x.toFixed(1)},${arcL.y.toFixed(1)} ` +
    `A${R},${R} 0 0 1 ${arcR.x.toFixed(1)},${arcR.y.toFixed(1)}`;

  // Needle tip
  const needle = pt(valToRad(value), R - 20);

  // Tick marks every 5 min
  const totalSteps = (MAX_VAL - MIN_VAL) / STEP;
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= totalSteps; i++) {
    const v = MIN_VAL + i * STEP;
    const rad = valToRad(v);
    const inner = pt(rad, R - 9);
    const outer = pt(rad, R + 3);
    const major = v % 15 === 0;
    ticks.push(
      <Line
        key={v}
        x1={inner.x.toFixed(1)}
        y1={inner.y.toFixed(1)}
        x2={outer.x.toFixed(1)}
        y2={outer.y.toFixed(1)}
        stroke={major ? '#c0c0c0' : '#e0e0e0'}
        strokeWidth={major ? 2 : 1}
      />,
    );
  }

  return (
    <View style={styles.wrap} {...pan.panHandlers}>
      <View style={{ width: GAUGE_W, height: GAUGE_H }}>
        <Svg width={GAUGE_W} height={GAUGE_H}>
          {/* Background arc */}
          <Path
            d={arcPath}
            fill="none"
            stroke="#e8e8e8"
            strokeWidth={6}
            strokeLinecap="round"
          />
          {ticks}
          {/* Needle */}
          <Line
            x1={CX.toFixed(1)}
            y1={CY.toFixed(1)}
            x2={needle.x.toFixed(1)}
            y2={needle.y.toFixed(1)}
            stroke="#E53E3E"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Circle cx={CX.toFixed(1)} cy={CY.toFixed(1)} r={5} fill="#E53E3E" />
        </Svg>
        {/* Value label floats in the centre of the arc */}
        <View style={styles.labelOverlay} pointerEvents="none">
          <Text style={styles.num}>{value}</Text>
          <Text style={styles.unit}>MIN</Text>
        </View>
      </View>
      <Text style={styles.hint}>← drag to adjust →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 4, paddingBottom: 8 },
  labelOverlay: {
    position: 'absolute',
    top: GAUGE_H - R * 0.88,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  num: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1a1622',
    lineHeight: 44,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#aaa',
    letterSpacing: 2,
    marginTop: -2,
  },
  hint: {
    fontSize: 10,
    color: '#bbb',
    letterSpacing: 0.3,
    marginTop: 4,
  },
});
