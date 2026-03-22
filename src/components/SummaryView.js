import { buildXunSummary, getRangeLabel, getRecordsByCurrentXun } from '../core/XunSummary.js';
import { store } from '../core/State.js';
import { renderSleepTrendChart } from './XunSleepTrendChart.js';

const emotionRows = (emotionFrequency) => {
    const entries = Object.entries(emotionFrequency).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
        return '<p class="text-sm text-gray-500">本旬暂无情绪标签记录。</p>';
    }

    return `
        <div class="space-y-2">
            ${entries.map(([emotion, count]) => `
                <div class="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span class="text-sm text-gray-700">${emotion}</span>
                    <span class="text-xs font-semibold text-gray-500">${count}</span>
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

        const summary = buildXunSummary(new Date());
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

        // 按指令要求：如果没有数据显示"--"
        const displayAvgEnergy = summary.avgEnergy !== null && summary.avgEnergy !== undefined && summary.avgEnergy !== 0 ? summary.avgEnergy.toFixed(1) : '--';

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
                    <p class="mt-2 text-sm text-gray-500">本旬已记录 ${summary.recordCount} 天 · 完成率 ${summary.completionRate || 0}%</p>
                </header>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <section id="xun-summary-container" class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 class="mb-4 text-base font-medium text-gray-700">1. 数据概览</h3>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div class="rounded-xl bg-gray-50 p-3"><p class="text-gray-500">平均睡眠</p><p class="text-xl text-gray-800">${summary.avgSleep}小时</p></div>
                            <div class="rounded-xl bg-gray-50 p-3"><p class="text-gray-500">平均精力</p><p class="text-xl text-gray-800">${displayAvgEnergy}</p></div>
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
                        ${emotionRows(summary.emotionFrequency)}
                    </section>

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
                        <h3 class="mb-4 text-base font-medium text-gray-700">5. 智能洞察</h3>
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
