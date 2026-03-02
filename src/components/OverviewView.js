
import { store } from '../core/State.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';

export class OverviewView {
    constructor(containerId, onDateClick) {
        this.container = document.getElementById(containerId);
        this.onDateClick = onDateClick;
    }

    render(xunPeriods) {
        this.container.innerHTML = '';
        this.container.className = 'flex flex-wrap gap-1 justify-center p-2 md:p-4 bg-white rounded-xl shadow-sm border border-gray-100'; 
        
        const legend = document.createElement('div');
        legend.className = "w-full flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-50 gap-2";
        legend.innerHTML = `
            <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-500">每日记录（记录热度）</span>
                <span class="text-[11px] text-gray-500">点击任意日期，自动打开下方旬日历</span>
            </div>
            <div class="flex flex-wrap gap-4 text-xs text-gray-500">
                <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-[1px] bg-gray-50 border border-gray-200"></span> 
                    <span>未记录</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-[1px] shadow-sm" style="background-color: hsl(210, 85%, 60%)"></span> 
                    <span>已记录</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-[1px] border-2 border-blue-400 bg-white"></span> 
                    <span>今天</span>
                </div>
            </div>
        `;
        this.container.appendChild(legend);

        const start = new Date(CONFIG.YEAR, 0, 1);
        const end = new Date(CONFIG.YEAR, 11, 31);
        
        const dateToXunMap = {};
        xunPeriods.forEach(p => {
            let d = new Date(p.startDate);
            while (d <= p.endDate) {
                dateToXunMap[Calendar.formatLocalDate(d)] = p;
                d.setDate(d.getDate() + 1);
            }
        });

        const state = store.getState();
        
        // --- Menstrual Reminder ---
        const menstrualData = state.menstrualData;
        if (menstrualData && menstrualData.nextPrediction) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const nextStart = new Date(menstrualData.nextPrediction.start);
            nextStart.setHours(0,0,0,0);
            
            const diffTime = nextStart - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let message = '';
            
            // Scenario 1: Coming soon (in 3 days)
            if (diffDays > 0 && diffDays <= 3) {
                message = `🌸 温馨提醒：预计还有 ${diffDays} 天生理期可能造访，请注意保暖休息。`;
            } 
            // Scenario 2: Today is the day or passed, but within prediction window
            else if (diffDays <= 0) {
                 const nextEnd = new Date(menstrualData.nextPrediction.end);
                 nextEnd.setHours(0,0,0,0);
                 
                 if (today <= nextEnd) {
                     // Check if user has recorded a start recently
                     const hasRecentRecord = menstrualData.cycles.some(c => {
                         const start = new Date(c.start);
                         const d = Math.abs((start - nextStart) / (1000 * 60 * 60 * 24));
                         return d < 14; 
                     });
                     
                     if (!hasRecentRecord) {
                         const delayedDays = Math.abs(diffDays);
                         const prefix = delayedDays === 0 ? "预计今天生理期" : `生理期可能已推迟 ${delayedDays} 天`;
                         message = `🌸 ${prefix}，如果如期而至，请记得记录哦。`;
                     }
                 }
            }
            
            if (message) {
                const banner = document.createElement('div');
                banner.className = "w-full mb-4 px-4 py-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm flex items-center gap-3 shadow-sm";
                banner.innerHTML = `
                    <span class="text-xl">🍵</span>
                    <span class="font-medium">${message}</span>
                    <button class="ml-auto text-rose-400 hover:text-rose-600 font-bold p-1" onclick="this.parentElement.remove()">×</button>
                `;
                // Insert before legend if it exists, otherwise append
                if (this.container.firstChild) {
                    this.container.insertBefore(banner, this.container.firstChild);
                } else {
                    this.container.appendChild(banner);
                }
            }
        }
        // --------------------------

        const { userData, macroGoals } = state;
        const todayStr = Calendar.formatLocalDate(new Date());

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = Calendar.formatLocalDate(d);
            const xun = dateToXunMap[dateStr];
            const xunIndex = xun ? xun.index : 0;
            
            const el = document.createElement('div');
            el.className = 'w-3 h-3 md:w-4 md:h-4 rounded-[1px] cursor-pointer transition-all duration-200 hover:scale-125 relative group';
            
            const hue = (xunIndex * 10) % 360;
            
            const data = userData[dateStr];
            const hasIndicators = data && Array.isArray(data.indicator_checkins) && data.indicator_checkins.some(v => v === true);
            const hasGoalActions = data && Array.isArray(data.goal_actions) && data.goal_actions.length > 0;
            const hasKeywords = data && Array.isArray(data.keywords) && data.keywords.length > 0;
            const hasData = data && (data.mood || data.journal || data.weather || data.goal_checkin || data.goal_confidence || data.goal_blockers || hasGoalActions || hasIndicators || hasKeywords);
            
            // Menstrual Cycle Marker
            let isPeriod = false;
            let isPredicted = false;
            if (state.settings.showMenstrualCycle) {
                // Check History
                for (const cycle of menstrualData.cycles) {
                    if (cycle.end) {
                        if (dateStr >= cycle.start && dateStr <= cycle.end) {
                            isPeriod = true;
                            break;
                        }
                    } else {
                        const todayStr = Calendar.formatLocalDate(new Date());
                        if (dateStr >= cycle.start && dateStr <= todayStr) {
                            isPeriod = true;
                            break;
                        }
                    }
                }
                // Check Prediction
                if (!isPeriod && menstrualData.nextPrediction) {
                    if (dateStr >= menstrualData.nextPrediction.start && dateStr <= menstrualData.nextPrediction.end) {
                        isPredicted = true;
                    }
                }
            }

            if (hasData) {
                    el.style.backgroundColor = `hsl(${hue}, 85%, 60%)`;
                    el.style.boxShadow = `0 0 2px hsl(${hue}, 85%, 40%)`;
            } else {
                    el.style.backgroundColor = `hsl(${hue}, 85%, 90%)`;
            }

            if (dateStr === todayStr) {
                    el.style.border = '2px solid #3b82f6';
                    el.classList.add('z-10');
            }

            if (isPeriod) {
                const marker = document.createElement('span');
                marker.className = 'absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-rose-400 rounded-full';
                el.appendChild(marker);
            } else if (isPredicted) {
                const marker = document.createElement('span');
                marker.className = 'absolute top-0.5 right-0.5 w-1.5 h-1.5 border border-rose-400 rounded-full';
                el.appendChild(marker);
            }
            
            // Mood Emoji Map
            const moodEmojis = {1: '😫', 2: '😞', 3: '😐', 4: '🙂', 5: '🤩'};
            const moodEmoji = data && data.mood ? moodEmojis[data.mood] : (data && data.emoji ? data.emoji : '');
            
            // Tooltip
            const keywordsStr = data && data.keywords ? ` [${data.keywords.join(' ')}]` : '';
            const goalStr = data && data.goal_checkin ? ' 🎯' : '';
            const xunIndicators = Array.isArray(macroGoals[xunIndex]?.indicators) ? macroGoals[xunIndex].indicators : [];
            const indicatorTotal = xunIndicators.length;
            const indicatorDone = data && Array.isArray(data.indicator_checkins)
                ? data.indicator_checkins.slice(0, indicatorTotal).filter(v => v === true).length
                : 0;
            const indicatorStr = indicatorTotal > 0 ? ` 📌${indicatorDone}/${indicatorTotal}` : '';
            el.title = `${dateStr} ${moodEmoji}${goalStr}${indicatorStr}${keywordsStr} (第 ${xunIndex} 旬)`;
            
            if (xun) {
                el.onclick = () => {
                    if (this.onDateClick) this.onDateClick(dateStr);
                };
            }

            this.container.appendChild(el);
        }
    }
}
