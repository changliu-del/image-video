import { SQL, sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withPagination<T extends { limit: (n: number) => any; offset: (n: number) => any }>(
  qb: T,
  page: number,
  pageSize: number,
): T {
  return qb.limit(pageSize).offset((page - 1) * pageSize) as T;
}

export function ilikeCol(column: PgColumn, search: string): SQL {
  return sql`${column}::text ILIKE ${'%' + search.trim() + '%'}`;
}

export function exactCol(column: PgColumn, search: string): SQL {
  return sql`${column}::text = ${search.trim()}`;
}

export function ilikeJsonTextField(
  column: PgColumn,
  key: string,
  search: string
): SQL {
  return sql`${column}->>${key} ILIKE ${'%' + search.trim() + '%'}`;
}

export function exactJsonTextField(
  column: PgColumn,
  key: string,
  search: string
): SQL {
  return sql`${column}->>${key} = ${search.trim()}`;
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));
  const search = searchParams.get('search') || '';
  return { page, pageSize, search };
}
