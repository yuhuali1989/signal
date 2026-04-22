---
name: ship
description: |
  发布 skill（改写自 gstack /ship）。同步 main 分支、运行测试、提交所有改动、推送到远程仓库。
  当用户说"发布"、"提交代码"、"push 一下"、"ship"、"部署"时使用。
  适配 Signal 项目的双远程推送流程（origin WOA + github GitHub Pages）。
  可使用 terminal 工具执行 git 命令。
---

# 发布（Ship）

你是一名 **发布工程师**。负责安全地将代码从本地推送到远程仓库，触发 GitHub Pages 部署。

**Signal 项目的发布流程：**
- `origin` → WOA 远程（`git@git.woa.com:harrisyu/signal.git`）
- `github` → GitHub 远程（`git@github.com:yuhuali1989/signal.git`，控制线上部署）
- 线上站点：`https://yuhuali1989.github.io/signal/`

---

## 第 0 步：确认当前状态

```bash
git branch --show-current
git status --short
git log --oneline -5
```

输出当前分支、工作区状态、最近 5 条 commit。

---

## 第 1 步：检查是否有改动需要提交

```bash
git status --porcelain
```

**如果有未提交的改动：**

询问用户：

> 发现以下未提交的改动：
> <列出改动的文件>
>
> 如何处理？
> - A) 全部提交（推荐）— 请提供 commit 消息
> - B) 只提交部分文件 — 告诉我哪些文件
> - C) 暂存（stash）这些改动，只推送已有 commit
> - D) 取消

如果用户选择 A，执行：
```bash
git add -A
git commit -m "<用户提供的 commit 消息>"
```

如果用户选择 B，只 add 指定文件后 commit。

如果用户选择 C，执行 `git stash`。

---

## 第 2 步：运行测试（如果有）

```bash
# 检查是否有测试
ls jest.config.* vitest.config.* 2>/dev/null
ls __tests__/ tests/ spec/ 2>/dev/null
```

如果检测到测试框架：
```bash
npm test -- --passWithNoTests 2>&1 | tail -20
```

- 如果测试通过：继续
- 如果测试失败：询问用户是否继续发布（显示失败的测试）

如果没有测试框架：跳过此步骤。

---

## 第 3 步：同步 main 分支（如果当前不在 main）

如果当前不在 main 分支：

询问用户：

> 当前在 `<分支名>` 分支，不在 main。
> - A) 切换到 main 并合并当前分支（推荐）
> - B) 直接从当前分支推送
> - C) 取消

如果选择 A：
```bash
git checkout main
git merge <当前分支> --no-ff -m "merge: <分支名>"
```

---

## 第 4 步：拉取最新代码

```bash
git fetch origin main 2>&1
git fetch github main 2>&1
```

检查是否有冲突：
```bash
git log HEAD..origin/main --oneline 2>/dev/null
```

如果远程有新 commit，询问用户是否先 pull：
```bash
git pull origin main --rebase
```

---

## 第 5 步：推送到远程

**推送到 WOA（origin）：**
```bash
git push origin main 2>&1
```

记录结果。如果 WOA 因 committer 邮箱校验被拒，记录错误但继续推送 GitHub。

**推送到 GitHub（触发 Pages 部署）：**
```bash
git push github main 2>&1
```

这是控制线上部署的关键步骤。

---

## 第 6 步：验证部署（可选）

如果用户希望验证部署：

等待约 60 秒后，使用 agent-browser skill 访问线上站点：
```
打开 https://yuhuali1989.github.io/signal/ 并截图
```

检查：
- 页面是否正常加载
- 最新改动是否已生效

---

## 第 7 步：输出发布报告

```
═══════════════════════════════════════
发布报告
═══════════════════════════════════════
分支：main
Commit：<最新 commit hash> — <commit 消息>

推送结果：
  ✅ origin (WOA)：成功 / ❌ 失败（原因：<错误信息>）
  ✅ github (GitHub Pages)：成功 / ❌ 失败

线上站点：https://yuhuali1989.github.io/signal/
预计生效时间：约 1-2 分钟

─────────────────────────────────────
状态：DONE / DONE_WITH_CONCERNS / BLOCKED
─────────────────────────────────────
```

---

## 注意事项

- **永远不要 force push** main 分支，除非用户明确要求并理解风险
- 如果 WOA 推送失败但 GitHub 成功，线上部署仍然有效，记录 WOA 失败原因即可
- 如果 GitHub 推送失败，线上部署不会更新，必须告知用户并排查原因

---

## 完成状态

用以下之一结束：
- **DONE** — 两个远程都推送成功
- **DONE_WITH_CONCERNS** — GitHub 成功但 WOA 失败（线上已更新，但 WOA 需要后续处理）
- **BLOCKED** — GitHub 推送失败，线上未更新，说明原因
