import { Calendar } from './Calendar.js';
import { buildXunSummary } from './XunSummary.js';

describe('Calendar.getXunRange', () => {
    test('returns first xun range', () => {
        const { startDate, endDate } = Calendar.getXunRange(new Date('2026-03-05'));
        expect(Calendar.formatLocalDate(startDate)).toBe('2026-03-01');
        expect(Calendar.formatLocalDate(endDate)).toBe('2026-03-10');
    });

    test('returns last xun range for short month', () => {
        const { startDate, endDate } = Calendar.getXunRange(new Date('2026-02-24'));
        expect(Calendar.formatLocalDate(startDate)).toBe('2026-02-21');
        expect(Calendar.formatLocalDate(endDate)).toBe('2026-02-28');
    });
});

describe('buildXunSummary', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('dailyRecords', JSON.stringify({
            '2026-03-01': { sleepDuration: 5, energy: 6, exerciseMinutes: 0, readingMinutes: 10, emotionTags: ['tired'] },
            '2026-03-02': { sleepDuration: 7, energy: 8, exerciseMinutes: 30, readingMinutes: 20, emotionTags: ['focused'] },
            '2026-03-03': { sleepDuration: 6, energy: 9, exerciseMinutes: 20, readingMinutes: 0, emotionTags: ['focused', 'calm'] },
            '2026-03-12': { sleepDuration: 8, energy: 7, exerciseMinutes: 40, readingMinutes: 10, emotionTags: ['happy'] }
        }));
    });

    test('aggregates only current xun records', () => {
        const summary = buildXunSummary(new Date('2026-03-06'));
        expect(summary.recordCount).toBe(3);
        expect(summary.totalExercise).toBe(50);
        expect(summary.totalReading).toBe(30);
        expect(summary.exerciseDays).toBe(2);
        expect(summary.highEnergyDays).toBe(2);
        expect(summary.emotionFrequency.focused).toBe(2);
    });
});
