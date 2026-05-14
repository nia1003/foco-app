import figma from '@figma/code-connect';
import { TabBar } from '../components/layout/TabBar';

figma.connect(TabBar, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=TabBar', {
  props: {
    activeTab: figma.enum('ActiveTab', {
      missions: 'missions',
      focus: 'focus',
      stats: 'stats',
      sanctuary: 'sanctuary',
    }),
  },
  example: () => (
    <TabBar />
  ),
});
