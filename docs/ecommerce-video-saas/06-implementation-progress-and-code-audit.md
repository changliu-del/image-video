# 电商图生视频 SaaS 当前实现进度和代码审计

更新时间：2026-06-03

本文记录当前仓库代码的真实实现状态、主要风险、已完成优化和下一步建议。调研范围包括 Next.js App Router 页面、API routes、Drizzle schema、生成链路、支付/积分、R2 存储、模板/素材、后台任务、测试和既有文档。

## 1. 总体结论

当前项目已经超过纯原型阶段，具备可登录、可上传素材、可创建生成任务、可查询任务状态、可管理模板/用户/资产、可接 Stripe credits、可接 R2 和万相 provider 的主体结构。

按商业 MVP 口径判断：

| 模块 | 当前状态 | 进度判断 |
|---|---|---|
| 官网/营销页 | 多语言首页、模板页、价格页已有 | 可继续打磨转化文案和真实案例 |
| 登录和 dashboard | SaaS starter 登录、dashboard shell、多语言导航已有 | 可用，但 header 用户信息和 credits 仍需接真实数据 |
| 创作工作台 | 图生视频、商品图、智能试衣三个入口已有 | 主流程基本成型，API schema 已补齐当前 payload 兼容 |
| 上传/R2 | presign、浏览器直传、complete 落库已有 | 可用，建议 complete 阶段增加对象存在性校验 |
| 生成任务 | 当前主线是万相 submit/query + DB 轮询 | 可跑通 provider 轮询型任务，但并发和任务原子性需收敛 |
| Trigger/fal/FFmpeg runner | 旧设计代码仍在仓库 | 与当前 DB schema 不完全一致，需要决定保留、迁移或移除 |
| 支付/积分 | Stripe webhook、mock payments、credit ledger、reserve/capture/refund 已有 | 主体完整，仍需真实 price metadata 和生产 webhook 联调 |
| 模板/素材 | 模板表、标签、管理 API、爬虫 runbook、模型素材同步已有 | 运营后台雏形完成，素材库还需真实数据和审核流程 |
| 测试 | Vitest 覆盖 validation、limits、credits、payments、provider input | 有基础单测，缺 API route 和端到端 smoke |
| 部署文档 | 01-05 文档覆盖架构、成本、部署、爬虫 | 缺少当前实现进度和风险清单，本文补齐 |

## 2. 已实现能力

### 2.1 页面和用户流

- 营销入口：`app/[locale]/page.tsx`、`components/marketing/*`、`components/landing/*`。
- 登录入口：`app/(login)/sign-in/page.tsx`、`app/(login)/sign-up/page.tsx`、`app/(login)/actions.ts`。
- Dashboard shell：`app/(dashboard)/layout.tsx`、`app/(dashboard)/app-shell.tsx`、`app/(dashboard)/dashboard-header.tsx`。
- 创作入口：
  - `/create/video` -> `components/create/image-video-workbench.tsx`
  - `/create/apparel` -> `components/create/apparel-workbench.tsx`
  - `/create/try-on` -> `components/create/try-on-workbench.tsx`
- Admin 入口：`app/(dashboard)/admin/page.tsx`、`components/admin/*`、`lib/admin/services/*`。

### 2.2 API 和服务层

- 资产上传：`app/api/assets/presign/route.ts`、`app/api/assets/complete/route.ts`、`lib/storage/r2.ts`。
- 生成创建和查询：`app/api/generations/route.ts`、`app/api/generations/[id]/status/route.ts`、`lib/generations/jobs.ts`。
- 兼容旧 job 查询：`app/api/jobs/[id]/route.ts`，retry 已显式返回不支持。
- 模板和模型素材：`app/api/templates/route.ts`、`app/api/model-assets/route.ts`、`lib/templates/query.ts`、`lib/model-assets/catalog.ts`。
- 支付：`app/api/stripe/checkout/route.ts`、`app/api/stripe/webhook/route.ts`、`lib/payments/stripe.ts`、`lib/payments/mock.ts`。

### 2.3 数据模型

`lib/db/schema.ts` 已包含：

- 用户、角色、管理员权限和 credit balance。
- 用户资产 `assets`。
- 模板、标签、模板资产、审计日志。
- 模板爬虫 ingestion run 和 source record。
- 万相模型素材 catalog。
- 生成任务 `generation_jobs`。
- 积分流水 `credit_ledger`。

## 3. 主要风险和缺口

### P0: 生成任务原子性需要收敛

当前 `createGenerationForUser` 的顺序是：校验资产和额度 -> 调 provider submit -> 插入 running job 并扣 credits。若 provider submit 成功但 DB 写入或扣款失败，可能出现 provider 侧已有任务但本地无任务记录的孤儿任务。并发下，limit 检查和最终扣款也不是同一个事务窗口。

建议下一步改为：先在 DB 内创建 `queued/submitting` 任务并 reserve credits，再提交 provider，最后更新 providerTaskId 和 status。失败时可落库并退款，避免任务丢失。

### P0: 两套生成架构并存

`lib/generations/runner.ts` 和 `trigger/generate-video.ts` 仍保留 Trigger/fal/FFmpeg 旧链路，但当前 `generation_jobs` schema 只有 `running/succeeded/failed`，不再包含 runner 里引用的 `queued/rendering/raw_video_asset_id/thumbnail_asset_id/product_name/provider_job_id` 等字段。

建议明确方向：

- 若主线切到万相 submit/query：移除或归档旧 runner，文档改成万相轮询链路。
- 若仍要 Trigger/fal/FFmpeg：补 migration 和 API，让 schema、runner、前端状态完全一致。

### P1: Dashboard header 仍有演示数据

`app/(dashboard)/dashboard-header.tsx` 中 credits 显示为硬编码 `510`，`app/(dashboard)/layout.tsx` 传给 header 的 user 也只有 id。生产前应从 `getUser()` 或 session 扩展中传入真实 `creditBalance/email/name/role/isAdmin`。

### P1: Workbench 客户端工具重复

三个新版 workbench 都各自实现了 `readResponseError`、`postJson`、`uploadAsset`、`fetchJobStatus`、`normalizeItems`、图片校验和结果 URL 选择。建议抽到 `components/create/workbench-client.ts` 或 `lib/services/generation-api.ts` 的浏览器安全版本，减少后续 API 字段变更时漏改。

### P1: R2 complete 缺少对象存在性确认

`/api/assets/complete` 会校验 assetId、userId、storageKey 格式和归属，但没有对 R2 做 HEAD/metadata 校验。若上传 PUT 失败但客户端仍调用 complete，DB 可能把资产标成 uploaded。建议增加 R2 HEAD 校验，至少校验对象存在、size 和 content type。

### P2: 生产联调和工程化缺口

- Stripe price metadata、webhook secret、mock/production 切换需要一次真实联调。
- `ADMIN_API_URL/ADMIN_API_TOKEN` 未配置时素材库代理返回空列表，适合作降级，但需要在后台页面给 ops 明确提示。
- Next 15 canary、PPR、clientSegmentCache 已启用，上线前需要固定一次完整 build 验证。
- API route 的集成测试和创作流端到端测试还缺。

## 4. 本次已完成代码优化

本次修复了创作台 payload 与后端 strict schema 不一致导致的 400 问题：

- `lib/generations/validation.ts`
  - 支持 `templateId`、`templateSlug` 透传到 generation input。
  - 空字符串 `prompt` 会被视为未填写，避免表单默认空值导致失败。
  - `try_on` 接受 `aspectRatio`，兼容旧共享 workbench。
  - `apparel_image` 接受 `strength` 和 `variants`，兼容新版商品图 workbench。
- `tests/generations-validation.test.ts`
  - 增加 image-to-video、apparel、try-on 的 workbench payload 回归测试。

已验证：

```bash
pnpm test tests/generations-validation.test.ts
```

结果：1 个测试文件通过，19 条测试通过。

## 5. 下一步优先级

1. 收敛生成任务架构，优先处理 provider submit 和 DB reserve 的原子性。
2. 决定 Trigger/fal/FFmpeg runner 是否继续作为主线，并同步 schema/migration/docs。
3. Dashboard header 接真实用户信息和 credit balance。
4. 抽取 workbench 客户端共享工具，减少重复请求和错误处理逻辑。
5. 为 `/api/assets/*`、`/api/generations/*`、Stripe webhook 增加 route 级测试。
6. 完成一次带真实 env 的 `pnpm typecheck`、`pnpm build`、上传生成、支付回调 smoke。

