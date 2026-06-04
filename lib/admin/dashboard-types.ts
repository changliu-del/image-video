export type AdminDashboardRange = {
  from: string;
  to: string;
  days: number;
};

export type AdminDashboardSeverity = 'ok' | 'info' | 'warning' | 'critical';

export type AdminDashboardMetricUnit =
  | 'users'
  | 'user_days'
  | 'events'
  | 'assets'
  | 'jobs'
  | 'credits'
  | 'signals'
  | 'percent'
  | 'seconds';

export type AdminDashboardMetricSource = {
  kind: 'exact' | 'estimate' | 'derived';
  tables: string[];
  description: string;
};

export type AdminDashboardRate = {
  value: number;
  unit: 'percent' | 'ratio';
  label: string;
};

export type AdminDashboardSummaryCard = {
  key:
    | 'registrations'
    | 'activeEstimate'
    | 'visitBehavior'
    | 'uploads'
    | 'generation'
    | 'generationFailures'
    | 'generationRunning'
    | 'recharge'
    | 'rechargeRisk';
  label: string;
  value: number;
  unit: AdminDashboardMetricUnit;
  rate: AdminDashboardRate | null;
  detail: string;
  diagnosis: string;
  severity: AdminDashboardSeverity;
  source: AdminDashboardMetricSource;
};

export type AdminDashboardFunnelStepKey =
  | 'registrations'
  | 'activeEstimate'
  | 'visitBehavior'
  | 'uploads'
  | 'generation'
  | 'successfulGeneration'
  | 'recharge';

export type AdminDashboardFunnelStep = {
  key: AdminDashboardFunnelStepKey;
  label: string;
  value: number;
  unit: AdminDashboardMetricUnit;
  previousKey: AdminDashboardFunnelStepKey | null;
  previousValue: number | null;
  conversionRate: number | null;
  dropoffCount: number | null;
  dropoffRate: number | null;
  detail: string;
  diagnosis: string;
  source: AdminDashboardMetricSource;
};

export type AdminDashboardTotals = {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  activeUserDays: number;
  uploadUsers: number;
  generationUsers: number;
  successfulGenerationUsers: number;
  failedGenerationUsers: number;
  loginEvents: number;
  visitEvents: number;
  uploadedAssets: number;
  uploadSucceededAssets: number;
  uploadFailedAssets: number;
  uploadPendingAssets: number;
  generationJobs: number;
  succeededJobs: number;
  failedJobs: number;
  queuedJobs: number;
  submittingJobs: number;
  runningActiveJobs: number;
  runningJobs: number;
  stuckRunningJobs: number;
  successRate: number;
  failureRate: number;
  runningRate: number;
  avgCompletionSeconds: number | null;
  p95CompletionSeconds: number | null;
  purchaseEvents: number;
  purchasedCredits: number;
  payingUsers: number;
  creditEvents: number;
  refundEvents: number;
  manualCreditIncreases: number;
  manualCreditDecreases: number;
  abnormalRechargeSignals: number;
};

export type AdminDashboardDailyPoint = {
  date: string;
  registrations: number;
  activeUsers: number;
  activeUserDays: number;
  loginEvents: number;
  visits: number;
  uploadUsers: number;
  uploadedAssets: number;
  generationUsers: number;
  generationJobs: number;
  succeededJobs: number;
  failedJobs: number;
  runningJobs: number;
  successRate: number;
  rechargeEvents: number;
  purchasedCredits: number;
  payingUsers: number;
  abnormalRechargeSignals: number;
};

export type AdminDashboardDailyTrendSeries = {
  key:
    | 'registrations'
    | 'activeUsers'
    | 'visits'
    | 'uploadedAssets'
    | 'generationJobs'
    | 'succeededJobs'
    | 'failedJobs'
    | 'runningJobs'
    | 'rechargeEvents'
    | 'purchasedCredits'
    | 'abnormalRechargeSignals';
  label: string;
  unit: AdminDashboardMetricUnit;
  total: number;
  points: Array<{
    date: string;
    value: number;
  }>;
};

export type AdminDashboardDailyTrends = {
  points: AdminDashboardDailyPoint[];
  series: AdminDashboardDailyTrendSeries[];
  diagnosis: string;
};

export type AdminDashboardGenerationType = {
  type: string;
  total: number;
  succeeded: number;
  failed: number;
  queued: number;
  submitting: number;
  running: number;
  runningJobs: number;
  successRate: number;
  failureRate: number;
  runningRate: number;
  avgCompletionSeconds: number | null;
  diagnosis: string;
};

export type AdminDashboardGenerationStatus = {
  status: 'queued' | 'submitting' | 'running' | 'succeeded' | 'failed';
  total: number;
  rate: number;
};

export type AdminDashboardFailureReason = {
  reason: string;
  count: number;
  rate: number;
};

export type AdminDashboardGenerationHealth = {
  totalJobs: number;
  succeededJobs: number;
  failedJobs: number;
  queuedJobs: number;
  submittingJobs: number;
  runningActiveJobs: number;
  runningJobs: number;
  stuckRunningJobs: number;
  stuckRunningThresholdMinutes: number;
  successRate: number;
  failureRate: number;
  runningRate: number;
  avgCompletionSeconds: number | null;
  p95CompletionSeconds: number | null;
  byStatus: AdminDashboardGenerationStatus[];
  byType: AdminDashboardGenerationType[];
  failureReasons: AdminDashboardFailureReason[];
  diagnosis: string;
  severity: AdminDashboardSeverity;
};

export type AdminDashboardRechargeAnomalies = {
  missingStripeEvents: number;
  largePurchases: number;
  manualCreditIncreases: number;
  manualCreditDecreases: number;
  balanceMismatches: number;
};

export type AdminDashboardRechargeRiskSignal = {
  key:
    | 'missingStripeEvents'
    | 'largePurchases'
    | 'manualCreditIncreases'
    | 'manualCreditDecreases'
    | 'balanceMismatches';
  label: string;
  value: number;
  severity: AdminDashboardSeverity;
  threshold: number;
  diagnosis: string;
  source: AdminDashboardMetricSource;
};

export type AdminDashboardResponse = {
  range: AdminDashboardRange;
  totals: AdminDashboardTotals;
  daily: AdminDashboardDailyPoint[];
  generationTypes: AdminDashboardGenerationType[];
  rechargeAnomalies: AdminDashboardRechargeAnomalies;
  summaryCards: AdminDashboardSummaryCard[];
  funnelSteps: AdminDashboardFunnelStep[];
  dailyTrends: AdminDashboardDailyTrends;
  generationHealth: AdminDashboardGenerationHealth;
  rechargeRiskSignals: AdminDashboardRechargeRiskSignal[];
};
