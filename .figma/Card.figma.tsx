import figma from '@figma/code-connect';
import { Card } from '../components/ui/Card';
import { Text } from 'react-native';

figma.connect(Card, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=Card', {
  props: {
    elevated: figma.boolean('Elevated'),
  },
  example: ({ elevated }) => (
    <Card elevated={elevated}>
      <Text>Card content</Text>
    </Card>
  ),
});
