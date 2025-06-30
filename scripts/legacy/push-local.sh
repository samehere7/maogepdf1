#!/bin/bash
# 自动推送本地代码到 GitHub，并用本地内容覆盖远程
# 用法：bash push-local.sh

echo "[1/4] 添加所有更改..."
git add .

echo "[2/4] 提交更改..."
git commit -m "本地代码为准：覆盖式推送" || echo "无变更可提交"

echo "[3/4] 拉取远程最新信息（不合并）..."
git fetch origin

echo "[4/4] 强制推送到远程（本地为准）..."
git push --force-with-lease origin HEAD

echo "推送完成。" 