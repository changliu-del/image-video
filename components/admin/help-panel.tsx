'use client';

import type { ComponentType } from 'react';
import {
  AlertTriangle,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Compass,
  ListChecks,
  Settings,
  Target,
} from 'lucide-react';
import type { AdminContent } from '@/lib/admin/content';
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
    <section className="min-w-0 p-4">
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

function HandbookSection({
  icon: Icon,
  items,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  items: string[];
  title: string;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-700 ring-1 ring-gray-200">
          <Icon className="size-4" />
        </span>
        <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-gray-700">
            <CheckCircle2 className="mt-1 size-3.5 flex-shrink-0 text-emerald-500" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminHelpPanel({ content }: { content: AdminContent }) {
  const copy = content.help;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <header className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <BookOpenText className="size-5 text-orange-600" />
          <h1 className="text-xl font-semibold text-gray-950">{copy.title}</h1>
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
          {copy.description}
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        <HandbookSection
          icon={Compass}
          items={copy.principles}
          title={copy.principlesTitle}
        />
        <HandbookSection
          icon={Settings}
          items={copy.maintenance}
          title={copy.maintenanceTitle}
        />
      </div>

      <section className="space-y-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <CalendarDays className="size-4" />
          </span>
          <h2 className="text-sm font-semibold text-gray-950">
            {copy.rhythmTitle}
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {copy.rhythms.map((rhythm) => (
            <div
              key={rhythm.title}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <h3 className="text-xs font-semibold uppercase text-gray-500">
                {rhythm.title}
              </h3>
              <ul className="mt-2 space-y-2">
                {rhythm.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-6 text-gray-700"
                  >
                    <CheckCircle2 className="mt-1 size-3.5 flex-shrink-0 text-gray-400" />
                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-3">
        {copy.items.map((item, index) => (
          <article
            key={item.key}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-gray-100 px-2 font-mono text-xs font-semibold text-gray-500">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="text-base font-semibold text-gray-950">
                {item.title}
              </h2>
            </div>
            <div className="grid divide-y divide-gray-100 border-t border-gray-100 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
              {FIELD_CONFIG.map((field) => (
                <HelpCell
                  key={field.key}
                  icon={field.icon}
                  title={copy.labels[field.key]}
                  tone={field.tone}
                >
                  {item[field.key]}
                </HelpCell>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
