
import { store } from '../core/State.js';
import { BackupManager } from '../core/BackupManager.js';

export class SettingsModal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        if (!this.modal) {
            console.error('Settings modal not found');
            return;
        }
        this.closeBtn = this.modal.querySelector('.close-btn');
        this.menstrualToggle = document.getElementById('toggle-menstrual-cycle');
        this.resetRecordsBtn = document.getElementById('reset-records-btn');
        this.fullResetBtn = document.getElementById('full-reset-btn');
        
        this.initListeners();
        this.loadInitialState();
    }

    initListeners() {
        this.closeBtn.onclick = () => this.close();
        this.modal.onclick = (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        };

        this.menstrualToggle.onchange = (e) => {
            const isEnabled = e.target.checked;
            store.updateSettings({ showMenstrualCycle: isEnabled });
            // 更新生理记录按钮的显示状态
            this.updateMenstrualButtonVisibility(isEnabled);
        };

        // 重置按钮事件监听器
        if (this.resetRecordsBtn) {
            this.resetRecordsBtn.onclick = () => this.showResetRecordsConfirmation();
        }
        
        if (this.fullResetBtn) {
            this.fullResetBtn.onclick = () => this.showFullResetConfirmation();
        }
        
        // 为整个卡片区域添加点击事件
        const resetRecordsCard = this.resetRecordsBtn?.closest('.bg-yellow-50');
        const fullResetCard = this.fullResetBtn?.closest('.bg-red-50');
        
        if (resetRecordsCard) {
            resetRecordsCard.onclick = (e) => {
                // 如果点击的是按钮本身，不要重复触发
                if (e.target.id !== 'reset-records-btn') {
                    this.showResetRecordsConfirmation();
                }
            };
        }
        
        if (fullResetCard) {
            fullResetCard.onclick = (e) => {
                // 如果点击的是按钮本身，不要重复触发
                if (e.target.id !== 'full-reset-btn') {
                    this.showFullResetConfirmation();
                }
            };
        }
    }

    loadInitialState() {
        const state = store.getState();
        this.menstrualToggle.checked = state.settings.showMenstrualCycle;
        // 初始化生理记录按钮的显示状态
        this.updateMenstrualButtonVisibility(state.settings.showMenstrualCycle);
    }

    // 更新生理记录按钮的显示状态
    updateMenstrualButtonVisibility(isEnabled) {
        const menstrualBtn = document.getElementById('menstrual-view-btn');
        if (!menstrualBtn) return;

        if (isEnabled) {
            menstrualBtn.style.display = 'flex';
        } else {
            menstrualBtn.style.display = 'none';
        }
    }

    open() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    }

    close() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
    }

    // 显示清空记录确认对话框
    showResetRecordsConfirmation() {
        const hasData = Object.keys(store.getState().userData).length > 0 || 
                       Object.keys(store.getState().macroGoals).length > 0;
        
        if (!hasData) {
            this.showNotification('当前没有需要清空的记录', 'info');
            return;
        }

        const confirmed = confirm(
            '⚠️ 确认清空所有记录吗？\n\n' +
            '这将删除：\n' +
            '• 所有日常记录（情绪、睡眠、运动等）\n' +
            '• 所有旬目标设置\n' +
            '• 三件好事记录\n' +
            '• 给明天的话\n\n' +
            '但会保留：\n' +
            '• 应用设置（如生理周期开关）\n' +
            '• 自定义情绪标签\n' +
            '• 自定义生活标签\n\n' +
            '建议先备份数据以防后悔！'
        );

        if (confirmed) {
            this.resetRecords();
        }
    }

    // 显示完全重置确认对话框
    showFullResetConfirmation() {
        const confirmed = confirm(
            '🚨 确定完全重置吗？\n\n' +
            '这将删除：\n' +
            '• 所有用户数据记录\n' +
            '• 所有应用设置\n' +
            '• 所有自定义标签\n' +
            '• 生理周期数据\n' +
            '• 自动备份记录\n\n' +
            '应用将恢复到全新安装状态！\n\n' +
            '此操作不可撤销，请谨慎操作！'
        );

        if (confirmed) {
            const finalConfirm = confirm('最后确认：真的要完全重置所有数据吗？');
            if (finalConfirm) {
                this.fullReset();
            }
        }
    }

    // 清空记录（保留设置）
    resetRecords() {
        try {
            // 先创建备份
            const backup = BackupManager.createBackup();
            BackupManager.downloadBackup(backup);
            
            // 重置数据
            store.setState({
                userData: {},
                macroGoals: {},
                menstrualData: {
                    cycles: [],
                    avgLength: 28,
                    avgDuration: 5,
                    nextPrediction: null
                }
            });
            
            this.showNotification('✅ 记录已清空！备份文件已自动下载', 'success');
            this.close();
            
            // 刷新页面以确保UI更新
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('重置记录失败:', error);
            this.showNotification('❌ 重置失败，请重试', 'error');
        }
    }

    // 完全重置
    fullReset() {
        try {
            // 清空所有localStorage
            localStorage.clear();
            
            this.showNotification('✅ 完全重置成功！页面将重新加载...', 'success');
            
            // 延迟刷新以确保消息显示
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('完全重置失败:', error);
            this.showNotification('❌ 重置失败，请重试', 'error');
        }
    }

    // 显示通知消息
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
        
        // 根据类型设置样式
        const styles = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white',
            warning: 'bg-yellow-500 text-white'
        };
        
        notification.className += ` ${styles[type] || styles.info}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="text-sm font-medium">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-white hover:text-gray-200">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
        }, 100);
        
        // 自动消失
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
}
