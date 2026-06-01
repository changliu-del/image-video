'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ImageIcon,
  Loader2,
  UploadCloud,
  WandSparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { POSTHOG_EVENTS, captureClientEvent } from '@/lib/analytics/posthog';
import {
  MAX_CTA_TEXT_LENGTH,
  MAX_PRICE_TEXT_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_SELLING_POINT_LENGTH
} from '@/lib/generations/constants';

type AspectRatio = '9:16' | '1:1' | '16:9';
type DurationSeconds = 5 | 8 | 10;
type TemplateSlug = string;

type PresignResponse = {
  assetId: string;
  uploadUrl: string;
  storageKey: string;
  publicUrl?: string;
};

type GenerationResponse = {
  jobId: string;
  status: string;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const aspectRatioOptions: AspectRatio[] = ['9:16', '1:1', '16:9'];
const durationOptions: DurationSeconds[] = [5, 8, 10];
const templateOptions: { label: string; value: TemplateSlug }[] = [
  { label: 'Flash sale', value: 'flash_sale' },
  { label: 'New arrival', value: 'new_arrival' },
  { label: 'Best seller', value: 'best_seller' }
];

const stepLabels = {
  idle: 'Generate video',
  presigning: 'Preparing upload',
  uploading: 'Uploading image',
  completing: 'Saving image',
  generating: 'Starting generation'
} as const;

type SubmitStep = keyof typeof stepLabels;

function formatFileSize(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateImage(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Use a PNG, JPEG, or WEBP image.';
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be 10 MB or smaller.';
  }

  return null;
}

async function readResponseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as {
      error?: unknown;
      message?: unknown;
      details?: {
        fieldErrors?: Record<string, string[] | undefined>;
        formErrors?: string[];
      };
    };

    const fieldError = Object.values(data.details?.fieldErrors ?? {})
      .flat()
      .find((message): message is string => Boolean(message));

    if (fieldError) {
      return fieldError;
    }

    const formError = data.details?.formErrors?.find(Boolean);

    if (formError) {
      return formError;
    }

    if (typeof data.error === 'string') {
      return data.error;
    }

    if (typeof data.message === 'string') {
      return data.message;
    }
  } catch {}

  return fallback;
}

async function postJson<TResponse>(
  url: string,
  body: Record<string, unknown>,
  fallbackError: string
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await readResponseError(response, fallbackError));
  }

  return (await response.json()) as TResponse;
}

export function GenerateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTemplateSlug = searchParams.get('template')?.trim() || 'flash_sale';
  const [productImage, setProductImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [sellingPoint, setSellingPoint] = useState('');
  const [priceText, setPriceText] = useState('');
  const [ctaText, setCtaText] = useState('Shop Now');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [durationSeconds, setDurationSeconds] =
    useState<DurationSeconds>(5);
  const [templateSlug, setTemplateSlug] =
    useState<TemplateSlug>(requestedTemplateSlug);
  const [submitStep, setSubmitStep] = useState<SubmitStep>('idle');
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = submitStep !== 'idle';
  const canSubmit = Boolean(
    productImage && productName.trim() && sellingPoint.trim() && priceText.trim()
  );

  const selectedImageLabel = useMemo(() => {
    if (!productImage) {
      return 'Select image';
    }

    return `${productImage.name} · ${formatFileSize(productImage.size)}`;
  }, [productImage]);

  const availableTemplateOptions = useMemo(() => {
    if (templateOptions.some((option) => option.value === templateSlug)) {
      return templateOptions;
    }

    return [
      { label: templateSlug.replace(/[-_]/g, ' '), value: templateSlug },
      ...templateOptions,
    ];
  }, [templateSlug]);

  useEffect(() => {
    if (!productImage) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(productImage);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [productImage]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setProductImage(null);
      return;
    }

    const validationError = validateImage(file);

    if (validationError) {
      setProductImage(null);
      setError(validationError);
      event.target.value = '';
      return;
    }

    setProductImage(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!productImage) {
      setError('Select a product image.');
      return;
    }

    const trimmedProductName = productName.trim();
    const trimmedSellingPoint = sellingPoint.trim();
    const trimmedPriceText = priceText.trim();
    const trimmedCtaText = ctaText.trim() || 'Shop Now';

    if (!trimmedProductName || !trimmedSellingPoint || !trimmedPriceText) {
      setError('Complete the required fields.');
      return;
    }

    if (trimmedProductName.length > MAX_PRODUCT_NAME_LENGTH) {
      setError(`Product name must be ${MAX_PRODUCT_NAME_LENGTH} characters or fewer.`);
      return;
    }

    if (trimmedSellingPoint.length > MAX_SELLING_POINT_LENGTH) {
      setError(
        `Core selling point must be ${MAX_SELLING_POINT_LENGTH} characters or fewer.`
      );
      return;
    }

    if (trimmedPriceText.length > MAX_PRICE_TEXT_LENGTH) {
      setError(`Price must be ${MAX_PRICE_TEXT_LENGTH} characters or fewer.`);
      return;
    }

    if (trimmedCtaText.length > MAX_CTA_TEXT_LENGTH) {
      setError(`CTA must be ${MAX_CTA_TEXT_LENGTH} characters or fewer.`);
      return;
    }

    setError(null);

    try {
      setSubmitStep('presigning');
      const presign = await postJson<PresignResponse>(
        '/api/assets/presign',
        {
          fileName: productImage.name,
          mimeType: productImage.type,
          sizeBytes: productImage.size
        },
        'Upload could not be prepared.'
      );

      setSubmitStep('uploading');
      const uploadResponse = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': productImage.type
        },
        body: productImage
      });

      if (!uploadResponse.ok) {
        throw new Error('Image upload failed.');
      }

      setSubmitStep('completing');
      await postJson(
        '/api/assets/complete',
        {
          assetId: presign.assetId,
          storageKey: presign.storageKey
        },
        'Image could not be saved.'
      );

      captureClientEvent(POSTHOG_EVENTS.IMAGE_UPLOADED, {
        assetId: presign.assetId,
        mimeType: productImage.type,
        sizeBytes: productImage.size,
        source: 'generate_form'
      });

      setSubmitStep('generating');
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          inputAssetId: presign.assetId,
          productName: trimmedProductName,
          headline: trimmedProductName,
          sellingPoint: trimmedSellingPoint,
          priceText: trimmedPriceText,
          ctaText: trimmedCtaText,
          aspectRatio,
          durationSeconds,
          templateSlug
        },
        'Generation could not be started.'
      );

      captureClientEvent(POSTHOG_EVENTS.GENERATION_STARTED, {
        jobId: generation.jobId,
        inputAssetId: presign.assetId,
        aspectRatio,
        durationSeconds,
        templateSlug,
        source: 'generate_form'
      });

      router.push(`/jobs/${generation.jobId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Generation could not be started.'
      );
      setSubmitStep('idle');
    }
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Create product video</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Label htmlFor="product-image" className="mb-2">
              Product image
            </Label>
            <label
              htmlFor="product-image"
              className={cn(
                'flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center transition-colors hover:border-gray-400',
                isSubmitting && 'pointer-events-none opacity-70'
              )}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="max-h-[240px] w-full rounded-md object-contain"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                  <ImageIcon className="size-7" />
                </div>
              )}
              <span className="flex max-w-full items-center gap-2 truncate text-sm font-medium text-gray-800">
                <UploadCloud className="size-4 shrink-0" />
                <span className="truncate">{selectedImageLabel}</span>
              </span>
            </label>
            <Input
              id="product-image"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              className="sr-only"
              onChange={handleImageChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-5 lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="product-name" className="mb-2">
                  Product name
                </Label>
                <Input
                  id="product-name"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  maxLength={MAX_PRODUCT_NAME_LENGTH}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="selling-point" className="mb-2">
                  Core selling point
                </Label>
                <textarea
                  id="selling-point"
                  value={sellingPoint}
                  onChange={(event) => setSellingPoint(event.target.value)}
                  maxLength={MAX_SELLING_POINT_LENGTH}
                  disabled={isSubmitting}
                  required
                  rows={4}
                  className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>

              <div>
                <Label htmlFor="price-text" className="mb-2">
                  Price
                </Label>
                <Input
                  id="price-text"
                  value={priceText}
                  onChange={(event) => setPriceText(event.target.value)}
                  maxLength={MAX_PRICE_TEXT_LENGTH}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cta-text" className="mb-2">
                  CTA
                </Label>
                <Input
                  id="cta-text"
                  value={ctaText}
                  onChange={(event) => setCtaText(event.target.value)}
                  maxLength={MAX_CTA_TEXT_LENGTH}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2">Aspect ratio</Label>
              <div
                role="radiogroup"
                aria-label="Aspect ratio"
                className="grid grid-cols-3 rounded-lg border bg-gray-50 p-1"
              >
                {aspectRatioOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={aspectRatio === option}
                    className={cn(
                      'h-9 rounded-md px-3 text-sm font-medium transition-colors',
                      aspectRatio === option
                        ? 'bg-white text-gray-950 shadow-sm'
                        : 'text-gray-600 hover:text-gray-950',
                      isSubmitting && 'cursor-not-allowed opacity-60'
                    )}
                    onClick={() => setAspectRatio(option)}
                    disabled={isSubmitting}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="duration-seconds" className="mb-2">
                  Duration
                </Label>
                <select
                  id="duration-seconds"
                  value={durationSeconds}
                  onChange={(event) =>
                    setDurationSeconds(Number(event.target.value) as DurationSeconds)
                  }
                  disabled={isSubmitting}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  {durationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}s
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="template-slug" className="mb-2">
                  Template
                </Label>
                <select
                  id="template-slug"
                  value={templateSlug}
                  onChange={(event) =>
                    setTemplateSlug(event.target.value as TemplateSlug)
                  }
                  disabled={isSubmitting}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  {availableTemplateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="w-full bg-orange-500 text-white hover:bg-orange-600 sm:w-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <WandSparkles className="size-4" />
                )}
                {stepLabels[submitStep]}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
