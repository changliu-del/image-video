'use client';

import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import {
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  Target,
  Upload,
} from 'lucide-react';
import type { AdminContent, AdminTabKey } from '@/lib/admin/content';
import { cn } from '@/lib/utils';

type HelpLabelKey = keyof AdminContent['help']['labels'];

const FIELD_CONFIG: Array<{
  key: HelpLabelKey;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    key: 'purpose',
    icon: Target,
    tone: 'bg-orange-50 text-orange-700 ring-orange-100',
  },
  {
    key: 'dailyActions',
    icon: ClipboardList,
    tone: 'bg-sky-50 text-sky-700 ring-sky-100',
  },
  {
    key: 'keyFields',
    icon: ListChecks,
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  {
    key: 'riskSignals',
    icon: AlertTriangle,
    tone: 'bg-rose-50 text-rose-700 ring-rose-100',
  },
];

function HelpCell({
  children,
  icon: Icon,
  title,
  tone,
}: {
  children: string | string[];
  icon: ComponentType<{ className?: string }>;
  title: string;
  tone: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex size-7 flex-shrink-0 items-center justify-center rounded-md ring-1',
            tone
          )}
        >
          <Icon className="size-4" />
        </span>
        <h3 className="text-xs font-semibold uppercase text-gray-500">
          {title}
        </h3>
      </div>
      {Array.isArray(children) ? (
        <ul className="space-y-2">
          {children.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-gray-700">
              <CheckCircle2 className="mt-1 size-3.5 flex-shrink-0 text-gray-400" />
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-gray-700">{children}</p>
      )}
    </section>
  );
}

function UploadFieldMap({ content }: { content: AdminContent }) {
  const copy = content.libraryAssets;
  const fieldGroups = [
    [copy.fields.title, copy.fields.locale],
    [copy.fields.kind, copy.fields.status],
    [copy.fields.description],
    [copy.useCases],
    [copy.fields.tags],
  ];
  const advancedFields = [
    copy.fields.qualityScore,
    copy.fields.sortWeight,
    copy.fields.source,
    copy.fields.licenseNote,
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <span className="inline-flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-700 ring-1 ring-orange-100">
          <Upload className="size-4" />
        </span>
        <h2 className="text-sm font-semibold text-gray-950">
          {copy.title} / {copy.modalCreate}
        </h2>
      </div>
      <div className="grid gap-4 bg-gray-50 p-4 lg:grid-cols-[240px_1fr]">
        <div className="space-y-3">
          <div className="grid aspect-square place-items-center rounded-lg border border-dashed border-gray-300 bg-white text-center text-xs font-medium text-gray-400">
            {copy.columns.assetUrl}
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-3">
            <div className="text-xs font-semibold uppercase text-gray-500">
              {copy.uploadFile}
            </div>
            <div className="mt-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
              PNG / JPG / WEBP / MP4 / WEBM
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {copy.noFileSelected}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {fieldGroups.map((group) => (
            <div
              key={group.join('-')}
              className={cn(
                'grid gap-3',
                group.length > 1 && 'md:grid-cols-2',
                group.length > 2 && 'lg:grid-cols-4'
              )}
            >
              {group.map((label) => (
                <div
                  key={label}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2"
                >
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    {label}
                  </div>
                  <div className="mt-2 h-8 rounded border border-gray-100 bg-gray-50" />
                </div>
              ))}
            </div>
          ))}
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
            <div className="text-xs font-semibold uppercase text-gray-500">
              {copy.advancedFields}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {advancedFields.map((label) => (
                <div
                  key={label}
                  className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    {label}
                  </div>
                  <div className="mt-2 h-8 rounded border border-gray-100 bg-white" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminHelpPanel({ content }: { content: AdminContent }) {
  const copy = content.help;
  const [selectedKey, setSelectedKey] = useState<AdminTabKey>(
    copy.items[0]?.key ?? 'overview'
  );
  const selectedItem = useMemo(
    () => copy.items.find((item) => item.key === selectedKey) ?? copy.items[0],
    [copy.items, selectedKey]
  );

  if (!selectedItem) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <header className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookOpenText className="size-5 text-orange-600" />
              <h1 className="text-xl font-semibold text-gray-950">
                {copy.title}
              </h1>
            </div>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
              {copy.description}
            </p>
          </div>
          <select
            value={selectedItem.key}
            onChange={(event) =>
              setSelectedKey(event.target.value as AdminTabKey)
            }
            aria-label={copy.title}
            className="h-10 min-w-56 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          >
            {copy.items.map((item) => (
              <option key={item.key} value={item.key}>
                {content.tabs[item.key]}
              </option>
            ))}
          </select>
        </div>
      </header>

      {selectedItem.key === 'library-assets' ? (
        <UploadFieldMap content={content} />
      ) : null}

      <article className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-gray-100 px-2 text-xs font-semibold text-gray-500">
            {content.tabs[selectedItem.key]}
          </span>
          <h2 className="text-base font-semibold text-gray-950">
            {selectedItem.title}
          </h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {FIELD_CONFIG.map((field) => (
            <HelpCell
              key={field.key}
              icon={field.icon}
              title={copy.labels[field.key]}
              tone={field.tone}
            >
              {selectedItem[field.key]}
            </HelpCell>
          ))}
        </div>
      </article>
    </div>
  );
}
