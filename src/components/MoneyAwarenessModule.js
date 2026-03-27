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
            buttonGrids: document.querySelectorAll('.money-button-grid'),
            tabButtons: document.querySelectorAll('.money-tab-btn'),
            tabContents: document.querySelectorAll('.money-tab-content'),
            progressText: document.getElementById('money-progress-text'),
            skipAllBtn: document.getElementById('money-skip-all'),
            skipBtns: document.querySelectorAll('.money-skip-btn'),
            nextBtns: document.querySelectorAll('.money-next-btn'),
            completeBtn: document.querySelector('.money-complete-btn'),
            identityConfirmation: document.getElementById('identity-confirmation'),
            identityConfirmationText: document.getElementById('identity-confirmation-text')
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
                this.generateInstantInsight();
                this.syncToModal();
                this.updateSectionCompletion('insight');
            });

            // 自动保存草稿
            this.elements.insightInput.addEventListener('blur', () => {
                this.saveDraft();
            });
        }

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
                this.hideIdentityConfirmation();
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
        restoreBtn.className = 'text-xs text-[#888888] hover:text-[#333333] px-3 py-2 rounded-full border border-[#EEEEEE] hover:bg-white transition-colors mt-2';
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
            this.elements.completeBtn.classList.add('done');
            
            setTimeout(() => {
                this.elements.completeBtn.textContent = originalText;
                this.elements.completeBtn.classList.remove('done');
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
        this.generateInstantInsight();
        this.updateIdentityConfirmation();
        this.updateProgress();
        this.syncToModal();
    }

    updateInsightCount(count) {
        if (this.elements.insightCount) {
            this.elements.insightCount.textContent = count;
        }
    }

    generateInstantInsight() {
        // Check if user has completed the deep analysis step
        if (!this.currentData.life_directions || this.currentData.life_directions.length === 0 ||
            !this.currentData.identity_states || 
            !this.currentData.money_relationship) {
            this.hideInstantInsight();
            return;
        }

        const insight = this.buildInsightSummary();
        this.displayInstantInsight(insight);
        this.saveInsightToLocalStorage(insight);
    }

    getData() {
        return {
            ...this.currentData,
            skipped_sections: Array.from(this.skippedSections),
            completed_sections: Array.from(this.completedSections),
            current_tab: this.currentTab
        };
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
        this.hideInstantInsight();
        this.hideIdentityConfirmation();
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

    generateInstantInsight() {
        // Check if user has completed the deep analysis step
        if (!this.currentData.life_directions || this.currentData.life_directions.length === 0 ||
            !this.currentData.identity_states || 
            !this.currentData.money_relationship) {
            this.hideInstantInsight();
            return;
        }

        const insight = this.buildInsightSummary();
        this.displayInstantInsight(insight);
        this.saveInsightToLocalStorage(insight);
    }

    buildInsightSummary() {
        const lifeDirection = this.getPrimaryLifeDirection();
        const identityExplanation = this.getIdentityExplanation();
        const relationshipExplanation = this.getMoneyRelationshipExplanation();

        return {
            life_direction: lifeDirection,
            identity_explanation: identityExplanation,
            money_relationship: relationshipExplanation
        };
    }

    getPrimaryLifeDirection() {
        const directions = this.currentData.life_directions;
        const directionMap = {
            'long_term': '长期主义 · 为未来投资',
            'maintenance': '支撑生活的基石 · 维持日常运转',
            'relationship': '关系连接 · 投资情感纽带',
            'exploration': '探索世界 · 拓展生命体验',
            'emotional': '情绪调节 · 关照内在状态',
            'buy_time': '购买时间 · 获得自由空间'
        };

        // Use the first selected direction as primary
        const primary = directions[0];
        return directionMap[primary] || '生活支持';
    }

    getIdentityExplanation() {
        const identity = this.currentData.identity_states;
        const identityMap = {
            'goal_oriented': '投资目标中的自己 · 正在推进长期方向',
            'structure_maintaining': '维持结构的自己 · 支持日常稳定运转',
            'active_choice': '主动选择的自己 · 这是自己决定的投入',
            'reality_responding': '回应现实的自己 · 这是生活需要的一部分',
            'emotion_caring': '照顾情绪的自己 · 在支持当下状态'
        };

        return identityMap[identity] || '成为更好的自己';
    }

    getMoneyRelationshipExplanation() {
        const relationship = this.currentData.money_relationship;
        const relationshipMap = {
            'freedom': '自由流动 · 金钱是选择的工具',
            'cooperation': '合作共生 · 金钱是生活的伙伴',
            'control': '谨慎管理 · 金钱需要规划掌控',
            'anxiety': '焦虑不安 · 金钱带来压力担忧',
            'gratitude': '感恩珍惜 · 金钱是生活的礼物',
            'confusion': '迷茫探索 · 与金钱的关系正在重塑'
        };

        return relationshipMap[relationship] || '与金钱共舞';
    }

    displayInstantInsight(insight) {
        const summaryElement = document.getElementById('money-insight-summary');
        if (!summaryElement) return;

        // Update content
        document.getElementById('insight-life-direction').textContent = insight.life_direction;
        document.getElementById('insight-identity-explanation').textContent = insight.identity_explanation;
        document.getElementById('insight-money-relationship').textContent = insight.money_relationship;

        // Show with animation
        summaryElement.classList.remove('hidden');
        
        // Trigger reflow for animation
        summaryElement.offsetHeight;
        summaryElement.querySelector('.animate-fade-in').style.animation = 'fadeIn 0.6s ease-out';
    }

    hideInstantInsight() {
        const summaryElement = document.getElementById('money-insight-summary');
        if (summaryElement) {
            summaryElement.classList.add('hidden');
        }
    }

    saveInsightToLocalStorage(insight) {
        try {
            const insightData = {
                ...insight,
                timestamp: new Date().toISOString(),
                date: new Date().toDateString(),
                raw_data: {
                    life_directions: this.currentData.life_directions,
                    identity_states: this.currentData.identity_states,
                    money_relationship: this.currentData.money_relationship
                }
            };
            localStorage.setItem('moneyDailyInsight', JSON.stringify(insightData));
        } catch (error) {
            console.warn('Failed to save money insight to localStorage:', error);
        }
    }

    updateIdentityConfirmation() {
        if (!this.currentData.identity_states) {
            this.hideIdentityConfirmation();
            return;
        }

        const confirmationText = this.getIdentityConfirmationText(this.currentData.identity_states);
        this.showIdentityConfirmation(confirmationText);
    }

    getIdentityConfirmationText(identity) {
        const confirmationMap = {
            'goal_oriented': '「建设未来的我」',
            'structure_maintaining': '「维持结构的我」',
            'active_choice': '「主动选择的我」',
            'reality_responding': '「回应现实的我」',
            'emotion_caring': '「照顾情绪的我」'
        };

        return confirmationMap[identity] || '「成为自己的我」';
    }

    showIdentityConfirmation(text) {
        if (this.elements.identityConfirmation && this.elements.identityConfirmationText) {
            this.elements.identityConfirmationText.textContent = text;
            this.elements.identityConfirmation.classList.remove('hidden');
            
            // Trigger reflow for animation
            this.elements.identityConfirmation.offsetHeight;
            const confirmCard = this.elements.identityConfirmation.querySelector('.animate-fade-in');
            if (confirmCard) {
                confirmCard.style.animation = 'fadeIn 0.6s ease-out';
            }
        }
    }

    hideIdentityConfirmation() {
        if (this.elements.identityConfirmation) {
            this.elements.identityConfirmation.classList.add('hidden');
        }
    }
}
