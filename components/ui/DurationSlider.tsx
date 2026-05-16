import React, { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const PINK      = '#F2CEDC';
const PINK_TEXT = '#b5607a';

export const MIN_DUR = 5;
export const MAX_DUR = 120;

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export function DurationSlider({ value, onChange, min = MIN_DUR, max = MAX_DUR }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackPageXRef = useRef(0);
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState('');

  const progress = (value - min) / (max - min);
  const thumbLeft = trackWidth > 0 ? progress * (trackWidth - 24) : 0;

  const measureTrack = () => {
    trackRef.current?.measure((_fx, _fy, w, _h, pageX) => {
      trackPageXRef.current = pageX;
      if (w > 0) setTrackWidth(w);
    });
  };

  const handleTouch = (pageX: number) => {
    const w = trackWidth;
    if (w === 0) return;
    const local = pageX - trackPageXRef.current;
    const clamped = Math.max(0, Math.min(w, local));
    const ratio = clamped / w;
    const newVal = Math.round(min + ratio * (max - min));
    onChange(Math.max(min, Math.min(max, newVal)));
  };

  const commitInput = () => {
    const parsed = parseInt(inputText, 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
    setEditing(false);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.minLabel}>{min}m</Text>

        {editing ? (
          <TextInput
            style={styles.valueInput}
            value={inputText}
            onChangeText={setInputText}
            keyboardType="number-pad"
            autoFocus
            onBlur={commitInput}
            onSubmitEditing={commitInput}
            selectTextOnFocus
            maxLength={3}
          />
        ) : (
          <TouchableOpacity onPress={() => { setInputText(String(value)); setEditing(true); }} activeOpacity={0.7}>
            <Text style={styles.valueLabel}>{value} min</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.maxLabel}>{max}m</Text>
      </View>
      <View
        ref={trackRef}
        style={styles.track}
        onLayout={measureTrack}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e: GestureResponderEvent) => {
          measureTrack();
          handleTouch(e.nativeEvent.pageX);
        }}
        onResponderMove={(e: GestureResponderEvent) => handleTouch(e.nativeEvent.pageX)}
      >
        <View style={[styles.fill, { width: `${progress * 100}%` as any }]} />
        <View style={[styles.thumb, { left: thumbLeft }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  minLabel: { fontSize: 11, color: 'rgba(20,16,28,0.4)' },
  maxLabel: { fontSize: 11, color: 'rgba(20,16,28,0.4)' },
  valueLabel: { fontSize: 15, fontWeight: '700', color: PINK_TEXT },
  valueInput: {
    fontSize: 15,
    fontWeight: '700',
    color: PINK_TEXT,
    borderBottomWidth: 1.5,
    borderBottomColor: PINK_TEXT,
    minWidth: 52,
    textAlign: 'center',
    paddingVertical: 0,
  },
  track: {
    height: 6, borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.08)',
    justifyContent: 'center',
  },
  fill: { height: 6, borderRadius: 9999, backgroundColor: PINK, position: 'absolute', left: 0 },
  thumb: {
    position: 'absolute',
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2, borderColor: PINK_TEXT,
    top: -9,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
});
