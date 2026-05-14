import figma from '@figma/code-connect';
import { CircularTimer } from '../components/ui/CircularTimer';

figma.connect(CircularTimer, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=CircularTimer', {
  props: {
    progress: figma.number('Progress'),
    timeLabel: figma.string('TimeLabel'),
    size: figma.number('Size'),
  },
  example: ({ progress, timeLabel, size }) => (
    <CircularTimer
      progress={progress}
      timeLabel={timeLabel}
      size={size ?? 240}
    />
  ),
});
