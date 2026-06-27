'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  Clock3,
  ImageIcon,
  Loader2,
  PlayCircle,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';

import { LazyVideo } from '@/components/media/lazy-video';
import { VideoPlayer } from '@/components/media/video-player';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SelectOption<T extends string | number> = T | { value: T; label: ReactNode };

function getOptionValue<T extends string | number>(option: SelectOption<T>) {
  return typeof option === 'object' ? option.value : option;
}

function getOptionLabel<T extends string | number>(option: SelectOption<T>) {
  return typeof option === 'object' ? option.label : String(option);
}

export const demoImages = [
  '/resources/example1.png',
  '/resources/example2.png',
  '/resources/example3.png',
  '/resources/example4.png',
  '/resources/example5.png',
  '/resources/example6.png',
];

export function StudioPanel({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <aside className="flex h-[calc(100dvh-58px)] w-full shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm lg:w-[420px] xl:w-[452px]">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      {footer ? (
        <div className="border-t border-gray-100 bg-white px-5 py-4 shadow-[0_-10px_28px_rgba(15,23,42,0.06)]">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}

export function CanvasStage({
  children,
  title,
  subtitle,
  banner,
  actions,
  contentClassName,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  banner?: ReactNode;
  actions?: ReactNode;
  contentClassName?: string;
}) {
  const content = contentClassName ? (
    <div className={contentClassName}>{children}</div>
  ) : (
    children
  );

  return (
    <section className="relative min-w-0 flex-1 overflow-y-auto bg-[#f5f7fb] px-5 py-5 text-gray-950 sm:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <LazyVideo
          src="/bg.mp4"
          poster="/resources/showcase.png"
          className="size-full object-cover opacity-[0.04]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(239,246,255,0.92)_45%,rgba(255,247,237,0.78))]" />
      </div>
      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col">
        {actions ? (
          <div className="mb-5 flex items-center justify-end gap-3">
            {actions}
          </div>
        ) : null}
        {banner ? <div className="mx-auto mb-10 w-full max-w-[880px]">{banner}</div> : null}
        {title ? (
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-sm font-medium text-gray-500">{subtitle}</p>
            ) : null}
          </div>
        ) : null}
        {content}
      </div>
    </section>
  );
}

export function BlueBanner({
  label,
  title = 'Easy start',
  images = demoImages.slice(0, 4),
}: {
  label: string;
  title?: string;
  images?: string[];
}) {
  return (
    <div className="flex h-24 items-center justify-between overflow-hidden rounded-lg border border-blue-100 bg-[linear-gradient(120deg,#dbeafe,#e0e7ff_48%,#dbeafe)] px-8 shadow-sm">
      <div>
        <p className="text-3xl font-black text-indigo-700 drop-shadow-sm">
          {title}
        </p>
        <p className="mt-2 inline-flex rounded-full bg-white/85 px-5 py-1 text-sm font-semibold text-indigo-600 shadow-sm">
          {label}
        </p>
      </div>
      <div className="hidden items-center -space-x-2 md:flex">
        {images.map((image) => (
          <img
            key={image}
            src={image}
            alt=""
            className="h-16 w-16 rounded-lg border-2 border-white/80 object-cover shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}

export function PanelSection({
  title,
  required,
  hint,
  children,
  action,
}: {
  title: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            {required ? <span className="mr-0.5 text-red-500">*</span> : null}
            {title}
          </h2>
          {hint ? <p className="mt-1 text-xs font-medium text-gray-400">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function UploadDropzone({
  id,
  preview,
  fileName,
  emptyText = 'Click, drag, or paste an image',
  hint,
  disabled,
  multiple,
  onChange,
  children,
}: {
  id: string;
  preview?: string | null;
  fileName?: string | null;
  emptyText?: string;
  hint?: string;
  disabled?: boolean;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  children?: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
              'flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg bg-gray-100 px-4 py-5 text-center transition hover:bg-indigo-50/60',
              preview ? 'border border-gray-200' : 'border border-dashed border-gray-300',
          disabled && 'pointer-events-none opacity-60'
        )}
      >
        {preview ? (
          <img src={preview} alt="" className="max-h-56 w-full rounded-md object-contain" />
        ) : (
          <>
            <span className="flex size-11 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-sm ring-1 ring-gray-100">
              <UploadCloud className="size-5" />
            </span>
            <span className="mt-3 text-sm font-semibold text-gray-700">{emptyText}</span>
            {hint ? <span className="mt-1 text-xs font-medium text-gray-400">{hint}</span> : null}
          </>
        )}
        {fileName ? (
          <span className="mt-3 max-w-full truncate text-xs font-semibold text-indigo-600">
            {fileName}
          </span>
        ) : null}
      </label>
      <Input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        className="sr-only"
        onChange={(event) => onChange(event.target.files)}
        disabled={disabled}
      />
      {children}
    </div>
  );
}

export function SegmentedOptions<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
  columns = 3,
  compact = false,
}: {
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  columns?: 2 | 3 | 4;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'grid',
        compact ? 'gap-1.5' : 'gap-2',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-4'
      )}
    >
      {options.map((option) => {
        const optionValue = getOptionValue(option);

        return (
          <button
            key={String(optionValue)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(optionValue)}
            className={cn(
              'flex items-center justify-center rounded-lg border font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
              compact ? 'h-9 px-2 text-xs' : 'h-11 text-sm',
              value === optionValue
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
            )}
          >
            {getOptionLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

export function ChoiceGrid<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const optionValue = getOptionValue(option);

        return (
          <button
            key={String(optionValue)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(optionValue)}
            className={cn(
              'min-h-10 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
              value === optionValue
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
            )}
          >
            {getOptionLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

export function ExampleProducts({
  images = demoImages,
  onRefresh,
  title = 'Examples',
  refreshLabel = 'Refresh',
}: {
  images?: string[];
  onRefresh?: () => void;
  title?: string;
  refreshLabel?: string;
}) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-950">{title}</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          {refreshLabel}
          <RefreshCw className="size-4" />
        </button>
      </div>
      <div className="flex gap-5 overflow-hidden">
        {images.map((image) => (
          <img
            key={image}
            src={image}
            alt=""
            className="size-24 shrink-0 rounded-lg border border-gray-200 bg-white object-cover shadow-sm"
          />
        ))}
      </div>
    </section>
  );
}

export function ResultCard({
  resultUrl,
  status,
  title,
  description,
  mediaKind = 'image',
  minHeight = 'min-h-[380px]',
  waitingLabel = 'Waiting for upload',
}: {
  resultUrl?: string | null;
  status?: string | null;
  title: string;
  description?: string;
  mediaKind?: 'image' | 'video';
  minHeight?: string;
  waitingLabel?: string;
}) {
  const isVideo =
    mediaKind === 'video' || Boolean(resultUrl && (resultUrl.endsWith('.mp4') || resultUrl.includes('.mp4?')));
  const normalizedStatus = status?.toLowerCase();
  const isComplete =
    normalizedStatus === 'succeeded' || normalizedStatus === 'ready';
  const isFailed = normalizedStatus === 'failed';

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4 shadow-sm', minHeight)}>
      <div className="flex h-full min-h-[inherit] flex-col">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-950">{title}</h2>
            <p className="mt-1 text-xs font-semibold text-gray-400">
              {status ?? waitingLabel}
            </p>
          </div>
          {isComplete ? (
            <CheckCircle2 className="size-5 text-emerald-500" />
          ) : status && !isFailed ? (
            <Loader2 className="size-5 animate-spin text-indigo-500" />
          ) : (
            <Clock3 className="size-5 text-gray-300" />
          )}
        </div>
        <div className="mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-gray-950/70">
          {resultUrl ? (
            isVideo ? (
              <VideoPlayer
                src={resultUrl}
                className="max-h-[620px] w-full"
                mediaClassName="max-h-[620px] w-full"
              />
            ) : (
              <img src={resultUrl} alt="" className="max-h-[620px] w-full object-contain" />
            )
          ) : (
            <div className="px-8 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-lg bg-white text-indigo-600">
                {mediaKind === 'video' ? <PlayCircle className="size-7" /> : <ImageIcon className="size-7" />}
              </span>
              <p className="mt-4 text-sm font-bold text-white">{title}</p>
              {description ? (
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">{description}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function IconButtonCard({
  icon: Icon,
  label,
  children,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  children?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    'rounded-lg border border-gray-200 bg-white p-4 text-center text-gray-800 shadow-sm transition',
    onClick && 'hover:border-indigo-200 hover:bg-indigo-50/50',
    disabled && 'cursor-not-allowed opacity-50'
  );
  const content = (
    <>
      <Icon className="mx-auto size-7 text-indigo-500" />
      <p className="mt-3 text-sm font-bold text-gray-800">{label}</p>
      {children}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} disabled={disabled}>
        {content}
      </button>
    );
  }

  return (
    <div className={className}>{content}</div>
  );
}
