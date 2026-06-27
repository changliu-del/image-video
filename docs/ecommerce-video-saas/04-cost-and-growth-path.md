# 电商图生视频 SaaS 成本和扩展路线

更新时间：2026-06-05

本文用于判断第一阶段成本、何时需要租服务器、何时从托管服务迁移到自建。

## 1. 第一阶段固定成本

不算视频模型生成成本，MVP 固定成本大致如下：

```text
域名: $10-$20/year
Vercel Pro: $20/month
Neon: $0-$15/month 起
Trigger.dev: $0-$50/month 起
Cloudflare R2: 早期几美元到几十美元
Resend: $0-$20/month
Sentry: $0 起
PostHog: $0 起
Stripe: 按交易抽成
Wanxiang: 按图生视频、商品图、试衣生成量消耗
```

推荐预算：

```text
内部测试期: $20-$50/month，不含视频生成
公开 beta: $80-$200/month，不含视频生成
有付费用户后: 根据视频生成量动态增长
```

## 2. 第一阶段不租服务器

明确不租：

```text
不租后端服务器
不租 Redis 服务器
不租 MySQL 服务器
不租 GPU 服务器
不租 Nginx/CDN 服务器
不租 Kubernetes 集群
```

原因：

```text
前端和短 API: Vercel
数据库: Neon
后台任务和队列: Trigger.dev Cloud
媒体文件: Cloudflare R2
生成模型: Wanxiang
任务编排: Trigger.dev worker 做 submit/query、asset 写入和 credits 结算
支付: Stripe
邮件: Resend
监控: Sentry + PostHog
```

第一阶段最重要的是验证：

```text
用户是否愿意上传商品图
生成质量是否可接受
用户是否下载视频
用户是否愿意付费
单条视频成本是否能被套餐覆盖
```

不要过早优化服务器成本。

## 3. 变量成本

变量成本主要来自：

```text
Wanxiang 生成任务
Trigger.dev 任务运行时间
Cloudflare R2 存储和请求
Vercel 超出用量
Stripe 支付抽成
Resend 邮件量
PostHog/Sentry 超出免费额度
```

单条视频成本公式：

```text
单条视频真实成本 =
  视频模型成本
  + Trigger.dev 任务执行成本
  + R2 存储和请求成本
  + 失败重试摊销
  + Stripe 支付摊销
  + 其他平台摊销
```

估算时不要只看模型价格。要把失败重试算进去。

示例：

```text
模型成本: $0.30/video
失败率: 15%
平均重试成本: $0.30 * 0.15 = $0.045
Trigger/R2/其他摊销: $0.03

单条成本约: $0.375
```

如果要毛利健康，售价要覆盖：

```text
模型成本
失败重试
平台成本
Stripe 抽成
客服和退款
利润
```

## 4. Credits 定价建议

不要把 Wanxiang APPCODE 或真实成本暴露给用户。用户购买平台 credits。

MVP credits 规则：

```text
1 credit = R$0.10
图生视频 Basic / 2.6 flash 5s: 25 credits
图生视频 Pro / 2.7 5s: 85 credits
失败任务: 全额返还
```

套餐示例：

```text
Starter: R$10 -> 100 credits
Creator: R$40 -> 400 credits
Scale: R$120 -> 1200 credits
```

上线前必须做一次成本校准：

```text
1. 用真实商品图分别跑图生视频、商品图、试衣样本
2. 记录每种生成类型的 Wanxiang 成本和成功率
3. 记录失败率和重试率
4. 记录平均 Trigger.dev 执行时间
5. 计算每种生成类型的平均成本
6. 调整 credits 定价
```

## 5. 成本护栏

必须设置：

```text
Wanxiang 每日预算提醒或供应商用量提醒
Vercel spend limit
Trigger.dev usage alert
PostHog billing limit
Cloudflare R2 用量提醒
Stripe radar 基础风控
每个用户每日生成上限
新用户免费额度上限
```

建议 MVP 限制：

```text
未付费用户: 最多 1-3 次免费生成
付费用户: 按 credits 消耗
单用户并发生成: 1-2 个
全局并发生成: 根据 Wanxiang endpoint capacity、Trigger.dev concurrency 和预算设置
图生视频时长: 固定 5 秒
最大上传图片: 10 MB
```

## 6. 什么时候开始租服务器

第一阶段不要租。只有满足下面任一条件时再考虑。

### 情况 1: Trigger.dev 成本明显高于自建 worker

触发信号：

```text
每日稳定 500+ 个生成任务
Wanxiang query/poll 占用大量 Trigger.dev 执行时间
Trigger.dev 月账单超过自建 worker 2-3 倍
```

迁移方案：

```text
保留 Vercel + Neon + R2
新增一台 CPU worker
用 BullMQ + Redis 或 Trigger.dev self-hosted
submit/query、asset 写入和 credit settlement 转到自建 worker
```

### 情况 2: 自定义后期渲染成为核心需求

触发信号：

```text
客户明确需要价格牌、字幕、行动按钮、logo、批量多比例导出
Wanxiang 输出后还必须做稳定后处理
后处理耗时和失败率开始影响交付
```

迁移方案：

```text
租 CPU 服务器或容器服务
专门跑 render worker 或恢复 FFmpeg/Remotion 方案
保留模型生成在 Wanxiang 或其他 provider
```

### 情况 3: 要自己跑开源视频模型

触发信号：

```text
Wanxiang 单条成本过高
每日生成量稳定
有明确模型选择，例如 LTX/Wan/ComfyUI
有工程能力维护 GPU 镜像
```

迁移方案：

```text
RunPod Serverless
Modal GPU
Vast.ai
自建 ComfyUI API
```

不建议直接买 GPU 服务器。先用 RunPod 或 Modal 验证成本。

### 情况 4: 企业客户要求私有化或固定出口

触发信号：

```text
企业客户要求 VPC
要求固定出口 IP
要求数据不出指定区域
要求自托管模型或专属 bucket
```

迁移方案：

```text
AWS ECS/Fargate
AWS RDS
AWS ElastiCache
S3/CloudFront 或继续 R2
专属 GPU endpoint
```

## 7. 扩展路线

### v1: 全托管 MVP

目标：

```text
最快上线
验证用户需求
验证生成质量
验证付费意愿
```

技术：

```text
Vercel + Neon + Trigger.dev + R2 + Wanxiang
```

### v2: 多模型供应商

目标：

```text
提高成功率
比较质量和成本
避免单一供应商风险
```

新增：

```text
ReplicateVideoProvider
RunPodVideoProvider
KlingOfficialProvider
WanxiangProvider
provider routing
provider fallback
模型成本报表
```

路由策略：

```text
便宜模型: 免费试用和草稿
高质量模型: 付费高清
备用模型: 主供应商失败时 fallback
```

### v3: 自建 CPU worker

目标：

```text
降低长轮询/状态处理成本
提高任务可控性
减少 Trigger.dev 执行时长
```

新增：

```text
CPU worker service
Redis/BullMQ 或 Trigger.dev self-hosted
generation queue
worker autoscaling
```

保留：

```text
Vercel
Neon
R2
Wanxiang
Stripe
```

### v4: 自建 GPU 或 serverless GPU

目标：

```text
降低大规模生成成本
支持自定义模型
支持 ComfyUI workflow
```

可选平台：

```text
RunPod Serverless
Modal GPU
Vast.ai
自建 GPU 机器
```

模型：

```text
LTX-Video
Wan
ComfyUI workflow
其他开源 image-to-video 模型
```

### v5: 企业版和增长优化

目标：

```text
服务团队客户
支持品牌规范
支持批量 SKU
支持多语言和多平台导出
```

新增：

```text
team workspace
brand kit
template library
batch generation
admin analytics
cost optimizer
quality scoring
content safety
API access
```

## 8. 关键指标

产品指标：

```text
访问到上传转化率
上传到生成转化率
生成成功率
生成到下载转化率
下载到付费转化率
7 日留存
每用户平均生成次数
```

成本指标：

```text
单条视频平均模型成本
单条视频平均平台成本
失败率
重试率
每个 provider 成功率
每个 provider 平均成本
毛利率
R2 存储增长
```

质量指标：

```text
用户下载率
用户重试率
用户删除率
人工评分
商品一致性失败率
文字错误率
```

## 9. 决策规则

何时继续用 Wanxiang：

```text
单条成本可控
成功率稳定
用户愿意付费
无需维护 GPU
团队更关注产品迭代
```

何时增加第二供应商：

```text
Wanxiang 失败率高
队列等待时间长
单一模型质量不稳定
用户对质量有明显不满
```

何时自建后处理 worker：

```text
后处理成本超过模型成本的 20%-30%
多尺寸导出成为核心功能
Trigger.dev 账单明显上涨
```

何时自建 GPU：

```text
每日生成量稳定
模型成本成为最大成本项
有能力维护 GPU 镜像和模型缓存
预计自建后节省超过 40%
```
