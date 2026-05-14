import figma from '@figma/code-connect';
import { PomodoroDotPicker } from '../components/ui/PomodoroDotPicker';

figma.connect(PomodoroDotPicker, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=PomodoroDotPicker', {
  props: {
    value: figma.number('Value'),
    max: figma.number('Max'),
  },
  example: ({ value, max }) => (
    <PomodoroDotPicker
      value={value ?? 2}
      max={max ?? 8}
      onChange={() => {}}
    />
  ),
});
