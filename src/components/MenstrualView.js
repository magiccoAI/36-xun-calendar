
import { store } from '../core/State.js';

class MenstrualView {
    constructor() {
        this.modal = document.getElementById('menstrual-modal');
        this.closeBtn = document.getElementById('menstrual-modal-close');
        this.prevBtn = document.getElementById('menstrual-prev-month');
        this.nextBtn = document.getElementById('menstrual-next-month');
        this.monthYearEl = document.getElementById('menstrual-month-year');
        this.gridEl = document.getElementById('menstrual-calendar-grid');
        this.avgCycleEl = document.getElementById('menstrual-avg-cycle');
        this.avgDurationEl = document.getElementById('menstrual-avg-duration');
        this.avgIntervalEl = document.getElementById('menstrual-avg-interval');
        this.openBtn = document.getElementById('menstrual-view-btn');

        this.contextMenu = document.getElementById('menstrual-context-menu');
        this.clearAllBtn = document.getElementById('menstrual-clear-all');
        this.currentDate = new Date();

        this.init();
    }

    computeWeightedInterval(cycles) {
        if (!Array.isArray(cycles) || cycles.length < 2) return null;

        const history = cycles
            .filter(c => !!c.start)
            .slice()
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        if (history.length < 2) return null;

        const getDaysBetween = (startStr, endStr) => {
            const start = new Date(startStr);
            const end = new Date(endStr);
            const diffTime = end - start;
            return Math.round(diffTime / (1000 * 60 * 60 * 24));
        };

        const lengths = [];
        for (let i = 1; i < history.length; i++) {
            lengths.push(getDaysBetween(history[i - 1].start, history[i].start));
        }
        if (lengths.length === 0) return null;

        const baseWeights = [0.2, 0.3, 0.5];
        const recent = lengths.slice(-3);
        const weights = baseWeights.slice(baseWeights.length - recent.length);
        const weightSum = weights.reduce((a, b) => a + b, 0);

        let sum = 0;
        for (let i = 0; i < recent.length; i++) {
            sum += recent[i] * weights[i];
        }

        return Math.round(sum / (weightSum || 1));
    }

    init() {
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.prevBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextBtn.addEventListener('click', () => this.changeMonth(1));
        this.gridEl.addEventListener('contextmenu', (e) => this.showContextMenu(e));
        document.addEventListener('click', () => this.contextMenu.classList.add('hidden'));
        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => {
                const { menstrualData, userData } = store.getState();
                const avgLength = menstrualData?.avgLength || 28;
                const avgDuration = menstrualData?.avgDuration || 5;

                const newUserData = { ...userData };
                Object.keys(newUserData).forEach(dateStr => {
                    const day = newUserData[dateStr] || {};
                    const { isPeriod, isPeriodStart, isPeriodEnd, ...rest } = day;
                    if (Object.keys(rest).length === 0) {
                        delete newUserData[dateStr];
                    } else {
                        newUserData[dateStr] = rest;
                    }
                });

                store.setState({
                    menstrualData: { cycles: [], avgLength, avgDuration, nextPrediction: null },
                    userData: newUserData
                });
            });
        }
        
        store.subscribe(this.render.bind(this));
    }

    open() {
        this.currentDate = new Date();
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        this.render();
    }

    close() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.render();
    }

    render() {
        if (this.modal.classList.contains('hidden')) {
            return;
        }

        const state = store.getState();
        const { menstrualData } = state;

        this.monthYearEl.textContent = `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`;
        this.avgCycleEl.textContent = menstrualData.avgLength > 0 ? menstrualData.avgLength : '--';
        this.avgDurationEl.textContent = menstrualData.avgDuration > 0 ? menstrualData.avgDuration : '--';
        if (this.avgIntervalEl) {
            const interval = this.computeWeightedInterval(menstrualData.cycles || []);
            this.avgIntervalEl.textContent = interval || '--';
        }

        this.gridEl.innerHTML = '';
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDayOfWeek = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // Add weekday headers
        ['日', '一', '二', '三', '四', '五', '六'].forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'font-semibold text-xs text-gray-400';
            dayEl.textContent = day;
            this.gridEl.appendChild(dayEl);
        });

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startDayOfWeek; i++) {
            this.gridEl.appendChild(document.createElement('div'));
        }

        // Add day cells
        const state = store.getState();
        const { menstrualData } = state;

        for (let i = 1; i <= totalDays; i++) {
            const dayEl = document.createElement('div');
            const date = new Date(year, month, i);
            const dateStr = date.toISOString().split('T')[0];
            
            dayEl.dataset.date = dateStr;
            dayEl.textContent = i;
            dayEl.className = 'p-1 cursor-pointer rounded-full hover:bg-gray-100 text-gray-700';

            const dayData = state.userData[dateStr] || {};
            const isStartFlag = !!dayData.isPeriodStart;
            const isEndFlag = !!dayData.isPeriodEnd;

            // 根据周期记录，高亮开始-结束之间的所有日期（柔和底色，不改变文字颜色）
            let isPeriodCycle = false;
            if (menstrualData && Array.isArray(menstrualData.cycles)) {
                for (const cycle of menstrualData.cycles) {
                    if (!cycle.start) continue;
                    if (cycle.end) {
                        if (dateStr >= cycle.start && dateStr <= cycle.end) {
                            isPeriodCycle = true;
                            break;
                        }
                    } else {
                        // 未设置结束日期时，只高亮起始当日，等待用户手动标记结束
                        if (dateStr === cycle.start) {
                            isPeriodCycle = true;
                            break;
                        }
                    }
                }
            }

            if (isPeriodCycle) {
                dayEl.classList.add('bg-rose-50');
            }

            // 起止两天更明显一点：更深的底色和文字颜色
            if (isStartFlag || isEndFlag) {
                dayEl.classList.remove('hover:bg-gray-100');
                dayEl.classList.add('bg-rose-200', 'text-rose-700', 'font-semibold');
            }

            // 用心形图标叠加标记起止两天
            if (isStartFlag || isEndFlag) {
                dayEl.classList.add('relative');
                const heartIcon = document.createElement('span');
                heartIcon.innerHTML = '<svg class="w-4 h-4 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80"><use href="#icon-heart"></use></svg>';
                dayEl.appendChild(heartIcon);
            }

            // 简单的 ARIA 文本，帮助读屏器用户理解含义
            let ariaLabel = `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月${i}日`;
            if (isStartFlag) ariaLabel += '，经期开始';
            else if (isEndFlag) ariaLabel += '，经期结束';
            else if (isPeriodCycle) ariaLabel += '，经期中';
            dayEl.setAttribute('aria-label', ariaLabel);
            
            this.gridEl.appendChild(dayEl);
        }
    }

    showContextMenu(e) {
        e.preventDefault();
        const target = e.target.closest('[data-date]');
        if (!target) return;

        const dateStr = target.dataset.date;

        this.contextMenu.style.top = `${e.clientY}px`;
        this.contextMenu.style.left = `${e.clientX}px`;
        this.contextMenu.classList.remove('hidden');

        this.contextMenu.onclick = (menuEvent) => {
            const action = menuEvent.target.dataset.action;
            if (action) {
                this.handleMenuAction(action, dateStr);
            }
            this.contextMenu.classList.add('hidden');
        };
    }

    handleMenuAction(action, dateStr) {
        const dayData = store.getState().userData[dateStr] || {};
        switch (action) {
            case 'start':
                store.addPeriodStart(dateStr);
                store.updateDay(dateStr, { ...dayData, isPeriod: true, isPeriodStart: true, isPeriodEnd: false });
                break;
            case 'end':
                store.addPeriodEnd(dateStr);
                store.updateDay(dateStr, { ...dayData, isPeriod: true, isPeriodEnd: true });
                break;
            case 'clear':
                const { isPeriod, isPeriodStart, isPeriodEnd, ...rest } = dayData;
                store.removePeriodRecord(dateStr);
                store.updateDay(dateStr, rest);
                break;
        }
    }
}

export default MenstrualView;
