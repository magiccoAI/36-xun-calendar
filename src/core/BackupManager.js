
import { CONFIG } from '../config.js';
import { store } from './State.js';

export class BackupManager {
    static CURRENT_VERSION = '1.0';

    static createBackup() {
        const state = store.getState();
        const backup = {
            version: this.CURRENT_VERSION,
            timestamp: new Date().toISOString(),
            data: {
                userData: state.userData,
                macroGoals: state.macroGoals,
                customEmotions: state.customEmotions,
                customNourishments: state.customNourishments
            }
        };
        return JSON.stringify(backup, null, 2);
    }

    static downloadBackup(jsonString) {
        const date = new Date();
        const timestamp = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0') + '_' +
            String(date.getHours()).padStart(2, '0') + '-' +
            String(date.getMinutes()).padStart(2, '0') + '-' +
            String(date.getSeconds()).padStart(2, '0');
        
        const filename = `backup_${timestamp}.json`;
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static async validateAndImport(file) {
        return new Promise((resolve, reject) => {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                reject(new Error('文件大小超过 5MB 限制'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = JSON.parse(e.target.result);
                    
                    // Schema Validation
                    if (!content.version || !content.data) {
                        reject(new Error('无效的备份文件格式：缺少必要字段'));
                        return;
                    }

                    // Version Check
                    if (content.version !== this.CURRENT_VERSION) {
                        reject(new Error(`版本不兼容：备份文件版本 (${content.version}) 与当前系统版本 (${this.CURRENT_VERSION}) 不匹配`));
                        return;
                    }

                    // Basic structure check
                    const requiredKeys = ['userData', 'macroGoals'];
                    const missingKeys = requiredKeys.filter(key => !content.data[key]);
                    if (missingKeys.length > 0) {
                        reject(new Error(`无效的数据结构：缺少 ${missingKeys.join(', ')}`));
                        return;
                    }

                    resolve(content.data);
                } catch (err) {
                    reject(new Error('无法解析 JSON 文件'));
                }
            };
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    }

    static restoreData(data) {
        // Update store
        store.setState({
            userData: data.userData || {},
            macroGoals: data.macroGoals || {},
            customEmotions: data.customEmotions || [],
            customNourishments: data.customNourishments || []
        });
        
        return true;
    }

    static autoBackupTimer = null;
    static handleAutoBackup(state) {
        if (this.autoBackupTimer) clearTimeout(this.autoBackupTimer);
        
        this.autoBackupTimer = setTimeout(() => {
            try {
                const backupData = {
                    version: this.CURRENT_VERSION,
                    timestamp: new Date().toISOString(),
                    data: {
                        userData: state.userData,
                        macroGoals: state.macroGoals,
                        customEmotions: state.customEmotions,
                        customNourishments: state.customNourishments
                    }
                };

                // Get existing backups
                let backups = [];
                try {
                    backups = JSON.parse(localStorage.getItem('auto_backups') || '[]');
                } catch (e) {
                    backups = [];
                }

                // Add new backup
                backups.unshift(backupData); // Add to beginning

                // Keep only latest 7
                if (backups.length > 7) {
                    backups = backups.slice(0, 7);
                }

                // Save
                localStorage.setItem('auto_backups', JSON.stringify(backups));
                console.log('Auto backup created:', backupData.timestamp);
                
                // Dispatch event for UI update
                window.dispatchEvent(new CustomEvent('auto-backup-updated'));
                
            } catch (error) {
                console.error('Auto backup failed:', error);
            }
        }, 5000); // Debounce 5 seconds
    }

    static getAutoBackups() {
        try {
            return JSON.parse(localStorage.getItem('auto_backups') || '[]');
        } catch (e) {
            return [];
        }
    }
}
