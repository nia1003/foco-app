# FOCO — CI/CD 設定說明

兩條 pipeline：
- **EAS Build** — 前端 Expo app 自動建置（push to main 或 PR 都觸發）
- **Supabase Deploy** — 後端 Edge Function 自動部署（只有 `supabase/functions/**` 改動才觸發）

---

## 第一步：設定 GitHub Secrets

到 GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**，加入以下三個：

| Secret 名稱 | 在哪裡取得 |
|---|---|
| `EXPO_TOKEN` | [expo.dev](https://expo.dev) → Account → Access Tokens → Create |
| `SUPABASE_ACCESS_TOKEN` | [supabase.com](https://supabase.com) → Account → Access Tokens → Generate new token |
| `SUPABASE_PROJECT_ID` | Supabase Dashboard → Project Settings → General → Reference ID |

---

## 第二步：設定 EAS（只需做一次）

```bash
# 安裝 EAS CLI
npm install -g eas-cli

# 登入（用 expo.dev 帳號）
eas login

# 在專案根目錄初始化（會自動產生 eas.json）
eas build:configure
```

`eas.json` 應該包含這三個 profile：

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## Workflow 說明

### EAS Build（`.github/workflows/eas-build.yml`）

| 觸發條件 | 執行內容 |
|---|---|
| 開 PR → main | `eas build --profile preview`，產生 internal build，EAS 會回傳 QR Code，組員掃碼即可安裝測試 |
| Push to main | `eas build --profile production`，正式版建置 |

### Supabase Deploy（`.github/workflows/supabase-deploy.yml`）

| 觸發條件 | 執行內容 |
|---|---|
| Push to main 且 `supabase/functions/**` 有改動 | 自動 `supabase functions deploy session-complete` |

> 只有 Edge Function 有異動才會觸發，改前端程式碼不會白跑這條 pipeline。

---

## 本地端手動指令（不走 CI 時用）

```bash
# 本地跑 preview build（手動）
eas build --platform ios --profile preview
eas build --platform android --profile preview

# 本地部署 Edge Function
supabase functions deploy session-complete --project-ref <YOUR_PROJECT_ID>

# 本地測試 Edge Function
supabase functions serve session-complete --env-file .env.local
```

---

## 分工建議

| 誰 | 做什麼 | CI 自動做什麼 |
|---|---|---|
| 禹丞、曉蓮、靖雯 | 開 PR → review → merge to main | Preview build 自動產生，QR 給組員測 |
| 亮節 | 改 Supabase schema、RLS | — |
| 子寰 | 改 `supabase/functions/session-complete/index.ts` | Push to main 自動部署 Edge Function |
| 艾蓁 | 改 `focoService.ts`、API 文件 | — |

---

## 常見問題

**Q：EAS build 要多久？**  
iOS 約 15–25 分鐘，Android 約 10–15 分鐘。preview build 比 production 快一點。

**Q：build credit 夠嗎？**  
Expo 免費方案每月 30 次 build，六人共用一個 account 要注意。PR 不要太頻繁觸發，建議 PR merge 前先在本地跑 `expo start` 確認沒有明顯 crash。

**Q：Edge Function deploy 失敗？**  
先確認 `SUPABASE_ACCESS_TOKEN` 有沒有過期，以及 `SUPABASE_PROJECT_ID` 是 Reference ID（不是 project 名稱）。

**Q：想在本地測試 Edge Function？**  
建一個 `.env.local` 放本地的 Supabase keys，然後 `supabase functions serve session-complete --env-file .env.local`。
