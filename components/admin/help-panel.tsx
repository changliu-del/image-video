'use client';

import { Fragment, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { AdminContent, AdminTabKey } from '@/lib/admin/content';

function splitTableRow(row: string) {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(row: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(row);
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    const [token] = match;
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const key = `${keyPrefix}-${match.index}`;

    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-gray-950">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        nodes.push(
          <a
            key={key}
            href={linkMatch[2]}
            className="font-medium text-orange-700 underline-offset-4 hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderMarkdown(markdown: string) {
  const lines = markdown.trim().split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const imageMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed);
    if (imageMatch) {
      blocks.push(
        <figure
          key={`image-${index}`}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <img
            src={imageMatch[2]}
            alt={imageMatch[1]}
            className="max-h-[320px] max-w-full object-contain"
          />
          {imageMatch[1] ? (
            <figcaption className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
              {imageMatch[1]}
            </figcaption>
          ) : null}
        </figure>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h3
          key={`h3-${index}`}
          className="pt-2 text-sm font-semibold text-gray-950"
        >
          {renderInline(trimmed.slice(4), `h3-${index}`)}
        </h3>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h2
          key={`h2-${index}`}
          className="pt-3 text-base font-semibold text-gray-950"
        >
          {renderInline(trimmed.slice(3), `h2-${index}`)}
        </h2>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push(
        <h1 key={`h1-${index}`} className="text-xl font-semibold text-gray-950">
          {renderInline(trimmed.slice(2), `h1-${index}`)}
        </h1>
      );
      index += 1;
      continue;
    }

    if (
      trimmed.includes('|') &&
      lines[index + 1] &&
      isTableSeparator(lines[index + 1])
    ) {
      const headers = splitTableRow(trimmed);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().includes('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      blocks.push(
        <div
          key={`table-${index}`}
          className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <table className="min-w-[760px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3">
                    {renderInline(header, `th-${header}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, rowIndex) => (
                <tr key={`${row.join('-')}-${rowIndex}`}>
                  {headers.map((header, cellIndex) => (
                    <td
                      key={`${header}-${cellIndex}`}
                      className="px-4 py-3 align-top leading-6 text-gray-700"
                    >
                      {renderInline(
                        row[cellIndex] ?? '',
                        `td-${rowIndex}-${cellIndex}`
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items: string[] = [];
      while (
        index < lines.length &&
        (/^[-*]\s+/.test(lines[index].trim()) ||
          /^\d+\.\s+/.test(lines[index].trim()))
      ) {
        items.push(lines[index].trim().replace(/^([-*]|\d+\.)\s+/, ''));
        index += 1;
      }

      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag
          key={`list-${index}`}
          className={
            ordered
              ? 'list-decimal space-y-2 pl-5 text-sm leading-6 text-gray-700'
              : 'list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700'
          }
        >
          {items.map((item) => (
            <li key={item}>{renderInline(item, `li-${item}`)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (
        !next ||
        next.startsWith('# ') ||
        next.startsWith('## ') ||
        next.startsWith('### ') ||
        next.startsWith('![') ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        /^\d+\)\s+/.test(next) ||
        (next.includes('|') && lines[index + 1] && isTableSeparator(lines[index + 1]))
      ) {
        break;
      }
      paragraphLines.push(next);
      index += 1;
    }

    blocks.push(
      <p key={`p-${index}`} className="text-sm leading-7 text-gray-700">
        {renderInline(paragraphLines.join(' '), `p-${index}`)}
      </p>
    );
  }

  return blocks.map((block, blockIndex) => (
    <Fragment key={blockIndex}>{block}</Fragment>
  ));
}

function buildFallbackMarkdown(
  item: AdminContent['help']['items'][number],
  labels: AdminContent['help']['labels']
) {
  const sections = [`# ${item.title}`];

  if (item.purpose) {
    sections.push(`## ${labels.purpose}`, item.purpose);
  }
  if (item.dailyActions?.length) {
    sections.push(
      `## ${labels.dailyActions}`,
      item.dailyActions.map((entry) => `- ${entry}`).join('\n')
    );
  }
  if (item.keyFields?.length) {
    sections.push(
      `## ${labels.keyFields}`,
      item.keyFields.map((entry) => `- ${entry}`).join('\n')
    );
  }
  if (item.riskSignals?.length) {
    sections.push(
      `## ${labels.riskSignals}`,
      item.riskSignals.map((entry) => `- ${entry}`).join('\n')
    );
  }

  return sections.join('\n\n');
}

export function AdminHelpPanel({
  content,
  selectedKey = 'overview',
}: {
  content: AdminContent;
  selectedKey?: AdminTabKey;
}) {
  const copy = content.help;
  const selectedItem = useMemo(
    () => copy.items.find((item) => item.key === selectedKey) ?? copy.items[0],
    [copy.items, selectedKey]
  );
  const markdown = useMemo(
    () =>
      selectedItem
        ? selectedItem.markdown ??
          buildFallbackMarkdown(selectedItem, copy.labels)
        : '',
    [copy.labels, selectedItem]
  );

  if (!selectedItem) {
    return null;
  }

  return (
    <div className="w-full">
      <article className="space-y-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        {renderMarkdown(markdown)}
      </article>
    </div>
  );
}
