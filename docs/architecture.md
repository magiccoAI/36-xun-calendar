# 36-Xun Calendar 架构文档

## 概述

36-Xun Calendar 是一个基于原生 JavaScript 的 Web 应用，采用模块化架构设计，专注于时间感知和每日记录。

## 技术栈

- **前端框架**: 原生 HTML5 + JavaScript (ES Modules)
- **样式系统**: Tailwind CSS 4.1.18
- **构建工具**: Vite 8.0.5
- **数据存储**: localStorage (纯本地存储)
- **图表库**: Chart.js 4.5.1
- **农历支持**: lunar-javascript 1.7.7
- **测试框架**: Jest 30.2.0 (单元测试), Playwright 1.58.1 (E2E测试)

## 项目结构

```
src/
├── components/          # 视图组件
│   ├── Modal.js         # 每日记录弹窗 (68KB, 1533行)
│   ├── DetailView.js    # 旬详情视图 (20KB)
│   ├── SummaryView.js   # 旬总结视图 (38KB)
│   ├── MacroView.js     # 36旬宏观视图 (10KB)
│   ├── OverviewView.js  # 年度概览 (10KB)
│   ├── MoneyAwarenessModule.js    # 金钱觉察模块 (41KB)
│   ├── MoneyObservationSummary.js # 金钱观察总结 (52KB)
│   ├── MenstrualView.js  # 生理周期追踪 (28KB)
│   ├── BackupModal.js    # 数据备份弹窗 (10KB)
│   ├── SettingsModal.js  # 设置弹窗 (10KB)
│   ├── sleep/            # 睡眠模块子组件
│   ├── MacroView/        # 宏观视图子组件
│   └── web-components/   # Web Components
├── core/                # 核心模块
│   ├── State.js         # 状态管理 (15KB)
│   ├── Calendar.js      # 日期计算 (15KB)
│   ├── app.js           # 主应用 (25KB)
│   ├── XunSummary.js    # 旬数据统计 (23KB)
│   ├── BackupManager.js # 备份管理 (6KB)
│   ├── BackgroundLoader.js # 背景加载 (7KB)
│   ├── ThemeManager.js  # 主题管理 (2KB)
│   ├── YearProgress.js  # 年度进度 (6KB)
│   ├── NavigationManager.js # 导航管理 (2KB)
│   └── PixelFarm.js     # 像素花园 (8KB)
├── config.js            # 配置文件 (4KB)
├── quote.js             # 每日金句系统 (5KB)
├── styles/              # 样式文件
│   ├── design-tokens.css    # 设计令牌 (5KB)
│   ├── body-state.css       # 身体状态样式 (11KB)
│   └── responsive-backgrounds.css # 响应式背景 (4KB)
├── input.css            # Tailwind入口 (3KB)
├── output.css           # 编译后的CSS (135KB)
└── images/              # 静态资源
```

## 核心架构

### 状态管理 (State.js)

采用 Store pattern，统一管理所有应用状态：

```javascript
class State {
  constructor() {
    this.state = {
      dayRecords: {},        // 每日记录
      macroGoals: {},        // 宏观目标
      customMoods: [],       // 自定义情绪
      customNourishments: [], // 自定义滋养
      menstrualData: {},     // 生理周期数据
      settings: {}          // 应用设置
    };
  }
  
  setState(updates) { /* 状态更新 */ }
  subscribe(callback) { /* 订阅机制 */ }
  exportData() { /* 数据导出 */ }
  importData(data) { /* 数据导入 */ }
}
```

**特点**:
- 支持订阅机制，状态变更自动通知订阅者
- 持久化到 localStorage，支持自动备份
- 管理的数据包括：用户记录、宏观目标、自定义情绪/滋养、生理周期、设置等

### 日期计算 (Calendar.js)

提供36旬周期计算和时区安全的日期处理：

```javascript
class Calendar {
  static getCurrentXun(date = new Date()) { /* 获取当前旬 */ }
  static getXunPeriods(year) { /* 获取年度所有旬 */ }
  static parseDateStrToLocalDate(dateStr) { /* 时区安全的日期解析 */ }
  static startOfDay(date) { /* 日期归一化 */ }
  static formatLocalDate(date, format) { /* 日期格式化 */ }
}
```

**关键设计**:
- 36旬周期：从年初开始的连续10天周期
- 时区安全：避免 `new Date(dateString)` 的时区问题
- 动态年份支持：2026-2100年

### 主应用 (app.js)

视图路由和交互协调：

```javascript
class App {
  constructor() {
    this.currentView = 'macro';
    this.modal = null;
    this.themeManager = new ThemeManager();
  }
  
  navigate(view) { /* 视图切换 */ }
  showModal(type) { /* 弹窗显示 */ }
  bindEvents() { /* 事件绑定 */ }
}
```

**职责**:
- 视图路由管理（macro, overview, detail, summary）
- 协调各视图组件的渲染
- 处理弹窗、备份、设置等交互
- 移动端FAB、滚动高亮等UI增强

### 旬数据统计 (XunSummary.js)

数据聚合和洞察生成：

```javascript
class XunSummary {
  static buildXunSummary(xunIndex, year = 2026) {
    return {
      sleepStats: {},        // 睡眠统计
      energyStats: {},       // 精力统计
      activityStats: {},     // 活动统计
      moodStats: {},         // 情绪统计
      three_good_things: [], // 三件好事
      moneyObservations: []  // 金钱观察
    };
  }
}
```

## 数据流

```
用户交互 → Modal/DetailView → State.setState() → localStorage持久化 → 订阅者通知 → 视图重渲染
```

## 设计模式

### 1. 模块化模式
- ES Modules 按功能划分
- 清晰的依赖关系
- 便于测试和维护

### 2. 观察者模式
- State.js 的订阅机制
- 状态变更自动更新视图
- 解耦数据和UI

### 3. 单例模式
- 各种 Manager 类的单例设计
- 全局状态和配置管理

### 4. 策略模式
- 主题切换策略
- 不同视图的渲染策略

## 关键特性

### 1. 时区安全
所有日期处理都通过 `Calendar.parseDateStrToLocalDate()` 和 `Calendar.startOfDay()` 确保时区一致性。

### 2. 数据持久化
纯本地存储，无服务器依赖，支持数据导入导出。

### 3. 响应式设计
移动优先，支持多种屏幕尺寸和设备。

### 4. 模块化架构
高内聚低耦合，便于功能扩展和维护。

## 性能考虑

### 1. 懒加载
视图组件按需加载，减少初始加载时间。

### 2. 事件委托
使用事件委托减少事件监听器数量。

### 3. 虚拟滚动
长列表使用虚拟滚动优化性能。

### 4. 缓存策略
计算结果缓存，避免重复计算。

## 安全考虑

### 1. 数据验证
所有用户输入都经过验证和清理。

### 2. XSS 防护
动态内容生成时进行 XSS 防护。

### 3. 数据隐私
所有数据仅存储在本地，不传输到服务器。

## 扩展性

### 1. 插件系统
预留插件接口，支持功能扩展。

### 2. 主题系统
基于 CSS 变量的主题系统，支持自定义主题。

### 3. 国际化
预留国际化接口，支持多语言。

## 已知技术债务

### P0 (关键)
- Double save logic
- getXunRange() vs getXunPeriods() 矛盾
- cloneNode DOM 替换问题

### P1 (架构)
- Breakpoint 系统冲突
- app.js 和 Modal.js 文件过大
- 内联 CSS 硬编码

### P2 (性能)
- initPixelFarm() 全量重建
- 无 prefers-reduced-motion 保护
- CDN 依赖未通过 Vite 打包

详见 [PROJECT_STATUS.md](../PROJECT_STATUS.md)
