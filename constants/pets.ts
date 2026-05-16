/**
 * Pet character definitions.
 * Images go in: assets/pets/
 * Filenames match the id below.
 *
 * CustomComponent: optional React component for vector/3D pets.
 * When set, PetRenderer uses this instead of the image prop.
 */
import type { ComponentType } from 'react';
import { XingWangPet3D } from '@/components/pets/XingWangPet3D';
import { PenguinPet3D } from '@/components/pets/PenguinPet3D';

export interface Pet {
  id: string;
  name: string;
  trait: string;
  accent: string;       // theme color for selection highlight
  image: any;           // require('../assets/pets/xxx.png')
  CustomComponent?: ComponentType<{ size: number; color?: string }>;
  locked?: boolean;     // coming soon
}

export const PETS: Pet[] = [
  {
    id: 'xingwang',
    name: 'Xingwang',
    trait: 'Round & cheerful',
    accent: '#FABD03',
    image: require('../assets/pets/bean.png'),
    CustomComponent: XingWangPet3D,
  },
  {
    id: 'penguin',
    name: 'Penguin',
    trait: 'Cool & composed',
    accent: '#5b8dee',
    image: require('../assets/pets/bean.png'),
    CustomComponent: PenguinPet3D,
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
    accent: '#e7a0cc',
    image: require('../assets/pets/fluff.png'),
    locked: true,
  },
];
