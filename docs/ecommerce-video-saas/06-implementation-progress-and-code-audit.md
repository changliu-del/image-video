# 电商图生视频 SaaS 当前实现进度和代码审计

更新时间：2026-06-08

本文记录当前仓库代码的真实实现状态、主要风险、已完成优化和下一步建议。调研范围包括 Next.js App Router 页面、API routes、Drizzle schema、生成链路、支付/积分、R2 存储、模板/素材、后台任务、测试和既有文档。

## 1. 总体结论

当前项目已经超过纯原型阶段，具备可登录、可上传素材、可创建生成任务、可查询任务状态、可管理模板/用户/资产、可接 Stripe credits、可接 R2 和万相 provider 的主体结构。

按商业 MVP 口径判断：

| 模块 | 当前状态 | 进度判断 |
|---|---|---|
| 官网/营销页 | 多语言首页、模板页、价格页已有 | 可继续打磨转化文案和真实案例 |
| 登录和 dashboard | SaaS starter 登录、dashboard shell、多语言导航、真实余额展示、订阅/算力工作台已有 | 可用，后续重点是移动端 smoke 和设置页细节 |
| 创作工作台 | 图生视频、商品图、智能试衣三个入口已有 | 主流程基本成型，API schema 已补齐当前 payload 兼容 |
| 上传/R2 | presign、浏览器直传、complete 落库已有，complete 已做 R2 对象 metadata 校验 | 可用，后续重点是 route 测试和生产 R2 smoke |
| 生成任务 | 当前主线是 DB-first queued job + Trigger.dev `generate-wanxiang` worker + 万相 submit/query | 主链路已避开 provider submit 先于本地落库的问题，后续重点是生产 worker/env/并发验证 |
| Trigger/fal/FFmpeg runner | 旧 `generate-video` runner 已 disabled | 不在 active path；后续应删除归档或按简化 schema 重建 |
| 支付/积分 | Stripe webhook、mock payments、credit ledger、reserve/capture/refund 已有 | 主体完整，仍需真实 price metadata 和生产 webhook 联调 |
| 模板/素材 | 模板表、用户历史素材、模型素材同步已有；官方素材库已撤掉 | 当前以模板、模特库和用户私域历史支撑创作，避免维护无人负责的官方素材目录 |
| 测试 | Vitest 覆盖 validation、limits、credits、payments、provider input、Admin 搜索/帮助和用户历史安全 | 有基础单测，仍缺更多 DB-backed API route 和端到端 smoke |
| 部署文档 | 01-05 文档覆盖架构、成本、部署、爬虫 | 缺少当前实现进度和风险清单，本文补齐 |

## 2. 已实现能力

### 2.1 页面和用户流

- 营销入口：`app/[locale]/page.tsx`、`components/marketing/*`。
- 登录入口：`app/(login)/sign-in/page.tsx`、`app/(login)/sign-up/page.tsx`、`app/(login)/actions.ts`。
- Dashboard shell：`app/(dashboard)/layout.tsx`、`app/(dashboard)/app-shell.tsx`、`app/(dashboard)/dashboard-header.tsx`。
- 创作入口：
  - `/create/video` -> `components/create/image-video-workbench.tsx`
  - `/create/apparel` -> `components/create/apparel-workbench.tsx`
  - `/create/try-on` -> `components/create/try-on-workbench.tsx`
- Admin 入口：`app/(dashboard)/admin/page.tsx`、`components/admin/*`、`lib/admin/services/*`。
- 用户历史素材管理：`app/api/user-media/*`、`app/api/admin/user-media/route.ts`、`lib/user-media/service.ts`、`lib/admin/services/user-media.ts`。

### 2.2 API 和服务层

- 资产上传：`app/api/assets/presign/route.ts`、`app/api/assets/complete/route.ts`、`lib/storage/r2.ts`。
- 生成创建和查询：`app/api/generations/route.ts`、`app/api/generations/[id]/status/route.ts`、`lib/generations/jobs.ts`。
- 兼容旧 job 查询：`app/api/jobs/[id]/route.ts` 仍作为三个工作台的状态查询 fallback。
- 模板、用户历史素材和模型素材：`app/api/templates/route.ts`、`app/api/user-media/*`、`app/api/model-assets/route.ts`、`lib/templates/query.ts`、`lib/user-media/service.ts`、`lib/model-assets/catalog.ts`。
- 支付：`app/api/stripe/checkout/route.ts`、`app/api/stripe/webhook/route.ts`、`lib/payments/stripe.ts`、`lib/payments/mock.ts`。

### 2.3 数据模型

`lib/db/schema.ts` 已包含：

- 用户、角色、管理员权限和 credit balance。
- 用户资产 `assets`。
- 模板、标签、模板资产、审计日志。
- 私域用户历史素材 `user_media_history`，引用 `assets`，可关联 `generation_jobs`，保存来源、用途、可见性、收藏、使用次数和最近使用时间。
- 模板爬虫 ingestion run 和 source record。
- 万相模型素材 catalog。
- 生成任务 `generation_jobs`。
- 积分流水 `credit_ledger`。

## 3. 主要风险和缺口

### P0: 生产 deploy/migrate/worker 环境需要一起收敛

当前 `createGenerationForUser` 已经是 DB-first：先创建 `queued` 的 `generation_jobs` 并 reserve credits，再 enqueue Trigger.dev `generate-wanxiang` worker。Wanxiang submit/query、终态更新、输出 asset、用户历史素材、capture/refund 都在 worker 或 worker 周边完成。

上线风险从“provider submit 先于本地落库”转移为“部署时 schema、Trigger.dev worker、Wanxiang env、R2 env、credit ledger 事务必须一致”。部署/migrate/worker env 不能拆开验证。

### P0: 旧 Trigger/fal/FFmpeg runner 只能作为 disabled legacy

`lib/generations/runner.ts` 现在是 disabled stub，`trigger/generate-video.ts` 会调用该 stub 并报错提示使用 `generate-wanxiang`。它不应被部署配置、文档或测试当作 active task。

建议明确方向：

- 若主线继续万相 submit/query：移除或归档旧 runner，并从部署/成本文档里清掉 fal/FFmpeg 主流程。
- 若仍要 Trigger/fal/FFmpeg：补 migration 和 API，让 schema、runner、前端状态完全一致。

### P1: 前端渲染架构需要持续执行默认约束

账单、算力和 dashboard shell 已收敛到“先渲染本地 UI，再异步补齐账户数据”的工作台模式。后续新增 dashboard 页面时应继续遵守 `project-kb/code-kb/image-video/06-frontend-rendering-architecture.md`，避免把主 UI 卡在后端调用、丢失 locale、或硬编码价格/算力值。

### P1: Workbench 客户端工具重复

三个新版 workbench 都各自实现了 `readResponseError`、`postJson`、`uploadAsset`、`fetchJobStatus`、`normalizeItems`、图片校验和结果 URL 选择。建议抽到 `components/create/workbench-client.ts` 或 `lib/services/generation-api.ts` 的浏览器安全版本，减少后续 API 字段变更时漏改。

### P1: R2 complete 仍需要生产环境 smoke

`/api/assets/complete` 已经在落库前调用 `verifyUploadedObject` 校验 R2 object metadata，并在成功后 best-effort upsert `user_media_history`。下一步风险是生产 R2 bucket、public URL、content type、size metadata 在真实上传链路中的 smoke，而不是代码里完全没有 HEAD 校验。

### P2: 生产联调和工程化缺口

- Stripe price metadata、webhook secret、mock/production 切换需要一次真实联调。
- 旧 `ADMIN_API_URL/ADMIN_API_TOKEN` 素材库代理和本地 `library_assets` 官方素材库都已从当前主线撤掉；若以后恢复外部素材源，应先定义 ingestion、质量审核和运营 owner，而不是让工作台直接依赖无维护目录。
- Next 15 canary、PPR、clientSegmentCache 已启用，上线前需要固定一次完整 build 验证。
- API route 的集成测试和创作流端到端测试还缺。

## 4. 本次已完成代码优化

本次修复了创作台 payload 与后端 strict schema 不一致导致的 400 问题：

- `lib/generations/validation.ts`
  - 支持 `templateId` 透传到 generation input。
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

### 4.1 前端渲染审查补充

已完成一次前端横向审查，并沉淀为 `project-kb/code-kb/image-video/06-frontend-rendering-architecture.md`：

- 根布局移除全局 `getUser()` SWR fallback，避免 marketing 页触发账户查询。
- `/dashboard` 移除冗余 `getUser()` 和 `force-dynamic`，由 dashboard layout 统一鉴权。
- dashboard redirect/link、登录/注册 fallback、checkout handoff、sign-out、job detail 入口统一保留 locale。
- 创作台按钮算力显示改为读取 `lib/generations/credit-costs.ts`，与后端 reserve/capture 成本一致。
- `image-video-studio` skill 增加前端默认架构入口，后续前端开发应先加载该 KB。
- 旧前端实现已清理：`components/create/create-workbench.tsx`、`components/video-generation/*`、`components/landing/*`、旧 `/jobs/[id]` 页面已删除；`/api/jobs/[id]` 仍保留为工作台状态查询兼容回退。

### 4.2 用户历史管理和官方素材库撤回

当前主线不再维护一等官方素材库：

- `library_assets` schema、公开 API、Admin API、Admin 面板和 `lib/library-assets/*` 已从产品面移除。
- 历史迁移 `0009_library_assets.sql`、`0013_simplify_library_assets.sql`、`0014_library_assets_category_unique.sql` 保留为 no-op；`0025_remove_library_assets.sql` 用于从已有数据库删除旧表、旧外键和旧来源值。
- `user_media_history` 只引用用户自己的 `assets` 和可选 `generation_jobs`，来源收敛为 `user_upload`、`generated_image`、`generated_video`。
- 三个工作台的可复用用户素材入口改为私域历史；智能试衣保留独立 `model_catalog_assets` 模特库。
- Admin 只保留 `User History` 做支持/运营查看，generic `assets` Admin route/service 和 Library Assets 面板都不作为管理入口。

## 5. 下一步优先级

1. 做一次生产式 deploy/migrate/Trigger.dev worker/Wanxiang/R2/Stripe 联合 smoke，确认 queued job、provider submit、poll、output asset、history、capture/refund 全链路。
2. 移除或归档 disabled `generate-video` / fal / FFmpeg runner，并同步 01-04 部署、成本和架构文档。
3. 抽取 workbench 客户端共享工具，减少重复请求和错误处理逻辑。
4. 为 workbench 的用户历史加载增加局部 retry/error UI，并加入更完整的历史素材筛选。
5. 为 `/api/assets/*`、`/api/user-media/*`、`/api/generations/*`、Stripe webhook 增加 DB-backed route 级测试。
6. 完成一次带真实 env 的 `pnpm typecheck`、`pnpm build`、上传生成、支付回调 smoke。
