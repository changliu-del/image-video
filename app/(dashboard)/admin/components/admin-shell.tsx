'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenText,
  ChevronDown,
  Film,
  Gauge,
  Home,
  Image,
  LayoutTemplate,
  Library,
  Loader2,
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
  type AdminTabKey,
} from '@/lib/admin/content';
import { getDashboardContent } from '@/lib/dashboard/content';
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
type AdminShellUser = {
  id: number;
  isAdmin?: boolean;
  role?: string | null;
};

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

function normalizeHelpTab(
  value: string | null,
  helpItems: readonly { key: AdminTabKey }[]
): AdminTabKey {
  if (value && helpItems.some((item) => item.key === value)) {
    return value as AdminTabKey;
  }

  return helpItems[0]?.key ?? 'overview';
}

function rememberVisitedTab(tabs: TableKey[], tab: TableKey) {
  return tabs.includes(tab) ? tabs : [...tabs, tab];
}

function canManageAdminUsers(user: AdminShellUser | null) {
  return Boolean(user?.isAdmin || user?.role === 'admin');
}

function canAccessAdminShell(user: AdminShellUser | null) {
  return canManageAdminUsers(user) || user?.role === 'ops';
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
        'templateId',
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
        templateId: 220,
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
        'templateId',
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
        'jobTemplateId',
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

function AdminNavButton({
  active,
  label,
  onClick,
  table,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  table: VisibleTable;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
        active
          ? 'bg-orange-50 font-medium text-orange-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
      )}
      aria-current={active ? 'page' : undefined}
      title={label}
    >
      <table.icon className="size-5 flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function AdminHelpDropdown({
  activeKey,
  content,
  helpItems,
  onSelect,
  onShowCurrent,
  open,
}: {
  activeKey: AdminTabKey;
  content: AdminContent;
  helpItems: readonly { key: AdminTabKey }[];
  onSelect: (key: AdminTabKey) => void;
  onShowCurrent: () => void;
  open: boolean;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onShowCurrent}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
          open
            ? 'bg-orange-50 font-medium text-orange-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
        )}
        aria-current={open ? 'page' : undefined}
        aria-expanded={open}
        title={content.tabs.help}
      >
        <BookOpenText className="size-5 flex-shrink-0" />
        <span className="min-w-0 flex-1 truncate">{content.tabs.help}</span>
        <ChevronDown
          className={cn(
            'size-4 flex-shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open ? (
        <div className="border-y border-gray-100 bg-gray-50 py-1">
          {helpItems.map((item) => {
            const table = TABLES.find(
              (candidate) => candidate.key === item.key
            );
            const Icon = table?.icon ?? BookOpenText;
            const active = activeKey === item.key;
            const label = content.help.topicOptionLabel(content.tabs[item.key]);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                className={cn(
                  'flex w-full items-center gap-2 px-5 py-2 text-left text-xs transition-colors',
                  active
                    ? 'bg-white font-medium text-orange-700'
                    : 'text-gray-600 hover:bg-white hover:text-gray-950'
                )}
                aria-current={active ? 'page' : undefined}
                title={label}
              >
                <Icon className="size-4 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AdminShell() {
  const locale = useDashboardLocale();
  const content = getAdminContent(locale);
  const dashboardContent = getDashboardContent(locale);
  const [user, setUser] = useState<AdminShellUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const canManageUsers = canManageAdminUsers(user);
  const managementConfigs = useMemo(
    () => buildManagementConfigs(content),
    [content]
  );
  const visibleTables = useMemo(
    () => TABLES.filter((table) => canManageUsers || !table.adminOnly),
    [canManageUsers]
  );
  const helpItems = useMemo(
    () =>
      content.help.items.filter(
        (item) =>
          item.key !== 'help' &&
          visibleTables.some((table) => table.key === item.key)
      ),
    [content.help.items, visibleTables]
  );
  const searchParams = useSearchParams();
  const activeTabFromUrl = normalizeAdminTab(
    searchParams.get('tab'),
    visibleTables
  );
  const activeHelpKeyFromUrl = normalizeHelpTab(
    searchParams.get('help'),
    helpItems
  );
  const [activeTab, setActiveTab] = useState<TableKey>(activeTabFromUrl);
  const [activeHelpKey, setActiveHelpKey] =
    useState<AdminTabKey>(activeHelpKeyFromUrl);
  const [visitedTabs, setVisitedTabs] = useState<TableKey[]>([
    activeTabFromUrl,
  ]);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      setIsUserLoading(true);
      setUserError(null);
      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error(content.common.loadFailed);
        }
        const nextUser = (await response.json()) as AdminShellUser | null;
        if (!ignore) {
          setUser(nextUser?.id ? nextUser : null);
        }
      } catch (error) {
        if (!ignore) {
          setUser(null);
          setUserError(
            error instanceof Error ? error.message : content.common.loadFailed
          );
        }
      } finally {
        if (!ignore) {
          setIsUserLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, [content.common.loadFailed]);

  useEffect(() => {
    setActiveTab(activeTabFromUrl);
    setVisitedTabs((current) => rememberVisitedTab(current, activeTabFromUrl));
    if (activeTabFromUrl === 'help') {
      setActiveHelpKey(activeHelpKeyFromUrl);
    }
  }, [activeHelpKeyFromUrl, activeTabFromUrl]);

  useEffect(() => {
    function handlePopState() {
      const nextTab = normalizeAdminTab(
        new URLSearchParams(window.location.search).get('tab'),
        visibleTables
      );
      const nextHelpKey = normalizeHelpTab(
        new URLSearchParams(window.location.search).get('help'),
        helpItems
      );
      setActiveTab(nextTab);
      setActiveHelpKey(nextHelpKey);
      setVisitedTabs((current) => rememberVisitedTab(current, nextTab));
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [helpItems, visibleTables]);

  function selectTab(tab: TableKey) {
    setActiveTab(tab);
    setVisitedTabs((current) => rememberVisitedTab(current, tab));
    const adminHref =
      tab === 'overview'
        ? '/admin'
        : tab === 'help'
          ? `/admin?tab=help&help=${activeHelpKey}`
          : `/admin?tab=${tab}`;

    window.history.pushState(
      null,
      '',
      withDashboardLocale(adminHref, locale)
    );
  }

  function selectHelpTab(tab: AdminTabKey) {
    setActiveTab('help');
    setActiveHelpKey(tab);
    setVisitedTabs((current) => rememberVisitedTab(current, 'help'));
    window.history.pushState(
      null,
      '',
      withDashboardLocale(`/admin?tab=help&help=${tab}`, locale)
    );
  }

  if (isUserLoading) {
    return (
      <main className="flex h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4">
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 shadow-sm">
          <Loader2 className="size-4 animate-spin text-orange-600" />
          {content.shell.title}
        </div>
      </main>
    );
  }

  if (!canAccessAdminShell(user)) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-950">
          {content.shell.forbiddenTitle}
        </h1>
        <p className="mt-2 text-gray-600">
          {userError ?? content.shell.forbiddenDescription}
        </p>
      </main>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-3 py-3">
          <Link
            href={withDashboardLocale('/dashboard', locale)}
            className="mb-3 flex h-9 w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
          >
            <Home className="size-4 flex-shrink-0" />
            <span className="truncate">{dashboardContent.nav.tools}</span>
          </Link>
          <span className="text-sm font-semibold uppercase text-gray-500">
            {content.shell.title}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-1.5">
          {visibleTables.map((table) =>
            table.key === 'help' ? (
              <AdminHelpDropdown
                key={table.key}
                activeKey={activeHelpKey}
                content={content}
                helpItems={helpItems}
                onSelect={selectHelpTab}
                onShowCurrent={() => selectTab('help')}
                open={activeTab === 'help'}
              />
            ) : (
              <AdminNavButton
                key={table.key}
                onClick={() => selectTab(table.key)}
                active={activeTab === table.key}
                label={content.tabs[table.key]}
                table={table}
              />
            )
          )}
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
            <LibraryAssetsPanel canDelete={canManageUsers} content={content} />
          </div>
        ) : null}
        {visitedTabs.includes('help') ? (
          <div hidden={activeTab !== 'help'}>
            <AdminHelpPanel content={content} selectedKey={activeHelpKey} />
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
