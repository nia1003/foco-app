/**
 * PetRenderer — renders either a static Image or a custom component pet.
 * Use this everywhere a pet image is displayed so xingwang (and future
 * vector/3D pets) work automatically.
 */
import React from 'react';
import { Image } from 'react-native';
import type { Pet } from '@/constants/pets';

interface PetRendererProps {
  pet: Pet;
  size: number;
  interactive?: boolean;
}

export function PetRenderer({ pet, size, interactive = true }: PetRendererProps) {
  if (pet.CustomComponent) {
    const PetComponent = pet.CustomComponent;
    return <PetComponent size={size} color={pet.accent} interactive={interactive} />;
  }
  return (
    <Image
      source={pet.image}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
