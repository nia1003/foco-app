import React, { useRef } from 'react';
import { Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

const MIN_VAL = 5;
const MAX_VAL = 60;
const STEP = 5;

const SCREEN_W  = Dimensions.get('window').width;
const SVG_W     = Math.min(280, SCREEN_W - 80);
const SVG_H     = 148;
const R         = SVG_W * 0.43;
const CX        = SVG_W / 2;
const CY        = SVG_H + R * 0.06; // arc centre sits just below SVG bottom

function valToRad(v: number): number {
  const pct = (v - MIN_VAL) / (MAX_VAL - MIN_VAL);
  return Math.PI * (1 - pct); // π = left end, 0 = right end
}

function pt(rad: number, r: number) {
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
}

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function TimerGauge({ value, onChange }: Props) {
  const valueRef     = useRef(value);
  valueRef.current   = value;
  const onChangeRef  = useRef(onChange);
  onChangeRef.current = onChange;
  const dragStart    = useRef({ x: 0, val: value });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (_, gs) => {
        dragStart.current = { x: gs.x0, val: valueRef.current };
      },
      onPanResponderMove: (_, gs) => {
        const dx    = gs.moveX - dragStart.current.x;
        const pxPer = (SVG_W * 0.82) / ((MAX_VAL - MIN_VAL) / STEP);
        const steps = Math.round(dx / pxPer);
        const raw   = dragStart.current.val + steps * STEP;
        const snap  = Math.max(MIN_VAL, Math.min(MAX_VAL, Math.round(raw / STEP) * STEP));
        if (snap !== valueRef.current) onChangeRef.current(snap);
      },
    }),
  ).current;

  // ── Arc track ──────────────────────────────────────────────────
  const arcL    = pt(Math.PI, R);
  const arcR    = pt(0, R);
  const arcPath = `M${arcL.x.toFixed(1)},${arcL.y.toFixed(1)} A${R},${R} 0 0 1 ${arcR.x.toFixed(1)},${arcR.y.toFixed(1)}`;

  // ── Tick marks: every 1 min (minor), 5 min (mid), 15 min (major) ──
  const ticks: React.ReactNode[] = [];
  for (let v = MIN_VAL; v <= MAX_VAL; v++) {
    const rad     = valToRad(v);
    const major15 = v % 15 === 0;
    const mid5    = v % 5  === 0;
    const len     = major15 ? 11 : mid5 ? 6 : 3;
    const inner   = pt(rad, R - len);
    const outer   = pt(rad, R + 1);
    ticks.push(
      <Line
        key={v}
        x1={inner.x.toFixed(1)} y1={inner.y.toFixed(1)}
        x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
        stroke={major15 ? '#999' : mid5 ? '#c0c0c0' : '#dedede'}
        strokeWidth={major15 ? 2 : mid5 ? 1.5 : 0.9}
      />,
    );
  }

  // ── Red pointer bar (radially oriented on the arc) ──────────────
  const pRad   = valToRad(value);
  const pOuter = pt(pRad, R + 9);
  const pInner = pt(pRad, R - 9);

  return (
    <View style={styles.card} {...pan.panHandlers}>
      {/* Semicircular dial */}
      <Svg width={SVG_W} height={SVG_H}>
        <Path d={arcPath} fill="none" stroke="#e4e4e4" strokeWidth={1.5} />
        {ticks}
        <Line
          x1={pInner.x.toFixed(1)} y1={pInner.y.toFixed(1)}
          x2={pOuter.x.toFixed(1)} y2={pOuter.y.toFixed(1)}
          stroke="#E53E3E"
          strokeWidth={4.5}
          strokeLinecap="round"
        />
      </Svg>

      {/* Number centred inside arc bowl */}
      <View style={styles.numOverlay} pointerEvents="none">
        <Text style={styles.num}>{value}</Text>
        <Text style={styles.unit}>MIN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  numOverlay: {
    position: 'absolute',
    top: SVG_H * 0.38,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  num: {
    fontSize: 54,
    fontWeight: '800',
    color: '#111111',
    lineHeight: 58,
    letterSpacing: -2,
  },
  unit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#aaaaaa',
    letterSpacing: 3,
    marginTop: 1,
  },
});
