import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('dashboard user history surface', () => {
  it('adds User history under Personal before Personal center', () => {
    const appShell = readSource('app/(dashboard)/app-shell.tsx');
    const content = readSource('lib/dashboard/content.ts');
    const historyIndex = appShell.indexOf("href: '/dashboard/history'");
    const profileIndex = appShell.indexOf("href: '/dashboard/profile'");

    expect(historyIndex).toBeGreaterThanOrEqual(0);
    expect(profileIndex).toBeGreaterThanOrEqual(0);
    expect(historyIndex).toBeLessThan(profileIndex);
    expect(appShell).toContain('label: content.nav.userHistory');
    expect(content).toContain('userHistory: string');
    expect(content).toContain("userHistory: 'User history'");
  });

  it('keeps the user history page private and generated-result scoped', () => {
    const layout = readSource('app/(dashboard)/dashboard/history/layout.tsx');
    const page = readSource('app/(dashboard)/dashboard/history/page.tsx');
    const client = readSource('components/dashboard/user-history-client.tsx');

    expect(layout).toContain('requireDashboardAuth');
    expect(page).toContain('UserHistoryClient');
    expect(client).toContain("params.set('sourceGroup', 'generated')");
    expect(client).toContain("params.set('source', 'generated_image')");
    expect(client).toContain("params.set('source', 'generated_video')");
    expect(client).not.toContain("params.set('source', 'user_upload')");
  });
});
