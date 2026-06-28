'use client';

type CreateVideoNavigationOrigin =
  | 'dashboard-card'
  | 'dashboard-sidebar'
  | 'credits-link';

type TimingDetail = Record<string, unknown>;

const DEBUG_STORAGE_KEY = 'image-video:create-video-perf-debug';
const CLICK_STORAGE_KEY = 'image-video:create-video-click';
const CREATE_VIDEO_PATH = '/create/video';
const markedRscResourceKeys = new Set<string>();
let rscResourceObserver: PerformanceObserver | null = null;

function isBrowser() {
  return typeof window !== 'undefined' && typeof performance !== 'undefined';
}

function debugEnabled() {
  if (!isBrowser()) return false;

  return (
    window.localStorage.getItem(DEBUG_STORAGE_KEY) === '1' ||
    new URLSearchParams(window.location.search).get('perf') === '1'
  );
}

function mark(name: string, detail?: TimingDetail, startTime?: number) {
  if (!isBrowser()) return;

  try {
    performance.mark(name, { detail, startTime });
  } catch {
    performance.mark(name);
  }
}

function latestMark(name: string) {
  if (!isBrowser()) return null;

  const entries = performance.getEntriesByName(name, 'mark');
  return entries.length ? entries[entries.length - 1] : null;
}

function measure(name: string, start: string, end: string) {
  if (!isBrowser() || !latestMark(start) || !latestMark(end)) return;

  try {
    performance.measure(name, start, end);
  } catch {
    // Measures are best-effort diagnostics and must never affect navigation.
  }
}

function isCreateVideoRscResource(entry: PerformanceResourceTiming) {
  try {
    const url = new URL(entry.name);
    return url.pathname === CREATE_VIDEO_PATH && url.searchParams.has('_rsc');
  } catch {
    return false;
  }
}

function markCreateVideoRscReturned(entry: PerformanceResourceTiming) {
  const click = latestMark('iv:create-video:click');
  const resourceKey = `${entry.name}:${Math.round(entry.responseEnd)}`;

  if (markedRscResourceKeys.has(resourceKey)) return;
  if (click && entry.responseEnd < click.startTime - 1) return;

  markedRscResourceKeys.add(resourceKey);

  mark(
    'iv:create-video:rsc-returned',
    {
      encodedBodySize: entry.encodedBodySize,
      responseEnd: Math.round(entry.responseEnd),
      transferSize: entry.transferSize,
      url: entry.name,
    },
    entry.responseEnd
  );
  measure(
    'iv:create-video:click-to-rsc',
    'iv:create-video:click',
    'iv:create-video:rsc-returned'
  );
}

function scanCreateVideoRscResources() {
  if (!isBrowser()) return;

  for (const entry of performance.getEntriesByType('resource')) {
    if (
      entry instanceof PerformanceResourceTiming &&
      isCreateVideoRscResource(entry)
    ) {
      markCreateVideoRscReturned(entry);
    }
  }
}

export function observeCreateVideoRscReturn() {
  if (!isBrowser() || !('PerformanceObserver' in window)) {
    scanCreateVideoRscResources();
    return () => {};
  }

  scanCreateVideoRscResources();

  if (rscResourceObserver) return () => {};

  rscResourceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (
        entry instanceof PerformanceResourceTiming &&
        isCreateVideoRscResource(entry)
      ) {
        markCreateVideoRscReturned(entry);
      }
    }
  });

  try {
    rscResourceObserver.observe({ buffered: true, type: 'resource' });
  } catch {
    rscResourceObserver.observe({ entryTypes: ['resource'] });
  }

  return () => {
    rscResourceObserver?.disconnect();
    rscResourceObserver = null;
  };
}

export function markCreateVideoNavigationClick({
  href,
  origin,
}: {
  href: string;
  origin: CreateVideoNavigationOrigin;
}) {
  if (!isBrowser()) return;

  const detail = {
    href,
    origin,
    wallTime: Date.now(),
  };

  window.sessionStorage.setItem(CLICK_STORAGE_KEY, JSON.stringify(detail));
  mark('iv:create-video:click', detail);
  observeCreateVideoRscReturn();
}

export function markCreateVideoWorkbenchMounted() {
  mark('iv:create-video:workbench-mounted', {
    click: isBrowser()
      ? window.sessionStorage.getItem(CLICK_STORAGE_KEY)
      : null,
    path: isBrowser() ? window.location.pathname : CREATE_VIDEO_PATH,
  });
  measure(
    'iv:create-video:click-to-mount',
    'iv:create-video:click',
    'iv:create-video:workbench-mounted'
  );
  measure(
    'iv:create-video:rsc-to-mount',
    'iv:create-video:rsc-returned',
    'iv:create-video:workbench-mounted'
  );
  installCreateVideoPerfReporter();
}

export function markCreateVideoTemplatesStart(detail?: TimingDetail) {
  mark('iv:create-video:templates-start', detail);
  measure(
    'iv:create-video:mount-to-templates-start',
    'iv:create-video:workbench-mounted',
    'iv:create-video:templates-start'
  );
}

export function markCreateVideoTemplatesLoaded(detail?: TimingDetail) {
  mark('iv:create-video:templates-loaded', detail);
  measure(
    'iv:create-video:templates-duration',
    'iv:create-video:templates-start',
    'iv:create-video:templates-loaded'
  );
  measure(
    'iv:create-video:click-to-templates-loaded',
    'iv:create-video:click',
    'iv:create-video:templates-loaded'
  );
  logCreateVideoPerfReport();
}

export function markCreateVideoTemplatesError(detail?: TimingDetail) {
  mark('iv:create-video:templates-error', detail);
  measure(
    'iv:create-video:templates-error-duration',
    'iv:create-video:templates-start',
    'iv:create-video:templates-error'
  );
  logCreateVideoPerfReport();
}

export function markDashboardInspirationTemplatesStart(detail?: TimingDetail) {
  mark('iv:dashboard:inspiration-templates-start', detail);
}

export function markDashboardInspirationTemplatesLoaded(detail?: TimingDetail) {
  mark('iv:dashboard:inspiration-templates-loaded', detail);
  measure(
    'iv:dashboard:inspiration-templates-duration',
    'iv:dashboard:inspiration-templates-start',
    'iv:dashboard:inspiration-templates-loaded'
  );
}

export function markDashboardInspirationTemplatesError(detail?: TimingDetail) {
  mark('iv:dashboard:inspiration-templates-error', detail);
  measure(
    'iv:dashboard:inspiration-templates-error-duration',
    'iv:dashboard:inspiration-templates-start',
    'iv:dashboard:inspiration-templates-error'
  );
}

function getCreateVideoPerfReport() {
  if (!isBrowser()) return [];

  const rows = [
    ...performance
      .getEntriesByType('mark')
      .filter((entry) => entry.name.startsWith('iv:'))
      .map((entry) => ({
        duration: 0,
        name: entry.name,
        start: Math.round(entry.startTime),
        type: 'mark',
      })),
    ...performance
      .getEntriesByType('measure')
      .filter((entry) => entry.name.startsWith('iv:'))
      .map((entry) => ({
        duration: Math.round(entry.duration),
        name: entry.name,
        start: Math.round(entry.startTime),
        type: 'measure',
      })),
    ...performance
      .getEntriesByType('resource')
      .filter((entry) => {
        if (!(entry instanceof PerformanceResourceTiming)) return false;
        return (
          entry.name.includes('/api/templates') ||
          entry.name.includes('/_next/static/chunks/') ||
          isCreateVideoRscResource(entry)
        );
      })
      .map((entry) => ({
        duration: Math.round(entry.duration),
        name: entry.name,
        start: Math.round(entry.startTime),
        type: 'resource',
      })),
  ];

  return rows.sort((a, b) => a.start - b.start);
}

function installCreateVideoPerfReporter() {
  if (!isBrowser()) return;

  const perfWindow = window as Window & {
    __imageVideoPerf?: {
      createVideoReport: () => ReturnType<typeof getCreateVideoPerfReport>;
      enable: () => void;
      reset: () => void;
    };
  };

  perfWindow.__imageVideoPerf = {
    createVideoReport: getCreateVideoPerfReport,
    enable: () => window.localStorage.setItem(DEBUG_STORAGE_KEY, '1'),
    reset: () => {
      performance.clearMarks();
      performance.clearMeasures();
      window.sessionStorage.removeItem(CLICK_STORAGE_KEY);
    },
  };
}

function logCreateVideoPerfReport() {
  if (!isBrowser() || !debugEnabled()) return;

  console.table(getCreateVideoPerfReport());
}
