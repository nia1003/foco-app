# 專注流程與 Auth Bug 實作計畫

分支：`fix/focus-session-auth-bugs`

## 目標

修正目前會阻塞專注流程與測試驗證的 bug，並避免直接在 `main` 分支上開發。

本計畫涵蓋：

- Jest 測試因 AsyncStorage 未 mock 而失敗。
- theme token 測試期望值與 `constants/theme.ts` 現況不一致。
- Supabase 舊 refresh token 導致 `Invalid Refresh Token: Refresh Token Not Found`。
- Free focus 送出 `task_id: ""`，導致 `invalid input syntax for type uuid: ""`。
- Home、Focus、Reward、後端 XP 更新之間的選定寵物不一致。
- 專注結束後 XP 進度條看起來倒退。
- Home 寵物滑動不流暢、狀態同步不穩。

## 目前基準

- `npm.cmd run typecheck` 通過。
- `npm test` / `npm.cmd test -- --runInBand` 目前失敗：
  - `__tests__/stores.test.ts`：`[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.`
  - `__tests__/theme.test.ts`：`Colors.primary` 期望 `#1a1622`，實際為 `#27272a`。
- 程式碼實際進度已超過 `開發計畫.md` 的 checkbox；focus、reward、analysis、stats、pet 相關畫面都已存在。

## Phase 0 - 修復測試基準

問題：

- Jest 環境沒有 mock `@react-native-async-storage/async-storage`，導致 store 測試在載入 Supabase client 時直接失敗。
- theme token 測試仍期待舊版 Liquid Glass palette，但 `constants/theme.ts` 已更新。
- 這兩個問題會讓後續 bug fix 無法用測試確認是否回歸。

目標檔案：

- `jest.setup.ts`
- `__tests__/theme.test.ts`
- 視需要檢查 `constants/theme.ts`

實作方向：

- 在 Jest setup 中加入 AsyncStorage mock。
- 對齊 theme token 測試與目前 `constants/theme.ts` 的實際 token。
- 不在這個 phase 重新設計色票，只修正測試基準與 mock 設定。

驗收項目：

- `npm.cmd test -- --runInBand` 不再因 AsyncStorage native module 缺失而中斷。
- theme token 測試能反映目前專案實際 token。
- UI component 測試維持通過。

## Phase 1 - 清理失效的 Supabase Session

問題：

- 本機 AsyncStorage 可能保留舊 Supabase session。
- App 啟動 restore 與送出 session 前都會呼叫 `supabase.auth.getSession()`。
- 如果 refresh token 已經失效，現在不會清掉壞 session，導致後續流程反覆撞同一個錯誤。

目標檔案：

- `stores/authStore.ts`
- `services/focoService.ts`
- `lib/supabase.ts`

實作方向：

- 偵測 Supabase auth 呼叫回傳的 stale refresh-token 錯誤。
- 發現失效 session 時，清掉本機 Supabase session。
- 將 auth state 重設為未登入，並清掉 pet cache。
- 讓 `completeSession()` 在遇到壞 session 時回傳乾淨的 auth error，不要重複使用同一顆壞 token。

驗收項目：

- App 帶著失效 persisted session 啟動時，會回到登入流程。
- 送出專注 session 時如果 session 已失效，不會反覆卡在同一個 refresh-token error。
- 有效 session 仍能正常 restore。

## Phase 2 - 正規化空 Task ID

問題：

- Free focus 目前會用 `taskId: ""` 導航到 Focus。
- `focus.tsx` 會把這個值原樣放進 payload 的 `task_id`。
- Edge Function 寫入 `sessions.task_id = ""` 時，Postgres UUID 欄位會拒絕。

目標檔案：

- `app/(app)/home.tsx`
- `app/(app)/focus.tsx`
- `supabase/functions/session-complete/index.ts`

實作方向：

- Home 在沒有任務時不要送 `taskId`，或明確送 `null`。
- Focus 組 payload 前，將空字串 task ID 正規化為 `null`。
- Edge Function 再補一層後端防守，將 `task_id === ""` 視為 `null`。

驗收項目：

- Free focus 可以完成並進到 Reward。
- 有任務的 focus 仍會儲存正確 task UUID。
- Edge Function 不再收到空字串 `task_id`。

## Phase 3 - 專注 Session 綁定選定寵物

問題：

- Focus 畫面顯示的寵物可能不是 Home 剛選的那一隻。
- 如果本次 focus pet 和 store active pet 不一致，XP 可能加到錯的寵物。

目標檔案：

- `app/(app)/home.tsx`
- `app/(app)/focus.tsx`
- `app/(app)/reward.tsx`
- `stores/petStore.ts`
- `supabase/functions/session-complete/index.ts`

實作方向：

- 以本次 focus 的選定 pet ID 作為唯一資料來源。
- 確保 Home 傳的是寵物的 Supabase UUID，而不是只有視覺定義 ID。
- 確保 Focus 的畫面寵物與 payload pet 都由同一個 `petId` 解析。
- 確保 Reward 依照 `result.pet_id` 更新對應寵物。
- 後端補 ownership 檢查，`pet_id` 必須屬於 `user_id` 才能更新 XP。

驗收項目：

- 在 Home 選 Lily 後開始專注，Focus 顯示 Lily，Reward 顯示 Lily，XP 加到 Lily。
- Sunion、Fluff、Stay 都需重複驗證。
- Edge Function 不允許更新其他使用者的寵物。

## Phase 4 - 修正 XP 進度倒退

問題：

- Reward 動畫可能使用 `storePet` 的 `old_xp`，但 `storePet` 不一定是本次專注的寵物。
- 因此進度條可能從錯的舊 XP 開始，視覺上像是倒退。

目標檔案：

- `app/(app)/focus.tsx`
- `app/(app)/reward.tsx`

實作方向：

- `old_xp` 改由本次 focus 解析出的寵物資料取得，不使用泛用的 `activePet`。
- 將進度比例 clamp 在合理範圍內。
- 若後端回傳足夠資料，優先使用後端提供的前後 XP。

驗收項目：

- Reward 進度條從選定寵物的舊 XP 動畫到新 XP。
- 開始前切換寵物，不會讓 Reward 進度條倒退或跳錯。
- Level-up 動畫仍正常。

## Phase 5 - 改善 Home 寵物滑動

問題：

- 寵物滑動時有跳動感，scroll 尚未穩定時可能反覆更新 state。
- active pet 更新可能在滑動過程中觸發太頻繁。

目標檔案：

- `app/(app)/home.tsx`
- 若 Home 改回共用元件，則包含 `components/home/CenteredPetCarousel.tsx`

實作方向：

- 只在 momentum 結束或選定 index 穩定後更新 active pet。
- 避免每次 drag end 都強制 `scrollTo()`，除非需要修正置中位置。
- 保持 carousel index、視覺 pet ID、Supabase pet UUID 三者同步。

驗收項目：

- 一次滑一隻寵物時手感穩定。
- 快速滑動後會穩定停在一隻置中的寵物。
- 滑完立刻開始專注時，使用的是畫面中央那隻寵物。

## Phase 6 - 驗證

指令：

```bash
npm.cmd run typecheck
npm.cmd test -- --runInBand
```

預期：

- Typecheck 應通過。
- Phase 0 完成後，Jest 應能跑完整套 baseline 測試。

手動 smoke test：

- 帶著 stale local session 啟動 app。
- stale session 被清掉後重新登入。
- 完成 free focus。
- 完成 task-based focus。
- 切換選定寵物後完成 focus。
- 檢查 Reward 寵物、XP 動畫、後端 XP 更新目標是否一致。

## 進度

- [x] 已建立分支 `fix/focus-session-auth-bugs`。
- [x] 已新增本實作計畫文件。
- [x] Phase 0 已實作。
- [x] Phase 1 已實作。
- [x] Phase 2 已實作。
- [ ] Phase 3 已實作。
- [ ] Phase 4 已實作。
- [ ] Phase 5 已實作。
- [ ] Phase 6 已驗證。
 
## Phase 7 - Reflection scoring / XP regression

Scope:
- Fix Reflection form state persistence across focus sessions.
- Ensure Reflection submit does not hide real save failures behind mock reward data.
- Ensure quality score uses reflection completion percent when present.
- Ensure XP/session save still works if the remote DB has not yet deployed the reflection columns.

Files:
- `app/(app)/reflection.tsx`
- `app/(app)/focus.tsx`
- `services/focoService.ts`
- `supabase/functions/session-complete/index.ts`

Implementation:
- Reset selected distraction tags, completion slider, mood score, and submitting state whenever the Reflection route is focused with a new payload.
- Keep the user on Reflection and show an actionable alert when `completeSession()` fails instead of navigating to mock Reward data.
- Use `completion_percent` as the quality-score completion ratio in the Edge Function.
- Insert session rows with reflection columns first, then retry without those optional columns if the deployed DB schema is still behind.
- Preserve the real focus pet's `old_xp` so Reward progress animates from the correct starting value.

Verification:
- `npm.cmd run typecheck`
- Start a focus session, press Done, verify Reflection opens with fresh default values.
- Submit with 100% completion and verify Reward/Analysis score is non-zero.
- Submit a second session and verify Reflection does not retain previous tags/mood/slider value.
- Verify pet XP increases after a successful remote `session-complete` call.
