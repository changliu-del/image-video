import {
  check,
  index,
  jsonb,
  primaryKey,
  pgTable,
  serial,
  uniqueIndex,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const ASSET_TYPES = [
  'upload',
  'raw_video',
  'final_video',
  'thumbnail',
  'template_asset',
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_STATUSES = ['pending', 'uploaded', 'failed'] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const GENERATION_JOB_STATUSES = [
  'queued',
  'running',
  'rendering',
  'succeeded',
  'failed',
] as const;
export type GenerationJobStatus = (typeof GENERATION_JOB_STATUSES)[number];

export const VIDEO_ASPECT_RATIOS = ['9:16', '1:1', '16:9'] as const;
export type VideoAspectRatio = (typeof VIDEO_ASPECT_RATIOS)[number];

export const USER_ROLES = ['member', 'ops', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type TemplateSlug = string;

export const TEMPLATE_TYPES = [
  'image',
  'image_to_video',
  'video',
] as const;
export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export const TEMPLATE_STATUSES = ['draft', 'published', 'archived'] as const;
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export const TEMPLATE_TAG_GROUPS = [
  'goal',
  'type',
  'industry',
  'channel',
  'funnel',
  'cost',
  'aspect_ratio',
] as const;
export type TemplateTagGroup = (typeof TEMPLATE_TAG_GROUPS)[number];

export const TEMPLATE_ASSET_ROLES = [
  'thumbnail',
  'preview',
  'source',
  'example',
] as const;
export type TemplateAssetRole = (typeof TEMPLATE_ASSET_ROLES)[number];

export const CREDIT_LEDGER_REASONS = [
  'purchase',
  'reserve',
  'capture',
  'refund',
  'admin_adjust',
] as const;
export type CreditLedgerReason = (typeof CREDIT_LEDGER_REASONS)[number];

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: varchar('role', { length: 20 })
      .$type<UserRole>()
      .notNull()
      .default('member'),
    isAdmin: boolean('is_admin').notNull().default(false),
    creditBalance: integer('credit_balance').notNull().default(0),
    stripeCustomerId: text('stripe_customer_id').unique(),
    stripeSubscriptionId: text('stripe_subscription_id').unique(),
    stripeProductId: text('stripe_product_id'),
    planName: varchar('plan_name', { length: 50 }),
    subscriptionStatus: varchar('subscription_status', { length: 20 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    check('users_credit_balance_check', sql`${table.creditBalance} >= 0`),
    check(
      'users_role_check',
      sql`${table.role} in ('member', 'ops', 'admin')`
    ),
  ]
);

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    type: text('type').$type<AssetType>().notNull(),
    status: text('status')
      .$type<AssetStatus>()
      .notNull()
      .default('pending'),
    storageKey: text('storage_key').notNull(),
    publicUrl: text('public_url').notNull(),
    mimeType: text('mime_type'),
    sizeBytes: integer('size_bytes'),
    width: integer('width'),
    height: integer('height'),
    durationSeconds: integer('duration_seconds'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('assets_storage_key_unique').on(table.storageKey),
    index('assets_user_id_idx').on(table.userId),
    index('assets_user_type_status_idx').on(
      table.userId,
      table.type,
      table.status
    ),
    check(
      'assets_type_check',
      sql`${table.type} in ('upload', 'raw_video', 'final_video', 'thumbnail', 'template_asset')`
    ),
    check(
      'assets_status_check',
      sql`${table.status} in ('pending', 'uploaded', 'failed')`
    ),
    check(
      'assets_size_bytes_check',
      sql`${table.sizeBytes} is null or ${table.sizeBytes} >= 0`
    ),
    check(
      'assets_width_check',
      sql`${table.width} is null or ${table.width} > 0`
    ),
    check(
      'assets_height_check',
      sql`${table.height} is null or ${table.height} > 0`
    ),
    check(
      'assets_duration_seconds_check',
      sql`${table.durationSeconds} is null or ${table.durationSeconds} >= 0`
    ),
  ]
);

export const templates = pgTable(
  'templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 120 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('pt'),
    title: varchar('title', { length: 140 }).notNull(),
    description: text('description').notNull(),
    type: text('type')
      .$type<TemplateType>()
      .notNull()
      .default('image_to_video'),
    status: text('status')
      .$type<TemplateStatus>()
      .notNull()
      .default('draft'),
    hook: varchar('hook', { length: 220 }).notNull(),
    cta: varchar('cta', { length: 80 }),
    prompt: text('prompt').notNull(),
    negativePrompt: text('negative_prompt'),
    promptJson: jsonb('prompt_json')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    defaultInputsJson: jsonb('default_inputs_json')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    previewAssetId: uuid('preview_asset_id').references(() => assets.id),
    thumbnailAssetId: uuid('thumbnail_asset_id').references(() => assets.id),
    costCredits: integer('cost_credits').notNull().default(1),
    aspectRatiosJson: jsonb('aspect_ratios_json')
      .$type<VideoAspectRatio[]>()
      .notNull()
      .default(sql`'["9:16"]'::jsonb`),
    durationSeconds: integer('duration_seconds'),
    sortWeight: integer('sort_weight').notNull().default(0),
    usageCount: integer('usage_count').notNull().default(0),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id),
    publishedBy: integer('published_by').references(() => users.id),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('templates_locale_slug_unique').on(table.locale, table.slug),
    index('templates_locale_status_idx').on(table.locale, table.status),
    index('templates_type_status_idx').on(table.type, table.status),
    index('templates_sort_weight_idx').on(table.sortWeight),
    check(
      'templates_slug_check',
      sql`${table.slug} ~ '^[a-z0-9][a-z0-9_-]*$'`
    ),
    check(
      'templates_type_check',
      sql`${table.type} in ('image', 'image_to_video', 'video')`
    ),
    check(
      'templates_status_check',
      sql`${table.status} in ('draft', 'published', 'archived')`
    ),
    check('templates_cost_credits_check', sql`${table.costCredits} >= 0`),
    check('templates_usage_count_check', sql`${table.usageCount} >= 0`),
    check(
      'templates_duration_seconds_check',
      sql`${table.durationSeconds} is null or ${table.durationSeconds} in (5, 8, 10)`
    ),
  ]
);

export const templateTags = pgTable(
  'template_tags',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 80 }).notNull(),
    group: varchar('group', { length: 40 }).$type<TemplateTagGroup>().notNull(),
    labelPt: varchar('label_pt', { length: 80 }).notNull(),
    labelEn: varchar('label_en', { length: 80 }).notNull(),
    labelZh: varchar('label_zh', { length: 80 }).notNull(),
    sortWeight: integer('sort_weight').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('template_tags_slug_unique').on(table.slug),
    index('template_tags_group_idx').on(table.group),
    check(
      'template_tags_group_check',
      sql`${table.group} in ('goal', 'type', 'industry', 'channel', 'funnel', 'cost', 'aspect_ratio')`
    ),
  ]
);

export const templateTagRelations = pgTable(
  'template_tag_relations',
  {
    templateId: uuid('template_id')
      .notNull()
      .references(() => templates.id),
    tagId: integer('tag_id')
      .notNull()
      .references(() => templateTags.id),
  },
  (table) => [
    primaryKey({ columns: [table.templateId, table.tagId] }),
    index('template_tag_relations_tag_id_idx').on(table.tagId),
  ]
);

export const templateAssets = pgTable(
  'template_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => templates.id),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    role: varchar('role', { length: 24 }).$type<TemplateAssetRole>().notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('template_assets_template_asset_role_unique').on(
      table.templateId,
      table.assetId,
      table.role
    ),
    index('template_assets_template_id_idx').on(table.templateId),
    index('template_assets_asset_id_idx').on(table.assetId),
    check(
      'template_assets_role_check',
      sql`${table.role} in ('thumbnail', 'preview', 'source', 'example')`
    ),
  ]
);

export const templateAuditLogs = pgTable(
  'template_audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    templateId: uuid('template_id').references(() => templates.id),
    actorId: integer('actor_id').references(() => users.id),
    action: varchar('action', { length: 60 }).notNull(),
    beforeJson: jsonb('before_json')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    afterJson: jsonb('after_json')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('template_audit_logs_template_id_idx').on(table.templateId),
    index('template_audit_logs_actor_id_idx').on(table.actorId),
  ]
);

export const TEMPLATE_INGESTION_RUN_STATUSES = [
  'running',
  'succeeded',
  'failed',
] as const;
export type TemplateIngestionRunStatus =
  (typeof TEMPLATE_INGESTION_RUN_STATUSES)[number];

export const templateIngestionRuns = pgTable(
  'template_ingestion_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    source: varchar('source', { length: 80 }).notNull(),
    status: varchar('status', { length: 24 })
      .$type<TemplateIngestionRunStatus>()
      .notNull()
      .default('running'),
    dryRun: boolean('dry_run').notNull().default(false),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    finishedAt: timestamp('finished_at'),
    statsJson: jsonb('stats_json')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    errorMessage: text('error_message'),
    createdBy: integer('created_by').references(() => users.id),
  },
  (table) => [
    index('template_ingestion_runs_source_started_idx').on(
      table.source,
      table.startedAt
    ),
    check(
      'template_ingestion_runs_status_check',
      sql`${table.status} in ('running', 'succeeded', 'failed')`
    ),
  ]
);

export const templateSourceRecords = pgTable(
  'template_source_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    runId: uuid('run_id').references(() => templateIngestionRuns.id, {
      onDelete: 'set null',
    }),
    templateId: uuid('template_id').references(() => templates.id, {
      onDelete: 'set null',
    }),
    assetId: uuid('asset_id').references(() => assets.id, {
      onDelete: 'set null',
    }),
    source: varchar('source', { length: 80 }).notNull(),
    sourceUrl: text('source_url').notNull(),
    sourceAssetUrl: text('source_asset_url'),
    contentHash: varchar('content_hash', { length: 128 }).notNull(),
    prompt: text('prompt').notNull(),
    promptSource: varchar('prompt_source', { length: 40 }).notNull(),
    licenseNote: text('license_note'),
    metadataJson: jsonb('metadata_json')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('template_source_records_source_url_unique').on(
      table.source,
      table.sourceUrl
    ),
    uniqueIndex('template_source_records_content_hash_unique').on(
      table.contentHash
    ),
    index('template_source_records_template_id_idx').on(table.templateId),
    index('template_source_records_run_id_idx').on(table.runId),
  ]
);

export const generationJobs = pgTable(
  'generation_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    status: text('status')
      .$type<GenerationJobStatus>()
      .notNull()
      .default('queued'),
    inputAssetId: uuid('input_asset_id')
      .notNull()
      .references(() => assets.id),
    rawVideoAssetId: uuid('raw_video_asset_id').references(() => assets.id),
    finalVideoAssetId: uuid('final_video_asset_id').references(() => assets.id),
    thumbnailAssetId: uuid('thumbnail_asset_id').references(() => assets.id),
    provider: text('provider').notNull().default('fal'),
    providerJobId: text('provider_job_id'),
    prompt: text('prompt').notNull(),
    negativePrompt: text('negative_prompt'),
    productName: varchar('product_name', { length: 120 }).notNull(),
    headline: varchar('headline', { length: 100 }).notNull(),
    sellingPoint: text('selling_point').notNull(),
    priceText: varchar('price_text', { length: 64 }).notNull(),
    ctaText: varchar('cta_text', { length: 40 }).notNull(),
    aspectRatio: text('aspect_ratio').$type<VideoAspectRatio>().notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    templateSlug: varchar('template_slug', { length: 120 }).notNull(),
    templateId: uuid('template_id').references(() => templates.id),
    errorMessage: text('error_message'),
    creditReserved: integer('credit_reserved').notNull().default(0),
    creditSpent: integer('credit_spent').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('generation_jobs_user_id_idx').on(table.userId),
    index('generation_jobs_user_status_idx').on(table.userId, table.status),
    index('generation_jobs_input_asset_id_idx').on(table.inputAssetId),
    uniqueIndex('generation_jobs_provider_job_id_unique')
      .on(table.provider, table.providerJobId)
      .where(sql`${table.providerJobId} is not null`),
    check(
      'generation_jobs_status_check',
      sql`${table.status} in ('queued', 'running', 'rendering', 'succeeded', 'failed')`
    ),
    check(
      'generation_jobs_aspect_ratio_check',
      sql`${table.aspectRatio} in ('9:16', '1:1', '16:9')`
    ),
    check(
      'generation_jobs_duration_seconds_check',
      sql`${table.durationSeconds} in (5, 8, 10)`
    ),
    check('generation_jobs_template_slug_check', sql`length(trim(${table.templateSlug})) > 0`),
    check(
      'generation_jobs_credit_reserved_check',
      sql`${table.creditReserved} >= 0`
    ),
    check('generation_jobs_credit_spent_check', sql`${table.creditSpent} >= 0`),
  ]
);

export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    jobId: uuid('job_id').references(() => generationJobs.id),
    stripeEventId: text('stripe_event_id'),
    delta: integer('delta').notNull(),
    reason: text('reason').$type<CreditLedgerReason>().notNull(),
    balanceAfter: integer('balance_after').notNull(),
    metadataJson: jsonb('metadata_json')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('credit_ledger_stripe_event_id_unique')
      .on(table.stripeEventId)
      .where(sql`${table.stripeEventId} is not null`),
    uniqueIndex('credit_ledger_job_reason_unique')
      .on(table.jobId, table.reason)
      .where(
        sql`${table.jobId} is not null and ${table.reason} in ('reserve', 'capture', 'refund')`
      ),
    index('credit_ledger_user_created_at_idx').on(
      table.userId,
      table.createdAt
    ),
    index('credit_ledger_job_id_idx').on(table.jobId),
    index('credit_ledger_reason_idx').on(table.reason),
    check(
      'credit_ledger_reason_check',
      sql`${table.reason} in ('purchase', 'reserve', 'capture', 'refund', 'admin_adjust')`
    ),
    check(
      'credit_ledger_delta_reason_check',
      sql`(
        (${table.reason} = 'reserve' and ${table.delta} < 0)
        or (${table.reason} in ('purchase', 'refund') and ${table.delta} > 0)
        or (${table.reason} = 'capture' and ${table.delta} = 0)
        or ${table.reason} = 'admin_adjust'
      )`
    ),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  assets: many(assets),
  generationJobs: many(generationJobs),
  creditLedgerEntries: many(creditLedger),
  createdTemplates: many(templates, { relationName: 'templateCreator' }),
  updatedTemplates: many(templates, { relationName: 'templateUpdater' }),
  publishedTemplates: many(templates, { relationName: 'templatePublisher' }),
  templateAuditLogs: many(templateAuditLogs),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  user: one(users, {
    fields: [assets.userId],
    references: [users.id],
  }),
  inputForJobs: many(generationJobs, { relationName: 'inputAsset' }),
  rawVideoForJobs: many(generationJobs, { relationName: 'rawVideoAsset' }),
  finalVideoForJobs: many(generationJobs, { relationName: 'finalVideoAsset' }),
  thumbnailForJobs: many(generationJobs, { relationName: 'thumbnailAsset' }),
  previewForTemplates: many(templates, { relationName: 'templatePreviewAsset' }),
  thumbnailForTemplates: many(templates, { relationName: 'templateThumbnailAsset' }),
  templateAssets: many(templateAssets),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  previewAsset: one(assets, {
    fields: [templates.previewAssetId],
    references: [assets.id],
    relationName: 'templatePreviewAsset',
  }),
  thumbnailAsset: one(assets, {
    fields: [templates.thumbnailAssetId],
    references: [assets.id],
    relationName: 'templateThumbnailAsset',
  }),
  creator: one(users, {
    fields: [templates.createdBy],
    references: [users.id],
    relationName: 'templateCreator',
  }),
  updater: one(users, {
    fields: [templates.updatedBy],
    references: [users.id],
    relationName: 'templateUpdater',
  }),
  publisher: one(users, {
    fields: [templates.publishedBy],
    references: [users.id],
    relationName: 'templatePublisher',
  }),
  tagRelations: many(templateTagRelations),
  assetRelations: many(templateAssets),
  auditLogs: many(templateAuditLogs),
}));

export const templateTagsRelations = relations(templateTags, ({ many }) => ({
  templateRelations: many(templateTagRelations),
}));

export const templateTagRelationsRelations = relations(
  templateTagRelations,
  ({ one }) => ({
    template: one(templates, {
      fields: [templateTagRelations.templateId],
      references: [templates.id],
    }),
    tag: one(templateTags, {
      fields: [templateTagRelations.tagId],
      references: [templateTags.id],
    }),
  })
);

export const templateAssetsRelations = relations(templateAssets, ({ one }) => ({
  template: one(templates, {
    fields: [templateAssets.templateId],
    references: [templates.id],
  }),
  asset: one(assets, {
    fields: [templateAssets.assetId],
    references: [assets.id],
  }),
}));

export const templateAuditLogsRelations = relations(
  templateAuditLogs,
  ({ one }) => ({
    template: one(templates, {
      fields: [templateAuditLogs.templateId],
      references: [templates.id],
    }),
    actor: one(users, {
      fields: [templateAuditLogs.actorId],
      references: [users.id],
    }),
  })
);

export const templateIngestionRunsRelations = relations(
  templateIngestionRuns,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [templateIngestionRuns.createdBy],
      references: [users.id],
    }),
    sourceRecords: many(templateSourceRecords),
  })
);

export const templateSourceRecordsRelations = relations(
  templateSourceRecords,
  ({ one }) => ({
    run: one(templateIngestionRuns, {
      fields: [templateSourceRecords.runId],
      references: [templateIngestionRuns.id],
    }),
    template: one(templates, {
      fields: [templateSourceRecords.templateId],
      references: [templates.id],
    }),
    asset: one(assets, {
      fields: [templateSourceRecords.assetId],
      references: [assets.id],
    }),
  })
);

export const generationJobsRelations = relations(
  generationJobs,
  ({ one }) => ({
    user: one(users, {
      fields: [generationJobs.userId],
      references: [users.id],
    }),
    inputAsset: one(assets, {
      fields: [generationJobs.inputAssetId],
      references: [assets.id],
      relationName: 'inputAsset',
    }),
    rawVideoAsset: one(assets, {
      fields: [generationJobs.rawVideoAssetId],
      references: [assets.id],
      relationName: 'rawVideoAsset',
    }),
    finalVideoAsset: one(assets, {
      fields: [generationJobs.finalVideoAssetId],
      references: [assets.id],
      relationName: 'finalVideoAsset',
    }),
    thumbnailAsset: one(assets, {
      fields: [generationJobs.thumbnailAssetId],
      references: [assets.id],
      relationName: 'thumbnailAsset',
    }),
    template: one(templates, {
      fields: [generationJobs.templateId],
      references: [templates.id],
    }),
  })
);

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  user: one(users, {
    fields: [creditLedger.userId],
    references: [users.id],
  }),
  job: one(generationJobs, {
    fields: [creditLedger.jobId],
    references: [generationJobs.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type TemplateTag = typeof templateTags.$inferSelect;
export type NewTemplateTag = typeof templateTags.$inferInsert;
export type TemplateTagRelation = typeof templateTagRelations.$inferSelect;
export type NewTemplateTagRelation = typeof templateTagRelations.$inferInsert;
export type TemplateAsset = typeof templateAssets.$inferSelect;
export type NewTemplateAsset = typeof templateAssets.$inferInsert;
export type TemplateAuditLog = typeof templateAuditLogs.$inferSelect;
export type NewTemplateAuditLog = typeof templateAuditLogs.$inferInsert;
export type TemplateIngestionRun = typeof templateIngestionRuns.$inferSelect;
export type NewTemplateIngestionRun = typeof templateIngestionRuns.$inferInsert;
export type TemplateSourceRecord = typeof templateSourceRecords.$inferSelect;
export type NewTemplateSourceRecord = typeof templateSourceRecords.$inferInsert;
export type GenerationJob = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type NewCreditLedgerEntry = typeof creditLedger.$inferInsert;
