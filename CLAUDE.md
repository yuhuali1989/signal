# Signal 项目开发规范

## 构建与预览

**每次改完代码必须重新构建，且必须用以下命令：**

```bash
NEXT_PUBLIC_BASE_PATH="" NODE_ENV=production npm run build
```

- `NEXT_PUBLIC_BASE_PATH=""` — 清空 basePath，让资源路径为 `/_next/...`（不带 `/signal/` 前缀）
- 不加这个环境变量直接 `NODE_ENV=production npm run build`，basePath 会被设为 `/signal`，导致 CSS/JS 全部 404、页面无样式

**本地预览服务器：**

```bash
npx serve out -p 3000
```

从 `out/` 目录根服务，访问 `http://localhost:3000/`（不加 `/signal/`）。

## 构建后验证清单

每次改动构建完成后，必须验证：

1. CSS 路径无 `/signal/` 前缀：HTML 里应为 `/_next/static/css/...`
2. 主要页面均返回 200：`/`、`/hardware/`、`/tools/`、`/robot-guide/` 等
3. 浏览器打开页面确认有样式（不是纯文本）

## 技术栈

- Next.js 14，`output: 'export'` 静态导出
- Tailwind CSS（purge 基于源码扫描，新增类名必须重新构建才生效）
- `npx serve` 14.x 服务静态文件
- `basePath: '/signal'` 仅用于 GitHub Pages 部署，本地开发需覆盖为空
