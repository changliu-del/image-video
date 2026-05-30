'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw, Trash2,
  Users, Film, ReceiptText, Image,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TABLES = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'assets', label: 'Assets', icon: Image },
  { key: 'generation-jobs', label: 'Generation Jobs', icon: Film },
  { key: 'credit-ledger', label: 'Credit Ledger', icon: ReceiptText },
] as const;

type TableKey = typeof TABLES[number]['key'];

function formatDate(v: string | null | undefined) {
  if (!v) return '-';
  return new Date(v).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' });
}

function short(v: unknown, max = 32) {
  if (v == null || v === '') return '-';
  const t = typeof v === 'string' ? v : JSON.stringify(v);
  return t.length > max ? t.slice(0, max) + '...' : t;
}


interface PaginatedResp {
  list: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
}

function useAdminData(tableKey: TableKey) {
  const [data, setData] = useState<PaginatedResp>({ list: [], total: 0, page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetcher = useCallback(async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch('/api/admin/' + tableKey + '?' + params);
      const json = await res.json();
      if (json.list) setData(json);
    } finally {
      setLoading(false);
    }
  }, [tableKey]);

  useEffect(() => { fetcher(1, search); }, [fetcher, search]);

  const handleDelete = async (id: string | number) => {
    await fetch('/api/admin/' + tableKey, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetcher(data.page, search);
  };

  const handleAction = async (action: string, body: Record<string, unknown>) => {
    await fetch('/api/admin/' + tableKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    fetcher(data.page, search);
  };

  return { data, search, setSearch, loading, fetcher, handleDelete, handleAction, setData };
}


function DataTable({ rows, columns, onDelete, renderActions }: {
  rows: Record<string, unknown>[];
  columns: string[];
  onDelete?: (row: Record<string, unknown>) => void;
  renderActions?: (row: Record<string, unknown>) => React.ReactNode;
}) {
  if (!rows.length) return <div className="py-6 text-center text-gray-500">No data.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b text-xs uppercase text-gray-500">
          <tr>
            {columns.map((col) => <th key={col} className="py-2 pr-4">{col}</th>)}
            {(onDelete || renderActions) && <th className="py-2">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={String(row.id ?? i)} className="align-top">
              {columns.map((col) => (
                <td key={col} className="py-2 pr-4 max-w-[240px]">
                  <span className="break-words text-gray-700 text-xs">
                    {col.endsWith('_at') || col === 'createdAt' || col === 'updatedAt'
                      ? formatDate(String(row[col]))
                      : short(row[col])}
                  </span>
                </td>
              ))}
              {(onDelete || renderActions) && (
                <td className="py-2">
                  <div className="flex gap-1">
                    {renderActions?.(row)}
                    {onDelete && (
                      <Button size="sm" variant="destructive" onClick={() => onDelete(row)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersPanel() {
  const { data, search, setSearch, loading, handleDelete, handleAction } = useAdminData('users');
  const columns = ['id', 'email', 'name', 'isAdmin', 'creditBalance', 'role', 'subscriptionStatus', 'createdAt', 'deletedAt'];

  const renderActions = (row: Record<string, unknown>) => (
    <>
      {row.deletedAt ? (
        <Button size="sm" variant="outline" onClick={() => handleAction('restore', { id: row.id })}>
          <RotateCcw className="h-3 w-3" /> Restore
        </Button>
      ) : (
        <Button size="sm" variant="destructive" onClick={() => handleDelete(row.id as number)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </>
  );

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-orange-600" />Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        {loading ? <div className="py-6 text-center text-gray-500">Loading...</div> : <DataTable rows={data.list} columns={columns} renderActions={renderActions} />}
        <div className="mt-2 text-xs text-gray-500">Total: {data.total}</div>
      </CardContent>
    </Card>
  );
}

function GenericPanel({ tableKey, icon: Icon, title }: { tableKey: TableKey; icon: React.ComponentType<{ className?: string }>; title: string }) {
  const { data, search, setSearch, loading, handleDelete } = useAdminData(tableKey);
  const columns = data.list[0] ? Object.keys(data.list[0]).filter(k => k !== 'metadataJson' && k !== 'requestJson' && k !== 'responseJson' && k !== 'passwordHash') : [];

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-orange-600" />{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        {loading ? <div className="py-6 text-center text-gray-500">Loading...</div> : <DataTable rows={data.list} columns={columns} onDelete={(row) => handleDelete(row.id as string)} />}
        <div className="mt-2 text-xs text-gray-500">Total: {data.total}</div>
      </CardContent>
    </Card>
  );
}

export function AdminShell() {
  const [activeTab, setActiveTab] = useState<TableKey>('users');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-12'} border-r border-gray-200 bg-gray-50 transition-all flex flex-col`}>
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
          {sidebarOpen && <span className="text-xs font-semibold uppercase text-gray-500">Admin</span>}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {TABLES.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${activeTab === t.key ? 'bg-white text-orange-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <t.icon className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span>{t.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'assets' && <GenericPanel tableKey="assets" icon={Image} title="Assets" />}
        {activeTab === 'generation-jobs' && <GenericPanel tableKey="generation-jobs" icon={Film} title="Generation Jobs" />}
        {activeTab === 'credit-ledger' && <GenericPanel tableKey="credit-ledger" icon={ReceiptText} title="Credit Ledger" />}
      </main>
    </div>
  );
}
