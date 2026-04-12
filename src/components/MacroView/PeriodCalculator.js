import { Calendar } from '../../core/Calendar.js';

export class PeriodCalculator {
    static calculateProgress(period, userData) {
        try {
            if (!period || !userData) {
                throw new Error('Invalid period or userData provided');
            }

            const todayStr = Calendar.formatLocalDate(new Date());
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const tomorrowStart = new Date(todayStart);
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);

            const periodTotalDays = Math.round((period.endDate - period.startDate) / (1000 * 60 * 60 * 24)) + 1;
            let daysPassed = 0;
            
            if (todayStart > period.endDate) {
                daysPassed = periodTotalDays;
            } else if (todayStart >= period.startDate) {
                daysPassed = Math.round((todayStart - period.startDate) / (1000 * 60 * 60 * 24)) + 1;
            }
            
            daysPassed = Math.min(daysPassed, periodTotalDays);

            return {
                daysPassed,
                totalDays: periodTotalDays,
                progressPercentage: (daysPassed / periodTotalDays) * 100
            };
        } catch (error) {
            console.error('PeriodCalculator.calculateProgress error:', error);
            return {
                daysPassed: 0,
                totalDays: 10,
                progressPercentage: 0
            };
        }
    }

    static formatDateRange(period) {
        try {
            if (!period || !period.startDate || !period.endDate) {
                throw new Error('Invalid period provided');
            }

            const startStr = `${String(period.startDate.getMonth() + 1).padStart(2, '0')}.${String(period.startDate.getDate()).padStart(2, '0')}`;
            const endStr = `${String(period.endDate.getMonth() + 1).padStart(2, '0')}.${String(period.endDate.getDate()).padStart(2, '0')}`;
            
            return { startStr, endStr };
        } catch (error) {
            console.error('PeriodCalculator.formatDateRange error:', error);
            return { startStr: '01.01', endStr: '01.10' };
        }
    }

    static generateProgressDays(period, userData, goal = '') {
        try {
            if (!period || !userData) {
                throw new Error('Invalid period or userData provided');
            }

            const todayStr = Calendar.formatLocalDate(new Date());
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const tomorrowStart = new Date(todayStart);
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);

            const hue = (period.index * 10) % 360;
            const xunColor = `hsl(${hue}, 80%, 60%)`;
            
            let checkedCount = 0;
            const progressDays = [];
            let tempDate = new Date(period.startDate);
            
            while (tempDate <= period.endDate) {
                const dStr = Calendar.formatLocalDate(tempDate);
                const data = userData[dStr] || {};
                const isChecked = data.goal_checkin === true;
                if (isChecked) checkedCount++;
                
                const isFuture = tempDate >= tomorrowStart;
                const isToday = dStr === todayStr;
                
                const dayData = {
                    dateStr: dStr,
                    isChecked,
                    isFuture,
                    isToday,
                    xunColor,
                    goal,
                    tooltip: isFuture 
                        ? `${dStr} (尚未到来)` 
                        : (isChecked ? `${dStr}: 已打卡 - ${goal || '完成目标'}` : `${dStr}: 点击打卡 - ${goal || '记录今日成果'}`),
                    canToggle: !isFuture
                };
                
                progressDays.push(dayData);
                tempDate.setDate(tempDate.getDate() + 1);
            }
            
            return {
                progressDays,
                checkedCount,
                totalCount: progressDays.length
            };
        } catch (error) {
            console.error('PeriodCalculator.generateProgressDays error:', error);
            return {
                progressDays: [],
                checkedCount: 0,
                totalCount: 10
            };
        }
    }
}
