/**

 * AppBackground — theme-aware radial glow background.

 */

import React from 'react';

import { Dimensions, StyleSheet, View } from 'react-native';

import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { useAppTheme } from '@/hooks/useAppTheme';



const { width: W, height: H } = Dimensions.get('window');



export function AppBackground() {

  const { isDark, background } = useAppTheme();

  const gradId = isDark ? 'bgDark' : 'bgLight';



  return (

    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">

      <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>

        <Defs>

          <RadialGradient

            id={gradId}

            cx="50%"

            cy={isDark ? '40%' : '45%'}

            rx={isDark ? '55%' : '52%'}

            ry={isDark ? '55%' : '52%'}

            gradientUnits="objectBoundingBox"

          >

            <Stop

              offset="0%"

              stopColor={background.glowCenter}

              stopOpacity={isDark ? '0.45' : '0.55'}

            />

            <Stop

              offset={isDark ? '50%' : '45%'}

              stopColor={background.glowMid}

              stopOpacity={isDark ? '0.25' : '0.30'}

            />

            <Stop

              offset={isDark ? '100%' : '80%'}

              stopColor={background.glowOuter}

              stopOpacity={isDark ? '0' : '0.10'}

            />

            <Stop offset="100%" stopColor={background.glowEdge} stopOpacity="0" />

          </RadialGradient>

        </Defs>

        <Rect x="0" y="0" width={W} height={H} fill={background.baseFill} />

        <Rect x="0" y="0" width={W} height={H} fill={`url(#${gradId})`} />

      </Svg>

    </View>

  );

}

