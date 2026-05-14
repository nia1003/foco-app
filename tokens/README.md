# FOCO Design Tokens

Source of truth: `constants/theme.ts`  
Export format: W3C Design Tokens Community Group (DTCG)

## 匯入 Figma 步驟

1. 安裝 [Tokens Studio for Figma](https://tokens.studio/) 插件
2. 打開插件 → Settings → Add new → JSON/Local file
3. 選擇 `tokens.json`
4. Apply to document → 所有 token 自動轉成 Figma Variables

## 同步 workflow

```
theme.ts 改動
  → 手動更新 tokens.json (或跑 npm run tokens:build)
  → Tokens Studio: Sync to Figma
  → Figma Variables 自動更新
```

## Figma Component Library 結構

建議在 Figma 建立以下 pages：

```
Page 1: 🎨 Tokens & Foundations
  - Color swatches (對應 color.*)
  - Spacing scale
  - Typography scale
  - Border radius scale
  - Shadow styles

Page 2: 🧱 UI Components
  - Button (variant × size matrix)
  - Input (states)
  - Card / GlassCard
  - ProgressBar
  - CircularTimer
  - PomodoroDotPicker
  - SessionModals

Page 3: 🏗 Layout Components
  - AppHeader
  - TabBar
  - OnboardingHeader

Page 4: 🐾 Pet Components
  - PetAvatar (all 8 variants)

Page 5: 📱 Screens
  - Welcome, Signup, Profile, Pet, Done (onboarding)
  - Home, Stats, Farm, Missions, Focus Timer, Settings (main app)
```

## Code Connect (未來)

安裝後可在 Figma 的組件上直接看到 React Native 代碼：

```bash
npm install --save-dev @figma/code-connect
npx figma connect publish --token YOUR_FIGMA_TOKEN
```
