import {
  check,
  index,
  jsonb,
  numeric,
  pgTable,
  serial,
  uniqueIndex,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
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

export const TEMPLATE_SLUGS = [
  'flash_sale',
  'new_arrival',
  'best_seller',
] as const;
export type TemplateSlug = (typeof TEMPLATE_SLUGS)[number];

export const CREDIT_LEDGER_REASONS = [
  'purchase',
  'reserve',
  'capture',
  'refund',
  'admin_adjust',
] as const;
export type CreditLedgerReason = (typeof CREDIT_LEDGER_REASONS)[number];

export const PROVIDER_CALL_STATUSES = [
  'started',
  'succeeded',
  'failed',
] as const;
export type ProviderCallStatus = (typeof PROVIDER_CALL_STATUSES)[number];

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

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
    templateSlug: varchar('template_slug', { length: 60 })
      .$type<TemplateSlug>()
      .notNull(),
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
    check(
      'generation_jobs_template_slug_check',
      sql`${table.templateSlug} in ('flash_sale', 'new_arrival', 'best_seller')`
    ),
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

export const providerCalls = pgTable(
  'provider_calls',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => generationJobs.id),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    requestJson: jsonb('request_json').$type<unknown>(),
    responseJson: jsonb('response_json').$type<unknown>(),
    status: text('status')
      .$type<ProviderCallStatus>()
      .notNull()
      .default('started'),
    costUsd: numeric('cost_usd', { precision: 10, scale: 4 }),
    latencyMs: integer('latency_ms'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('provider_calls_job_id_idx').on(table.jobId),
    index('provider_calls_provider_status_idx').on(
      table.provider,
      table.status
    ),
    check(
      'provider_calls_status_check',
      sql`${table.status} in ('started', 'succeeded', 'failed')`
    ),
    check(
      'provider_calls_cost_usd_check',
      sql`${table.costUsd} is null or ${table.costUsd} >= 0`
    ),
    check(
      'provider_calls_latency_ms_check',
      sql`${table.latencyMs} is null or ${table.latencyMs} >= 0`
    ),
  ]
);

export const renderOutputs = pgTable(
  'render_outputs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => generationJobs.id),
    aspectRatio: text('aspect_ratio').$type<VideoAspectRatio>().notNull(),
    templateSlug: varchar('template_slug', { length: 60 })
      .$type<TemplateSlug>()
      .notNull(),
    storageKey: text('storage_key').notNull(),
    publicUrl: text('public_url').notNull(),
    durationSeconds: integer('duration_seconds'),
    width: integer('width'),
    height: integer('height'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('render_outputs_storage_key_unique').on(table.storageKey),
    index('render_outputs_job_id_idx').on(table.jobId),
    check(
      'render_outputs_aspect_ratio_check',
      sql`${table.aspectRatio} in ('9:16', '1:1', '16:9')`
    ),
    check(
      'render_outputs_template_slug_check',
      sql`${table.templateSlug} in ('flash_sale', 'new_arrival', 'best_seller')`
    ),
    check(
      'render_outputs_duration_seconds_check',
      sql`${table.durationSeconds} is null or ${table.durationSeconds} >= 0`
    ),
    check(
      'render_outputs_width_check',
      sql`${table.width} is null or ${table.width} > 0`
    ),
    check(
      'render_outputs_height_check',
      sql`${table.height} is null or ${table.height} > 0`
    ),
  ]
);

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  assets: many(assets),
  generationJobs: many(generationJobs),
  creditLedgerEntries: many(creditLedger),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
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
    providerCalls: many(providerCalls),
    renderOutputs: many(renderOutputs),
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

export const providerCallsRelations = relations(providerCalls, ({ one }) => ({
  job: one(generationJobs, {
    fields: [providerCalls.jobId],
    references: [generationJobs.id],
  }),
}));

export const renderOutputsRelations = relations(renderOutputs, ({ one }) => ({
  job: one(generationJobs, {
    fields: [renderOutputs.jobId],
    references: [generationJobs.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type GenerationJob = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type NewCreditLedgerEntry = typeof creditLedger.$inferInsert;
export type ProviderCall = typeof providerCalls.$inferSelect;
export type NewProviderCall = typeof providerCalls.$inferInsert;
export type RenderOutput = typeof renderOutputs.$inferSelect;
export type NewRenderOutput = typeof renderOutputs.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
