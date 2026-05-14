import figma from '@figma/code-connect';
import { GlassCard } from '../components/ui/GlassCard';
import { Text } from 'react-native';

figma.connect(GlassCard, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=GlassCard', {
  props: {},
  example: () => (
    <GlassCard>
      <Text>Glass card content</Text>
    </GlassCard>
  ),
});
