import { CONFIG } from '../config.js';

export const Calendar = {
    startOfDay(dateInput) {
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (Number.isNaN(date.getTime())) return null;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    },

    getStartOfToday() {
        return this.startOfDay(new Date());
    },

    getTodayString() {
        return this.formatLocalDate(this.getStartOfToday());
    },

    isFutureDate(dateInput) {
        const date = this.startOfDay(dateInput);
        if (!date || Number.isNaN(date.getTime())) return false;
        return date > this.getStartOfToday();
    },

    daysBetween(dateA, dateB) {
        const first = this.startOfDay(dateA);
        const second = this.startOfDay(dateB);
        if (!first || !second || Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return 0;
        return Math.round((second - first) / (1000 * 60 * 60 * 24));
    },

    parseDateStrToLocalDate(dateStr, hour = 12) {
        try {
            if (!dateStr || typeof dateStr !== 'string') {
                throw new Error('Invalid date string');
            }
            const [year, month, day] = dateStr.split('-').map(Number);
            if (!year || !month || !day) {
                throw new Error(`Unable to parse date string: ${dateStr}`);
            }
            const localDate = new Date(year, month - 1, day, hour, 0, 0, 0);
            if (Number.isNaN(localDate.getTime())) {
                throw new Error(`Invalid local date: ${dateStr}`);
            }
            return localDate;
        } catch (error) {
            console.error('Calendar.parseDateStrToLocalDate error:', error, { dateStr });
            return null;
        }
    },

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
            if (!year || isNaN(year) || year < CONFIG.SUPPORTED_YEAR_START || year > CONFIG.SUPPORTED_YEAR_END) {
                throw new Error(`Invalid year: ${year}`);
            }

            const periods = [];
            const yearStart = new Date(year, 0, 1);

            // 验证起始日期有效性
            if (isNaN(yearStart.getTime())) {
                throw new Error(`Invalid start date for year: ${year}`);
            }

            // 计算该年的总天数（支持闰年）
            const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            const daysInYear = isLeapYear ? 366 : 365;

            for (let i = 1; i <= CONFIG.XUN_COUNT; i++) {
                // 计算每个旬的起始日期（基于固定的年初开始日期）
                const daysFromStart = (i - 1) * CONFIG.XUN_DAYS;
                const startDate = this.startOfDay(new Date(yearStart));
                startDate.setDate(yearStart.getDate() + daysFromStart);

                let daysInXun = CONFIG.XUN_DAYS;

                // 最后一旬：计算到年末的剩余天数
                if (i === CONFIG.XUN_COUNT) {
                    const yearEnd = new Date(year, 11, 31);
                    const diffTime = Math.abs(yearEnd - startDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    daysInXun = diffDays + 1; // 剩余天数（平年15天，闰年16天）
                }

                // 计算结束日期
                const endDate = this.startOfDay(new Date(startDate));
                endDate.setDate(startDate.getDate() + daysInXun - 1);

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
            
                        
            if (isNaN(today.getTime())) {
                console.error('Calendar.getCurrentXun: invalid current time');
                return null;
            }
            
            // Removed year check — getCurrentXun now works for any year,
            // not just CONFIG.YEAR. Callers should still handle null return.
            
            const currentXun = periods.find(p => {
                // 创建旬的开始和结束日期，也设置为中午避免时区问题
                const xunStart = new Date(p.startDate.getFullYear(), p.startDate.getMonth(), p.startDate.getDate(), 12, 0, 0, 0);
                const xunEnd = new Date(p.endDate.getFullYear(), p.endDate.getMonth(), p.endDate.getDate(), 12, 0, 0, 0);
                
                const result = today >= xunStart && today <= xunEnd;
                                return result;
            }) || null;
            
                        return currentXun;
        } catch (error) {
            console.error('Calendar.getCurrentXun error:', error);
            return null;
        }
    },
    

    // 新增：根据日期获取所在旬
    getXunPeriodByDate(dateInput) {
        try {
            const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
            if (isNaN(date.getTime())) {
                console.warn('Calendar.getXunPeriodByDate: invalid date', dateInput);
                return null;
            }

            const year = date.getFullYear();
            const periods = this.getXunPeriods(year);
            const target = periods.find(p => {
                const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
                const s = new Date(p.startDate.getFullYear(), p.startDate.getMonth(), p.startDate.getDate(), 12, 0, 0, 0);
                const e = new Date(p.endDate.getFullYear(), p.endDate.getMonth(), p.endDate.getDate(), 12, 0, 0, 0);
                return d >= s && d <= e;
            });

            return target || null;
        } catch (error) {
            console.error('Calendar.getXunPeriodByDate error:', error, { dateInput });
            return null;
        }
    },

    // 统一接口：使用getXunPeriodByDate
    getXunRange(dateInput = new Date()) {
        try {
            const period = this.getXunPeriodByDate(dateInput);
            if (period) {
                return { startDate: period.startDate, endDate: period.endDate };
            }

            // Fallback: calculate continuous 10-day period from year start
            const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
            const yearStart = new Date(date.getFullYear(), 0, 1);
            const dayOfYear = Math.floor((date - yearStart) / (1000 * 60 * 60 * 24));
            const xunIndex = Math.floor(dayOfYear / 10) + 1;
            const daysFromStart = (xunIndex - 1) * 10;
            
            const startDate = new Date(yearStart);
            startDate.setDate(yearStart.getDate() + daysFromStart);
            
            let daysInXun = 10;
            const isLeapYear = (date.getFullYear() % 4 === 0 && date.getFullYear() % 100 !== 0) || (date.getFullYear() % 400 === 0);
            const daysInYear = isLeapYear ? 366 : 365;
            
            // Last xun: calculate remaining days to year end
            if (xunIndex >= 36) {
                const yearEnd = new Date(date.getFullYear(), 11, 31);
                const diffTime = Math.abs(yearEnd - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                daysInXun = diffDays + 1;
            }
            
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + daysInXun - 1);
            
            return { startDate, endDate };
        } catch (error) {
            console.error('Calendar.getXunRange error:', error, { dateInput });
            const fallback = new Date();
            const yearStart = new Date(fallback.getFullYear(), 0, 1);
            return {
                startDate: yearStart,
                endDate: new Date(yearStart.getFullYear(), 0, 10)
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
            let current = this.startOfDay(startDate);
            
            if (isNaN(current.getTime())) {
                throw new Error(`Invalid start date: ${startDate}`);
            }
            
            const end = this.startOfDay(endDate);
            if (isNaN(end.getTime())) {
                throw new Error(`Invalid end date: ${endDate}`);
            }
            
            while (current <= end) {
                dates.push(this.startOfDay(new Date(current)));
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
            
            const d = this.parseDateStrToLocalDate(dateStr);
            if (!d || isNaN(d.getTime())) {
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
            
            const d = this.parseDateStrToLocalDate(dateStr);
            if (!d) {
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
            
            const d1 = this.parseDateStrToLocalDate(dateStr1);
            const d2 = this.parseDateStrToLocalDate(dateStr2);
            
            if (!d1 || !d2) {
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
