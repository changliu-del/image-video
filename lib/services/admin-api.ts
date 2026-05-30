// Client-side admin API service
// Following ai-ops-fe convention: typed service functions

import type {
  AdminUserListResponse,
  AdminAssetListResponse,
  AdminJobListResponse,
  AdminCreditListResponse,
} from '@/types/api';

const BASE = '/api/admin';

async function fetchAdmin<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(endpoint, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json() as Promise<T>;
}

async function adminAction<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json() as Promise<T>;
}

async function adminDelete(endpoint: string, id: string | number): Promise<void> {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
}

export const adminApi = {
  users: {
    list: (params?: Record<string, string>) => fetchAdmin<AdminUserListResponse>(`${BASE}/users`, params),
    update: (data: Record<string, unknown>) => adminAction('/users', data),
    delete: (id: number) => adminDelete('/users', id),
    restore: (id: number) => adminAction('/users', { action: 'restore', id }),
    adjustCredits: (data: Record<string, unknown>) => adminAction('/users', { action: 'adjust-credits', ...data }),
  },
  assets: {
    list: (params?: Record<string, string>) => fetchAdmin<AdminAssetListResponse>(`${BASE}/assets`, params),
    delete: (id: string) => adminDelete('/assets', id),
  },
  jobs: {
    list: (params?: Record<string, string>) => fetchAdmin<AdminJobListResponse>(`${BASE}/generation-jobs`, params),
    delete: (id: string) => adminDelete('/generation-jobs', id),
  },
  credits: {
    list: (params?: Record<string, string>) => fetchAdmin<AdminCreditListResponse>(`${BASE}/credit-ledger`, params),
  },
};
