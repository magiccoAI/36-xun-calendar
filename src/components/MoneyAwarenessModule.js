const DRAFT_KEY = 'moneyObservationDraft';

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
    { value: '舒展的', label: '😌 舒展的', desc: '花钱不紧张，还有余裕' },
    { value: '平稳的', label: '😊 平稳的', desc: '按计划来，没什么波动' },
    { value: '留神的', label: '😐 留神的', desc: '开始注意每一笔了' },
    { value: '收紧的', label: '😟 收紧的', desc: '得省着花，有点压力' },
    { value: '憋闷的', label: '😣 憋闷的', desc: '喘不过来，很想逃避' }
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
        this.step = 1;
        this.data = this.createDefaultData();
        this.toastTimer = null;
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
                lifeSupport: ['让生活正常运转'],
                selfState: '在维持生活的我',
                breathFeeling: '平稳的'
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

    loadDraft() {
        try {
            const draft = localStorage.getItem(DRAFT_KEY);
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
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...this.data, step: this.step }));
        } catch (error) {
            console.warn('Failed to save money observation draft:', error);
        }
    }

    clearDraft() {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch (error) {
            console.warn('Failed to clear money observation draft:', error);
        }
    }

    setData(data = {}) {
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
        this.persistAndRender();
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

        if (action === 'prev' && this.step > 1) {
            this.step -= 1;
            this.render();
            return;
        }

        if (action === 'next') {
            this.goNext();
            return;
        }

        if (action === 'complete') {
            this.completeRecord();
        }
    }

    toggleStep1(value) {
        if (this.isNoSpecialFlow()) {
            this.data.step1 = [];
            this.data.step2.lifeSupport = ['让生活正常运转'];
            this.data.step2.selfState = '在维持生活的我';
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
            this.render();
        }
    }

    completeRecord() {
        if (!this.canGoNext()) {
            this.showToast('请先完成记录');
            return;
        }

        this.data.summary = this.buildSummary();
        this.syncToModal();

        if (typeof this.modal?.onSubmit === 'function') {
            this.modal.onSubmit(this.getData());
        }

        this.clearDraft();
        this.showToast('已记录今日金钱观察');

        if (typeof this.modal?.close === 'function') {
            this.modal.close();
        }
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
        if (this.step === 3) {
            this.completeRecord();
        } else {
            this.goNext();
        }
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
        this.renderProgress();
        this.renderStepContent();
        this.renderFooter();
    }

    renderProgress() {
        const bars = [1, 2, 3].map((n) => {
            const active = n <= this.step;
            return `<div class="h-2 flex-1 rounded-full ${active ? 'bg-amber-400' : 'bg-white border border-amber-100'}"></div>`;
        }).join('');

        this.elements.progress.innerHTML = `<div class="flex items-center gap-2">${bars}</div><p class="text-[12px] text-gray-500 mt-2">第 ${this.step}/3 步</p>`;
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
        if (this.step === 1) {
            this.elements.footer.innerHTML = `
                <div class="flex items-center gap-3">
                    <button type="button" data-action="save-draft" class="h-11 min-w-[44px] px-3 rounded-xl border border-amber-200 bg-white text-sm text-gray-600 hover:bg-amber-50 transition duration-200 ease-out">先保存草稿</button>
                    <button type="button" data-action="next" ${primaryDisabled ? 'disabled' : ''} class="h-11 min-w-[44px] flex-1 rounded-xl text-sm text-white ${primaryDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'} transition duration-200 ease-out">下一步</button>
                </div>`;
            return;
        }

        this.elements.footer.innerHTML = `
            <div class="flex items-center gap-3">
                <button type="button" data-action="prev" class="h-11 min-w-[44px] px-4 rounded-xl border border-amber-200 bg-white text-sm text-gray-600 hover:bg-amber-50 transition duration-200 ease-out">上一步</button>
                <button type="button" data-action="${this.step === 3 ? 'complete' : 'next'}" ${primaryDisabled ? 'disabled' : ''} class="h-11 min-w-[44px] flex-1 rounded-xl text-sm text-white ${primaryDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'} transition duration-200 ease-out">${this.step === 3 ? '完成记录' : '下一步'}</button>
            </div>`;
    }

    renderStep1() {
        return `
            <section class="space-y-4">
                <div>
                    <h5 class="text-[15px] font-semibold text-gray-800">STEP 1 看见一笔钱</h5>
                    <p class="text-sm text-gray-500 mt-1">今天最值得记的一笔钱，是怎么动的？（最多选2项）</p>
                </div>
                <div class="space-y-3">
                    ${STEP1_OPTIONS.map((item) => this.renderChip({
                        group: 'step1',
                        value: item.value,
                        label: item.label,
                        desc: item.desc,
                        selected: this.data.step1.includes(item.value)
                    })).join('')}
                </div>
                <div class="pt-1">
                    ${this.renderChip({
                        group: 'step1-none',
                        value: '无特别一笔',
                        label: '今天没有特别的一笔',
                        desc: '将直接进入下一步并简化分析问题',
                        selected: this.isNoSpecialFlow()
                    })}
                </div>
            </section>
        `;
    }

    renderStep2() {
        const disabled = this.isNoSpecialFlow();

        return `
            <section class="space-y-4">
                <div>
                    <h5 class="text-[15px] font-semibold text-gray-800">STEP 2 看懂它去了哪里</h5>
                    <p class="text-sm text-gray-500 mt-1">回顾刚才记录的那笔钱，它到底支持了什么生活，帮了哪种状态的你？</p>
                </div>

                <div class="space-y-3">
                    <h6 class="text-sm font-medium text-gray-700">钱支持的生活用途（多选）</h6>
                    <div class="space-y-3 mt-1">
                        ${STEP2_LIFE_SUPPORT_OPTIONS.map((item) => this.renderChip({
                            group: 'step2-life',
                            value: item.value,
                            label: item.label,
                            desc: item.desc,
                            selected: this.data.step2.lifeSupport.includes(item.value),
                            disabled
                        })).join('')}
                    </div>
                </div>

                <div class="space-y-3">
                    <h6 class="text-sm font-medium text-gray-700">今天这笔钱，更像在帮哪个状态的我？</h6>
                    <div class="space-y-3 mt-1">
                        ${STEP2_SELF_STATE_OPTIONS.map((item) => this.renderChip({
                            group: 'step2-state',
                            value: item.value,
                            label: item.label,
                            desc: item.desc,
                            selected: this.data.step2.selfState === item.value,
                            disabled
                        })).join('')}
                    </div>
                </div>

                <div class="space-y-3">
                    <h6 class="text-sm font-medium text-gray-700">今天我和钱的关系，呼吸感是——</h6>
                    <div class="space-y-3 mt-1">
                        ${STEP2_BREATH_OPTIONS.map((item) => this.renderChip({
                            group: 'step2-breath',
                            value: item.value,
                            label: item.label,
                            desc: item.desc,
                            selected: this.data.step2.breathFeeling === item.value
                        })).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    renderStep3() {
        return `
            <section class="space-y-4">
                <div>
                    <h5 class="text-[15px] font-semibold text-gray-800">STEP 3 看清它改变了什么</h5>
                    <p class="text-sm text-gray-500 mt-1">如果这种用钱方式变成常态，我愿意继续吗？</p>
                </div>

                <div class="space-y-3">
                    ${STEP3_OPTIONS.map((item) => this.renderChip({
                        group: 'step3-willing',
                        value: item.value,
                        label: item.label,
                        desc: '',
                        selected: this.data.step3 === item.value
                    })).join('')}
                </div>

                ${this.data.summary ? `<div class="rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm text-gray-700">${this.data.summary}</div>` : ''}

                <div>
                    <textarea id="money-custom-text" maxlength="80" rows="2" class="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none" placeholder="今天的钱，更像在帮我……">${this.escapeHtml(this.data.customText)}</textarea>
                    <p id="money-custom-count" class="text-xs text-gray-500 mt-1 text-right">0/80</p>
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

    renderChip({ group, value, label, desc, selected, disabled = false }) {
        const baseClass = 'w-full min-h-[44px] rounded-xl border text-left px-3 py-2 transition duration-200 ease-out';
        const stateClass = disabled
            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
            : (selected
                ? 'border-amber-400 bg-amber-50 text-gray-800 shadow-sm'
                : 'border-amber-100 bg-white text-gray-700 hover:bg-amber-50 hover:border-amber-200');

        return `
            <button
                type="button"
                data-chip-group="${group}"
                data-chip-value="${value}"
                ${disabled ? 'disabled' : ''}
                class="${baseClass} ${stateClass}">
                <span class="flex items-start justify-between gap-3">
                    <span>
                        <span class="block text-sm font-medium">${label}</span>
                        ${desc ? `<span class="block text-xs mt-1 ${disabled ? 'text-gray-400' : 'text-gray-500'}">${desc}</span>` : ''}
                    </span>
                    <span class="text-sm ${selected ? 'opacity-100' : 'opacity-0'}" aria-hidden="true">✓</span>
                </span>
            </button>
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
