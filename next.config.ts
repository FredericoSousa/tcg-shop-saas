import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
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
    ],
    minimumCacheTTL: 2678400,
    qualities: [75],
    formats: ['image/webp'],
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
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
        ],
      },
    ];
  },

};

// Enable with `ANALYZE=true npm run build` to generate the
// .next/analyze report.
const wrappedConfig = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);

// Sentry must wrap last so source maps are uploaded for the final
// emitted bundles. Disabled at build time when no auth token is
// configured (CI without Sentry secrets).
export default withSentryConfig(wrappedConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: {
    // Strip the public-facing source maps after Sentry uploads them
    // — keeps stack traces readable in Sentry without exposing source.
    deleteSourcemapsAfterUpload: true,
  },
  widenClientFileUpload: true,
  disableLogger: true,
});
