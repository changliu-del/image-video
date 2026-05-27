import {
  POSTHOG_EVENTS,
  type PostHogEventName,
  type PropertiesFor
} from '@/lib/analytics/events';

type CaptureProperties = Record<string, unknown>;

type BrowserPostHog = {
  capture: (event: string, properties?: CaptureProperties) => void;
  identify?: (distinctId: string, properties?: CaptureProperties) => void;
  alias?: (alias: string, distinctId?: string) => void;
};

declare global {
  interface Window {
    posthog?: BrowserPostHog;
  }
}

const DEFAULT_POSTHOG_HOST = 'https://app.posthog.com';
const DISTINCT_ID_STORAGE_KEY = 'ecommerce_video_posthog_distinct_id';

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

function getClientDistinctId() {
  try {
    const existing = window.localStorage.getItem(DISTINCT_ID_STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const distinctId =
      window.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(DISTINCT_ID_STORAGE_KEY, distinctId);
    return distinctId;
  } catch {
    return 'anonymous';
  }
}

export function identifyClientUser(input: {
  userId: string | number;
  email?: string | null;
  name?: string | null;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  const userDistinctId = String(input.userId);
  const previousDistinctId = getClientDistinctId();

  if (previousDistinctId !== userDistinctId) {
    window.posthog?.alias?.(userDistinctId, previousDistinctId);
  }

  try {
    window.localStorage.setItem(DISTINCT_ID_STORAGE_KEY, userDistinctId);
  } catch {}

  window.posthog?.identify?.(userDistinctId, {
    email: input.email ?? undefined,
    name: input.name ?? undefined,
  });
}

export function captureClientEvent<TEvent extends PostHogEventName>(
  event: TEvent,
  properties: PropertiesFor<TEvent>
) {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.posthog?.capture) {
    window.posthog.capture(event, properties);
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    return;
  }

  const host = trimTrailingSlash(
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST
  );

  const payload = {
    api_key: apiKey,
    distinct_id: getClientDistinctId(),
    event,
    properties: {
      ...properties,
      $current_url: window.location.href
    }
  };

  void fetch(`${host}/capture/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

export async function captureServerEvent<TEvent extends PostHogEventName>({
  distinctId,
  event,
  properties,
  timestamp
}: {
  distinctId: string;
  event: TEvent;
  properties: PropertiesFor<TEvent>;
  timestamp?: Date | string;
}) {
  if (typeof window !== 'undefined') {
    return false;
  }

  const apiKey = process.env.POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    return false;
  }

  const host = trimTrailingSlash(
    process.env.POSTHOG_HOST ??
      process.env.NEXT_PUBLIC_POSTHOG_HOST ??
      DEFAULT_POSTHOG_HOST
  );

  try {
    const response = await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        distinct_id: distinctId,
        event,
        properties,
        timestamp:
          timestamp instanceof Date ? timestamp.toISOString() : timestamp
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}

export { POSTHOG_EVENTS };
