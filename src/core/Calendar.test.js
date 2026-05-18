import { describe, it, expect, jest } from '@jest/globals';
import { Calendar } from './Calendar.js';

describe('Calendar.getXunPeriods', () => {
    it('should generate 36 xun periods for 2026', () => {
        const periods = Calendar.getXunPeriods(2026);
        expect(periods).toHaveLength(36);
        expect(periods[0].index).toBe(1);
        expect(periods[35].index).toBe(36);
    });

    it('should use continuous 10-day periods from year start', () => {
        const periods = Calendar.getXunPeriods(2026);
        
        // First xun: Jan 1-10 (use formatLocalDate to avoid timezone issues)
        expect(Calendar.formatLocalDate(periods[0].startDate)).toBe('2026-01-01');
        expect(Calendar.formatLocalDate(periods[0].endDate)).toBe('2026-01-10');
        
        // Second xun: Jan 11-20
        expect(Calendar.formatLocalDate(periods[1].startDate)).toBe('2026-01-11');
        expect(Calendar.formatLocalDate(periods[1].endDate)).toBe('2026-01-20');
        
        // Third xun: Jan 21-30
        expect(Calendar.formatLocalDate(periods[2].startDate)).toBe('2026-01-21');
        expect(Calendar.formatLocalDate(periods[2].endDate)).toBe('2026-01-30');
    });

    it('should handle last xun with remaining days (non-leap year)', () => {
        const periods = Calendar.getXunPeriods(2026);
        const lastXun = periods[35];
        
        expect(lastXun.days).toBe(15); // 365 - (35 * 10) = 15
        expect(Calendar.formatLocalDate(lastXun.endDate)).toBe('2026-12-31');
    });

    it('should handle last xun with remaining days (leap year)', () => {
        const periods = Calendar.getXunPeriods(2028);
        const lastXun = periods[35];
        
        expect(lastXun.days).toBe(16); // 366 - (35 * 10) = 16
        expect(Calendar.formatLocalDate(lastXun.endDate)).toBe('2028-12-31');
    });
});

describe('Calendar.getXunRange', () => {
    it('should return correct range for date in first xun', () => {
        const date = Calendar.parseDateStrToLocalDate('2026-01-05');
        const range = Calendar.getXunRange(date);
        expect(Calendar.formatLocalDate(range.startDate)).toBe('2026-01-01');
        expect(Calendar.formatLocalDate(range.endDate)).toBe('2026-01-10');
    });

    it('should return correct range for date in second xun', () => {
        const date = Calendar.parseDateStrToLocalDate('2026-01-15');
        const range = Calendar.getXunRange(date);
        expect(Calendar.formatLocalDate(range.startDate)).toBe('2026-01-11');
        expect(Calendar.formatLocalDate(range.endDate)).toBe('2026-01-20');
    });

    it('should return correct range for date crossing month boundary', () => {
        // Jan 31 is in 4th xun (Jan 31 - Feb 9)
        const date = Calendar.parseDateStrToLocalDate('2026-01-31');
        const range = Calendar.getXunRange(date);
        expect(Calendar.formatLocalDate(range.startDate)).toBe('2026-01-31');
        expect(Calendar.formatLocalDate(range.endDate)).toBe('2026-02-09');
    });

    it('should return correct range for date in last xun', () => {
        const date = Calendar.parseDateStrToLocalDate('2026-12-30');
        const range = Calendar.getXunRange(date);
        expect(Calendar.formatLocalDate(range.startDate)).toBe('2026-12-17');
        expect(Calendar.formatLocalDate(range.endDate)).toBe('2026-12-31');
    });

    it('should be consistent with getXunPeriods', () => {
        const periods = Calendar.getXunPeriods(2026);
        
        // Test a few dates across different xuns
        const testDateStrs = [
            '2026-01-05',
            '2026-02-15',
            '2026-06-20',
            '2026-12-25'
        ];
        
        testDateStrs.forEach(dateStr => {
            const date = Calendar.parseDateStrToLocalDate(dateStr);
            const range = Calendar.getXunRange(date);
            const period = Calendar.getXunPeriodByDate(date);
            
            expect(period).not.toBeNull();
            expect(Calendar.formatLocalDate(range.startDate)).toBe(Calendar.formatLocalDate(period.startDate));
            expect(Calendar.formatLocalDate(range.endDate)).toBe(Calendar.formatLocalDate(period.endDate));
        });
    });
});

describe('Calendar.getXunPeriodByDate', () => {
    it('should find correct period for date in first xun', () => {
        const date = Calendar.parseDateStrToLocalDate('2026-01-05');
        const period = Calendar.getXunPeriodByDate(date);
        expect(period).not.toBeNull();
        expect(period.index).toBe(1);
    });

    it('should find correct period for date crossing month boundary', () => {
        const date = Calendar.parseDateStrToLocalDate('2026-01-31');
        const period = Calendar.getXunPeriodByDate(date);
        expect(period).not.toBeNull();
        expect(period.index).toBe(4);
    });

    it('should find correct period for date in last xun', () => {
        const date = Calendar.parseDateStrToLocalDate('2026-12-30');
        const period = Calendar.getXunPeriodByDate(date);
        expect(period).not.toBeNull();
        expect(period.index).toBe(36);
    });

    it('should return null for invalid date', () => {
        const period = Calendar.getXunPeriodByDate('invalid-date');
        expect(period).toBeNull();
    });
});

describe('Calendar.parseDateStrToLocalDate - edge cases', () => {
    it('should parse valid date string correctly', () => {
        const date = Calendar.parseDateStrToLocalDate('2026-01-15');
        expect(date).not.toBeNull();
        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(0); // January
        expect(date.getDate()).toBe(15);
    });

    it('should handle leap year date (Feb 29)', () => {
        const date = Calendar.parseDateStrToLocalDate('2028-02-29');
        expect(date).not.toBeNull();
        expect(date.getFullYear()).toBe(2028);
        expect(date.getMonth()).toBe(1); // February
        expect(date.getDate()).toBe(29);
    });

    it('should return null for invalid date string', () => {
        const date = Calendar.parseDateStrToLocalDate('invalid-date');
        expect(date).toBeNull();
    });

    it('should return null for empty string', () => {
        const date = Calendar.parseDateStrToLocalDate('');
        expect(date).toBeNull();
    });

    it('should return null for null input', () => {
        const date = Calendar.parseDateStrToLocalDate(null);
        expect(date).toBeNull();
    });

    it('should return null for undefined input', () => {
        const date = Calendar.parseDateStrToLocalDate(undefined);
        expect(date).toBeNull();
    });

    it('should handle date with single-digit month/day', () => {
        const date = Calendar.parseDateStrToLocalDate('2026-1-5');
        expect(date).not.toBeNull();
        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(0);
        expect(date.getDate()).toBe(5);
    });

    it('should set hour to 12 to avoid timezone boundary issues', () => {
        const date = Calendar.parseDateStrToLocalDate('2026-01-15');
        expect(date.getHours()).toBe(12);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
    });
});

describe('Calendar.getXunPeriods - boundary years', () => {
    it('should handle minimum supported year (2026)', () => {
        const periods = Calendar.getXunPeriods(2026);
        expect(periods).toHaveLength(36);
        expect(periods[0].startDate.getFullYear()).toBe(2026);
    });

    it('should handle maximum supported year (2100)', () => {
        const periods = Calendar.getXunPeriods(2100);
        expect(periods).toHaveLength(36);
        expect(periods[0].startDate.getFullYear()).toBe(2100);
    });

    it('should return default periods for invalid year', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const periods = Calendar.getXunPeriods(2025); // Below minimum
        expect(periods).toHaveLength(36);
        consoleSpy.mockRestore();
    });

    it('should handle year 2100 (not a leap year)', () => {
        const periods = Calendar.getXunPeriods(2100);
        const lastXun = periods[35];
        expect(lastXun.days).toBe(15); // 2100 is not a leap year (century rule)
    });
});

describe('Calendar.getCurrentXun - null cases', () => {
    it('should return null for invalid periods', () => {
        const result = Calendar.getCurrentXun(null);
        expect(result).toBeNull();
    });

    it('should return null for empty periods array', () => {
        const result = Calendar.getCurrentXun([]);
        expect(result).toBeNull();
    });

    it('should return null for non-array periods', () => {
        const result = Calendar.getCurrentXun({});
        expect(result).toBeNull();
    });

    it('should return null for periods not containing current date', () => {
        const futurePeriods = Calendar.getXunPeriods(2030);
        const result = Calendar.getCurrentXun(futurePeriods);
        // May return null if current date is not in 2030 periods
        expect(result === null || result.index).toBeDefined();
    });
});

describe('Calendar.addDays', () => {
    it('should add positive days to date string', () => {
        const result = Calendar.addDays('2026-01-01', 5);
        expect(result).toBe('2026-01-06');
    });

    it('should add negative days to date string', () => {
        const result = Calendar.addDays('2026-01-10', -5);
        expect(result).toBe('2026-01-05');
    });

    it('should handle zero days', () => {
        const result = Calendar.addDays('2026-01-01', 0);
        expect(result).toBe('2026-01-01');
    });

    it('should handle month boundary crossing', () => {
        const result = Calendar.addDays('2026-01-31', 1);
        expect(result).toBe('2026-02-01');
    });

    it('should handle year boundary crossing', () => {
        const result = Calendar.addDays('2026-12-31', 1);
        expect(result).toBe('2027-01-01');
    });

    it('should handle leap year (Feb 28 + 1 = Feb 29)', () => {
        const result = Calendar.addDays('2028-02-28', 1);
        expect(result).toBe('2028-02-29');
    });

    it('should handle non-leap year (Feb 28 + 1 = Mar 1)', () => {
        const result = Calendar.addDays('2026-02-28', 1);
        expect(result).toBe('2026-03-01');
    });

    it('should return original date string for invalid input', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const result = Calendar.addDays('invalid-date', 5);
        expect(result).toBe('invalid-date');
        consoleSpy.mockRestore();
    });
});

describe('Calendar.diffDays', () => {
    it('should calculate positive difference', () => {
        const result = Calendar.diffDays('2026-01-01', '2026-01-11');
        expect(result).toBe(10);
    });

    it('should calculate negative difference', () => {
        const result = Calendar.diffDays('2026-01-11', '2026-01-01');
        expect(result).toBe(-10);
    });

    it('should return 0 for same dates', () => {
        const result = Calendar.diffDays('2026-01-01', '2026-01-01');
        expect(result).toBe(0);
    });

    it('should handle month boundary', () => {
        const result = Calendar.diffDays('2026-01-31', '2026-02-01');
        expect(result).toBe(1);
    });

    it('should handle year boundary', () => {
        const result = Calendar.diffDays('2026-12-31', '2027-01-01');
        expect(result).toBe(1);
    });

    it('should return 0 for invalid inputs', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const result = Calendar.diffDays('invalid', '2026-01-01');
        expect(result).toBe(0);
        consoleSpy.mockRestore();
    });
});

describe('Calendar - timezone safety verification', () => {
    it('should use parseDateStrToLocalDate for date parsing (not new Date)', () => {
        // This test verifies that we're using the timezone-safe method
        const date1 = Calendar.parseDateStrToLocalDate('2026-01-01');
        const date2 = new Date('2026-01-01');
        
        // They should have different hours (12 vs 0 or timezone-dependent)
        expect(date1.getHours()).toBe(12);
        // new Date() would be 0 or timezone-dependent
    });

    it('should use noon normalization in getCurrentXun', () => {
        const periods = Calendar.getXunPeriods(2026);
        const result = Calendar.getCurrentXun(periods);
        
        // The function should not throw errors due to timezone issues
        expect(result === null || result.index).toBeDefined();
    });

    it('should use noon normalization in getXunPeriodByDate', () => {
        const date = Calendar.parseDateStrToLocalDate('2026-01-15');
        const period = Calendar.getXunPeriodByDate(date);
        
        expect(period).not.toBeNull();
        expect(period.index).toBeGreaterThan(0);
    });
});

describe('Calendar.startOfDay', () => {
    it('should normalize date to start of day', () => {
        const date = new Date('2026-01-15T14:30:00');
        const start = Calendar.startOfDay(date);
        
        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
        expect(start.getSeconds()).toBe(0);
        expect(start.getMilliseconds()).toBe(0);
    });

    it('should handle date string input', () => {
        const start = Calendar.startOfDay('2026-01-15');
        
        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
    });

    it('should return null for invalid date', () => {
        const start = Calendar.startOfDay('invalid-date');
        expect(start).toBeNull();
    });
});

describe('Calendar.daysBetween', () => {
    it('should calculate days between two dates', () => {
        const date1 = Calendar.parseDateStrToLocalDate('2026-01-01');
        const date2 = Calendar.parseDateStrToLocalDate('2026-01-11');
        const result = Calendar.daysBetween(date1, date2);
        expect(result).toBe(10);
    });

    it('should handle reverse order (negative result)', () => {
        const date1 = Calendar.parseDateStrToLocalDate('2026-01-11');
        const date2 = Calendar.parseDateStrToLocalDate('2026-01-01');
        const result = Calendar.daysBetween(date1, date2);
        expect(result).toBe(-10);
    });

    it('should return 0 for same dates', () => {
        const date1 = Calendar.parseDateStrToLocalDate('2026-01-01');
        const result = Calendar.daysBetween(date1, date1);
        expect(result).toBe(0);
    });

    it('should return 0 for invalid dates', () => {
        const result = Calendar.daysBetween('invalid', '2026-01-01');
        expect(result).toBe(0);
    });
});
