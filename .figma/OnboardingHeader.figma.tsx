import figma from '@figma/code-connect';
import { OnboardingHeader } from '../components/layout/OnboardingHeader';

figma.connect(OnboardingHeader, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=OnboardingHeader', {
  props: {
    step: figma.number('Step'),
    total: figma.number('Total'),
    title: figma.string('Title'),
    subtitle: figma.string('Subtitle'),
  },
  example: ({ step, total, title, subtitle }) => (
    <OnboardingHeader
      step={step ?? 1}
      total={total ?? 4}
      title={title ?? 'Welcome'}
      subtitle={subtitle}
    />
  ),
});
