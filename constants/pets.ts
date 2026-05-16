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

export interface Pet {
  id: string;
  name: string;
  trait: string;
  accent: string;       // theme color for selection highlight
  image: any;           // require('../assets/pets/xxx.png')
  CustomComponent?: ComponentType<{ size: number; color?: string }>;
}

export const PETS: Pet[] = [
  {
    id: 'bean',
    name: 'Bean',
    trait: 'Cool & steady',
    accent: '#4ecdc4',
    image: require('../assets/pets/bean.png'),
  },
  {
    id: 'fluff',
    name: 'Fluff',
    trait: 'Soft & dreamy',
    accent: '#e7a0cc',
    image: require('../assets/pets/fluff.png'),
  },
  {
    id: 'jelly',
    name: 'Jelly',
    trait: 'Shy & curious',
    accent: '#f6cfdc',
    image: require('../assets/pets/jelly.png'),
  },
  {
    id: 'spirit',
    name: 'Spirit',
    trait: 'Free & glowing',
    accent: '#94c2da',
    image: require('../assets/pets/spirit.png'),
  },
  {
    id: 'spike',
    name: 'Spike',
    trait: 'Bold & spiky',
    accent: '#F2CEDC',
    image: require('../assets/pets/spike.png'),
  },
  {
    id: 'xingwang',
    name: 'Xingwang',
    trait: 'Round & cheerful',
    accent: '#FABD03',
    image: require('../assets/pets/bean.png'), // fallback if CustomComponent unavailable
    CustomComponent: XingWangPet3D,
  },
];
