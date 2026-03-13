import { CONFIG } from '../config.js';

export const Calendar = {
    pad2(n) {
        try {
            return String(n).padStart(2, '0');
        } catch (error) {
            console.error('Calendar.pad2 error:', error);
            return String(n).length === 1 ? '0' + n : String(n);
        }
    },

    formatLocalDate(d) {
        try {
            if (!d || isNaN(d.getTime())) {
                throw new Error('Invalid date object');
            }
            return `${d.getFullYear()}-${this.pad2(d.getMonth() + 1)}-${this.pad2(d.getDate())}`;
        } catch (error) {
            console.error('Calendar.formatLocalDate error:', error, d);
            return '2026-01-01'; // 降级到默认日期
        }
    },

    getXunPeriods(year) {
        try {
            // 参数验证
            if (!year || isNaN(year) || year < 2020 || year > 2100) {
                throw new Error(`Invalid year: ${year}`);
            }

            const periods = [];
            let currentDate = new Date(year, 0, 1);
            
            // 验证起始日期有效性
            if (isNaN(currentDate.getTime())) {
                throw new Error(`Invalid start date for year: ${year}`);
            }
            
            for (let i = 1; i <= CONFIG.XUN_COUNT; i++) {
                const startDate = new Date(currentDate);
                let daysInXun = CONFIG.XUN_DAYS;
                
                // Special handling for last period to cover rest of year
                if (i === CONFIG.XUN_COUNT) {
                     const yearEnd = new Date(year, 11, 31);
                     const diffTime = Math.abs(yearEnd - currentDate);
                     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                     daysInXun = diffDays + 1; // +1 to include today
                }

                currentDate.setDate(currentDate.getDate() + daysInXun);
                const endDate = new Date(currentDate);
                endDate.setDate(endDate.getDate() - 1);
                
                // 验证生成的日期有效性
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    console.error(`Invalid date range for period ${i}:`, { startDate, endDate });
                    continue; // 跳过无效周期，继续处理下一个
                }
                
                periods.push({ index: i, startDate, endDate, days: daysInXun });
            }
            
            if (periods.length === 0) {
                throw new Error('No valid periods generated');
            }
            
            return periods;
        } catch (error) {
            console.error('Calendar.getXunPeriods error:', error);
            return this.getDefaultPeriods(year); // 降级方案
        }
    },

    getDefaultPeriods(year) {
        // 降级方案：生成标准的36旬周期
        try {
            const periods = [];
            const daysPerXun = Math.floor(365 / CONFIG.XUN_COUNT);
            let remainingDays = 365;
            let currentDate = new Date(year, 0, 1);
            
            for (let i = 1; i <= CONFIG.XUN_COUNT; i++) {
                const startDate = new Date(currentDate);
                const daysInThisXun = i === CONFIG.XUN_COUNT ? remainingDays : daysPerXun;
                
                currentDate.setDate(currentDate.getDate() + daysInThisXun);
                const endDate = new Date(currentDate);
                endDate.setDate(endDate.getDate() - 1);
                
                periods.push({ 
                    index: i, 
                    startDate, 
                    endDate, 
                    days: daysInThisXun 
                });
                
                remainingDays -= daysInThisXun;
            }
            
            return periods;
        } catch (error) {
            console.error('Calendar.getDefaultPeriods error:', error);
            // 最小降级：返回基本的旬结构
            return Array.from({ length: CONFIG.XUN_COUNT }, (_, i) => ({
                index: i + 1,
                startDate: new Date(year, 0, (i * 10) + 1),
                endDate: new Date(year, 0, Math.min((i + 1) * 10, 31)),
                days: 10
            }));
        }
    },

    getCurrentXun(periods) {
        try {
            if (!periods || !Array.isArray(periods)) {
                console.warn('Calendar.getCurrentXun: invalid periods data');
                return null;
            }
            
            // 使用本地时间的日期部分，避免时区问题
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0); // 设置为中午12点，避免时区边界问题
            
            console.log('=== getCurrentXun Debug ===');
            console.log('Now (local):', now.toString());
            console.log('Today (normalized):', today.toString());
            console.log('Today ISO:', today.toISOString());
            console.log('Year check:', today.getFullYear(), 'vs', CONFIG.YEAR);
            
            if (isNaN(today.getTime())) {
                console.error('Calendar.getCurrentXun: invalid current time');
                return null;
            }
            
            if (today.getFullYear() !== CONFIG.YEAR) {
                console.log('Year mismatch, returning null');
                return null;
            }
            
            const currentXun = periods.find(p => {
                // 创建旬的开始和结束日期，也设置为中午避免时区问题
                const xunStart = new Date(p.startDate.getFullYear(), p.startDate.getMonth(), p.startDate.getDate(), 12, 0, 0, 0);
                const xunEnd = new Date(p.endDate.getFullYear(), p.endDate.getMonth(), p.endDate.getDate(), 12, 0, 0, 0);
                
                const result = today >= xunStart && today <= xunEnd;
                if (p.index >= 6 && p.index <= 10) {
                    console.log(`Xun ${p.index}: ${p.startDate.toISOString().split('T')[0]} ~ ${p.endDate.toISOString().split('T')[0]} = ${result}`);
                    console.log(`  Today >= start: ${today >= xunStart} (${today.toISOString()} >= ${xunStart.toISOString()})`);
                    console.log(`  Today <= end: ${today <= xunEnd} (${today.toISOString()} <= ${xunEnd.toISOString()})`);
                }
                return result;
            }) || null;
            
            console.log('Current Xun result:', currentXun ? `Xun ${currentXun.index}` : 'None');
            console.log('=== End Debug ===');
            return currentXun;
        } catch (error) {
            console.error('Calendar.getCurrentXun error:', error);
            return null;
        }
    },
    

    getXunRange(dateInput = new Date()) {
        try {
            const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
            if (isNaN(date.getTime())) {
                throw new Error(`Invalid date: ${dateInput}`);
            }

            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            const lastDay = new Date(year, month + 1, 0).getDate();

            let startDay = 1;
            let endDay = 10;

            if (day >= 11 && day <= 20) {
                startDay = 11;
                endDay = 20;
            } else if (day >= 21) {
                startDay = 21;
                endDay = lastDay;
            }

            return {
                startDate: new Date(year, month, startDay),
                endDate: new Date(year, month, endDay)
            };
        } catch (error) {
            console.error('Calendar.getXunRange error:', error, { dateInput });
            const fallback = new Date();
            return {
                startDate: new Date(fallback.getFullYear(), fallback.getMonth(), 1),
                endDate: new Date(fallback.getFullYear(), fallback.getMonth(), 10)
            };
        }
    },

    // Helper to get all dates in a range
    getDatesInRange(startDate, endDate) {
        try {
            if (!startDate || !endDate) {
                throw new Error('Invalid date range: missing start or end date');
            }
            
            const dates = [];
            let current = new Date(startDate);
            
            if (isNaN(current.getTime())) {
                throw new Error(`Invalid start date: ${startDate}`);
            }
            
            const end = new Date(endDate);
            if (isNaN(end.getTime())) {
                throw new Error(`Invalid end date: ${endDate}`);
            }
            
            while (current <= end) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            
            return dates;
        } catch (error) {
            console.error('Calendar.getDatesInRange error:', error, { startDate, endDate });
            return []; // 降级：返回空数组
        }
    },

    getXunPeriodByDateStr(periods, dateStr) {
        try {
            if (!periods || !Array.isArray(periods)) {
                console.warn('Calendar.getXunPeriodByDateStr: invalid periods data');
                return null;
            }
            
            if (!dateStr || typeof dateStr !== 'string') {
                console.warn('Calendar.getXunPeriodByDateStr: invalid date string', dateStr);
                return null;
            }
            
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) {
                console.warn('Calendar.getXunPeriodByDateStr: invalid date', dateStr);
                return null;
            }
            
            return periods.find(p => d >= p.startDate && d <= p.endDate);
        } catch (error) {
            console.error('Calendar.getXunPeriodByDateStr error:', error, { dateStr });
            return null;
        }
    },

    // Date helpers
    addDays(dateStr, days) {
        try {
            if (!dateStr || typeof dateStr !== 'string') {
                throw new Error('Invalid date string');
            }
            
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) {
                throw new Error(`Invalid date: ${dateStr}`);
            }
            
            d.setDate(d.getDate() + days);
            return this.formatLocalDate(d);
        } catch (error) {
            console.error('Calendar.addDays error:', error, { dateStr, days });
            return dateStr; // 降级：返回原始日期
        }
    },

    diffDays(dateStr1, dateStr2) {
        try {
            if (!dateStr1 || !dateStr2) {
                throw new Error('Invalid date strings for diff');
            }
            
            const d1 = new Date(dateStr1);
            const d2 = new Date(dateStr2);
            
            if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                throw new Error(`Invalid dates: ${dateStr1}, ${dateStr2}`);
            }
            
            return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
        } catch (error) {
            console.error('Calendar.diffDays error:', error, { dateStr1, dateStr2 });
            return 0; // 降级：返回0天
        }
    },

    isSameOrAfter(dateStr1, dateStr2) {
        try {
            const d1 = new Date(dateStr1);
            const d2 = new Date(dateStr2);
            
            if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                console.warn('Calendar.isSameOrAfter: invalid dates', { dateStr1, dateStr2 });
                return false;
            }
            
            return d1 >= d2;
        } catch (error) {
            console.error('Calendar.isSameOrAfter error:', error, { dateStr1, dateStr2 });
            return false;
        }
    },
    
    isSameOrBefore(dateStr1, dateStr2) {
        try {
            const d1 = new Date(dateStr1);
            const d2 = new Date(dateStr2);
            
            if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                console.warn('Calendar.isSameOrBefore: invalid dates', { dateStr1, dateStr2 });
                return false;
            }
            
            return d1 <= d2;
        } catch (error) {
            console.error('Calendar.isSameOrBefore error:', error, { dateStr1, dateStr2 });
            return false;
        }
    }
};
