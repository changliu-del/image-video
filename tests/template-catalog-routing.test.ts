import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('template catalog routing contract', () => {
  it('uses backend category filtering separately from browse tags', () => {
    const source = readSource('components/marketing/templates-page.tsx');

    expect(source).toContain("params.set('category', activeCategory)");
    expect(source).toContain('params.append(\'tag\', tag)');
    expect(source).not.toContain('const initialTag');
    expect(source).not.toContain('setActiveTags(new Set([initialTag]))');
  });

  it('does not pass starter catalog ids as backend template ids', () => {
    const source = readSource('components/marketing/templates-page.tsx');

    expect(source).toContain("template.source === 'starter'");
    expect(source).toContain("params.set('prompt', template.prompt)");
    expect(source).toContain("params.set('templateId', template.id)");
  });

  it('passes real template ids through image-to-video generation requests', () => {
    const source = readSource('components/create/image-video-workbench.tsx');

    expect(source).toContain('selectedTemplateId');
    expect(source).toContain('templateId: selectedTemplateId');
    expect(source).toContain('setSelectedTemplate');
  });

  it('does not auto-bind the first template when a workbench has no requested template', () => {
    const apparel = readSource('components/create/apparel-workbench.tsx');
    const tryOn = readSource('components/create/try-on-workbench.tsx');

    expect(apparel).not.toContain(
      'current ?? requestedTemplate ?? nextTemplates[0] ?? null'
    );
    expect(tryOn).not.toContain(
      'current ?? requestedTemplate ?? nextTemplates[0] ?? nextAssets[0] ?? null'
    );
  });
});
