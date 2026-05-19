import type { LucideIcon } from 'lucide-react-native';
import {
  BookOpen,
  Briefcase,
  Code2,
  Dumbbell,
  FlaskConical,
  Headphones,
  Lightbulb,
  Music2,
  Palette,
  Pencil,
  Sprout,
  Star,
  Target,
  Timer,
  Coffee,
} from 'lucide-react-native';

export const TASK_EMOJI_OPTIONS = [
  '📚', '✏️', '💻', '🎯', '💼', '🎨', '🎵', '🏃', '🔬', '🌱', '☕', '💡',
  '📝', '⭐', '🌊', '✅', '📬', '🌅', '🏆', '❤️', '🔥', '⚡', '📌', '🧠',
] as const;

export const TASK_SVG_ICONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'book', label: 'Book', Icon: BookOpen },
  { id: 'pencil', label: 'Write', Icon: Pencil },
  { id: 'code', label: 'Code', Icon: Code2 },
  { id: 'target', label: 'Goal', Icon: Target },
  { id: 'briefcase', label: 'Work', Icon: Briefcase },
  { id: 'palette', label: 'Art', Icon: Palette },
  { id: 'music', label: 'Music', Icon: Music2 },
  { id: 'fitness', label: 'Fitness', Icon: Dumbbell },
  { id: 'science', label: 'Science', Icon: FlaskConical },
  { id: 'plant', label: 'Grow', Icon: Sprout },
  { id: 'coffee', label: 'Coffee', Icon: Coffee },
  { id: 'idea', label: 'Idea', Icon: Lightbulb },
  { id: 'star', label: 'Star', Icon: Star },
  { id: 'timer', label: 'Timer', Icon: Timer },
  { id: 'headphones', label: 'Audio', Icon: Headphones },
];

export function findTaskSvgIcon(id: string) {
  return TASK_SVG_ICONS.find((i) => i.id === id);
}
