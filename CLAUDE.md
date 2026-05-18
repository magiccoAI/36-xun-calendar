# 36-Xun Calendar 项目指南

## 项目概述
36-Xun Calendar 是一个基于36旬周期的时间感知应用，帮助用户以10天为单位重新丈量时间，专注于每日觉察和旬度反思。

## 项目结构
```
src/
├── components/     # 视图组件 (Modal, DetailView, SummaryView等)
├── core/          # 核心模块 (State, Calendar, app.js等)
├── styles/        # 样式文件 (design-tokens.css等)
├── config.js      # 配置文件
└── images/        # 静态资源
docs/
├── architecture.md    # 架构文档
├── integration-guide.md # 接入指南
└── reports/          # 实现报告
```

## 核心模块说明

### State.js - 中央状态管理
- Store pattern，统一管理所有应用状态
- 支持订阅机制，状态变更自动通知
- 持久化到 localStorage
- **关键**: 不要双重 setState()，避免双重渲染

### Calendar.js - 日期计算核心
- 36旬周期计算（年初开始的连续10天）
- **关键**: 必须使用 `parseDateStrToLocalDate()` 避免时区问题
- 必须使用 `startOfDay()` 归一化日期比较
- **注意**: `getCurrentXun()` 可能返回 null（非2026年）

### app.js - 主应用协调器
- 视图路由管理（macro, overview, detail, summary）
- 协调各组件渲染
- **注意**: 1076行大文件，避免随意修改

## 开发约束

### 日期处理 (P0 级别)
- **NEVER** 使用 `new Date(dateString)` 解析日期字符串
- **NEVER** 比较日期时不归一化到中午
- **ALWAYS** 处理 `getCurrentXun()` 返回 null

### 状态与持久化
- **NEVER** 直接使用 localStorage 键名，必须通过 `CONFIG.STORAGE_KEYS`
- **NEVER** 修改 State.js 数据结构不更新 `DAY_RECORD_SCHEMA`
- **NEVER** 同一用户动作从两处调用 `store.setState()`

### 事件绑定
- **NEVER** 在 app.js 和组件 JS 文件中为同一DOM元素绑定点击事件
- **NEVER** 使用 `cloneNode` + `replaceChild` 重新绑定事件
- **NEVER** 在 HTML 中添加内联 `onclick` 属性

### 样式系统
- **NEVER** 在 CSS 中硬编码颜色值，使用 design-tokens.css 变量
- **NEVER** 添加 `!important` 除非有文档说明原因
- **ALWAYS** 使用项目断点系统 (sm:600px, md:1024px)

### 架构变更
- **NEVER** 跨模块变更（State.js, Calendar.js, 共享模块）不先列出下游消费者
- **NEVER** 将 bug 修复与重构混在一起，分开 PR/commit
- **NEVER** 删除或削弱现有测试，除非用户明确指示

## 已知技术债务

### P0 关键Bug
1. **Double save logic** - app.js 和 Modal.js 双重保存
2. **getXunRange() vs getXunPeriods() 矛盾** - 旬定义不一致
3. **cloneNode DOM 替换** - showCropSelection() 中的引用失效

### P1 架构问题
4. **Breakpoint 系统三重冲突** - input.css, design-tokens.css, index.html 不一致
5. **内联 CSS 硬编码** - 700+ 行 <style> 硬编码颜色
6. **大文件问题** - app.js (1076行), Modal.js (1533行) 需要拆分

详见 [PROJECT_STATUS.md](PROJECT_STATUS.md) 完整列表

## 验证要求
- **ALWAYS** 修改 core/ 或 config.js 后运行 `npm test`
- **ALWAYS** CSS/HTML 变更后检查 375px, 768px, 1024px 响应式
- **ALWAYS** 页面加载后检查控制台无错误
- **ALWAYS** Modal.js 变更后测试完整弹窗流程

## 开发原则
- 用户体验最高准则，优先级高于技术偏好
- 为目标设计，不为功能设计
- 系统承担复杂性，不让用户思考
- 渐进式展示，先核心后细节

## 交互设计原则
**用户体验是所有产品的最高准则，优先级高于技术偏好、代码整洁度、架构优雅度。后端可以很复杂，但用户触碰到的每一层必须丝滑。**

这不只是 GUI——CLI、对话式交互、Skill、系统反馈，都是交互体验。所有界面都适用以下原则：

- **为目标设计，不为功能设计**：先问「用户要完成什么」，再决定怎么实现。不要因为技术上能做就加功能
- **不要让用户思考**：交互应该不言自明。需要说明书才能用，设计就是失败的
- **系统承担复杂性**：能自动化的不手动，能推断的不让用户填，能一步完成的不拆成三步
- **渐进式展示**：先给核心，细节按需展开。不要一次性把所有选项甩给用户
- **反馈引导行动**：不要只报告问题（"连接失败"），要引导下一步（"正在重试，预计 5 秒后恢复"）

## 工作方式
- 默认中文，代码、命令、变量名用英文
- 结论先行，再给理由，不要先铺垫背景
- 遇到模糊需求，先给最合理的方案，再问要不要调整
- 不要问「你确定要这样吗」——除非有真实风险

## 开发习惯
- 改完主动跑验证（test / lint / build），不要只改不验
- 不要为了让代码跑起来而注释掉报错，找根本原因
- 密钥、token、密码不进代码

## Git 与部署
- commit message 用英文，简洁描述变更意图
- git push 仅用于跨设备同步，不要自动执行，等我说
- 部署走项目自己的命令（查项目 CLAUDE.md），不依赖 git push
