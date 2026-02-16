import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  transpilePackages: ['@base-nft/shared', '@base-nft/db', '@base-nft/queue'],
  async headers() {
    return [
      {
        // Apply CSP only to HTML pages (exclude API routes, static assets, .well-known)
        source: '/((?!api|_next/static|_next/image|\\.well-known).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.farcaster.xyz https://warpcast.com",
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
