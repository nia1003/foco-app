/**
 * SunionPet — 2D SVG version of the user's drawn 3D character.
 * Concave-notch body, dot eyes, arm blobs, foot blobs, floating animation.
 * Proportions ported from the original Three.js sunion.jsx.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';

const DEFAULT_COLOR = '#FABD03';
const EYE_COLOR = '#111111';

// ViewBox reference dimensions
const VW = 200;
const VH = 240;

interface SunionPetProps {
  size?: number;       // rendered width in px (height scales proportionally)
  color?: string;      // body colour (defaults to warm yellow)
  animate?: boolean;   // floating idle animation
}

export function SunionPet({
  size = 120,
  color = DEFAULT_COLOR,
  animate = true,
}: SunionPetProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animate]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  // ── Key positions (viewBox 0 0 200 240) ──────────────────────────────
  // Body
  const bx = 100, by = 122, br = 72;
  // Notch (concave dent at front-top of body, matching 3D notchCenter)
  const nx = 100, ny = 66, nr = 28;
  // Limbs
  const lax = 38,  lay = 122, lar = 18;   // left arm
  const rax = 162, ray = 122, rar = 18;   // right arm
  const lfx = 76,  lfy = 197, lfr = 22;   // left foot
  const rfx = 124, rfy = 197, rfr = 22;   // right foot
  // Eyes (front-facing, slightly above body centre)
  const lex = 78,  ley = 114, ler = 6.5;  // left eye
  const rex = 122, rey = 114, rer = 6.5;  // right eye

  // ClipPath path: full rect minus notch circle (evenodd = punches hole)
  const notchPath =
    `M 0 0 H ${VW} V ${VH} H 0 Z ` +
    `M ${nx} ${ny} m ${-nr} 0 a ${nr} ${nr} 0 1 0 ${nr * 2} 0 a ${nr} ${nr} 0 1 0 ${-nr * 2} 0`;

  const svgHeight = size * (VH / VW);

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Svg width={size} height={svgHeight} viewBox={`0 0 ${VW} ${VH}`}>
        <Defs>
          {/* Clip path that excludes the notch circle from the body */}
          <ClipPath id="xwBodyClip">
            <Path d={notchPath} clipRule="evenodd" />
          </ClipPath>
        </Defs>

        {/* Ground shadow — squishes when floating up */}
        <Ellipse cx={100} cy={228} rx={44} ry={9} fill="rgba(0,0,0,0.07)" />

        {/* Feet (rendered behind body) */}
        <Circle cx={lfx} cy={lfy} r={lfr} fill={color} />
        <Circle cx={rfx} cy={rfy} r={rfr} fill={color} />

        {/* Arms */}
        <Circle cx={lax} cy={lay} r={lar} fill={color} />
        <Circle cx={rax} cy={ray} r={rar} fill={color} />

        {/* Body with notch clipped out */}
        <Circle cx={bx} cy={by} r={br} fill={color} clipPath="url(#xwBodyClip)" />

        {/* Notch inner shadow — adds concave depth */}
        <Circle cx={nx} cy={ny} r={nr - 2} fill="rgba(0,0,0,0.09)" />

        {/* Eyes */}
        <Circle cx={lex} cy={ley} r={ler} fill={EYE_COLOR} />
        <Circle cx={rex} cy={rey} r={rer} fill={EYE_COLOR} />

        {/* Eye specular highlights */}
        <Circle cx={lex + 2} cy={ley - 2.5} r={2} fill="#ffffff" />
        <Circle cx={rex + 2} cy={rey - 2.5} r={2} fill="#ffffff" />
      </Svg>
    </Animated.View>
  );
}
