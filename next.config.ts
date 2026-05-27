import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    ppr: true,
    clientSegmentCache: true
  }
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
