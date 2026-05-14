import figma from '@figma/code-connect';
import { ProgressBar } from '../components/ui/ProgressBar';

figma.connect(ProgressBar, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=ProgressBar', {
  props: {
    progress: figma.number('Progress'),
    color: figma.string('Color'),
  },
  example: ({ progress, color }) => (
    <ProgressBar progress={progress} color={color} />
  ),
});
