/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // 只在生产构建时启用静态导出，dev 模式下使用动态 SSR
  ...(isProd ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'sebastianraschka.com' },
    ],
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
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
