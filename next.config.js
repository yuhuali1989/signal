/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

// GitHub Pages 部署在 https://<user>.github.io/signal/ 子路径下，
// 生产构建必须把 basePath / assetPrefix 固定为 /signal，
// 否则所有 _next/* 静态资源和内部链接都会 404。
// 允许通过 NEXT_PUBLIC_BASE_PATH 环境变量覆盖（用于其他部署环境）。
const basePath = isProd
  ? (process.env.NEXT_PUBLIC_BASE_PATH ?? '/signal')
  : '';

const nextConfig = {
  // 只在生产构建时启用静态导出，dev 模式下使用动态 SSR
  ...(isProd ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'sebastianraschka.com' },
    ],
  },
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  // 支持 @dqbd/tiktoken 的 wasm 文件
  webpack(config, { isServer }) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    if (isServer) {
      config.output.webassemblyModuleFilename = './../static/wasm/[modulehash].wasm';
    } else {
      config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
    }
    return config;
  },
};

module.exports = nextConfig;
