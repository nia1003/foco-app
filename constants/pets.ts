import type { ComponentType } from 'react';

export interface Pet {
  id: string;
  name: string;
  trait: string;
  accent: string;
  image: any;
  upgradeImage?: any; // 進化後的 2D 圖片，用於備用與明信片截圖
  CustomComponent?: ComponentType<{ size: number; color?: string; interactive?: boolean }>;
  modelUri?: any;
  upgradeModelUri?: any;
  scale?: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
  locked?: boolean;
}

export const PETS: Pet[] = [
  {
    id: 'sunion',
    name: 'chick',
    trait: 'Rhythm & focus',
    accent: '#FACC15', 
    image: require('../assets/pets/chick.png'),
    upgradeImage: require('../assets/pets/chick.png'), // 請確保有對應的圖片，這裡暫用原圖示範
    modelUri: require('../assets/models/chick.glb'),
    upgradeModelUri: require('../assets/models/chick_upgrade.glb'),
    scale: 1.8,
    rotation: [0, -1.57, 0],
    position: [0, 0, 0],
    locked: false,
  },
  {
    id: 'lily',
    name: 'shiba',
    trait: 'Loyal & energetic',
    accent: '#F97316', 
    image: require('../assets/pets/shiba.png'),
    upgradeImage: require('../assets/pets/shiba.png'),
    modelUri: require('../assets/models/shiba.glb'),
    upgradeModelUri: require('../assets/models/shiba_upgrade.glb'),
    scale: 1.8,
    rotation: [0, -1.57, 0],
    position: [0, 0, 0],
    locked: false,
  },
  {
    id: 'bean',
    name: 'cat',
    trait: 'Lazy but smart',
    accent: '#84CC16', 
    image: require('../assets/pets/cat.png'),
    upgradeImage: require('../assets/pets/cat.png'),
    modelUri: require('../assets/models/cat.glb'),
    upgradeModelUri: require('../assets/models/cat_upgrade.glb'),
    scale: 1.8,
    rotation: [0, -1.57, 0],
    position: [0, 0, 0],
    locked: false,
  },
  {
    id: 'fluff',
    name: 'rabbit',
    trait: 'Quick & quiet',
    accent: '#F472B6', 
    image: require('../assets/pets/rabbit.png'),
    upgradeImage: require('../assets/pets/rabbit.png'),
    modelUri: require('../assets/models/rabbit.glb'),
    // upgradeModelUri: require('../assets/models/rabbit_upgrade.glb'), 待檔案備妥後開啟
    scale: 1.8,
    rotation: [0, -1.57, 0], 
    position: [0, 0, 0], 
    locked: false,
  },
  {
    id: 'stay',
    name: 'racoon',
    trait: 'Curious & clever',
    accent: '#A8A29E', 
    image: require('../assets/pets/racoon.png'),
    upgradeImage: require('../assets/pets/racoon.png'),
    modelUri: require('../assets/models/racoon.glb'),
    upgradeModelUri: require('../assets/models/racoon_upgrade.glb'),
    scale: 1.8,
    rotation: [0, -1.57, 0],
    position: [0, 0, 0],
    locked: false,
  }
];