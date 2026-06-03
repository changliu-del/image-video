'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Film,
  Image,
  LayoutTemplate,
  Library,
  ReceiptText,
  Users,
} from 'lucide-react';
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
] as const;

type TableKey = (typeof TABLES)[number]['key'];

function buildManagementConfigs(content: AdminContent): Record<
  Exclude<TableKey, 'templates' | 'library-assets'>,
  AdminTableConfig
> {
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
        'id',
        'email',
        'name',
        'role',
        'isAdmin',
        'creditBalance',
        'subscriptionStatus',
        'createdAt',
        'deletedAt',
      ],
      columnLabels: { ...management.users.fields, ...management.users.columns },
      columnWidths: {
        id: 88,
        email: 260,
        name: 180,
        role: 112,
        isAdmin: 112,
        creditBalance: 136,
        subscriptionStatus: 150,
        createdAt: 178,
        deletedAt: 178,
      },
      tableMinWidth: 1300,
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
        'id',
        'userId',
        'type',
        'status',
        'storageKey',
        'mimeType',
        'sizeBytes',
        'createdAt',
      ],
      columnLabels: { ...management.assets.fields, ...management.assets.columns },
      columnWidths: {
        id: 240,
        userId: 96,
        type: 140,
        status: 120,
        storageKey: 300,
        mimeType: 150,
        sizeBytes: 120,
        createdAt: 178,
      },
      tableMinWidth: 1360,
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
        'id',
        'userId',
        'status',
        'productName',
        'templateSlug',
        'durationSeconds',
        'creditReserved',
        'createdAt',
      ],
      columnLabels: {
        ...management['generation-jobs'].fields,
        ...management['generation-jobs'].columns,
      },
      columnWidths: {
        id: 240,
        userId: 96,
        status: 128,
        productName: 220,
        templateSlug: 220,
        durationSeconds: 112,
        creditReserved: 136,
        createdAt: 178,
      },
      tableMinWidth: 1360,
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
          key: 'productName',
          label: management['generation-jobs'].fields.productName,
        },
        { key: 'headline', label: management['generation-jobs'].fields.headline },
        {
          key: 'sellingPoint',
          label: management['generation-jobs'].fields.sellingPoint,
          type: 'textarea',
        },
        { key: 'priceText', label: management['generation-jobs'].fields.priceText },
        { key: 'ctaText', label: management['generation-jobs'].fields.ctaText },
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
      idField: 'id',
      icon: ReceiptText,
      deleteEnabled: false,
      columns: [
        'id',
        'userId',
        'jobId',
        'delta',
        'reason',
        'balanceAfter',
        'stripeEventId',
        'createdAt',
      ],
      columnLabels: {
        ...management['credit-ledger'].fields,
        ...management['credit-ledger'].columns,
      },
      columnWidths: {
        id: 240,
        userId: 96,
        jobId: 240,
        delta: 92,
        reason: 220,
        balanceAfter: 140,
        stripeEventId: 240,
        createdAt: 178,
      },
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
      tableMinWidth: 1460,
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
  const managementConfigs = buildManagementConfigs(content);
  const visibleTables = TABLES.filter(
    (table) => canManageUsers || !table.adminOnly
  );
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab') as TableKey | null;
  const activeTab: TableKey = requestedTab && visibleTables.some(
    (table) => table.key === requestedTab
  )
    ? requestedTab
    : 'templates';

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-4">
          <span className="text-sm font-semibold uppercase text-gray-500">
            {content.shell.title}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {visibleTables.map((table) => (
            <Link
              key={table.key}
              href={withDashboardLocale(
                table.key === 'templates'
                  ? '/admin'
                  : `/admin?tab=${table.key}`,
                locale
              )}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-base transition-colors',
                activeTab === table.key
                  ? 'bg-orange-50 font-medium text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
              )}
              aria-current={activeTab === table.key ? 'page' : undefined}
              title={content.tabs[table.key]}
            >
              <table.icon className="size-5 flex-shrink-0" />
              <span>{content.tabs[table.key]}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
        {activeTab === 'templates' ? (
          <TemplatesPanel
            canPublish={canManageUsers}
            content={content}
            locale={locale}
          />
        ) : null}
        {activeTab === 'library-assets' ? (
          <LibraryAssetsPanel canPublish={canManageUsers} content={content} />
        ) : null}
        {activeTab !== 'templates' &&
        activeTab !== 'library-assets' &&
        activeTab in managementConfigs ? (
          <ManagementPanel
            config={
              managementConfigs[
                activeTab as Exclude<TableKey, 'templates' | 'library-assets'>
              ]
            }
            canEdit={canManageUsers}
            canDelete={canManageUsers}
            labels={content.common}
            statusLabels={content.statusLabels}
          />
        ) : null}
      </main>
    </div>
  );
}
