import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  productAnalyticsActiveBatches,
  productAnalyticsBatches,
  productAnalyticsItems,
  users,
} from '@/lib/db/schema';
import { requireAdmin, requireOpsOrAdmin } from '@/lib/db/queries';
import {
  isProductAnalyticsRank,
  productAnalyticsRankConfig,
  productAnalyticsRankTypes,
} from '@/lib/product-analytics/catalog';
import { parseProductAnalyticsWorkbook } from '@/lib/product-analytics/xlsx';

function assertProductAnalyticsRank(value: string | null | undefined) {
  if (!isProductAnalyticsRank(value)) {
    throw new Error('Invalid product analytics rank type');
  }
  return value;
}

export async function importProductAnalyticsWorkbook({
  buffer,
  fileName,
  rankType,
}: {
  buffer: Buffer;
  fileName: string;
  rankType: string;
}) {
  const normalizedRankType = assertProductAnalyticsRank(rankType);
  const user = await requireAdmin();
  const parsed = parseProductAnalyticsWorkbook(buffer, normalizedRankType);
  const now = new Date();

  return db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(productAnalyticsBatches)
      .values({
        rankType: normalizedRankType,
        sourceFileName: fileName,
        rowCount: parsed.items.length,
        importedByUserId: user.id,
        metadataJson: {
          headers: parsed.headers,
          sheetName: parsed.sheetName,
        },
        createdAt: now,
      })
      .returning();

    for (let index = 0; index < parsed.items.length; index += 500) {
      const chunk = parsed.items.slice(index, index + 500).map((item) => ({
        ...item,
        batchId: batch.id,
      }));
      await tx.insert(productAnalyticsItems).values(chunk);
    }

    await tx
      .insert(productAnalyticsActiveBatches)
      .values({
        rankType: normalizedRankType,
        batchId: batch.id,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: productAnalyticsActiveBatches.rankType,
        set: {
          batchId: batch.id,
          updatedAt: now,
        },
      });

    await tx
      .delete(productAnalyticsBatches)
      .where(
        and(
          eq(productAnalyticsBatches.rankType, normalizedRankType),
          ne(productAnalyticsBatches.id, batch.id)
        )
      );

    return {
      rankType: normalizedRankType,
      label: productAnalyticsRankConfig[normalizedRankType].title.en,
      batchId: batch.id,
      rowCount: parsed.items.length,
      sourceFileName: fileName,
      importedAt: now.toISOString(),
    };
  });
}

export async function listProductAnalyticsImportSummaries() {
  await requireOpsOrAdmin();

  const rows = await db
    .select({
      rankType: productAnalyticsActiveBatches.rankType,
      batchId: productAnalyticsBatches.id,
      sourceFileName: productAnalyticsBatches.sourceFileName,
      rowCount: productAnalyticsBatches.rowCount,
      importedAt: productAnalyticsBatches.createdAt,
      importedByEmail: users.email,
    })
    .from(productAnalyticsActiveBatches)
    .innerJoin(
      productAnalyticsBatches,
      eq(productAnalyticsActiveBatches.batchId, productAnalyticsBatches.id)
    )
    .leftJoin(users, eq(productAnalyticsBatches.importedByUserId, users.id));

  const byRank = new Map(rows.map((row) => [row.rankType, row]));

  return {
    ranks: productAnalyticsRankTypes.map((rankType) => {
      const row = byRank.get(rankType);
      return {
        rankType,
        label: productAnalyticsRankConfig[rankType].title.en,
        rowCount: row?.rowCount ?? 0,
        sourceFileName: row?.sourceFileName ?? null,
        importedAt: row?.importedAt.toISOString() ?? null,
        importedByEmail: row?.importedByEmail ?? null,
        batchId: row?.batchId ?? null,
      };
    }),
  };
}
