
import { store } from '../core/State.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';
import './web-components/XunRow.js'; // Import the Web Component
import { MacroViewValidator } from './MacroView/Validation.js';
import { ProgressRenderer } from './MacroView/ProgressRenderer.js';
import { DesignSystem } from './MacroView/DesignSystem.js';

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

    renderTableHeader(parent = this.container) {
        const header = document.createElement('div');
        header.className = 'table-header';
        header.innerHTML = `
            <style>
                .table-header {
                    display: grid;
                    grid-template-columns: repeat(12, minmax(0, 1fr));
                    background-color: #f0f7ff; /* 浅蓝色背景，品牌调性呼应 */
                    border-bottom: 2px solid #bfdbfe; /* 与主体的衔接 */
                    padding: 0.75rem 0; /* 移除水平padding，与body严格对齐 */
                    margin-bottom: 0; /* 移除下边距，无缝衔接主体 */
                    gap: 0;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #1e3a8a; /* 深蓝色文字 */
                }
                .header-col {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 0 0.5rem;
                }
                .header-col-index {
                    grid-column: span 1;
                    color: #2563eb; /* “旬”列使用主品牌蓝 */
                    font-size: 1rem;
                }
                .header-col-date {
                    grid-column: span 2;
                }
                .header-col-goal {
                    grid-column: span 3;
                }
                .header-col-progress {
                    grid-column: span 4;
                }
                .header-col-remarks {
                    grid-column: span 2;
                }
                /* Mobile responsive */
                @media (max-width: 767px) {
                    .table-header {
                        display: none; /* Hide header on mobile, use inline labels instead */
                    }
                }
            </style>
            <div class="header-col header-col-index">旬</div>
            <div class="header-col header-col-date">日期</div>
            <div class="header-col header-col-goal">核心目标</div>
            <div class="header-col header-col-progress">每日微行动</div>
            <div class="header-col header-col-remarks">备注</div>
        `;
        parent.appendChild(header);
    }

    render(xunPeriods, currentXun) {
        this.container.innerHTML = '';
        
        // 创建整体表格容器
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'macro-table-wrapper';
        tableWrapper.innerHTML = `
            <style>
                .macro-table-wrapper {
                    background: white;
                    border-radius: 0.75rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                    overflow: hidden;
                    margin-bottom: 2rem;
                }
                @media (max-width: 767px) {
                    .macro-table-wrapper {
                        background: transparent;
                        border: none;
                        box-shadow: none;
                    }
                }
            </style>
        `;
        this.container.appendChild(tableWrapper);
        
        // Add table header
        this.renderTableHeader(tableWrapper);
        
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
            
            // Progress (Checkboxes) - Use ProgressRenderer for consistent rendering
            const progressDays = [];
            let checkedCount = 0;
            let tempDate = new Date(period.startDate);
            const xunColor = `hsl(${hue}, 80%, 60%)`;
            
            while (tempDate <= period.endDate) {
                const dStr = Calendar.formatLocalDate(tempDate);
                const data = userData[dStr] || {};
                const isChecked = data.goal_checkin === true;
                if (isChecked) checkedCount++;
                const isFuture = tempDate >= tomorrowStart;
                const isToday = dStr === todayStr;
                
                const tip = isFuture 
                    ? `${dStr} (尚未到来)` 
                    : (isChecked ? `${dStr}: 已打卡 - ${goal || '完成目标'}` : `${dStr}: 点击打卡 - ${goal || '记录今日成果'}`);

                progressDays.push({
                    dateStr: dStr,
                    isChecked,
                    isFuture,
                    isToday,
                    canToggle: !isFuture,
                    xunColor,
                    tooltip: tip
                });
                    
                tempDate.setDate(tempDate.getDate() + 1);
            }
            
            const progressHtml = ProgressRenderer.generateProgressHTML(progressDays, checkedCount, periodTotalDays);

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

            tableWrapper.appendChild(row);
        });
    }
}
