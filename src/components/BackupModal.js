
import { BackupManager } from '../core/BackupManager.js';
import { CONFIG } from '../config.js';
import { store } from '../core/State.js';
import { GistSync } from '../core/sync/GistSync.js';

export class BackupModal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.closeBtn = document.getElementById('backup-modal-close');
        this.exportBtn = document.getElementById('btn-export');
        this.importBtn = document.getElementById('btn-import');
        this.fileInput = document.getElementById('file-import');
        this.autoBackupToggle = document.getElementById('toggle-auto-backup');
        this.autoBackupListContainer = document.getElementById('auto-backup-list-container');
        this.autoBackupList = document.getElementById('auto-backup-list');

        // Gist Sync elements
        this.gistTokenInput = document.getElementById('gist-token');
        this.gistIdInput = document.getElementById('gist-id');
        this.btnSyncUp = document.getElementById('btn-sync-up');
        this.btnSyncDown = document.getElementById('btn-sync-down');
        this.syncStatus = document.getElementById('sync-status');
        
        this.initListeners();
        this.loadAutoBackupState();
        this.renderAutoBackupList();
        this.loadGistConfig();
    }

    loadGistConfig() {
        const token = localStorage.getItem('github_gist_token');
        const gistId = localStorage.getItem('github_gist_id');
        if (token) this.gistTokenInput.value = token;
        if (gistId) this.gistIdInput.value = gistId;
        this.updateSyncStatus();
    }

    updateSyncStatus() {
        const token = this.gistTokenInput.value.trim();
        if (token) {
            this.syncStatus.textContent = '已配置';
            this.syncStatus.className = 'text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600';
        } else {
            this.syncStatus.textContent = '未连接';
            this.syncStatus.className = 'text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500';
        }
    }

    saveGistConfig() {
        const token = this.gistTokenInput.value.trim();
        const gistId = this.gistIdInput.value.trim();
        if (token) localStorage.setItem('github_gist_token', token);
        else localStorage.removeItem('github_gist_token');
        
        if (gistId) localStorage.setItem('github_gist_id', gistId);
        else localStorage.removeItem('github_gist_id');
        
        this.updateSyncStatus();
    }

    async handleSyncUp() {
        const token = this.gistTokenInput.value.trim();
        if (!token) {
            alert('请先输入 GitHub Personal Access Token');
            return;
        }

        const originalText = this.btnSyncUp.innerHTML;
        this.btnSyncUp.innerHTML = '备份中...';
        this.btnSyncUp.disabled = true;

        try {
            const gistId = this.gistIdInput.value.trim();
            const sync = new GistSync(token, gistId || null);
            
            // test connection
            const isOk = await sync.testConnection();
            if (!isOk) throw new Error('Token 无效或网络错误');

            const backupData = JSON.parse(BackupManager.createBackup());
            const newGistId = await sync.updateGist(backupData);
            
            if (newGistId !== gistId) {
                this.gistIdInput.value = newGistId;
                this.saveGistConfig();
            }

            alert('云端备份成功！');
        } catch (error) {
            alert('云端备份失败: ' + error.message);
        } finally {
            this.btnSyncUp.innerHTML = originalText;
            this.btnSyncUp.disabled = false;
        }
    }

    async handleSyncDown() {
        const token = this.gistTokenInput.value.trim();
        const gistId = this.gistIdInput.value.trim();
        
        if (!token || !gistId) {
            alert('请提供 Token 和 Gist ID 才能恢复数据');
            return;
        }

        if (!confirm('从云端恢复将覆盖当前所有数据，确定要继续吗？')) return;

        const originalText = this.btnSyncDown.innerHTML;
        this.btnSyncDown.innerHTML = '恢复中...';
        this.btnSyncDown.disabled = true;

        try {
            const sync = new GistSync(token, gistId);
            const data = await sync.fetchGist();
            
            // Data validation
            if (!data.version || !data.data) {
                throw new Error('云端数据格式不正确');
            }

            BackupManager.restoreData(data.data);
            alert('云端数据恢复成功！页面将刷新以应用更改。');
            window.location.reload();
        } catch (error) {
            alert('云端恢复失败: ' + error.message);
        } finally {
            this.btnSyncDown.innerHTML = originalText;
            this.btnSyncDown.disabled = false;
        }
    }

    initListeners() {
        this.closeBtn.onclick = () => this.close();
        
        // Click outside to close
        this.modal.onclick = (e) => {
            if (e.target === this.modal) this.close();
        };

        // Gist sync listeners
        if (this.gistTokenInput) this.gistTokenInput.addEventListener('change', () => this.saveGistConfig());
        if (this.gistIdInput) this.gistIdInput.addEventListener('change', () => this.saveGistConfig());
        if (this.btnSyncUp) this.btnSyncUp.onclick = () => this.handleSyncUp();
        if (this.btnSyncDown) this.btnSyncDown.onclick = () => this.handleSyncDown();

        this.exportBtn.onclick = () => {
            try {
                const data = BackupManager.createBackup();
                BackupManager.downloadBackup(data);
            } catch (error) {
                alert('备份失败: ' + error.message);
            }
        };

        this.importBtn.onclick = () => {
            this.fileInput.click();
        };

        this.fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                if (confirm('导入将覆盖当前所有数据，确定要继续吗？')) {
                    const data = await BackupManager.validateAndImport(file);
                    BackupManager.restoreData(data);
                    alert('数据恢复成功！页面将刷新以应用更改。');
                    window.location.reload();
                }
            } catch (error) {
                alert('导入失败: ' + error.message);
            } finally {
                this.fileInput.value = ''; // Reset
            }
        };

        this.autoBackupToggle.onchange = (e) => {
            const isEnabled = e.target.checked;
            localStorage.setItem('auto_backup_enabled', isEnabled);
            store.setState({ autoBackup: isEnabled }); // Update store state
            
            if (isEnabled) {
                this.autoBackupListContainer.classList.remove('hidden');
                this.renderAutoBackupList();
            } else {
                this.autoBackupListContainer.classList.add('hidden');
            }
        };

        // Listen for auto-backup updates
        window.addEventListener('auto-backup-updated', () => {
            if (this.autoBackupToggle.checked) {
                this.renderAutoBackupList();
            }
        });
    }

    loadAutoBackupState() {
        const isEnabled = localStorage.getItem('auto_backup_enabled') === 'true';
        this.autoBackupToggle.checked = isEnabled;
        if (isEnabled) {
            this.autoBackupListContainer.classList.remove('hidden');
        } else {
            this.autoBackupListContainer.classList.add('hidden');
        }
    }

    renderAutoBackupList() {
        const backups = BackupManager.getAutoBackups();
        this.autoBackupList.innerHTML = '';

        if (backups.length === 0) {
            this.autoBackupList.innerHTML = '<p class="text-xs text-gray-400 text-center py-2">暂无快照记录</p>';
            return;
        }

        backups.forEach((backup, index) => {
            const date = new Date(backup.timestamp);
            const timeStr = date.toLocaleString();
            
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors';
            
            item.innerHTML = `
                <span class="text-xs text-gray-600 font-mono">${timeStr}</span>
                <div class="flex gap-2">
                    <button class="text-blue-500 hover:text-blue-700 text-xs underline" data-action="restore" data-index="${index}">恢复</button>
                    <button class="text-gray-500 hover:text-gray-700 text-xs underline" data-action="download" data-index="${index}">下载</button>
                </div>
            `;
            
            // Event delegation handled manually here for simplicity
            const restoreBtn = item.querySelector('[data-action="restore"]');
            restoreBtn.onclick = () => {
                if (confirm(`确定要恢复到 ${timeStr} 的状态吗？当前未保存的数据将丢失。`)) {
                    BackupManager.restoreData(backup.data);
                    alert('恢复成功！页面将刷新。');
                    window.location.reload();
                }
            };

            const downloadBtn = item.querySelector('[data-action="download"]');
            downloadBtn.onclick = () => {
                BackupManager.downloadBackup(JSON.stringify(backup, null, 2));
            };

            this.autoBackupList.appendChild(item);
        });
    }

    open() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    }

    close() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
    }
}
