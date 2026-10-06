#!/usr/bin/env bash
# Signal 推送封装
#
# ⚠️ 调用要求：必须带 dangerouslyDisableSandbox: true
#    原因：Bash 沙箱内 HOME 被设为 /c/ProgramData/WorkBuddy/users/17a0f284，
#    该目录下 .ssh 只有 known_hosts，看不到真实私钥，会误报 Permission denied (publickey)。
#
# 用法：
#   bash .workbuddy/skills/signal-iteration/scripts/push.sh
#
set -e

REAL="/c/Users/于华丽"
REPO="E:/workbuddy/signal/signal"

cd "$REPO"

echo "== 待推送提交 =="
git log --oneline origin/main..HEAD | cat

echo "== 加载真实私钥（无 passphrase）=="
eval "$(ssh-agent -s)" >/dev/null 2>&1
ssh-add "$REAL/.ssh/id_ed25519" </dev/null
ssh-add -l

echo "== push =="
GIT_TERMINAL_PROMPT=0 git push origin main

echo "== 完成，GitHub Pages 将自动部署 =="
