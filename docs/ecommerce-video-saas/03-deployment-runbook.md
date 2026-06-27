# 电商图生视频 SaaS 从 0 到上线部署 Runbook

更新时间：2026-05-26

本文是实际操作手册。按顺序执行，可以把第一版 MVP 上线。

## 0. 前置准备

需要准备：

```text
一个 GitHub 账号
一张可在线支付的信用卡或公司卡
一个品牌名
一个准备用于发信的域名
一个负责人邮箱
```

建议先确定：

```text
主域名: yourdomain.com
应用域名: app.yourdomain.com
官网域名: www.yourdomain.com
CDN 域名: cdn.yourdomain.com
```

## 1. 购买域名并接入 Cloudflare

操作：

```text
1. 打开 https://www.cloudflare.com/products/registrar/ 或 https://www.namecheap.com
2. 搜索品牌域名，例如 yourdomain.com
3. 购买域名
4. 打开 https://dash.cloudflare.com
5. Add a site
6. 输入 yourdomain.com
7. 选择 Free plan
8. 如果域名不在 Cloudflare 买，把 registrar 里的 nameserver 改成 Cloudflare 提供的 nameserver
9. 等待 DNS 生效
```

Cloudflare DNS 先建这些记录：

```text
app  CNAME  cname.vercel-dns.com
www  CNAME  cname.vercel-dns.com
cdn  CNAME  后续绑定 R2 custom domain 时填写
```

说明：

```text
具体 CNAME 值以 Vercel 和 Cloudflare 控制台给出的值为准。
不要急着把所有 DNS 一次配完，Vercel 和 R2 绑定域名时会给出准确记录。
```

## 2. 创建 GitHub 仓库

操作：

```text
1. 打开 https://github.com/nextjs/saas-starter
2. Fork 到自己的 GitHub 账号或组织
3. 重命名仓库，例如 ecommerce-video-saas
4. 保留 main 分支作为 production
5. 本地 clone 仓库
```

本地初始化：

```bash
pnpm install
cp .env.example .env
```

如果 starter 使用 npm 或 bun，以仓库 README 为准。

## 3. 创建 Neon Postgres 数据库

操作：

```text
1. 打开 https://neon.com
2. Sign up / Log in
3. Create project
4. Project name: ecommerce-video-prod
5. Region: 优先选择靠近主要用户或 Vercel 部署区域的 region
6. 创建完成后进入 Connection Details
7. 复制 pooled connection string
```

保存环境变量：

```text
POSTGRES_URL=
```

本地 `.env` 添加：

```text
POSTGRES_URL=postgresql://...
```

执行数据库 migration：

```bash
pnpm db:migrate
```

如果 starter 的命令不同，以 `package.json` 里的 scripts 为准。

上线前需要新增业务表：

```text
assets
generation_jobs
credit_ledger
```

## 4. 部署 Vercel

操作：

```text
1. 打开 https://vercel.com
2. Sign up / Log in
3. Add New Project
4. Import Git Repository
5. 选择 ecommerce-video-saas 仓库
6. Framework Preset 选择 Next.js
7. 添加环境变量
8. Deploy
```

Vercel 环境变量第一批：

```text
BASE_URL=https://app.yourdomain.com
POSTGRES_URL=
AUTH_SECRET=
```

部署完成后：

```text
1. 进入 Vercel Project Settings
2. Domains
3. 添加 app.yourdomain.com
4. 添加 www.yourdomain.com
5. 按 Vercel 提示回 Cloudflare 配 DNS
6. 等待 HTTPS 生效
```

验证：

```text
https://app.yourdomain.com 可以访问
登录页可以打开
dashboard 可以打开
```

## 5. 创建 Cloudflare R2 bucket

操作：

```text
1. 打开 https://dash.cloudflare.com
2. 左侧选择 R2 Object Storage
3. Create bucket
4. 创建 ecommerce-video-prod
5. 创建 ecommerce-video-dev
```

bucket 目录约定：

```text
uploads/
raw-videos/
final-videos/
thumbnails/
templates/
```

创建 R2 API Token：

```text
1. R2 页面进入 Manage R2 API Tokens
2. Create API token
3. 权限选择 Object Read & Write
4. bucket scope 选择 ecommerce-video-prod 和 ecommerce-video-dev
5. 保存 Access Key ID 和 Secret Access Key
```

环境变量：

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=ecommerce-video-prod
R2_PUBLIC_BASE_URL=https://cdn.yourdomain.com
```

绑定自定义域名：

```text
1. R2 bucket 设置里找到 Custom Domains
2. 添加 cdn.yourdomain.com
3. 按 Cloudflare 提示完成 DNS
4. 验证 public URL 可访问测试文件
```

安全建议：

```text
图生视频参考图通过同源 /api/assets/upload 上传，由服务端写 R2
其他 signed upload URL 直传面需要 R2 bucket CORS 允许 app origin 的 OPTIONS/PUT 和 Content-Type
不要把 R2 secret 暴露给浏览器
storage_key 必须包含 userId
```

## 6. 配置 Wanxiang / Bailian API

操作：

```text
1. 获取百炼 DashScope API Key，用于图生视频、商品图和智能试衣。
2. 在 Vercel server env 和 Trigger.dev Production env 保存 DashScope key 和必要 endpoint override。
3. 用一张公开可访问图片测试百炼图生视频 submit/query，submit body 使用 `input.img_url`、`input.prompt` 和 `parameters.duration/resolution`。
4. 用两张公开可访问图片测试百炼 `wan2.7-image-pro` 图像编辑 submit/query，submit body 使用 `input.messages[].content[]` 图片和文本。
5. 记录一次图生视频、商品图、试衣的实际成本和平均耗时。
```

环境变量：

```text
DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/api/v1
DASHSCOPE_VIDEO_SYNTHESIS_URL=
DASHSCOPE_IMAGE_GENERATION_URL=
DASHSCOPE_TASKS_URL=
WANXIANG_IMAGE_TO_VIDEO_MODEL=wan2.6-i2v-flash
WANXIANG_IMAGE_TO_VIDEO_RESOLUTION=720P
WANXIANG_IMAGE_TO_VIDEO_PROMPT_EXTEND=true
WANXIANG_IMAGE_TO_VIDEO_AUDIO=false
WANXIANG_IMAGE_EDIT_MODEL=wan2.7-image-pro
WANXIANG_MODEL_CATALOG_URL=
```

验证方式：

```text
1. 运行 provider 单测或手动调用 Bailian DashScope submit/query
2. 确认 Bearer DASHSCOPE_API_KEY 鉴权成功
3. 确认 submit 返回 output.task_id
4. 确认 query 可以返回 running/succeeded/failed 终态
5. 确认输出 URL 可被 worker 记录为 final asset
```

注意：

```text
DASHSCOPE_API_KEY 只配置在 Vercel server env 和 Trigger.dev env。
不要使用 NEXT_PUBLIC_DASHSCOPE_API_KEY。
```

## 7. 创建 Trigger.dev project

操作：

```text
1. 打开 https://trigger.dev
2. Sign up / Log in
3. Create Project
4. Project name: ecommerce-video-prod
5. 复制 project ref 和 secret key
```

安装 SDK：

```bash
pnpm add @trigger.dev/sdk @trigger.dev/build
```

配置 `trigger.config.ts`：

```ts
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "your-project-ref",
});
```

Trigger.dev 环境变量：

```text
POSTGRES_URL=
DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/api/v1
DASHSCOPE_VIDEO_SYNTHESIS_URL=
DASHSCOPE_IMAGE_GENERATION_URL=
DASHSCOPE_TASKS_URL=
WANXIANG_IMAGE_TO_VIDEO_MODEL=wan2.6-i2v-flash
WANXIANG_IMAGE_TO_VIDEO_RESOLUTION=720P
WANXIANG_IMAGE_TO_VIDEO_PROMPT_EXTEND=true
WANXIANG_IMAGE_TO_VIDEO_AUDIO=false
WANXIANG_IMAGE_EDIT_MODEL=wan2.7-image-pro
WANXIANG_MODEL_CATALOG_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
RESEND_API_KEY=
EMAIL_FROM=
SENTRY_DSN=
```

Vercel 环境变量：

```text
TRIGGER_SECRET_KEY=
```

部署 task：

```bash
npx trigger.dev@latest deploy
```

验证：

```text
1. 在 Trigger.dev dashboard 看到 generate-wanxiang task
2. 手动触发一个测试 job
3. 查看 logs
4. 确认 job 可以从 queued/submitting/running 进入 succeeded 或 failed
```

## 8. 配置 Stripe

操作：

```text
1. 打开 https://stripe.com
2. 创建账户
3. 完成身份验证
4. 开发期使用 Test mode
5. 创建产品和价格
```

第一版产品：

```text
Starter Credits: 20 credits / R$10
Creator Credits: 80 credits / R$40
Scale Credits: 240 credits / R$120
```

建议价格需要覆盖模型成本：

```text
Starter: $9.99
Pro: $39.99
Business: $99.99
```

实际价格应根据 Wanxiang 各生成类型成本和失败重试摊销调整。

创建 webhook：

```text
1. Stripe Dashboard -> Developers -> Webhooks
2. Add endpoint
3. URL: https://app.yourdomain.com/api/stripe/webhook
4. Select events
```

监听事件：

```text
checkout.session.completed
payment_intent.succeeded
invoice.payment_succeeded
customer.subscription.updated
customer.subscription.deleted
```

环境变量：

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

验证：

```text
1. 使用 Stripe test card 4242 4242 4242 4242
2. 完成 checkout
3. webhook 收到事件
4. credit_ledger 写入 purchase
5. 用户 credits 增加
```

## 9. 配置 Resend

操作：

```text
1. 打开 https://resend.com
2. Sign up / Log in
3. Add Domain
4. 输入 yourdomain.com 或 mail.yourdomain.com
5. 按 Resend 提示在 Cloudflare 添加 DNS records
```

需要配置：

```text
SPF
DKIM
DMARC
```

环境变量：

```text
RESEND_API_KEY=
EMAIL_FROM=Video Maker <no-reply@yourdomain.com>
```

验证：

```text
1. 发送测试邮件到自己邮箱
2. 确认不进垃圾箱
3. 触发视频生成成功通知
4. 确认邮件内容正确
```

## 10. 配置 Sentry

操作：

```text
1. 打开 https://sentry.io
2. Create Project
3. Platform 选择 Next.js
4. 按向导安装 SDK
5. 保存 DSN
```

环境变量：

```text
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

接入范围：

```text
Next.js frontend
Next.js API routes
Trigger.dev task
Stripe webhook
Wanxiang provider
generation job credit settlement
```

验证：

```text
触发一个测试 error
确认 Sentry dashboard 能看到错误和 stack trace
```

## 11. 配置 PostHog

操作：

```text
1. 打开 https://posthog.com
2. Create project
3. 选择 Web
4. 复制 Project API Key
```

环境变量：

```text
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

MVP 事件：

```text
image_uploaded
generation_started
generation_succeeded
generation_failed
video_downloaded
checkout_started
checkout_completed
```

建议漏斗：

```text
访问 generate 页
-> image_uploaded
-> generation_started
-> generation_succeeded
-> video_downloaded
-> checkout_completed
```

验证：

```text
执行一次完整生成流程
在 PostHog 中看到事件
能按 userId 或 anonymousId 追踪
```

## 12. Vercel 环境变量总表

```text
BASE_URL=https://app.yourdomain.com
POSTGRES_URL=
AUTH_SECRET=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=ecommerce-video-prod
R2_PUBLIC_BASE_URL=https://cdn.yourdomain.com

TRIGGER_SECRET_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

RESEND_API_KEY=
EMAIL_FROM=

NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## 13. Trigger.dev 环境变量总表

```text
POSTGRES_URL=

DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/api/v1
DASHSCOPE_VIDEO_SYNTHESIS_URL=
DASHSCOPE_IMAGE_GENERATION_URL=
DASHSCOPE_TASKS_URL=
WANXIANG_IMAGE_TO_VIDEO_MODEL=wan2.6-i2v-flash
WANXIANG_IMAGE_TO_VIDEO_RESOLUTION=720P
WANXIANG_IMAGE_TO_VIDEO_PROMPT_EXTEND=true
WANXIANG_IMAGE_TO_VIDEO_AUDIO=false
WANXIANG_IMAGE_EDIT_MODEL=wan2.7-image-pro
WANXIANG_MODEL_CATALOG_URL=
TRIGGER_GENERATION_CONCURRENCY_LIMIT=5

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=ecommerce-video-prod
R2_PUBLIC_BASE_URL=https://cdn.yourdomain.com

RESEND_API_KEY=
EMAIL_FROM=

SENTRY_DSN=
```

## 14. 上线前检查

必须全部通过：

```text
域名 HTTPS 可访问
用户可以注册和登录
dashboard 可以访问
Stripe test payment 成功
付款后 credits 增加
图生视频 /api/assets/upload 成功，仍使用 signed upload 的页面确认 R2 bucket CORS 后直传成功
图片 public URL 可访问
创建 generation_job 成功
Trigger.dev 收到 task
Wanxiang 返回终态结果
provider final image/video 被 worker 复制到 R2
final image/video asset 写入 DB，public_url 使用 R2_PUBLIC_BASE_URL
user_media_history 写入 upload/generated 历史
任务状态变为 succeeded
用户可以预览和下载 final result
失败任务会返还 credits
Sentry 收到测试错误
PostHog 收到关键事件
```

## 15. 常见故障

### R2 上传失败

检查：

```text
R2_ACCESS_KEY_ID 是否正确
R2_SECRET_ACCESS_KEY 是否正确
bucket 名称是否正确
API token 是否有 bucket read/write 权限
signed URL 是否过期
文件大小是否超过限制
Trigger.dev worker 是否也配置了 R2 变量，用于复制 provider 输出结果
```

### Vercel API 超时

处理：

```text
不要在 Vercel API 里跑 provider submit/query。
Vercel API 只创建任务并触发 Trigger.dev。
```

### Wanxiang 生成失败

检查：

```text
DASHSCOPE_API_KEY 是否正确（图生视频、商品图、试衣）
对应 DashScope submit/query endpoint 是否仍可用
Trigger.dev worker env 是否包含 Bailian/Wanxiang、Postgres、R2 变量
img_url 是否公开可访问
prompt 是否过长或违规
```

### Legacy generate-video 被误触发

检查：

```text
Trigger.dev dashboard 是否错误部署或手动触发了 generate-video
生产配置是否仍引用旧 task id
应该使用 generate-wanxiang；旧 runner 是 disabled legacy
```

### Stripe webhook 不生效

检查：

```text
STRIPE_WEBHOOK_SECRET 是否来自正确 endpoint
webhook URL 是否是生产域名
是否使用 Test mode 对应 key
是否监听 checkout.session.completed
```

## 16. 回滚策略

Vercel：

```text
Project -> Deployments -> 选择上一个稳定版本 -> Promote to Production
```

Trigger.dev：

```text
暂停新任务
回滚到上一版 task deployment
失败任务人工重试或退款 credits
```

Stripe：

```text
支付问题优先暂停 checkout 按钮
不要删除 webhook
保留事件用于补偿处理
```

R2：

```text
不要批量删除 final-videos
如需清理，先按 created_at 和 job 状态导出清单
```
