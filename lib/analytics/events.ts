export const POSTHOG_EVENTS = {
  IMAGE_UPLOADED: 'image_uploaded',
  GENERATION_STARTED: 'generation_started',
  GENERATION_SUCCEEDED: 'generation_succeeded',
  GENERATION_FAILED: 'generation_failed',
  VIDEO_DOWNLOADED: 'video_downloaded',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed'
} as const;

export type PostHogEventName =
  (typeof POSTHOG_EVENTS)[keyof typeof POSTHOG_EVENTS];

type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export type ImageUploadedProperties = AnalyticsProperties & {
  assetId: string;
  mimeType: string;
  sizeBytes: number;
  source: 'generate_form';
};

export type GenerationStartedProperties = AnalyticsProperties & {
  jobId: string;
  inputAssetId: string;
  aspectRatio: '9:16' | '1:1' | '16:9';
  durationSeconds: 5 | 8 | 10;
  templateSlug: 'flash_sale' | 'new_arrival' | 'best_seller';
  source: 'generate_form';
};

export type VideoDownloadedProperties = AnalyticsProperties & {
  jobId: string;
  source: 'job_status';
};

export type GenerationSucceededProperties = AnalyticsProperties & {
  jobId: string;
  userId: string | number;
  aspectRatio: '9:16' | '1:1' | '16:9';
  durationSeconds: number;
  templateSlug: string;
  creditSpent: number;
  source: 'trigger_runner';
};

export type GenerationFailedProperties = AnalyticsProperties & {
  jobId: string;
  userId: string | number;
  errorMessage: string;
  source: 'trigger_runner';
};

export type CheckoutStartedProperties = AnalyticsProperties & {
  userId: string | number;
  priceId: string;
  source: 'stripe_checkout' | 'mock_checkout';
};

export type CheckoutCompletedProperties = AnalyticsProperties & {
  userId: string | number;
  stripeCheckoutSessionId: string;
  stripeEventId: string;
  credits: number;
  balance: number;
  source: 'stripe_webhook' | 'mock_checkout';
};

export type AnalyticsEventProperties = {
  [POSTHOG_EVENTS.IMAGE_UPLOADED]: ImageUploadedProperties;
  [POSTHOG_EVENTS.GENERATION_STARTED]: GenerationStartedProperties;
  [POSTHOG_EVENTS.GENERATION_SUCCEEDED]: GenerationSucceededProperties;
  [POSTHOG_EVENTS.GENERATION_FAILED]: GenerationFailedProperties;
  [POSTHOG_EVENTS.VIDEO_DOWNLOADED]: VideoDownloadedProperties;
  [POSTHOG_EVENTS.CHECKOUT_STARTED]: CheckoutStartedProperties;
  [POSTHOG_EVENTS.CHECKOUT_COMPLETED]: CheckoutCompletedProperties;
};

export type PropertiesFor<TEvent extends PostHogEventName> =
  TEvent extends keyof AnalyticsEventProperties
    ? AnalyticsEventProperties[TEvent]
    : AnalyticsProperties;
