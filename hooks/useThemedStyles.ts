import { useMemo } from 'react';

import { useAppTheme, type AppTheme } from '@/hooks/useAppTheme';

export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useAppTheme();

  return useMemo(
    () => factory(theme),

    [theme.isDark, theme.colors, theme.surfaces, theme.screenBg],
  );
}
