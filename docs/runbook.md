# 36-Xun Calendar 运维手册

## 概述

本文档提供 36-Xun Calendar 项目的部署、维护和故障排查指南。

## 环境要求

### 开发环境
- Node.js 16.0+
- npm 7.0+
- 现代浏览器 (Chrome 80+, Firefox 75+, Safari 13+)

### 生产环境
- 静态文件服务器 (Nginx, Apache, GitHub Pages 等)
- HTTPS 证书推荐
- CDN 可选

## 部署指南

### 1. 本地开发

```bash
# 克隆项目
git clone https://github.com/magiccoAI/36-xun-calendar.git
cd 36-xun-calendar

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 2. 生产构建

```bash
# 构建项目
npm run build

# 构建结果在 dist/ 目录
ls -la dist/
```

### 3. GitHub Pages 部署

```bash
# 自动部署到 GitHub Pages
npm run deploy

# 或手动构建后推送
npm run build
git add dist/
git commit -m "Build for production"
git subtree push --prefix dist origin gh-pages
```

### 4. 自定义服务器部署

```bash
# 构建项目
npm run build

# 复制到服务器目录
rsync -av dist/ user@server:/var/www/36-xun-calendar/

# Nginx 配置示例
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/36-xun-calendar;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 环境变量

### 开发环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_DEBUG=true
VITE_MOCK_DATA=true
```

### 生产环境变量

```bash
# .env.production
VITE_API_BASE_URL=https://api.your-domain.com
VITE_DEBUG=false
VITE_MOCK_DATA=false
```

## 数据管理

### 数据存储位置
- **浏览器本地**: localStorage
- **数据键名**: 通过 `CONFIG.STORAGE_KEYS` 管理
- **备份格式**: JSON 文件

### 备份策略

#### 自动备份
```javascript
// 在 State.js 中配置自动备份
const AUTO_BACKUP_ENABLED = true;
const MAX_BACKUP_COUNT = 7;
```

#### 手动备份
```javascript
// 导出数据
const state = new State();
const backup = state.exportData();

// 下载备份文件
const blob = new Blob([JSON.stringify(backup, null, 2)], {
  type: 'application/json'
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
a.click();
```

#### 数据恢复
```javascript
// 导入数据
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  const data = JSON.parse(text);
  
  // 验证数据格式
  if (validateBackupFormat(data)) {
    state.importData(data);
    alert('数据恢复成功');
  } else {
    alert('数据格式无效');
  }
});

fileInput.click();
```

## 监控与日志

### 前端监控

#### 错误捕获
```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // 发送到监控服务
  sendToMonitoring({
    type: 'error',
    message: event.error.message,
    stack: event.error.stack,
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
});

// Promise 错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // 发送到监控服务
  sendToMonitoring({
    type: 'promise_rejection',
    reason: event.reason,
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
});
```

#### 性能监控
```javascript
// 页面加载性能
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart);
  
  // 发送性能数据
  sendToMonitoring({
    type: 'performance',
    loadTime: perfData.loadEventEnd - perfData.loadEventStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
    timestamp: new Date().toISOString()
  });
});
```

### 用户行为分析

```javascript
// 用户交互追踪
function trackUserAction(action, data) {
  sendToMonitoring({
    type: 'user_action',
    action: action,
    data: data,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
}

// 使用示例
trackUserAction('daily_record_save', { date: '2026-04-29' });
trackUserAction('view_change', { from: 'macro', to: 'detail' });
```

## 故障排查

### 常见问题

#### 1. 页面加载失败
**症状**: 白屏或加载错误
**排查步骤**:
1. 检查浏览器控制台错误
2. 验证静态资源是否正确加载
3. 检查网络连接
4. 验证服务器配置

**解决方案**:
```bash
# 检查构建文件
npm run build
ls -la dist/

# 验证服务器配置
curl -I http://your-domain.com/
```

#### 2. 数据丢失
**症状**: 用户数据消失
**排查步骤**:
1. 检查 localStorage 可用性
2. 验证数据格式
3. 检查浏览器隐私设置
4. 查看数据导入导出日志

**解决方案**:
```javascript
// 检查 localStorage
if (typeof Storage !== 'undefined') {
  console.log('localStorage 可用');
} else {
  console.error('localStorage 不可用');
}

// 检查数据完整性
function validateData(data) {
  return data && typeof data === 'object' && data.dayRecords;
}
```

#### 3. 日期计算错误
**症状**: 旬显示不正确
**排查步骤**:
1. 检查时区设置
2. 验证日期解析逻辑
3. 检查 `getCurrentXun()` 返回值
4. 验证 `getXunPeriods()` 计算

**解决方案**:
```javascript
// 调试日期计算
const date = new Date('2026-04-29');
const xun = Calendar.getCurrentXun(date);
console.log('Current xun:', xun);

// 验证时区
console.log('Timezone offset:', date.getTimezoneOffset());
console.log('UTC date:', date.toUTCString());
```

#### 4. 样式显示异常
**症状**: UI 显示错乱
**排查步骤**:
1. 检查 CSS 文件加载
2. 验证 Tailwind CSS 编译
3. 检查设计令牌
4. 验证响应式断点

**解决方案**:
```bash
# 重新构建 CSS
npm run build:css

# 检查 CSS 变量
console.log(getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500'));
```

### 调试工具

#### 开发者工具
```javascript
// 调试模式
const DEBUG_MODE = true;

function debugLog(message, data) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// 状态检查
function checkAppState() {
  const state = new State();
  debugLog('Current state:', state.state);
  debugLog('LocalStorage keys:', Object.keys(localStorage));
}

// 日期检查
function checkDateCalculations() {
  const now = new Date();
  const xun = Calendar.getCurrentXun(now);
  debugLog('Date check:', {
    now: now,
    xun: xun,
    dateString: Calendar.formatLocalDate(now)
  });
}
```

#### 性能分析
```javascript
// 性能标记
performance.mark('app-start');

// 应用初始化
// ... 应用代码

performance.mark('app-end');
performance.measure('app-init', 'app-start', 'app-end');

const measures = performance.getEntriesByType('measure');
console.log('Performance measures:', measures);
```

## 维护任务

### 定期检查清单

#### 每周检查
- [ ] 检查错误日志
- [ ] 监控页面加载性能
- [ ] 验证数据备份功能
- [ ] 检查依赖更新

#### 每月检查
- [ ] 运行完整测试套件
- [ ] 检查安全漏洞
- [ ] 分析用户行为数据
- [ ] 优化性能瓶颈

#### 每季度检查
- [ ] 评估架构健康度
- [ ] 规划技术债务清理
- [ ] 更新文档
- [ ] 备份策略审查

### 依赖管理

```bash
# 检查过期依赖
npm outdated

# 更新依赖
npm update

# 安全审计
npm audit

# 修复安全漏洞
npm audit fix
```

### 版本发布

```bash
# 1. 更新版本号
npm version patch  # 或 minor, major

# 2. 生成变更日志
npm run changelog

# 3. 构建项目
npm run build

# 4. 运行测试
npm test

# 5. 提交变更
git add .
git commit -m "Release v1.2.1"
git tag v1.2.1

# 6. 推送
git push origin main
git push origin v1.2.1
```

## 安全考虑

### 前端安全
- 输入验证和清理
- XSS 防护
- CSP 策略配置
- HTTPS 强制使用

### 数据安全
- 本地存储加密
- 敏感数据不存储
- 定期数据清理
- 安全的数据传输

### 服务器安全
- 文件上传限制
- 访问日志记录
- 防火墙配置
- 定期安全扫描

## 联系信息

- **技术支持**: support@example.com
- **安全问题**: security@example.com
- **GitHub Issues**: https://github.com/magiccoAI/36-xun-calendar/issues
