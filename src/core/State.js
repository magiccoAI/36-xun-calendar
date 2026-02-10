
import { CONFIG } from '../config.js';

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
            autoBackup: localStorage.getItem('auto_backup_enabled') === 'true' // Load auto backup setting
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
    }

    // Migration Logic
    migrateData() {
        const migrationKey = 'xun_calendar_data_v2_local_date_migrated_v1';
        if (localStorage.getItem(migrationKey) === '1') return;

        let data = this.state.userData;
        const timezoneOffsetMinutes = new Date().getTimezoneOffset();
        
        // Skip if already correct or empty
        if (timezoneOffsetMinutes >= 0 || !data || Object.keys(data).length === 0) {
            localStorage.setItem(migrationKey, '1');
            return;
        }

        const addDaysToDateStr = (dateStr, days) => {
            const d = new Date(`${dateStr}T00:00:00`);
            d.setDate(d.getDate() + days);
            const pad2 = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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
