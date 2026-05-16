import React, { useRef, useMemo } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebView as WebViewType } from 'react-native-webview';

interface PetWebViewProps {
  html: string;
  size: number;
  interactive?: boolean;
}

export function PetWebView({ html, size, interactive = true }: PetWebViewProps) {
  const webViewRef = useRef<WebViewType>(null);
  const lastPos = useRef({ x: 0, y: 0 });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Claim the gesture immediately so the parent ScrollView cannot steal it
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: () => interactive,
        onPanResponderGrant: (_, g) => {
          lastPos.current = { x: g.moveX, y: g.moveY };
        },
        onPanResponderMove: (_, g) => {
          const ddx = g.moveX - lastPos.current.x;
          const ddy = g.moveY - lastPos.current.y;
          lastPos.current = { x: g.moveX, y: g.moveY };
          webViewRef.current?.injectJavaScript(
            `if(window.rotatePet)window.rotatePet(${ddx.toFixed(2)},${ddy.toFixed(2)});true;`,
          );
        },
        onPanResponderRelease: () => {},
        onPanResponderTerminate: () => {},
      }),
    [interactive],
  );

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        renderToHardwareTextureAndroid
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        javaScriptEnabled
      />
      {interactive && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]} {...panResponder.panHandlers} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    backgroundColor: 'transparent',
  },
});
