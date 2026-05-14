import figma from '@figma/code-connect';
import { ReflectionModal } from '../components/ui/SessionModals';

figma.connect(ReflectionModal, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=ReflectionModal', {
  props: {
    visible: figma.boolean('Visible'),
    taskTitle: figma.string('TaskTitle'),
  },
  example: ({ visible, taskTitle }) => (
    <ReflectionModal
      visible={visible ?? true}
      taskTitle={taskTitle ?? 'Task name'}
      distractionCount={0}
      onConfirm={() => {}}
      onAddDistraction={() => {}}
    />
  ),
});
