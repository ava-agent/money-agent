# MoneyAgent - 用 AI 赚钱的完全指南

基于 Next.js + Supabase 构建的 AI 赚钱方法指南网站，拥有丰富的视觉展示和交互体验。

**在线访问**: [money-agent-beryl.vercel.app](https://money-agent-beryl.vercel.app)

## 功能特色

### 内容
- **33 种赚钱方法** — 涵盖工作替代、投资管理、内容生产、技术服务等 8 大类别
- **5 大商业模式** — 月入 $10K+ 的商业模式详解，含定价策略和实际案例
- **汇率换算器** — 支持 18 种主要货币的实时换算
- **入门指南** — 安装部署教程、成本优化和 30 天路线图
- **风险提示** — 安全加固指南和竞品对比分析

### 视觉与交互
- **8 大类别颜色系统** — 每种类别独特的主题色 (蓝/翠绿/琥珀/靛蓝/粉/橙/紫/黄)
- **视觉数据指示器** — 难度圆点 (●●○) + 风险进度条
- **数字滚动动画** — 首页统计数字从 0 动态增长
- **分类筛选动画** — 切换类别时卡片淡入效果
- **方法详情侧边栏** — Sticky 信息卡，滚动时固定显示
- **折叠手风琴布局** — 入门指南可展开/收起
- **竞品特性矩阵** — ✓/— 可视化对比表

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 (App Router) | 全栈框架 |
| TypeScript | 类型安全 |
| Tailwind CSS 4 | 样式系统 + 自定义主题色 |
| Supabase | PostgreSQL 数据库 |
| Vercel | 部署平台 |
| react-markdown | Markdown 渲染 |
| ExchangeRate-API | 实时汇率 |

## 页面架构

| 路由 | 内容 | 渲染方式 |
|------|------|----------|
| `/` | 首页 Hero + 统计动画 + 功能卡片 | Static + Client |
| `/methods` | 33 种方法 + 统计摘要 + 8 类筛选 | ISR (1h) |
| `/methods/[slug]` | 方法详情 + 侧边信息卡 | SSG + ISR |
| `/models` | 5 大商业模式 (多彩渐变) | ISR (1h) |
| `/guide` | 入门指南 (折叠手风琴) | ISR (1h) |
| `/tools` | 汇率换算器 | Static + Client |
| `/about` | 关于 + 风险提示 + 竞品矩阵 | Static |

## 项目结构

```
src/
├── app/
│   ├── layout.tsx                 # 根布局 (Navbar + Footer)
│   ├── page.tsx                   # 首页 (FadeInOnScroll)
│   ├── methods/page.tsx           # 方法列表 (统计摘要)
│   ├── methods/[slug]/page.tsx    # 方法详情 (双栏 + 侧边栏)
│   ├── models/page.tsx            # 商业模式
│   ├── guide/page.tsx             # 入门指南 (Accordion)
│   ├── tools/page.tsx             # 工具集
│   ├── about/page.tsx             # 关于页 (特性矩阵)
│   ├── globals.css                # 全局样式 + 类别颜色变量
│   └── api/rates/route.ts         # 汇率代理 API
├── components/
│   ├── layout/                    # Navbar, Footer
│   ├── home/                      # HeroSection, HeroStats, AnimatedCounter, FeatureCard
│   ├── methods/                   # MethodCard, MethodGrid, CategoryFilter
│   ├── models/                    # BusinessModelCard
│   ├── shared/                    # MarkdownRenderer, Badge, PageHeader,
│   │                              # DifficultyDots, RiskBar, FadeInOnScroll
│   └── (汇率组件)                  # CurrencyConverter, CurrencySelect 等
├── hooks/
│   └── useExchangeRate.ts
└── lib/
    ├── supabase/                  # server.ts, types.ts
    ├── categoryColors.ts          # 8 大类别颜色映射
    ├── types.ts
    ├── currencies.ts
    └── cache.ts
```

## 类别颜色系统

| 类别 | 颜色 | Tailwind 变量 |
|------|------|---------------|
| 💼 工作替代类 | 蓝色 | `cat-job` |
| 📈 投资管理类 | 翠绿 | `cat-invest` |
| ✍️ 内容生产类 | 琥珀 | `cat-content` |
| 🔧 DevOps | 靛蓝 | `cat-devops` |
| 🏠 生活自动化 | 粉色 | `cat-life` |
| 🚀 创业销售 | 橙色 | `cat-startup` |
| 🔗 数据集成 | 紫罗兰 | `cat-data` |
| ₿ 加密货币 | 黄色 | `cat-crypto` |

使用方式：`border-cat-job`, `bg-cat-job-light`, `text-cat-job`

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

- `categories` — 8 大方法分类 (id, code, name, icon, sort_order)
- `methods` — 33 种赚钱方法 (含 difficulty, risk_level, income 字段)
- `business_models` — 5 大商业模式 (含 income_range, steps_markdown)
- `guide_sections` — 入门指南内容 (含 section_type)

所有表启用 RLS + 公开只读策略。

## 部署

项目已部署到 Vercel，Supabase 作为数据库。

环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## License

MIT
