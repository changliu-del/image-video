'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Gauge,
  Loader2,
  LogIn,
  MousePointerClick,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  UploadCloud,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminContent } from '@/lib/admin/content';
import type {
  AdminDashboardDailyTrendSeries,
  AdminDashboardFunnelStep,
  AdminDashboardGenerationHealth,
  AdminDashboardGenerationStatus,
  AdminDashboardGenerationType,
  AdminDashboardMetricUnit,
  AdminDashboardRechargeRiskSignal,
  AdminDashboardResponse,
  AdminDashboardSeverity,
  AdminDashboardSummaryCard,
} from '@/lib/admin/dashboard-types';
import { cn } from '@/lib/utils';

type AdminDashboardPanelProps = {
  content: AdminContent;
};

type DateRangeState = {
  from: string;
  to: string;
};

type ToneKey = 'sky' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';

type ToneStyle = {
  text: string;
  bg: string;
  border: string;
  bar: string;
  soft: string;
};

const TONES: Record<ToneKey, ToneStyle> = {
  sky: {
    text: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    bar: 'bg-sky-500',
    soft: 'bg-sky-100',
  },
  emerald: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    soft: 'bg-emerald-100',
  },
  amber: {
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    soft: 'bg-amber-100',
  },
  rose: {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    bar: 'bg-rose-500',
    soft: 'bg-rose-100',
  },
  indigo: {
    text: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    bar: 'bg-indigo-500',
    soft: 'bg-indigo-100',
  },
  slate: {
    text: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    bar: 'bg-slate-500',
    soft: 'bg-slate-100',
  },
};

const SEVERITY_CLASS: Record<AdminDashboardSeverity, string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  critical: 'border-rose-200 bg-rose-50 text-rose-800',
};

const STATUS_TONES: Record<AdminDashboardGenerationStatus['status'], ToneKey> = {
  queued: 'slate',
  submitting: 'sky',
  running: 'amber',
  succeeded: 'emerald',
  failed: 'rose',
};

const SUMMARY_KEYS: AdminDashboardSummaryCard['key'][] = [
  'registrations',
  'activeEstimate',
  'visitBehavior',
  'uploads',
  'generation',
  'generationFailures',
  'recharge',
  'rechargeRisk',
];

const SUMMARY_CONFIG: Record<
  AdminDashboardSummaryCard['key'],
  {
    icon: ComponentType<{ className?: string }>;
    tone: ToneKey;
    copyKey:
      | keyof AdminContent['dashboard']['gauges']
      | keyof AdminContent['dashboard']['metrics']
      | null;
  }
> = {
  registrations: {
    icon: UserPlus,
    tone: 'sky',
    copyKey: 'registrations',
  },
  activeEstimate: {
    icon: LogIn,
    tone: 'emerald',
    copyKey: 'login',
  },
  visitBehavior: {
    icon: MousePointerClick,
    tone: 'indigo',
    copyKey: 'visits',
  },
  uploads: {
    icon: UploadCloud,
    tone: 'slate',
    copyKey: 'uploadedAssets',
  },
  generation: {
    icon: Sparkles,
    tone: 'emerald',
    copyKey: 'generation',
  },
  generationFailures: {
    icon: AlertTriangle,
    tone: 'rose',
    copyKey: 'failedJobs',
  },
  generationRunning: {
    icon: Timer,
    tone: 'amber',
    copyKey: 'runningJobs',
  },
  recharge: {
    icon: CreditCard,
    tone: 'amber',
    copyKey: 'recharge',
  },
  rechargeRisk: {
    icon: Wallet,
    tone: 'rose',
    copyKey: 'abnormalRecharge',
  },
};

const TREND_SERIES: Array<{
  key: AdminDashboardDailyTrendSeries['key'];
  tone: ToneKey;
}> = [
  { key: 'registrations', tone: 'sky' },
  { key: 'visits', tone: 'indigo' },
  { key: 'generationJobs', tone: 'emerald' },
  { key: 'failedJobs', tone: 'rose' },
  { key: 'purchasedCredits', tone: 'amber' },
  { key: 'abnormalRechargeSignals', tone: 'slate' },
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function defaultRange(): DateRangeState {
  const today = new Date();
  return {
    from: dateKey(addDays(today, -6)),
    to: dateKey(today),
  };
}

function presetRange(days: number): DateRangeState {
  const today = new Date();
  return {
    from: dateKey(addDays(today, -(days - 1))),
    to: dateKey(today),
  };
}

function todayRange(): DateRangeState {
  const today = dateKey(new Date());
  return { from: today, to: today };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function formatRate(card: AdminDashboardSummaryCard) {
  if (!card.rate) return null;
  if (card.rate.unit === 'percent') return formatPercent(card.rate.value);
  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  }).format(card.rate.value)}x`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return 'N/A';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  }).format(seconds / 60)}m`;
}

function boundedPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function barSize(value: number, maxValue: number, maxSize: number, minSize: number) {
  if (value <= 0) return 0;
  return Math.max(minSize, (value / maxValue) * maxSize);
}

async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

function severityLabel(
  content: AdminContent,
  severity: AdminDashboardSeverity
) {
  if (severity === 'critical') return content.dashboard.riskSeverity.critical;
  if (severity === 'warning') return content.dashboard.riskSeverity.medium;
  if (severity === 'info') return content.dashboard.riskSeverity.info;
  return 'OK';
}

function summaryLabel(content: AdminContent, card: AdminDashboardSummaryCard) {
  const config = SUMMARY_CONFIG[card.key];
  const copyKey = config.copyKey;
  if (copyKey && copyKey in content.dashboard.gauges) {
    return content.dashboard.gauges[
      copyKey as keyof AdminContent['dashboard']['gauges']
    ].label;
  }
  if (copyKey && copyKey in content.dashboard.metrics) {
    return content.dashboard.metrics[
      copyKey as keyof AdminContent['dashboard']['metrics']
    ];
  }
  return card.label;
}

function funnelLabel(content: AdminContent, step: AdminDashboardFunnelStep) {
  const labels: Partial<Record<AdminDashboardFunnelStep['key'], string>> = {
    registrations: content.dashboard.funnelStages.registrations,
    activeEstimate: content.dashboard.gauges.login.label,
    visitBehavior: content.dashboard.gauges.visits.label,
    uploads: content.dashboard.funnelStages.uploads,
    generation: content.dashboard.funnelStages.generation,
    successfulGeneration: content.dashboard.metrics.successRate,
    recharge: content.dashboard.funnelStages.recharge,
  };
  return labels[step.key] ?? step.label;
}

function trendLabel(
  content: AdminContent,
  series: AdminDashboardDailyTrendSeries
) {
  const labels: Partial<Record<AdminDashboardDailyTrendSeries['key'], string>> = {
    registrations: content.dashboard.gauges.registrations.label,
    activeUsers: content.dashboard.metrics.activeUsers,
    visits: content.dashboard.gauges.visits.label,
    uploadedAssets: content.dashboard.metrics.uploadedAssets,
    generationJobs: content.dashboard.metrics.generationJobs,
    succeededJobs: content.dashboard.metrics.successRate,
    failedJobs: content.dashboard.metrics.failedJobs,
    runningJobs: content.dashboard.metrics.runningJobs,
    rechargeEvents: content.dashboard.metrics.purchaseEvents,
    purchasedCredits: content.dashboard.metrics.purchasedCredits,
    abnormalRechargeSignals: content.dashboard.gauges.abnormalRecharge.label,
  };
  return labels[series.key] ?? series.label;
}

function typeLabel(content: AdminContent, type: string) {
  return content.dashboard.generationTypes[type] ?? type;
}

function unitLabel(content: AdminContent, unit: AdminDashboardMetricUnit) {
  if (unit === 'users') return content.dashboard.metrics.activeUsers;
  if (unit === 'user_days') return content.dashboard.gauges.login.label;
  if (unit === 'events') return content.dashboard.metrics.visitEvents;
  if (unit === 'assets') return content.dashboard.metrics.uploadedAssets;
  if (unit === 'jobs') return content.dashboard.metrics.generationJobs;
  if (unit === 'credits') return content.dashboard.metrics.purchasedCredits;
  if (unit === 'signals') return content.dashboard.risk.signals;
  if (unit === 'percent') return content.dashboard.metrics.successRate;
  return 's';
}

function summaryDetail(
  content: AdminContent,
  data: AdminDashboardResponse,
  card: AdminDashboardSummaryCard
) {
  const { totals, rechargeAnomalies } = data;
  if (card.key === 'registrations') {
    return `${formatNumber(totals.totalUsers)} ${content.dashboard.metrics.totalUsers}`;
  }
  if (card.key === 'activeEstimate') {
    return `${formatNumber(totals.activeUserDays)} ${content.dashboard.gauges.login.label} / ${formatNumber(totals.visitEvents)} ${content.dashboard.metrics.visitEvents}`;
  }
  if (card.key === 'visitBehavior') {
    return `${formatNumber(totals.activeUserDays)} ${content.dashboard.gauges.login.label} / ${formatNumber(totals.activeUsers)} ${content.dashboard.metrics.activeUsers}`;
  }
  if (card.key === 'uploads') {
    return `${formatNumber(totals.uploadUsers)} ${content.dashboard.metrics.uploadUsers} / ${formatNumber(totals.uploadFailedAssets)} ${content.dashboard.metrics.failedJobs}`;
  }
  if (card.key === 'generation') {
    return `${formatNumber(totals.succeededJobs)} ${content.statusLabels.succeeded} / ${formatNumber(totals.failedJobs)} ${content.statusLabels.failed}`;
  }
  if (card.key === 'generationFailures') {
    return `${formatNumber(totals.failedGenerationUsers)} ${content.dashboard.metrics.generationUsers} / ${formatNumber(totals.failedJobs)} ${content.dashboard.metrics.failedJobs}`;
  }
  if (card.key === 'generationRunning') {
    return `${formatNumber(totals.queuedJobs)} ${content.statusLabels.queued} / ${formatNumber(totals.runningActiveJobs)} ${content.statusLabels.running}`;
  }
  if (card.key === 'recharge') {
    return `${formatNumber(totals.purchaseEvents)} ${content.dashboard.metrics.purchaseEvents} / ${formatNumber(totals.payingUsers)} ${content.dashboard.metrics.payingUsers}`;
  }
  return `${formatNumber(rechargeAnomalies.missingStripeEvents)} ${content.dashboard.anomalies.missingStripeEvents} / ${formatNumber(rechargeAnomalies.balanceMismatches)} ${content.dashboard.anomalies.balanceMismatches}`;
}

function summaryDiagnosis(
  content: AdminContent,
  data: AdminDashboardResponse,
  card: AdminDashboardSummaryCard
) {
  const { totals } = data;
  if (card.key === 'registrations') {
    return totals.newUsers > 0
      ? content.dashboard.diagnosis.healthy.registrations
      : content.dashboard.diagnosis.empty.registrations;
  }
  if (card.key === 'activeEstimate') return content.dashboard.loginEstimate;
  if (card.key === 'visitBehavior') {
    return totals.visitEvents > 0
      ? content.dashboard.diagnosis.healthy.visits
      : content.dashboard.diagnosis.empty.visits;
  }
  if (card.key === 'uploads') {
    if (totals.uploadedAssets === 0) return content.dashboard.diagnosis.empty.uploads;
    return totals.uploadFailedAssets > 0
      ? content.dashboard.diagnosis.watch
      : content.dashboard.diagnosis.healthy.uploads;
  }
  if (card.key === 'generation') {
    if (totals.generationJobs === 0) {
      return content.dashboard.diagnosis.empty.generation;
    }
    return totals.failedJobs > 0 || totals.stuckRunningJobs > 0
      ? content.dashboard.diagnosis.watch
      : content.dashboard.diagnosis.healthy.generation;
  }
  if (card.key === 'generationFailures') {
    return totals.failedJobs > 0
      ? content.dashboard.diagnosis.watch
      : content.dashboard.diagnosis.healthy.generation;
  }
  if (card.key === 'generationRunning') {
    return totals.stuckRunningJobs > 0
      ? content.dashboard.diagnosis.watch
      : content.dashboard.diagnosis.steady;
  }
  if (card.key === 'recharge') {
    return totals.purchaseEvents > 0
      ? content.dashboard.diagnosis.healthy.recharge
      : content.dashboard.diagnosis.empty.recharge;
  }
  return totals.abnormalRechargeSignals > 0
    ? content.dashboard.risk.defaultAction
    : content.dashboard.risk.noRiskAction;
}

function funnelDiagnosisKey(step: AdminDashboardFunnelStep) {
  if (step.key === 'activeEstimate') return 'login';
  if (step.key === 'visitBehavior') return 'visits';
  if (step.key === 'successfulGeneration') return 'generation';
  return step.key;
}

function funnelDetail(content: AdminContent, step: AdminDashboardFunnelStep) {
  const unit = unitLabel(content, step.unit);
  if (step.conversionRate === null) {
    return `${formatNumber(step.value)} ${unit}`;
  }
  return `${formatNumber(step.dropoffCount ?? 0)} ${content.dashboard.risk.dropoff} / ${formatPercent(step.conversionRate)} ${content.dashboard.risk.conversion}`;
}

function funnelDiagnosis(content: AdminContent, step: AdminDashboardFunnelStep) {
  const key = funnelDiagnosisKey(step);
  if (step.value === 0) {
    return (
      content.dashboard.diagnosis.empty[key] ?? content.dashboard.diagnosis.watch
    );
  }
  if ((step.dropoffRate ?? 0) >= 50) {
    return (
      content.dashboard.diagnosis.weak[key] ?? content.dashboard.diagnosis.watch
    );
  }
  if ((step.dropoffRate ?? 0) >= 25) return content.dashboard.diagnosis.watch;
  return (
    content.dashboard.diagnosis.healthy[key] ?? content.dashboard.diagnosis.steady
  );
}

function dailyTrendDiagnosis(content: AdminContent, data: AdminDashboardResponse) {
  const riskSignals = data.dailyTrends.points.reduce(
    (sum, point) => sum + point.abnormalRechargeSignals,
    0
  );
  if (riskSignals > 0) return content.dashboard.risk.defaultAction;
  if (data.totals.visitEvents === 0 && data.totals.generationJobs === 0) {
    return content.dashboard.diagnosis.empty.visits;
  }
  return content.dashboard.diagnosis.steady;
}

function generationHealthDiagnosis(
  content: AdminContent,
  health: AdminDashboardGenerationHealth
) {
  if (health.totalJobs === 0) return content.dashboard.diagnosis.empty.generation;
  if (health.stuckRunningJobs > 0 || health.failureRate >= 10) {
    return content.dashboard.diagnosis.watch;
  }
  return content.dashboard.diagnosis.healthy.generation;
}

function generationTypeDiagnosis(
  content: AdminContent,
  item: AdminDashboardGenerationType
) {
  if (item.total === 0) return content.common.noData;
  if (item.failureRate >= 10 || item.runningRate >= 35) {
    return content.dashboard.diagnosis.watch;
  }
  return content.dashboard.diagnosis.healthy.generation;
}

function sortedRisks(signals: AdminDashboardRechargeRiskSignal[]) {
  const rank: Record<AdminDashboardSeverity, number> = {
    critical: 4,
    warning: 3,
    info: 2,
    ok: 1,
  };
  return [...signals].sort(
    (left, right) =>
      rank[right.severity] - rank[left.severity] || right.value - left.value
  );
}

function SectionShell({
  title,
  icon: Icon,
  aside,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-700">
            <Icon className="size-4" />
          </span>
          <h2 className="truncate text-base font-semibold text-gray-950">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function SummaryCard({
  content,
  data,
  card,
}: {
  content: AdminContent;
  data: AdminDashboardResponse;
  card: AdminDashboardSummaryCard;
}) {
  const config = SUMMARY_CONFIG[card.key];
  const Icon = config.icon;
  const tone = card.severity === 'critical'
    ? TONES.rose
    : card.severity === 'warning'
      ? TONES.amber
      : TONES[config.tone];
  const rate = formatRate(card);

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase text-gray-500">
            {summaryLabel(content, card)}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold tabular-nums text-gray-950">
            {formatNumber(card.value)}
          </p>
        </div>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-md border',
            tone.bg,
            tone.border,
            tone.text
          )}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-xs font-medium',
            SEVERITY_CLASS[card.severity]
          )}
        >
          {severityLabel(content, card.severity)}
        </span>
        {rate ? (
          <span className="text-xs font-medium tabular-nums text-gray-700">
            {rate}
          </span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
        {summaryDetail(content, data, card)}
      </p>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-700">
        {summaryDiagnosis(content, data, card)}
      </p>
    </article>
  );
}

function MetricStrip({
  content,
  data,
}: {
  content: AdminContent;
  data: AdminDashboardResponse;
}) {
  const totals = data.totals;
  const items = [
    {
      label: content.dashboard.metrics.totalUsers,
      value: formatNumber(totals.totalUsers),
    },
    {
      label: content.dashboard.metrics.uploadUsers,
      value: `${formatNumber(totals.uploadUsers)} / ${formatNumber(
        totals.uploadedAssets
      )}`,
    },
    {
      label: content.dashboard.metrics.runningJobs,
      value: `${formatNumber(totals.runningJobs)} / ${formatNumber(
        totals.stuckRunningJobs
      )}`,
    },
    {
      label: content.dashboard.metrics.purchaseEvents,
      value: `${formatNumber(totals.purchaseEvents)} / ${formatNumber(
        totals.payingUsers
      )}`,
    },
    {
      label: content.dashboard.metrics.creditEvents,
      value: formatNumber(totals.creditEvents),
    },
    {
      label: content.dashboard.metrics.refundEvents,
      value: formatNumber(totals.refundEvents),
    },
  ];

  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="bg-white px-3 py-2">
          <p className="truncate text-xs text-gray-500">{item.label}</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-gray-950">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function BehaviorFunnel({
  content,
  steps,
}: {
  content: AdminContent;
  steps: AdminDashboardFunnelStep[];
}) {
  const maxValue = Math.max(1, ...steps.map((step) => step.value));
  const largestDropoff = steps
    .filter((step) => step.dropoffRate !== null)
    .sort((left, right) => (right.dropoffRate ?? 0) - (left.dropoffRate ?? 0))[0];

  if (steps.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
        {content.common.noData}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {largestDropoff ? (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">
                {content.dashboard.risk.dropoff}: {funnelLabel(content, largestDropoff)}
              </p>
              <p className="mt-1 leading-relaxed text-amber-800">
                {funnelDiagnosis(content, largestDropoff)}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-lg font-semibold tabular-nums">
            {formatPercent(largestDropoff.dropoffRate)}
          </span>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {steps.map((step, index) => {
          const toneKey: ToneKey =
            step.key === 'recharge'
              ? 'amber'
              : step.key === 'successfulGeneration'
                ? 'emerald'
                : step.key === 'generation'
                  ? 'emerald'
                  : step.key === 'uploads'
                    ? 'slate'
                    : step.key === 'visitBehavior'
                      ? 'indigo'
                      : step.key === 'activeEstimate'
                        ? 'emerald'
                        : 'sky';
          const tone = TONES[toneKey];

          return (
            <article
              key={step.key}
              className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold uppercase text-gray-500">
                  {index + 1}. {funnelLabel(content, step)}
                </p>
                {step.previousKey ? (
                  <span className="text-xs tabular-nums text-gray-500">
                    {formatPercent(step.conversionRate)}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xl font-semibold tabular-nums text-gray-950">
                {formatNumber(step.value)}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                <div
                  className={cn('h-full rounded-full', tone.bar)}
                  style={{ width: `${barSize(step.value, maxValue, 100, 6)}%` }}
                />
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-gray-500">
                    {content.dashboard.risk.conversion}
                  </dt>
                  <dd className="font-medium tabular-nums text-gray-800">
                    {formatPercent(step.conversionRate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">{content.dashboard.risk.dropoff}</dt>
                  <dd className="font-medium tabular-nums text-gray-800">
                    {formatNumber(step.dropoffCount ?? 0)}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
                {funnelDetail(content, step)}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DailyTrend({
  content,
  data,
}: {
  content: AdminContent;
  data: AdminDashboardResponse;
}) {
  const series = TREND_SERIES.map((item) => ({
    ...item,
    series: data.dailyTrends.series.find((candidate) => candidate.key === item.key),
  })).filter(
    (item): item is {
      key: AdminDashboardDailyTrendSeries['key'];
      tone: ToneKey;
      series: AdminDashboardDailyTrendSeries;
    } => Boolean(item.series)
  );
  const points = data.dailyTrends.points;
  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => item.series.points.map((point) => point.value))
  );

  if (points.length === 0 || series.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
        {content.common.noData}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
        {series.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1">
            <span className={cn('size-2 rounded-full', TONES[item.tone].bar)} />
            {trendLabel(content, item.series)}
          </span>
        ))}
      </div>
      <div className="flex h-52 items-end gap-2 overflow-x-auto pb-2">
        {points.map((point) => (
          <div
            key={point.date}
            className="flex min-w-14 flex-1 flex-col items-center gap-2"
          >
            <div className="flex h-40 items-end gap-1">
              {series.map((item) => {
                const value =
                  item.series.points.find((candidate) => candidate.date === point.date)
                    ?.value ?? 0;
                return (
                  <span
                    key={`${point.date}-${item.key}`}
                    className={cn('w-1.5 rounded-t', TONES[item.tone].bar)}
                    style={{
                      height: `${barSize(value, maxValue, 144, 3)}px`,
                    }}
                    title={`${trendLabel(content, item.series)} ${point.date}: ${value}`}
                  />
                );
              })}
            </div>
            <span className="text-[11px] text-gray-500">{point.date.slice(5)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {dailyTrendDiagnosis(content, data)}
      </p>
    </div>
  );
}

function StatusBars({
  content,
  statuses,
}: {
  content: AdminContent;
  statuses: AdminDashboardGenerationStatus[];
}) {
  const total = Math.max(1, statuses.reduce((sum, item) => sum + item.total, 0));

  return (
    <div className="space-y-3">
      {statuses.map((status) => {
        const tone = TONES[STATUS_TONES[status.status]];
        return (
          <div key={status.status}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-gray-700">
                {content.statusLabels[status.status] ?? status.status}
              </span>
              <span className="tabular-nums text-gray-500">
                {formatNumber(status.total)} / {formatPercent(status.rate)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className={cn('h-full rounded-full', tone.bar)}
                style={{ width: `${barSize(status.total, total, 100, 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TypeMix({
  content,
  items,
}: {
  content: AdminContent;
  items: AdminDashboardGenerationType[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">{content.common.noData}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.type} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-gray-700">
              {typeLabel(content, item.type)}
            </span>
            <span className="shrink-0 tabular-nums text-gray-500">
              {formatNumber(item.total)} / {formatPercent(item.successRate)}
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="bg-emerald-500"
              style={{ width: `${boundedPercent(item.successRate)}%` }}
            />
            <div
              className="bg-rose-500"
              style={{ width: `${boundedPercent(item.failureRate)}%` }}
            />
            <div
              className="bg-amber-500"
              style={{ width: `${boundedPercent(item.runningRate)}%` }}
            />
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-gray-500">
            {generationTypeDiagnosis(content, item)}
          </p>
        </div>
      ))}
    </div>
  );
}

function GenerationHealthPanel({
  content,
  health,
}: {
  content: AdminContent;
  health: AdminDashboardGenerationHealth;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-950">
              {content.dashboard.metrics.generationJobs}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {generationHealthDiagnosis(content, health)}
            </p>
          </div>
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-xs font-medium',
              SEVERITY_CLASS[health.severity]
            )}
          >
            {severityLabel(content, health.severity)}
          </span>
        </div>
        <StatusBars content={content} statuses={health.byStatus} />
        <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-3">
          <div className="bg-white px-3 py-2">
            <p className="text-xs text-gray-500">Avg</p>
            <p className="mt-1 text-sm font-semibold text-gray-950">
              {formatDuration(health.avgCompletionSeconds)}
            </p>
          </div>
          <div className="bg-white px-3 py-2">
            <p className="text-xs text-gray-500">P95</p>
            <p className="mt-1 text-sm font-semibold text-gray-950">
              {formatDuration(health.p95CompletionSeconds)}
            </p>
          </div>
          <div className="bg-white px-3 py-2">
            <p className="text-xs text-gray-500">{content.dashboard.metrics.runningJobs}</p>
            <p className="mt-1 text-sm font-semibold text-gray-950">
              {formatNumber(health.stuckRunningJobs)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-950">
              {content.dashboard.sections.generationMix}
            </p>
            <TypeMix content={content} items={health.byType} />
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-950">
              {content.dashboard.metrics.failedJobs}
            </p>
            {health.failureReasons.length > 0 ? (
              <div className="space-y-3">
                {health.failureReasons.map((reason) => (
                  <div key={reason.reason}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="line-clamp-1 text-gray-700">
                        {reason.reason}
                      </span>
                      <span className="shrink-0 tabular-nums text-gray-500">
                        {formatNumber(reason.count)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${boundedPercent(reason.rate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <p>{content.dashboard.diagnosis.steady}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RechargeRiskPanel({
  content,
  risks,
}: {
  content: AdminContent;
  risks: AdminDashboardRechargeRiskSignal[];
}) {
  const sorted = sortedRisks(risks);
  const active = sorted.filter((risk) => risk.value > 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {active.length === 0 ? (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">{content.dashboard.risk.noRiskTitle}</p>
            <p className="mt-1 text-emerald-700">
              {content.dashboard.risk.noRiskAction}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {sorted.map((risk) => (
          <article key={risk.key} className="border-l-2 border-gray-200 pl-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-950">
                  {content.dashboard.anomalies[risk.key] ?? risk.label}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {content.dashboard.riskImpacts[risk.key] ?? risk.diagnosis}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-xs font-medium',
                    SEVERITY_CLASS[risk.severity]
                  )}
                >
                  {severityLabel(content, risk.severity)}
                </span>
                <span className="text-sm font-semibold tabular-nums text-gray-950">
                  {formatNumber(risk.value)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              <span className="font-medium text-gray-950">
                {content.dashboard.risk.action}:
              </span>{' '}
              {risk.value > 0
                ? content.dashboard.riskActions[risk.key] ??
                  content.dashboard.risk.defaultAction
                : content.dashboard.risk.noRiskAction}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardPanel({ content }: AdminDashboardPanelProps) {
  const initialRange = useMemo(() => defaultRange(), []);
  const [range, setRange] = useState<DateRangeState>(initialRange);
  const [appliedRange, setAppliedRange] =
    useState<DateRangeState>(initialRange);
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: appliedRange.from,
        to: appliedRange.to,
      });
      const response = await fetch(`/api/admin/dashboard?${params.toString()}`);
      if (!response.ok) {
        throw new Error(await readError(response, content.dashboard.loadFailed));
      }
      const json = (await response.json()) as AdminDashboardResponse;
      setData(json);
      setRange({
        from: json.range.from,
        to: json.range.to,
      });
      setAppliedRange((current) =>
        current.from === json.range.from && current.to === json.range.to
          ? current
          : {
              from: json.range.from,
              to: json.range.to,
            }
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : content.dashboard.loadFailed
      );
    } finally {
      setLoading(false);
    }
  }, [appliedRange, content.dashboard.loadFailed]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  function applyRange(nextRange = range) {
    if (!nextRange.from || !nextRange.to) return;
    setAppliedRange(nextRange);
  }

  function setPreset(nextRange: DateRangeState) {
    setRange(nextRange);
    setAppliedRange(nextRange);
  }

  const summaryCards = useMemo(() => {
    if (!data) return [];
    const cardsByKey = new Map(data.summaryCards.map((card) => [card.key, card]));
    return SUMMARY_KEYS.map((key) => cardsByKey.get(key)).filter(
      (card): card is AdminDashboardSummaryCard => Boolean(card)
    );
  }, [data]);

  const presets = [
    {
      key: 'today',
      label: content.dashboard.presets.today,
      range: todayRange(),
    },
    {
      key: 'last7',
      label: content.dashboard.presets.last7,
      range: presetRange(7),
    },
    {
      key: 'last30',
      label: content.dashboard.presets.last30,
      range: presetRange(30),
    },
    {
      key: 'last90',
      label: content.dashboard.presets.last90,
      range: presetRange(90),
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <header className="border-b border-gray-200 pb-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-gray-500">
              {content.shell.title}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-950">
              {content.dashboard.title}
            </h1>
            <p className="mt-1 max-w-4xl text-sm text-gray-600">
              {content.dashboard.description}
            </p>
          </div>
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              applyRange();
            }}
          >
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase text-gray-500">
                {content.dashboard.from}
              </span>
              <Input
                type="date"
                value={range.from}
                onChange={(event) =>
                  setRange((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
                className="h-9 min-w-36 bg-white"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase text-gray-500">
                {content.dashboard.to}
              </span>
              <Input
                type="date"
                value={range.to}
                onChange={(event) =>
                  setRange((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
                className="h-9 min-w-36 bg-white"
              />
            </label>
            <Button
              type="submit"
              className="h-9 bg-gray-950 text-white hover:bg-gray-800"
            >
              <Search className="size-4" />
              {content.dashboard.apply}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 bg-white"
              onClick={fetchDashboard}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {content.dashboard.refresh}
            </Button>
          </form>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.key}
                type="button"
                variant={
                  appliedRange.from === preset.range.from &&
                  appliedRange.to === preset.range.to
                    ? 'secondary'
                    : 'outline'
                }
                size="sm"
                className="bg-white"
                onClick={() => setPreset(preset.range)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          {data ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <CalendarDays className="size-3.5" />
              {data.range.from} - {data.range.to} / {data.range.days}d
            </span>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-lg border border-gray-200 bg-white"
            />
          ))}
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.key}
                content={content}
                data={data}
                card={card}
              />
            ))}
          </div>

          <MetricStrip content={content} data={data} />

          <SectionShell
            title={content.dashboard.sections.funnel}
            icon={Activity}
            aside={
              <span className="text-xs text-gray-500">
                {content.dashboard.risk.conversion} / {content.dashboard.risk.dropoff}
              </span>
            }
          >
            <BehaviorFunnel content={content} steps={data.funnelSteps} />
          </SectionShell>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <SectionShell title={content.dashboard.sections.trend} icon={BarChart3}>
              <DailyTrend content={content} data={data} />
            </SectionShell>
            <SectionShell
              title={content.dashboard.sections.rechargeRisk}
              icon={Gauge}
              aside={
                <span className="text-xs text-gray-500">
                  {formatNumber(data.totals.abnormalRechargeSignals)}{' '}
                  {content.dashboard.risk.signals}
                </span>
              }
            >
              <RechargeRiskPanel
                content={content}
                risks={data.rechargeRiskSignals}
              />
            </SectionShell>
          </div>

          <SectionShell
            title={content.dashboard.sections.generationMix}
            icon={Sparkles}
            aside={
              <span className="text-xs text-gray-500">
                {formatNumber(data.generationHealth.failedJobs)}{' '}
                {content.dashboard.metrics.failedJobs}
              </span>
            }
          >
            <GenerationHealthPanel
              content={content}
              health={data.generationHealth}
            />
          </SectionShell>
        </>
      ) : null}
    </div>
  );
}
