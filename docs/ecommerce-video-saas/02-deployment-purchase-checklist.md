# 电商图生视频 SaaS 部署购买清单

更新时间：2026-06-05

本清单用于第一阶段 MVP。原则是最快上线、少运维、保留未来扩展空间。

第一阶段不租独立服务器。需要购买或开通的是托管云服务。

## 1. 总览

| 环节 | 服务 | 官网 | 第一阶段购买建议 | 是否租服务器 |
|---|---|---|---|---|
| 域名 | Cloudflare Registrar 或 Namecheap | https://www.cloudflare.com/products/registrar/ | 买 `.com` 或品牌域名 | 否 |
| DNS/CDN/安全 | Cloudflare | https://www.cloudflare.com | Free plan 起步 | 否 |
| 前端和短 API | Vercel | https://vercel.com | 商业项目用 Pro | 否 |
| 数据库 | Neon Postgres | https://neon.com | Free 起步，上线后 Launch | 否 |
| 后台任务 | Trigger.dev Cloud | https://trigger.dev | Free/Hobby 起步，上线后 Pro | 否 |
| 文件存储 | Cloudflare R2 | https://www.cloudflare.com/products/r2/ | Standard Storage | 否 |
| 生成模型 | Bailian DashScope / Wanxiang API | 按供应商账号/合同入口 | 图生视频开通百炼 DashScope API Key；商品图/试衣暂保留 Wanxiang APPCODE | 否 |
| 支付 | Stripe | https://stripe.com | 标准账户 | 否 |
| 邮件 | Resend | https://resend.com | Free 起步，Pro 视发送量升级 | 否 |
| 错误监控 | Sentry | https://sentry.io | Developer 免费，团队用 Team | 否 |
| 产品分析 | PostHog | https://posthog.com | Free 起步 | 否 |

## 2. 域名

推荐购买网站：

```text
Cloudflare Registrar: https://www.cloudflare.com/products/registrar/
Namecheap: https://www.namecheap.com
Porkbun: https://porkbun.com
```

购买内容：

```text
一个品牌主域名，例如 yourbrand.com
优先买 .com
如果面向特定市场，可以额外买 .ai, .video, .app
```

建议子域名：

```text
www.yourdomain.com: 官网
app.yourdomain.com: 登录后的产品应用
api.yourdomain.com: 可预留，MVP 可以不单独使用
cdn.yourdomain.com: 图片和视频访问域名
```

注意：

```text
域名和 DNS 最好都放 Cloudflare，减少后续配置复杂度。
如果在 Namecheap 买域名，也建议把 nameserver 指到 Cloudflare。
```

## 3. Cloudflare

官网：

```text
https://www.cloudflare.com
```

购买/开通：

```text
第一阶段 Cloudflare Free plan 足够。
R2 需要单独开通并绑定支付方式。
```

用途：

```text
DNS 解析
HTTPS
CDN
基础防护
R2 对象存储
cdn.yourdomain.com 自定义域名
```

R2 价格参考：

```text
Standard Storage:
  Free: 10 GB-month
  Paid: $0.015 / GB-month

Standard Class A operations:
  Free: 1 million
  Paid: $4.50 / million requests

Standard Class B operations:
  Free: 10 million
  Paid: $0.36 / million requests
```

官方说明：

```text
https://www.cloudflare.com/products/r2/
```

MVP 创建 bucket：

```text
ecommerce-video-prod
ecommerce-video-dev
```

R2 目录约定：

```text
uploads/
raw-videos/
final-videos/
thumbnails/
templates/
```

需要保存的环境变量：

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
```

## 4. Vercel

官网：

```text
https://vercel.com
```

购买建议：

```text
测试期可以 Hobby。
商业项目建议 Pro。
```

价格参考：

```text
Pro: $20/month + additional usage
```

官方价格：

```text
https://vercel.com/pricing
```

用途：

```text
部署 Next.js 前端页面
部署 Next.js API routes
自动 HTTPS
自动 CI/CD
预览环境
绑定 app.yourdomain.com 和 www.yourdomain.com
```

Vercel 不负责：

```text
provider submit/query 长轮询
GPU 推理
大文件永久存储
```

这些交给 Trigger.dev、Wanxiang、R2。

需要配置的环境变量示例：

```text
POSTGRES_URL=
BASE_URL=https://app.yourdomain.com
AUTH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
TRIGGER_SECRET_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_SENTRY_DSN=
```

## 5. Neon Postgres

官网：

```text
https://neon.com
```

购买建议：

```text
开发和 demo: Free
公开 beta 或正式上线: Launch
```

价格参考：

```text
Free:
  $0
  100 CU-hours monthly per project
  0.5 GB storage per project

Launch:
  Typical spend: $15/month
  $0.106 per CU-hour
  $0.35 per GB-month
```

官方价格：

```text
https://neon.com/pricing
```

用途：

```text
用户信息
生成任务
资产元数据
credits 账本
Stripe 支付记录
provider 调用记录
render 输出记录
```

不要存：

```text
图片文件本体
视频文件本体
大二进制文件
```

这些存 Cloudflare R2。

需要保存：

```text
POSTGRES_URL=
```

建议使用 Neon pooled connection string，适合 Vercel serverless 连接。

## 6. Trigger.dev Cloud

官网：

```text
https://trigger.dev
```

购买建议：

```text
开发: Free
小规模测试: Hobby
商业 beta: Pro
```

价格参考：

```text
Free: $0/month
Hobby: $10/month
Pro: $50/month
```

官方价格：

```text
https://trigger.dev/pricing/
```

用途：

```text
后台任务
任务队列
任务重试
长时间运行
任务日志
调用 Wanxiang submit/query
写入 final image/video asset
执行 credit capture/refund
记录 user_media_history
```

需要配置的环境变量：

```text
POSTGRES_URL=
DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/api/v1
DASHSCOPE_VIDEO_SYNTHESIS_URL=
DASHSCOPE_TASKS_URL=
WANXIANG_IMAGE_TO_VIDEO_MODEL=wan2.6-i2v-flash
WANXIANG_IMAGE_TO_VIDEO_RESOLUTION=720P
WANXIANG_IMAGE_TO_VIDEO_PROMPT_EXTEND=true
WANXIANG_IMAGE_TO_VIDEO_AUDIO=false

WANXIANG_APPCODE=
WANXIANG_CLOTH_SUBMIT_URL=
WANXIANG_CLOTH_QUERY_URL=
WANXIANG_TRY_ON_SINGLE_SUBMIT_URL=
WANXIANG_TRY_ON_MULTI_SUBMIT_URL=
WANXIANG_TRY_ON_QUERY_URL=
WANXIANG_MODEL_CATALOG_URL=
TRIGGER_GENERATION_CONCURRENCY_LIMIT=5
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
RESEND_API_KEY=
EMAIL_FROM=
SENTRY_DSN=
```

## 7. Wanxiang API

开通方式：

```text
确认供应商账号或合同入口
开通 APPCODE
确认图生视频、商品图、单件试衣、多件试衣、模特素材 catalog endpoint
用公开图片做 submit/query 联调
```

用途：

```text
图生视频 image_to_video
商品图 apparel_image
智能试衣 try_on
官方模特素材 catalog 同步
```

计费方式：

```text
不同生成类型价格不同。
图生视频通常按时长或任务计费。
商品图和试衣通常按任务计费。
需要单独记录成功、失败、重试、平均耗时和 provider 侧错误率。
```

推荐环境变量：

```text
DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/api/v1
DASHSCOPE_VIDEO_SYNTHESIS_URL=
DASHSCOPE_TASKS_URL=
WANXIANG_IMAGE_TO_VIDEO_MODEL=wan2.6-i2v-flash
WANXIANG_IMAGE_TO_VIDEO_RESOLUTION=720P
WANXIANG_IMAGE_TO_VIDEO_PROMPT_EXTEND=true
WANXIANG_IMAGE_TO_VIDEO_AUDIO=false

WANXIANG_APPCODE=
WANXIANG_CLOTH_SUBMIT_URL=
WANXIANG_CLOTH_QUERY_URL=
WANXIANG_TRY_ON_SINGLE_SUBMIT_URL=
WANXIANG_TRY_ON_MULTI_SUBMIT_URL=
WANXIANG_TRY_ON_QUERY_URL=
WANXIANG_MODEL_CATALOG_URL=
```

注意：

```text
DASHSCOPE_API_KEY 和 WANXIANG_APPCODE 只能存在服务端环境变量中。
不要放到 NEXT_PUBLIC_ 变量。
不要传给浏览器。
旧 fal.ai/FFmpeg runner 不是当前 active path；不要按旧 runner 采购或部署。
```

## 8. Stripe

官网：

```text
https://stripe.com
```

购买方式：

```text
无需月费
创建账户
完成企业或个人身份验证
按成功交易抽成
```

价格参考：

```text
美国 domestic cards 常见价格:
2.9% + $0.30 per successful transaction
```

官方价格：

```text
https://stripe.com/us/pricing
```

用途：

```text
credit 充值
订阅套餐
Checkout
Customer Portal
发票
退款
支付 webhook
```

第一版产品：

```text
Starter Credits
Pro Credits
Business Credits
```

需要环境变量：

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Webhook URL：

```text
https://app.yourdomain.com/api/stripe/webhook
```

## 9. Resend

官网：

```text
https://resend.com
```

购买建议：

```text
Free 起步。
邮件量变大或需要更稳定投递时升级 Pro。
```

价格参考：

```text
Free: $0/month, 3,000 emails/month
Pro: $20/month, 50,000 emails/month
```

官方说明：

```text
https://resend.com/docs/knowledge-base/what-is-resend-pricing
```

用途：

```text
登录邮件
注册确认
付款成功通知
生成完成通知
失败通知
密码重置
```

需要配置：

```text
发信域名
SPF
DKIM
DMARC
```

环境变量：

```text
RESEND_API_KEY=
EMAIL_FROM=Video Maker <no-reply@yourdomain.com>
```

## 10. Sentry

官网：

```text
https://sentry.io
```

购买建议：

```text
个人或开发期: Developer 免费
团队协作: Team
```

价格参考：

```text
Developer: $0
Team: $26/month
```

官方价格：

```text
https://sentry.io/pricing/
```

用途：

```text
前端错误监控
API route 错误监控
Trigger.dev task 错误监控
Stripe webhook 错误监控
Wanxiang provider 错误监控
generation job credit settlement 错误监控
```

环境变量：

```text
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

## 11. PostHog

官网：

```text
https://posthog.com
```

购买建议：

```text
Free 起步。
设置 billing limit，避免意外费用。
```

价格参考：

```text
免费额度:
1M analytics events/month
5K session recordings/month
1M feature flag requests/month
```

官方价格：

```text
https://posthog.com/pricing
```

用途：

```text
访问分析
生成漏斗
上传转化率
生成成功率
下载率
付费转化
留存
session replay
```

建议事件：

```text
image_uploaded
generation_started
generation_succeeded
generation_failed
video_downloaded
checkout_started
checkout_completed
```

环境变量：

```text
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## 12. 第一阶段不需要购买的东西

不要买：

```text
独立后端服务器
Redis 云服务
MySQL 云服务
GPU 云服务器
Kubernetes 集群
Nginx 服务器
专门 CDN 服务器
Remotion license
```

原因：

```text
Vercel 已经托管前端和短 API
Trigger.dev 已经托管队列和 worker
Neon 已经托管数据库
R2 已经托管媒体文件
Wanxiang 已经托管 GPU 推理
Trigger.dev worker 只负责 submit/query、状态更新、asset 和 credits 结算
```
