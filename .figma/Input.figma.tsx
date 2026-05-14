import figma from '@figma/code-connect';
import { Input } from '../components/ui/Input';

figma.connect(Input, 'https://www.figma.com/design/PLACEHOLDER/FOCO-Design-System?node-id=Input', {
  props: {
    placeholder: figma.string('Placeholder'),
    label: figma.string('Label'),
    error: figma.string('Error'),
    secureTextEntry: figma.boolean('Password'),
  },
  example: ({ placeholder, label, error, secureTextEntry }) => (
    <Input
      label={label}
      placeholder={placeholder}
      error={error}
      secureTextEntry={secureTextEntry}
      value=""
      onChangeText={() => {}}
    />
  ),
});
