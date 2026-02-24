# 汇率换算器

基于 Next.js 构建的各国货币实时换算网站。

## 功能

- **实时汇率** — 通过 ExchangeRate-API 获取最新汇率数据
- **18 种主要货币** — CNY、USD、EUR、GBP、JPY、KRW、HKD、TWD、SGD、AUD、CAD、CHF、NZD、THB、MYR、PHP、INR、RUB
- **双向换算** — 在源和目标输入框均可输入金额，自动计算对方
- **一键交换** — 点击交换按钮快速互换货币
- **智能防重** — 选择相同货币时自动交换另一方
- **响应式设计** — 适配桌面和移动端

## 技术栈

- **框架**: Next.js 16 (App Router) + TypeScript
- **样式**: Tailwind CSS 4
- **汇率 API**: [ExchangeRate-API](https://open.er-api.com/) (免费，无需 API Key)
- **缓存**: 服务端内存缓存，10 分钟 TTL

## 项目结构

```
src/
├── app/
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 主页面
│   ├── globals.css           # 全局样式
│   └── api/rates/route.ts    # 汇率代理 API
├── components/
│   ├── CurrencyConverter.tsx # 主换算器组件
│   ├── CurrencySelect.tsx    # 货币下拉选择
│   ├── AmountInput.tsx       # 金额输入框
│   ├── SwapButton.tsx        # 交换按钮
│   └── RateDisplay.tsx       # 汇率信息显示
├── hooks/
│   └── useExchangeRate.ts    # 汇率数据 Hook
└── lib/
    ├── types.ts              # TypeScript 类型
    ├── currencies.ts         # 货币元数据
    └── cache.ts              # 服务端缓存
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

访问 http://localhost:3000 即可使用。

## API

### GET /api/rates?base=USD

返回以指定货币为基准的汇率数据。

**响应示例:**

```json
{
  "base": "USD",
  "rates": {
    "CNY": 6.9157,
    "EUR": 0.849,
    "JPY": 155.09
  },
  "lastUpdated": "Sat, 21 Feb 2026 00:02:32 +0000"
}
```

## 设计决策

| 决策 | 原因 |
|------|------|
| 始终以 USD 为基准获取汇率 | 只需缓存一份数据，任意货币对通过交叉汇率计算 |
| 服务端代理 API | 避免 CORS 问题，可添加缓存层 |
| 内存缓存 10 分钟 | 免费 API 每日更新，10 分钟足够新鲜且节省请求 |
| Emoji 国旗 | 无需图片资源，现代浏览器全面支持 |
| 原生 `<select>` | 移动端体验最佳，无障碍友好，零依赖 |
| JPY/KRW 显示 0 位小数 | 符合实际货币使用习惯 |
