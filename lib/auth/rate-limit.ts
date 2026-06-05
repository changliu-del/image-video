import 'server-only';

import { headers } from 'next/headers';

type RateLimitBucket = {
  count: number;
  resetAt: number;
  blockedUntil?: number;
};

export type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
  blockMs?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const globalRateLimitStore = globalThis as typeof globalThis & {
  __imageVideoAuthRateLimit?: Map<string, RateLimitBucket>;
};
let lastPruneAt = 0;

function getStore() {
  if (!globalRateLimitStore.__imageVideoAuthRateLimit) {
    globalRateLimitStore.__imageVideoAuthRateLimit = new Map();
  }

  return globalRateLimitStore.__imageVideoAuthRateLimit;
}

function parseFirstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null;
}

function normalizeRateLimitKeyPart(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9@._:-]+/g, '_') || 'unknown';
}

function pruneExpiredBuckets(now: number, store: Map<string, RateLimitBucket>) {
  if (now - lastPruneAt < 60 * 1000) {
    return;
  }

  for (const [key, bucket] of store.entries()) {
    if (
      bucket.resetAt <= now &&
      (!bucket.blockedUntil || bucket.blockedUntil <= now)
    ) {
      store.delete(key);
    }
  }

  lastPruneAt = now;
}

export async function getRequestRateLimitIdentity() {
  const headerList = await headers();
  const ip =
    parseFirstHeaderValue(headerList.get('cf-connecting-ip')) ??
    parseFirstHeaderValue(headerList.get('x-forwarded-for')) ??
    parseFirstHeaderValue(headerList.get('x-real-ip')) ??
    'unknown';
  const userAgent = headerList.get('user-agent')?.trim() || 'unknown';

  return {
    ip: normalizeRateLimitKeyPart(ip),
    userAgent: normalizeRateLimitKeyPart(userAgent.slice(0, 120)),
  };
}

export function consumeRateLimit(rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const store = getStore();
  pruneExpiredBuckets(now, store);
  const existing = store.get(rule.key);

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.blockedUntil - now) / 1000),
    };
  }

  const bucket =
    existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + rule.windowMs,
        };

  bucket.count += 1;

  if (bucket.count > rule.limit) {
    const blockedUntil = now + (rule.blockMs ?? rule.windowMs);
    store.set(rule.key, {
      ...bucket,
      blockedUntil,
    });
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((blockedUntil - now) / 1000),
    };
  }

  store.set(rule.key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function consumeRateLimits(rules: RateLimitRule[]): RateLimitResult {
  let longestRetryAfterSeconds = 0;

  for (const rule of rules) {
    const result = consumeRateLimit(rule);
    if (!result.allowed) {
      longestRetryAfterSeconds = Math.max(
        longestRetryAfterSeconds,
        result.retryAfterSeconds
      );
    }
  }

  return longestRetryAfterSeconds > 0
    ? {
        allowed: false,
        retryAfterSeconds: longestRetryAfterSeconds,
      }
    : { allowed: true, retryAfterSeconds: 0 };
}

export function buildAuthRateLimitKey(...parts: string[]) {
  return ['auth', ...parts.map(normalizeRateLimitKeyPart)].join(':');
}
