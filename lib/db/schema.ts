import {
  check,
  index,
  jsonb,
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
  'final_image',
  'final_video',
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_STATUSES = ['pending', 'uploaded', 'failed'] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const GENERATION_JOB_STATUSES = [
  'queued',
  'submitting',
  'running',
  'succeeded',
  'failed',
] as const;
export type GenerationJobStatus = (typeof GENERATION_JOB_STATUSES)[number];

export const GENERATION_TYPES = [
  'image_to_video',
  'apparel_image',
  'try_on',
] as const;
export type GenerationType = (typeof GENERATION_TYPES)[number];

export const TRY_ON_MODES = ['single', 'multi'] as const;
export type TryOnMode = (typeof TRY_ON_MODES)[number];

export const VIDEO_ASPECT_RATIOS = ['9:16', '1:1', '16:9'] as const;
export type VideoAspectRatio = (typeof VIDEO_ASPECT_RATIOS)[number];

export const USER_ROLES = ['member', 'ops', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EMAIL_VERIFICATION_PURPOSES = ['signup'] as const;
export type EmailVerificationPurpose =
  (typeof EMAIL_VERIFICATION_PURPOSES)[number];

export const TEMPLATE_CATEGORIES = [
  'image_to_video',
  'image_to_image',
  'try_on',
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const LIBRARY_ASSET_CATEGORIES = [
  'image_to_video',
  'apparel_image',
  'try_on',
] as const;
export type LibraryAssetCategory = (typeof LIBRARY_ASSET_CATEGORIES)[number];

export const USER_MEDIA_HISTORY_SOURCES = [
  'user_upload',
  'generated_image',
  'generated_video',
  'ops_library_used',
] as const;
export type UserMediaHistorySource =
  (typeof USER_MEDIA_HISTORY_SOURCES)[number];

export const USER_MEDIA_HISTORY_ROLES = [
  'input',
  'output',
  'reference',
  'garment',
  'model',
] as const;
export type UserMediaHistoryRole = (typeof USER_MEDIA_HISTORY_ROLES)[number];

export const USER_MEDIA_HISTORY_VISIBILITIES = [
  'active',
  'hidden',
  'deleted',
] as const;
export type UserMediaHistoryVisibility =
  (typeof USER_MEDIA_HISTORY_VISIBILITIES)[number];

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

export const emailVerificationCodes = pgTable(
  'email_verification_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    purpose: varchar('purpose', { length: 32 })
      .$type<EmailVerificationPurpose>()
      .notNull(),
    codeHash: text('code_hash').notNull(),
    attempts: integer('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at').notNull(),
    consumedAt: timestamp('consumed_at'),
    lastSentAt: timestamp('last_sent_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('email_verification_codes_email_purpose_created_idx').on(
      table.email,
      table.purpose,
      table.createdAt
    ),
    index('email_verification_codes_expires_at_idx').on(table.expiresAt),
    check(
      'email_verification_codes_purpose_check',
      sql`${table.purpose} in ('signup')`
    ),
    check(
      'email_verification_codes_attempts_check',
      sql`${table.attempts} >= 0`
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
      sql`${table.type} in ('upload', 'final_image', 'final_video')`
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
    name: varchar('name', { length: 140 }).notNull(),
    description: text('description').notNull(),
    category: text('category')
      .$type<TemplateCategory>()
      .notNull()
      .default('image_to_image'),
    prompt: text('prompt').notNull(),
    negativePrompt: text('negative_prompt'),
    previewAssetId: uuid('preview_asset_id').references(() => assets.id),
    tagsJson: jsonb('tags_json')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('templates_category_idx').on(table.category),
    index('templates_sort_weight_idx').on(table.sortWeight),
    check(
      'templates_category_check',
      sql`${table.category} in ('image_to_video', 'image_to_image', 'try_on')`
    ),
    check('templates_cost_credits_check', sql`${table.costCredits} >= 0`),
    check('templates_usage_count_check', sql`${table.usageCount} >= 0`),
    check(
      'templates_duration_seconds_check',
      sql`${table.durationSeconds} is null or ${table.durationSeconds} in (5, 8, 10)`
    ),
  ]
);

export const libraryAssets = pgTable(
  'library_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    title: varchar('title', { length: 140 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 32 })
      .$type<LibraryAssetCategory>()
      .notNull(),
    sortWeight: integer('sort_weight').notNull().default(0),
    usageCount: integer('usage_count').notNull().default(0),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('library_assets_asset_category_unique').on(
      table.assetId,
      table.category
    ),
    index('library_assets_category_idx').on(table.category),
    index('library_assets_sort_weight_idx').on(table.sortWeight),
    check(
      'library_assets_category_check',
      sql`${table.category} in ('image_to_video', 'apparel_image', 'try_on')`
    ),
    check(
      'library_assets_usage_count_check',
      sql`${table.usageCount} >= 0`
    ),
  ]
);

export const MODEL_CATALOG_ASSET_STATUSES = [
  'active',
  'inactive',
  'failed',
] as const;
export type ModelCatalogAssetStatus =
  (typeof MODEL_CATALOG_ASSET_STATUSES)[number];

export const modelCatalogAssets = pgTable(
  'model_catalog_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provider: varchar('provider', { length: 40 }).notNull().default('wanxiang'),
    externalId: varchar('external_id', { length: 160 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('pt'),
    title: varchar('title', { length: 140 }).notNull(),
    description: text('description'),
    thumbnailUrl: text('thumbnail_url'),
    imageUrl: text('image_url'),
    videoUrl: text('video_url'),
    tagsJson: jsonb('tags_json')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    providerPayloadJson: jsonb('provider_payload_json')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    status: varchar('status', { length: 24 })
      .$type<ModelCatalogAssetStatus>()
      .notNull()
      .default('active'),
    sortWeight: integer('sort_weight').notNull().default(0),
    syncedAt: timestamp('synced_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('model_catalog_assets_provider_external_locale_unique').on(
      table.provider,
      table.externalId,
      table.locale
    ),
    index('model_catalog_assets_locale_status_idx').on(table.locale, table.status),
    index('model_catalog_assets_provider_status_idx').on(table.provider, table.status),
    index('model_catalog_assets_sort_weight_idx').on(table.sortWeight),
    check(
      'model_catalog_assets_status_check',
      sql`${table.status} in ('active', 'inactive', 'failed')`
    ),
    check(
      'model_catalog_assets_media_check',
      sql`${table.thumbnailUrl} is not null or ${table.imageUrl} is not null or ${table.videoUrl} is not null`
    ),
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
    generationType: text('generation_type')
      .$type<GenerationType>()
      .notNull(),
    inputAssetId: uuid('input_asset_id')
      .notNull()
      .references(() => assets.id),
    outputAssetId: uuid('output_asset_id').references(() => assets.id),
    provider: text('provider').notNull().default('wanxiang'),
    providerTaskId: text('provider_task_id'),
    triggerRunId: text('trigger_run_id'),
    inputJson: jsonb('input_json')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    outputJson: jsonb('output_json').$type<Record<string, unknown>>(),
    errorMessage: text('error_message'),
    creditReserved: integer('credit_reserved').notNull().default(0),
    creditSpent: integer('credit_spent').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('generation_jobs_user_id_idx').on(table.userId),
    index('generation_jobs_user_status_idx').on(table.userId, table.status),
    index('generation_jobs_type_status_idx').on(
      table.generationType,
      table.status
    ),
    index('generation_jobs_input_asset_id_idx').on(table.inputAssetId),
    index('generation_jobs_output_asset_id_idx').on(table.outputAssetId),
    uniqueIndex('generation_jobs_provider_task_id_unique').on(
      table.provider,
      table.providerTaskId
    ).where(sql`${table.providerTaskId} is not null`),
    check(
      'generation_jobs_status_check',
      sql`${table.status} in ('queued', 'submitting', 'running', 'succeeded', 'failed')`
    ),
    check(
      'generation_jobs_type_check',
      sql`${table.generationType} in ('image_to_video', 'apparel_image', 'try_on')`
    ),
    check(
      'generation_jobs_credit_reserved_check',
      sql`${table.creditReserved} >= 0`
    ),
    check('generation_jobs_credit_spent_check', sql`${table.creditSpent} >= 0`),
  ]
);

export const userMediaHistory = pgTable(
  'user_media_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    libraryAssetId: uuid('library_asset_id').references(() => libraryAssets.id, {
      onDelete: 'set null',
    }),
    generationJobId: uuid('generation_job_id').references(() => generationJobs.id, {
      onDelete: 'set null',
    }),
    source: varchar('source', { length: 32 })
      .$type<UserMediaHistorySource>()
      .notNull(),
    generationType: varchar('generation_type', { length: 32 }).$type<GenerationType>(),
    role: varchar('role', { length: 32 }).$type<UserMediaHistoryRole>(),
    title: varchar('title', { length: 140 }),
    description: text('description'),
    visibility: varchar('visibility', { length: 16 })
      .$type<UserMediaHistoryVisibility>()
      .notNull()
      .default('active'),
    isFavorite: boolean('is_favorite').notNull().default(false),
    usedCount: integer('used_count').notNull().default(0),
    lastUsedAt: timestamp('last_used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_media_history_user_asset_source_role_unique')
      .on(table.userId, table.assetId, table.source, table.role)
      .where(sql`${table.role} is not null`),
    uniqueIndex('user_media_history_user_asset_source_unique')
      .on(table.userId, table.assetId, table.source)
      .where(sql`${table.role} is null`),
    index('user_media_history_user_visibility_updated_idx').on(
      table.userId,
      table.visibility,
      table.updatedAt
    ),
    index('user_media_history_user_source_updated_idx').on(
      table.userId,
      table.source,
      table.updatedAt
    ),
    index('user_media_history_user_generation_type_updated_idx').on(
      table.userId,
      table.generationType,
      table.updatedAt
    ),
    index('user_media_history_asset_id_idx').on(table.assetId),
    index('user_media_history_library_asset_id_idx').on(table.libraryAssetId),
    index('user_media_history_generation_job_id_idx').on(table.generationJobId),
    check(
      'user_media_history_source_check',
      sql`${table.source} in ('user_upload', 'generated_image', 'generated_video', 'ops_library_used')`
    ),
    check(
      'user_media_history_generation_type_check',
      sql`${table.generationType} is null or ${table.generationType} in ('image_to_video', 'apparel_image', 'try_on')`
    ),
    check(
      'user_media_history_role_check',
      sql`${table.role} is null or ${table.role} in ('input', 'output', 'reference', 'garment', 'model')`
    ),
    check(
      'user_media_history_visibility_check',
      sql`${table.visibility} in ('active', 'hidden', 'deleted')`
    ),
    check(
      'user_media_history_used_count_check',
      sql`${table.usedCount} >= 0`
    ),
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
  userMediaHistory: many(userMediaHistory),
  creditLedgerEntries: many(creditLedger),
  createdTemplates: many(templates, { relationName: 'templateCreator' }),
  updatedTemplates: many(templates, { relationName: 'templateUpdater' }),
  createdLibraryAssets: many(libraryAssets, { relationName: 'libraryAssetCreator' }),
  updatedLibraryAssets: many(libraryAssets, { relationName: 'libraryAssetUpdater' }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  user: one(users, {
    fields: [assets.userId],
    references: [users.id],
  }),
  inputForJobs: many(generationJobs, { relationName: 'inputAsset' }),
  outputForJobs: many(generationJobs, { relationName: 'outputAsset' }),
  previewForTemplates: many(templates, { relationName: 'templatePreviewAsset' }),
  libraryAssetRecords: many(libraryAssets),
  userMediaHistory: many(userMediaHistory),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  previewAsset: one(assets, {
    fields: [templates.previewAssetId],
    references: [assets.id],
    relationName: 'templatePreviewAsset',
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
}));

export const libraryAssetsRelations = relations(libraryAssets, ({ one, many }) => ({
  asset: one(assets, {
    fields: [libraryAssets.assetId],
    references: [assets.id],
  }),
  creator: one(users, {
    fields: [libraryAssets.createdBy],
    references: [users.id],
    relationName: 'libraryAssetCreator',
  }),
  updater: one(users, {
    fields: [libraryAssets.updatedBy],
    references: [users.id],
    relationName: 'libraryAssetUpdater',
  }),
  userMediaHistory: many(userMediaHistory),
}));

export const generationJobsRelations = relations(
  generationJobs,
  ({ one, many }) => ({
    user: one(users, {
      fields: [generationJobs.userId],
      references: [users.id],
    }),
    inputAsset: one(assets, {
      fields: [generationJobs.inputAssetId],
      references: [assets.id],
      relationName: 'inputAsset',
    }),
    outputAsset: one(assets, {
      fields: [generationJobs.outputAssetId],
      references: [assets.id],
      relationName: 'outputAsset',
    }),
    userMediaHistory: many(userMediaHistory),
  })
);

export const userMediaHistoryRelations = relations(
  userMediaHistory,
  ({ one }) => ({
    user: one(users, {
      fields: [userMediaHistory.userId],
      references: [users.id],
    }),
    asset: one(assets, {
      fields: [userMediaHistory.assetId],
      references: [assets.id],
    }),
    libraryAsset: one(libraryAssets, {
      fields: [userMediaHistory.libraryAssetId],
      references: [libraryAssets.id],
    }),
    generationJob: one(generationJobs, {
      fields: [userMediaHistory.generationJobId],
      references: [generationJobs.id],
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
export type LibraryAsset = typeof libraryAssets.$inferSelect;
export type NewLibraryAsset = typeof libraryAssets.$inferInsert;
export type GenerationJob = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;
export type UserMediaHistory = typeof userMediaHistory.$inferSelect;
export type NewUserMediaHistory = typeof userMediaHistory.$inferInsert;
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type NewCreditLedgerEntry = typeof creditLedger.$inferInsert;
