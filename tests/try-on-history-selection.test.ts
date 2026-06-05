import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('try-on history material selection', () => {
  it('lets multi-garment mode submit selected history asset ids', () => {
    const source = readSource('components/create/try-on-workbench.tsx');

    expect(source).toContain('const [selectedGarmentAssets');
    expect(source).toContain(
      'garmentFiles.length + selectedGarmentAssetIds.length'
    );
    expect(source).toContain('function toggleLibraryGarment');
    expect(source).toContain('...selectedGarmentAssetIds');
    expect(source).toContain('...uploadedGarmentAssetIds');
    expect(source).toContain('garmentAssetIds,');
    expect(source).toContain('selectedGarmentAssetIds.includes(assetId)');
  });
});
