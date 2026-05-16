#!/bin/bash
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock
git add -A
git commit -m "fix: TabBar 改為 Home/Missions/Stats，移除 Focus/Sanctuary tab

- TabId: 'home' | 'missions' | 'stats'（移除 focus, sanctuary）
- Home icon: 房子 SVG-style
- href: /(app)/home, /(app)/missions, /(app)/stats
- isActive 精確比對 home 路由，避免誤判
- HIDDEN_ROUTES 保留（focus/reward/analysis/pet-info 隱藏 tab bar）"
git pull --rebase origin main
git push origin main
echo ""
echo "✅ 推送成功！"
