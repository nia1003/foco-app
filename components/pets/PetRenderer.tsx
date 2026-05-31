import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Image, View, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useAssets } from 'expo-asset';
import type { Pet } from '@/constants/pets';

function GLTFModel({ uri, scale = 1, rotation = [0, 0, 0], position = [0, -1, 0], onLoad }: any) {
  const [assets, error] = useAssets([uri]);

  if (error) {
    console.error("Model load error:", error);
    return null;
  }
  if (!assets) return null;

  return (
    <GLTFModelLoaded 
      uri={assets[0].localUri || assets[0].uri} 
      scale={scale} 
      rotation={rotation} 
      position={position} 
      onLoad={onLoad}
    />
  );
}

function GLTFModelLoaded({ uri, scale, rotation, position, onLoad }: any) {
  const { scene } = useGLTF(uri as string) as any;
  const groupRef = useRef<any>(null);

  useEffect(() => {
    if (scene && onLoad) {
      onLoad();
    }
  }, [scene, onLoad]);

  useFrame((state) => {
    if (groupRef.current) {
      const floatOffset = Math.sin(state.clock.elapsedTime * 3) * 0.06;
      groupRef.current.position.y = position[1] + floatOffset;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive key={uri} object={scene} scale={scale} rotation={rotation} dispose={null} />
    </group>
  );
}

interface PetRendererProps {
  pet: Pet;
  size: number;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>; 
  force2D?: boolean;
  level?: number;
  scaleMultiplier?: number; // 新增模型放大倍率
}

export function PetRenderer({ 
  pet, 
  size, 
  interactive = true, 
  style, 
  force2D = false, 
  level = 1, 
  scaleMultiplier = 1 // 預設倍率為 1
}: PetRendererProps) {
  const [modelLoaded, setModelLoaded] = useState(false);
  
  const isEvolved = level >= 5;
  const activeModelUri = (isEvolved && pet.upgradeModelUri) ? pet.upgradeModelUri : pet.modelUri;
  const activeImage = (isEvolved && pet.upgradeImage) ? pet.upgradeImage : pet.image;

  useEffect(() => {
    setModelLoaded(false);
  }, [activeModelUri]);

  if (!force2D) {
    if (pet.CustomComponent) {
      const PetComponent = pet.CustomComponent;
      return (
        <View style={[{ width: size, height: size }, style]}>
          <PetComponent size={size} color={pet.accent} interactive={interactive} />
        </View>
      );
    }

    if (activeModelUri) {
      // 乘上放大倍率
      const finalScale = (pet.scale || 1) * scaleMultiplier;

      return (
        <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
          {!modelLoaded && (
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
              <Image
                source={activeImage}
                style={{ width: '80%', height: '80%', opacity: 0.5 }}
                resizeMode="contain"
              />
            </View>
          )}
          <Canvas 
            dpr={[1, 1.5]} 
            gl={{ antialias: false, powerPreference: "high-performance" }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            camera={{ position: [0, 2, 6], fov: 45 }}
          >
            <ambientLight intensity={3} />
            <directionalLight position={[10, 10, 10]} intensity={1.0} />
            <directionalLight position={[-10, 10, -10]} intensity={1.0} />
            
            <Suspense fallback={null}>
              <GLTFModel 
                uri={activeModelUri} 
                scale={finalScale} 
                rotation={pet.rotation} 
                position={pet.position} 
                onLoad={() => setModelLoaded(true)}
              />
            </Suspense>
          </Canvas>
        </View>
      );
    }
  }

  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Image source={activeImage} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
    </View>
  );
}