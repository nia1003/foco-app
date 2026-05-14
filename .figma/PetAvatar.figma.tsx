import figma from '@figma/code-connect';
import { PetAvatar } from '../components/pet/PetAvatar';

figma.connect(PetAvatar, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=PetAvatar', {
  props: {
    petType: figma.enum('PetType', {
      sprout: 'sprout',
      cat: 'cat',
      bunny: 'bunny',
      hamster: 'hamster',
      fox: 'fox',
      chick: 'chick',
      bear: 'bear',
      panda: 'panda',
    }),
    size: figma.enum('Size', { sm: 'sm', md: 'md', lg: 'lg' }),
    animate: figma.boolean('Animate'),
  },
  example: ({ petType, size, animate }) => (
    <PetAvatar
      petType={petType ?? 'sprout'}
      size={size ?? 'md'}
      animate={animate ?? true}
    />
  ),
});
