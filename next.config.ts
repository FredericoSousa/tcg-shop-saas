import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@sparticuz/chromium');
    }
    return config;
  },
};

export default nextConfig;
