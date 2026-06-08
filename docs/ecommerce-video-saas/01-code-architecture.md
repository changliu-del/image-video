# 电商图生视频 SaaS 前后端代码设计方案

更新时间：2026-06-05

## 1. 目标和技术栈

目标是最快做出一个可商业验证的电商图生视频 SaaS：

```text
用户上传一张商品图
-> 选择模板或填写 prompt、比例、时长
-> 系统生成电商短视频
-> 用户预览和下载
```

第一阶段固定技术栈：

```text
Next.js SaaS Starter + Vercel
Neon Postgres
Trigger.dev Cloud
Cloudflare R2 + Cloudflare DNS/CDN
Wanxiang 图生视频、商品图、试衣 API
Stripe 支付
Resend 邮件
Sentry + PostHog 监控分析
```

第一阶段不做：

```text
不租独立后端服务器
不自建 Redis
不自建 GPU
不自建 MySQL
不接 Remotion
不做复杂拖拽视频编辑器
```

## 2. 系统 pipeline

完整生成流程：

```text
用户登录
-> 上传商品图到 Cloudflare R2
-> 选择模板或填写 prompt/比例/时长
-> Next.js API 创建 generation_job
-> 冻结用户 credits
-> 触发 Trigger.dev 后台任务
-> Trigger.dev `generate-wanxiang` worker 调用 Wanxiang submit/query
-> 成功后创建 final image/video asset
-> 上传或记录 final asset 到 R2/DB
-> 更新任务状态
-> 捕获 credits 或失败返还 credits
-> 用户在工作台内联预览/下载结果
```

运行时职责：

```text
Vercel:
  - 前端页面
  - 登录后的 dashboard
  - 短 API routes
  - Stripe webhook
  - 创建和查询任务

Trigger.dev:
  - 长任务
  - 队列
  - 重试
  - Wanxiang submit/query
  - output asset 创建
  - credit capture/refund

Neon:
  - 用户、任务、资产、模板、模特库、用户历史素材、credits、支付、provider 调用记录

Cloudflare R2:
  - 用户上传图片
  - 模板和模特库媒体
  - 生成输出文件

Wanxiang:
  - 图生视频、商品图、智能试衣 provider 推理
```

## 3. 项目基座

从 [nextjs/saas-starter](https://github.com/nextjs/saas-starter) 开始。

保留已有能力：

```text
Next.js App Router
Postgres
Drizzle ORM
Stripe
shadcn/ui
auth
dashboard
RBAC
基础 pricing 页面
```

新增能力：

```text
商品图上传
电商视频生成表单
工作台内联任务进度
生成结果预览/下载
credits 系统
provider adapter
Trigger.dev task
Wanxiang provider adapter
R2 存储适配
PostHog 生成漏斗事件
Sentry 错误上报
```

推荐目录：

```text
app/(dashboard)/create/video/page.tsx
app/(dashboard)/create/apparel/page.tsx
app/(dashboard)/create/try-on/page.tsx
app/api/assets/presign/route.ts
app/api/assets/complete/route.ts
app/api/generations/route.ts
app/api/jobs/[id]/route.ts
app/api/stripe/webhook/route.ts

lib/storage/r2.ts
lib/providers/wanxiang/img-to-video.ts
lib/providers/wanxiang/cloth.ts
lib/providers/wanxiang/starlink.ts
lib/credits.ts
lib/templates/catalog.ts
lib/templates/query.ts
lib/analytics/events.ts

trigger/generate-wanxiang.ts
trigger.config.ts
```

模板表是轻量 prompt 配方表，不再承担标签体系、排序体系或发布状态。
语义字段只保留 `id`、`type`、`title`、`title_translations_json`、
`category`、`thumbnail_asset_id`、`preview_asset_id`、`prompt`、
`prompt_translations_json`、`created_at`、`updated_at`。缩略图和预览
视频/主图都作为 `assets` 行管理，模板表只保存稳定 asset 外键。
首页模板库、公开模板库和图生视频工作台都复用
`type=image_to_video` 的模板；`category` 只表示该 type 内部的业务分类。
API 对前台输出 URL：列表只返回 `id`、按 `locale` 解析后的 `title`、
`type`、`category`、`thumbnailUrl`，详情再返回 `previewUrl` 和按 `locale`
解析后的 `prompt`。`category` 保持稳定 code，展示文案由前端类目映射本地化。

## 4. 前端页面设计

### `/create/video`、`/create/apparel`、`/create/try-on`

用途：当前主线创作工作台，分别对应图生视频、商品图、智能试衣。

页面控件：

```text
素材上传或素材/模板库选择
prompt 和创意预设
比例、时长、模式、风格等工作台参数
生成按钮，显示与后端一致的算力成本
结果预览区
```

前端行为：

```text
1. 调 /api/assets/presign 获取 signed upload URL
2. 浏览器直传图片到 R2
3. 调 /api/assets/complete 记录 asset
4. 调 /api/generations 创建 generation_job
5. 工作台内联轮询 /api/generations/{jobId}/status
6. 若主状态接口不可用，兼容回退 /api/jobs/{jobId}
```

`/generate` 仅作为兼容入口重定向到 `/create/video`。旧 `/jobs/[id]` 前端页面已移除，任务状态由三个工作台内联展示。

## 5. API 设计

### `POST /api/assets/presign`

用途：生成 R2 signed upload URL。

请求：

```json
{
  "fileName": "product.png",
  "mimeType": "image/png",
  "sizeBytes": 123456
}
```

响应：

```json
{
  "assetId": "asset_...",
  "uploadUrl": "https://...",
  "storageKey": "users/{userId}/uploads/{assetId}.png",
  "publicUrl": "https://cdn.yourdomain.com/users/{userId}/uploads/{assetId}.png"
}
```

校验：

```text
只允许 image/png, image/jpeg, image/webp
MVP 最大 10 MB
必须登录
storageKey 必须带 userId，避免覆盖其他用户文件
```

### `POST /api/assets/complete`

用途：用户直传完成后，把 asset 标记为 uploaded。

请求：

```json
{
  "assetId": "asset_...",
  "storageKey": "users/{userId}/uploads/{assetId}.png"
}
```

### `POST /api/generations`

用途：创建视频生成任务。

请求：

```json
{
  "inputAssetId": "asset_...",
  "generationType": "image_to_video",
  "prompt": "Create a premium product video with a clean ecommerce composition.",
  "aspectRatio": "9:16",
  "durationSeconds": 5,
  "templateId": "template_uuid"
}
```

后端行为：

```text
1. 校验登录用户
2. 校验 inputAsset 属于当前用户
3. 计算预估 credits
4. 检查余额
5. 写入 credit_ledger reserve 记录
6. 创建 generation_jobs 记录，状态 queued
7. 触发 Trigger.dev task: generate-wanxiang
8. 返回 jobId
```

响应：

```json
{
  "jobId": "job_...",
  "status": "queued"
}
```

### `GET /api/jobs/[id]`

用途：查询任务状态。

响应：

```json
{
  "id": "job_...",
  "status": "rendering",
  "progressLabel": "Adding product overlays",
  "finalVideoUrl": null,
  "thumbnailUrl": null,
  "errorMessage": null
}
```

## 6. 数据库设计

表名使用复数，ID 使用 `uuid` 或 starter 里已有 ID 风格。当前保留核心表：`users`、`assets`、`generation_jobs`、`credit_ledger`；供应商调用和渲染输出不再单独建表，分别归入 `generation_jobs` 状态字段和最终 `assets` 记录。

### `assets`

存储用户上传图、原始视频、最终视频和缩略图的元数据。

```text
id
user_id
type: upload | raw_video | final_video | thumbnail
status: pending | uploaded | failed
storage_key
public_url
mime_type
size_bytes
width
height
duration_seconds
created_at
updated_at
```

### `generation_jobs`

存储一次生成任务。任务表只保存生命周期、供应商追踪、输入 JSON、单一输出资产和 credits 账务字段；试衣模式、模板来源、prompt 等业务输入保留在 `input_json`。

```text
id
user_id
status: queued | submitting | running | succeeded | failed
generation_type: image_to_video | apparel_image | try_on
input_asset_id
output_asset_id
provider
provider_task_id
trigger_run_id
input_json
output_json
error_message
credit_reserved
credit_spent
created_at
updated_at
```

### `credit_ledger`

用账本方式记录 credits，避免直接改余额导致对账困难。

```text
id
user_id
job_id
stripe_event_id
delta
reason: purchase | reserve | capture | refund | admin_adjust
balance_after
metadata_json
created_at
```

规则：

```text
purchase: 用户付款后增加 credits
reserve: 创建任务时冻结，delta 为负
capture: 任务成功时确认消耗，MVP 可不额外扣，只标记 metadata
refund: 任务失败时返还，delta 为正
admin_adjust: 后台人工调整
```

## 7. Provider 抽象

文件：`lib/providers/video/types.ts`

```ts
export type VideoAspectRatio = "9:16" | "1:1" | "16:9";

export interface ImageToVideoProvider {
  name: string;

  createJob(input: {
    imageUrl: string;
    prompt: string;
    durationSeconds: number;
    aspectRatio: VideoAspectRatio;
  }): Promise<{
    providerJobId: string;
  }>;

  waitForResult(providerJobId: string): Promise<{
    videoUrl: string;
    costUsd?: number;
    rawResponse?: unknown;
  }>;
}
```

MVP 只实现：

```text
FalVideoProvider
```

后续扩展：

```text
ReplicateVideoProvider
RunPodVideoProvider
ComfyUIProvider
KlingOfficialProvider
```

## 8. Wanxiang provider 行为

文件：

```text
lib/providers/wanxiang/img-to-video.ts
lib/providers/wanxiang/cloth.ts
lib/providers/wanxiang/starlink.ts
lib/providers/wanxiang/models.ts
```

输入：

```text
image_to_video: imageUrl, prompt, durationSeconds, aspectRatio
apparel_image: imageUrl, prompt, strength, variants
try_on: modelUrl, garment image URLs, mode, aspectRatio
```

环境变量：

```text
WANXIANG_APPCODE
WANXIANG_IMG_TO_VIDEO_SUBMIT_URL / WANXIANG_IMG_TO_VIDEO_QUERY_URL
WANXIANG_CLOTH_SUBMIT_URL / WANXIANG_CLOTH_QUERY_URL
WANXIANG_TRY_ON_SINGLE_SUBMIT_URL / WANXIANG_TRY_ON_MULTI_SUBMIT_URL / WANXIANG_TRY_ON_QUERY_URL
WANXIANG_MODEL_CATALOG_URL
```

实现要求：

```text
不要在前端暴露 WANXIANG_APPCODE
在 generation_jobs 记录 provider 和 provider_task_id
请求失败时抛出标准错误
Worker 轮询到终态或超时失败并 refund credits
```

## 9. Trigger.dev 任务设计

文件：`trigger/generate-wanxiang.ts`

任务名：

```text
generate-wanxiang
```

payload：

```json
{
  "jobId": "job_..."
}
```

任务步骤：

```text
1. 读取 generation_jobs
2. queued 任务获取本地 submit lease，更新 status = submitting
3. 从 input_json 还原生成请求，校验输入 asset 和可选模特素材
4. 调 Wanxiang 对应接口提交任务，写入 provider_task_id 并更新 status = running
5. 查询 Wanxiang 任务状态
6. running 时更新 output_json raw response，等待下一次 worker 调度
7. succeeded 时创建一个输出 asset：优先 final_video，其次 final_image
8. 把 output_asset_id 写回 generation_jobs
9. 记录 generated_image/generated_video 到 user_media_history
10. 捕获 credits
```

失败处理：

```text
任何步骤失败:
  - 更新 generation_jobs.status = failed
  - 写 error_message
  - 返还 reserve credits
  - 上报 Sentry
```

## 10. Disabled legacy fal/FFmpeg runner

旧 `trigger/generate-video.ts` 和 `lib/generations/runner.ts` 只保留为 disabled legacy。不要把它们配置成生产 active task。

当前主线不跑 FFmpeg 后期模板，不再依赖 fal.ai 生成 raw video 后再套商业贴片。商品文案、模板 ID、prompt、成本和来源信息保存在 `input_json`，模板表只保存轻量 prompt 配方；生成输出以 Wanxiang 结果为准。

如果未来要恢复 FFmpeg 或 fal.ai 路径，必须先重新设计：

```text
schema/migrations
generation job status model
credit reserve/capture/refund
frontend status/result fields
deployment docs and cost model
```

## 11. Credits 设计

MVP 计费规则建议：

```text
5s 480p/720p 草稿: 10 credits
8s 标准: 18 credits
10s 标准: 25 credits
失败任务: 全额返还
```

实现要求：

```text
创建任务前必须 reserve credits
任务成功后标记 capture
任务失败后 refund
所有变动写 credit_ledger
不要只在 users 表里改一个 balance 字段
```

## 12. 监控和分析事件

PostHog 事件：

```text
image_uploaded
generation_started
generation_succeeded
generation_failed
video_downloaded
checkout_started
checkout_completed
```

Sentry 上报：

```text
API route exception
Trigger.dev task exception
Wanxiang provider exception
Stripe webhook exception
```

## 13. MVP 验收标准

必须跑通：

```text
用户可以登录
用户可以上传商品图
用户可以创建图生视频任务
任务可以进入 Trigger.dev
Wanxiang 可以返回终态结果
最终 image/video asset 可以写入 DB/R2
用户可以预览和下载
Stripe test payment 后 credits 增加
失败任务会返还 credits
Sentry 能收到测试错误
PostHog 能看到生成漏斗
```
