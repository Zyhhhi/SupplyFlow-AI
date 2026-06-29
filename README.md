# SupplyFlow AI｜供应链执行 Copilot

SupplyFlow AI 是一个面向洞隐科技 AI 原生产品经理岗位的定制型 Concept MVP。它不是通用聊天机器人，而是围绕供应链执行场景设计的 B 端 AI 工作台，用于演示订单交付异常处理中的诊断、分析、推荐和协同流程。

## 项目定位

- 阶段：岗位定制型 Concept MVP
- 形态：Vite + React 单页工作台
- 场景：订单交付异常处理
- 目标：展示对 B 端供应链 SaaS、AI Copilot、Agent 工作流和产品原型落地的理解
- 边界：默认 Mock 模式，无真实后端、无数据库、无登录权限、无真实 OMS / WMS / TMS 接口

## 目标用户

- 供应链运营人员
- 订单管理人员
- 仓储协同人员
- 运输调度人员
- 客服 / 销售支持人员

## 核心场景

客户订单临近承诺发货时间，但出现库存不足、仓库拣货异常或运输排期延迟。业务人员需要快速判断异常原因、影响范围和可选处理方案，并生成内部协同与客户沟通话术。

## 核心流程

```text
异常输入 → 模拟业务数据读取 → Agent 工作流 → AI 诊断 → 影响分析 → 处理方案 → 协同话术 → 历史记录 → 用户反馈
```

## 功能模块

- 顶部说明区：产品名、定位、阶段标签、人工复核风险提示
- 异常输入区：订单号、客户类型、异常描述、关联仓库、预计交付时间、当前状态
- 示例案例：SKU 缺货、运输延迟、仓库拣货异常
- 模拟业务数据：OMS 订单数据、WMS 仓储 / 库存数据、TMS 运输数据
- AI 诊断：异常类型、风险等级、影响范围、涉及系统、可能原因、人工升级建议
- 影响分析：客户交付、仓库作业、运输排期、销售 / 客服沟通
- 处理方案推荐：拆单先发、跨仓调拨、延期交付
- 协同话术：仓库、运输团队、销售 / 客服、客户四类话术
- 历史记录：自动保存、回看、删除、清空
- 用户反馈：有帮助 / 一般 / 不准确，支持一句反馈
- 结果复用：复制客户话术、内部摘要、完整诊断报告

## Agent 工作流

```text
订单异常识别 Agent
→ 库存影响分析 Agent
→ 运输排期分析 Agent
→ 处理方案推荐 Agent
→ 协同话术生成 Agent
→ 人工确认
```

设计重点是把 AI 放在业务流程中，而不是把页面做成单一聊天框。AI 输出始终保留人工确认节点，避免夸大自动决策能力。

## Mock 数据说明

当前版本默认使用 Mock 数据，适合产品流程演示和面试现场展示。

- 示例案例数据位于 `src/mock/cases.js`
- AI 诊断兜底结果位于 `src/mock/aiResults.js`
- 历史记录和用户反馈保存在浏览器 `localStorage`
- 刷新页面后历史记录仍会保留

## API 配置占位

项目预留 DeepSeek API 配置说明，但第一版不接入真实 API，也不写死 API Key。

配置示例见 `.env.example`：

```bash
VITE_AI_MODE=mock
VITE_DEEPSEEK_API_KEY=
VITE_DEEPSEEK_API_URL=https://api.deepseek.com
```

说明：

- 默认 `VITE_AI_MODE=mock`
- 不要把真实 API Key 提交到仓库
- 如果后续接入真实模型，建议通过服务端或 Serverless 代理调用，避免在前端暴露 Key

## 本地运行

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 部署方式

这是一个 Vite + React 单页应用，适合部署到：

- Vercel
- Netlify
- GitHub Pages
- Hugging Face Space 静态站点

通用部署流程：

```bash
npm install
npm run build
```

构建产物位于 `dist/`。

Vercel / Netlify 推荐配置：

- Build Command：`npm run build`
- Output Directory：`dist`
- Install Command：`npm install`

## 面试讲解口径

我看到洞隐科技主要做供应链执行云平台和行业数字化方案，所以没有做通用聊天机器人，而是围绕订单交付异常场景，设计了一个供应链执行 Copilot。它模拟业务人员在订单、库存、仓储、运输信息分散的情况下，如何通过 AI 完成异常诊断、影响分析、方案推荐和协同话术生成。这个项目目前是岗位定制型 Concept MVP，重点展示我对 B 端业务流程、Agent 工作流和 AI 产品原型落地的理解。

可以进一步展开：

- 业务对象不是“聊天”，而是订单、库存、仓储、运输和客户承诺
- AI 输出不是大段文本，而是可复核的结构化结果
- Agent 工作流体现 AI 如何嵌入业务执行链路
- 历史记录和反馈用于模拟 Beta 阶段的产品闭环
- Mock 模式保证演示稳定，后续可通过 API 配置接入 DeepSeek

## 当前阶段

当前项目属于岗位定制型 Concept MVP，已经达到可用于 HR / 面试官查看的演示状态。它适合展示产品理解、流程设计、AI Copilot 落地方式和前端原型执行能力，但还不是 Beta-ready 产品。

## Beta-ready 还需要

- 真实企业身份、权限和操作审计
- 真实 OMS / WMS / TMS 数据接口
- DeepSeek 或其他模型的服务端代理调用
- 方案确认后的任务流转与负责人机制
- 日志、埋点、异常监控和反馈分析
- 更完整的测试、部署和安全策略
