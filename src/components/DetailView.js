
import { store } from '../core/State.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';

export class DetailView {
    constructor(containerId, callbacks) {
        this.container = document.getElementById(containerId);
        // callbacks: { onChangeXun, onShowSummary, onDayClick }
        this.callbacks = callbacks;
        
        // Bind methods
        this.handleNavigation = this.handleNavigation.bind(this);
        this.initKeyboardShortcuts();
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const state = store.getState();
            // Allow in 'detail' OR 'overview' (combined)
            if (state.currentView !== 'detail' && state.currentView !== 'overview') return;
            
            // Check if user is typing in an input
            if (e.target.matches('input, textarea')) return;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                if (state.viewedXunIndex > 1) {
                    e.preventDefault();
                    this.callbacks.onChangeXun(-1);
                }
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                if (state.viewedXunIndex < CONFIG.XUN_COUNT) {
                    e.preventDefault();
                    this.callbacks.onChangeXun(1);
                }
            }
        });
    }


    getEnergyLevel(dayData = {}) {
        const vitality = Number(dayData.vitality);
        if (Number.isInteger(vitality) && vitality >= 1 && vitality <= 4) return vitality;

        const bodyState = dayData.body_state;
        if (bodyState && typeof bodyState === 'object') {
            const levelById = { recover: 1, normal: 2, good: 3, high: 4 };
            if (bodyState.id && levelById[bodyState.id]) return levelById[bodyState.id];

            const score = Number(bodyState.score);
            if (!Number.isNaN(score)) {
                if (score <= 35) return 1;
                if (score <= 65) return 2;
                if (score <= 85) return 3;
                return 4;
            }
        }

        return null;
    }

    getEnergyRingMarkup(dayData = {}) {
        const level = this.getEnergyLevel(dayData);
        if (!level) return '';
        return `<span class="energy-ring level-${level}" title="Energy ${level}"></span>`;
    }

    getWeatherIcon(weather) {
        const map = { 'Sunny': '☀️', 'Cloudy': '☁️', 'Overcast': '🌥️', 'Rainy': '🌧️', 'Snowy': '❄️', 'Windy': '🌬️', 'Foggy': '🌫️', 'Thunder': '⚡' };
        return map[weather] || '';
    }

    buildIndicators(dayData = {}, isWithinXun = false, periodIndex = 1, macroGoals = {}) {
        const indicators = [];

        if (dayData.goal_checkin) indicators.push('<span title="核心目标">🎯</span>');
        if (isWithinXun) {
            const xunIndicators = Array.isArray(macroGoals[periodIndex]?.indicators) ? macroGoals[periodIndex].indicators : [];
            const checkins = Array.isArray(dayData.indicator_checkins) ? dayData.indicator_checkins : [];
            const marks = ['①', '②', '③'];
            for (let i = 0; i < 3; i++) {
                if (checkins[i] === true) {
                    const title = xunIndicators[i] ? `指标：${xunIndicators[i]}` : `指标${i + 1}`;
                    indicators.push(`<span title="${title}">${marks[i]}</span>`);
                }
            }
        }
        if (dayData.goal_actions && dayData.goal_actions.length > 0) indicators.push('<span title="最小行动">✅</span>');
        if (dayData.goal_blockers) indicators.push('<span title="阻碍">🚧</span>');
        if (dayData.metrics) {
            if (dayData.metrics.exercise > 0) indicators.push('<span title="运动">🏃</span>');
            if (dayData.metrics.reading > 0) indicators.push('<span title="阅读">📚</span>');
        }
        if (dayData.journal || (dayData.emotions && dayData.emotions.length > 0)) {
            indicators.push('<span title="日记/情绪">📝</span>');
        }
        if (dayData.weather) {
            indicators.push(`<span title="${dayData.weather}">${this.getWeatherIcon(dayData.weather)}</span>`);
        }

        return indicators;
    }

    buildDayCellBodyMarkup(dayData = {}, isWithinXun = false, periodIndex = 1, macroGoals = {}) {
        const indicators = this.buildIndicators(dayData, isWithinXun, periodIndex, macroGoals);
        const energyRing = this.getEnergyRingMarkup(dayData);

        return `
            ${dayData.keywords && dayData.keywords.length > 0 ? `
            <div data-role="keywords" class="flex flex-wrap justify-center gap-0.5 mb-1 w-full px-0.5">
                ${dayData.keywords.slice(0, 3).map(k => `<span class="text-[8px] leading-tight text-gray-500 bg-white/50 px-1 rounded-sm border border-gray-100/50 break-words whitespace-normal max-w-full text-center">${k}</span>`).join('')}
            </div>
            ` : '<div class="flex-1"></div>'}

            <div data-role="bottom" class="flex items-center justify-between gap-1 text-[8px] md:text-[10px] opacity-80 mt-auto">
                <div data-role="icons" class="flex gap-0.5 md:gap-1 flex-wrap">
                    ${indicators.join('')}
                </div>
                ${energyRing}
            </div>
        `;
    }

    updateDayCell(dateStr) {
        const dayEl = this.container.querySelector(`.day-cell[data-date="${dateStr}"]`);
        if (!dayEl) return false;

        const state = store.getState();
        const xunPeriods = Calendar.getXunPeriods(CONFIG.YEAR);
        const targetPeriod = Calendar.getXunPeriodByDateStr(xunPeriods, dateStr);
        const periodIndex = targetPeriod ? targetPeriod.index : (state.viewedXunIndex || 1);
        const dayData = state.userData[dateStr] || {};

        const body = dayEl.querySelector('[data-role="day-body"]');
        if (!body) return false;
        body.innerHTML = this.buildDayCellBodyMarkup(dayData, true, periodIndex, state.macroGoals);
        return true;
    }

    render(period) {
        // Elements within the container (or passed in constructor?)
        // The original code targeted specific IDs: detail-title, detail-calendars-container, detail-content
        // I should probably control the whole section.
        // Let's assume containerId points to 'detail-content' or 'detail-section'.
        // In index.html, 'detail-content' contains the header and 'detail-calendars-container'.
        
        // Let's re-render the header and content inside this.container
        const state = store.getState();
        const { userData, macroGoals } = state;

        this.container.innerHTML = '';
        this.container.classList.remove('hidden');

        const startMonth = period.startDate.getMonth();
        const endMonth = period.endDate.getMonth();
        
        const startMonthDisplay = startMonth + 1;
        const endMonthDisplay = endMonth + 1;
        const monthDisplay = startMonth === endMonth ? `${startMonthDisplay}月` : `${startMonthDisplay}月 - ${endMonthDisplay}月`;
        
        const hue = (period.index * 10) % 360;
        const xunColor = `hsl(${hue}, 85%, 60%)`;
        const xunBg = `linear-gradient(to bottom, hsl(${hue}, 85%, 98%), #f9fafb)`;
        
        this.container.style.background = xunBg;

        const currentGoal = macroGoals[period.index]?.goal || '';
        const currentRemarks = macroGoals[period.index]?.remarks || '';

        // Header
        const header = document.createElement('div');
        header.className = "flex flex-col bg-white border-b border-gray-100";
        
        // Top Bar: Navigation & Title
        const topBar = document.createElement('div');
        topBar.className = "flex justify-between items-center p-4 gap-2 md:gap-4";
        topBar.innerHTML = `
            <div class="flex items-center gap-1">
                <button data-action="go-macro" class="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100" title="返回36旬">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="pointer-events: none;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </button>
            </div>
            <div class="flex-1 flex items-center justify-between" id="detail-title-content">
                <button data-action="prev-xun" class="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 rounded-full shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed" 
                    title="上一旬 (←)" ${period.index <= 1 ? 'disabled' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="pointer-events: none;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm" style="background-color: ${xunColor}">
                        第 ${period.index} 旬
                    </span>
                    <span class="text-xl font-light text-gray-800">2026年 ${monthDisplay}</span>
                </div>
                <button data-action="next-xun" class="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 rounded-full shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed" 
                    title="下一旬 (→)" ${period.index >= CONFIG.XUN_COUNT ? 'disabled' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="pointer-events: none;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
            <button data-action="show-summary" class="px-3 py-1 text-sm text-white rounded-md hover:opacity-90 shadow-sm transition-colors" style="background-color: ${xunColor}">
                本旬小结
            </button>
        `;
        header.appendChild(topBar);

        // Core Goal Display (Simple)
        if (currentGoal) {
            const goalDiv = document.createElement('div');
            goalDiv.className = "px-4 pb-4 md:px-6 md:pb-6";
            goalDiv.innerHTML = `
                <div class="bg-white/60 border border-gray-100 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:bg-white/80 transition-colors">
                     <div class="mt-0.5 opacity-80 text-yellow-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                        </svg>
                     </div>
                    <div class="flex-1">
                        <div class="text-gray-800 font-medium text-lg leading-relaxed font-serif tracking-wide"><span class="text-yellow-500 text-base mr-1">🌟</span>${currentGoal}</div>
                        ${currentRemarks ? `<div class="text-gray-500 text-sm mt-2 pt-2 border-t border-gray-100/50 font-light">${currentRemarks}</div>` : ''}
                    </div>
                </div>
            `;
            header.appendChild(goalDiv);
        }

        this.container.appendChild(header);
        
        // Attach Header Listeners
        header.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target || target.disabled) return;
            const action = target.dataset.action;
            if (action === 'prev-xun') this.callbacks.onChangeXun(-1);
            if (action === 'next-xun') this.callbacks.onChangeXun(1);
            if (action === 'show-summary') this.callbacks.onShowSummary(period);
            if (action === 'go-macro') this.callbacks.onGoMacro();
        });

        // Calendars Container
        const calendarsContainer = document.createElement('div');
        calendarsContainer.className = "space-y-6 md:space-y-8 p-2 md:p-6";
        this.container.appendChild(calendarsContainer);

        // Render Months
        const monthsToRender = [];
        monthsToRender.push(new Date(period.startDate.getFullYear(), startMonth, 1));
        if (startMonth !== endMonth) {
            monthsToRender.push(new Date(period.startDate.getFullYear(), endMonth, 1));
        }

        monthsToRender.forEach(monthStart => {
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
            
            const monthWrapper = document.createElement('div');
            monthWrapper.className = 'bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden mb-6';
            
            // Month Header
            const monthHeader = document.createElement('div');
            monthHeader.className = 'bg-white/50 px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 font-light text-xl text-gray-800 flex justify-between items-center';
            monthHeader.innerHTML = `<span>${monthStart.getMonth() + 1}月</span><span class="text-xs text-gray-300 font-mono">${monthStart.getFullYear()}</span>`;
            monthWrapper.appendChild(monthHeader);

            // Week Header
            const gridHeader = document.createElement('div');
            gridHeader.className = 'grid grid-cols-7 bg-gray-50/30 border-b border-gray-100';
            gridHeader.innerHTML = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => `<div class="text-center font-medium text-[8px] md:text-[10px] text-gray-400 py-2 md:py-3 tracking-wider">${d}</div>`).join('');
            monthWrapper.appendChild(gridHeader);

            // Grid Body
            const gridBody = document.createElement('div');
            gridBody.className = 'grid grid-cols-7 bg-white/60';
            
            // Empty cells
            for (let i = 0; i < monthStart.getDay(); i++) {
                const empty = document.createElement('div');
                empty.className = "border-t border-r border-gray-50 bg-gray-50/10 h-20 md:h-28";
                gridBody.appendChild(empty);
            }

            let currentDate = new Date(monthStart);
            while (currentDate <= monthEnd) {
                const dateStr = Calendar.formatLocalDate(currentDate);
                const dayData = userData[dateStr] || {};
                const isWithinXun = currentDate >= period.startDate && currentDate <= period.endDate;
                
                // Menstrual Logic
                const menstrualData = state.menstrualData || { cycles: [] };
                let isPeriod = false;
                let isPredicted = false;
                
                // Check History
                for (const cycle of menstrualData.cycles) {
                    if (!cycle.start) continue;
                    // If cycle has end date
                    if (cycle.end) {
                        if (dateStr >= cycle.start && dateStr <= cycle.end) {
                            isPeriod = true;
                            break;
                        }
                    } else {
                        // 未设置结束日期时，只高亮起始当日，等待用户手动标记结束
                        if (dateStr === cycle.start) {
                            isPeriod = true;
                            break;
                        }
                    }
                }
                


                let jieQi = '', lunarDay = '';
                let holidayName = '';
                let isHoliday = false;
                
                // Lunar/Solar/Holiday Logic (Global Dependency)
                if (typeof window.Solar !== 'undefined') {
                    const solar = window.Solar.fromYmd(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
                    const lunar = solar.getLunar();
                    jieQi = lunar.getJieQi();
                    lunarDay = lunar.getDayInChinese() === '初一' ? lunar.getMonthInChinese() + '月' : lunar.getDayInChinese();
                    
                    if (typeof window.HolidayUtil !== 'undefined') {
                        const h = window.HolidayUtil.getHoliday(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
                        if (h) {
                            holidayName = h.getName();
                            isHoliday = !h.isWork();
                        }
                    }
                }

                const dayEl = document.createElement('div');
                const baseClass = `day-cell p-1 md:p-3 border-t border-r border-gray-50 min-h-[5rem] md:min-h-[7rem] max-h-[20rem] overflow-y-auto h-auto flex flex-col relative transition-all duration-200 group`;
                const activeClass = `cursor-pointer`;
                const inactiveClass = `bg-gray-50/40 text-gray-300 grayscale opacity-50`;

                dayEl.className = `${baseClass} ${isWithinXun ? activeClass : inactiveClass}`;
                dayEl.dataset.date = dateStr;
                
                if (isPeriod && state.settings.showMenstrualCycle) {
                    dayEl.style.background = 'rgba(252, 211, 241, 0.3)'; // A light pink background
                } else if (isWithinXun) {
                    dayEl.style.background = `linear-gradient(135deg, hsl(${hue}, 90%, 96%) 0%, hsl(${hue}, 80%, 92%) 100%)`;
                    dayEl.style.boxShadow = `inset 0 0 0 1px hsl(${hue}, 80%, 80%)`;
                } else {
                    dayEl.style.background = 'white';
                }

                const dateColor = isWithinXun ? 'text-gray-700' : 'text-gray-300';
                const subText = holidayName 
                    ? `<span class="${isHoliday ? 'text-red-500 font-bold' : 'text-gray-500'}">${holidayName}</span>` 
                    : (jieQi ? `<span class="text-blue-500 font-medium">${jieQi}</span>` : lunarDay);

                const dayBodyMarkup = this.buildDayCellBodyMarkup(dayData, isWithinXun, period.index, macroGoals);

                dayEl.innerHTML = `
                    <div class="flex justify-between items-start mb-1">
                        <span class="text-xs md:text-sm font-medium ${dateColor} group-hover:text-blue-600 transition-colors">${currentDate.getDate()}</span>
                        <span class="text-[8px] md:text-[10px] ${holidayName ? '' : 'text-gray-400'} scale-90 origin-right transform">${subText}</span>
                    </div>
                    <div data-role="day-body" class="flex-1 flex flex-col w-full">${dayBodyMarkup}</div>
                `;

                if (isWithinXun) {
                    const dStr = dateStr;
                    dayEl.addEventListener('click', () => this.callbacks.onDayClick(dStr));
                }
                
                gridBody.appendChild(dayEl);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            monthWrapper.appendChild(gridBody);
            calendarsContainer.appendChild(monthWrapper);
        });
    }

    handleNavigation(offset) {
        // ... logic if needed internal
    }
}
