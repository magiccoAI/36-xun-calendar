
import { store } from '../core/State.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';

export class MacroView {
    constructor(containerId, onViewChange) {
        this.container = document.getElementById(containerId);
        this.onViewChange = onViewChange;
        this.initEventListeners();
    }

    initEventListeners() {
        // Event Delegation for Macro View
        this.container.addEventListener('click', (e) => {
            // Handle Goal Checkin Click
            const checkinBtn = e.target.closest('[data-action="toggle-checkin"]');
            if (checkinBtn) {
                const date = checkinBtn.dataset.date;
                const index = parseInt(checkinBtn.dataset.index);
                this.handleToggleGoalCheckin(date, index);
                return; // Stop propagation
            }
            
            // Handle Xun Row Click (to show detail)
            // Need to be careful not to trigger when clicking input or checkin
            const inputArea = e.target.closest('[data-input="true"]');
            if (inputArea) {
                // Manually focus textarea if wrapper clicked
                const textarea = inputArea.querySelector('textarea');
                if (textarea && e.target !== textarea) {
                     textarea.focus();
                }
                return;
            }
            const row = e.target.closest('[data-action="show-detail"]');
            if (row && !e.target.closest('input, textarea, [data-action="toggle-checkin"]')) {
                const index = parseInt(row.dataset.index);
                if (this.onViewChange) this.onViewChange('overview', index);
            }
        });

        // Event Delegation for Inputs (Textarea)
        this.container.addEventListener('focusout', (e) => {
            if (e.target.matches('[data-action="update-goal"]')) {
                const index = parseInt(e.target.dataset.index);
                const value = e.target.value;
                this.handleUpdateMacroGoal(index, value);
            }
            if (e.target.matches('[data-action="update-remarks"]')) {
                const index = parseInt(e.target.dataset.index);
                const value = e.target.value;
                this.handleUpdateMacroRemarks(index, value);
            }
        });
        
        this.container.addEventListener('input', (e) => {
             if (e.target.matches('textarea')) {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight) + 'px';
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
        const state = store.getState();
        const macroGoals = { ...state.macroGoals };
        
        if (!macroGoals[index]) macroGoals[index] = {};
        macroGoals[index].goal = value;
        
        store.setState({ macroGoals });
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
            // Correct index is period.index (1-based usually)
            const row = document.createElement('div');
            row.id = `xun-row-${period.index}`;
            row.dataset.action = "show-detail";
            row.dataset.index = period.index;
            row.className = "grid grid-cols-1 md:grid-cols-12 gap-0 text-sm group hover:bg-opacity-80 transition-colors border-b border-gray-100 md:border-none relative";
            
            // Gradient Background
            const hue = (period.index * 10) % 360;
            row.style.backgroundColor = `hsl(${hue}, 70%, 96%)`;
            
            // Check if current xun
            if (currentXun && currentXun.index === period.index) {
                 row.classList.add('ring-2', 'ring-blue-400', 'z-10');
            }

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
            const progressText = `${daysPassed}/${periodTotalDays}`;

            // Goal & Remarks
            const goal = macroGoals[period.index]?.goal || '';
            
            // Progress (Checkboxes)
            let checkedCount = 0; // Stats Counter
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

                // Use data attributes instead of onclick
                const actionAttr = isFuture ? '' : `data-action="toggle-checkin" data-date="${dStr}" data-index="${period.index}"`;

                // Touch target wrapper (48x48px on mobile)
                // Desktop: wrapper is inline/small, dot is 2.5 (10px)
                progressHtml += `<div class="w-12 h-12 flex items-center justify-center shrink-0 md:w-auto md:h-auto md:block" ${actionAttr}>
                    <div class="w-5 h-5 md:w-2.5 md:h-2.5 rounded-[1px] border ${bgClass} ${borderClass} ${opacityClass} ${additionalClass} transition-all duration-200" 
                    style="${style}" 
                    title="${tip}"></div>
                </div>`;
                    
                tempDate.setDate(tempDate.getDate() + 1);
            }
            // Add Stats Text
            progressHtml += `<span class="ml-2 text-[10px] text-gray-400 font-mono self-center hidden md:inline-block">${checkedCount}/10</span>`;
            progressHtml += '</div>';

            row.innerHTML = `
                <!-- Index & Date -->
                <div class="col-span-1 md:col-span-1 flex items-center justify-between md:justify-center p-3 md:py-3 md:px-0 bg-gray-50/50 md:bg-transparent border-b md:border-b-0 md:border-r border-black/5 cursor-pointer hover:bg-black/5 min-h-[48px]">
                    <div class="flex flex-row items-baseline justify-center">
                        <span class="text-3xl font-black text-gray-800 font-serif tracking-tight" style="font-family: 'Times New Roman', serif;">${period.index}</span>
                        <span class="text-[10px] text-gray-400 font-serif ml-1">旬</span>
                    </div>
                    <div class="md:hidden text-xs text-gray-400 font-mono">
                        <span>${startStr} - ${endStr}</span>
                        <span class="font-bold text-gray-500 ml-2">${progressText}</span>
                    </div>
                </div>
                
                <div class="hidden md:flex col-span-2 items-center justify-center font-mono text-gray-600 border-r border-black/5 text-xs">
                    <div class="flex flex-col items-center">
                        <span>${startStr} - ${endStr}</span>
                        <span class="text-gray-400 font-bold mt-1">${progressText}</span>
                    </div>
                </div>

                <!-- Goal Input -->
                <div data-input="true" class="col-span-1 md:col-span-4 border-b md:border-b-0 md:border-r border-black/5 p-3 md:p-2 flex flex-col justify-center cursor-text">
                    <label class="md:hidden text-xs text-gray-400 font-bold mb-1">核心目标</label>
                    <textarea class="w-full bg-white/50 border border-gray-200 rounded-md focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-700 placeholder-gray-400 text-base md:text-sm resize-none overflow-hidden min-h-[48px] md:min-h-[32px] whitespace-pre-wrap transition-all py-2 px-3 md:py-1.5 md:px-2" 
                        placeholder="本旬核心目标... (支持换行)" rows="1" 
                        data-action="update-goal"
                        data-index="${period.index}">${goal}</textarea>
                </div>

                <!-- Check-in Dots -->
                <div class="col-span-1 md:col-span-3 border-b md:border-b-0 md:border-r border-black/5 py-3 md:py-1 flex flex-col md:flex-row items-center justify-center overflow-x-auto touch-pan-x">
                    <label class="md:hidden text-xs text-gray-400 font-bold mb-2">每日打卡 ${checkedCount}/10 (左右滑动)</label>
                    ${progressHtml}
                </div>
                
                <!-- Remarks -->
                 <div data-input="true" class="col-span-1 md:col-span-2 p-3 md:p-1 flex flex-col justify-center">
                    <label class="md:hidden text-xs text-gray-400 font-bold mb-1">备注</label>
                    <textarea class="w-full bg-transparent border-none focus:ring-0 text-gray-500 placeholder-gray-300 text-sm md:text-xs resize-none overflow-hidden min-h-[48px] md:min-h-[24px] whitespace-pre-wrap" 
                        placeholder="备注..." rows="1" 
                        data-action="update-remarks" 
                        data-index="${period.index}">${macroGoals[period.index]?.remarks || ''}</textarea>
                </div>
            `;
            
            // Fix textarea height after render
            row.querySelectorAll('textarea').forEach(textarea => {
                textarea.style.height = 'auto';
                const height = textarea.scrollHeight > 0 ? textarea.scrollHeight : 32;
                textarea.style.height = height + 'px';
            });

            this.container.appendChild(row);
        });
    }
}
