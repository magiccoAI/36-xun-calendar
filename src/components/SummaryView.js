import { buildXunSummary, getRangeLabel, getRecordsByCurrentXun } from '../core/XunSummary.js';
import { store } from '../core/State.js';
import { renderSleepTrendChart } from './XunSleepTrendChart.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';
import { MoneyObservationSummaryComponent } from './MoneyObservationSummary.js';

const emotionBubbleCloud = (emotionFrequency) => {
    const entries = Object.entries(emotionFrequency).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
        return '<p class="text-sm text-gray-500">本旬暂无情绪标签记录。</p>';
    }

    const maxCount = Math.max(...entries.map(([, count]) => count));
    const minCount = Math.min(...entries.map(([, count]) => count));

    const emotionColors = {
        '平静': { bg: 'from-slate-100 to-gray-100', text: 'text-slate-700', border: 'border-slate-200' },
        '愉悦': { bg: 'from-amber-50 to-orange-50', text: 'text-amber-700', border: 'border-amber-200' },
        '充实': { bg: 'from-emerald-50 to-green-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        '疲惫': { bg: 'from-purple-50 to-violet-50', text: 'text-purple-700', border: 'border-purple-200' },
        '焦虑': { bg: 'from-rose-50 to-pink-50', text: 'text-rose-700', border: 'border-rose-200' },
        '专注': { bg: 'from-blue-50 to-indigo-50', text: 'text-blue-700', border: 'border-blue-200' },
        '低落': { bg: 'from-gray-100 to-slate-100', text: 'text-gray-600', border: 'border-gray-300' },
        '感恩': { bg: 'from-yellow-50 to-amber-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    };

    const getSizeAndOpacity = (count) => {
        if (maxCount === minCount) return { size: 'medium', opacity: '100' };
        const ratio = (count - minCount) / (maxCount - minCount);
        const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'];
        const opacities = ['50', '65', '80', '90', '100'];
        const idx = Math.min(4, Math.round(ratio * 4));
        return { size: sizes[idx], opacity: opacities[idx] };
    };

    const getColor = (emotion) => {
        return emotionColors[emotion] || { bg: 'from-gray-50 to-slate-50', text: 'text-gray-700', border: 'border-gray-200' };
    };

    return `
        <div class="flex flex-wrap justify-center gap-3 p-4">
            ${entries.map(([emotion, count]) => {
                const { size, opacity } = getSizeAndOpacity(count);
                const color = getColor(emotion);
                const paddingX = size === 'text-xs' ? 'px-2 py-1' : size === 'text-xl' ? 'px-5 py-3' : 'px-3 py-2';
                return `
                    <div class="relative group">
                        <div class="absolute -inset-1 bg-gradient-to-br ${color.bg} rounded-full opacity-${opacity} blur-sm group-hover:blur-md transition-all duration-300"></div>
                        <div class="relative flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm border ${color.border} ${paddingX} shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default"
                             title="${emotion} · ${count}次"
                             role="img"
                             aria-label="${emotion}情绪，出现${count}次">
                            <span class="${size} font-medium ${color.text}">${emotion}</span>
                            <span class="${size === 'text-xs' ? 'text-[10px]' : 'text-xs'} font-semibold ${color.text} opacity-60">${count}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
};

const generateMiniTrendIndicator = (currentValue, trend = 'stable') => {
    const trendIcons = {
        up: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>',
        down: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>',
        stable: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"></path></svg>'
    };
    const trendColors = {
        up: 'text-emerald-500 bg-emerald-50',
        down: 'text-rose-500 bg-rose-50',
        stable: 'text-slate-500 bg-slate-50'
    };
    return `<span class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${trendColors[trend]}">${trendIcons[trend]}</span>`;
};

const energyFlowChart = (summary) => {
    const energyData = summary.energyTrend || [];
    if (!energyData.length) {
        return '<div class="h-full flex items-center justify-center text-gray-400 text-xs">暂无趋势数据</div>';
    }

    const max = Math.max(...energyData, 10);
    const min = Math.min(...energyData, 0);
    const range = max - min || 1;

    return `
        <div class="flex items-end justify-between gap-1 h-full px-2">
            ${energyData.map((value, i) => {
                const height = ((value - min) / range) * 100;
                const isHigh = value >= 7;
                return `
                    <div class="flex-1 flex flex-col items-center gap-1">
                        <div class="w-full rounded-t transition-all duration-500 hover:opacity-80"
                             style="height: ${Math.max(height, 10)}%"
                             title="第${i + 1}天: ${value}">
                            <div class="w-full rounded-t ${isHigh ? 'bg-gradient-to-t from-emerald-400 to-emerald-300' : 'bg-gradient-to-t from-slate-300 to-slate-200'}"
                                 style="height: 100%"></div>
                        </div>
                        <div class="text-[8px] text-gray-400">${i + 1}日</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
};

const generateGoodThingsSection = (summary) => {
    if (!summary.three_good_things || summary.three_good_things.length === 0) return '';

    const completionRate = Math.round((summary.good_things_stats.total_days / 10) * 100);

    return `
        <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm p-6 shadow-lg shadow-amber-200/20 border border-amber-200/30">
            <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl"></div>
            <div class="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-200/20 to-amber-200/20 rounded-full blur-3xl"></div>

            <div class="relative z-10">
                <div class="flex items-center justify-between mb-5">
                    <h3 class="text-lg font-medium text-gray-800 flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-sm shadow-sm">✨</span>
                        <span>本旬美好瞬间</span>
                    </h3>
                    <div class="flex items-center gap-3 text-sm">
                        <span class="text-amber-600 font-medium">${summary.good_things_stats.total_days}/10天</span>
                        <span class="w-px h-4 bg-amber-300/50"></span>
                        <span class="text-orange-600 font-medium">${completionRate}%</span>
                    </div>
                </div>

                <div class="space-y-3">
                    ${Object.entries(summary.three_good_things_by_date)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .slice(0, 3)
                        .map(([date, things]) => {
                            const dateObj = new Date(date);
                            return `
                                <div class="flex items-start gap-3 p-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-amber-100/40 hover:bg-white/80 hover:shadow-md transition-all duration-300">
                                    <div class="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        ${dateObj.getDate()}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="text-xs text-gray-500 mb-1">${dateObj.getMonth() + 1}.${dateObj.getDate()}</div>
                                        <div class="space-y-1">
                                            ${things.slice(0, 2).map((thing, idx) => `
                                                <p class="text-sm text-gray-700 leading-relaxed truncate">${idx + 1}. ${thing}</p>
                                            `).join('')}
                                            ${things.length > 2 ? `<p class="text-xs text-amber-600 font-medium">+${things.length - 2}更多</p>` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                </div>

                ${summary.good_things_stats.total_days >= 7 ? `
                    <div class="mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-100/50 to-orange-100/50 border border-amber-200/50">
                        <p class="text-sm text-amber-800 text-center">💝 您是发现美好的生活观察家，继续保持这份觉察</p>
                    </div>
                ` : ''}
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

        const state = store.getState();
        const xunPeriods = Calendar.getXunPeriods(CONFIG.YEAR);
        const targetPeriod = xunPeriods.find(p => p.index === state.viewedXunIndex);
        const targetDate = targetPeriod ? targetPeriod.startDate : new Date();

        const summary = buildXunSummary(targetDate);
        const rangeLabel = getRangeLabel(summary.startDate, summary.endDate);

        const hasAnyValidData = summary.recordCount > 0;
        const displayAvgEnergy = hasAnyValidData && summary.avgEnergy !== null && summary.avgEnergy !== undefined ?
            summary.avgEnergy.toFixed(1) : '--';

        this.container.innerHTML = `
            <div class="min-h-screen" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #e0e7ff 50%, #c7d2fe 75%, #ddd6fe 100%);">
                <div class="absolute inset-0 overflow-hidden pointer-events-none">
                    <div class="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/30 via-indigo-200/20 to-purple-200/30 rounded-full blur-3xl transform -translate-y-1/2"></div>
                    <div class="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-200/25 via-violet-200/20 to-rose-200/25 rounded-full blur-3xl transform translate-y-1/2"></div>
                    <div class="absolute top-1/2 left-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-100/15 via-blue-100/10 to-indigo-100/15 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>

                <div class="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">

                    <header class="mb-10 text-center">
                        <div class="inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-md px-4 py-2 text-xs font-medium text-gray-600 shadow-sm border border-white/40 mb-6">
                            <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            ${rangeLabel}
                        </div>

                        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3">
                            <span style="background: linear-gradient(135deg, #1e293b 0%, #4338ca 50%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">本旬小结</span>
                        </h1>
                        <p class="text-base sm:text-lg text-gray-500 font-light tracking-wide">Xun Summary</p>

                        ${hasAnyValidData ? `
                            <div class="mt-6 inline-flex items-center gap-4 rounded-full bg-white/70 backdrop-blur-sm px-5 py-2.5 shadow-sm border border-white/50">
                                <div class="flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                    <span class="text-sm font-medium text-gray-700">完成率</span>
                                    <span class="text-lg font-bold text-emerald-600">${summary.completionRate}%</span>
                                </div>
                                <div class="w-px h-5 bg-gray-200"></div>
                                <div class="flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                                    <span class="text-sm font-medium text-gray-700">记录</span>
                                    <span class="text-lg font-bold text-blue-600">${summary.recordCount}天</span>
                                </div>
                            </div>
                        ` : ''}
                    </header>

                    ${!hasAnyValidData ? `
                        <div class="flex flex-col items-center justify-center py-20 rounded-3xl bg-white/70 backdrop-blur-sm border border-white/50 shadow-xl">
                            <div class="text-7xl mb-6 opacity-30">🌿</div>
                            <p class="text-xl text-gray-500 font-light mb-2">本旬暂无记录</p>
                            <p class="text-sm text-gray-400 mb-6">从今天开始一次小小的打卡吧</p>
                            <button data-action="go-detail" class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-200/50 transition-all duration-300 hover:shadow-xl hover:scale-105">
                                去记录
                            </button>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">

                            <section class="sm:col-span-2 lg:col-span-2 group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-gray-200/30 border border-white/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/40">
                                <div class="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full blur-3xl transform translate-x-24 -translate-y-24"></div>
                                <div class="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-violet-100/30 to-purple-100/30 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>

                                <div class="relative z-10">
                                    <div class="flex items-center gap-3 mb-6">
                                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 class="text-xl font-bold text-gray-800">睡眠 & 精力</h2>
                                            <p class="text-xs text-gray-500">Sleep & Energy</p>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-4 mb-6">
                                        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 p-4 border border-slate-100/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                                            <div class="flex items-start justify-between mb-3">
                                                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shadow-sm">
                                                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                                                    </svg>
                                                </div>
                                                ${generateMiniTrendIndicator(summary.avgSleep, 'stable')}
                                            </div>
                                            <p class="text-3xl font-bold text-gray-800 mb-1">${summary.avgSleep}</p>
                                            <p class="text-xs text-gray-500">平均睡眠 · 小时</p>
                                        </div>

                                        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-4 border border-emerald-100/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                                            <div class="flex items-start justify-between mb-3">
                                                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-sm">
                                                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                                    </svg>
                                                </div>
                                                ${generateMiniTrendIndicator(summary.avgEnergy, 'stable')}
                                            </div>
                                            <p class="text-3xl font-bold text-gray-800 mb-1">${displayAvgEnergy}</p>
                                            <p class="text-xs text-gray-500">平均精力 · 评分</p>
                                        </div>
                                    </div>

                                    <div class="rounded-2xl bg-gradient-to-br from-slate-50/80 to-indigo-50/50 p-4 border border-slate-100/50">
                                        <div class="flex items-center justify-between mb-3">
                                            <span class="text-sm font-medium text-gray-600">精力波动</span>
                                            <span class="text-xs text-gray-400">${summary.minEnergy || '--'} - ${summary.maxEnergy || '--'}</span>
                                        </div>
                                        <div class="h-16">
                                            ${energyFlowChart(summary)}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-gray-200/30 border border-white/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/40">
                                <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100/40 to-orange-100/40 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>

                                <div class="relative z-10">
                                    <div class="flex items-center gap-3 mb-6">
                                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
                                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 class="text-xl font-bold text-gray-800">运动 & 阅读</h2>
                                            <p class="text-xs text-gray-500">Exercise & Reading</p>
                                        </div>
                                    </div>

                                    <div class="space-y-4">
                                        <div class="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                                            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                </svg>
                                            </div>
                                            <div class="flex-1">
                                                <p class="text-sm text-gray-500 mb-0.5">累计运动</p>
                                                <p class="text-2xl font-bold text-gray-800">${summary.totalExercise}<span class="text-sm font-normal text-gray-500 ml-1">分钟</span></p>
                                            </div>
                                            <div class="text-right">
                                                <p class="text-xs text-gray-400 mb-0.5">活动天数</p>
                                                <p class="text-lg font-semibold text-blue-600">${summary.exerciseDays}<span class="text-xs font-normal text-gray-400 ml-0.5">天</span></p>
                                            </div>
                                        </div>

                                        <div class="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                                            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                                </svg>
                                            </div>
                                            <div class="flex-1">
                                                <p class="text-sm text-gray-500 mb-0.5">累计阅读</p>
                                                <p class="text-2xl font-bold text-gray-800">${summary.totalReading}<span class="text-sm font-normal text-gray-500 ml-1">分钟</span></p>
                                            </div>
                                            <div class="text-right">
                                                <p class="text-xs text-gray-400 mb-0.5">阅读天数</p>
                                                <p class="text-lg font-semibold text-amber-600">${summary.readingDays}<span class="text-xs font-normal text-gray-400 ml-0.5">天</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-gray-200/30 border border-white/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/40">
                                <div class="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-rose-100/40 to-pink-100/40 rounded-full blur-3xl transform translate-x-18 -translate-y-18"></div>

                                <div class="relative z-10">
                                    <div class="flex items-center gap-3 mb-5">
                                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200/50">
                                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 class="text-xl font-bold text-gray-800">情绪分布</h2>
                                            <p class="text-xs text-gray-500">Emotion Distribution</p>
                                        </div>
                                    </div>

                                    <div class="bg-gradient-to-br from-rose-50/50 to-pink-50/30 rounded-2xl p-4 border border-rose-100/30 min-h-[120px]">
                                        ${emotionBubbleCloud(summary.emotionFrequency)}
                                    </div>
                                </div>
                            </section>

                            <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-gray-200/30 border border-white/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/40">
                                <div class="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-violet-100/40 to-purple-100/40 rounded-full blur-3xl transform translate-x-18 -translate-y-18"></div>

                                <div class="relative z-10">
                                    <div class="flex items-center gap-3 mb-5">
                                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-200/50">
                                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 class="text-xl font-bold text-gray-800">智能洞察</h2>
                                            <p class="text-xs text-gray-500">Smart Insights</p>
                                        </div>
                                    </div>

                                    <div class="space-y-3">
                                        ${summary.insights.map((insight, idx) => `
                                            <div class="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-violet-50/70 to-purple-50/50 border border-violet-100/40 hover:shadow-md hover:bg-violet-50/80 transition-all duration-300">
                                                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">${idx + 1}</span>
                                                <p class="text-sm text-gray-700 leading-relaxed pt-0.5">${insight}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </section>

                            ${generateGoodThingsSection(summary)}

                            <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-gray-200/30 border border-white/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/40 lg:col-span-2">
                                <div class="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-100/40 to-orange-100/40 rounded-full blur-3xl transform translate-x-24 -translate-y-24"></div>

                                <div class="relative z-10">
                                    <div class="flex items-center gap-3 mb-5">
                                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
                                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 class="text-xl font-bold text-gray-800">金钱观察</h2>
                                            <p class="text-xs text-gray-500">Money Observation</p>
                                        </div>
                                    </div>

                                    <div class="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl p-5 border border-amber-100/30">
                                        <div id="money-observation-summary-container" class="text-sm text-gray-600">
                                            ${this.renderMoneySummary()}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section class="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-gray-200/30 border border-white/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/40">
                                <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/40 to-violet-100/40 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>

                                <div class="relative z-10">
                                    <div class="flex items-center gap-3 mb-5">
                                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 class="text-xl font-bold text-gray-800">睡眠趋势</h2>
                                            <p class="text-xs text-gray-500">Sleep Trend Analysis</p>
                                        </div>
                                    </div>

                                    <div id="sleep-trend-chart" class="h-40 rounded-2xl bg-gradient-to-br from-slate-50/80 to-blue-50/50 p-3 border border-slate-100/50"></div>
                                </div>
                            </section>

                        </div>

                        <div class="mt-8 flex justify-center">
                            <button data-action="go-detail" class="group inline-flex items-center gap-3 rounded-full bg-white/80 backdrop-blur-sm px-8 py-4 text-sm font-medium text-gray-700 shadow-xl shadow-gray-200/50 border border-white/50 transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-gray-300/50 hover:-translate-y-0.5">
                                <svg class="w-5 h-5 text-gray-400 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                <span>返回日历</span>
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;

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
        this.renderMoneySummaryContent();
    }

    renderMoneySummary() {
        return '<div class="text-center py-4 text-gray-400"><span class="inline-flex items-center gap-2"><svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>加载中...</span></div>';
    }

    renderMoneySummaryContent() {
        const container = document.getElementById('money-observation-summary-container');
        if (!container) return;

        try {
            const state = store.getState();
            const xunPeriods = Calendar.getXunPeriods(CONFIG.YEAR);
            const targetPeriod = xunPeriods.find(p => p.index === state.viewedXunIndex);

            if (!targetPeriod) {
                container.innerHTML = '<div class="text-center py-4 text-gray-500">无法获取旬期信息</div>';
                return;
            }

            const quarter = Math.ceil(targetPeriod.index / 3);
            const xun = ((targetPeriod.index - 1) % 3) + 1;
            const xunPeriod = `${CONFIG.YEAR}-Q${quarter}-X${xun}`;

            const moneySummary = new MoneyObservationSummaryComponent(xunPeriod);
            container.innerHTML = moneySummary.render();

        } catch (error) {
            console.error('❌ Failed to render money observation summary:', error);
            container.innerHTML = '<div class="text-center py-4 text-gray-500">加载失败</div>';
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