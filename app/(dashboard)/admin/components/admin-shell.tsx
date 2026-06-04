'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenText,
  Film,
  Gauge,
  Image,
  LayoutTemplate,
  Library,
  ReceiptText,
  Users,
} from 'lucide-react';
import { AdminDashboardPanel } from '@/components/admin/dashboard-panel';
import { AdminHelpPanel } from '@/components/admin/help-panel';
import { LibraryAssetsPanel } from '@/components/admin/library-assets-panel';
import { TemplatesPanel } from '@/components/admin/templates-panel';
import {
  ManagementPanel,
  type AdminTableConfig,
} from '@/components/admin/management-panel';
import {
  getAdminContent,
  type AdminContent,
} from '@/lib/admin/content';
import {
  useDashboardLocale,
  withDashboardLocale,
} from '@/lib/dashboard/use-dashboard-locale';
import { cn } from '@/lib/utils';

const TABLES = [
  {
    key: 'overview',
    icon: Gauge,
    adminOnly: false,
  },
  {
    key: 'templates',
    icon: LayoutTemplate,
    adminOnly: false,
  },
  {
    key: 'library-assets',
    icon: Library,
    adminOnly: false,
  },
  { key: 'users', icon: Users, adminOnly: true },
  { key: 'assets', icon: Image, adminOnly: false },
  {
    key: 'generation-jobs',
    icon: Film,
    adminOnly: false,
  },
  {
    key: 'credit-ledger',
    icon: ReceiptText,
    adminOnly: true,
  },
  {
    key: 'help',
    icon: BookOpenText,
    adminOnly: false,
  },
] as const;

type TableKey = (typeof TABLES)[number]['key'];
type VisibleTable = (typeof TABLES)[number];
type ManagementTableKey = Exclude<
  TableKey,
  'overview' | 'templates' | 'library-assets' | 'help'
>;

const MANAGEMENT_TABLE_KEYS = [
  'users',
  'assets',
  'generation-jobs',
  'credit-ledger',
] as const satisfies readonly ManagementTableKey[];

function normalizeAdminTab(
  value: string | null,
  visibleTables: readonly VisibleTable[]
): TableKey {
  if (value && visibleTables.some((table) => table.key === value)) {
    return value as TableKey;
  }

  return 'overview';
}

function rememberVisitedTab(tabs: TableKey[], tab: TableKey) {
  return tabs.includes(tab) ? tabs : [...tabs, tab];
}

function buildManagementConfigs(
  content: AdminContent
): Record<ManagementTableKey, AdminTableConfig> {
  const { management, statusLabels } = content;

  return {
    users: {
      key: 'users',
      title: management.users.title,
      description: management.users.description,
      searchPlaceholder: management.users.searchPlaceholder,
      idField: 'id',
      icon: Users,
      deleteEnabled: true,
      columns: [
        'email',
        'name',
        'accountStatus',
        'role',
        'creditBalance',
        'subscriptionStatus',
        'planName',
        'createdAt',
      ],
      columnLabels: { ...management.users.fields, ...management.users.columns },
      columnWidths: {
        email: 300,
        name: 180,
        accountStatus: 118,
        role: 112,
        creditBalance: 136,
        subscriptionStatus: 150,
        planName: 132,
        createdAt: 178,
      },
      detailColumns: [
        'email',
        'name',
        'accountStatus',
        'role',
        'creditBalance',
        'subscriptionStatus',
        'planName',
        'createdAt',
        'updatedAt',
      ],
      tableMinWidth: 1180,
      modalLayout: 'stacked',
      editableFields: [
        { key: 'email', label: management.users.fields.email },
        { key: 'name', label: management.users.fields.name },
        {
          key: 'role',
          label: management.users.fields.role,
          type: 'select',
          options: [
            { value: 'member', label: statusLabels.member },
            { value: 'ops', label: statusLabels.ops },
            { value: 'admin', label: statusLabels.admin },
          ],
        },
        {
          key: 'creditBalance',
          label: management.users.fields.creditBalance,
          type: 'number',
          readOnly: true,
        },
        {
          key: 'subscriptionStatus',
          label: management.users.fields.subscriptionStatus,
          readOnly: true,
        },
        {
          key: 'planName',
          label: management.users.fields.planName,
          readOnly: true,
        },
      ],
    },
    assets: {
      key: 'assets',
      title: management.assets.title,
      description: management.assets.description,
      searchPlaceholder: management.assets.searchPlaceholder,
      idField: 'id',
      icon: Image,
      deleteEnabled: true,
      columns: [
        'preview',
        'type',
        'status',
        'mimeType',
        'sizeBytes',
        'createdAt',
        'updatedAt',
      ],
      columnLabels: { ...management.assets.fields, ...management.assets.columns },
      columnWidths: {
        preview: 88,
        type: 140,
        status: 120,
        mimeType: 180,
        sizeBytes: 120,
        createdAt: 178,
        updatedAt: 178,
      },
      detailColumns: [
        'previewUrl',
        'type',
        'status',
        'mediaKind',
        'previewMimeType',
        'mimeType',
        'sizeBytes',
        'width',
        'height',
        'durationSeconds',
        'createdAt',
        'updatedAt',
      ],
      tableMinWidth: 1040,
      editableFields: [
        {
          key: 'status',
          label: management.assets.fields.status,
          type: 'select',
          options: [
            { value: 'pending', label: statusLabels.pending },
            { value: 'uploaded', label: statusLabels.uploaded },
            { value: 'failed', label: statusLabels.failed },
          ],
        },
        {
          key: 'publicUrl',
          label: management.assets.fields.publicUrl,
          type: 'textarea',
        },
        { key: 'mimeType', label: management.assets.fields.mimeType },
        { key: 'width', label: management.assets.fields.width, type: 'number' },
        { key: 'height', label: management.assets.fields.height, type: 'number' },
        {
          key: 'durationSeconds',
          label: management.assets.fields.durationSeconds,
          type: 'number',
        },
      ],
    },
    'generation-jobs': {
      key: 'generation-jobs',
      title: management['generation-jobs'].title,
      description: management['generation-jobs'].description,
      searchPlaceholder: management['generation-jobs'].searchPlaceholder,
      idField: 'id',
      icon: Film,
      deleteEnabled: true,
      columns: [
        'inputPreview',
        'finalPreview',
        'generationType',
        'status',
        'inputSummary',
        'templateSlug',
        'creditReserved',
        'createdAt',
        'updatedAt',
      ],
      optionalColumns: ['inputPreview', 'finalPreview'],
      columnLabels: {
        ...management['generation-jobs'].fields,
        ...management['generation-jobs'].columns,
      },
      columnWidths: {
        inputPreview: 88,
        finalPreview: 88,
        generationType: 150,
        status: 128,
        inputSummary: 260,
        templateSlug: 220,
        creditReserved: 136,
        createdAt: 178,
        updatedAt: 178,
      },
      detailColumns: [
        'inputPreviewUrl',
        'finalPreviewUrl',
        'generationType',
        'status',
        'inputSummary',
        'templateSlug',
        'durationSeconds',
        'creditReserved',
        'errorMessage',
        'createdAt',
        'updatedAt',
      ],
      tableMinWidth: 1380,
      editableFields: [
        {
          key: 'status',
          label: management['generation-jobs'].fields.status,
          type: 'select',
          options: [
            { value: 'queued', label: statusLabels.queued },
            { value: 'submitting', label: statusLabels.submitting },
            { value: 'running', label: statusLabels.running },
            { value: 'succeeded', label: statusLabels.succeeded },
            { value: 'failed', label: statusLabels.failed },
          ],
        },
        {
          key: 'errorMessage',
          label: management['generation-jobs'].fields.errorMessage,
          type: 'textarea',
        },
      ],
    },
    'credit-ledger': {
      key: 'credit-ledger',
      title: management['credit-ledger'].title,
      description: management['credit-ledger'].description,
      searchPlaceholder: management['credit-ledger'].searchPlaceholder,
      idField: 'id',
      icon: ReceiptText,
      deleteEnabled: false,
      columns: [
        'userEmail',
        'delta',
        'reason',
        'balanceAfter',
        'createdAt',
      ],
      columnLabels: {
        ...management['credit-ledger'].fields,
        ...management['credit-ledger'].columns,
      },
      columnWidths: {
        userEmail: 260,
        delta: 92,
        reason: 220,
        balanceAfter: 140,
        createdAt: 178,
      },
      detailColumns: [
        'userEmail',
        'userName',
        'delta',
        'reason',
        'balanceAfter',
        'userId',
        'jobId',
        'generationType',
        'jobStatus',
        'jobTemplateSlug',
        'jobInputSummary',
        'stripeEventId',
        'metadataJson',
        'createdAt',
      ],
      filterFields: [
        {
          key: 'userId',
          label: management['credit-ledger'].filters?.userId ?? 'User ID',
        },
        {
          key: 'jobId',
          label: management['credit-ledger'].filters?.jobId ?? 'Job ID',
        },
        {
          key: 'createdAt',
          label: management['credit-ledger'].filters?.createdAt ?? 'Created',
          type: 'date',
        },
      ],
      tableMinWidth: 1020,
      editEnabled: false,
      editableFields: [
        {
          key: 'delta',
          label: management['credit-ledger'].fields.delta,
          type: 'number',
          readOnly: true,
        },
        {
          key: 'reason',
          label: management['credit-ledger'].fields.reason,
          readOnly: true,
        },
        {
          key: 'balanceAfter',
          label: management['credit-ledger'].fields.balanceAfter,
          type: 'number',
          readOnly: true,
        },
        {
          key: 'metadataJson',
          label: management['credit-ledger'].fields.metadataJson,
          type: 'json',
        },
      ],
    },
  };
}

export function AdminShell({ canManageUsers }: { canManageUsers: boolean }) {
  const locale = useDashboardLocale();
  const content = getAdminContent(locale);
  const managementConfigs = useMemo(
    () => buildManagementConfigs(content),
    [content]
  );
  const visibleTables = useMemo(
    () => TABLES.filter((table) => canManageUsers || !table.adminOnly),
    [canManageUsers]
  );
  const searchParams = useSearchParams();
  const activeTabFromUrl = normalizeAdminTab(
    searchParams.get('tab'),
    visibleTables
  );
  const [activeTab, setActiveTab] = useState<TableKey>(activeTabFromUrl);
  const [visitedTabs, setVisitedTabs] = useState<TableKey[]>([
    activeTabFromUrl,
  ]);

  useEffect(() => {
    setActiveTab(activeTabFromUrl);
    setVisitedTabs((current) => rememberVisitedTab(current, activeTabFromUrl));
  }, [activeTabFromUrl]);

  useEffect(() => {
    function handlePopState() {
      const nextTab = normalizeAdminTab(
        new URLSearchParams(window.location.search).get('tab'),
        visibleTables
      );
      setActiveTab(nextTab);
      setVisitedTabs((current) => rememberVisitedTab(current, nextTab));
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [visibleTables]);

  function selectTab(tab: TableKey) {
    setActiveTab(tab);
    setVisitedTabs((current) => rememberVisitedTab(current, tab));
    window.history.pushState(
      null,
      '',
      withDashboardLocale(
        tab === 'overview' ? '/admin' : `/admin?tab=${tab}`,
        locale
      )
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <span className="text-sm font-semibold uppercase text-gray-500">
            {content.shell.title}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-1.5">
          {visibleTables.map((table) => (
            <button
              key={table.key}
              type="button"
              onClick={() => selectTab(table.key)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                activeTab === table.key
                  ? 'bg-orange-50 font-medium text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
              )}
              aria-current={activeTab === table.key ? 'page' : undefined}
              title={content.tabs[table.key]}
            >
              <table.icon className="size-5 flex-shrink-0" />
              <span>{content.tabs[table.key]}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-4">
        {visitedTabs.includes('overview') ? (
          <div hidden={activeTab !== 'overview'}>
            <AdminDashboardPanel content={content} />
          </div>
        ) : null}
        {visitedTabs.includes('templates') ? (
          <div hidden={activeTab !== 'templates'}>
            <TemplatesPanel
              canPublish={canManageUsers}
              content={content}
              locale={locale}
            />
          </div>
        ) : null}
        {visitedTabs.includes('library-assets') ? (
          <div hidden={activeTab !== 'library-assets'}>
            <LibraryAssetsPanel canPublish={canManageUsers} content={content} />
          </div>
        ) : null}
        {visitedTabs.includes('help') ? (
          <div hidden={activeTab !== 'help'}>
            <AdminHelpPanel content={content} />
          </div>
        ) : null}
        {MANAGEMENT_TABLE_KEYS.map((tableKey) =>
          visitedTabs.includes(tableKey) ? (
            <div key={tableKey} hidden={activeTab !== tableKey}>
              <ManagementPanel
                config={managementConfigs[tableKey]}
                canEdit={canManageUsers}
                canDelete={canManageUsers}
                labels={content.common}
                statusLabels={content.statusLabels}
              />
            </div>
          ) : null
        )}
      </main>
    </div>
  );
}
