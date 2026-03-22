import { buildXunSummary, getRangeLabel, getRecordsByCurrentXun } from '../core/XunSummary.js';
import { store } from '../core/State.js';
import { renderSleepTrendChart } from './XunSleepTrendChart.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';

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
            <div class="mx-auto w-full max-w-6xl p-4 md:p-8">
                <div class="mb-6 flex items-center justify-between">
                    <button data-action="go-detail" class="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:border-blue-300 hover:text-blue-600">
                        ← 返回
                    </button>
                    <div class="rounded-full bg-white px-4 py-1 text-xs text-gray-500 shadow-sm border border-gray-100">${rangeLabel}</div>
                </div>

                <header class="mb-8 text-center">
                    <h2 class="text-3xl font-light text-gray-800">本旬小结 · Xun Summary</h2>
                    <p class="mt-2 text-sm text-gray-500">${getDataStatusMessage()}</p>
                    ${hasAnyValidData ? `<p class="text-xs text-gray-400">完成率 ${summary.completionRate || 0}%</p>` : ''}
                </header>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <section id="xun-summary-container" class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 class="mb-4 text-base font-medium text-gray-700">1. 数据概览</h3>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div class="rounded-xl bg-gray-50 p-3"><p class="text-gray-500">平均睡眠</p><p class="text-xl text-gray-800">${summary.avgSleep}小时</p></div>
                            <div class="rounded-xl bg-gray-50 p-3">
                                <p class="text-gray-500">平均精力</p>
                                <div class="flex items-center">
                                    <p class="text-xl text-gray-800">${displayAvgEnergy}</p>
                                    ${getDataCompletenessIndicator()}
                                </div>
                            </div>
                            <div class="rounded-xl bg-gray-50 p-3"><p class="text-gray-500">累计运动</p><p class="text-xl text-gray-800">${summary.totalExercise}分钟</p></div>
                            <div class="rounded-xl bg-gray-50 p-3"><p class="text-gray-500">累计阅读</p><p class="text-xl text-gray-800">${summary.totalReading}分钟</p></div>
                        </div>
                        
                        <!-- 新增：能量条显示 -->
                        <div class="mt-4 pt-4 border-t border-gray-100">
                            <p class="text-xs text-gray-500 mb-2">精力波动范围：${summary.minEnergy || '--'} - ${summary.maxEnergy || '--'}</p>
                            <div class="text-xs leading-none text-gray-600">${energyBar(summary.avgEnergy)}</div>
                        </div>
                    </section>
                    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:col-span-2">
                        <h3 class="mb-4 text-base font-medium text-gray-700">最近10天睡眠时长趋势</h3>
                        <div id="sleep-trend-chart" class="h-64"></div>
                    </section>

                    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 class="mb-4 text-base font-medium text-gray-700">2. 活动频率</h3>
                        <div class="space-y-2 text-sm text-gray-700">
                            <p>运动天数：<strong>${summary.exerciseDays}</strong> 天</p>
                            <p>阅读天数：<strong>${summary.readingDays}</strong> 天</p>
                            <p>低睡眠天数（< 6小时）：<strong>${summary.lateSleepDays}</strong> 天</p>
                        </div>
                    </section>

                    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 class="mb-4 text-base font-medium text-gray-700">3. 情绪分布</h3>
                        ${emotionWordCloud(summary.emotionFrequency)}
                    </section>

                    <!-- 三件好事汇总模块 -->
                    ${generateGoodThingsSection(summary)}

                    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 class="mb-4 text-base font-medium text-gray-700">4. 高精力日</h3>
                        <div class="space-y-2 text-sm text-gray-700">
                            <p>精力值 ≥ 7 的天数：<strong>${summary.highEnergyDaysCount}</strong> 天</p>
                            <p>高精力日平均睡眠：<strong>${summary.highEnergyAverageSleep}</strong> 小时</p>
                            <p>高精力日平均运动：<strong>${summary.highEnergyAverageExercise}</strong> 分钟</p>
                        </div>
                        
                        <!-- 新增：高精力日能量条 -->
                        <div class="mt-4 pt-4 border-t border-gray-100">
                            <p class="text-xs text-gray-500 mb-2">高精力日分布</p>
                            ${energyBarsGrid(summary)}
                        </div>
                    </section>

                    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:col-span-2">
                        <h3 class="mb-4 text-base font-medium text-gray-700">6. 智能洞察</h3>
                        <ul class="list-disc space-y-2 pl-5 text-sm text-gray-700">
                            ${summary.insights.map((insight) => `<li>${insight}</li>`).join('')}
                        </ul>
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
