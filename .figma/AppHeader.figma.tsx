import figma from '@figma/code-connect';
import { AppHeader } from '../components/layout/AppHeader';

figma.connect(AppHeader, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=AppHeader', {
  props: {
    title: figma.string('Title'),
    showBack: figma.boolean('ShowBack'),
    rightAction: figma.boolean('RightAction'),
  },
  example: ({ title, showBack }) => (
    <AppHeader title={title ?? 'Screen Title'} showBack={showBack} />
  ),
});
