const StyleDictionary = require('style-dictionary');

// ── Custom format: Tokens Studio compatible JSON ──
StyleDictionary.registerFormat({
  name: 'tokens-studio/json',
  formatter: ({ dictionary }) => {
    const output = {};
    dictionary.allTokens.forEach((token) => {
      const parts = token.path; // e.g. ['color', 'primary']
      let obj = output;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          obj[part] = {
            value: token.original.value,
            $type: token.original.$type ?? 'other',
            ...(token.original.description ? { description: token.original.description } : {}),
          };
        } else {
          obj[part] = obj[part] ?? {};
          obj = obj[part];
        }
      });
    });
    return JSON.stringify(output, null, 2);
  },
});

// ── Custom format: React Native theme.ts ──
StyleDictionary.registerFormat({
  name: 'rn/theme-ts',
  formatter: ({ dictionary }) => {
    const colors = {};
    const spacing = {};
    const fontSize = {};
    const borderRadius = {};
    const fontWeight = {};

    dictionary.allTokens.forEach((token) => {
      const [group, name] = token.path;
      if (group === 'color')        colors[name]       = token.value;
      if (group === 'spacing')      spacing[name]      = Number(token.value);
      if (group === 'fontSize')     fontSize[name]     = Number(token.value);
      if (group === 'borderRadius') borderRadius[name] = Number(token.value);
      if (group === 'fontWeight')   fontWeight[name]   = token.value;
    });

    return `// AUTO-GENERATED — do not edit. Run: npm run tokens:build
// Source: tokens/tokens.json

export const Colors = ${JSON.stringify(colors, null, 2)} as const;

export const Spacing = ${JSON.stringify(spacing, null, 2)} as const;

export const Radius = ${JSON.stringify(borderRadius, null, 2)} as const;

export const FontSize = ${JSON.stringify(fontSize, null, 2)} as const;

export const FontWeight = ${JSON.stringify(fontWeight, null, 2)};

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
};
`;
  },
});

module.exports = {
  source: ['tokens/tokens.json'],
  platforms: {
    // ① Tokens Studio–compatible JSON → import into Figma plugin
    figma: {
      transformGroup: 'js',
      buildPath: 'tokens/build/',
      files: [
        {
          destination: 'figma-tokens.json',
          format: 'tokens-studio/json',
        },
      ],
    },

    // ② React Native theme.ts (keeps constants/theme.ts in sync)
    rn: {
      transformGroup: 'js',
      buildPath: 'tokens/build/',
      files: [
        {
          destination: 'theme.generated.ts',
          format: 'rn/theme-ts',
        },
      ],
    },

    // ③ CSS custom properties (optional, for web Storybook)
    css: {
      transformGroup: 'css',
      buildPath: 'tokens/build/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: { outputReferences: true },
        },
      ],
    },
  },
};
