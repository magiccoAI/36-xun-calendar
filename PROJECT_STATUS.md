# 36-Xun Calendar 项目状态报告

> **更新时间**: 2026-05-11  
> **版本**: v1.2.0  
> **状态**: 🟢 稳定运行，开发中

---

## 📊 项目概览

### 基本信息
- **项目名称**: 2026 · 旬 (36-Xun Perspective Calendar)
- **版本**: v1.2.0
- **技术栈**: 原生 HTML5 + ES Modules + Tailwind CSS + Vite
- **部署状态**: GitHub Pages 已部署
- **本地开发**: ✅ 运行中 (http://localhost:3001)

### 核心特性
- 🕐 **36旬时间系统** - 重新定义年度时间感知
- 📝 **每日觉察记录** - 情绪、睡眠、活动、三件好事
- 💰 **金钱觉察模块** - 完整的金钱流向和感受记录
- 📊 **数据可视化** - 年度像素花园和趋势图表
- 🌙 **生理周期追踪** - 女性用户贴心功能

---

## 🏗️ 架构状态

### 代码规模统计
```
src/components/Modal.js                    1404 行 (最大文件)
src/components/MoneyObservationSummary.js  1218 行
src/components/MoneyAwarenessModule.js      819 行
src/components/MenstrualView.js             592 行
src/core/app.js                             549 行
src/core/XunSummary.js                      537 行
src/core/State.js                           354 行
src/core/Calendar.js                        374 行
```

### 模块健康度
- **🟢 核心模块**: State.js, Calendar.js, app.js 运行稳定
- **🟡 大文件风险**: Modal.js (1404行), MoneyObservationSummary.js (1218行) 需要拆分
- **🟢 测试覆盖**: 核心模块覆盖率 >80%
- **🟢 依赖管理**: Vite 构建系统正常，npm 依赖完整

---

## 🐛 Bug 注册表

### P0 - 关键逻辑 Bug
1. **Double save logic** - app.js 和 Modal.js 双重保存逻辑
   - 影响: 数据可能不一致
   - 状态: ⚠️ 待修复

2. **getXunRange() vs getXunPeriods() 矛盾** - 旬定义不一致
   - 影响: 日期范围计算错误
   - 状态: ⚠️ 待修复

3. **cloneNode DOM 替换** - showCropSelection() 中的引用失效
   - 影响: 事件绑定丢失
   - 状态: ⚠️ 待修复

### P1 - 架构设计 Bug
4. **Breakpoint 系统冲突** - 三处断点定义不一致
   - 影响: 响应式行为不可预测
   - 状态: ✅ 已修复 (最新提交)

5. **内联 CSS 硬编码** - 700+ 行硬编码颜色
   - 影响: 违反设计系统原则
   - 状态: ✅ 已修复 (最新提交)

6. **大文件问题** - app.js, Modal.js 需要拆分
   - 影响: 维护困难，耦合度高
   - 状态: 🟡 部分修复 (app.js 已重构)

### P2 - 性能和质量
7. **initPixelFarm() 全量重建** - 365个DOM节点每次重建
   - 影响: 性能问题
   - 状态: ⚠️ 待优化

8. **无 prefers-reduced-motion 保护** - 动画可能影响用户
   - 影响: 辅助功能问题
   - 状态: ⚠️ 待修复

### 当前测试状态
- **单元测试**: 103 通过, 2 失败
- **失败测试**: XunSummary.js 精力计算逻辑
- **E2E测试**: Playwright 配置就绪

---

## 📈 开发进度

### 近期完成 (2026-05)
- ✅ **修复 P1-1, P1-2**: 解决断点冲突和硬编码CSS颜色
- ✅ **MacroView 优化**: 表格设计和移动端UX改进
- ✅ **架构重构**: 从 app.js 提取模块，改善依赖关系
- ✅ **布局结构清理**: 主页布局优化

### v1.2.0 里程碑 (2026-03-08)
- 🎨 睡眠记录升级 - 双轴滑块
- 🛡️ 数据保护强化 - 存储说明和备份实践
- 🧪 测试覆盖提升 - 核心模块 >80%

### v1.1.0 里程碑 (2026-02-15)
- 💰 金钱觉察模块 - 完整记录系统
- 📊 金钱观察总结 - 旬度分析
- 🏷️ 智能标签系统 - 基于行为模式推荐

---

## 🗺️ 开发路线图

### Q2 2026 - v1.3.0 (计划中)
- 🔄 **社交功能** - 分享和互动功能
- 📱 **移动端优化** - PWA 功能增强
- 🧪 **测试完善** - 修复所有 P0/P1 Bug

### Q3 2026 - v1.4.0 (计划中)
- 📊 **数据分析增强** - 更深入的洞察
- 🎨 **UI/UX 重构** - 组件库标准化
- 🔧 **性能优化** - 大文件拆分，渲染优化

### Q4 2026 - v2.0.0 (计划中)
- 🏗️ **架构升级** - 微前端架构
- 🌐 **多语言支持** - 国际化
- 🔄 **数据同步** - 云端同步选项

---

## 🔧 技术债务优先级

### 高优先级 (立即处理)
1. **修复 XunSummary.js 测试失败** - 精力计算逻辑
2. **解决 Double save logic** - 数据一致性
3. **统一旬定义** - getXunRange() vs getXunPeriods()

### 中优先级 (本季度)
4. **拆分大文件** - Modal.js, MoneyObservationSummary.js
5. **优化性能** - PixelFarm 增量更新
6. **辅助功能** - prefers-reduced-motion 保护

### 低优先级 (下季度)
7. **Service Worker** - PWA 离线支持
8. **Focus Trap** - Modal 键盘导航
9. **代码质量** - ESLint, Prettier 配置

---

## 📋 质量保证

### 开发约束 (必须遵守)
- **日期处理**: 使用 `Calendar.parseDateStrToLocalDate()` 避免时区问题
- **状态管理**: 通过 `CONFIG.STORAGE_KEYS` 访问 localStorage
- **事件绑定**: 避免双重绑定，使用事件委托
- **样式系统**: 使用 design-tokens.css 变量，避免硬编码

### 验证清单
- ✅ 修改 core/ 或 config.js 后运行 `npm test`
- ✅ CSS/HTML 变更后检查响应式 (375px, 768px, 1024px)
- ✅ 页面加载后检查控制台无错误
- ✅ Modal.js 变更后测试完整弹窗流程

---

## 🚀 部署状态

### 生产环境
- **GitHub Pages**: ✅ 正常运行
- **访问地址**: https://magiccoai.github.io/36-xun-calendar/
- **版本**: v1.2.0 (2026-03-08)

### 开发环境
- **本地服务器**: ✅ 运行中 (http://localhost:3001)
- **构建状态**: ✅ 正常
- **依赖状态**: ✅ 完整

### 数据安全
- **存储方式**: 纯本地 localStorage
- **备份机制**: 手动导出 + 自动快照
- **隐私保护**: ✅ 无服务器，数据不上传

---

## 📞 联系与支持

### 项目信息
- **GitHub**: https://github.com/magiccoAI/36-xun-calendar
- **文档**: `/docs` 目录完整
- **Issues**: GitHub Issues 开放

### 开发团队
- **架构师**: magiccoAI
- **技术栈**: 原生 JavaScript + Tailwind CSS
- **开发理念**: 用户体验最高准则

---

## 🎯 下一步行动

### 立即行动 (本周)
1. **修复测试失败** - XunSummary.js 精力计算
2. **分析 Double save logic** - 制定修复方案
3. **代码审查** - 检查最新提交的影响

### 短期目标 (本月)
1. **解决 P0 Bug** - 数据一致性和日期计算
2. **性能优化** - PixelFarm 增量更新
3. **测试完善** - 达到 100% 测试通过

### 中期目标 (本季度)
1. **架构重构** - 拆分大文件
2. **功能增强** - v1.3.0 开发
3. **用户体验** - 移动端优化

---

*项目状态: 🟢 健康运行，开发活跃中*  
*最后更新: 2026-05-11*
