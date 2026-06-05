import 'server-only';

import { client } from '@/lib/db/drizzle';
import { requireOpsOrAdmin } from '@/lib/db/queries';
import type {
  AdminDashboardDailyPoint,
  AdminDashboardDailyTrendSeries,
  AdminDashboardFunnelStep,
  AdminDashboardFunnelStepKey,
  AdminDashboardGenerationHealth,
  AdminDashboardGenerationStatus,
  AdminDashboardGenerationType,
  AdminDashboardMetricSource,
  AdminDashboardResponse,
  AdminDashboardSeverity,
  AdminDashboardSummaryCard,
  AdminDashboardTotals,
} from '@/lib/admin/dashboard-types';

const DEFAULT_RANGE_DAYS = 7;
const MAX_RANGE_DAYS = 90;
const STUCK_RUNNING_THRESHOLD_MINUTES = 15;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const GENERATION_STATUS_KEYS = [
  'queued',
  'submitting',
  'running',
  'succeeded',
  'failed',
] as const;

const SOURCES = {
  users: {
    kind: 'exact',
    tables: ['users'],
    description: 'Registered users are counted from users.created_at.',
  },
  activityEstimate: {
    kind: 'estimate',
    tables: ['assets', 'generation_jobs'],
    description:
      'No dedicated session/page-view table exists, so active behavior is estimated from user uploads and generation jobs.',
  },
  uploads: {
    kind: 'exact',
    tables: ['assets'],
    description:
      "Upload behavior is counted from user upload assets under users/*/uploads/*.",
  },
  generation: {
    kind: 'exact',
    tables: ['generation_jobs'],
    description:
      'Generation health is counted from generation_jobs created in the selected range.',
  },
  recharge: {
    kind: 'exact',
    tables: ['credit_ledger'],
    description:
      "Recharge metrics are counted from credit_ledger entries where reason = 'purchase'.",
  },
} satisfies Record<string, AdminDashboardMetricSource>;

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumberValue(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function validDateKey(value: string | null | undefined) {
  if (!value || !DATE_KEY_RE.test(value)) return null;
  const date = dateFromKey(value);
  return dateKeyFromDate(date) === value ? value : null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeRange(input: { from?: string | null; to?: string | null }) {
  const today = new Date();
  let to = dateFromKey(validDateKey(input.to) ?? dateKeyFromDate(today));
  let from = dateFromKey(
    validDateKey(input.from) ??
      dateKeyFromDate(addDays(to, -(DEFAULT_RANGE_DAYS - 1)))
  );

  if (from.getTime() > to.getTime()) {
    [from, to] = [to, from];
  }

  const requestedDays = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
  if (requestedDays > MAX_RANGE_DAYS) {
    from = addDays(to, -(MAX_RANGE_DAYS - 1));
  }

  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
  return {
    from: dateKeyFromDate(from),
    to: dateKeyFromDate(to),
    days,
  };
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function conversionRate(value: number, previousValue: number | null) {
  return previousValue ? percent(value, previousValue) : null;
}

function dropoffCount(value: number, previousValue: number | null) {
  if (previousValue === null) return null;
  return Math.max(previousValue - value, 0);
}

function dropoffRate(value: number, previousValue: number | null) {
  const dropoff = dropoffCount(value, previousValue);
  return dropoff === null ? null : percent(dropoff, previousValue ?? 0);
}

function generationSeverity(totals: AdminDashboardTotals): AdminDashboardSeverity {
  if (!totals.generationJobs) return 'info';
  if (totals.stuckRunningJobs > 0 || totals.failureRate >= 20) {
    return 'critical';
  }
  if (totals.failureRate >= 10 || totals.runningRate >= 35) {
    return 'warning';
  }
  return 'ok';
}

function generationDiagnosis(totals: AdminDashboardTotals) {
  if (!totals.generationJobs) {
    return 'No generation jobs were created in the selected range.';
  }
  if (totals.stuckRunningJobs > 0) {
    return `${totals.stuckRunningJobs} running job(s) have not moved within ${STUCK_RUNNING_THRESHOLD_MINUTES} minutes and should be checked first.`;
  }
  if (totals.failureRate >= 20) {
    return 'Generation failure rate is high; inspect provider errors and recent input patterns.';
  }
  if (totals.runningRate >= 35) {
    return 'A large share of jobs is still queued, submitting, or running; check provider latency and poll scheduling.';
  }
  return 'Generation jobs are mostly completing within the selected range.';
}

function generationTypeDiagnosis(type: string, total: number, failureRate: number) {
  if (!total) return `No ${type} jobs in the selected range.`;
  if (failureRate >= 20) {
    return `${type} is the weakest generation type by failure rate and needs provider/input review.`;
  }
  if (failureRate >= 10) {
    return `${type} has elevated failures; watch recent prompts and provider responses.`;
  }
  return `${type} is within the normal generation health band.`;
}

function dailyTrendDiagnosis(points: AdminDashboardDailyPoint[]) {
  if (points.length === 0) return 'No daily data is available for this range.';
  const totalVisits = points.reduce((sum, point) => sum + point.visits, 0);
  const totalJobs = points.reduce((sum, point) => sum + point.generationJobs, 0);
  if (totalVisits === 0 && totalJobs === 0) {
    return 'No observable authenticated activity was recorded in this range.';
  }
  return 'Daily trends combine registrations, active users, retained users, and generation health.';
}

function summaryCards(totals: AdminDashboardTotals): AdminDashboardSummaryCard[] {
  const generationRisk = generationSeverity(totals);

  return [
    {
      key: 'registrations',
      label: 'Registrations',
      value: totals.newUsers,
      unit: 'users',
      rate: {
        value: percent(totals.newUsers, totals.totalUsers),
        unit: 'percent',
        label: 'New users / total users',
      },
      detail: `${totals.totalUsers} non-deleted accounts`,
      diagnosis:
        totals.newUsers > 0
          ? 'New registrations were created in the selected range.'
          : 'No new registrations were created in the selected range.',
      severity: totals.newUsers > 0 ? 'ok' : 'info',
      source: SOURCES.users,
    },
    {
      key: 'activeEstimate',
      label: 'Active rate',
      value: totals.activeRate,
      unit: 'percent',
      rate: null,
      detail: `${totals.activeUsers} active user(s) / ${totals.totalUsers} total user(s)`,
      diagnosis:
        'Estimated from authenticated upload and generation writes because dedicated session analytics do not exist yet.',
      severity: 'info',
      source: SOURCES.activityEstimate,
    },
    {
      key: 'retention',
      label: 'Retention rate',
      value: totals.retentionRate,
      unit: 'percent',
      rate: null,
      detail: `${totals.retainedUsers} retained user(s) / ${totals.existingUsers} existing user(s)`,
      diagnosis:
        'Returning users are existing accounts with observable upload or generation activity in the selected range.',
      severity: totals.retentionRate > 0 ? 'ok' : 'info',
      source: SOURCES.activityEstimate,
    },
    {
      key: 'generation',
      label: 'Generation',
      value: totals.generationJobs,
      unit: 'jobs',
      rate: {
        value: totals.successRate,
        unit: 'percent',
        label: 'Generation success rate',
      },
      detail: `${totals.succeededJobs} succeeded; ${totals.failedJobs} failed`,
      diagnosis: generationDiagnosis(totals),
      severity: generationRisk,
      source: SOURCES.generation,
    },
    {
      key: 'generationFailures',
      label: 'Failed generation',
      value: totals.failedJobs,
      unit: 'jobs',
      rate: {
        value: totals.failureRate,
        unit: 'percent',
        label: 'Failed jobs / generation jobs',
      },
      detail: `${totals.failedGenerationUsers} user(s) hit failed jobs`,
      diagnosis:
        totals.failedJobs > 0
          ? 'Failed jobs need provider error and input review.'
          : 'No failed generation jobs were created in this range.',
      severity:
        totals.failureRate >= 20
          ? 'critical'
          : totals.failureRate >= 10
            ? 'warning'
            : 'ok',
      source: SOURCES.generation,
    },
    {
      key: 'generationRunning',
      label: 'Running generation',
      value: totals.runningJobs,
      unit: 'jobs',
      rate: {
        value: totals.runningRate,
        unit: 'percent',
        label: 'Running jobs / generation jobs',
      },
      detail: `${totals.queuedJobs} queued; ${totals.submittingJobs} submitting; ${totals.runningActiveJobs} running`,
      diagnosis:
        totals.stuckRunningJobs > 0
          ? `${totals.stuckRunningJobs} job(s) appear stuck beyond ${STUCK_RUNNING_THRESHOLD_MINUTES} minutes.`
          : 'Queued, submitting, and running jobs are within the visible active set.',
      severity:
        totals.stuckRunningJobs > 0
          ? 'critical'
          : totals.runningRate >= 35
            ? 'warning'
            : 'ok',
      source: SOURCES.generation,
    },
  ];
}

function makeFunnelStep(input: {
  key: AdminDashboardFunnelStepKey;
  label: string;
  value: number;
  unit: AdminDashboardFunnelStep['unit'];
  previousKey: AdminDashboardFunnelStepKey | null;
  previousValue: number | null;
  detail: string;
  diagnosis: string;
  source: AdminDashboardMetricSource;
}): AdminDashboardFunnelStep {
  return {
    ...input,
    conversionRate: conversionRate(input.value, input.previousValue),
    dropoffCount: dropoffCount(input.value, input.previousValue),
    dropoffRate: dropoffRate(input.value, input.previousValue),
  };
}

function funnelSteps(totals: AdminDashboardTotals): AdminDashboardFunnelStep[] {
  return [
    makeFunnelStep({
      key: 'registrations',
      label: 'Registered users',
      value: totals.newUsers,
      unit: 'users',
      previousKey: null,
      previousValue: null,
      detail: `${totals.newUsers} new user(s) registered in this range`,
      diagnosis:
        'This funnel follows users who registered inside the selected range.',
      source: SOURCES.users,
    }),
    makeFunnelStep({
      key: 'activeEstimate',
      label: 'Active users',
      value: totals.newActiveUsers,
      unit: 'users',
      previousKey: 'registrations',
      previousValue: totals.newUsers,
      detail: `${totals.newActiveUsers} new user(s) had observable product activity`,
      diagnosis:
        'Active conversion is estimated from authenticated upload and generation writes, not a dedicated session table.',
      source: SOURCES.activityEstimate,
    }),
    makeFunnelStep({
      key: 'generation',
      label: 'Generation users',
      value: totals.newGenerationUsers,
      unit: 'users',
      previousKey: 'activeEstimate',
      previousValue: totals.newActiveUsers,
      detail: `${totals.newGenerationUsers} new user(s) created generation jobs`,
      diagnosis:
        'Generation conversion uses same-range user counts, so upload is not treated as a separate required funnel step.',
      source: SOURCES.generation,
    }),
    makeFunnelStep({
      key: 'successfulGeneration',
      label: 'Successful generation users',
      value: totals.newSuccessfulGenerationUsers,
      unit: 'users',
      previousKey: 'generation',
      previousValue: totals.newGenerationUsers,
      detail: `${totals.newSuccessfulGenerationUsers} new user(s) reached a successful generation`,
      diagnosis:
        totals.failedJobs > 0
          ? 'Some generation users did not reach a successful job in this range.'
          : 'Generation users reached successful jobs without visible failures.',
      source: SOURCES.generation,
    }),
  ];
}

function dailySeries(
  key: AdminDashboardDailyTrendSeries['key'],
  label: string,
  unit: AdminDashboardDailyTrendSeries['unit'],
  points: AdminDashboardDailyPoint[],
  selector: (point: AdminDashboardDailyPoint) => number
): AdminDashboardDailyTrendSeries {
  return {
    key,
    label,
    unit,
    total: points.reduce((sum, point) => sum + selector(point), 0),
    points: points.map((point) => ({
      date: point.date,
      value: selector(point),
    })),
  };
}

export async function getAdminDashboard(params: {
  from?: string | null;
  to?: string | null;
}): Promise<AdminDashboardResponse> {
  await requireOpsOrAdmin();
  const range = normalizeRange(params);

  const [
    summaryRows,
    dailyRows,
    generationTypeRows,
    failureReasonRows,
  ] = await Promise.all([
    client`
      with range as (
        select
          ${range.from}::date as from_day,
          (${range.to}::date + interval '1 day') as to_exclusive
      ),
      activity_events as (
        select user_id, created_at from assets, range
        where created_at >= range.from_day and created_at < range.to_exclusive
          and type = 'upload'
          and storage_key like 'users/%/uploads/%'
        union all
        select user_id, created_at from generation_jobs, range
        where created_at >= range.from_day and created_at < range.to_exclusive
      ),
      active_user_days as (
        select distinct user_id, date_trunc('day', created_at)::date as day
        from activity_events
      ),
      credit_window as (
        select user_id, reason, delta
        from credit_ledger, range
        where created_at >= range.from_day
          and created_at < range.to_exclusive
      ),
      credit_rollup as (
        select
          count(*)::integer as credit_events,
          count(*) filter (where reason = 'purchase')::integer as purchase_events,
          coalesce(sum(delta) filter (where reason = 'purchase'), 0)::integer as purchased_credits,
          count(distinct user_id) filter (where reason = 'purchase')::integer as paying_users,
          count(*) filter (where reason = 'refund')::integer as refund_events
        from credit_window
      )
      select
        (select count(*)::integer from users where deleted_at is null) as total_users,
        (select count(*)::integer from users, range
          where deleted_at is null
            and created_at < range.from_day
        ) as existing_users,
        (select count(*)::integer from users, range
          where deleted_at is null
            and created_at >= range.from_day
            and created_at < range.to_exclusive
        ) as new_users,
        (select count(distinct user_id)::integer from activity_events) as active_users,
        (select count(distinct activity_events.user_id)::integer
          from activity_events
          inner join users on users.id = activity_events.user_id
          cross join range
          where users.deleted_at is null
            and users.created_at >= range.from_day
            and users.created_at < range.to_exclusive
        ) as new_active_users,
        (select count(distinct activity_events.user_id)::integer
          from activity_events
          inner join users on users.id = activity_events.user_id
          cross join range
          where users.deleted_at is null
            and users.created_at < range.from_day
        ) as retained_users,
        (select count(*)::integer from active_user_days) as active_user_days,
        (select count(*)::integer from activity_events) as visit_events,
        (select count(distinct user_id)::integer from assets, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and type = 'upload'
            and storage_key like 'users/%/uploads/%'
        ) as upload_users,
        (select count(*)::integer from assets, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and type = 'upload'
            and storage_key like 'users/%/uploads/%'
        ) as uploaded_assets,
        (select count(*)::integer from assets, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and type = 'upload'
            and storage_key like 'users/%/uploads/%'
            and status = 'uploaded'
        ) as upload_succeeded_assets,
        (select count(*)::integer from assets, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and type = 'upload'
            and storage_key like 'users/%/uploads/%'
            and status = 'failed'
        ) as upload_failed_assets,
        (select count(*)::integer from assets, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and type = 'upload'
            and storage_key like 'users/%/uploads/%'
            and status = 'pending'
        ) as upload_pending_assets,
        (select count(distinct user_id)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
        ) as generation_users,
        (select count(distinct generation_jobs.user_id)::integer
          from generation_jobs
          inner join users on users.id = generation_jobs.user_id
          cross join range
          where generation_jobs.created_at >= range.from_day
            and generation_jobs.created_at < range.to_exclusive
            and users.deleted_at is null
            and users.created_at >= range.from_day
            and users.created_at < range.to_exclusive
        ) as new_generation_users,
        (select count(distinct user_id)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status = 'succeeded'
        ) as successful_generation_users,
        (select count(distinct generation_jobs.user_id)::integer
          from generation_jobs
          inner join users on users.id = generation_jobs.user_id
          cross join range
          where generation_jobs.created_at >= range.from_day
            and generation_jobs.created_at < range.to_exclusive
            and generation_jobs.status = 'succeeded'
            and users.deleted_at is null
            and users.created_at >= range.from_day
            and users.created_at < range.to_exclusive
        ) as new_successful_generation_users,
        (select count(distinct user_id)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status = 'failed'
        ) as failed_generation_users,
        (select count(*)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
        ) as generation_jobs,
        (select count(*)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status = 'succeeded'
        ) as succeeded_jobs,
        (select count(*)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status = 'failed'
        ) as failed_jobs,
        (select count(*)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status = 'queued'
        ) as queued_jobs,
        (select count(*)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status = 'submitting'
        ) as submitting_jobs,
        (select count(*)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status = 'running'
        ) as running_active_jobs,
        (select count(*)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status in ('queued', 'submitting', 'running')
        ) as running_jobs,
        (select count(*)::integer from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status in ('queued', 'submitting', 'running')
            and updated_at < now() - (${STUCK_RUNNING_THRESHOLD_MINUTES}::text || ' minutes')::interval
        ) as stuck_running_jobs,
        (select round(avg(extract(epoch from (updated_at - created_at))))::integer
          from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status in ('succeeded', 'failed')
            and updated_at >= created_at
        ) as avg_completion_seconds,
        (select round(
            (
              percentile_cont(0.95) within group (
                order by extract(epoch from (updated_at - created_at))
              )
            )::numeric
          )::integer
          from generation_jobs, range
          where created_at >= range.from_day
            and created_at < range.to_exclusive
            and status in ('succeeded', 'failed')
            and updated_at >= created_at
        ) as p95_completion_seconds,
        (select credit_events from credit_rollup) as credit_events,
        (select purchase_events from credit_rollup) as purchase_events,
        (select purchased_credits from credit_rollup) as purchased_credits,
        (select paying_users from credit_rollup) as paying_users,
        (select refund_events from credit_rollup) as refund_events
    `,
    client`
      with range as (
        select
          ${range.from}::date as from_day,
          ${range.to}::date as to_day,
          (${range.to}::date + interval '1 day') as to_exclusive
      ),
      days as (
        select generate_series(range.from_day, range.to_day, interval '1 day')::date as day
        from range
      ),
      activity_events as (
        select date_trunc('day', created_at)::date as day, user_id from assets, range
        where created_at >= range.from_day and created_at < range.to_exclusive
          and type = 'upload'
          and storage_key like 'users/%/uploads/%'
        union all
        select date_trunc('day', created_at)::date as day, user_id from generation_jobs, range
        where created_at >= range.from_day and created_at < range.to_exclusive
      ),
      visits as (
        select
          day,
          count(*)::integer as visits,
          count(distinct user_id)::integer as active_users,
          count(distinct user_id)::integer as active_user_days
        from activity_events
        group by day
      ),
      retained as (
        select
          activity_events.day,
          count(distinct activity_events.user_id)::integer as users
        from activity_events
        inner join users on users.id = activity_events.user_id
        where users.deleted_at is null
          and users.created_at < activity_events.day
        group by activity_events.day
      ),
      registrations as (
        select date_trunc('day', created_at)::date as day, count(*)::integer as total
        from users, range
        where deleted_at is null
          and created_at >= range.from_day
          and created_at < range.to_exclusive
        group by day
      ),
      uploads as (
        select
          date_trunc('day', created_at)::date as day,
          count(distinct user_id)::integer as users,
          count(*)::integer as total
        from assets, range
        where created_at >= range.from_day
          and created_at < range.to_exclusive
          and type = 'upload'
          and storage_key like 'users/%/uploads/%'
        group by day
      ),
      jobs as (
        select
          date_trunc('day', created_at)::date as day,
          count(distinct user_id)::integer as users,
          count(*)::integer as total,
          count(*) filter (where status = 'succeeded')::integer as succeeded,
          count(*) filter (where status = 'failed')::integer as failed,
          count(*) filter (where status in ('queued', 'submitting', 'running'))::integer as running
        from generation_jobs, range
        where created_at >= range.from_day
          and created_at < range.to_exclusive
        group by day
      ),
      recharge as (
        select
          date_trunc('day', created_at)::date as day,
          count(*) filter (where reason = 'purchase')::integer as events,
          coalesce(sum(delta) filter (where reason = 'purchase'), 0)::integer as credits,
          count(distinct user_id) filter (where reason = 'purchase')::integer as paying_users
        from credit_ledger, range
        where created_at >= range.from_day
          and created_at < range.to_exclusive
        group by day
      )
      select
        to_char(days.day, 'YYYY-MM-DD') as date,
        coalesce(registrations.total, 0)::integer as registrations,
        coalesce(visits.active_users, 0)::integer as active_users,
        coalesce(visits.active_user_days, 0)::integer as active_user_days,
        coalesce(retained.users, 0)::integer as retained_users,
        coalesce(visits.active_user_days, 0)::integer as login_events,
        coalesce(visits.visits, 0)::integer as visits,
        coalesce(uploads.users, 0)::integer as upload_users,
        coalesce(uploads.total, 0)::integer as uploaded_assets,
        coalesce(jobs.users, 0)::integer as generation_users,
        coalesce(jobs.total, 0)::integer as generation_jobs,
        coalesce(jobs.succeeded, 0)::integer as succeeded_jobs,
        coalesce(jobs.failed, 0)::integer as failed_jobs,
        coalesce(jobs.running, 0)::integer as running_jobs,
        coalesce(recharge.events, 0)::integer as recharge_events,
        coalesce(recharge.credits, 0)::integer as purchased_credits,
        coalesce(recharge.paying_users, 0)::integer as paying_users
      from days
      left join registrations on registrations.day = days.day
      left join visits on visits.day = days.day
      left join retained on retained.day = days.day
      left join uploads on uploads.day = days.day
      left join jobs on jobs.day = days.day
      left join recharge on recharge.day = days.day
      order by days.day asc
    `,
    client`
      with range as (
        select
          ${range.from}::date as from_day,
          (${range.to}::date + interval '1 day') as to_exclusive
      )
      select
        generation_type as type,
        count(*)::integer as total,
        count(*) filter (where status = 'succeeded')::integer as succeeded,
        count(*) filter (where status = 'failed')::integer as failed,
        count(*) filter (where status = 'queued')::integer as queued,
        count(*) filter (where status = 'submitting')::integer as submitting,
        count(*) filter (where status = 'running')::integer as running,
        round((avg(extract(epoch from (updated_at - created_at))) filter (
          where status in ('succeeded', 'failed') and updated_at >= created_at
        )))::integer as avg_completion_seconds
      from generation_jobs, range
      where created_at >= range.from_day
        and created_at < range.to_exclusive
      group by generation_type
      order by total desc, generation_type asc
    `,
    client`
      with range as (
        select
          ${range.from}::date as from_day,
          (${range.to}::date + interval '1 day') as to_exclusive
      )
      select
        coalesce(nullif(left(error_message, 160), ''), 'Unknown failure') as reason,
        count(*)::integer as count
      from generation_jobs, range
      where created_at >= range.from_day
        and created_at < range.to_exclusive
        and status = 'failed'
      group by 1
      order by count(*) desc, 1 asc
      limit 5
    `,
  ]);

  const summary = summaryRows[0] ?? {};
  const totalUsers = numberValue(summary.total_users);
  const existingUsers = numberValue(summary.existing_users);
  const activeUsers = numberValue(summary.active_users);
  const retainedUsers = numberValue(summary.retained_users);
  const generationJobs = numberValue(summary.generation_jobs);
  const succeededJobs = numberValue(summary.succeeded_jobs);
  const failedJobs = numberValue(summary.failed_jobs);
  const queuedJobs = numberValue(summary.queued_jobs);
  const submittingJobs = numberValue(summary.submitting_jobs);
  const runningActiveJobs = numberValue(summary.running_active_jobs);
  const runningJobs = numberValue(summary.running_jobs);
  const totals: AdminDashboardTotals = {
    totalUsers,
    existingUsers,
    newUsers: numberValue(summary.new_users),
    activeUsers,
    newActiveUsers: numberValue(summary.new_active_users),
    activeUserDays: numberValue(summary.active_user_days),
    retainedUsers,
    activeRate: percent(activeUsers, totalUsers),
    retentionRate: percent(retainedUsers, existingUsers),
    uploadUsers: numberValue(summary.upload_users),
    loginEvents: numberValue(summary.active_user_days),
    visitEvents: numberValue(summary.visit_events),
    uploadedAssets: numberValue(summary.uploaded_assets),
    uploadSucceededAssets: numberValue(summary.upload_succeeded_assets),
    uploadFailedAssets: numberValue(summary.upload_failed_assets),
    uploadPendingAssets: numberValue(summary.upload_pending_assets),
    generationUsers: numberValue(summary.generation_users),
    newGenerationUsers: numberValue(summary.new_generation_users),
    successfulGenerationUsers: numberValue(summary.successful_generation_users),
    newSuccessfulGenerationUsers: numberValue(
      summary.new_successful_generation_users
    ),
    failedGenerationUsers: numberValue(summary.failed_generation_users),
    generationJobs,
    succeededJobs,
    failedJobs,
    queuedJobs,
    submittingJobs,
    runningActiveJobs,
    runningJobs,
    stuckRunningJobs: numberValue(summary.stuck_running_jobs),
    successRate: percent(succeededJobs, generationJobs),
    failureRate: percent(failedJobs, generationJobs),
    runningRate: percent(runningJobs, generationJobs),
    avgCompletionSeconds: nullableNumberValue(summary.avg_completion_seconds),
    p95CompletionSeconds: nullableNumberValue(summary.p95_completion_seconds),
    purchaseEvents: numberValue(summary.purchase_events),
    purchasedCredits: numberValue(summary.purchased_credits),
    payingUsers: numberValue(summary.paying_users),
    creditEvents: numberValue(summary.credit_events),
    refundEvents: numberValue(summary.refund_events),
  };

  const daily: AdminDashboardDailyPoint[] = dailyRows.map((row) => {
    const dailyGenerationJobs = numberValue(row.generation_jobs);
    const dailySucceededJobs = numberValue(row.succeeded_jobs);
    return {
      date: String(row.date),
      registrations: numberValue(row.registrations),
      activeUsers: numberValue(row.active_users),
      activeUserDays: numberValue(row.active_user_days),
      retainedUsers: numberValue(row.retained_users),
      activeRate: percent(numberValue(row.active_users), totals.totalUsers),
      retentionRate: percent(numberValue(row.retained_users), totals.existingUsers),
      loginEvents: numberValue(row.login_events),
      visits: numberValue(row.visits),
      uploadUsers: numberValue(row.upload_users),
      uploadedAssets: numberValue(row.uploaded_assets),
      generationUsers: numberValue(row.generation_users),
      generationJobs: dailyGenerationJobs,
      succeededJobs: dailySucceededJobs,
      failedJobs: numberValue(row.failed_jobs),
      runningJobs: numberValue(row.running_jobs),
      successRate: percent(dailySucceededJobs, dailyGenerationJobs),
      rechargeEvents: numberValue(row.recharge_events),
      purchasedCredits: numberValue(row.purchased_credits),
      payingUsers: numberValue(row.paying_users),
    };
  });

  const generationTypes: AdminDashboardGenerationType[] =
    generationTypeRows.map((row) => {
      const total = numberValue(row.total);
      const succeeded = numberValue(row.succeeded);
      const failed = numberValue(row.failed);
      const queued = numberValue(row.queued);
      const submitting = numberValue(row.submitting);
      const running = numberValue(row.running);
      const type = String(row.type);
      const typeRunningJobs = queued + submitting + running;
      const typeFailureRate = percent(failed, total);

      return {
        type,
        total,
        succeeded,
        failed,
        queued,
        submitting,
        running,
        runningJobs: typeRunningJobs,
        successRate: percent(succeeded, total),
        failureRate: typeFailureRate,
        runningRate: percent(typeRunningJobs, total),
        avgCompletionSeconds: nullableNumberValue(row.avg_completion_seconds),
        diagnosis: generationTypeDiagnosis(type, total, typeFailureRate),
      };
    });

  const byStatus: AdminDashboardGenerationStatus[] = GENERATION_STATUS_KEYS.map(
    (status) => {
      const statusTotals = {
        queued: totals.queuedJobs,
        submitting: totals.submittingJobs,
        running: totals.runningActiveJobs,
        succeeded: totals.succeededJobs,
        failed: totals.failedJobs,
      };
      const total = statusTotals[status];
      return {
        status,
        total,
        rate: percent(total, totals.generationJobs),
      };
    }
  );

  const failureReasons = failureReasonRows.map((row) => {
    const count = numberValue(row.count);
    return {
      reason: String(row.reason),
      count,
      rate: percent(count, totals.failedJobs),
    };
  });

  const generationHealth: AdminDashboardGenerationHealth = {
    totalJobs: totals.generationJobs,
    succeededJobs: totals.succeededJobs,
    failedJobs: totals.failedJobs,
    queuedJobs: totals.queuedJobs,
    submittingJobs: totals.submittingJobs,
    runningActiveJobs: totals.runningActiveJobs,
    runningJobs: totals.runningJobs,
    stuckRunningJobs: totals.stuckRunningJobs,
    stuckRunningThresholdMinutes: STUCK_RUNNING_THRESHOLD_MINUTES,
    successRate: totals.successRate,
    failureRate: totals.failureRate,
    runningRate: totals.runningRate,
    avgCompletionSeconds: totals.avgCompletionSeconds,
    p95CompletionSeconds: totals.p95CompletionSeconds,
    byStatus,
    byType: generationTypes,
    failureReasons,
    diagnosis: generationDiagnosis(totals),
    severity: generationSeverity(totals),
  };

  const dailyTrends = {
    points: daily,
    series: [
      dailySeries('registrations', 'Registrations', 'users', daily, (point) =>
        point.registrations
      ),
      dailySeries('activeUsers', 'Active users', 'users', daily, (point) =>
        point.activeUsers
      ),
      dailySeries('retainedUsers', 'Retained users', 'users', daily, (point) =>
        point.retainedUsers
      ),
      dailySeries('generationJobs', 'Generation jobs', 'jobs', daily, (point) =>
        point.generationJobs
      ),
      dailySeries('failedJobs', 'Failed jobs', 'jobs', daily, (point) =>
        point.failedJobs
      ),
      dailySeries('runningJobs', 'Running jobs', 'jobs', daily, (point) =>
        point.runningJobs
      ),
    ],
    diagnosis: dailyTrendDiagnosis(daily),
  };

  return {
    range,
    totals,
    daily,
    generationTypes,
    summaryCards: summaryCards(totals),
    funnelSteps: funnelSteps(totals),
    dailyTrends,
    generationHealth,
  };
}
