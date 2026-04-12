
import { CONFIG } from '../config.js';
import { Calendar } from './Calendar.js';

import { BackupManager } from './BackupManager.js';

class Store {
    constructor() {
        this.state = {
            userData: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA) || '{}'),
            macroGoals: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MACRO_GOALS) || '{}'),
            customEmotions: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_EMOTIONS) || '[]'),
            customNourishments: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_NOURISHMENTS) || '[]'),
            currentXunIndex: null, // Index of current xun based on date
            viewedXunIndex: null,  // Currently viewed xun index
            currentView: 'macro',  // 'macro', 'overview'
            autoBackup: localStorage.getItem('auto_backup_enabled') === 'true', // Load auto backup setting
            menstrualData: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MENSTRUAL_DATA) || '{"cycles":[], "avgLength": 28, "avgDuration": 5, "nextPrediction": null}'),
            settings: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS) || '{"showMenstrualCycle": false}')
        };
        this.listeners = new Set();
        
        this.migrateData();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(key, value) {
        this.listeners.forEach(listener => listener(this.state, key, value));
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        Object.keys(newState).forEach(key => this.notify(key, newState[key]));
        this.persist(newState);
        
        // Trigger Auto Backup if enabled and data changed
        if (this.state.autoBackup && (newState.userData || newState.macroGoals || newState.customEmotions || newState.customNourishments)) {
             BackupManager.handleAutoBackup(this.state);
        }
    }

    getState() {
        return this.state;
    }

    getAllData() {
        return this.state.userData;
    }

    getDay(dateStr) {
        return this.state.userData[dateStr] || null;
    }

    updateDay(dateStr, dayData) {
        const newUserData = { ...this.state.userData };
        if (!dayData || Object.keys(dayData).length === 0) {
            delete newUserData[dateStr];
        } else {
            newUserData[dateStr] = dayData;
        }
        this.setState({ userData: newUserData });
    }

    deleteDay(dateStr) {
        const newUserData = { ...this.state.userData };
        delete newUserData[dateStr];
        this.setState({ userData: newUserData });
    }

    persist(newState) {
        if (newState.userData) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(newState.userData));
        }
        if (newState.macroGoals) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.MACRO_GOALS, JSON.stringify(newState.macroGoals));
        }
        if (newState.customEmotions) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CUSTOM_EMOTIONS, JSON.stringify(newState.customEmotions));
        }
        if (newState.customNourishments) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CUSTOM_NOURISHMENTS, JSON.stringify(newState.customNourishments));
        }
        if (newState.menstrualData) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.MENSTRUAL_DATA, JSON.stringify(newState.menstrualData));
        }
        if (newState.settings) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(newState.settings));
        }
    }

    // Menstrual Logic
    updateMenstrualData(cycles, avgLength, avgDuration, nextPrediction) {
        const newData = {
            cycles,
            avgLength,
            avgDuration,
            nextPrediction
        };
        this.setState({ menstrualData: newData });
    }

    updateSettings(newSettings) {
        this.setState({ settings: { ...this.state.settings, ...newSettings } });
    }

    addPeriodStart(dateStr) {
        const { menstrualData } = this.state;
        const cycles = [...menstrualData.cycles];
        
        // Check if there is an ongoing cycle (no end date)
        const ongoing = cycles.find(c => !c.end);
        if (ongoing) {
            // If new start date is before ongoing start, update start
            if (dateStr < ongoing.start) {
                ongoing.start = dateStr;
            } else {
                // If trying to start a new one while one is open? 
                // Usually we close the previous one automatically or just update start?
                // Let's assume user wants to correct the start date or start a new cycle far away.
                // For simplicity: if dateStr is > ongoing.start + 14 days, treat as new cycle and close old one?
                // Or just allow manual "End" only. 
                // Let's just add a new cycle entry if no overlap.
                // Better logic: Find if dateStr is already inside a cycle.
                // If not, create new.
            }
        }
        
        // Simple logic: Create new entry or update existing "start" if same date range
        // Filter out any cycle that starts on same date
        const existingIndex = cycles.findIndex(c => c.start === dateStr);
        if (existingIndex === -1) {
            cycles.push({ start: dateStr, end: null });
            // Sort by date
            cycles.sort((a, b) => a.start.localeCompare(b.start));
        }
        
        this.recalculateMenstrualStats(cycles);
    }

    addPeriodEnd(dateStr) {
        const { menstrualData } = this.state;
        const cycles = [...menstrualData.cycles];
        
        // Find the latest cycle that started before or on dateStr
        // and doesn't have an end date, or has an end date < dateStr (extending it)
        // Actually we just want to close the most recent open cycle.
        
        // Find cycle where dateStr >= start
        const relevantCycles = cycles.filter(c => dateStr >= c.start);
        if (relevantCycles.length > 0) {
            const lastCycle = relevantCycles[relevantCycles.length - 1];
            lastCycle.end = dateStr;
        }
        
        this.recalculateMenstrualStats(cycles);
    }

    removePeriodStart(dateStr) {
        const { menstrualData } = this.state;
        let cycles = [...menstrualData.cycles];
        cycles = cycles.filter(c => c.start !== dateStr);
        this.recalculateMenstrualStats(cycles);
    }

    removePeriodEnd(dateStr) {
        const { menstrualData } = this.state;
        let cycles = [...menstrualData.cycles];
        cycles.forEach(c => {
            if (c.end === dateStr) c.end = null;
        });
        this.recalculateMenstrualStats(cycles);
    }

    removePeriodRecord(dateStr) {
        // Legacy or full clear
        this.removePeriodStart(dateStr);
        this.removePeriodEnd(dateStr);
    }

    // Atomic operations for period marking
    markPeriodStart(dateStr) {
        const { menstrualData, userData } = this.state;
        const cycles = [...menstrualData.cycles];
        
        // Check if there is an ongoing cycle (no end date)
        const ongoing = cycles.find(c => !c.end);
        if (ongoing) {
            // If new start date is before ongoing start, update start
            if (dateStr < ongoing.start) {
                ongoing.start = dateStr;
            }
        }
        
        // Filter out any cycle that starts on same date
        const existingIndex = cycles.findIndex(c => c.start === dateStr);
        if (existingIndex === -1) {
            cycles.push({ start: dateStr, end: null });
            // Sort by date
            cycles.sort((a, b) => a.start.localeCompare(b.start));
        }
        
        // Update both cycles and userData atomically
        const newUserData = { ...userData };
        newUserData[dateStr] = { ...newUserData[dateStr], isPeriod: true, isPeriodStart: true, isPeriodEnd: false };
        
        this.setState({ 
            menstrualData: { ...menstrualData, cycles },
            userData: newUserData
        });
        
        this.recalculateMenstrualStats(cycles);
    }

    markPeriodEnd(dateStr) {
        const { menstrualData, userData } = this.state;
        const cycles = [...menstrualData.cycles];
        
        // Find the latest cycle that started before or on dateStr
        const relevantCycles = cycles.filter(c => dateStr >= c.start);
        if (relevantCycles.length > 0) {
            const lastCycle = relevantCycles[relevantCycles.length - 1];
            lastCycle.end = dateStr;
        }
        
        // Update both cycles and userData atomically
        const newUserData = { ...userData };
        newUserData[dateStr] = { ...newUserData[dateStr], isPeriod: true, isPeriodEnd: true };
        
        this.setState({ 
            menstrualData: { ...menstrualData, cycles },
            userData: newUserData
        });
        
        this.recalculateMenstrualStats(cycles);
    }

    clearPeriodMark(dateStr) {
        const { menstrualData, userData } = this.state;
        const dayData = userData[dateStr] || {};
        const { isPeriod, isPeriodStart, isPeriodEnd, ...rest } = dayData;
        
        // Remove from cycles
        let cycles = [...menstrualData.cycles];
        cycles = cycles.filter(c => c.start !== dateStr);
        cycles.forEach(c => {
            if (c.end === dateStr) c.end = null;
        });
        
        // Update userData
        const newUserData = { ...userData };
        if (Object.keys(rest).length === 0) {
            delete newUserData[dateStr];
        } else {
            newUserData[dateStr] = rest;
        }
        
        this.setState({ 
            menstrualData: { ...menstrualData, cycles },
            userData: newUserData
        });
        
        this.recalculateMenstrualStats(cycles);
    }

    recalculateMenstrualStats(cycles) {
        // 1. Clean up invalid cycles (end < start)
        cycles = cycles.filter(c => !c.end || c.end >= c.start);
        
        // 2. Calculate Avg Length (Start to Start)
        let totalDays = 0;
        let count = 0;
        // Use last 6 cycles max
        const recentCycles = cycles.slice(-6); 
        
        for (let i = 0; i < recentCycles.length - 1; i++) {
            const current = recentCycles[i];
            const next = recentCycles[i+1];
            
            const diffTime = new Date(next.start) - new Date(current.start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 20 && diffDays < 45) { // Filter outliers
                totalDays += diffDays;
                count++;
            }
        }
        
        const avgLength = count > 0 ? Math.round(totalDays / count) : 28;
        
        // 3. Calculate Avg Duration (Start to End)
        let totalDuration = 0;
        let durationCount = 0;
        
        recentCycles.forEach(c => {
            if (c.end) {
                const diffTime = new Date(c.end) - new Date(c.start);
                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
                if (days > 2 && days < 10) {
                    totalDuration += days;
                    durationCount++;
                }
            }
        });
        
        const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 5;
        
        // 4. Predict Next
        let nextPrediction = null;
        if (cycles.length > 0) {
            const lastStart = cycles[cycles.length - 1].start;
            const nextStartDate = new Date(lastStart);
            nextStartDate.setDate(nextStartDate.getDate() + avgLength);
            
            const nextEndDate = new Date(nextStartDate);
            nextEndDate.setDate(nextEndDate.getDate() + avgDuration - 1);
            
            const pad2 = (n) => String(n).padStart(2, '0');
            const format = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
            
            nextPrediction = {
                start: format(nextStartDate),
                end: format(nextEndDate)
            };
        }
        
        this.updateMenstrualData(cycles, avgLength, avgDuration, nextPrediction);
    }

    // Migration Logic
    migrateData() {
        const migrationKey = 'xun_calendar_data_v2_local_date_migrated_v1';
        if (localStorage.getItem(migrationKey) === '1') return;

        let data = this.state.userData;
        const timezoneOffsetMinutes = new Date().getTimezoneOffset();
        
        // Skip if already correct or empty
        // timezoneOffsetMinutes > 0 for UTC- (west), < 0 for UTC+ (east)
        // China is UTC+8, offset = -480, so we migrate for negative offsets
        if (timezoneOffsetMinutes > 0 || !data || Object.keys(data).length === 0) {
            localStorage.setItem(migrationKey, '1');
            return;
        }

        const addDaysToDateStr = (dateStr, days) => {
            const d = Calendar.parseDateStrToLocalDate(dateStr);
            if (!d) return dateStr;
            d.setDate(d.getDate() + days);
            return Calendar.formatLocalDate(d);
        };

        const migrated = {};
        for (const [key, value] of Object.entries(data)) {
            const isDateKey = /^\d{4}-\d{2}-\d{2}$/.test(key);
            const newKey = isDateKey ? addDaysToDateStr(key, 1) : key;
            if (migrated[newKey] && value && typeof value === 'object') {
                migrated[newKey] = { ...migrated[newKey], ...value };
            } else {
                migrated[newKey] = value;
            }
        }

        this.setState({ userData: migrated });
        localStorage.setItem(migrationKey, '1');
    }
}

export const store = new Store();
