import figma from '@figma/code-connect';
import { Button } from '../components/ui/Button';

figma.connect(Button, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=Button', {
  props: {
    variant: figma.enum('Variant', {
      primary: 'primary',
      secondary: 'secondary',
      outline: 'outline',
      ghost: 'ghost',
    }),
    size: figma.enum('Size', { sm: 'sm', md: 'md', lg: 'lg' }),
    label: figma.string('Label'),
    disabled: figma.boolean('Disabled'),
  },
  example: ({ variant, size, label, disabled }) => (
    <Button
      variant={variant}
      size={size}
      label={label}
      disabled={disabled}
      onPress={() => {}}
    />
  ),
});
