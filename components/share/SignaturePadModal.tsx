import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { receiptType, shareChromeType } from '@/constants/shareTypography';
import type { SavedSignature } from './signatureTypes';

interface Props {
  visible: boolean;
  initial?: SavedSignature | null;
  onCancel: () => void;
  onSave: (signature: SavedSignature) => void;
}

export function SignaturePadModal({
  visible,
  initial,
  onCancel,
  onSave,
}: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: 320, h: 160 });
  const pathsRef = useRef<string[]>([]);
  const drawingRef = useRef(false);
  const currentPathRef = useRef('');

  const syncPaths = useCallback((next: string[]) => {
    pathsRef.current = next;
    setPaths(next);
  }, []);

  useEffect(() => {
    if (visible) {
      const initialPaths = initial?.paths ?? [];
      syncPaths([...initialPaths]);
      currentPathRef.current = '';
      drawingRef.current = false;
    }
  }, [visible, initial, syncPaths]);

  const resetCanvas = () => {
    currentPathRef.current = '';
    drawingRef.current = false;
    syncPaths([]);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        drawingRef.current = true;
        currentPathRef.current = `M${locationX.toFixed(1)},${locationY.toFixed(
          1,
        )}`;
        syncPaths([...pathsRef.current, currentPathRef.current]);
      },
      onPanResponderMove: (evt) => {
        if (!drawingRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current += ` L${locationX.toFixed(
          1,
        )},${locationY.toFixed(1)}`;
        const base = pathsRef.current.slice(0, -1);
        syncPaths([...base, currentPathRef.current]);
      },
      onPanResponderRelease: () => {
        drawingRef.current = false;
        currentPathRef.current = '';
      },
      onPanResponderTerminate: () => {
        drawingRef.current = false;
        currentPathRef.current = '';
      },
    }),
  ).current;

  const handleSave = () => {
    const committed = pathsRef.current.filter((p) => p.length > 8);
    if (!committed.length) return;
    onSave({
      paths: committed,
      width: canvasSize.w,
      height: canvasSize.h,
    });
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={[receiptType.sectionLabel, styles.signHere]}>SIGN HERE</Text>

          <View
            style={styles.canvasWrap}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              if (width > 0 && height > 0) {
                setCanvasSize({ w: width, h: height });
              }
            }}
            {...panResponder.panHandlers}
          >
            <Svg
              width={canvasSize.w}
              height={canvasSize.h}
              style={StyleSheet.absoluteFill}
            >
              {paths.map((d, i) => (
                <Path
                  key={`stroke-${i}`}
                  d={d}
                  stroke="#111"
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </Svg>
          </View>

          <Text style={[receiptType.hint, styles.signatureLabel]}>--- SIGNATURE ---</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={shareChromeType.close}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={resetCanvas}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  shareChromeType.close,
                  paths.length === 0 && styles.btnMuted,
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btnPrimary,
                paths.length === 0 && styles.btnPrimaryDisabled,
              ]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={paths.length === 0}
            >
              <Text style={styles.btnPrimaryText}>Save signature</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,16,28,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(20,16,28,0.12)',
  },
  signHere: {
    marginBottom: 10,
  },
  canvasWrap: {
    height: 160,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(20,16,28,0.25)',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  signatureLabel: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  btnGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(20,16,28,0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMuted: { color: 'rgba(20,16,28,0.3)' },
  btnPrimary: {
    flex: 1.4,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryDisabled: { opacity: 0.45 },
  btnPrimaryText: {
    ...shareChromeType.action,
    color: '#fff',
  },
});
