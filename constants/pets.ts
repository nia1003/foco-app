/**
 * Pet character definitions.
 * CustomComponent: optional React component for vector/3D pets.
 * When set, PetRenderer uses this instead of the image prop.
 */
import type { ComponentType } from 'react';
import { SunionPet3D } from '@/components/pets/SunionPet3D';
import { LilyPet3D } from '@/components/pets/LilyPet3D';
import { FluffPet3D } from '@/components/pets/FluffPet3D';
import { StayPet3D } from '@/components/pets/StayPet3D';

export interface Pet {
  id: string;
  name: string;
  trait: string;
  accent: string;
  image: any;
  CustomComponent?: ComponentType<{ size: number; color?: string; interactive?: boolean }>;
  locked?: boolean;
}

export const PETS: Pet[] = [
  {
    id: 'sunion',
    name: 'Sunion',
    trait: 'Round & cheerful',
    accent: '#FABD03',
    image: require('../assets/pets/bean.png'),
    CustomComponent: SunionPet3D,
  },
  {
    id: 'lily',
    name: 'Lily',
    trait: 'Bright & blooming',
    accent: '#e03060',
    image: require('../assets/pets/fluff.png'),
    CustomComponent: LilyPet3D,
  },
  {
    id: 'bean',
    name: 'Bean',
    trait: 'Cool & steady',
    accent: '#4ecdc4',
    image: require('../assets/pets/bean.png'),
    locked: true,
  },
  {
    id: 'fluff',
    name: 'Fluff',
    trait: 'Soft & dreamy',
    accent: '#4ecdc4',
    image: require('../assets/pets/fluff.png'),
    CustomComponent: FluffPet3D,
  },
  {
    id: 'stay',
    name: 'Stay',
    trait: 'Calm & starry',
    accent: '#C4A8E8',
    image: require('../assets/pets/fluff.png'),
    CustomComponent: StayPet3D,
  },
];
