# 电商图生视频 SaaS 前后端代码设计方案

更新时间：2026-05-26

## 1. 目标和技术栈

目标是最快做出一个可商业验证的电商图生视频 SaaS：

```text
用户上传一张商品图
-> 填商品名、卖点、价格、CTA、比例
-> 系统生成电商短视频
-> 自动加价格牌、卖点、CTA、logo
-> 用户预览和下载
```

第一阶段固定技术栈：

```text
Next.js SaaS Starter + Vercel
Neon Postgres
Trigger.dev Cloud
Cloudflare R2 + Cloudflare DNS/CDN
fal.ai 图生视频 API
FFmpeg 后期渲染
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
-> 填商品名/卖点/价格/CTA/比例/时长
-> Next.js API 创建 generation_job
-> 冻结用户 credits
-> 触发 Trigger.dev 后台任务
-> Trigger.dev 调用 fal.ai 图生视频模型
-> 下载 raw video
-> FFmpeg 套电商模板
-> 上传 final video 和 thumbnail 到 R2
-> 更新任务状态
-> 捕获 credits 或失败返还 credits
-> 用户在任务页预览/下载视频
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
  - fal.ai 调用
  - FFmpeg 渲染
  - R2 上传

Neon:
  - 用户、任务、资产、credits、支付、provider 调用记录

Cloudflare R2:
  - 用户上传图片
  - AI 原始视频
  - 最终视频
  - 缩略图

fal.ai:
  - 图生视频模型推理
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
FFmpeg 电商模板
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
lib/providers/video/types.ts
lib/providers/video/fal.ts
lib/render/ffmpeg.ts
lib/credits.ts
lib/templates/ecommerce.ts
lib/analytics/events.ts

trigger/generate-video.ts
trigger.config.ts
```

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
  "productName": "Velvet Matte Lipstick",
  "headline": "New Arrival",
  "sellingPoint": "Long-lasting color with a soft matte finish",
  "priceText": "$19.99",
  "ctaText": "Shop Now",
  "aspectRatio": "9:16",
  "durationSeconds": 5,
  "templateSlug": "flash_sale"
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
7. 触发 Trigger.dev task: generate-video
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
type: upload | raw_video | final_video | thumbnail | template_asset
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

存储一次视频生成任务。

```text
id
user_id
status: queued | running | rendering | succeeded | failed
input_asset_id
raw_video_asset_id
final_video_asset_id
thumbnail_asset_id
provider
provider_job_id
prompt
negative_prompt
product_name
headline
selling_point
price_text
cta_text
aspect_ratio: 9:16 | 1:1 | 16:9
duration_seconds
template_slug
error_message
credit_reserved
credit_spent
created_at
updated_at
started_at
completed_at
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

## 8. fal.ai provider 行为

文件：`lib/providers/video/fal.ts`

输入：

```text
imageUrl: R2 public URL 或 signed read URL
prompt: 电商场景化 prompt
durationSeconds: 5/8/10
aspectRatio: 9:16/1:1/16:9
```

默认模型：

```text
FAL_DEFAULT_MODEL=fal-ai/wan/v2.7/image-to-video
```

实现要求：

```text
不要在前端暴露 FAL_KEY
在 generation_jobs 记录 provider 和 provider_job_id
请求失败时抛出标准错误
等待结果时设置最大超时，例如 15 分钟
```

## 9. Trigger.dev 任务设计

文件：`trigger/generate-video.ts`

任务名：

```text
generate-video
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
2. 校验状态为 queued
3. 更新 status = running, started_at = now
4. 读取 input asset
5. 构造电商 prompt
6. 调用 FalVideoProvider.createJob
7. 调用 waitForResult 等待 videoUrl
8. 下载 raw video 到临时目录
9. 上传 raw video 到 R2，创建 raw_video asset
10. 更新 status = rendering
11. 调 FFmpeg 生成 final video 和 thumbnail
12. 上传 final video 和 thumbnail 到 R2
13. 创建 final_video 和 thumbnail asset
14. 更新 status = succeeded, completed_at = now
15. 捕获 credits
16. 发送生成完成邮件
```

失败处理：

```text
任何步骤失败:
  - 更新 generation_jobs.status = failed
  - 写 error_message
  - 返还 reserve credits
  - 上报 Sentry
```

## 10. FFmpeg 电商模板

MVP 只做一个固定模板 `flash_sale`。

输出规格：

```text
9:16: 1080x1920
1:1: 1080x1080
16:9: 1920x1080
format: mp4
codec: h264/aac
pix_fmt: yuv420p
```

模板图层：

```text
background video: cover 裁切
top headline: 顶部居中
middle selling point: 中下区域
bottom price: 底部安全区
bottom CTA: price 下方
logo: 左上角，可选
```

文字原则：

```text
AI 视频里不生成价格、优惠、CTA
价格、CTA、字幕全部由 FFmpeg 后期叠加
避免视频模型生成错误文字
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
fal.ai provider exception
FFmpeg render exception
Stripe webhook exception
```

## 13. MVP 验收标准

必须跑通：

```text
用户可以登录
用户可以上传商品图
用户可以创建图生视频任务
任务可以进入 Trigger.dev
fal.ai 可以返回 raw video
FFmpeg 可以输出带价格/CTA 的 MP4
最终视频可以上传到 R2
用户可以预览和下载
Stripe test payment 后 credits 增加
失败任务会返还 credits
Sentry 能收到测试错误
PostHog 能看到生成漏斗
```
