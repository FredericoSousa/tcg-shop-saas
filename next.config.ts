import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cards.scryfall.io',
      },
      {
        protocol: 'https',
        hostname: 'c1.scryfall.com',
      },
      {
        protocol: 'https',
        hostname: 'svgs.scryfall.io',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://cards.scryfall.io https://c1.scryfall.com https://svgs.scryfall.io https://*.supabase.co; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.scryfall.com;",
          },
        ],
      },
    ];
  },

};

export default nextConfig;
