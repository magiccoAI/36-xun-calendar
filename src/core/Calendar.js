import { CONFIG } from '../config.js';

export const Calendar = {
    pad2(n) {
        return String(n).padStart(2, '0');
    },

    formatLocalDate(d) {
        return `${d.getFullYear()}-${this.pad2(d.getMonth() + 1)}-${this.pad2(d.getDate())}`;
    },

    getXunPeriods(year) {
        const periods = [];
        let currentDate = new Date(year, 0, 1);
        
        for (let i = 1; i <= CONFIG.XUN_COUNT; i++) {
            const startDate = new Date(currentDate);
            let daysInXun = CONFIG.XUN_DAYS;
            
            // Special handling for the last period to cover the rest of the year
            if (i === CONFIG.XUN_COUNT) {
                 const yearEnd = new Date(year, 11, 31);
                 const diffTime = Math.abs(yearEnd - currentDate);
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                 daysInXun = diffDays + 1; // +1 to include today
            }

            currentDate.setDate(currentDate.getDate() + daysInXun);
            const endDate = new Date(currentDate);
            endDate.setDate(endDate.getDate() - 1);
            
            periods.push({ index: i, startDate, endDate, days: daysInXun });
        }
        return periods;
    },

    getCurrentXun(periods) {
        const now = new Date();
        if (now.getFullYear() !== CONFIG.YEAR) return null;
        return periods.find(p => now >= p.startDate && now <= p.endDate) || null;
    },
    
    // Helper to get all dates in a range
    getDatesInRange(startDate, endDate) {
        const dates = [];
        let current = new Date(startDate);
        while (current <= endDate) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    },

    getXunPeriodByDateStr(periods, dateStr) {
        const d = new Date(dateStr);
        return periods.find(p => d >= p.startDate && d <= p.endDate);
    }
};
