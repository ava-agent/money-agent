# MoneyAgent - 用 AI 赚钱的完全指南

基于 Next.js + Supabase 构建的 AI 赚钱方法指南网站。

**在线访问**: [money-agent-beryl.vercel.app](https://money-agent-beryl.vercel.app)

## 功能

- **33 种赚钱方法** — 涵盖工作替代、投资管理、内容生产、技术服务等 8 大类别
- **5 大商业模式** — 月入 $10K+ 的商业模式详解，含定价策略和实际案例
- **分类筛选** — 按类别快速筛选，找到适合你的方法
- **汇率换算器** — 支持 18 种主要货币的实时换算
- **入门指南** — 安装部署教程、成本优化和 30 天路线图
- **风险提示** — 安全加固指南和竞品对比分析
- **Markdown 渲染** — 表格、代码块、列表等富文本内容展示

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 (App Router) | 全栈框架 |
| TypeScript | 类型安全 |
| Tailwind CSS 4 | 样式系统 |
| Supabase | PostgreSQL 数据库 |
| Vercel | 部署平台 |
| react-markdown | 内容渲染 |
| ExchangeRate-API | 实时汇率 |

## 页面架构

| 路由 | 内容 | 渲染方式 |
|------|------|----------|
| `/` | 首页 Hero + 功能卡片 | Static |
| `/methods` | 33 种方法卡片 + 8 类筛选 | ISR (1h) |
| `/methods/[slug]` | 方法详情 (Markdown) | SSG + ISR |
| `/models` | 5 大商业模式详解 | ISR (1h) |
| `/guide` | 入门指南 + 安装教程 | ISR (1h) |
| `/tools` | 汇率换算器 | Static + Client |
| `/about` | 关于 + 风险提示 + 竞品对比 | Static |

## 项目结构

```
src/
├── app/
│   ├── layout.tsx                 # 根布局 (Navbar + Footer)
│   ├── page.tsx                   # 首页
│   ├── methods/page.tsx           # 方法列表
│   ├── methods/[slug]/page.tsx    # 方法详情
│   ├── models/page.tsx            # 商业模式
│   ├── guide/page.tsx             # 入门指南
│   ├── tools/page.tsx             # 工具集
│   ├── about/page.tsx             # 关于页
│   └── api/rates/route.ts        # 汇率代理 API
├── components/
│   ├── layout/                    # Navbar, Footer
│   ├── home/                      # HeroSection, FeatureCard
│   ├── methods/                   # MethodCard, MethodGrid, CategoryFilter
│   ├── models/                    # BusinessModelCard
│   ├── shared/                    # MarkdownRenderer, Badge, PageHeader
│   └── (汇率组件)                  # CurrencyConverter, CurrencySelect 等
├── hooks/
│   └── useExchangeRate.ts
└── lib/
    ├── supabase/                  # server.ts, types.ts
    ├── types.ts
    ├── currencies.ts
    └── cache.ts
```

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 填入 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 数据库 (Supabase)

4 张数据表：

- `categories` — 8 大方法分类
- `methods` — 33 种赚钱方法
- `business_models` — 5 大商业模式
- `guide_sections` — 入门指南内容

所有表启用 RLS + 公开只读策略。

## 部署

项目已部署到 Vercel，Supabase 作为数据库。

环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
