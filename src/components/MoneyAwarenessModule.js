const BASE_DRAFT_KEY = 'moneyObservationDraft';

const STEP1_OPTIONS = [
    { value: '花掉的一笔', label: '花掉的一笔', desc: '买咖啡、午餐、零食、外卖' },
    { value: '赚到的一笔', label: '赚到的一笔', desc: '接到订单、收到奖金、卖闲置' },
    { value: '留下来的一笔', label: '留下来的一笔', desc: '存进零钱包、存进账户、没动的钱' },
    { value: '投出去的一笔', label: '投出去的一笔', desc: '买基金、理财产品、股市投资' },
    { value: '换时间的一笔', label: '换时间的一笔', desc: '打车代替走路、叫外卖代替做饭、请人帮忙' },
    { value: '换收入的一笔', label: '换收入的一笔', desc: '加班赚加班费、接自由职业活、做兼职' }
];

const STEP2_LIFE_SUPPORT_OPTIONS = [
    { value: '往长远处走', label: '往长远处走', desc: '学习、能力投资、健康投入、长期准备' },
    { value: '让生活正常运转', label: '让生活正常运转', desc: '吃饭、通勤、房租、日常开支' },
    { value: '维系重要关系', label: '维系重要关系', desc: '朋友、家人、社交、人情往来' },
    { value: '去看看世界', label: '去看看世界', desc: '旅行、体验、探索新环境' },
    { value: '给自己一点空间', label: '给自己一点空间', desc: '休息、兴趣、娱乐、奖励自己' },
    { value: '帮我省出时间', label: '帮我省出时间', desc: '打车、外卖、工具付费、效率提升' }
];

const STEP2_SELF_STATE_OPTIONS = [
    { value: '在推进未来的我', label: '在推进未来的我', desc: '学习 / 健康 / 能力 / 长期准备' },
    { value: '在维持生活的我', label: '在维持生活的我', desc: '日常开支 / 必要支出 / 运转生活' },
    { value: '在照顾当下的我', label: '在照顾当下的我', desc: '休息一下 / 奖励自己 / 开心一下 / 缓解压力' }
];

const STEP2_BREATH_OPTIONS = [
    { value: '舒展的', label: '舒展的', desc: '花钱不紧张，还有余裕' },
    { value: '平稳的', label: '平稳的', desc: '按计划来，没什么波动' },
    { value: '留神的', label: '留神的', desc: '开始注意每一笔了' },
    { value: '收紧的', label: '收紧的', desc: '得省着花，有点压力' },
    { value: '憋闷的', label: '憋闷的', desc: '喘不过来，很想逃避' }
];

const STEP3_OPTIONS = [
    { value: '我愿意继续', label: '我愿意继续' },
    { value: '我希望调整一点', label: '我希望调整一点' },
    { value: '我不希望继续', label: '我不希望继续' }
];

const lifeMap = {
    '往长远处走': '投资未来',
    '让生活正常运转': '维持生活运转',
    '维系重要关系': '维系重要关系',
    '去看看世界': '探索世界',
    '给自己一点空间': '取悦与疗愈自己',
    '帮我省出时间': '用钱换效率'
};

const stateMap = {
    '在推进未来的我': '在帮「未来的我」成长',
    '在维持生活的我': '在帮「当下的基本运转」',
    '在照顾当下的我': '在帮「此刻的我」喘口气'
};

const willingMap = {
    '我愿意继续': '我愿意让它继续',
    '我希望调整一点': '我想稍微调整一下',
    '我不希望继续': '我不希望它继续'
};

export class MoneyAwarenessModule {
    constructor(modalInstance) {
        this.modal = modalInstance;
        this.currentDate = null;
        this.step = 1;
        this.data = this.createDefaultData();
        this.toastTimer = null;
        this.cleanupOldDraft(); // 清理旧格式草稿
        this.initElements();
        this.bindEvents();
        this.render();
    }

    initElements() {
        this.elements = {
            module: document.getElementById('money-awareness-module'),
            progress: document.getElementById('money-step-progress'),
            content: document.getElementById('money-observation-content'),
            footer: document.getElementById('money-observation-footer')
        };
    }

    bindEvents() {
        if (!this.elements.content || !this.elements.footer) return;

        this.elements.content.addEventListener('click', (event) => this.onContentClick(event));
        this.elements.content.addEventListener('input', (event) => this.onContentInput(event));
        this.elements.footer.addEventListener('click', (event) => this.onFooterClick(event));
    }

    createDefaultData() {
        return {
            step1: [],
            step2: {
                lifeSupport: [],
                selfState: '',
                breathFeeling: ''
            },
            step3: '',
            customText: '',
            summary: ''
        };
    }

    normalizeData(raw = {}) {
        const defaults = this.createDefaultData();
        const step2 = raw.step2 || {};
        return {
            step1: Array.isArray(raw.step1) ? raw.step1.slice(0, 2) : defaults.step1,
            step2: {
                lifeSupport: Array.isArray(step2.lifeSupport) && step2.lifeSupport.length
                    ? step2.lifeSupport.slice(0, 6)
                    : defaults.step2.lifeSupport,
                selfState: step2.selfState || defaults.step2.selfState,
                breathFeeling: step2.breathFeeling || defaults.step2.breathFeeling
            },
            step3: raw.step3 || '',
            customText: (raw.customText || '').slice(0, 80),
            summary: raw.summary || ''
        };
    }

    getDraftKey(date = null) {
        const targetDate = date || this.currentDate;
        if (!targetDate) return BASE_DRAFT_KEY;
        return `${BASE_DRAFT_KEY}_${targetDate}`;
    }

    loadDraft(date = null) {
        try {
            this.currentDate = date || this.currentDate;
            if (!this.currentDate) {
                this.data = this.createDefaultData();
                this.step = 1;
                this.render();
                this.syncToModal();
                return;
            }

            const draft = localStorage.getItem(this.getDraftKey());
            if (!draft) {
                this.data = this.createDefaultData();
                this.step = 1;
                this.render();
                this.syncToModal();
                return;
            }

            const parsed = JSON.parse(draft);
            this.data = this.normalizeData(parsed);
            this.data.summary = this.buildSummary();
            this.step = parsed.step && parsed.step >= 1 && parsed.step <= 3 ? parsed.step : this.getRecommendedStep();
            this.render();
            this.syncToModal();
        } catch (error) {
            console.warn('Failed to load money observation draft:', error);
        }
    }

    saveDraft() {
        try {
            if (!this.currentDate) return;
            const draftData = { 
                ...this.data, 
                step: this.step,
                timestamp: Date.now()
            };
            localStorage.setItem(this.getDraftKey(), JSON.stringify(draftData));
        } catch (error) {
            console.warn('Failed to save money observation draft:', error);
        }
    }

    clearDraft(date = null) {
        try {
            const targetDate = date || this.currentDate;
            if (!targetDate) return;
            localStorage.removeItem(this.getDraftKey(targetDate));
        } catch (error) {
            console.warn('Failed to clear money observation draft:', error);
        }
    }

    hasDraftForDate(date) {
        if (!date) return false;
        return !!localStorage.getItem(this.getDraftKey(date));
    }

    // 清理旧格式的草稿数据，实现向后兼容
    cleanupOldDraft() {
        try {
            const oldDraft = localStorage.getItem(BASE_DRAFT_KEY);
            if (oldDraft) {
                // 如果有旧格式草稿，可以迁移到当前日期，或者直接清理
                localStorage.removeItem(BASE_DRAFT_KEY);
                console.log('Cleaned up old money observation draft format');
            }
        } catch (error) {
            console.warn('Failed to cleanup old money observation draft:', error);
        }
    }

    setData(data = {}, date = null) {
        this.currentDate = date || this.currentDate;
        this.data = this.normalizeData(data);
        this.data.summary = this.buildSummary();
        this.step = this.getRecommendedStep();
        this.render();
        this.syncToModal();
    }

    reset() {
        this.step = 1;
        this.data = this.createDefaultData();
        this.render();
        this.syncToModal();
    }

    getData() {
        return {
            ...this.data,
            step: this.step
        };
    }

    getRecommendedStep() {
        if (!this.data.step1.length) return 1;
        if (!this.data.step3) return 3;
        return 3;
    }

    isNoSpecialFlow() {
        return this.data.step1.length === 1 && this.data.step1[0] === '无特别一笔';
    }

    onContentClick(event) {
        const button = event.target.closest('[data-chip-group]');
        if (!button || button.disabled) return;

        const group = button.dataset.chipGroup;
        const value = button.dataset.chipValue;

        if (group === 'step1') {
            this.toggleStep1(value);
        } else if (group === 'step1-none') {
            this.data.step1 = ['无特别一笔'];
            this.data.step2.lifeSupport = [];
            this.data.step2.selfState = '';
        } else if (group === 'step2-life') {
            this.toggleArrayValue(this.data.step2.lifeSupport, value);
        } else if (group === 'step2-state') {
            this.data.step2.selfState = value;
        } else if (group === 'step2-breath') {
            this.data.step2.breathFeeling = value;
        } else if (group === 'step3-willing') {
            this.data.step3 = value;
        }

        this.data.summary = this.buildSummary();
        this.saveDraft(); // 实时保存
        this.syncToModal();
        this.render();
    }

    onContentInput(event) {
        if (event.target.id !== 'money-custom-text') return;
        this.data.customText = (event.target.value || '').slice(0, 80);
        this.saveDraft();
        this.syncToModal();
        this.updateCustomCount();
    }

    onFooterClick(event) {
        const actionBtn = event.target.closest('[data-action]');
        if (!actionBtn) return;

        const action = actionBtn.dataset.action;

        if (action === 'save-draft') {
            this.saveDraft();
            this.showToast('已保存草稿');
            return;
        }

        if (action === 'next') {
            this.goNext();
            return;
        }
    }

    toggleStep1(value) {
        if (this.isNoSpecialFlow()) {
            this.data.step1 = [];
            // 不再重置为默认值，保持空白状态
        }

        const current = this.data.step1;
        const idx = current.indexOf(value);

        if (idx >= 0) {
            current.splice(idx, 1);
            return;
        }

        if (current.length >= 2) {
            this.showToast('最多选择2项');
            return;
        }

        current.push(value);
    }

    toggleArrayValue(list, value) {
        const idx = list.indexOf(value);
        if (idx >= 0) {
            list.splice(idx, 1);
        } else {
            // 检查是否已达到最大选择数量
            if (list.length >= 2) {
                this.showToast('最多只能选择2项');
                return;
            }
            list.push(value);
        }
    }

    canGoNext() {
        if (this.step === 1) {
            return this.data.step1.length > 0;
        }

        if (this.step === 2) {
            if (!this.data.step2.breathFeeling) return false;
            if (this.isNoSpecialFlow()) return true;
            return this.data.step2.lifeSupport.length > 0 && !!this.data.step2.selfState;
        }

        if (this.step === 3) {
            return !!this.data.step3;
        }

        return false;
    }

    goNext() {
        if (!this.canGoNext()) {
            this.showToast('请先完成当前步骤');
            return;
        }

        if (this.step < 3) {
            this.step += 1;
            this.saveDraft(); // 步骤切换时保存
            this.render();
            
            // 平滑滚动到内容顶部
            setTimeout(() => {
                this.elements.content.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }

    // 统一保存流程：移除completeRecord方法
    // 数据现在由Modal的handleSaveDailyRecord统一处理

    jumpToStep(targetStep) {
        if (targetStep < 1 || targetStep > 3) return;
        if (targetStep === this.step) return;
        
        this.step = targetStep;
        this.saveDraft();
        this.render();
        
        setTimeout(() => {
            this.elements.content.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }

    buildSummary() {
        if (!this.data.step3) return '';

        const willing = willingMap[this.data.step3] || this.data.step3;
        const breathFeeling = this.data.step2.breathFeeling || '平稳的';

        if (this.isNoSpecialFlow()) {
            return `今天没有特别的钱的流动，呼吸感是${breathFeeling}。${willing}。`;
        }

        const primaryLife = lifeMap[this.data.step2.lifeSupport[0]] || '支持生活';
        const state = stateMap[this.data.step2.selfState] || '在支持现在的我';

        return `今天的钱主要在${primaryLife}，${state}。如果成为常态，${willing}。`;
    }

    handleEnter(event) {
        if (!this.elements.module || this.elements.module.contains(event.target) === false) return false;
        if (event.key !== 'Enter') return false;
        if (event.shiftKey) return false;

        event.preventDefault();
        // 统一保存流程：Enter键不再完成记录，用户需要点击Modal的保存按钮
        return true;
    }

    handleEscape() {
        this.saveDraft();
        return true;
    }

    persistAndRender() {
        this.data.summary = this.buildSummary();
        this.saveDraft();
        this.syncToModal();
        this.render();
    }

    syncToModal() {
        if (typeof this.modal?.syncLogStateFromUI === 'function') {
            this.modal.syncLogStateFromUI();
        }
    }

    showToast(message) {
        if (!this.elements.module) return;

        const existing = this.elements.module.querySelector('#money-observation-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'money-observation-toast';
        toast.className = 'absolute right-4 bottom-4 z-20 rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg';
        toast.textContent = message;

        this.elements.module.style.position = 'relative';
        this.elements.module.appendChild(toast);

        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => toast.remove(), 1400);
    }

    render() {
        if (!this.elements.module || !this.elements.content || !this.elements.footer || !this.elements.progress) return;
        
        // Show loading state briefly for better UX
        if (!this._initialized) {
            this.elements.content.innerHTML = this.renderLoadingState();
            this._initialized = true;
            setTimeout(() => {
                this.renderProgress();
                this.renderStepContent();
                this.renderFooter();
            }, 100);
            return;
        }
        
        this.renderProgress();
        this.renderStepContent();
        this.renderFooter();
    }

    renderProgress() {
        const bars = [1, 2, 3].map((n) => {
            const active = n <= this.step;
            const current = n === this.step;
            return `
                <div class="relative flex-1">
                    <div class="h-1.5 flex-1 rounded-full transition-all duration-300 ease-out ${
                        active 
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm' 
                            : 'bg-gray-200'
                    } ${current ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-amber-50 rounded-full' : ''}"></div>
                    ${current ? '<div class="absolute -top-1 left-0 w-3 h-3 bg-amber-500 rounded-full shadow-md animate-pulse"></div>' : ''}
                </div>
            `;
        }).join('');

        this.elements.progress.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center gap-2">${bars}</div>
                <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-gray-700">第 ${this.step}/3 步</p>
                    <div class="flex gap-1">
                        ${[1, 2, 3].map(n => `
                            <div class="w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                                n <= this.step ? 'bg-amber-500' : 'bg-gray-300'
                            }"></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // 更新步骤按钮状态
        this.updateStepButtons();
    }

    updateStepButtons() {
        document.querySelectorAll('.step-nav-btn').forEach(btn => {
            const step = parseInt(btn.dataset.step);
            const isActive = step === this.step;
            const isCompleted = step < this.step;
            
            // 移除所有状态类
            btn.classList.remove('active', 'completed', 'bg-amber-500', 'text-gray-800', 'border-amber-500', 'bg-amber-100', 'border-amber-300');
            btn.classList.add('bg-white/90', 'border-amber-200');
            
            if (isActive) {
                // 激活状态
                btn.classList.add('active', 'bg-amber-500', 'text-gray-800', 'border-amber-500');
                btn.classList.remove('bg-white/90', 'border-amber-200');
            } else if (isCompleted) {
                // 完成状态
                btn.classList.add('completed', 'bg-amber-100', 'border-amber-300');
            }
            
            // 更新可访问性属性
            btn.setAttribute('aria-current', isActive ? 'step' : 'false');
        });
    }

    renderStepContent() {
        if (this.step === 1) {
            this.elements.content.innerHTML = this.renderStep1();
        } else if (this.step === 2) {
            this.elements.content.innerHTML = this.renderStep2();
        } else {
            this.elements.content.innerHTML = this.renderStep3();
            this.updateCustomCount();
        }
    }

    renderFooter() {
        const primaryDisabled = !this.canGoNext();
        const isLastStep = this.step === 3;
        
        this.elements.footer.innerHTML = `
            <div class="flex items-center gap-3">
                <button 
                    type="button" 
                    data-action="save-draft" 
                    class="group relative h-12 min-w-[44px] px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-all duration-200 ease-out overflow-hidden"
                    aria-label="保存当前填写的内容为草稿，稍后可继续编辑"
                >
                    <span class="relative z-10 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"></path>
                        </svg>
                        <span>保存草稿</span>
                    </span>
                    <div class="absolute inset-0 bg-gradient-to-r from-amber-50 to-amber-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
                
                ${!isLastStep ? `
                    <button 
                        type="button" 
                        data-action="next" 
                        class="group relative h-12 min-w-[44px] px-6 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-400 to-amber-500 text-sm font-semibold text-white shadow-lg hover:from-amber-500 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-all duration-200 ease-out overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 disabled:border-gray-300"
                        ${primaryDisabled ? 'disabled' : ''}
                        aria-label="进入下一步"
                    >
                        <span class="relative z-10 flex items-center gap-2">
                            <span>下一步</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                            </svg>
                        </span>
                        <div class="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${primaryDisabled ? 'hidden' : ''}"></div>
                    </button>
                ` : ''}
                
                ${isLastStep ? `
                    <div class="flex-1 text-center">
                        <p class="text-sm text-gray-500">
                            ${primaryDisabled 
                                ? '请完成当前步骤' 
                                : '已完成所有步骤，请保存记录'
                            }
                        </p>
                    </div>
                ` : ''}
            </div>`;
    }

    renderStep1() {
        return `
            <section class="space-y-6">
                <div class="space-y-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">1</div>
                        <h5 class="text-lg font-semibold text-gray-900">看见一笔钱</h5>
                    </div>
                    <p class="text-sm text-gray-600 pl-10">今天最值得记的一笔钱，是怎么动的？</p>
                    <p class="text-xs text-gray-500 pl-10">最多选择2项</p>
                </div>
                <div class="space-y-3">
                    ${STEP1_OPTIONS.map((item, index) => this.renderChip({
                        group: 'step1',
                        value: item.value,
                        label: item.label,
                        desc: item.desc,
                        selected: this.data.step1.includes(item.value),
                        index: index + 1
                    })).join('')}
                </div>
                <div class="pt-4 border-t border-gray-100">
                    ${this.renderChip({
                        group: 'step1-none',
                        value: '无特别一笔',
                        label: '今天没有特别的一笔',
                        desc: '将直接进入下一步并简化分析问题',
                        selected: this.isNoSpecialFlow(),
                        isSpecial: true
                    })}
                </div>
            </section>
        `;
    }

    renderStep2() {
        const disabled = this.isNoSpecialFlow();

        return `
            <section class="space-y-6">
                <div class="space-y-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">2</div>
                        <h5 class="text-lg font-semibold text-gray-900">看懂它去了哪里</h5>
                    </div>
                    <p class="text-sm text-gray-600 pl-10">回顾刚才记录的那笔钱，它到底支持了什么生活，帮了哪种状态的你？</p>
                </div>

                <div class="space-y-4">
                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-medium">A</div>
                            <h6 class="text-base font-medium text-gray-800">钱支持的生活用途</h6>
                            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">（最多选择 2 项，请选出今天最有代表性的投入方向）</span>
                        </div>
                        <div class="pl-8 space-y-2">
                            ${STEP2_LIFE_SUPPORT_OPTIONS.map((item, index) => this.renderChip({
                                group: 'step2-life',
                                value: item.value,
                                label: item.label,
                                desc: item.desc,
                                selected: this.data.step2.lifeSupport.includes(item.value),
                                disabled,
                                index: index + 1,
                                variant: 'life'
                            })).join('')}
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium">B</div>
                            <h6 class="text-base font-medium text-gray-800">今天这笔钱，更像在帮哪个状态的我？</h6>
                            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">单选</span>
                        </div>
                        <div class="pl-8 space-y-2">
                            ${STEP2_SELF_STATE_OPTIONS.map((item, index) => this.renderChip({
                                group: 'step2-state',
                                value: item.value,
                                label: item.label,
                                desc: item.desc,
                                selected: this.data.step2.selfState === item.value,
                                disabled,
                                index: index + 1,
                                variant: 'state'
                            })).join('')}
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-medium">C</div>
                            <h6 class="text-base font-medium text-gray-800">今天我和钱的关系，呼吸感是——</h6>
                            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">单选</span>
                        </div>
                        <div class="pl-8 space-y-2">
                            ${STEP2_BREATH_OPTIONS.map((item, index) => this.renderChip({
                                group: 'step2-breath',
                                value: item.value,
                                label: item.label,
                                desc: item.desc,
                                selected: this.data.step2.breathFeeling === item.value,
                                index: index + 1,
                                variant: 'breath'
                            })).join('')}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    renderStep3() {
        return `
            <section class="space-y-6">
                <div class="space-y-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">3</div>
                        <h5 class="text-lg font-semibold text-gray-900">看清它改变了什么</h5>
                    </div>
                    <p class="text-sm text-gray-600 pl-10">如果这种用钱方式变成常态，我愿意继续吗？</p>
                </div>

                <div class="space-y-3">
                    ${STEP3_OPTIONS.map((item, index) => this.renderChip({
                        group: 'step3-willing',
                        value: item.value,
                        label: item.label,
                        desc: '',
                        selected: this.data.step3 === item.value,
                        index: index + 1,
                        variant: 'willing'
                    })).join('')}
                </div>

                ${this.data.summary ? `
                    <div class="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-900 mb-1">今日觉察总结</p>
                                <p class="text-sm text-gray-700 leading-relaxed">${this.escapeHtml(this.data.summary)}</p>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="space-y-2">
                    <label for="money-custom-text" class="block text-sm font-medium text-gray-700">
                        补充说明 <span class="text-xs text-gray-500 font-normal">(可选)</span>
                    </label>
                    <textarea 
                        id="money-custom-text" 
                        maxlength="80" 
                        rows="3" 
                        class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none transition-all duration-200" 
                        placeholder="今天的钱，更像在帮我……"
                        aria-describedby="money-custom-count"
                    >${this.escapeHtml(this.data.customText)}</textarea>
                    <div class="flex items-center justify-between">
                        <p id="money-custom-count" class="text-xs text-gray-500">0/80</p>
                        <div class="flex gap-1">
                            ${Array.from({length: 4}, (_, i) => i < Math.ceil(this.data.customText.length / 20) 
                                ? '<div class="w-1 h-1 bg-amber-400 rounded-full"></div>' 
                                : '<div class="w-1 h-1 bg-gray-300 rounded-full"></div>'
                            ).join('')}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    updateCustomCount() {
        const counter = this.elements.content.querySelector('#money-custom-count');
        const input = this.elements.content.querySelector('#money-custom-text');
        if (!counter || !input) return;
        counter.textContent = `${input.value.length}/80`;
    }

    renderChip({ group, value, label, desc, selected, disabled = false, index = null, variant = 'default', isSpecial = false }) {
        const baseClass = 'w-full min-h-[48px] rounded-xl border text-left px-4 py-3 transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2';
        
        // 检查是否为生活用途选项且已达到最大选择数量
        const isLifeSupport = group === 'step2-life';
        const hasReachedMax = isLifeSupport && this.data.step2.lifeSupport.length >= 2;
        const isDisabledByLimit = isLifeSupport && hasReachedMax && !selected;
        
        // Variant-specific styling
        const variantStyles = {
            life: {
                selected: 'border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100 text-gray-800 shadow-sm',
                hover: 'border-amber-300 bg-amber-50 text-gray-700 hover:shadow-md',
                default: 'border-gray-200 bg-white text-gray-700 hover:border-amber-200 hover:bg-gray-50',
                disabled: 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
            },
            state: {
                selected: 'border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800 shadow-sm',
                hover: 'border-blue-300 bg-blue-50 text-gray-700 hover:shadow-md',
                default: 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-gray-50'
            },
            breath: {
                selected: 'border-green-400 bg-gradient-to-r from-green-50 to-green-100 text-gray-800 shadow-sm',
                hover: 'border-green-300 bg-green-50 text-gray-700 hover:shadow-md',
                default: 'border-gray-200 bg-white text-gray-700 hover:border-green-200 hover:bg-gray-50'
            },
            willing: {
                selected: 'border-purple-400 bg-gradient-to-r from-purple-50 to-purple-100 text-gray-800 shadow-sm',
                hover: 'border-purple-300 bg-purple-50 text-gray-700 hover:shadow-md',
                default: 'border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-gray-50'
            },
            default: {
                selected: 'border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100 text-gray-800 shadow-sm',
                hover: 'border-amber-300 bg-amber-50 text-gray-700 hover:shadow-md',
                default: 'border-gray-200 bg-white text-gray-700 hover:border-amber-200 hover:bg-gray-50'
            }
        };

        const style = variantStyles[variant] || variantStyles.default;
        
        const isActuallyDisabled = disabled || isDisabledByLimit;
        
        const stateClass = isActuallyDisabled
            ? (variantStyles[variant]?.disabled || 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60')
            : (selected
                ? style.selected
                : style.default);

        const focusClass = isActuallyDisabled ? '' : 'focus:ring-amber-400';
        
        // Icon for different variants
        const getIcon = () => {
            if (isSpecial) {
                return selected 
                    ? '<svg class="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
                    : '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"></circle></svg>';
            }
            // 所有呼吸感选项都使用统一的圆形边框样式
            if (variant === 'breath') {
                return selected 
                    ? '<svg class="w-5 h-5 text-current" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
                    : '<div class="w-5 h-5 rounded-full border-2 border-gray-300"></div>';
            }
            return selected 
                ? '<svg class="w-5 h-5 text-current" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
                : '<div class="w-5 h-5 rounded-full border-2 border-gray-300"></div>';
        };

        return `
            <button
                type="button"
                data-chip-group="${group}"
                data-chip-value="${value}"
                ${isActuallyDisabled ? 'disabled' : ''}
                class="${baseClass} ${stateClass} ${focusClass} group relative overflow-hidden"
                aria-pressed="${selected}"
                aria-label="${label}${desc ? ': ' + desc : ''}"
            >
                <span class="flex items-start justify-between gap-3">
                    <span class="flex-1 min-w-0">
                        <span class="block text-sm font-medium leading-5">${label}</span>
                        ${desc ? '<span class="block text-xs mt-1 ' + (disabled ? 'text-gray-400' : 'text-gray-500') + ' leading-4">' + desc + '</span>' : ''}
                    </span>
                    <span class="flex-shrink-0 mt-0.5 transition-all duration-200 ${
                        selected ? 'opacity-100 scale-100' : 'opacity-40 scale-90 group-hover:opacity-60'
                    }" aria-hidden="true">
                        ${getIcon()}
                    </span>
                </span>
                ${selected && !disabled ? '<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>' : ''}
            </button>
        `;
    }

    renderLoadingState() {
        return `
            <div class="flex flex-col items-center justify-center py-12 space-y-4">
                <div class="relative">
                    <div class="w-12 h-12 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin"></div>
                    <div class="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-amber-400 animate-pulse"></div>
                </div>
                <div class="text-center space-y-2">
                    <p class="text-sm font-medium text-gray-700">正在加载金钱觉察模块</p>
                    <p class="text-xs text-gray-500">请稍候...</p>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="flex flex-col items-center justify-center py-12 space-y-4">
                <div class="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="text-center space-y-2">
                    <p class="text-sm font-medium text-gray-700">开始今日金钱觉察</p>
                    <p class="text-xs text-gray-500">记录今天的金钱流动，看见生活的支持</p>
                </div>
            </div>
        `;
    }

    escapeHtml(value = '') {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
}
