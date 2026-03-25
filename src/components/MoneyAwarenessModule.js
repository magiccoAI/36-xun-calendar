export class MoneyAwarenessModule {
    constructor(modalInstance) {
        this.modal = modalInstance;
        this.elements = {};
        this.currentData = {
            key_events: [],
            life_directions: [],
            identity_states: null,
            flow_rhythm: null,
            money_relationship: null,
            insight: ''
        };
        this.currentTab = 'basic';
        this.skippedSections = new Set();
        this.completedSections = new Set();
        
        this.initElements();
        this.initEventListeners();
        this.updateProgress();
    }

    initElements() {
        this.elements = {
            module: document.getElementById('money-awareness-module'),
            insightInput: document.getElementById('money-insight-input'),
            insightCount: document.getElementById('money-insight-count'),
            suggestions: document.querySelectorAll('.insight-suggestion-btn'),
            tagContainer: document.getElementById('money-tag-container'),
            tag: document.getElementById('money-tag'),
            buttonGrids: document.querySelectorAll('.money-button-grid'),
            tabButtons: document.querySelectorAll('.money-tab-btn'),
            tabContents: document.querySelectorAll('.money-tab-content'),
            progressText: document.getElementById('money-progress-text'),
            skipAllBtn: document.getElementById('money-skip-all'),
            skipBtns: document.querySelectorAll('.money-skip-btn'),
            nextBtns: document.querySelectorAll('.money-next-btn'),
            completeBtn: document.querySelector('.money-complete-btn')
        };
    }

    initEventListeners() {
        // 标签页切换
        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // 按钮点击事件
        this.elements.buttonGrids.forEach(grid => {
            const buttons = grid.querySelectorAll('.money-awareness-button');
            buttons.forEach(button => {
                button.addEventListener('click', () => this.handleButtonClick(button));
            });
        });

        // 洞察输入框事件
        if (this.elements.insightInput) {
            this.elements.insightInput.addEventListener('input', (e) => {
                this.updateInsightCount(e.target.value.length);
                this.currentData.insight = e.target.value;
                this.generateMoneyTag();
                this.syncToModal();
                this.updateSectionCompletion('insight');
            });

            // 自动保存草稿
            this.elements.insightInput.addEventListener('blur', () => {
                this.saveDraft();
            });
        }

        // 快捷填充建议
        this.elements.suggestions.forEach(btn => {
            btn.addEventListener('click', () => {
                const suggestion = btn.dataset.suggestion;
                if (this.elements.insightInput && suggestion) {
                    this.elements.insightInput.value = suggestion;
                    this.updateInsightCount(suggestion.length);
                    this.currentData.insight = suggestion;
                    this.generateMoneyTag();
                    this.syncToModal();
                    this.updateSectionCompletion('insight');
                }
            });
        });

        // 跳过按钮
        this.elements.skipBtns.forEach(btn => {
            btn.addEventListener('click', () => this.skipSection(btn.dataset.skip));
        });

        // 下一步按钮
        this.elements.nextBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.next));
        });

        // 完成按钮
        if (this.elements.completeBtn) {
            this.elements.completeBtn.addEventListener('click', () => this.completeModule());
        }

        // 跳过整个模块
        if (this.elements.skipAllBtn) {
            this.elements.skipAllBtn.addEventListener('click', () => this.skipAll());
        }
    }

    switchTab(tabName) {
        if (this.currentTab === tabName) return;

        // 更新标签按钮状态
        this.elements.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 更新内容显示
        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `money-tab-${tabName}`);
        });

        this.currentTab = tabName;
        this.updateProgress();
    }

    skipSection(sectionName) {
        this.skippedSections.add(sectionName);
        this.completedSections.delete(sectionName);
        
        // 清空该section的数据
        switch(sectionName) {
            case 'basic':
                this.currentData.key_events = [];
                this.currentData.life_directions = [];
                break;
            case 'deep':
                this.currentData.identity_states = null;
                this.currentData.flow_rhythm = null;
                this.currentData.money_relationship = null;
                break;
            case 'insight':
                this.currentData.insight = '';
                if (this.elements.insightInput) {
                    this.elements.insightInput.value = '';
                    this.updateInsightCount(0);
                }
                break;
        }

        // 自动切换到下一个标签
        const tabOrder = ['basic', 'deep', 'insight'];
        const currentIndex = tabOrder.indexOf(sectionName);
        if (currentIndex < tabOrder.length - 1) {
            this.switchTab(tabOrder[currentIndex + 1]);
        }

        this.updateProgress();
        this.syncToModal();
    }

    skipAll() {
        // 清空所有数据
        this.reset();
        // 标记所有section为跳过
        ['basic', 'deep', 'insight'].forEach(section => {
            this.skippedSections.add(section);
        });
        this.updateProgress();
        this.syncToModal();
        
        // 折叠模块而不是隐藏
        this.collapseModule();
    }

    collapseModule() {
        if (this.elements.module) {
            this.elements.module.classList.add('collapsed');
            
            // 创建恢复按钮
            this.createRestoreButton();
        }
    }

    createRestoreButton() {
        // 检查是否已经有恢复按钮
        if (document.getElementById('money-module-restore')) {
            return;
        }

        const restoreBtn = document.createElement('button');
        restoreBtn.id = 'money-module-restore';
        restoreBtn.className = 'text-xs text-amber-600 hover:text-amber-700 px-3 py-2 rounded-lg border border-amber-200 hover:bg-amber-50 transition-colors mt-2';
        restoreBtn.innerHTML = '🔄 重新展开金钱观察模块';
        
        restoreBtn.addEventListener('click', () => {
            this.restoreModule();
        });

        // 插入到模块后面
        if (this.elements.module && this.elements.module.parentNode) {
            this.elements.module.parentNode.insertBefore(restoreBtn, this.elements.module.nextSibling);
        }
    }

    restoreModule() {
        // 移除折叠状态
        if (this.elements.module) {
            this.elements.module.classList.remove('collapsed');
        }

        // 移除恢复按钮
        const restoreBtn = document.getElementById('money-module-restore');
        if (restoreBtn) {
            restoreBtn.remove();
        }

        // 清除跳过状态，重置到第一个标签
        this.skippedSections.clear();
        this.completedSections.clear();
        this.currentTab = 'basic';
        this.switchTab('basic');
        this.updateProgress();
        this.syncToModal();
    }

    updateSectionCompletion(sectionName) {
        let isCompleted = false;
        
        switch(sectionName) {
            case 'basic':
                isCompleted = this.currentData.key_events.length > 0 || this.currentData.life_directions.length > 0;
                break;
            case 'deep':
                isCompleted = !!(this.currentData.identity_states && this.currentData.flow_rhythm && this.currentData.money_relationship);
                break;
            case 'insight':
                isCompleted = this.currentData.insight.trim().length > 0;
                break;
        }

        if (isCompleted) {
            this.completedSections.add(sectionName);
            this.skippedSections.delete(sectionName);
        } else {
            this.completedSections.delete(sectionName);
        }
    }

    updateProgress() {
        // 检查每个section的完成状态
        this.updateSectionCompletion('basic');
        this.updateSectionCompletion('deep');
        this.updateSectionCompletion('insight');

        const completedCount = this.completedSections.size;
        const totalCount = 3;
        
        if (this.elements.progressText) {
            this.elements.progressText.textContent = `${completedCount}/${totalCount}`;
        }
    }

    completeModule() {
        // 标记当前section为完成
        this.updateSectionCompletion(this.currentTab);
        
        // 触发保存
        this.syncToModal();
        this.saveDraft();
        
        // 显示完成反馈
        if (this.elements.completeBtn) {
            const originalText = this.elements.completeBtn.textContent;
            this.elements.completeBtn.textContent = '✓ 已完成';
            this.elements.completeBtn.classList.add('bg-green-600');
            
            setTimeout(() => {
                this.elements.completeBtn.textContent = originalText;
                this.elements.completeBtn.classList.remove('bg-green-600');
            }, 2000);
        }
    }

    handleButtonClick(button) {
        const grid = button.closest('.money-button-grid');
        const group = grid.dataset.moneyGroup;
        const value = button.dataset.moneyValue;
        const maxSelect = parseInt(grid.dataset.maxSelect) || 1;
        const isSingleSelect = grid.dataset.singleSelect === 'true';

        // 确定这个按钮属于哪个section
        let sectionName = 'basic';
        if (['identity_states', 'flow_rhythm', 'money_relationship'].includes(group)) {
            sectionName = 'deep';
        }

        if (isSingleSelect) {
            // 单选模式
            const buttons = grid.querySelectorAll('.money-awareness-button');
            buttons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            this.currentData[group] = value;
        } else {
            // 多选模式
            const currentSelection = this.currentData[group] || [];
            const index = currentSelection.indexOf(value);
            
            if (index >= 0) {
                // 取消选择
                currentSelection.splice(index, 1);
                button.classList.remove('selected');
            } else {
                // 检查最大选择数量
                if (currentSelection.length >= maxSelect) {
                    // 自动取消最早选择项
                    const firstValue = currentSelection.shift();
                    const firstButton = grid.querySelector(`[data-money-value="${firstValue}"]`);
                    if (firstButton) {
                        firstButton.classList.remove('selected');
                    }
                }
                // 添加新选择
                currentSelection.push(value);
                button.classList.add('selected');
            }
            
            this.currentData[group] = currentSelection;
        }

        this.updateSectionCompletion(sectionName);
        this.generateMoneyTag();
        this.updateProgress();
        this.syncToModal();
    }

    updateInsightCount(count) {
        if (this.elements.insightCount) {
            this.elements.insightCount.textContent = count;
        }
    }

    generateMoneyTag() {
        // 基于生活方向选择生成标签
        const lifeDirections = this.currentData.life_directions || [];
        if (lifeDirections.length === 0) {
            this.hideMoneyTag();
            return;
        }

        const tagMap = {
            'long_term': '建设型',
            'maintenance': '维护型',
            'relationship': '关系型',
            'exploration': '探索型',
            'emotional': '情绪型',
            'buy_time': '恢复型'
        };

        // 生成主要标签
        let primaryTag = '平衡型';
        if (lifeDirections.includes('long_term')) {
            primaryTag = '建设型';
        } else if (lifeDirections.includes('relationship')) {
            primaryTag = '关系型';
        } else if (lifeDirections.includes('exploration')) {
            primaryTag = '探索型';
        } else if (lifeDirections.includes('emotional')) {
            primaryTag = '情绪型';
        } else if (lifeDirections.includes('maintenance')) {
            primaryTag = '维护型';
        }

        this.showMoneyTag(primaryTag);
    }

    showMoneyTag(tag) {
        if (this.elements.tag && this.elements.tagContainer) {
            this.elements.tag.textContent = `${tag}一天`;
            this.elements.tagContainer.classList.remove('hidden');
        }
    }

    hideMoneyTag() {
        if (this.elements.tagContainer) {
            this.elements.tagContainer.classList.add('hidden');
        }
    }

    syncToModal() {
        // 将数据同步到Modal实例
        if (this.modal) {
            this.modal.currentMoneyState = {
                ...this.modal.currentMoneyState,
                ...this.currentData,
                skipped_sections: Array.from(this.skippedSections),
                completed_sections: Array.from(this.completedSections)
            };
        }
    }

    saveDraft() {
        // 保存草稿到localStorage
        try {
            const draftData = {
                ...this.currentData,
                skipped_sections: Array.from(this.skippedSections),
                completed_sections: Array.from(this.completedSections),
                current_tab: this.currentTab
            };
            localStorage.setItem('money-awareness-draft', JSON.stringify(draftData));
        } catch (error) {
            console.warn('Failed to save money awareness draft:', error);
        }
    }

    loadDraft() {
        // 从localStorage加载草稿
        try {
            const draft = localStorage.getItem('money-awareness-draft');
            if (draft) {
                const data = JSON.parse(draft);
                this.setData(data);
                
                // 恢复标签页状态
                if (data.current_tab) {
                    this.switchTab(data.current_tab);
                }
                
                // 恢复跳过状态
                if (data.skipped_sections) {
                    this.skippedSections = new Set(data.skipped_sections);
                }
                
                // 恢复完成状态
                if (data.completed_sections) {
                    this.completedSections = new Set(data.completed_sections);
                }
                
                this.updateProgress();
            }
        } catch (error) {
            console.warn('Failed to load money awareness draft:', error);
        }
    }

    setData(data) {
        // 设置数据并更新UI
        this.currentData = {
            key_events: data.key_events || [],
            life_directions: data.life_directions || [],
            identity_states: data.identity_states || null,
            flow_rhythm: data.flow_rhythm || null,
            money_relationship: data.money_relationship || null,
            insight: data.insight || ''
        };

        this.updateUI();
        this.generateMoneyTag();
        this.syncToModal();
    }

    updateUI() {
        // 更新按钮状态
        Object.keys(this.currentData).forEach(group => {
            const grid = document.querySelector(`[data-money-group="${group}"]`);
            if (!grid) return;

            const buttons = grid.querySelectorAll('.money-awareness-button');
            const value = this.currentData[group];

            if (Array.isArray(value)) {
                // 多选
                buttons.forEach(btn => {
                    btn.classList.toggle('selected', value.includes(btn.dataset.moneyValue));
                });
            } else {
                // 单选
                buttons.forEach(btn => {
                    btn.classList.toggle('selected', btn.dataset.moneyValue === value);
                });
            }
        });

        // 更新洞察输入框
        if (this.elements.insightInput) {
            this.elements.insightInput.value = this.currentData.insight || '';
            this.updateInsightCount(this.currentData.insight.length);
        }
    }

    reset() {
        this.currentData = {
            key_events: [],
            life_directions: [],
            identity_states: null,
            flow_rhythm: null,
            money_relationship: null,
            insight: ''
        };
        this.skippedSections.clear();
        this.completedSections.clear();
        this.currentTab = 'basic';
        
        this.updateUI();
        this.hideMoneyTag();
        this.updateProgress();
        this.switchTab('basic'); // 重置到第一个标签
        this.syncToModal();
        
        // 显示模块（如果之前被折叠）
        if (this.elements.module) {
            this.elements.module.classList.remove('collapsed');
        }
        
        // 移除恢复按钮
        const restoreBtn = document.getElementById('money-module-restore');
        if (restoreBtn) {
            restoreBtn.remove();
        }
    }

    getData() {
        return {
            ...this.currentData,
            skipped_sections: Array.from(this.skippedSections),
            completed_sections: Array.from(this.completedSections),
            current_tab: this.currentTab
        };
    }
}
