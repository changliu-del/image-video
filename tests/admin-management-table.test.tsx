import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
  }: {
    children?: ReactNode;
    className?: string;
  }) => (
    <span className={className} data-slot="badge">
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children?: ReactNode }) => <button>{children}</button>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children }: { children?: ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: () => <input />,
}));

import {
  AdminManagementTable,
} from '../components/admin/admin-management-table';

type TableRow = Record<string, unknown> & {
  id: string;
  legacy: string;
  status: string;
  title: string;
};

function renderTable(html: ReactElement) {
  return renderToStaticMarkup(html);
}

describe('AdminManagementTable headless slots', () => {
  it('renders header and cell slots while preserving renderValue and legacy render fallback', () => {
    function StatusCell(context: { renderValue: () => ReactNode }) {
      return (
        <span data-slot="status-cell">
          {context.renderValue()}
        </span>
      );
    }

    const html = renderTable(
      <AdminManagementTable<TableRow>
        title="Templates"
        loading={false}
        rowKey="id"
        rows={[
          {
            id: 'tpl-1',
            legacy: 'legacy cell',
            status: 'published',
            title: 'alpha',
          },
        ]}
        columns={[
          {
            key: 'title',
            header: ({ columnIndex }) => <span>Custom title {columnIndex}</span>,
            cell: ({ value }) => <strong>{String(value).toUpperCase()}</strong>,
          },
          {
            key: 'status',
            kind: 'status',
            cell: StatusCell,
          },
          {
            key: 'legacy',
            render: (row) => <em>{row.legacy}</em>,
          },
        ]}
      />
    );

    expect(html).toContain('Custom title 0');
    expect(html).toContain('<strong>ALPHA</strong>');
    expect(html).toContain('data-slot="status-cell"');
    expect(html).toContain('data-slot="badge"');
    expect(html).toContain('<em>legacy cell</em>');
  });

  it('keeps loading and empty table states intact', () => {
    const loadingHtml = renderTable(
      <AdminManagementTable<TableRow>
        title="Templates"
        loading
        rowKey="id"
        rows={[]}
        columns={[{ key: 'title', label: 'Title' }]}
      />
    );

    const emptyHtml = renderTable(
      <AdminManagementTable<TableRow>
        title="Templates"
        emptyText="No templates found."
        loading={false}
        rowKey="id"
        rows={[]}
        columns={[{ key: 'title', label: 'Title' }]}
      />
    );

    expect(loadingHtml).toContain('Loading...');
    expect(emptyHtml).toContain('No templates found.');
  });
});
