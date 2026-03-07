
import { store } from '../core/State.js';
import { Calendar } from '../core/Calendar.js';

export class SummaryView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(period) {
        if (!this.container) return;
        
        const state = store.getState();
        const { userData } = state;

        // Title Styling
        const startStr = `${period.startDate.getMonth()+1}.${period.startDate.getDate()}`;
        const endStr = `${period.endDate.getMonth()+1}.${period.endDate.getDate()}`;
        const hue = (period.index * 10) % 360;
        
        const titleHtml = `
            <div class="relative flex flex-col items-center mb-8 w-full">
                <button data-action="go-detail" class="absolute left-0 top-1 flex items-center gap-1 p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100 group" title="返回">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span class="text-sm font-medium hidden md:inline">返回</span>
                </button>
                <div class="px-4 py-1 rounded-full text-xs font-medium bg-white border shadow-sm mb-3" style="color: hsl(${hue}, 70%, 40%); border-color: hsl(${hue}, 70%, 80%)">
                    ${startStr} - ${endStr}
                </div>
                <h2 class="text-3xl font-light text-gray-800">第 ${period.index} 旬回顾</h2>
            </div>
        `;
        
        const xunData = [];
        let currentDate = new Date(period.startDate);
        while (currentDate <= period.endDate) {
            const dateStr = Calendar.formatLocalDate(currentDate);
            // Always push a record for every day in the Xun, even if empty
            if (userData[dateStr]) {
                xunData.push({ date: dateStr, ...userData[dateStr], hasData: true });
            } else {
                xunData.push({ date: dateStr, hasData: false });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        let contentHtml = '';

        if (xunData.every(d => !d.hasData)) {
            contentHtml = `
                <div class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                    <div class="text-6xl mb-4 opacity-20">📝</div>
                    <p class="text-gray-500 font-light text-lg">本旬暂无记录，休息一下吧。</p>
                    <button data-action="go-detail" class="mt-6 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md">去记录</button>
                </div>
            `;
        } else {
            const stats = {
                moodCounts: [0, 0, 0, 0, 0],
                emotionCounts: {},
                sleep: { total: 0, count: 0 },
                exercise: { total: 0, count: 0 },
                reading: { total: 0, count: 0 },
                wealth: 0,
                customActivities: {},
                journals: [],
                three_good_things: [],
                three_good_things_by_date: {}, // 按日期分组
                good_things_stats: {
                    total_days: 0,
                    total_items: 0,
                    keywords: {}
                },
                dates: xunData.map(d => d.date.slice(5)), // Now contains all dates
                sleepData: [],
                exerciseData: [],
                readingData: [],
            };

            xunData.forEach(data => {
                if (data.hasData) {
                    if (data.mood) stats.moodCounts[data.mood - 1]++;
                    if (data.emotions) {
                        data.emotions.forEach(tag => {
                            stats.emotionCounts[tag] = (stats.emotionCounts[tag] || 0) + 1;
                        });
                    }
                    if (data.metrics) {
                        if (data.metrics.sleep) { stats.sleep.total += data.metrics.sleep; stats.sleep.count++; }
                        if (data.metrics.exercise) { stats.exercise.total += data.metrics.exercise; stats.exercise.count++; }
                        if (data.metrics.reading) { stats.reading.total += data.metrics.reading; stats.reading.count++; }
                        if (data.metrics.wealth) stats.wealth += data.metrics.wealth;
                    }
                    
                    // 新的睡眠数据结构
                    if (data.sleepData && data.sleepData.totalHours) {
                        stats.sleep.total += data.sleepData.totalHours;
                        stats.sleep.count++;
                    }
                    if (data.custom_activities) {
                        data.custom_activities.forEach(act => {
                            stats.customActivities[act.name] = (stats.customActivities[act.name] || 0) + 1;
                        });
                    }
                    if (data.journal) stats.journals.push({ date: data.date, content: data.journal });
                    if (data.three_good_things) {
                        const goodThings = data.three_good_things.filter(t => t.trim() !== '');
                        if (goodThings.length > 0) {
                            stats.three_good_things_by_date[data.date] = goodThings;
                            stats.three_good_things.push(...goodThings);
                            stats.good_things_stats.total_days++;
                            stats.good_things_stats.total_items += goodThings.length;
                            
                            // 提取关键词
                            goodThings.forEach(thing => {
                                // 简单的关键词提取，去除常见停用词
                                const keywords = thing
                                    .replace(/[，。！？；：""''（）【】《》、]/g, ' ')
                                    .split(/\s+/)
                                    .filter(word => word.length > 1 && !['的', '了', '是', '在', '有', '和', '与', '或', '但', '而', '也', '就', '都', '很', '非常', '特别', '今天', '昨天', '明天'].includes(word));
                                
                                keywords.forEach(keyword => {
                                    stats.good_things_stats.keywords[keyword] = (stats.good_things_stats.keywords[keyword] || 0) + 1;
                                });
                            });
                        }
                    }
                    
                    stats.sleepData.push(data.metrics?.sleep || null);
                    stats.exerciseData.push(data.metrics?.exercise || null);
                    stats.readingData.push(data.metrics?.reading || null);
                } else {
                    // For days with no data, push null to charts to maintain x-axis alignment
                    stats.sleepData.push(null);
                    stats.exerciseData.push(null);
                    stats.readingData.push(null);
                }
            });

            contentHtml = `
                <div class="max-w-4xl mx-auto space-y-8">
                    <!-- 1. Stats Cards -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                            <span class="text-2xl mb-2">😴</span>
                            <span class="text-sm text-gray-400 mb-1">平均睡眠</span>
                            <span class="text-xl font-semibold text-gray-700">${(stats.sleep.count > 0 ? (stats.sleep.total / stats.sleep.count).toFixed(1) : '-')} <span class="text-xs font-normal text-gray-400">h</span></span>
                        </div>
                        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                            <span class="text-2xl mb-2">🏃</span>
                            <span class="text-sm text-gray-400 mb-1">总运动</span>
                            <span class="text-xl font-semibold text-gray-700">${stats.exercise.total} <span class="text-xs font-normal text-gray-400">min</span></span>
                        </div>
                        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                            <span class="text-2xl mb-2">📚</span>
                            <span class="text-sm text-gray-400 mb-1">总阅读</span>
                            <span class="text-xl font-semibold text-gray-700">${stats.reading.total} <span class="text-xs font-normal text-gray-400">min</span></span>
                        </div>
                         <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                            <span class="text-2xl mb-2">💰</span>
                            <span class="text-sm text-gray-400 mb-1">财富变动</span>
                            <span class="text-xl font-semibold ${stats.wealth >= 0 ? 'text-green-500' : 'text-red-500'}">${stats.wealth > 0 ? '+' : ''}${stats.wealth.toFixed(0)}</span>
                        </div>
                    </div>

                    <!-- 1.5 Emotion Keywords -->
                    ${Object.keys(stats.emotionCounts).length > 0 ? `
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                             <h4 class="font-medium text-gray-700 mb-4 flex items-center gap-2">
                                <span class="w-1 h-4 rounded-full bg-pink-400"></span> 情绪关键词
                            </h4>
                            <div class="flex flex-wrap gap-2">
                                ${Object.entries(stats.emotionCounts).sort((a,b) => b[1] - a[1]).map(([tag, count]) => `
                                    <span class="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm border border-gray-100 flex items-center gap-2">
                                        ${tag} <span class="text-xs bg-gray-200 text-gray-500 rounded-full px-1.5 py-0.5">${count}</span>
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- 4. Three Good Things Enhanced -->
                    ${this.generateGoodThingsSection(stats)}

                    <!-- 2. Charts Row -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Mood Chart -->
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative z-0 overflow-visible">
                            <h4 class="font-medium text-gray-700 mb-4 flex items-center gap-2 relative z-10">
                                <span class="w-1 h-4 rounded-full bg-blue-400"></span> 心情分布
                                <div class="ml-auto group relative">
                                    <span class="text-xs font-normal text-gray-400 cursor-help border-b border-dashed border-gray-300">来自“今日整体感受”</span>
                                    <!-- Tooltip -->
                                    <div class="hidden group-hover:block absolute right-0 top-full mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-xl z-50 text-left leading-relaxed">
                                        <p class="mb-2">• 它会读取您在这10天（一旬）内每一次打卡记录的“今日整体感受”。</p>
                                        <p>• 它统计的是这5种心情出现的频率。（例如：这10天里有3天“不错”、2天“平淡”，图表上就会直观地显示出这种比例）。</p>
                                        <!-- Arrow -->
                                        <div class="absolute -top-1 right-8 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                                    </div>
                                </div>
                            </h4>
                            <div class="flex-1 min-h-[200px] relative z-0">
                                <canvas id="mood-chart"></canvas>
                            </div>
                        </div>
                        
                        <!-- Trends Chart -->
                        <div class="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                            <h4 class="font-medium text-gray-700 mb-4 flex items-center gap-2">
                                <span class="w-1 h-4 rounded-full bg-green-400"></span> 趋势追踪
                            </h4>
                            <div class="flex-1 min-h-[200px] relative">
                                <canvas id="metrics-chart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Journals & Highlights -->
                    ${stats.journals.length > 0 ? `
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                             <h4 class="font-medium text-gray-700 mb-6 flex items-center gap-2">
                                <span class="w-1 h-4 rounded-full bg-purple-400"></span> 闪念与复盘
                            </h4>
                            <div class="grid grid-cols-1 gap-4">
                                ${stats.journals.map(j => `
                                    <div class="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-sm transition-shadow">
                                        <div class="flex-shrink-0 flex flex-col items-center w-12 pt-1">
                                            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">${new Date(j.date).toLocaleString('en-US', {month:'short'})}</span>
                                            <span class="text-xl font-light text-gray-800">${new Date(j.date).getDate()}</span>
                                        </div>
                                        <div class="flex-1">
                                            <p class="text-gray-600 leading-relaxed text-sm">${j.content}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Bottom Return Button -->
                <div class="flex justify-center mt-12 pb-8">
                    <button data-action="go-detail" class="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 transition-all group">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>返回日历</span>
                    </button>
                </div>
            `;

            // Init charts after render
            setTimeout(() => {
                this.initCharts(stats, hue);
            }, 0);
        }

        this.container.innerHTML = titleHtml + contentHtml;
        
        // Bind events
        const btns = this.container.querySelectorAll('[data-action="go-detail"]');
        btns.forEach(btn => {
            btn.onclick = () => {
                 store.setState({ currentView: 'detail' });
            };
        });
    }

    generateGoodThingsSection(stats) {
        if (stats.three_good_things.length === 0) return '';

        const topKeywords = Object.entries(stats.good_things_stats.keywords)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([word, count]) => ({ word, count }));

        const completionRate = Math.round((stats.good_things_stats.total_days / 10) * 100);

        return `
            <!-- 4. Three Good Things Enhanced -->
            <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-amber-100 relative overflow-hidden">
                <!-- 背景装饰 -->
                <div class="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
                <div class="absolute bottom-0 left-0 w-24 h-24 bg-orange-100 rounded-full opacity-20 translate-y-12 -translate-x-12"></div>
                
                <div class="relative z-10">
                    <!-- 标题和统计 -->
                    <div class="flex items-center justify-between mb-6">
                        <h4 class="font-medium text-gray-700 flex items-center gap-2">
                            <span class="w-1 h-4 rounded-full bg-amber-400"></span> 
                            <span class="text-lg">✨ 本旬美好回顾</span>
                        </h4>
                        <div class="flex items-center gap-4 text-sm">
                            <div class="flex items-center gap-1 text-amber-600">
                                <span class="text-xs">📝</span>
                                <span class="font-medium">${stats.good_things_stats.total_days}/10 天</span>
                            </div>
                            <div class="flex items-center gap-1 text-orange-600">
                                <span class="text-xs">🎯</span>
                                <span class="font-medium">${completionRate}%</span>
                            </div>
                        </div>
                    </div>

                    
                    <!-- 时间线展示 -->
                    <div class="space-y-4">
                        ${Object.entries(stats.three_good_things_by_date)
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
                                    这${stats.good_things_stats.total_days}天里，您记录了${stats.good_things_stats.total_items}件美好小事。
                                    ${stats.good_things_stats.total_days >= 7 ? '您真是个善于发现美好的生活观察家！' : '继续保持这份发现美好的心，让每个日子都闪闪发光。'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initCharts(stats, hue) {
        const moodChartEl = document.getElementById('mood-chart');
        const metricsChartEl = document.getElementById('metrics-chart');
        
        if (typeof Chart !== 'undefined') {
            if (moodChartEl) {
                // Destroy existing chart if any (Chart.js doesn't like canvas reuse without destroy)
                // Since we re-render innerHTML, the canvas is new, so no need to destroy old chart instance attached to old canvas.
                // But if we re-render often, we might want to check memory.
                // For now, new canvas element is fine.
                
                new Chart(moodChartEl, {
                    type: 'doughnut',
                    data: {
                        labels: ['1分', '2分', '3分', '4分', '5分'],
                        datasets: [{
                            data: stats.moodCounts,
                            backgroundColor: ['#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280'], // Grey scale for minimalist
                            hoverBackgroundColor: [`hsl(${hue}, 70%, 90%)`, `hsl(${hue}, 70%, 80%)`, `hsl(${hue}, 70%, 70%)`, `hsl(${hue}, 70%, 60%)`, `hsl(${hue}, 70%, 50%)`],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } }
                    }
                });
            }

            if (metricsChartEl) {
                new Chart(metricsChartEl, {
                    type: 'line',
                    data: {
                        labels: stats.dates,
                        datasets: [
                            { label: '睡眠(h)', data: stats.sleepData, borderColor: '#60A5FA', tension: 0.4, pointRadius: 2, yAxisID: 'y' },
                            { label: '运动(min)', data: stats.exerciseData, borderColor: '#34D399', tension: 0.4, pointRadius: 2, yAxisID: 'y1' },
                            { label: '阅读(min)', data: stats.readingData, borderColor: '#FBBF24', tension: 0.4, pointRadius: 2, yAxisID: 'y2' }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { 
                            y: { 
                                display: true,
                                position: 'left',
                                title: { display: true, text: '睡眠(h)', color: '#60A5FA', font: { size: 10 } },
                                ticks: { color: '#60A5BA', font: { size: 9 } },
                                grid: { color: 'rgba(96, 165, 250, 0.1)' },
                                min: 0,
                                max: 12,
                                suggestedMin: 4
                            },
                            y1: { 
                                display: true,
                                position: 'right',
                                title: { display: true, text: '运动(min)', color: '#34D399', font: { size: 10 } },
                                ticks: { color: '#34D399', font: { size: 9 } },
                                grid: { display: false },
                                min: 0,
                                suggestedMax: 120
                            },
                            y2: { 
                                display: true,
                                position: 'right',
                                title: { display: true, text: '阅读(min)', color: '#FBBF24', font: { size: 10 } },
                                ticks: { color: '#FBBF24', font: { size: 9 } },
                                grid: { display: false },
                                min: 0,
                                suggestedMax: 120
                            },
                            x: { grid: { display: false } } 
                        },
                        plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 8, usePointStyle: true } } }
                    }
                });
            }
        }
    }
}
