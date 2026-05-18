# 36-Xun Calendar 接入指南

## 概述

36-Xun Calendar 是一个纯前端的 Web 应用，专注于时间感知和每日记录。本文档为开发者提供接入和扩展的完整指南。

## 技术栈

- **核心**: 原生 JavaScript (ES Modules)
- **样式**: Tailwind CSS 4.1.18
- **构建**: Vite 8.0.5
- **存储**: localStorage
- **图表**: Chart.js 4.5.1
- **农历**: lunar-javascript 1.7.7

## 快速开始

### 1. 环境要求
- Node.js 16+
- 现代浏览器 (Chrome 80+, Firefox 75+, Safari 13+)

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 构建生产版本
```bash
npm run build
```

## 项目结构

```
src/
├── components/     # 视图组件
├── core/          # 核心模块
├── styles/        # 样式文件
├── config.js      # 配置文件
└── images/        # 静态资源
```

## 核心模块接入

### State.js - 状态管理

```javascript
import { State } from './core/State.js';

// 获取状态实例
const state = new State();

// 订阅状态变更
state.subscribe((newState) => {
  console.log('状态已更新:', newState);
});

// 更新状态
state.setState({
  dayRecords: {
    ...state.state.dayRecords,
    '2026-04-29': {
      mood: 3,
      sleep: { start: '23:00', end: '07:00' },
      activities: ['阅读', '运动']
    }
  }
});
```

### Calendar.js - 日期计算

```javascript
import { Calendar } from './core/Calendar.js';

// 获取当前旬
const currentXun = Calendar.getCurrentXun();
console.log('当前旬:', currentXun);

// 获取年度所有旬
const xunPeriods = Calendar.getXunPeriods(2026);
console.log('年度旬列表:', xunPeriods);

// 时区安全的日期解析
const date = Calendar.parseDateStrToLocalDate('2026-04-29');
console.log('解析后的日期:', date);
```

### Modal.js - 弹窗系统

```javascript
import { Modal } from './components/Modal.js';

// 创建弹窗实例
const modal = new Modal();

// 显示每日记录弹窗
modal.showModal('daily', {
  date: '2026-04-29',
  initialData: {}
});

// 监听保存事件
modal.on('save', (data) => {
  console.log('保存的数据:', data);
});
```

## 数据结构

### 每日记录 (DayRecord)

```javascript
{
  date: '2026-04-29',
  mood: 3,                    // 情绪等级 1-5
  moodTags: ['平静', '专注'],    // 情绪标签
  sleep: {
    start: '23:00',            // 入睡时间
    end: '07:00',              // 起床时间
    quality: 4                 // 睡眠质量 1-5
  },
  activities: {
    exercise: true,            // 运动
    reading: true,             // 阅读
    social: false,             // 社交
    work: true                 // 工作
  },
  three_good_things: [         // 三件好事
    '完成了重要项目',
    '和朋友聊天很开心',
    '读了很好的书'
  ],
  money: {
    feeling: '充足',           // 金钱感受
    flow_type: '支持未来',      // 流动类型
    life_support: ['能力提升'], // 生活支持
    note: '今天收入不错'        // 备注
  },
  body_state: {
    energy: 4,                 // 精力水平 1-5
    health: '良好'              // 身体状态
  },
  letter_to_tomorrow: '明天要更专注' // 给明天的信
}
```

### 宏观目标 (MacroGoal)

```javascript
{
  xunIndex: 12,                // 旬索引
  goal: '完成项目第一阶段',     // 目标描述
  theme: '专注与执行',          // 主题
  created: '2026-04-29'        // 创建日期
}
```

## 自定义组件

### 创建新的视图组件

```javascript
// src/components/CustomView.js
export class CustomView {
  constructor(container) {
    this.container = container;
  }

  render(data) {
    this.container.innerHTML = `
      <div class="custom-view">
        <h2>自定义视图</h2>
        <div class="content">
          ${this.generateContent(data)}
        </div>
      </div>
    `;
  }

  generateContent(data) {
    // 自定义内容生成逻辑
    return '';
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
```

### 集成到主应用

```javascript
// 在 app.js 中注册新视图
import { CustomView } from './components/CustomView.js';

class App {
  constructor() {
    this.views = {
      macro: MacroView,
      overview: OverviewView,
      detail: DetailView,
      summary: SummaryView,
      custom: CustomView  // 新增自定义视图
    };
  }

  navigate(viewName, data) {
    const ViewClass = this.views[viewName];
    if (ViewClass) {
      const view = new ViewClass(this.mainContainer);
      view.render(data);
    }
  }
}
```

## 主题系统

### 使用设计令牌

```css
/* 在自定义组件中使用设计令牌 */
.custom-component {
  background-color: var(--color-primary-50);
  color: var(--color-primary-900);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}
```

### 切换主题

```javascript
import { ThemeManager } from './core/ThemeManager.js';

const themeManager = new ThemeManager();

// 切换到暗色主题
themeManager.setTheme('dark');

// 切换到季节主题
themeManager.setTheme('autumn');
```

## 数据持久化

### 导出数据

```javascript
import { State } from './core/State.js';

const state = new State();
const exportData = state.exportData();

// 下载为 JSON 文件
const blob = new Blob([JSON.stringify(exportData, null, 2)], {
  type: 'application/json'
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `36-xun-calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
a.click();
```

### 导入数据

```javascript
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      state.importData(data);
      console.log('数据导入成功');
    } catch (error) {
      console.error('数据导入失败:', error);
    }
  };
  
  reader.readAsText(file);
});
```

## 测试

### 单元测试

```javascript
// tests/Calendar.test.js
import { Calendar } from '../src/core/Calendar.js';

describe('Calendar', () => {
  test('getCurrentXun returns correct xun', () => {
    const date = new Date('2026-04-29');
    const xun = Calendar.getCurrentXun(date);
    expect(xun.index).toBe(12);
  });

  test('parseDateStrToLocalDate handles timezone correctly', () => {
    const dateStr = '2026-04-29';
    const date = Calendar.parseDateStrToLocalDate(dateStr);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(3);
    expect(date.getDate()).toBe(29);
  });
});
```

### E2E 测试

```javascript
// tests/e2e/daily-record.spec.js
import { test, expect } from '@playwright/test';

test('can create daily record', async ({ page }) => {
  await page.goto('/');
  
  // 点击日期
  await page.click('[data-date="2026-04-29"]');
  
  // 填写表单
  await page.selectOption('[data-testid="mood-select"]', '3');
  await page.fill('[data-testid="good-things-1"]', '完成了重要项目');
  
  // 保存
  await page.click('[data-testid="save-button"]');
  
  // 验证保存成功
  await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
});
```

## 部署

### GitHub Pages

```bash
# 构建项目
npm run build

# 部署到 GitHub Pages
npm run deploy
```

### 自定义服务器

```bash
# 构建项目
npm run build

# 将 dist/ 目录内容部署到服务器
rsync -av dist/ user@server:/var/www/36-xun-calendar/
```

## 扩展指南

### 添加新的记录类型

1. 在 `config.js` 中定义数据结构
2. 在 `Modal.js` 中添加 UI 组件
3. 在 `State.js` 中添加数据处理逻辑
4. 在 `XunSummary.js` 中添加统计逻辑

### 添加新的视图

1. 创建视图组件类
2. 在 `app.js` 中注册路由
3. 添加导航链接
4. 实现响应式布局

## 常见问题

### Q: 如何处理时区问题？
A: 使用 `Calendar.parseDateStrToLocalDate()` 和 `Calendar.startOfDay()` 确保时区一致性。

### Q: 如何扩展情绪标签？
A: 通过 `State.js` 的 `addCustomMood()` 方法添加自定义标签。

### Q: 如何备份数据？
A: 使用 `State.js` 的 `exportData()` 方法导出数据，或使用应用内的备份功能。

## 支持与反馈

- **问题反馈**: GitHub Issues
- **功能建议**: GitHub Discussions
- **技术文档**: 查看源码注释和测试用例
