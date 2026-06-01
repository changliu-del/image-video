import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {},
  experimental: {
    ppr: true,
    clientSegmentCache: true
  }
};

const enableSentrySourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  sourcemaps: {
    disable: !enableSentrySourceMaps,
  },
});
