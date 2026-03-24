import { Calendar } from './Calendar.js';
import { store } from './State.js';
import { CONFIG, VITALITY_TO_ENERGY, DATA_VALIDATION_RULES } from '../config.js';

// 数据验证函数
function validateFieldValue(value, rules) {
    if (!rules.required && (value === null || value === undefined || value === '')) {
        return { isValid: true, normalizedValue: null };
    }
    
    const numValue = Number(value);
    if (!Number.isFinite(numValue)) {
        return { isValid: false, error: `Invalid number: ${value}` };
    }
    
    if (numValue < rules.min || numValue > rules.max) {
        return { 
            isValid: false, 
            error: `Value ${numValue} out of range [${rules.min}, ${rules.max}]` 
        };
    }
    
    return { isValid: true, normalizedValue: numValue };
}

// 重构后的数据转换函数：统一数据结构，增加验证和调试
function normalizeRecord(record, dateStr) {
    console.log(`🔧 Normalizing record for ${dateStr}:`, record);
    
    // 处理空记录或无效记录
    if (!record || typeof record !== 'object') {
        console.warn(`⚠️ Invalid record for ${dateStr}:`, record);
        return null;
    }
    
    try {
        // 统一数据提取逻辑，支持新旧格式兼容
        const extractField = (primaryPath, secondaryPath, defaultValue = null) => {
            const primaryValue = getNestedValue(record, primaryPath);
            if (primaryValue !== undefined && primaryValue !== null) {
                return primaryValue;
            }
            const secondaryValue = getNestedValue(record, secondaryPath);
            return secondaryValue !== undefined && secondaryValue !== null ? secondaryValue : defaultValue;
        };
        
        // 提取并验证睡眠数据
        const sleepData = extractField('sleepData', 'log.sleepData', {});
        const sleepDurationValidation = validateFieldValue(sleepData.duration, DATA_VALIDATION_RULES.sleepDuration);
        const sleepQualityValidation = validateFieldValue(sleepData.quality, DATA_VALIDATION_RULES.sleepQuality);
        
        // 提取并验证指标数据
        const metrics = extractField('metrics', 'log.metrics', {});
        const exerciseValidation = validateFieldValue(metrics.exercise, DATA_VALIDATION_RULES.exerciseMinutes);
        const readingValidation = validateFieldValue(metrics.reading, DATA_VALIDATION_RULES.readingMinutes);
        
        // 提取情绪和关键词
        const emotions = extractField('emotions', 'status.emotions', []);
        const keywords = extractField('keywords', 'log.keywords', []);
        const mood = extractField('mood', 'status.mood', null);
        
        // 提取身体状态并计算精力值
        const bodyState = extractField('body_state', 'status.body_state', null);
        let energy = null;
        
        if (bodyState && bodyState.title) {
            energy = VITALITY_TO_ENERGY[bodyState.title];
            console.log(`🎯 Vitality "${bodyState.title}" → Energy: ${energy}`);
        } else {
            // 尝试从其他字段获取精力值
            const directEnergy = extractField('energy', null, null);
            if (directEnergy !== null) {
                const energyValidation = validateFieldValue(directEnergy, DATA_VALIDATION_RULES.energy);
                if (energyValidation.isValid) {
                    energy = energyValidation.normalizedValue;
                }
            }
        }
        
        // 构建标准化记录
        const normalized = {
            date: dateStr,
            sleepDuration: sleepDurationValidation.isValid ? sleepDurationValidation.normalizedValue : 0,
            sleepQuality: sleepQualityValidation.isValid ? sleepQualityValidation.normalizedValue : null,
            exerciseMinutes: exerciseValidation.isValid ? exerciseValidation.normalizedValue : 0,
            readingMinutes: readingValidation.isValid ? readingValidation.normalizedValue : 0,
            energy: energy,
            mood: mood !== null ? Number(mood) : null,
            emotionTags: Array.isArray(emotions) ? emotions : [],
            keywords: Array.isArray(keywords) ? keywords : [],
            vitality: bodyState?.title || null,
            bodyState: bodyState,
            // 保留原始数据用于调试
            _original: record
        };
        
        // 验证必需字段
        const hasAnyData = normalized.sleepDuration > 0 || 
                          normalized.exerciseMinutes > 0 || 
                          normalized.readingMinutes > 0 || 
                          normalized.energy !== null || 
                          normalized.emotionTags.length > 0;
        
        if (!hasAnyData) {
            console.log(`⚠️ No valid data found in record for ${dateStr}`);
            return null;
        }
        
        console.log(`✅ Normalized record for ${dateStr}:`, normalized);
        return normalized;
        
    } catch (error) {
        console.error(`❌ Error normalizing record for ${dateStr}:`, error);
        return null;
    }
}

// 辅助函数：获取嵌套对象的值
function getNestedValue(obj, path) {
    if (!path || !obj) return undefined;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[key];
    }
    
    return current;
}

const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

function parseDateStringToLocalNoon(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
}

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
    const storeData = store.getAllData();
    const legacyData = JSON.parse(localStorage.getItem('dailyRecords') || '{}');
    const data = {
        ...(legacyData && typeof legacyData === 'object' ? legacyData : {}),
        ...(storeData && typeof storeData === 'object' ? storeData : {})
    };
    console.log('📋 All User Data:', data);
    console.log('📋 Data Keys:', Object.keys(data));
    console.log('📋 Data Count:', Object.keys(data).length);
    return data;
}

export function getRecordsByCurrentXun(targetDate = null) {
    const state = store.getState();
    const periods = Calendar.getXunPeriods(CONFIG.YEAR);
    const selectedXunIndex = state.viewedXunIndex;
    const selectedDateStr = targetDate ? Calendar.formatLocalDate(targetDate) : null;
    const dateBasedXun = selectedDateStr ? Calendar.getXunPeriodByDateStr(periods, selectedDateStr) : null;
    const currentXun = Calendar.getCurrentXun(periods);
    const targetXunIndex = selectedXunIndex || dateBasedXun?.index || currentXun?.index || 1;
    const targetPeriod = periods.find((period) => period.index === targetXunIndex) || periods[0];

    const startDate = new Date(
        targetPeriod.startDate.getFullYear(),
        targetPeriod.startDate.getMonth(),
        targetPeriod.startDate.getDate(),
        0, 0, 0, 0
    );
    const endDate = new Date(
        targetPeriod.endDate.getFullYear(),
        targetPeriod.endDate.getMonth(),
        targetPeriod.endDate.getDate(),
        23, 59, 59, 999
    );

    const records = loadDailyRecords();
    const xunStartDate = Calendar.formatLocalDate(startDate);
    const xunEndDate = Calendar.formatLocalDate(endDate);

    console.log('🧭 Xun Selection Debug:', {
        selectedDate: selectedDateStr,
        calculatedXunIndex: targetXunIndex,
        xunStartDate,
        xunEndDate
    });

    const rows = Object.entries(records)
        .map(([date, record]) => {
            const parsedDate = parseDateStringToLocalNoon(date);
            if (!parsedDate || parsedDate < startDate || parsedDate > endDate) return null;
            const normalized = normalizeRecord(record || {}, date);
            if (!normalized) return null;
            return {
                date,
                sleepDuration: normalized.sleepDuration,
                mood: normalized.mood ?? null,
                energy: normalized.energy
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.date.localeCompare(b.date));

    console.log('🧪 Xun Filter Debug:', {
        selectedDate: selectedDateStr,
        calculatedXunIndex: targetXunIndex,
        xunStartDate,
        xunEndDate,
        filteredRecordsLength: rows.length
    });

    return {
        xunIndex: targetXunIndex,
        startDate: targetPeriod.startDate,
        endDate: targetPeriod.endDate,
        daysInXun: targetPeriod.days || 10,
        records: rows
    };
}

export function buildXunSummary(targetDate = new Date()) {
    const recordsInXun = getRecordsByCurrentXun(targetDate);
    const { startDate, endDate, daysInXun } = recordsInXun;
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

    const xunEntries = recordsInXun.records
        .map((row) => [row.date, records[row.date] || {}])
        .filter(([, record]) => {
            // 放宽过滤条件：只要记录存在且不为空就认为是有效记录
            if (!record || typeof record !== 'object') {
                return false;
            }
            
            // 检查是否有任何有意义的数据
            const hasData = Object.keys(record).length > 0 && 
                           (record.sleepData || 
                            record.metrics || 
                            record.emotions || 
                            record.body_state ||
                            record.energy ||
                            record.mood ||
                            record.status ||
                            record.log);
            
            return hasData;
        });

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
        completionRate: 0,
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
        avgEnergyBadSleep: 0,
        // 三件好事相关统计
        three_good_things: [],
        three_good_things_by_date: {},
        good_things_stats: {
            total_days: 0,
            total_items: 0,
            keywords: {}
        }
    };

    // 修复：不过滤记录，而是分别统计有/无精力值的记录
    const validEnergyEntries = [];
    const allValidEntries = [];
    
    xunEntries.forEach(([dateStr, record]) => {
        const normalizedRecord = normalizeRecord(record, dateStr);
        if (!normalizedRecord) {
            console.log(`⚠️ Skipping invalid record for ${dateStr}`);
            return;
        }
        
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
        return { ...stats, startDate, endDate, recordCount: 0, completionRate: 0 };
    }

    // 如果没有精力值记录，给出提示但继续统计其他指标
    if (validEnergyEntries.length === 0) {
        stats.insights.push('本旬暂无精力状态记录，请在每日记录中选择身心状态以获得更准确的分析。');
        // 继续处理其他统计，但精力相关指标保持默认值
        stats.avgEnergy = null; // 使用null而不是0，明确区分"无数据"和"数据为0"
        stats.minEnergy = null;
        stats.maxEnergy = null;
        stats.energyVolatility = 0;
        stats.highEnergyDaysCount = 0;
        stats.highEnergyDays = 0;
        stats.highEnergyAverageSleep = 0;
        stats.highEnergyAverageExercise = 0;
        stats.avgEnergyGoodSleep = 0;
        stats.avgEnergyBadSleep = 0;
        
        console.log('⚠️ No energy data found in current xun, using null values for energy metrics');
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
    allValidEntries.forEach(([dateStr, normalizedRecord]) => {
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

        // 三件好事数据处理
        const originalRecord = normalizedRecord._original;
        if (originalRecord && originalRecord.three_good_things) {
            const goodThings = originalRecord.three_good_things.filter(t => t && t.trim() !== '');
            if (goodThings.length > 0) {
                stats.three_good_things_by_date[dateStr] = goodThings;
                stats.three_good_things.push(...goodThings);
                stats.good_things_stats.total_days++;
                stats.good_things_stats.total_items += goodThings.length;
                
                // 提取关键词
                goodThings.forEach(thing => {
                    const keywords = thing
                        .replace(/[，。！？；：""''（）【】《》、]/g, ' ')
                        .split(/\s+/)
                        .filter(word => word.length > 1 && !['的', '了', '是', '在', '有', '和', '与', '或', '但', '而', '也', '就', '都', '很', '非常', '特别', '今天', '昨天', '明天'].includes(word));
                    
                    keywords.forEach(keyword => {
                        stats.good_things_stats.keywords[keyword] = (stats.good_things_stats.keywords[keyword] || 0) + 1;
                    });
                });
            }
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
    stats.completionRate = Number(((allValidEntries.length / Math.max(daysInXun || 10, 1)) * 100).toFixed(0));
    
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
        completionRate: stats.completionRate,
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
        avgEnergyBadSleep: stats.avgEnergyBadSleep,
        // 三件好事数据
        three_good_things: stats.three_good_things,
        three_good_things_by_date: stats.three_good_things_by_date,
        good_things_stats: stats.good_things_stats
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
