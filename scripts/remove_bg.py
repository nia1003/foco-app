#!/usr/bin/env python3
"""
去背腳本 — 自動移除 assets/pets/ 裡所有圖片的背景。
用法：python3 scripts/remove_bg.py

把你的原始圖片（任何格式）放到 assets/pets/raw/
命名為：bean.png / fluff.png / jelly.png / spirit.png / spike.png
執行後輸出去背 PNG 到 assets/pets/
"""

import os
import sys
from pathlib import Path
from rembg import remove
from PIL import Image

RAW_DIR = Path(__file__).parent.parent / "assets" / "pets" / "raw"
OUT_DIR = Path(__file__).parent.parent / "assets" / "pets"

NAMES = ["bean", "fluff", "jelly", "spirit", "spike"]

def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    found = list(RAW_DIR.glob("*"))
    if not found:
        print(f"❌  {RAW_DIR} 是空的")
        print(f"   請把 5 張圖片放到這個資料夾，命名為：")
        for n in NAMES:
            print(f"     {n}.png  (或 .jpg / .jpeg / .webp)")
        sys.exit(1)

    for name in NAMES:
        # 支援多種副檔名
        src = None
        for ext in [".png", ".jpg", ".jpeg", ".webp", ".PNG", ".JPG"]:
            candidate = RAW_DIR / (name + ext)
            if candidate.exists():
                src = candidate
                break

        if src is None:
            print(f"⚠️   找不到 {name}.*，跳過")
            continue

        print(f"🔄  處理 {src.name} ...")
        with open(src, "rb") as f:
            raw = f.read()

        result = remove(raw)

        out_path = OUT_DIR / f"{name}.png"
        with open(out_path, "wb") as f:
            f.write(result)

        # 確認有 alpha channel
        img = Image.open(out_path)
        if img.mode != "RGBA":
            img = img.convert("RGBA")
            img.save(out_path)

        print(f"✅  {out_path.name}  ({img.size[0]}×{img.size[1]}px)")

    print("\n🎉  完成！重新跑 npx expo start 就能看到去背圖片。")

if __name__ == "__main__":
    main()
