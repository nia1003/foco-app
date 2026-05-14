/**
 * Pet character definitions.
 * Images go in: assets/pets/
 * Filenames match the id below.
 */
export interface Pet {
  id: string;
  name: string;
  trait: string;
  accent: string;       // theme color for selection highlight
  image: any;           // require('../assets/pets/xxx.png')
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
    accent: '#e84797',
    image: require('../assets/pets/spike.png'),
  },
];
