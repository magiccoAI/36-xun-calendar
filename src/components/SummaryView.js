import { buildXunSummary, getRangeLabel, getRecordsByCurrentXun } from '../core/XunSummary.js';
import { store } from '../core/State.js';
import { renderSleepTrendChart } from './XunSleepTrendChart.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';
import { MoneyObservationSummaryComponent } from './MoneyObservationSummary.js';

const emotionWordCloud = (emotionFrequency) => {
    const entries = Object.entries(emotionFrequency).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
        return '<p class="text-sm text-gray-500">本旬暂无情绪标签记录。</p>';
    }

    const maxCount = Math.max(...entries.map(([, count]) => count));
    const minCount = Math.min(...entries.map(([, count]) => count));
    const sizeClassByWeight = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'];
    const normalizeWeight = (count) => {
        if (maxCount === minCount) return 2;
        const ratio = (count - minCount) / (maxCount - minCount);
        return Math.min(4, Math.max(0, Math.round(ratio * 4)));
    };

    return `
        <div class="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3">
            ${entries.map(([emotion, count]) => `
                <div
                    class="inline-flex items-end gap-1 rounded-full bg-white px-3 py-1 shadow-sm ${sizeClassByWeight[normalizeWeight(count)]}"
                    title="${emotion} · ${count}次"
                >
                    <span class="font-medium text-gray-700">${emotion}</span>
                    <span class="text-[10px] font-semibold text-gray-400">${count}</span>
                </div>
            `).join('')}
        </div>
    `;
};

// 新增：能量条生成函数
const energyBar = (energy, maxEnergy = 10) => {
    if (energy === null || energy === undefined) return '--';
    const percentage = (energy / maxEnergy) * 100;
    const barLength = Math.round(percentage / 10); // 0-10个字符
    return '▇'.repeat(barLength) + '░'.repeat(10 - barLength);
};

// 新增：10天能量条显示
const energyBarsGrid = (summary) => {
    if (!summary.highEnergyDates || summary.highEnergyDates.length === 0) {
        return '<p class="text-xs text-gray-400">暂无高精力日记录</p>';
    }
    
    return `
        <div class="grid grid-cols-5 gap-1 text-xs">
            ${summary.highEnergyDates.map(date => {
                const dayNum = new Date(date).getDate();
                return `<div class="text-center">
                    <div class="text-gray-400">${dayNum}日</div>
                    <div class="text-xs leading-none">${energyBar(7)}</div>
                </div>`;
            }).join('')}
        </div>
    `;
};

// 三件好事汇总模块生成函数
const generateGoodThingsSection = (summary) => {
    if (!summary.three_good_things || summary.three_good_things.length === 0) return '';

    const completionRate = Math.round((summary.good_things_stats.total_days / 10) * 100);

    return `
        <section class="rounded-2xl border border-gray-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm md:col-span-2 relative overflow-hidden">
            <!-- 背景装饰 -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
            <div class="absolute bottom-0 left-0 w-24 h-24 bg-orange-100 rounded-full opacity-20 translate-y-12 -translate-x-12"></div>
            
            <div class="relative z-10">
                <!-- 标题和统计 -->
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-base font-medium text-gray-700 flex items-center gap-2">
                        <span class="w-1 h-4 rounded-full bg-amber-400"></span> 
                        <span class="text-lg">✨ 本旬美好回顾</span>
                    </h3>
                    <div class="flex items-center gap-4 text-sm">
                        <div class="flex items-center gap-1 text-amber-600">
                            <span class="text-xs">📝</span>
                            <span class="font-medium">${summary.good_things_stats.total_days}/10 天</span>
                        </div>
                        <div class="flex items-center gap-1 text-orange-600">
                            <span class="text-xs">🎯</span>
                            <span class="font-medium">${completionRate}%</span>
                        </div>
                    </div>
                </div>

                
                <!-- 时间线展示 -->
                <div class="space-y-4">
                    ${Object.entries(summary.three_good_things_by_date)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([date, things]) => {
                            const dateObj = new Date(date);
                            const monthDay = `${dateObj.getMonth() + 1}.${dateObj.getDate()}`;
                            const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dateObj.getDay()];
                            
                            return `
                                <div class="bg-white/60 rounded-xl p-4 border border-amber-100/50 hover:shadow-md transition-all duration-300 hover:bg-white/80">
                                    <div class="flex items-start gap-3">
                                        <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            ${dateObj.getDate()}
                                        </div>
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="text-sm font-medium text-gray-700">${monthDay}</span>
                                                <span class="text-xs text-gray-400">${weekDay}</span>
                                                ${things.length >= 3 ? '<span class="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">满记录</span>' : ''}
                                            </div>
                                            <div class="space-y-2">
                                                ${things.map((thing, index) => `
                                                    <div class="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                                                        <span class="flex-shrink-0 w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                                                            ${index + 1}
                                                        </span>
                                                        <span class="flex-1 hover:text-amber-700 transition-colors">${thing}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                </div>

                <!-- 感恩寄语 -->
                <div class="mt-6 p-4 bg-gradient-to-r from-amber-100/50 to-orange-100/50 rounded-xl border border-amber-200/50">
                    <div class="flex items-start gap-2">
                        <span class="text-2xl">💝</span>
                        <div class="flex-1">
                            <div class="text-sm font-medium text-amber-800 mb-1">感恩时刻</div>
                            <p class="text-xs text-amber-600 leading-relaxed">
                                这${summary.good_things_stats.total_days}天里，您记录了${summary.good_things_stats.total_items}件美好小事。
                                ${summary.good_things_stats.total_days >= 7 ? '您真是个善于发现美好的生活观察家！' : '继续保持这份发现美好的心，让每个日子都闪闪发光。'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
};

export class SummaryView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render() {
        if (!this.container) return;

        // 订阅状态变化
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.unsubscribe = store.subscribe((state, key, value) => {
            if (key === 'userData' || key === 'viewedXunIndex' || key === 'currentView') {
                this.refresh();
            }
        });

        this.refresh();
    }

    refresh() {
        if (!this.container) {
            console.error('❌ Container not found!');
            return;
        }

        // 获取当前选中的旬索引，确保显示正确的旬数据
        const state = store.getState();
        const xunPeriods = Calendar.getXunPeriods(CONFIG.YEAR);
        const targetPeriod = xunPeriods.find(p => p.index === state.viewedXunIndex);
        const targetDate = targetPeriod ? targetPeriod.startDate : new Date();
        
        console.log('🎯 Xun Summary Debug:');
        console.log('Current viewedXunIndex:', state.viewedXunIndex);
        console.log('Target period:', targetPeriod);
        console.log('Target date:', targetDate.toISOString().split('T')[0]);

        const summary = buildXunSummary(targetDate);
        const rangeLabel = getRangeLabel(summary.startDate, summary.endDate);

        // UI调试信息
        console.log('🎨 UI Refresh Debug:');
        console.log('Summary Data:', summary);
        console.log('Container found:', !!this.container);
        console.log('Container ID:', this.container.id);
        console.log('Record Count:', summary.recordCount);
        console.log('Avg Energy:', summary.avgEnergy);
        console.log('High Energy Days:', summary.highEnergyDaysCount);
        
        // 强制显示调试信息在页面上
        if (summary.recordCount > 0) {
            console.log('✅ Should display data in UI!');
            console.log('Expected Avg Energy:', (3 + 9 + 5 + 5) / 4);
        } else {
            console.log('❌ No data to display');
        }

        // 按指令要求：如果没有数据显示"--"，但如果有任何数据就显示有意义的信息
        const hasAnyValidData = summary.recordCount > 0;
        const displayAvgEnergy = hasAnyValidData && summary.avgEnergy !== null && summary.avgEnergy !== undefined ? 
            summary.avgEnergy.toFixed(1) : '--';

        // 数据完整性指示器
        const getDataCompletenessIndicator = () => {
            if (!hasAnyValidData) return '';
            const hasEnergyData = summary.avgEnergy !== null;
            const completenessClass = hasEnergyData ? 'text-green-600' : 'text-yellow-600';
            const completenessText = hasEnergyData ? '数据完整' : '缺少精力数据';
            const completenessIcon = hasEnergyData ? '✅' : '⚠️';
            
            return `<span class="text-xs ${completenessClass} ml-2">${completenessIcon} ${completenessText}</span>`;
        };

        // 根据数据完整性显示不同的状态信息
        const getDataStatusMessage = () => {
            if (!hasAnyValidData) {
                return '本旬暂无记录，从今天开始一次小小的打卡吧。';
            }
            if (summary.avgEnergy === null) {
                return '本旬有基础记录，但缺少精力状态数据，请在每日记录中选择身心状态。';
            }
            return `本旬已记录 ${summary.recordCount} 天，数据完整度良好。`;
        };

        console.log('🖼️ About to render HTML with displayAvgEnergy:', displayAvgEnergy);

        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                <!-- 背景装饰 -->
                <div class="fixed inset-0 overflow-hidden pointer-events-none">
                    <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
                    <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-100/10 to-blue-100/10 rounded-full blur-3xl"></div>
                </div>
                
                <div class="relative z-10 mx-auto w-full max-w-7xl p-6 lg:p-10">
                    <!-- 头部导航 -->
                    <div class="mb-8 flex items-center justify-between">
                        <button data-action="go-detail" class="group relative inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-6 py-3 text-sm font-medium text-gray-700 shadow-lg shadow-gray-200/50 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-gray-300/50 hover:-translate-y-0.5">
                            <svg class="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                            <span>返回</span>
                        </button>
                        <div class="rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 text-xs font-medium text-gray-600 shadow-lg shadow-gray-200/50 border border-white/20">
                            <span class="inline-flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                ${rangeLabel}
                            </span>
                        </div>
                    </div>

                    <!-- 主标题区域 -->
                    <header class="mb-12 text-center">
                        <div class="mb-6 inline-flex items-center gap-3 rounded-full bg-white/60 backdrop-blur-sm px-6 py-3 shadow-lg shadow-gray-200/50">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <span class="text-sm font-medium text-gray-700">数据洞察</span>
                        </div>
                        <h2 class="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
                            本旬小结
                            <span class="block text-2xl lg:text-3xl font-light mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Xun Summary</span>
                        </h2>
                        <p class="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">${getDataStatusMessage()}</p>
                        ${hasAnyValidData ? `
                            <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 border border-green-200">
                                <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                <span class="text-sm font-medium text-green-700">完成率 ${summary.completionRate || 0}%</span>
                            </div>
                        ` : ''}
                    </header>

                    <!-- 数据概览卡片 -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-gray-200/50 border border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/50 hover:-translate-y-1">
                            <!-- 背景装饰 -->
                            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-full blur-2xl transform translate-x-16 -translate-y-16"></div>
                            
                            <div class="relative z-10">
                                <div class="flex items-center gap-3 mb-6">
                                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                        </svg>
                                    </div>
                                    <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">数据概览</h3>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-100/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 hover:-translate-y-0.5">
                                        <div class="flex items-center justify-between mb-2">
                                            <span class="text-sm font-medium text-blue-700">平均睡眠</span>
                                            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                                            </svg>
                                        </div>
                                        <p class="text-2xl font-bold text-gray-900">${summary.avgSleep}<span class="text-sm font-normal text-gray-500 ml-1">小时</span></p>
                                    </div>
                                    
                                    <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 border border-green-100/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-200/50 hover:-translate-y-0.5">
                                        <div class="flex items-center justify-between mb-2">
                                            <span class="text-sm font-medium text-green-700">平均精力</span>
                                            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                            </svg>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <p class="text-2xl font-bold text-gray-900">${displayAvgEnergy}</p>
                                            ${getDataCompletenessIndicator()}
                                        </div>
                                    </div>
                                    
                                    <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 border border-purple-100/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-200/50 hover:-translate-y-0.5">
                                        <div class="flex items-center justify-between mb-2">
                                            <span class="text-sm font-medium text-purple-700">累计运动</span>
                                            <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                            </svg>
                                        </div>
                                        <p class="text-2xl font-bold text-gray-900">${summary.totalExercise}<span class="text-sm font-normal text-gray-500 ml-1">分钟</span></p>
                                    </div>
                                    
                                    <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 border border-amber-100/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-200/50 hover:-translate-y-0.5">
                                        <div class="flex items-center justify-between mb-2">
                                            <span class="text-sm font-medium text-amber-700">累计阅读</span>
                                            <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                            </svg>
                                        </div>
                                        <p class="text-2xl font-bold text-gray-900">${summary.totalReading}<span class="text-sm font-normal text-gray-500 ml-1">分钟</span></p>
                                    </div>
                                </div>
                                
                                <!-- 能量条显示 -->
                                <div class="mt-6 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200/50">
                                    <div class="flex items-center justify-between mb-3">
                                        <span class="text-sm font-medium text-gray-700">精力波动范围</span>
                                        <span class="text-sm text-gray-500">${summary.minEnergy || '--'} - ${summary.maxEnergy || '--'}</span>
                                    </div>
                                    <div class="text-lg leading-none text-gray-700">${energyBar(summary.avgEnergy)}</div>
                                </div>
                            </div>
                        </section>
                        <!-- 睡眠趋势图表 -->
                        <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-gray-200/50 border border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/50 hover:-translate-y-1 lg:col-span-2">
                            <!-- 背景装饰 -->
                            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full blur-2xl transform translate-x-16 -translate-y-16"></div>
                            
                            <div class="relative z-10">
                                <div class="flex items-center gap-3 mb-6">
                                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                        </svg>
                                    </div>
                                    <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-indigo-800 bg-clip-text text-transparent">睡眠趋势分析</h3>
                                </div>
                                <div id="sleep-trend-chart" class="h-80 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50 p-4 border border-gray-200/50"></div>
                            </div>
                        </section>
                    </div>
                    
                    <!-- 第二行卡片 -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                        <!-- 活动频率 -->
                        <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-gray-200/50 border border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/50 hover:-translate-y-1">
                            <!-- 背景装饰 -->
                            <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100/50 to-emerald-100/50 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
                            
                            <div class="relative z-10">
                                <div class="flex items-center gap-3 mb-6">
                                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                    </div>
                                    <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">活动频率</h3>
                                </div>
                                
                                <div class="space-y-4">
                                    <div class="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50">
                                        <span class="text-sm font-medium text-blue-700">运动天数</span>
                                        <span class="text-lg font-bold text-gray-900">${summary.exerciseDays}<span class="text-sm font-normal text-gray-500 ml-1">天</span></span>
                                    </div>
                                    <div class="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100/50">
                                        <span class="text-sm font-medium text-green-700">阅读天数</span>
                                        <span class="text-lg font-bold text-gray-900">${summary.readingDays}<span class="text-sm font-normal text-gray-500 ml-1">天</span></span>
                                    </div>
                                    <div class="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50">
                                        <span class="text-sm font-medium text-amber-700">低睡眠天数</span>
                                        <span class="text-lg font-bold text-gray-900">${summary.lateSleepDays}<span class="text-sm font-normal text-gray-500 ml-1">天</span></span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- 情绪分布 -->
                        <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-gray-200/50 border border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/50 hover:-translate-y-1">
                            <!-- 背景装饰 -->
                            <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-100/50 to-rose-100/50 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
                            
                            <div class="relative z-10">
                                <div class="flex items-center gap-3 mb-6">
                                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    </div>
                                    <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent">情绪分布</h3>
                                </div>
                                
                                <div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100/50">
                                    ${emotionWordCloud(summary.emotionFrequency)}
                                </div>
                            </div>
                        </section>

                    <!-- 金钱观察总结模块 -->
                    <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-gray-200/50 border border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/50 hover:-translate-y-1 lg:col-span-3">
                        <!-- 背景装饰 -->
                        <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100/50 to-orange-100/50 rounded-full blur-2xl transform translate-x-20 -translate-y-20"></div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center gap-3 mb-6">
                                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-amber-800 bg-clip-text text-transparent">金钱观察总结</h3>
                            </div>
                            
                            <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100/50">
                                <div id="money-observation-summary-container">
                                    ${this.renderMoneySummary()}
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- 三件好事汇总模块 -->
                    ${generateGoodThingsSection(summary)}
                    
                    <!-- 智能洞察 -->
                    <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-gray-200/50 border border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/50 hover:-translate-y-1 lg:col-span-3">
                        <!-- 背景装饰 -->
                        <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 rounded-full blur-2xl transform translate-x-20 -translate-y-20"></div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center gap-3 mb-6">
                                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                    </svg>
                                </div>
                                <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text text-transparent">智能洞察</h3>
                            </div>
                            
                            <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100/50">
                                <ul class="space-y-3">
                                    ${summary.insights.map((insight) => `
                                        <li class="flex items-start gap-3 text-gray-700">
                                            <span class="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0"></span>
                                            <span class="text-sm leading-relaxed">${insight}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;

        console.log('✅ HTML rendered successfully!');
        console.log('Container innerHTML length:', this.container.innerHTML.length);

        this.container.querySelector('[data-action="go-detail"]')?.addEventListener('click', () => {
            store.setState({ currentView: 'detail' });
        });

        this.afterSummaryRender();
    }

    afterSummaryRender() {
        const dataService = {
            getRecordsByCurrentXun
        };
        const xunData = dataService.getRecordsByCurrentXun();
        renderSleepTrendChart(xunData.records || []);
        
        // 渲染金钱观察总结
        this.renderMoneySummaryContent();
    }

    renderMoneySummary() {
        // 返回加载中的占位内容
        return '<div class="text-center py-4 text-gray-500"><p>正在加载金钱观察数据...</p></div>';
    }

    renderMoneySummaryContent() {
        const container = document.getElementById('money-observation-summary-container');
        if (!container) {
            console.warn('❌ Money observation summary container not found');
            return;
        }

        try {
            console.log('🔍 Starting money summary render...');
            
            // 使用与主summary相同的逻辑获取当前查看的旬期
            const state = store.getState();
            const xunPeriods = Calendar.getXunPeriods(CONFIG.YEAR);
            const targetPeriod = xunPeriods.find(p => p.index === state.viewedXunIndex);
            
            if (!targetPeriod) {
                console.warn('❌ Unable to get target xun information');
                container.innerHTML = '<div class="text-center py-4 text-gray-500"><p>无法获取目标旬期信息</p></div>';
                return;
            }
            
            // 计算quarter和xun属性
            const quarter = Math.ceil(targetPeriod.index / 3);
            const xun = ((targetPeriod.index - 1) % 3) + 1;
            const xunPeriod = `${CONFIG.YEAR}-Q${quarter}-X${xun}`;
            
            console.log('🎯 Money Summary Debug:');
            console.log('Current viewedXunIndex:', state.viewedXunIndex);
            console.log('Target period:', targetPeriod);
            console.log('Xun period string:', xunPeriod);
            
            // 创建金钱观察总结组件实例
            const moneySummary = new MoneyObservationSummaryComponent(xunPeriod);
            
            // 渲染金钱观察总结
            const renderedContent = moneySummary.render();
            container.innerHTML = renderedContent;
            
            console.log('✅ Money observation summary rendered successfully for period:', xunPeriod);
            console.log('📊 Rendered content length:', renderedContent.length);
            console.log('📊 Rendered content preview:', renderedContent.substring(0, 200) + '...');
            
        } catch (error) {
            console.error('❌ Failed to render money observation summary:', error);
            container.innerHTML = '<div class="text-center py-4 text-gray-500"><p>金钱观察数据加载失败</p></div>';
        }
    }

    afterModalSave() {
        this.afterSummaryRender();
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}
