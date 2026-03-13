import { Calendar } from './Calendar.js';

const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

export function getXunRange(inputDate = new Date()) {
    return Calendar.getXunRange(inputDate);
}

export function loadDailyRecords() {
    try {
        const raw = localStorage.getItem('dailyRecords') || '{}';
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        console.error('Failed to parse dailyRecords:', error);
        return {};
    }
}

export function buildXunSummary(targetDate = new Date()) {
    const { startDate, endDate } = getXunRange(targetDate);
    const records = loadDailyRecords();

    const xunEntries = Object.entries(records)
        .filter(([dateStr]) => {
            const date = new Date(dateStr);
            return !Number.isNaN(date.getTime()) && date >= startDate && date <= endDate;
        })
        .sort(([a], [b]) => a.localeCompare(b));

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
        insights: []
    };

    if (xunEntries.length === 0) {
        stats.insights.push('No records for this Xun yet. Start with one small check-in today.');
        return { ...stats, startDate, endDate, recordCount: 0 };
    }

    let sleepSum = 0;
    let energySum = 0;
    let highEnergySleepSum = 0;
    let highEnergyExerciseSum = 0;

    xunEntries.forEach(([, record]) => {
        const sleepDuration = toNumber(record.sleepDuration);
        const energy = toNumber(record.energy);
        const exerciseMinutes = toNumber(record.exerciseMinutes);
        const readingMinutes = toNumber(record.readingMinutes);

        sleepSum += sleepDuration;
        energySum += energy;
        stats.totalExercise += exerciseMinutes;
        stats.totalReading += readingMinutes;

        if (exerciseMinutes > 0) stats.exerciseDays += 1;
        if (readingMinutes > 0) stats.readingDays += 1;
        if (sleepDuration > 0 && sleepDuration < 6) stats.lateSleepDays += 1;

        if (Array.isArray(record.emotionTags)) {
            record.emotionTags.forEach((tag) => {
                if (!tag) return;
                stats.emotionFrequency[tag] = (stats.emotionFrequency[tag] || 0) + 1;
            });
        }

        if (energy >= 7) {
            stats.highEnergyDays += 1;
            highEnergySleepSum += sleepDuration;
            highEnergyExerciseSum += exerciseMinutes;
        }
    });

    stats.avgSleep = Number((sleepSum / xunEntries.length).toFixed(1));
    stats.avgEnergy = Number((energySum / xunEntries.length).toFixed(1));
    stats.highEnergyAverageSleep = stats.highEnergyDays
        ? Number((highEnergySleepSum / stats.highEnergyDays).toFixed(1))
        : 0;
    stats.highEnergyAverageExercise = stats.highEnergyDays
        ? Number((highEnergyExerciseSum / stats.highEnergyDays).toFixed(1))
        : 0;

    if (stats.avgSleep < 6) {
        stats.insights.push('Sleep duration was relatively low this Xun.');
    }
    if (stats.exerciseDays >= 4) {
        stats.insights.push('You maintained regular exercise this Xun.');
    }
    if (stats.highEnergyDays >= 3) {
        stats.insights.push('You had several high-energy days.');
    }
    if (!stats.insights.length) {
        stats.insights.push('Steady progress this Xun. Keep the rhythm going.');
    }

    return {
        ...stats,
        startDate,
        endDate,
        recordCount: xunEntries.length
    };
}

export function getRangeLabel(startDate, endDate) {
    return `${Calendar.formatLocalDate(startDate)} ~ ${Calendar.formatLocalDate(endDate)}`;
}
