import { Calendar } from './Calendar.js';
import { buildXunSummary } from './XunSummary.js';
import { store } from './State.js';

describe('Calendar.getXunPeriods', () => {
    test('returns correct period for a date in xun 7 (Mar 2-11)', () => {
        const periods = Calendar.getXunPeriods(2026);
        const testDate = Calendar.parseDateStrToLocalDate('2026-03-05');
        const period = periods.find(p => testDate >= p.startDate && testDate <= p.endDate);
        expect(period).toBeTruthy();
        expect(Calendar.formatLocalDate(period.startDate)).toBe('2026-03-02');
        expect(Calendar.formatLocalDate(period.endDate)).toBe('2026-03-11');
    });

    test('returns correct period for Feb 24 (xun 6: Feb 20 - Mar 1)', () => {
        const periods = Calendar.getXunPeriods(2026);
        const testDate = Calendar.parseDateStrToLocalDate('2026-02-24');
        const period = periods.find(p => testDate >= p.startDate && testDate <= p.endDate);
        expect(period).toBeTruthy();
        expect(Calendar.formatLocalDate(period.startDate)).toBe('2026-02-20');
        expect(Calendar.formatLocalDate(period.endDate)).toBe('2026-03-01');
    });
});

describe('buildXunSummary - Energy Refactor', () => {
    beforeEach(() => {
        // 模拟实际的数据结构，包含Vitality状态
        const mockUserData = {
            '2026-03-01': {
                sleepData: { duration: 6, quality: 7 },
                metrics: { wealth: 6, exercise: 0, reading: 10 },
                emotions: ['tired'],
                body_state: { title: '需要恢复', id: 'recover' } // 新的精力来源
            },
            '2026-03-02': {
                sleepData: { duration: 8, quality: 8 },
                metrics: { wealth: 8, exercise: 30, reading: 20 },
                emotions: ['focused'],
                body_state: { title: '正常运转', id: 'normal' }
            },
            '2026-03-03': {
                sleepData: { duration: 7, quality: 7 },
                metrics: { wealth: 9, exercise: 20, reading: 0 },
                emotions: ['focused', 'calm'],
                body_state: { title: '状态很好', id: 'good' }
            },
            '2026-03-04': {
                sleepData: { duration: 7.5, quality: 9 },
                metrics: { wealth: 7, exercise: 45, reading: 15 },
                emotions: ['happy', 'energetic'],
                body_state: { title: '高能日', id: 'high' }
            },
            '2026-03-05': {
                sleepData: { duration: 5.5, quality: 6 },
                metrics: { wealth: 5, exercise: 15, reading: 25 },
                emotions: ['productive'],
                body_state: { title: '需要恢复', id: 'recover' }
            }
        };
        
        // 设置到store中
        store.setState({ userData: mockUserData });
    });

    test('calculates energy from vitality correctly', () => {
        const summary = buildXunSummary(new Date('2026-03-06'));
        
        // 验证Vitality到Energy的映射
        // 当前旬是 3月2日-3月11日，纳入 3月2~5日
        // 正常运转: 5, 状态很好: 7, 高能日: 9, 需要恢复: 3
        // 平均精力 = (5 + 7 + 9 + 3) / 4 = 6.0
        expect(summary.avgEnergy).toBe(6.0);
        
        // 验证新的精力指标
        expect(summary.minEnergy).toBe(3);
        expect(summary.maxEnergy).toBe(9);
        expect(summary.energyVolatility).toBe(6); // 9 - 3 = 6
    });

    test('identifies high energy days correctly', () => {
        const summary = buildXunSummary(new Date('2026-03-06'));
        
        // 高精力日：energy >= 7 (状态很好: 7, 高能日: 9)
        expect(summary.highEnergyDaysCount).toBe(2);
        expect(summary.highEnergyDates).toContain('2026-03-03'); // 状态很好
        expect(summary.highEnergyDates).toContain('2026-03-04'); // 高能日
    });

    test('analyzes sleep vs energy relationship', () => {
        const summary = buildXunSummary(new Date('2026-03-06'));
        
        // 充足睡眠(>=7h): 3月2日(8h, energy=5), 3月3日(7h, energy=7), 3月4日(7.5h, energy=9)
        // 平均 = (5 + 7 + 9) / 3 = 7.0
        expect(summary.avgEnergyGoodSleep).toBe(7.0);
        
        // 不足睡眠(<7h): 3月1日(6h, energy=3), 3月5日(5.5h, energy=3)  
        // 平均 = (3 + 3) / 2 = 3.0
        expect(summary.avgEnergyBadSleep).toBe(3.0);
        
        // 差异 > 0.5，应该生成睡眠影响洞察
        expect(summary.insights).toContain('充足的睡眠对你的精力状态有积极影响。');
    });

    test('returns required energy structure', () => {
        const summary = buildXunSummary(new Date('2026-03-06'));
        
        // 验证指令要求的核心字段
        expect(summary).toHaveProperty('avgEnergy');
        expect(summary).toHaveProperty('energyVolatility');
        expect(summary).toHaveProperty('highEnergyDaysCount');
        expect(summary).toHaveProperty('insights');
        expect(Array.isArray(summary.insights)).toBe(true);
    });

    test('handles records without vitality gracefully', () => {
        // 测试没有Vitality状态的记录
        const mockUserDataNoVitality = {
            '2026-03-02': {
                sleepData: { duration: 6, quality: 7 },
                metrics: { wealth: 6, exercise: 0, reading: 10 },
                emotions: ['tired']
                // 没有 body_state
            }
        };
        
        store.setState({ userData: mockUserDataNoVitality });
        const summary = buildXunSummary(new Date('2026-03-06'));
        
        // 应该显示无精力记录的提示
        expect(summary.insights).toContain('本旬暂无精力状态记录，请在每日记录中选择身心状态以获得更准确的分析。');
        expect(summary.avgEnergy).toBe(0);
    });

    test('ignores wealth field for energy calculation', () => {
        const summary = buildXunSummary(new Date('2026-03-06'));
        
        // 验证精力值确实来自Vitality而不是wealth
        // 如果使用wealth，平均精力应该更高
        // 但实际使用Vitality（旬内 3月2~5日）平均精力是 6.0
        expect(summary.avgEnergy).toBe(6.0);
        expect(summary.avgEnergy).not.toBe(7.0);
    });

    test('reads exercise and reading from DailyRecord.status/log structure', () => {
        store.setState({ userData: {} });
        localStorage.setItem('dailyRecords', JSON.stringify({
            '2026-03-02': {
                status: {
                    mood: 'calm',
                    body_state: { title: '正常运转', id: 'normal' }
                },
                log: {
                    sleepData: { duration: 7 },
                    metrics: { exercise: 45, reading: 30 },
                    keywords: ['专注']
                }
            },
            '2026-03-03': {
                status: {
                    mood: 'focused',
                    body_state: { title: '状态很好', id: 'good' }
                },
                log: {
                    sleepData: { duration: 8 },
                    metrics: { exercise: 20, reading: 60 }
                }
            }
        }));

        const summary = buildXunSummary(new Date('2026-03-06'));

        expect(summary.totalExercise).toBe(65);
        expect(summary.totalReading).toBe(90);
        expect(summary.exerciseDays).toBe(2);
        expect(summary.readingDays).toBe(2);
        expect(summary.avgEnergy).toBe(6.0);
    });
});
