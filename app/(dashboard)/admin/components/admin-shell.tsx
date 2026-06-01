'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Film,
  Image,
  LayoutTemplate,
  ReceiptText,
  Users,
} from 'lucide-react';
import { TemplatesPanel } from '@/components/admin/templates-panel';
import {
  ManagementPanel,
  type AdminTableConfig,
} from '@/components/admin/management-panel';
import { cn } from '@/lib/utils';

const TABLES = [
  {
    key: 'templates',
    label: 'Templates',
    icon: LayoutTemplate,
    adminOnly: false,
  },
  { key: 'users', label: 'Users', icon: Users, adminOnly: true },
  { key: 'assets', label: 'Assets', icon: Image, adminOnly: false },
  {
    key: 'generation-jobs',
    label: 'Generation Jobs',
    icon: Film,
    adminOnly: false,
  },
  {
    key: 'credit-ledger',
    label: 'Credit Ledger',
    icon: ReceiptText,
    adminOnly: true,
  },
] as const;

type TableKey = (typeof TABLES)[number]['key'];

const MANAGEMENT_CONFIGS: Record<
  Exclude<TableKey, 'templates'>,
  AdminTableConfig
> = {
  users: {
    key: 'users',
    title: 'Users',
    description: 'Account state, credits, subscription, and role controls.',
    searchPlaceholder: 'Search email or name...',
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
    columnLabels: {
      isAdmin: 'Admin Flag',
      creditBalance: 'Credit Balance',
      subscriptionStatus: 'Subscription',
      createdAt: 'Created At',
      deletedAt: 'Deleted At',
    },
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
      { key: 'email', label: 'Email' },
      { key: 'name', label: 'Name' },
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        options: ['member', 'ops', 'admin'],
      },
      {
        key: 'creditBalance',
        label: 'Credit balance',
        type: 'number',
        readOnly: true,
      },
      {
        key: 'subscriptionStatus',
        label: 'Subscription status',
        readOnly: true,
      },
    ],
  },
  assets: {
    key: 'assets',
    title: 'Assets',
    description: 'Uploaded media, template assets, generated files, and metadata.',
    searchPlaceholder: 'Search id, storage key, type, status...',
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
    columnLabels: {
      userId: 'User ID',
      storageKey: 'Storage Key',
      mimeType: 'MIME Type',
      sizeBytes: 'Size Bytes',
      createdAt: 'Created At',
    },
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
        label: 'Status',
        type: 'select',
        options: ['pending', 'uploaded', 'failed'],
      },
      { key: 'publicUrl', label: 'Public URL', type: 'textarea' },
      { key: 'mimeType', label: 'MIME type' },
      { key: 'width', label: 'Width', type: 'number' },
      { key: 'height', label: 'Height', type: 'number' },
      { key: 'durationSeconds', label: 'Duration seconds', type: 'number' },
    ],
  },
  'generation-jobs': {
    key: 'generation-jobs',
    title: 'Generation Jobs',
    description: 'Generation status, prompt inputs, credits, and recovery fields.',
    searchPlaceholder: 'Search job id, product, status, template...',
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
      userId: 'User ID',
      productName: 'Product Name',
      templateSlug: 'Template',
      durationSeconds: 'Duration',
      creditReserved: 'Reserved Credits',
      createdAt: 'Created At',
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
        label: 'Status',
        type: 'select',
        options: ['queued', 'running', 'rendering', 'succeeded', 'failed'],
      },
      { key: 'productName', label: 'Product name' },
      { key: 'headline', label: 'Headline' },
      { key: 'sellingPoint', label: 'Selling point', type: 'textarea' },
      { key: 'priceText', label: 'Price text' },
      { key: 'ctaText', label: 'CTA text' },
      { key: 'errorMessage', label: 'Error message', type: 'textarea' },
    ],
  },
  'credit-ledger': {
    key: 'credit-ledger',
    title: 'Credit Ledger',
    description: 'Credit movements and admin metadata notes.',
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
      userId: 'User ID',
      jobId: 'Job ID',
      balanceAfter: 'Balance After',
      stripeEventId: 'Stripe Event ID',
      createdAt: 'Created At',
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
        label: 'User ID',
      },
      {
        key: 'jobId',
        label: 'Job ID',
      },
      {
        key: 'createdAt',
        label: 'Created',
        type: 'date',
      },
    ],
    tableMinWidth: 1460,
    editEnabled: false,
    editableFields: [
      { key: 'delta', label: 'Delta', type: 'number', readOnly: true },
      { key: 'reason', label: 'Reason', readOnly: true },
      {
        key: 'balanceAfter',
        label: 'Balance after',
        type: 'number',
        readOnly: true,
      },
      { key: 'metadataJson', label: 'Metadata JSON', type: 'json' },
    ],
  },
};

export function AdminShell({ canManageUsers }: { canManageUsers: boolean }) {
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
            Admin
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {visibleTables.map((table) => (
            <Link
              key={table.key}
              href={
                table.key === 'templates' ? '/admin' : `/admin?tab=${table.key}`
              }
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-base transition-colors',
                activeTab === table.key
                  ? 'bg-orange-50 font-medium text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
              )}
              aria-current={activeTab === table.key ? 'page' : undefined}
              title={table.label}
            >
              <table.icon className="size-5 flex-shrink-0" />
              <span>{table.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
        {activeTab === 'templates' ? (
          <TemplatesPanel canPublish={canManageUsers} />
        ) : null}
        {activeTab !== 'templates' && activeTab in MANAGEMENT_CONFIGS ? (
          <ManagementPanel
            config={MANAGEMENT_CONFIGS[activeTab as Exclude<TableKey, 'templates'>]}
            canEdit={canManageUsers}
            canDelete={canManageUsers}
          />
        ) : null}
      </main>
    </div>
  );
}
