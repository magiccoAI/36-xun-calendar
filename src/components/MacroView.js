
import { store } from '../core/State.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';
import './web-components/XunRow.js'; // Import the Web Component

export class MacroView {
    constructor(containerId, onViewChange) {
        this.container = document.getElementById(containerId);
        this.onViewChange = onViewChange;
        this.initEventListeners();
    }

    initEventListeners() {
        // Listen to custom events emitted by the Web Component
        this.container.addEventListener('update-goal', (e) => {
            this.handleUpdateMacroGoal(e.detail.index, e.detail.value);
        });

        this.container.addEventListener('update-remarks', (e) => {
            this.handleUpdateMacroRemarks(e.detail.index, e.detail.value);
        });

        this.container.addEventListener('toggle-checkin', (e) => {
            this.handleToggleGoalCheckin(e.detail.date, e.detail.index);
        });

        // Click on the web component to navigate to detail view
        this.container.addEventListener('click', (e) => {
            const xunRow = e.target.closest('xun-row');
            if (!xunRow) return;
            
            // Check if user clicked on inputs or checkboxes inside the shadow DOM
            const path = e.composedPath();
            const clickedInput = path.find(el => el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || (el.dataset && el.dataset.action === 'toggle-checkin'));
            
            if (clickedInput) return;
            
            // Check if clicked on navigation areas
            const isMobile = window.innerWidth < 768;
            let shouldNavigate = false;
            
            if (isMobile) {
                // Mobile: check if clicked on 旬 number area (now centered)
                const clickedIndexArea = path.find(el => {
                    return el && el.nodeType === Node.ELEMENT_NODE && 
                           el.getAttribute('aria-label') === '旬编号';
                });
                shouldNavigate = !!clickedIndexArea;
            } else {
                // Desktop: check if clicked on index column (旬 column)
                const clickedIndexArea = path.find(el => {
                    return el && el.nodeType === Node.ELEMENT_NODE && 
                           el.getAttribute('aria-label') === '旬编号';
                });
                shouldNavigate = !!clickedIndexArea;
            }
            
            if (shouldNavigate) {
                const index = parseInt(xunRow.getAttribute('period-index'));
                if (this.onViewChange) this.onViewChange('overview', index);
            }
        });
    }

    handleToggleGoalCheckin(dateStr, xunIndex) {
        const state = store.getState();
        const userData = { ...state.userData };
        const currentData = userData[dateStr] || {};
        
        // Toggle
        currentData.goal_checkin = !currentData.goal_checkin;
        userData[dateStr] = currentData;
        
        store.setState({ userData });
    }

    handleUpdateMacroGoal(index, value) {
        try {
            MacroViewValidator.validateGoal(value);
            
            const state = store.getState();
            const macroGoals = { ...state.macroGoals };
            
            if (!macroGoals[index]) macroGoals[index] = {};
            macroGoals[index].goal = MacroViewValidator.sanitizeInput(value);
            
            store.setState({ macroGoals });
        } catch (error) {
            console.error('handleUpdateMacroGoal error:', error);
            // Optionally show user feedback
        }
    }

    handleUpdateMacroRemarks(index, value) {
        const state = store.getState();
        const macroGoals = { ...state.macroGoals };
        
        if (!macroGoals[index]) macroGoals[index] = {};
        macroGoals[index].remarks = value;
        
        store.setState({ macroGoals });
    }

    render(xunPeriods, currentXun) {
        this.container.innerHTML = '';
        const state = store.getState();
        const { userData, macroGoals } = state;

        const todayStr = Calendar.formatLocalDate(new Date());
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        xunPeriods.forEach((period, index) => {
            const row = document.createElement('xun-row');
            const hue = (period.index * 10) % 360;
            const isCurrent = currentXun && currentXun.index === period.index;
            
            // Format Date
            const startStr = `${String(period.startDate.getMonth()+1).padStart(2, '0')}.${String(period.startDate.getDate()).padStart(2, '0')}`;
            const endStr = `${String(period.endDate.getMonth()+1).padStart(2, '0')}.${String(period.endDate.getDate()).padStart(2, '0')}`;
            
            // Xun Progress Calculation
            const periodTotalDays = Math.round((period.endDate - period.startDate) / (1000 * 60 * 60 * 24)) + 1;
            let daysPassed = 0;
            if (todayStart > period.endDate) {
                daysPassed = periodTotalDays;
            } else if (todayStart >= period.startDate) {
                daysPassed = Math.round((todayStart - period.startDate) / (1000 * 60 * 60 * 24)) + 1;
            }
            daysPassed = Math.min(daysPassed, periodTotalDays);

            // Goal & Remarks
            const goal = macroGoals[period.index]?.goal || '';
            const remarks = macroGoals[period.index]?.remarks || '';
            
            // Progress (Checkboxes) - We still generate inner HTML for progress area, 
            // but it is injected into the component.
            let checkedCount = 0;
            let progressHtml = '<div class="flex items-center justify-center h-full space-x-[2px]">';
            let tempDate = new Date(period.startDate);
            
            while (tempDate <= period.endDate) {
                const dStr = Calendar.formatLocalDate(tempDate);
                const data = userData[dStr] || {};
                const isChecked = data.goal_checkin === true;
                if (isChecked) checkedCount++;
                const isFuture = tempDate >= tomorrowStart;
                const isToday = dStr === todayStr;
                
                let bgClass = isChecked ? '' : 'bg-white';
                let borderClass = isChecked ? '' : 'border-gray-300';
                let opacityClass = isFuture ? 'opacity-40 cursor-not-allowed' : 'opacity-100 cursor-pointer hover:scale-110';
                let additionalClass = '';
                
                const xunColor = `hsl(${hue}, 80%, 60%)`;
                let style = isChecked 
                    ? `background-color: ${xunColor}; border-color: ${xunColor};` 
                    : `border-color: #d1d5db;`;
                
                if (isToday) {
                     borderClass = 'border-2 border-blue-500 z-10';
                     additionalClass = 'ring-2 ring-blue-200 shadow-md animate-pulse';
                     style = isChecked 
                        ? `background-color: ${xunColor}; border-color: #3b82f6;` 
                        : `border-color: #3b82f6;`;
                }
                
                const tip = isFuture 
                    ? `${dStr} (尚未到来)` 
                    : (isChecked ? `${dStr}: 已打卡 - ${goal || '完成目标'}` : `${dStr}: 点击打卡 - ${goal || '记录今日成果'}`);

                const actionAttr = isFuture ? '' : `data-action="toggle-checkin" data-date="${dStr}" data-index="${period.index}"`;

                progressHtml += `<div class="w-12 h-12 flex items-center justify-center shrink-0 md:w-auto md:h-auto md:block" ${actionAttr}>
                    <div class="w-5 h-5 md:w-2.5 md:h-2.5 rounded-[1px] border ${bgClass} ${borderClass} ${opacityClass} ${additionalClass} transition-all duration-200" 
                    style="${style}" 
                    title="${tip}"></div>
                </div>`;
                    
                tempDate.setDate(tempDate.getDate() + 1);
            }
            progressHtml += `<span class="ml-2 text-[10px] text-gray-400 font-mono self-center hidden md:inline-block">${checkedCount}/10</span>`;
            progressHtml += '</div>';

            // Set attributes on the Web Component
            row.setAttribute('period-index', period.index);
            row.setAttribute('start-date', startStr);
            row.setAttribute('end-date', endStr);
            row.setAttribute('hue', hue);
            row.setAttribute('is-current', isCurrent);
            row.setAttribute('goal', goal);
            row.setAttribute('remarks', remarks);
            row.setAttribute('days-passed', daysPassed);
            row.setAttribute('total-days', periodTotalDays);
            
            // For complex HTML we can set it via property or attribute, but property is safer for HTML strings
            // However, attribute works fine if escaped properly, or we can just pass it as a property
            row.setAttribute('progress-html', progressHtml);

            this.container.appendChild(row);
        });
    }
}
