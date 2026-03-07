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
        
        // Click handler for desktop and tap for mobile
        this.gridEl.addEventListener('click', (e) => this.showActionSheet(e));
        
        // Long-press handler for mobile (alternative way to access menu)
        this.setupLongPressHandler();
        
        // Prevent default context menu
        this.gridEl.addEventListener('contextmenu', (e) => e.preventDefault());
        
        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => {
                // Show confirmation dialog before clearing
                if (!window.confirm('确定要清空所有经期历史吗？此操作不可撤销。')) {
                    return;
                }
                
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

    setupLongPressHandler() {
        let pressTimer;
        let isLongPress = false;
        const longPressDuration = 500; // ms

        const startPress = (e) => {
            const target = e.target.closest('[data-date]');
            if (!target) return;
            
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                // Prevent default to stop text selection, etc.
                if (e.preventDefault) e.preventDefault();
                // Show action sheet on long press
                this.showActionSheet(e);
            }, longPressDuration);
        };

        const cancelPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        // Touch events for mobile
        this.gridEl.addEventListener('touchstart', startPress, { passive: true });
        this.gridEl.addEventListener('touchend', cancelPress);
        this.gridEl.addEventListener('touchmove', cancelPress);
        this.gridEl.addEventListener('touchcancel', cancelPress);

        // Mouse events for desktop (optional long-press support)
        this.gridEl.addEventListener('mousedown', startPress);
        this.gridEl.addEventListener('mouseup', cancelPress);
        this.gridEl.addEventListener('mouseleave', cancelPress);
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
        
        // Calculate and display weighted interval + prediction info
        const cycles = menstrualData.cycles || [];
        const interval = this.computeWeightedInterval(cycles);
        if (this.avgIntervalEl) {
            this.avgIntervalEl.textContent = interval || '--';
        }

        this.gridEl.innerHTML = '';
        
        // Compute health status
        const healthStatus = this.computeCycleHealth(cycles);
        
        // Render calendar with prediction and health status
        this.renderCalendar(menstrualData.nextPrediction, healthStatus);
    }

    // Create prediction map for visual display with performance optimization
    createPredictionMap(nextPrediction, currentYear, currentMonth) {
        const predictionMap = new Map();
        if (!nextPrediction || !nextPrediction.start || !nextPrediction.end) return predictionMap;
        
        // Performance optimization: Only process predictions within current month ±1
        const monthStart = new Date(currentYear, currentMonth - 1, 1);
        const monthEnd = new Date(currentYear, currentMonth + 2, 0);
        const monthStartStr = this.formatDateLocal(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate());
        const monthEndStr = this.formatDateLocal(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate());
        
        if (nextPrediction.start > monthEndStr || nextPrediction.end < monthStartStr) {
            return predictionMap;
        }
        
        const start = new Date(nextPrediction.start);
        const end = new Date(nextPrediction.end);
        const current = new Date(start);
        
        while (current <= end) {
            const dateStr = this.formatDateLocal(current.getFullYear(), current.getMonth(), current.getDate());
            predictionMap.set(dateStr, {
                isPredicted: true,
                isStart: dateStr === nextPrediction.start,
                isEnd: dateStr === nextPrediction.end
            });
            current.setDate(current.getDate() + 1);
        }
        
        return predictionMap;
    }

    // Compute cycle health status with deviation warning
    computeCycleHealth(cycles) {
        if (!Array.isArray(cycles) || cycles.length < 5) return null;
        
        const history = cycles
            .filter(c => !!c.start)
            .slice()
            .sort((a, b) => new Date(a.start) - new Date(b.start));
        
        if (history.length < 5) return null;
        
        // Calculate interval lengths between consecutive cycles
        const getDaysBetween = (startStr, endStr) => {
            const start = new Date(startStr);
            const end = new Date(endStr);
            const diffTime = end - start;
            return Math.round(diffTime / (1000 * 60 * 60 * 24));
        };
        
        const intervals = [];
        for (let i = 1; i < history.length; i++) {
            intervals.push(getDaysBetween(history[i - 1].start, history[i].start));
        }
        
        // Calculate average interval (excluding outliers)
        const validIntervals = intervals.filter(len => len > 20 && len < 45);
        if (validIntervals.length === 0) return null;
        
        const avgInterval = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
        
        // Check the most recent cycle (if there's an ongoing one, check the last completed cycle)
        const recentIntervals = intervals.slice(-3); // Check last 3 intervals
        const deviations = recentIntervals.map(interval => Math.abs(interval - avgInterval));
        
        // If any recent cycle deviates by more than 7 days, show warning
        const hasLargeDeviation = deviations.some(dev => dev > 7);
        if (hasLargeDeviation) {
            const maxDeviation = Math.max(...deviations);
            const isLonger = recentIntervals[recentIntervals.length - 1] > avgInterval;
            return {
                status: 'warning',
                message: isLonger 
                    ? '最近周期较长，建议注意休息、缓解压力' 
                    : '最近周期较短，建议关注身体状况',
                deviation: Math.round(maxDeviation)
            };
        }
        
        return { status: 'normal', message: '周期规律' };
    }

    // Safe date formatting function to avoid timezone issues
    formatDateLocal(year, month, day) {
        const pad2 = (n) => String(n).padStart(2, '0');
        return `${year}-${pad2(month + 1)}-${pad2(day)}`;
    }

    // Create date map for O(1) period lookups with performance optimization
    createPeriodMap(cycles, currentYear, currentMonth) {
        const periodMap = new Map();
        if (!Array.isArray(cycles)) return periodMap;
        
        // Performance optimization: Filter cycles to current month ±1 for constant-time rendering
        const monthStart = new Date(currentYear, currentMonth - 1, 1);
        const monthEnd = new Date(currentYear, currentMonth + 2, 0);
        const monthStartStr = this.formatDateLocal(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate());
        const monthEndStr = this.formatDateLocal(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate());
        
        const relevantCycles = cycles.filter(cycle => {
            if (!cycle.start) return false;
            const cycleEnd = cycle.end || cycle.start;
            return cycle.start <= monthEndStr && cycleEnd >= monthStartStr;
        });
        
        relevantCycles.forEach(cycle => {
            if (cycle.end) {
                // Add all dates in the range
                const start = new Date(cycle.start);
                const end = new Date(cycle.end);
                const current = new Date(start);
                
                while (current <= end) {
                    const dateStr = this.formatDateLocal(current.getFullYear(), current.getMonth(), current.getDate());
                    periodMap.set(dateStr, {
                        isPeriod: true,
                        isStart: dateStr === cycle.start,
                        isEnd: dateStr === cycle.end
                    });
                    current.setDate(current.getDate() + 1);
                }
            } else {
                // Only mark the start date
                periodMap.set(cycle.start, {
                    isPeriod: true,
                    isStart: true,
                    isEnd: false
                });
            }
        });
        
        return periodMap;
    }

    renderCalendar(nextPrediction = null, healthStatus = null) {
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
        
        // Create period map for O(1) lookups with performance optimization
        const periodMap = this.createPeriodMap(menstrualData.cycles || [], year, month);
        
        // Create prediction map for visual display with performance optimization
        const predictionMap = this.createPredictionMap(nextPrediction, year, month);
        
        // Get today's date for highlighting
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const todayDate = today.getDate();

        for (let i = 1; i <= totalDays; i++) {
            const dayEl = document.createElement('div');
            const dateStr = this.formatDateLocal(year, month, i);
            
            dayEl.dataset.date = dateStr;
            dayEl.textContent = i;
            dayEl.className = 'p-1 cursor-pointer rounded-full hover:bg-gray-100 text-gray-700 relative';

            const dayData = state.userData[dateStr] || {};
            const isStartFlag = !!dayData.isPeriodStart;
            const isEndFlag = !!dayData.isPeriodEnd;
            const periodInfo = periodMap.get(dateStr);
            const isPeriodCycle = !!periodInfo;
            const predictionInfo = predictionMap.get(dateStr);
            const isPredicted = !!predictionInfo;

            // Enhanced today highlight to avoid color conflicts
            if (isCurrentMonth && i === todayDate) {
                dayEl.classList.add('font-bold', 'text-gray-900');
                // Add a small dot indicator below the number
                const dot = document.createElement('div');
                dot.className = 'w-1.5 h-1.5 bg-blue-500 rounded-full mx-auto mt-0.5';
                dayEl.appendChild(dot);
            }

            // Apply actual period styling with enhanced visual continuity and prominence
            if (isPeriodCycle) {
                // Check previous and next day for continuity
                const prevDateStr = this.formatDateLocal(year, month, i - 1);
                const nextDateStr = this.formatDateLocal(year, month, i + 1);
                const prevIsPeriod = periodMap.has(prevDateStr);
                const nextIsPeriod = periodMap.has(nextDateStr);
                
                // Remove default styling for period days
                dayEl.classList.remove('rounded-full', 'hover:bg-gray-100');
                dayEl.classList.add('border-2', 'border-rose-400');
                
                if (periodInfo.isStart || periodInfo.isEnd) {
                    // Start/end dates with enhanced styling and conditional rounded caps
                    dayEl.classList.add('bg-rose-400', 'text-white', 'font-bold', 'shadow-md');
                    
                    // Only add rounded caps if not connected to adjacent period day
                    if (periodInfo.isStart && !prevIsPeriod) {
                        dayEl.classList.add('rounded-l-full');
                    } else if (periodInfo.isEnd && !nextIsPeriod) {
                        dayEl.classList.add('rounded-r-full');
                    }
                    // If connected, remove rounded caps for seamless flow
                    if (periodInfo.isStart && prevIsPeriod) {
                        dayEl.classList.add('rounded-none', 'border-l-2');
                    }
                    if (periodInfo.isEnd && nextIsPeriod) {
                        dayEl.classList.add('rounded-none', 'border-r-2');
                    }
                } else {
                    // Middle dates with enhanced background and no gaps
                    dayEl.classList.add('bg-rose-200', 'text-rose-900', 'font-semibold', 'rounded-none', 'border-x-2', 'border-l-0', 'border-r-0');
                }
            }
            
            // Apply prediction styling with subtle pulse animation and enhanced continuity
            if (isPredicted) {
                // Check previous and next day for continuity
                const prevDateStr = this.formatDateLocal(year, month, i - 1);
                const nextDateStr = this.formatDateLocal(year, month, i + 1);
                const prevIsPredicted = predictionMap.has(prevDateStr);
                const nextIsPredicted = predictionMap.has(nextDateStr);
                
                // Remove default styling for predicted days
                dayEl.classList.remove('rounded-full', 'hover:bg-gray-100');
                dayEl.classList.add('bg-rose-50', 'border-2', 'border-rose-300', 'border-dashed', 'text-rose-600', 'animate-pulse');
                
                // Only add rounded caps if not connected to adjacent predicted day
                if (predictionInfo.isStart && !prevIsPredicted) {
                    dayEl.classList.add('rounded-l-full');
                } else if (predictionInfo.isEnd && !nextIsPredicted) {
                    dayEl.classList.add('rounded-r-full');
                }
                // If connected, remove rounded caps for seamless flow
                if (predictionInfo.isStart && prevIsPredicted) {
                    dayEl.classList.add('rounded-none', 'border-l-2');
                }
                if (predictionInfo.isEnd && nextIsPredicted) {
                    dayEl.classList.add('rounded-none', 'border-r-2');
                }
            }

            // ARIA text for accessibility
            let ariaLabel = `${year}年${month + 1}月${i}日`;
            if (isStartFlag) ariaLabel += '，经期开始';
            else if (isEndFlag) ariaLabel += '，经期结束';
            else if (isPeriodCycle) ariaLabel += '，经期中';
            else if (isPredicted) ariaLabel += '，预计经期';
            if (isCurrentMonth && i === todayDate) ariaLabel += '，今天';
            dayEl.setAttribute('aria-label', ariaLabel);
            
            this.gridEl.appendChild(dayEl);
        }
        
        // Render health status notification if needed
        if (healthStatus && healthStatus.status === 'warning') {
            this.renderHealthNotification(healthStatus);
        }
    }
    
    renderHealthNotification(healthStatus) {
        // Remove existing notification if any
        const existingNotification = document.getElementById('menstrual-health-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.id = 'menstrual-health-notification';
        notification.className = 'mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm';
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-lg">⚠️</span>
                <span class="font-medium">周期提醒: ${healthStatus.message}</span>
            </div>
        `;
        
        // Insert after the grid
        this.gridEl.parentNode.insertBefore(notification, this.gridEl.nextSibling);
    }

    showActionSheet(e) {
        const target = e.target.closest('[data-date]');
        if (!target) return;

        const dateStr = target.dataset.date;
        const dayData = store.getState().userData[dateStr] || {};
        const isPeriodStart = !!dayData.isPeriodStart;
        const isPeriodEnd = !!dayData.isPeriodEnd;
        const isPeriod = !!dayData.isPeriod;
        
        // Check if there's an ongoing period
        const state = store.getState();
        const { menstrualData } = state;
        const cycles = menstrualData.cycles || [];
        const ongoingCycle = cycles.find(c => c.start && !c.end);
        const hasOngoingPeriod = !!ongoingCycle;
        
        // Validation logic
        const validation = this.validateDateAction(dateStr, dayData);
        const isFutureDate = validation.isFuture;
        const hasConflict = validation.hasConflict;
        const conflictMessage = validation.message;

        // Create compact action sheet
        const actionSheet = document.createElement('div');
        actionSheet.className = 'fixed z-50';
        actionSheet.style.position = 'fixed';
        
        // Get viewport coordinates for positioning
        const targetRect = target.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Center the 192px wide sheet under the date
        let leftPos = targetRect.left + targetRect.width / 2 - 96;
        // Keep within viewport bounds
        leftPos = Math.max(16, Math.min(leftPos, viewportWidth - 208));
        
        actionSheet.style.left = `${leftPos}px`;
        actionSheet.style.top = `${targetRect.bottom + 8}px`;
        
        actionSheet.innerHTML = `
            <div class="bg-white rounded-lg w-48 p-2 transform transition-all shadow-xl border border-gray-100">
                <h4 class="text-xs font-semibold text-gray-700 mb-2 text-center border-b border-gray-100 pb-1">${dateStr}</h4>
                ${conflictMessage ? `<div class="mb-1.5 p-1 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs">${conflictMessage}</div>` : ''}
                <div class="space-y-1">
                    ${!isPeriodStart && !isFutureDate && !hasOngoingPeriod ? `<button data-action="start" class="w-full text-left px-2 py-1 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition-colors text-xs">🌸 开始</button>` : ''}
                    ${isFutureDate ? `<button disabled class="w-full text-left px-2 py-1 bg-gray-50 text-gray-400 rounded cursor-not-allowed text-xs">🌸 开始（未来）</button>` : ''}
                    ${!isPeriodEnd && (isPeriod || hasOngoingPeriod) ? `<button data-action="end" class="w-full text-left px-2 py-1 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition-colors text-xs">🌸 结束</button>` : ''}
                    ${(isPeriodStart || isPeriodEnd || isPeriod) ? `<button data-action="clear" class="w-full text-left px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors text-xs">🗑️ 清除</button>` : ''}
                    <button data-action="cancel" class="w-full text-left px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition-colors text-xs">取消</button>
                </div>
            </div>
        `;
        
        // Add to body for reliable positioning
        document.body.appendChild(actionSheet);

        // Handle clicks on buttons and backdrop
        actionSheet.onclick = (sheetEvent) => {
            if (sheetEvent.target === actionSheet) {
                // Backdrop click - close the sheet
                actionSheet.remove();
            } else {
                // Button click
                const action = sheetEvent.target.dataset.action;
                if (action) {
                    if (action !== 'cancel') {
                        this.handleMenuAction(action, dateStr);
                    }
                    actionSheet.remove();
                }
            }
        };
    }

    // Validation logic for date actions
    validateDateAction(dateStr, dayData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);
        
        const isFuture = targetDate > today;
        const isPast = targetDate < today;
        
        // Check for conflicting period starts
        const state = store.getState();
        const { menstrualData } = state;
        const cycles = menstrualData.cycles || [];
        
        // Find any ongoing cycle without end date
        const ongoingCycle = cycles.find(c => c.start && !c.end);
        
        let hasConflict = false;
        let message = '';
        
        if (ongoingCycle && ongoingCycle.start < dateStr) {
            hasConflict = true;
            // Calculate how many days ago the period started
            const startDate = new Date(ongoingCycle.start);
            const daysAgo = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            
            if (daysAgo === 0) {
                message = `今天已开始经期，请先标记结束日期再开始新的周期`;
            } else if (daysAgo === 1) {
                message = `昨天开始的经期还未结束，请先标记结束日期`;
            } else if (daysAgo <= 7) {
                message = `${daysAgo}天前开始的经期还未结束，请先标记结束日期`;
            } else {
                message = `从 ${ongoingCycle.start} 开始的经期还未结束，请先标记结束日期`;
            }
        }
        
        // Check for multiple starts without ends
        const recentStarts = cycles.filter(c => c.start && !c.end && c.start < dateStr);
        if (recentStarts.length > 0 && !hasConflict) {
            hasConflict = true;
            if (recentStarts.length === 1) {
                message = `有未结束的经期记录，请先标记结束日期`;
            } else {
                message = `发现 ${recentStarts.length} 个未结束的经期记录，请先处理`;
            }
        }
        
        return {
            isFuture,
            isPast,
            hasConflict,
            message
        };
    }

    handleMenuAction(action, dateStr) {
        switch (action) {
            case 'start':
                store.markPeriodStart(dateStr);
                break;
            case 'end':
                store.markPeriodEnd(dateStr);
                break;
            case 'clear':
                store.clearPeriodMark(dateStr);
                break;
        }
    }
}

export default MenstrualView;
