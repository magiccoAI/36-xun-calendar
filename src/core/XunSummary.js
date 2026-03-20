import { Calendar } from './Calendar.js';
import { store } from './State.js';

// Vitality到精力值的映射（按指令要求）
const vitalityToEnergy = {
    "需要恢复": 3,
    "正常运转": 5,
    "状态很好": 7,
    "高能日": 9
};

// 数据转换函数：将当前复杂数据结构映射为指令要求的简单结构
function normalizeRecord(record) {
    console.log('🔧 Normalizing record:', record);
    
    const sleepData = record.sleepData || {};
    
    // 从Vitality状态获取精力值（按指令要求）
    let energy = null;
    if (record.body_state && record.body_state.title) {
        energy = vitalityToEnergy[record.body_state.title] || null;
        console.log(`🎯 Vitality "${record.body_state.title}" → Energy: ${energy}`);
    } else {
        console.log('⚠️ No body_state found in record');
    }
    
    const normalized = {
        sleepDuration: toNumber(sleepData.duration),
        sleepQuality: toNumber(sleepData.quality),
        exerciseMinutes: toNumber(record.metrics?.exercise || 0),
        readingMinutes: toNumber(record.metrics?.reading || 0),
        energy: energy, // 重要：必须来自Vitality状态
        mood: record.mood,
        emotionTags: record.emotions || [],
        keywords: record.keywords || [],
        vitality: record.body_state?.title || null // 保存原始vitality状态
    };
    
    console.log('✅ Normalized result:', normalized);
    return normalized;
}

const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

export function getXunRange(inputDate = new Date()) {
    // 使用年历系统获取旬范围，确保与全景视图一致
    const year = inputDate.getFullYear();
    const periods = Calendar.getXunPeriods(year);
    
    // 找到输入日期所在的旬
    const targetPeriod = periods.find(p => {
        const date = new Date(inputDate);
        return date >= p.startDate && date <= p.endDate;
    });
    
    if (targetPeriod) {
        return {
            startDate: targetPeriod.startDate,
            endDate: targetPeriod.endDate
        };
    }
    
    // 降级到原有的月历系统
    return Calendar.getXunRange(inputDate);
}

export function loadDailyRecords() {
    const data = store.getAllData();
    console.log('📋 All User Data:', data);
    console.log('📋 Data Keys:', Object.keys(data));
    console.log('📋 Data Count:', Object.keys(data).length);
    return data;
}

export function buildXunSummary(targetDate = new Date()) {
    const { startDate, endDate } = getXunRange(targetDate);
    const records = loadDailyRecords();

    // 调试信息
    console.log('🔍 Xun Summary Debug:');
    console.log('Target Date:', targetDate);
    console.log('Xun Range:', { 
        start: Calendar.formatLocalDate(startDate), 
        end: Calendar.formatLocalDate(endDate) 
    });
    console.log('All Records:', Object.keys(records));
    console.log('Records Count:', Object.keys(records).length);

    const xunEntries = Object.entries(records)
        .filter(([dateStr, record]) => {
            const date = new Date(dateStr);
            const isValidDate = !Number.isNaN(date.getTime()) && date >= startDate && date <= endDate;
            const hasData = record && typeof record === 'object' && Object.keys(record).length > 0;
            console.log(`🔍 Filtering ${dateStr}:`, {
                dateValid: isValidDate,
                hasData: hasData,
                dateInRange: date >= startDate && date <= endDate,
                recordKeys: record ? Object.keys(record) : null
            });
            return isValidDate && hasData;
        })
        .sort(([a], [b]) => a.localeCompare(b));

    console.log('Filtered Xun Entries:', xunEntries.map(([date]) => date));
    console.log('Filtered Count:', xunEntries.length);
    
    // 如果没有找到记录，检查是否是日期范围问题
    if (xunEntries.length === 0 && Object.keys(records).length > 0) {
        console.warn('⚠️ No records found in current Xun range!');
        console.warn('Available dates:', Object.keys(records));
        console.warn('Current Xun range:', {
            start: Calendar.formatLocalDate(startDate),
            end: Calendar.formatLocalDate(endDate)
        });
    }

    // 按指令要求的数据结构
    const stats = {
        avgSleep: 0,
        avgEnergy: 0,
        totalExercise: 0,
        totalReading: 0,
        exerciseDays: 0,
        readingDays: 0,
        lateSleepDays: 0,
        emotionFrequency: {},
        highEnergyDays: 0,
        highEnergyAverageSleep: 0,
        highEnergyAverageExercise: 0,
        insights: [],
        // 新增的精力指标
        minEnergy: null,
        maxEnergy: null,
        energyVolatility: 0,
        highEnergyDaysCount: 0,
        highEnergyDates: [],
        avgEnergyGoodSleep: 0,
        avgEnergyBadSleep: 0
    };

    // 修复：不过滤记录，而是分别统计有/无精力值的记录
    const validEnergyEntries = [];
    const allValidEntries = [];
    
    xunEntries.forEach(([dateStr, record]) => {
        const normalizedRecord = normalizeRecord(record);
        allValidEntries.push([dateStr, normalizedRecord]);
        
        console.log(`📝 Record ${dateStr}:`, {
            original: record,
            normalized: normalizedRecord,
            hasEnergy: normalizedRecord.energy !== null
        });
        
        // 只有有精力值的记录才用于精力统计
        if (normalizedRecord.energy !== null) {
            validEnergyEntries.push([dateStr, normalizedRecord]);
        }
    });

    console.log('📊 Summary Stats:', {
        allValidEntries: allValidEntries.length,
        validEnergyEntries: validEnergyEntries.length
    });

    // 如果没有任何记录，返回空状态
    if (allValidEntries.length === 0) {
        stats.insights.push('本旬暂无记录，从今天开始一次小小的打卡吧。');
        return { ...stats, startDate, endDate, recordCount: 0 };
    }

    // 如果没有精力值记录，给出提示但继续统计其他指标
    if (validEnergyEntries.length === 0) {
        stats.insights.push('本旬暂无精力状态记录，请在每日记录中选择身心状态。');
        // 继续处理其他统计，但精力相关指标保持默认值
        stats.avgEnergy = 0; // 明确设置为0而不是null
    }

    let sleepSum = 0;
    let energySum = 0;
    let highEnergySleepSum = 0;
    let highEnergyExerciseSum = 0;
    let goodSleepEnergySum = 0;
    let badSleepEnergySum = 0;
    let goodSleepCount = 0;
    let badSleepCount = 0;
    const energyValues = [];

    // 使用所有有效记录进行基础统计
    allValidEntries.forEach(([dateStr, record]) => {
        const normalizedRecord = normalizeRecord(record);
        const { sleepDuration, energy, exerciseMinutes, readingMinutes } = normalizedRecord;

        // 基础统计（使用所有记录）
        sleepSum += sleepDuration;
        stats.totalExercise += exerciseMinutes;
        stats.totalReading += readingMinutes;

        if (exerciseMinutes > 0) stats.exerciseDays += 1;
        if (readingMinutes > 0) stats.readingDays += 1;
        if (sleepDuration > 0 && sleepDuration < 6) stats.lateSleepDays += 1;

        if (Array.isArray(normalizedRecord.emotionTags)) {
            normalizedRecord.emotionTags.forEach((tag) => {
                if (!tag) return;
                stats.emotionFrequency[tag] = (stats.emotionFrequency[tag] || 0) + 1;
            });
        }

        // 精力相关统计（仅使用有精力值的记录）
        if (energy !== null) {
            energySum += energy;
            energyValues.push(energy);

            // 高精力日判断（按指令要求：energy >= 7）
            if (energy >= 7) {
                stats.highEnergyDaysCount += 1;
                stats.highEnergyDays += 1; // 保持向后兼容
                stats.highEnergyDates.push(dateStr);
                highEnergySleepSum += sleepDuration;
                highEnergyExerciseSum += exerciseMinutes;
            }

            // 睡眠与精力关系分析（按指令要求）
            if (sleepDuration >= 7) {
                goodSleepEnergySum += energy;
                goodSleepCount += 1;
            } else if (sleepDuration > 0) {
                badSleepEnergySum += energy;
                badSleepCount += 1;
            }
        }
    });

    // 计算基础统计（使用所有记录）
    stats.avgSleep = Number((sleepSum / allValidEntries.length).toFixed(1));
    
    // 计算精力统计（仅使用有精力值的记录）
    if (validEnergyEntries.length > 0) {
        stats.avgEnergy = Number((energySum / validEnergyEntries.length).toFixed(1));
        stats.minEnergy = Math.min(...energyValues);
        stats.maxEnergy = Math.max(...energyValues);
        stats.energyVolatility = stats.maxEnergy - stats.minEnergy;
        
        stats.highEnergyAverageSleep = stats.highEnergyDaysCount
            ? Number((highEnergySleepSum / stats.highEnergyDaysCount).toFixed(1))
            : 0;
        stats.highEnergyAverageExercise = stats.highEnergyDaysCount
            ? Number((highEnergyExerciseSum / stats.highEnergyDaysCount).toFixed(1))
            : 0;

        // 睡眠与精力关系分析（按指令要求）
        stats.avgEnergyGoodSleep = goodSleepCount > 0 ? Number((goodSleepEnergySum / goodSleepCount).toFixed(1)) : 0;
        stats.avgEnergyBadSleep = badSleepCount > 0 ? Number((badSleepEnergySum / badSleepCount).toFixed(1)) : 0;

        // 生成睡眠影响洞察（按指令要求）
        const sleepImpactDiff = stats.avgEnergyGoodSleep - stats.avgEnergyBadSleep;
        if (sleepImpactDiff > 0.5 && goodSleepCount > 0 && badSleepCount > 0) {
            stats.insights.push('充足的睡眠对你的精力状态有积极影响。');
        }
    } else {
        // 没有精力值记录时的默认值
        stats.avgEnergy = 0; // 明确设置为0而不是null
        stats.minEnergy = null;
        stats.maxEnergy = null;
        stats.energyVolatility = 0;
        stats.highEnergyAverageSleep = 0;
        stats.highEnergyAverageExercise = 0;
        stats.avgEnergyGoodSleep = 0;
        stats.avgEnergyBadSleep = 0;
    }

    // 保持原有的洞察生成逻辑
    if (stats.avgSleep < 6) {
        stats.insights.push('本旬睡眠时长相对较短，建议注意休息。');
    }
    if (stats.exerciseDays >= 4) {
        stats.insights.push('本旬保持了规律的运动习惯，很棒！');
    }
    if (stats.highEnergyDaysCount >= 3) {
        stats.insights.push('本旬有多个高精力天，状态不错！');
    }
    if (!stats.insights.length) {
        stats.insights.push('本旬节奏平稳，继续保持。');
    }

    return {
        // 按指令要求的标准数据结构返回
        avgEnergy: stats.avgEnergy,
        energyVolatility: stats.energyVolatility,
        highEnergyDaysCount: stats.highEnergyDaysCount,
        insights: stats.insights,
        // 额外的元数据和其他统计
        avgSleep: stats.avgSleep,
        totalExercise: stats.totalExercise,
        totalReading: stats.totalReading,
        exerciseDays: stats.exerciseDays,
        readingDays: stats.readingDays,
        lateSleepDays: stats.lateSleepDays,
        emotionFrequency: stats.emotionFrequency,
        highEnergyDays: stats.highEnergyDays,
        startDate,
        endDate,
        recordCount: allValidEntries.length, // 使用所有有效记录的计数
        highEnergyAverageSleep: stats.highEnergyAverageSleep,
        highEnergyAverageExercise: stats.highEnergyAverageExercise,
        minEnergy: stats.minEnergy,
        maxEnergy: stats.maxEnergy,
        highEnergyDates: stats.highEnergyDates,
        avgEnergyGoodSleep: stats.avgEnergyGoodSleep,
        avgEnergyBadSleep: stats.avgEnergyBadSleep
    };
}

// 调试函数：在浏览器控制台中使用
export function debugXunSummary() {
    console.log('🚀 Xun Summary Debug Report');
    console.log('========================');
    
    const summary = buildXunSummary(new Date());
    console.log('📊 Final Summary:', summary);
    
    // 检查当前状态
    const state = store.getState();
    console.log('🏪 Store State:', state);
    
    // 检查原始数据
    const userData = store.getAllData();
    console.log('📋 Raw User Data:', userData);
    
    // 检查旬范围
    const { startDate, endDate } = getXunRange(new Date());
    console.log('📅 Current Xun Range:', {
        start: Calendar.formatLocalDate(startDate),
        end: Calendar.formatLocalDate(endDate)
    });
    
    // 检查每条记录的body_state
    Object.entries(userData).forEach(([dateStr, record]) => {
        const date = new Date(dateStr);
        if (date >= startDate && date <= endDate) {
            console.log(`🔍 Record ${dateStr}:`, {
                hasBodyState: !!record.body_state,
                bodyStateTitle: record.body_state?.title,
                bodyStateId: record.body_state?.id,
                mappedEnergy: record.body_state?.title ? vitalityToEnergy[record.body_state.title] : null
            });
        }
    });
    
    return summary;
}

// 将调试函数暴露到全局，方便在浏览器中使用
if (typeof window !== 'undefined') {
    window.debugXunSummary = debugXunSummary;
}

export function getRangeLabel(startDate, endDate) {
    return `${Calendar.formatLocalDate(startDate)} ~ ${Calendar.formatLocalDate(endDate)}`;
}
