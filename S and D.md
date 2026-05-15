# FOCO 分階段開發計畫

## 開發基準

- Branch: `feature/foco-phased-plan`
- 技術基準: Expo 54, Expo Router 6, React Native 0.81, Liquid Glass theme
- Spec 來源: 以目前 repo 實作為主，整合 `foco-architecture.html` 的產品架構與流程
- 測試策略: Jest + React Native Testing Library + TypeScript checks，不使用 pytest

## Phase 0 - Branch、文件、測試基礎建設

- [x] 建立 branch: `feature/foco-phased-plan`
- [x] 新增本開發計畫文件
- [x] 新增 `test`, `test:watch`, `typecheck` scripts
- [x] 安裝 Expo 相容測試套件
- [x] 建立 Jest config 與 setup mocks
- [x] 建立 baseline tests: theme tokens, UI components, stores
- [x] 驗證 `npm run typecheck`
- [x] 驗證 `npm test`

## Phase 1 - 導航與 Onboarding 穩定化

- [ ] 對齊 auth route guard: 未登入進 `(auth)`，登入後預設進 `/(app)/home`
- [ ] 串起 welcome, signup, profile, pet, consent, done
- [ ] onboarding 寫入 `authStore` / `userStore`
- [ ] 補 route guard 與 onboarding flow tests

## Phase 2 - 狀態層與 Service Fallback

- [ ] 補齊 mission, session, pet, stats, backpack 狀態
- [ ] Auth token 繼續用 `expo-secure-store`
- [ ] user/game 狀態使用 Expo Go 相容 persistence
- [ ] `gameService` 增加 local seed fallback
- [ ] 補 store actions, service fallback, hydration tests

## Phase 3 - Mission / Focus Timer / Reward Loop

- [ ] Missions list, detail, focus timer, reflection, accomplished flow 串到 `gameStore`
- [ ] Timer 補齊 pause, resume, complete, distraction 行為
- [ ] mission 完成後更新 XP, coins, streak, backpack rewards
- [ ] 補 fake timer 與 reward loop tests

## Phase 4 - Pet / Farm / Backpack / Stats

- [ ] Pet selection 影響 Home/Sanctuary 顯示
- [ ] Farm plot 支援 plant / harvest local flow
- [ ] Backpack 支援 quantity, use item, empty state
- [ ] Stats 顯示 weekly focus, category breakdown, streak / XP
- [ ] 補 farm, backpack, stats 與主要畫面 smoke tests

## Phase 5 - UI 驗收與文件同步

- [ ] 依 `UI-TESTING-CHECKLIST.md` 驗證 UI rounding, spacing, colors
- [ ] 文件標明實際版本為 Expo 54 / Router 6
- [ ] 跑完整驗證: `npm run typecheck`, `npm test`, Expo Go smoke test
- [ ] 記錄剩餘風險與下一階段事項

## Phase 0 驗收指令

```bash
npm run typecheck
npm test
```

## 已知風險

- `npm install` 回報 9 個 low/moderate vulnerabilities；Phase 0 不執行 `npm audit fix --force`，避免破壞 Expo 相依版本。
- `nativewind` 的 transitive dependency 對 Tailwind 3 有 peer warning；目前專案已使用 Tailwind 4，先記錄不在 Phase 0 修正。
- `foco-architecture.html` 仍標示 Expo SDK 52 / Router v4；Phase 5 再同步文件。
