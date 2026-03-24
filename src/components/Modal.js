
import { store } from '../core/State.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG, DATA_VALIDATION_RULES, DAY_RECORD_SCHEMA } from '../config.js';
import { CompleteSleepModule } from './CompleteSleepModule.js';
import { BodyStateSelector } from './BodyStateSelector.js';

export class Modal {
    constructor(modalId, onSave) {
        this.modal = document.getElementById(modalId);
        this.panel = document.getElementById('modal-panel');
        this.onSave = onSave;
        this.currentDateStr = null;
        this.sleepSelector = null;
        this.bodyStateSelector = null;
        this.currentTab = 'checkin';
        this.currentBodyCondition = null;
        this.currentMoneyState = {
            money_feeling: null,
            money_saving: null,
            money_impulse: null,
            money_note: ''
        };
        this.moneyWisdomQuotes = [
            '“真正的财富是你不必花掉的钱，它换来了选择权。”',
            '“用金钱购买时间，是把注意力还给真正重要的事。”',
            '“储蓄不是克制快乐，而是为未来保留自由。”',
            '“如果花费让你更专注、更健康，它可能是在增值而非消耗。”',
            '“长期主义的每一笔投入，都在悄悄降低未来焦虑。”',
            '“财富不仅是收入，更是你与欲望之间的距离。”',
            '“钱是工具，不是身份；掌控感比数字更重要。”'
        ];
        this.modalState = {
            status: {},
            log: {}
        };
        this.hasCheckinData = false;
        this.isHydrating = false;
        this.softPromptVisible = false;
        this.autoProgressionTimer = null;
        this.previouslyFocusedElement = null;
        this.saveFeedbackTimer = null;
        
        this.initElements();
        this.initListeners();
    }

    initElements() {
        this.elements = {
            dateTitle: document.getElementById('modal-date'),
            closeBtn: document.getElementById('modal-close'),
            tabButtons: document.querySelectorAll('.modal-tab-btn'),
            tabPages: document.querySelectorAll('.modal-tab-page'),
            softTransitionPrompt: document.getElementById('soft-transition-prompt'),
            softTransitionCta: document.getElementById('soft-transition-cta'),
            moodBtns: document.querySelectorAll('.mood-btn'),
            emotionTags: document.getElementById('emotion-tags'),
            keywordsInput: document.getElementById('keywords-input'),
            habitInputs: [
                document.getElementById('day-indicator-input-1'),
                document.getElementById('day-indicator-input-2'),
                document.getElementById('day-indicator-input-3')
            ],
            habitCheckContainer: document.getElementById('day-indicator-container'),
            habitChecks: [
                document.getElementById('day-indicator-check-1'),
                document.getElementById('day-indicator-check-2'),
                document.getElementById('day-indicator-check-3')
            ],
            weatherBtns: document.querySelectorAll('#weather-selector button'),
            bodyStateSelectorContainer: document.getElementById('body-state-selector'),
            nourishmentTags: document.getElementById('nourishment-tags-container'),
            bodyConditionBtns: document.querySelectorAll('.body-condition-btn'),
            bodyConditionNote: document.getElementById('body-condition-note'),
            sleepSelectorContainer: document.getElementById('sleep-selector-container'),
            metrics: {
                // sleep: document.getElementById('metric-sleep'), // 已替换为睡眠滑块
                exercise: document.getElementById('metric-exercise'),
                reading: document.getElementById('metric-reading'),
                social: document.getElementById('metric-social')
            },
            moneyStateButtons: document.querySelectorAll('.money-state-button'),
            moneyNote: document.getElementById('money-note'),
            moneyQuote: document.getElementById('money-quote'),
            goodThings: [
                document.getElementById('good-thing-1'),
                document.getElementById('good-thing-2'),
                document.getElementById('good-thing-3')
            ],
            customActivitiesContainer: document.getElementById('custom-activities-container'),
            addActivityBtn: document.getElementById('add-custom-activity'),
            journalInput: document.getElementById('journal-input'),
            cancelBtn: document.getElementById('cancelBtn'),
            deleteBtn: document.getElementById('modal-delete'),
            saveBtn: document.getElementById('saveDailyRecordBtn'),
            saveFeedback: document.getElementById('modal-save-feedback'),
            autoProgressToast: document.getElementById('auto-progress-toast'),
            autoProgressCancelBtn: document.getElementById('auto-progress-cancel')
        };
    }

    initListeners() {
        this.elements.closeBtn.onclick = () => this.close();
        this.modal.onclick = (e) => {
            if (e.target === this.modal) this.close();
        };
        this.handleKeydown = this.handleKeydown.bind(this);

        // Mood Buttons
        this.elements.moodBtns.forEach(btn => {
            btn.onclick = () => {
                this.elements.moodBtns.forEach(b => {
                    b.classList.remove('bg-white/80', 'ring-2', 'ring-blue-300/60', 'shadow-lg');
                    const emojiSpan = b.querySelector('span');
                    if (emojiSpan) {
                        emojiSpan.classList.add('grayscale');
                        emojiSpan.classList.remove('grayscale-0');
                    }
                });
                btn.classList.add('bg-white/80', 'ring-2', 'ring-blue-300/60', 'shadow-lg');
                const emojiSpan = btn.querySelector('span');
                if (emojiSpan) {
                    emojiSpan.classList.remove('grayscale');
                    emojiSpan.classList.add('grayscale-0');
                }
                this.currentMood = parseInt(btn.dataset.mood);
                this.onCheckinInteraction('mood');
                this.syncStatusStateFromUI();
            };
        });

        // Weather Buttons
        this.elements.weatherBtns.forEach(btn => {
            btn.onclick = () => {
                this.elements.weatherBtns.forEach(b => b.classList.remove('bg-white/80', 'ring-2', 'ring-blue-300/60', 'shadow-lg'));
                btn.classList.add('bg-white/80', 'ring-2', 'ring-blue-300/60', 'shadow-lg');
                this.currentWeather = btn.dataset.weather;
                this.syncStatusStateFromUI();
            };
        });

        this.elements.tabButtons.forEach(btn => {
            btn.onclick = () => this.switchTab(btn.dataset.tab);
        });


        this.elements.bodyConditionBtns.forEach(btn => {
            btn.onclick = () => this.selectBodyCondition(btn.dataset.condition);
        });

        this.elements.moneyStateButtons.forEach(btn => {
            btn.onclick = () => this.selectMoneyState(btn.dataset.moneyGroup, btn.dataset.moneyValue);
        });

        if (this.elements.moneyNote) {
            this.elements.moneyNote.addEventListener('input', () => {
                this.currentMoneyState.money_note = this.elements.moneyNote.value.slice(0, 120);
                this.syncLogStateFromUI();
            });
        }

        if (this.elements.bodyConditionNote) {
            this.elements.bodyConditionNote.oninput = () => {
                this.onCheckinInteraction('vitality');
                this.syncStatusStateFromUI();
            };
        }

        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.onclick = () => this.close();
        }

        // Save Button
        this.elements.saveBtn.addEventListener('click', this.handleSaveDailyRecord.bind(this));

        // Delete Button
        this.elements.deleteBtn.onclick = () => this.delete();
        
        // Add Activity
        this.elements.addActivityBtn.onclick = () => this.addCustomActivityInput();

        if (this.elements.softTransitionCta) {
            this.elements.softTransitionCta.onclick = () => {
                this.switchTab('record');
                this.scrollToTopOfRecordTab();
            };
        }

        if (this.elements.autoProgressCancelBtn) {
            this.elements.autoProgressCancelBtn.onclick = () => {
                this.autoProgressCancelled = true;
                this.clearAutoProgressionTimer();
                this.hideAutoProgressToast();
            };
        }

        this.bindRealtimeStateUpdates();
    }

    bindRealtimeStateUpdates() {
        if (this.elements.keywordsInput) this.elements.keywordsInput.addEventListener('input', () => this.syncLogStateFromUI());
        if (this.elements.journalInput) this.elements.journalInput.addEventListener('input', () => this.syncLogStateFromUI());
        this.elements.habitInputs.forEach(input => input && input.addEventListener('input', () => this.syncLogStateFromUI()));
        this.elements.habitChecks.forEach(input => input && input.addEventListener('change', () => this.syncLogStateFromUI()));
        Object.values(this.elements.metrics).forEach(input => input && input.addEventListener('input', () => this.syncLogStateFromUI()));
        this.elements.goodThings.forEach(input => input && input.addEventListener('input', () => this.syncLogStateFromUI()));
    }

    clearAutoProgressionTimer() {
        if (!this.autoProgressionTimer) return;
        clearTimeout(this.autoProgressionTimer);
        this.autoProgressionTimer = null;
    }

    hideAutoProgressToast() {
        if (!this.elements.autoProgressToast) return;
        this.elements.autoProgressToast.classList.add('hidden');
        this.elements.autoProgressToast.classList.remove('flex');
    }

    getDayOfWeek(dateStr) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return days[date.getDay()];
    }

    open(dateStr, xunIndex) {
        this.currentDateStr = dateStr;
        this.currentXunIndex = xunIndex;
        const dayOfWeek = this.getDayOfWeek(dateStr);
        this.elements.dateTitle.innerHTML = `${dateStr} <span class="text-sm text-gray-500">${dayOfWeek}</span>`;
        
        const state = store.getState();
        const fallbackData = state.userData[dateStr] || {};
        this.loadDailyRecord(dateStr, fallbackData);
        const data = { ...this.modalState.status, ...this.modalState.log };
        const macroGoal = state.macroGoals[xunIndex] || {};

        console.log('Modal open:', dateStr, 'sleepData:', data.sleepData);

        // Reset UI
        this.resetUI();
        this.switchTab('checkin');
        this.isHydrating = true;
        this.hideSoftTransitionPrompt();

        // Populate Data
        // Mood 默认保持空状态，用户需主动选择（不做预填）

        // Emotions
        this.renderEmotionTags(data.emotions || []);

        // Keywords
        this.elements.keywordsInput.value = (data.keywords || []).join(', ');

        // Habits
        const dailyHabits = data.checkin_texts || [];
        const macroHabits = macroGoal.indicators || [];
        
        this.elements.habitInputs.forEach((input, i) => {
            // Use daily text if available, otherwise fallback to macro goal (carry-forward)
            input.value = dailyHabits[i] !== undefined ? dailyHabits[i] : (macroHabits[i] || '');
            
            // Checkbox state
            const checked = data.indicator_checkins && data.indicator_checkins[i];
            this.elements.habitChecks[i].checked = !!checked;
            
            // Show/Hide rows based on definition? 
            // Current logic shows all 3 rows.
        });

        // Weather
        if (data.weather) {
            const btn = document.querySelector(`#weather-selector button[data-weather="${data.weather}"]`);
            if (btn) btn.click();
        }

        // Nourishment
        this.renderNourishmentTags(data.nourishments || []);
        
        // Metrics
        if (data.metrics) {
            // this.elements.metrics.sleep.value = data.metrics.sleep || ''; // 已替换为睡眠滑块
            if (this.elements.metrics.exercise) this.elements.metrics.exercise.value = data.metrics.exercise || '';
            if (this.elements.metrics.reading) this.elements.metrics.reading.value = data.metrics.reading || '';
            if (this.elements.metrics.social) this.elements.metrics.social.value = data.metrics.social || '';
        }

        this.hydrateMoneyState(data);
        
        this.initSleepSelector(data.sleepData || {});
        this.initBodyStateSelector(data.body_state || null);
        this.setBodyCondition(data.body_condition || null);

        // Good Things
        if (data.three_good_things) {
            this.elements.goodThings.forEach((input, i) => {
                input.value = data.three_good_things[i] || '';
            });
        }

        // Custom Activities
        const activities = data.custom_activities || [];
        // Clear old custom inputs (except the "add" button container which is handled by render)
        // Actually we need to re-render existing ones
        const container = this.elements.customActivitiesContainer;
        // Remove all activity-row
        container.querySelectorAll('.activity-row').forEach(e => e.remove());
        
        activities.forEach(act => this.addCustomActivityInput(act.name, act.value));

        // Journal
        this.elements.journalInput.value = data.journal || '';

        this.syncStatusStateFromUI();
        this.syncLogStateFromUI();

        this.isHydrating = false;
        this.autoProgressCancelled = false;
        this.clearAutoProgressionTimer();
        this.hideAutoProgressToast();
        this.updateTabStatusIndicators();

        // Show Modal
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        this.previouslyFocusedElement = document.activeElement;
        requestAnimationFrame(() => {
            this.panel.classList.remove('scale-95');
            this.panel.classList.add('scale-100');
            this.panel.focus();
        });
        document.addEventListener('keydown', this.handleKeydown);
        this.syncStatusStateFromUI();
    }

    close() {
        if (this.modal.classList.contains('hidden')) return;

        document.removeEventListener('keydown', this.handleKeydown);
        this.resetSaveFeedback();
        this.clearAutoProgressionTimer();
        this.hideAutoProgressToast();
        this.panel.classList.remove('scale-100');
        this.panel.classList.add('scale-95');

        let closed = false;
        const handleTransitionEnd = (event) => {
            if (closed) return;
            if (event && event.target !== this.panel) return;
            closed = true;
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
            this.panel.removeEventListener('transitionend', handleTransitionEnd);
            if (this.previouslyFocusedElement && typeof this.previouslyFocusedElement.focus === 'function') {
                this.previouslyFocusedElement.focus();
            }
        };

        this.panel.addEventListener('transitionend', handleTransitionEnd);
        // Fallback: in some environments transitionend does not fire reliably.
        setTimeout(() => handleTransitionEnd(), 320);
    }


    closeWithAutoSave() {
        this.handleSaveDailyRecord();
    }

    resetUI() {
        this.elements.moodBtns.forEach(b => b.classList.remove('bg-white/80', 'ring-2', 'ring-blue-300/60', 'shadow-lg'));
        this.currentMood = null;
        this.currentWeather = null;
        this.elements.weatherBtns.forEach(b => b.classList.remove('bg-white/80', 'ring-2', 'ring-blue-300/60', 'shadow-lg'));
        this.elements.keywordsInput.value = '';
        this.elements.bodyConditionNote.value = '';
        this.currentBodyCondition = null;
        this.currentMoneyState = {
            money_feeling: null,
            money_saving: null,
            money_impulse: null,
            money_note: ''
        };
        this.modalState = {
            status: {},
            log: {}
        };
        this.hasCheckinData = false;
        this.isHydrating = false;
        this.softPromptVisible = false;
        this.elements.bodyConditionBtns.forEach(btn => {
            btn.classList.remove('ring-2', 'ring-offset-1',
                              'bg-green-100', 'border-green-400', 'text-green-700',
                              'bg-yellow-100', 'border-yellow-400', 'text-yellow-700',
                              'bg-red-100', 'border-red-400', 'text-red-700');
        });
        Object.values(this.elements.metrics).forEach(el => {
            if (el && el.id && el.id !== 'metric-sleep') { // 跳过已删除的睡眠输入
                el.value = '';
            }
        });
        this.elements.goodThings.forEach(el => el.value = '');
        this.elements.journalInput.value = '';
        this.elements.habitChecks.forEach(el => el.checked = false);
        this.resetMoneyStateUI();
        
        // Clear tags selection visual
        this.selectedEmotions = new Set();
        this.selectedNourishments = new Set();
        
        this.hideSoftTransitionPrompt();
        this.updateTabStatusIndicators();

        // Reset sleep selector
        if (this.sleepSelector) {
            this.sleepSelector.reset();
        }
        
        // Reset body state selector
        if (this.bodyStateSelector) {
            this.bodyStateSelector.reset();
        }
    }

    initSleepSelector(savedSleepData = {}) {
        const initialData = {
            sleepData: savedSleepData,
            quality: savedSleepData.quality || null
        };

        if (this.sleepSelector) {
            this.sleepSelector.setValue(initialData);
            return;
        }

        if (!this.elements.sleepSelectorContainer) return;

        this.sleepSelector = new CompleteSleepModule(this.elements.sleepSelectorContainer, {
            initialSleepData: savedSleepData,
            initialQuality: savedSleepData.quality,
            onSleepChange: (sleepData) => {
                this.syncLogStateFromUI();
            },
            onQualityChange: (quality, option) => {
                this.syncLogStateFromUI();
            }
        });
        this.syncStatusStateFromUI();
    }

    initBodyStateSelector(savedBodyState = null) {
        if (!this.elements.bodyStateSelectorContainer) return;

        if (!this.bodyStateSelector) {
            this.bodyStateSelector = new BodyStateSelector(this.elements.bodyStateSelectorContainer, {
                onChange: () => {
                    this.onCheckinInteraction('vitality');
                    this.syncStatusStateFromUI();
                }
            });
        }

        this.bodyStateSelector.reset();

        if (savedBodyState) {
            this.bodyStateSelector.setValue(savedBodyState);
        }
    }

    selectBodyCondition(condition) {
        const normalizedCondition = condition === '明显不适' ? '严重不适' : condition;
        this.currentBodyCondition = normalizedCondition;
        this.onCheckinInteraction('vitality');
        this.elements.bodyConditionBtns.forEach(btn => {
            const btnCondition = btn.dataset.condition === '明显不适' ? '严重不适' : btn.dataset.condition;
            const selected = btnCondition === normalizedCondition;
            btn.classList.toggle('selected', selected);
        });
        this.syncStatusStateFromUI();
    }

    setBodyCondition(bodyCondition) {
        if (!bodyCondition) return;
        if (bodyCondition.level) {
            this.selectBodyCondition(bodyCondition.level);
        }
        this.elements.bodyConditionNote.value = bodyCondition.note || '';
    }

    selectMoneyState(groupName, value) {
        if (!groupName) return;
        this.elements.moneyStateButtons.forEach(btn => {
            if (btn.dataset.moneyGroup !== groupName) return;
            btn.classList.toggle('selected', btn.dataset.moneyValue === value);
        });
        this.currentMoneyState[groupName] = value || null;
        this.refreshMoneyQuote();
        this.syncLogStateFromUI();
    }

    resetMoneyStateUI() {
        this.elements.moneyStateButtons.forEach(btn => btn.classList.remove('selected'));
        if (this.elements.moneyNote) this.elements.moneyNote.value = '';
        if (this.elements.moneyQuote) {
            this.elements.moneyQuote.classList.add('hidden');
            this.elements.moneyQuote.textContent = '';
        }
    }

    hydrateMoneyState(data = {}) {
        const moneyData = data.money || {};
        this.currentMoneyState = {
            money_feeling: moneyData.feeling || data.money_feeling || null,
            money_saving: moneyData.saving || data.money_saving || null,
            money_impulse: moneyData.impulse || data.money_impulse || null,
            money_note: moneyData.note || data.money_note || ''
        };

        this.elements.moneyStateButtons.forEach(btn => {
            const group = btn.dataset.moneyGroup;
            const value = btn.dataset.moneyValue;
            btn.classList.toggle('selected', this.currentMoneyState[group] === value);
        });
        if (this.elements.moneyNote) this.elements.moneyNote.value = this.currentMoneyState.money_note;
        this.refreshMoneyQuote();
    }

    refreshMoneyQuote() {
        if (!this.elements.moneyQuote) return;
        const requiredSelections = [
            this.currentMoneyState.money_feeling,
            this.currentMoneyState.money_saving,
            this.currentMoneyState.money_impulse
        ];
        const hasCompletedCoreSelection = requiredSelections.every(Boolean);
        if (!hasCompletedCoreSelection) {
            this.elements.moneyQuote.classList.add('hidden');
            this.elements.moneyQuote.textContent = '';
            return;
        }

        const quote = this.moneyWisdomQuotes[Math.floor(Math.random() * this.moneyWisdomQuotes.length)];
        this.elements.moneyQuote.textContent = `🎁 随机锦囊：${quote}`;
        this.elements.moneyQuote.classList.remove('hidden');
    }

    buildMoneyData() {
        const feeling = this.currentMoneyState.money_feeling || null;
        const moneyScoreByAwareness = {
            in_rhythm: 1,
            windfall: 1,
            flowing: 0,
            inertia: -1
        };
        return {
            money_feeling: feeling,
            money_saving: this.currentMoneyState.money_saving || null,
            money_impulse: this.currentMoneyState.money_impulse || null,
            money_note: (this.currentMoneyState.money_note || '').slice(0, 120),
            money_alignment_score: moneyScoreByAwareness[this.currentMoneyState.money_saving] ?? 0,
            money: {
                feeling,
                saving: this.currentMoneyState.money_saving || null,
                impulse: this.currentMoneyState.money_impulse || null,
                note: (this.currentMoneyState.money_note || '').slice(0, 120)
            }
        };
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        this.elements.tabButtons.forEach(btn => {
            const selected = btn.dataset.tab === tabName;
            btn.setAttribute('aria-selected', String(selected));
            btn.classList.toggle('text-black', selected);
            btn.classList.toggle('font-medium', selected);
            btn.classList.toggle('border-blue-400', selected);
            btn.classList.toggle('bg-white/80', selected);
            btn.classList.toggle('shadow-sm', selected);
            btn.classList.toggle('text-gray-400', !selected);
        });

        if (tabName !== 'checkin') {
            this.clearAutoProgressionTimer();
            this.hideAutoProgressToast();
        }

        this.elements.tabPages.forEach(page => {
            const isActive = page.dataset.page === tabName;
            page.classList.toggle('hidden', !isActive);
            if (isActive) {
                if (tabName === 'record') {
                    page.classList.remove('opacity-100', 'translate-y-0');
                    page.classList.add('opacity-0', 'translate-y-2');
                    requestAnimationFrame(() => {
                        page.classList.remove('opacity-0', 'translate-y-2');
                        page.classList.add('opacity-100', 'translate-y-0');
                    });
                } else {
                    page.classList.remove('opacity-0', 'translate-y-2');
                    page.classList.add('opacity-100', 'translate-y-0');
                }
            }
        });

        this.updateTabStatusIndicators();
    }

    renderEmotionTags(selectedTags = []) {
        const container = this.elements.emotionTags;
        container.innerHTML = '';
        this.selectedEmotions = new Set(selectedTags);
        
        const state = store.getState();
        const allEmotions = [...CONFIG.DEFAULT_EMOTIONS, ...state.customEmotions];

        allEmotions.forEach(emo => {
            const btn = document.createElement('div');
            btn.className = 'inline-flex items-center gap-1';
            
            const tagBtn = document.createElement('button');
            const isSelected = this.selectedEmotions.has(emo.value);
            tagBtn.className = `px-3 py-1 rounded-full text-xs border transition-colors ${isSelected ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`;
            tagBtn.textContent = emo.text;
            tagBtn.onclick = () => {
                if (this.selectedEmotions.has(emo.value)) {
                    this.selectedEmotions.delete(emo.value);
                    tagBtn.className = 'px-3 py-1 rounded-full text-xs border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors';
                    this.updateTabStatusIndicators();
                    this.syncStatusStateFromUI();
                } else {
                    this.selectedEmotions.add(emo.value);
                    tagBtn.className = 'px-3 py-1 rounded-full text-xs border bg-blue-100 border-blue-300 text-blue-700 transition-colors';
                    this.onCheckinInteraction('feelings');
                    this.syncStatusStateFromUI();
                }
            };
            
            btn.appendChild(tagBtn);
            
            // Add delete button for custom emotions only
            const isCustomEmotion = state.customEmotions.some(custom => custom.value === emo.value);
            if (isCustomEmotion) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'text-red-400 hover:text-red-600 p-0.5 rounded-full hover:bg-red-50 transition-colors';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = '删除自定义情绪';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    
                    // Remove from custom emotions
                    const currentState = store.getState();
                    const newCustoms = currentState.customEmotions.filter(custom => custom.value !== emo.value);
                    store.setState({ customEmotions: newCustoms });
                    
                    // Remove from selected if it was selected
                    if (this.selectedEmotions.has(emo.value)) {
                        this.selectedEmotions.delete(emo.value);
                    }
                    
                    // Re-render tags
                    this.renderEmotionTags(Array.from(this.selectedEmotions));
                };
                
                btn.appendChild(deleteBtn);
            }
            
            container.appendChild(btn);
        });
        
        // Add "Add" button
        const addBtn = document.createElement('button');
        addBtn.className = "px-3 py-1 rounded-full text-xs border border-dashed border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-300";
        addBtn.textContent = "+ 自定义";
        addBtn.onclick = () => {
            // Replace button with input form
            const form = document.createElement('form');
            form.className = "inline-flex items-center gap-1";
            form.innerHTML = `
                <input type="text" class="w-24 px-2 py-1 text-xs border border-blue-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="🤔 思考" value="🤔 思考">
                <button type="button" class="quick-add text-blue-500 hover:text-blue-700 p-1" title="快速添加默认情绪">⚡</button>
                <button type="submit" class="text-blue-500 hover:text-blue-700 p-1" title="添加自定义情绪">✓</button>
                <button type="button" class="text-gray-400 hover:text-gray-600 p-1" title="取消">✕</button>
            `;
            
            const input = form.querySelector('input');
            const quickAddBtn = form.querySelector('.quick-add');
            const cancelBtn = form.querySelector('button[type="button"]:not(.quick-add)');
            
            // Quick add - use default value
            quickAddBtn.onclick = (e) => {
                e.preventDefault();
                const defaultVal = input.value.trim();
                if (defaultVal && !this.selectedEmotions.has('思考')) {
                    const newEmo = { text: defaultVal, value: '思考' };
                    
                    const currentState = store.getState();
                    const newCustoms = [...currentState.customEmotions, newEmo];
                    store.setState({ customEmotions: newCustoms });
                    
                    this.renderEmotionTags([...this.selectedEmotions, '思考']);
                }
            };
            
            form.onsubmit = (e) => {
                e.preventDefault();
                const val = input.value.trim();
                if (val) {
                    const text = val; 
                    const value = val.includes(' ') ? val.split(' ')[1] : val;
                    const newEmo = { text, value };
                    
                    const currentState = store.getState();
                    const newCustoms = [...currentState.customEmotions, newEmo];
                    store.setState({ customEmotions: newCustoms });
                    
                    this.renderEmotionTags([...this.selectedEmotions, value]); 
                } else {
                    this.renderEmotionTags([...this.selectedEmotions]); // Restore button
                }
            };
            
            cancelBtn.onclick = () => {
                this.renderEmotionTags([...this.selectedEmotions]); // Restore button
            };

            addBtn.replaceWith(form);
            input.focus();
            input.select(); // 选中默认文本，方便用户直接修改
        };
        container.appendChild(addBtn);
    }

    renderNourishmentTags(selectedTags = []) {
        const container = this.elements.nourishmentTags;
        container.innerHTML = '';
        this.selectedNourishments = new Set(selectedTags);
        
        const state = store.getState();
        const allNourishments = [...CONFIG.DEFAULT_NOURISHMENTS, ...state.customNourishments];

        allNourishments.forEach(item => {
             const btn = document.createElement('div');
             btn.className = 'inline-flex items-center gap-1';
             
             const tagBtn = document.createElement('button');
            const isSelected = this.selectedNourishments.has(item.value);
            tagBtn.className = `px-3 py-1 rounded-full text-xs border transition-colors ${isSelected ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`;
            tagBtn.textContent = item.text;
            tagBtn.onclick = () => {
                if (this.selectedNourishments.has(item.value)) {
                    this.selectedNourishments.delete(item.value);
                    tagBtn.className = 'px-3 py-1 rounded-full text-xs border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors';
                } else {
                    this.selectedNourishments.add(item.value);
                    tagBtn.className = 'px-3 py-1 rounded-full text-xs border bg-green-100 border-green-300 text-green-700 transition-colors';
                }
            };
            
            btn.appendChild(tagBtn);
            
            // Add delete button for custom tags only
            const isCustomTag = state.customNourishments.some(custom => custom.value === item.value);
            if (isCustomTag) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'text-red-400 hover:text-red-600 p-0.5 rounded-full hover:bg-red-50 transition-colors';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = '删除自定义标签';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    
                    // Remove from custom nourishments
                    const currentState = store.getState();
                    const newCustoms = currentState.customNourishments.filter(custom => custom.value !== item.value);
                    store.setState({ customNourishments: newCustoms });
                    
                    // Remove from selected if it was selected
                    if (this.selectedNourishments.has(item.value)) {
                        this.selectedNourishments.delete(item.value);
                    }
                    
                    // Re-render tags
                    this.renderNourishmentTags(Array.from(this.selectedNourishments));
                };
                
                btn.appendChild(deleteBtn);
            }
            
            container.appendChild(btn);
        });

        // Add "Add" button
        const addBtn = document.createElement('button');
        addBtn.className = "px-3 py-1 rounded-full text-xs border border-dashed border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-300";
        addBtn.textContent = "+ 自定义";
        addBtn.onclick = () => {
             // Replace button with input form
             const form = document.createElement('form');
             form.className = "inline-flex items-center gap-1";
             form.innerHTML = `
                <input type="text" class="w-24 px-2 py-1 text-xs border border-green-300 rounded-full focus:outline-none focus:ring-1 focus:ring-green-400" placeholder="🎵 听歌" value="🎵 听歌">
                <button type="button" class="quick-add text-blue-500 hover:text-blue-700 p-1" title="快速添加默认标签">⚡</button>
                <button type="submit" class="text-green-500 hover:text-green-700 p-1" title="添加自定义标签">✓</button>
                <button type="button" class="text-gray-400 hover:text-gray-600 p-1" title="取消">✕</button>
             `;
            
             const input = form.querySelector('input');
             const quickAddBtn = form.querySelector('.quick-add');
             const cancelBtn = form.querySelector('button[type="button"]:not(.quick-add)');

             // Quick add - use default value
             quickAddBtn.onclick = (e) => {
                e.preventDefault();
                const defaultVal = input.value.trim();
                if (defaultVal && !this.selectedNourishments.has('听歌')) {
                    const newItem = { text: defaultVal, value: '听歌' };
                    
                    const currentState = store.getState();
                    const newCustoms = [...currentState.customNourishments, newItem];
                    store.setState({ customNourishments: newCustoms });
                    
                    this.renderNourishmentTags([...this.selectedNourishments, '听歌']);
                }
             };

             form.onsubmit = (e) => {
                e.preventDefault();
                const val = input.value.trim();
                if (val) {
                    const text = val;
                    const value = val.includes(' ') ? val.split(' ')[1] : val;
                    const newItem = { text, value };
                    
                    const currentState = store.getState();
                    const newCustoms = [...currentState.customNourishments, newItem];
                    store.setState({ customNourishments: newCustoms });
                    
                    this.renderNourishmentTags([...this.selectedNourishments, value]);
                } else {
                    this.renderNourishmentTags([...this.selectedNourishments]);
                }
             };

             cancelBtn.onclick = () => {
                 this.renderNourishmentTags([...this.selectedNourishments]);
             };

             addBtn.replaceWith(form);
             input.focus();
             input.select(); // 选中默认文本，方便用户直接修改
        };
        container.appendChild(addBtn);
    }

    // 数据验证函数
    validateDataField(value, rules, fieldName) {
        if (!rules.required && (value === null || value === undefined || value === '')) {
            return { isValid: true, normalizedValue: null };
        }
        
        const numValue = Number(value);
        if (!Number.isFinite(numValue)) {
            console.warn(`⚠️ Invalid ${fieldName}: ${value}`);
            return { isValid: false, error: `Invalid ${fieldName}: ${value}` };
        }
        
        if (numValue < rules.min || numValue > rules.max) {
            console.warn(`⚠️ ${fieldName} ${numValue} out of range [${rules.min}, ${rules.max}]`);
            return { 
                isValid: false, 
                error: `${fieldName} ${numValue} out of range [${rules.min}, ${rules.max}]` 
            };
        }
        
        return { isValid: true, normalizedValue: numValue };
    }

    // 数据格式验证和清理
    validateAndCleanData(data) {
        const cleanedData = { ...data };
        const validationErrors = [];
        
        // 验证睡眠数据
        if (cleanedData.sleepData) {
            const sleepDurationValidation = this.validateDataField(
                cleanedData.sleepData.duration, 
                DATA_VALIDATION_RULES.sleepDuration, 
                'sleep duration'
            );
            const sleepQualityValidation = this.validateDataField(
                cleanedData.sleepData.quality, 
                DATA_VALIDATION_RULES.sleepQuality, 
                'sleep quality'
            );
            
            if (sleepDurationValidation.isValid) {
                cleanedData.sleepData.duration = sleepDurationValidation.normalizedValue;
            } else {
                validationErrors.push(sleepDurationValidation.error);
            }
            
            if (sleepQualityValidation.isValid) {
                cleanedData.sleepData.quality = sleepQualityValidation.normalizedValue;
            } else {
                validationErrors.push(sleepQualityValidation.error);
            }
        }
        
        // 验证指标数据
        if (cleanedData.metrics) {
            const exerciseValidation = this.validateDataField(
                cleanedData.metrics.exercise, 
                DATA_VALIDATION_RULES.exerciseMinutes, 
                'exercise minutes'
            );
            const readingValidation = this.validateDataField(
                cleanedData.metrics.reading, 
                DATA_VALIDATION_RULES.readingMinutes, 
                'reading minutes'
            );
            
            if (exerciseValidation.isValid) {
                cleanedData.metrics.exercise = exerciseValidation.normalizedValue;
            } else {
                validationErrors.push(exerciseValidation.error);
            }
            
            if (readingValidation.isValid) {
                cleanedData.metrics.reading = readingValidation.normalizedValue;
            } else {
                validationErrors.push(readingValidation.error);
            }
        }
        
        // 验证情绪数据
        if (cleanedData.emotions && !Array.isArray(cleanedData.emotions)) {
            cleanedData.emotions = [];
            validationErrors.push('Emotions must be an array');
        }
        
        // 验证关键词数据
        if (cleanedData.keywords && !Array.isArray(cleanedData.keywords)) {
            cleanedData.keywords = [];
            validationErrors.push('Keywords must be an array');
        }
        
        // 记录验证结果
        if (validationErrors.length > 0) {
            console.error('❌ Data validation errors:', validationErrors);
        } else {
            console.log('✅ Data validation passed');
        }
        
        return { cleanedData, validationErrors };
    }

    hasMeaningfulCheckinData() {
        const hasMood = Number.isInteger(this.currentMood);
        const hasBodyState = this.bodyStateSelector && !!this.bodyStateSelector.getValue();
        const hasFeelings = this.selectedEmotions && this.selectedEmotions.size > 0;
        return hasMood || hasBodyState || hasFeelings;
    }

    updateTabStatusIndicators() {
        this.hasCheckinData = this.hasMeaningfulCheckinData();
        this.elements.tabButtons.forEach(btn => {
            const statusEl = btn.querySelector('[data-tab-status]');
            if (!statusEl) return;
            if (!this.hasCheckinData) {
                statusEl.textContent = '';
                statusEl.classList.remove('opacity-60');
                return;
            }
            statusEl.textContent = btn.dataset.tab === 'checkin' ? '✓' : '';
            statusEl.classList.toggle('opacity-60', btn.dataset.tab === 'checkin' && !!statusEl.textContent);
        });
        this.updateSoftTransitionPrompt();
    }

    hasSoftTransitionData() {
        const hasVitality = this.bodyStateSelector && !!this.bodyStateSelector.getValue();
        const hasMood = Number.isInteger(this.currentMood);
        const hasFeelings = this.selectedEmotions && this.selectedEmotions.size > 0;
        const hasBodyCondition = !!this.currentBodyCondition || !!(this.elements.bodyConditionNote && this.elements.bodyConditionNote.value.trim());
        return hasVitality || hasMood || hasFeelings || hasBodyCondition;
    }

    showSoftTransitionPrompt() {
        if (!this.elements.softTransitionPrompt) return;
        const prompt = this.elements.softTransitionPrompt;
        prompt.classList.remove('hidden');
        prompt.classList.add('flex');

        if (!this.softPromptVisible) {
            prompt.classList.add('opacity-0', 'translate-y-2');
            requestAnimationFrame(() => {
                prompt.classList.remove('opacity-0', 'translate-y-2');
                prompt.classList.add('opacity-100', 'translate-y-0');
            });
            this.softPromptVisible = true;
        } else {
            prompt.classList.remove('opacity-0', 'translate-y-2');
            prompt.classList.add('opacity-100', 'translate-y-0');
        }
    }

    hideSoftTransitionPrompt() {
        if (!this.elements.softTransitionPrompt) return;
        const prompt = this.elements.softTransitionPrompt;
        prompt.classList.remove('flex', 'opacity-100', 'translate-y-0');
        prompt.classList.add('hidden', 'opacity-0', 'translate-y-2');
        this.softPromptVisible = false;
    }

    updateSoftTransitionPrompt() {
        if (this.currentTab !== 'checkin' || this.isHydrating || !this.hasSoftTransitionData()) {
            this.hideSoftTransitionPrompt();
            return;
        }
        this.showSoftTransitionPrompt();
    }

    scrollToTopOfRecordTab() {
        // 当前由外层 modal 容器承担滚动
        if (this.modal) {
            this.modal.scrollTop = 0;
        }
    }

    onCheckinInteraction(type) {
        if (!['mood', 'vitality', 'feelings'].includes(type)) return;
        this.updateTabStatusIndicators();
    }

    getVitalityLevel(bodyState) {
        const levelById = { recover: 1, normal: 2, good: 3, high: 4 };
        if (!bodyState) return null;
        if (bodyState.id && levelById[bodyState.id]) return levelById[bodyState.id];

        const score = Number(bodyState.score);
        if (Number.isNaN(score)) return null;
        if (score <= 35) return 1;
        if (score <= 65) return 2;
        if (score <= 85) return 3;
        return 4;
    }

    addCustomActivityInput(name = '', value = '') {
        const div = document.createElement('div');
        div.className = "flex gap-2 mb-2 activity-row";
        div.innerHTML = `
            <input type="text" class="activity-name w-1/3 p-2 border border-gray-200 rounded-md text-xs" placeholder="活动名称" value="${name}">
            <input type="text" class="activity-value flex-1 p-2 border border-gray-200 rounded-md text-xs" placeholder="详情/时长" value="${value}">
            <button type="button" class="text-red-400 hover:text-red-600" onclick="this.parentElement.remove()">×</button>
        `;
        // Insert before the add button container
        // Actually the container has the add button inside 'custom-activities-container' but in HTML it was appended?
        // In HTML:
        // <div id="custom-activities-container">
        //      <h4...>
        //      <button id="add-custom-activity">...</button>
        // </div>
        // So we should insert before the button.
        this.elements.addActivityBtn.insertAdjacentElement('beforebegin', div);
        div.querySelectorAll('input').forEach((input) => {
            input.addEventListener('input', () => this.syncLogStateFromUI());
        });
    }

    save(options = {}) {
        this.handleSaveDailyRecord(options);
    }

    setSaveFeedback(text, tone = 'neutral') {
        if (!this.elements.saveFeedback) return;
        this.elements.saveFeedback.textContent = text;
        this.elements.saveFeedback.classList.remove('text-gray-500', 'text-blue-600', 'text-green-600', 'text-red-500');
        if (tone === 'info') this.elements.saveFeedback.classList.add('text-blue-600');
        else if (tone === 'success') this.elements.saveFeedback.classList.add('text-green-600');
        else if (tone === 'error') this.elements.saveFeedback.classList.add('text-red-500');
        else this.elements.saveFeedback.classList.add('text-gray-500');
    }

    resetSaveFeedback() {
        if (this.saveFeedbackTimer) {
            clearTimeout(this.saveFeedbackTimer);
            this.saveFeedbackTimer = null;
        }
        this.setSaveFeedback('');
    }

    handleSaveDailyRecord(options = {}) {
        if (!this.currentDateStr) return;
        this.setSaveFeedback('正在保存…', 'info');
        this.elements.saveBtn.disabled = true;
        this.elements.saveBtn.classList.add('opacity-70', 'cursor-not-allowed');
        this.elements.saveBtn.setAttribute('aria-busy', 'true');

        const data = {
            mood: this.currentMood,
            emotions: Array.from(this.selectedEmotions),
            keywords: this.elements.keywordsInput.value.split(/[,，]/).map(k => k.trim()).filter(k => k),
            weather: this.currentWeather,
            body_state: this.bodyStateSelector ? this.bodyStateSelector.getValue() : null,
            vitality: this.getVitalityLevel(this.bodyStateSelector ? this.bodyStateSelector.getValue() : null),
            body_condition: {
                level: this.currentBodyCondition,
                note: this.elements.bodyConditionNote.value.trim()
            },
            nourishments: Array.from(this.selectedNourishments),
            metrics: {
                // sleep: this.elements.metrics.sleep.value || 0, // 已替换为睡眠滑块
                exercise: (this.elements.metrics.exercise && parseInt(this.elements.metrics.exercise.value)) || 0,
                reading: (this.elements.metrics.reading && parseInt(this.elements.metrics.reading.value)) || 0,
                social: (this.elements.metrics.social && this.elements.metrics.social.value) || ''
            },
            ...this.buildMoneyData(),
            sleepData: this.sleepSelector ? this.sleepSelector.getValue() : {},
            three_good_things: this.elements.goodThings.map(el => el.value).filter(v => v),
            journal: this.elements.journalInput.value,
            indicator_checkins: this.elements.habitChecks.map(el => el.checked),
            checkin_texts: this.elements.habitInputs.map(el => el.value.trim()),
            custom_activities: []
        };

        // Custom Activities
        const rows = this.elements.customActivitiesContainer.querySelectorAll('.activity-row');
        rows.forEach(row => {
            const name = row.querySelector('.activity-name').value.trim();
            const val = row.querySelector('.activity-value').value.trim();
            if (name) {
                data.custom_activities.push({ name, value: val });
            }
        });
        
        // 数据验证和清理
        const { cleanedData, validationErrors } = this.validateAndCleanData(data);
        
        if (validationErrors.length > 0) {
            console.warn('⚠️ Data validation warnings:', validationErrors);
            // 继续保存，但记录警告
            this.setSaveFeedback('部分字段超出建议范围，已保存。', 'error');
        } else {
            this.setSaveFeedback('已保存', 'success');
        }
        
        this.modalState = {
            status: {
                mood: cleanedData.mood,
                emotions: cleanedData.emotions,
                weather: cleanedData.weather,
                body_state: cleanedData.body_state,
                vitality: cleanedData.vitality,
                body_condition: cleanedData.body_condition,
                nourishments: cleanedData.nourishments
            },
            log: {
                keywords: cleanedData.keywords,
                metrics: cleanedData.metrics,
                money_feeling: cleanedData.money_feeling,
                money_saving: cleanedData.money_saving,
                money_impulse: cleanedData.money_impulse,
                money_note: cleanedData.money_note,
                money_alignment_score: cleanedData.money_alignment_score,
                money: cleanedData.money,
                sleepData: cleanedData.sleepData,
                three_good_things: cleanedData.three_good_things,
                journal: cleanedData.journal,
                indicator_checkins: cleanedData.indicator_checkins,
                checkin_texts: cleanedData.checkin_texts,
                custom_activities: cleanedData.custom_activities
            }
        };

        const currentDate = this.currentDateStr;
        const records = JSON.parse(localStorage.getItem('dailyRecords') || '{}');
        records[currentDate] = {
            status: this.modalState.status,
            log: this.modalState.log
        };
        localStorage.setItem('dailyRecords', JSON.stringify(records));

        // Save Habits Definition as well (Update Macro Goals)
        const habits = this.elements.habitInputs.map(el => el.value.trim());
        const state = store.getState();
        const macroGoals = { ...state.macroGoals };
        if (!macroGoals[this.currentXunIndex]) macroGoals[this.currentXunIndex] = {};
        
        // Update indicators if changed (Optional: only if value is present)
        // If user clears input, do we clear definition? Yes.
        macroGoals[this.currentXunIndex].indicators = habits;

        // Update User Data
        const userData = { ...state.userData };
        userData[this.currentDateStr] = { ...userData[this.currentDateStr], ...cleanedData };

        // Save everything
        store.setState({ userData, macroGoals });
        
        this.refreshCalendar();
        this.refreshSummary();

        if (options.closeAfterSave || options.closeAfterSave === undefined) {
            this.closeModal();
        } else {
            this.saveFeedbackTimer = setTimeout(() => this.resetSaveFeedback(), 1800);
        }
        this.elements.saveBtn.disabled = false;
        this.elements.saveBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        this.elements.saveBtn.removeAttribute('aria-busy');
        if (this.onSave) this.onSave({ action: 'save', dateStr: this.currentDateStr, dayData: cleanedData });
        console.log('dailyRecords saved:', localStorage.getItem('dailyRecords'));
    }

    getFocusableElements() {
        if (!this.panel) return [];
        return Array.from(this.panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
            .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    }

    trapFocus(event) {
        const focusableElements = this.getFocusableElements();
        if (!focusableElements.length) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    handleKeydown(event) {
        if (this.modal.classList.contains('hidden')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
        } else if (event.key === 'Tab') {
            this.trapFocus(event);
        }
    }


    syncStatusStateFromUI() {
        this.modalState.status = {
            mood: this.currentMood || null,
            emotions: Array.from(this.selectedEmotions || []),
            weather: this.currentWeather || null,
            body_state: this.bodyStateSelector ? this.bodyStateSelector.getValue() : null,
            vitality: this.getVitalityLevel(this.bodyStateSelector ? this.bodyStateSelector.getValue() : null),
            body_condition: {
                level: this.currentBodyCondition,
                note: this.elements.bodyConditionNote.value.trim()
            },
            nourishments: Array.from(this.selectedNourishments || [])
        };
    }

    syncLogStateFromUI() {
        const rows = this.elements.customActivitiesContainer.querySelectorAll('.activity-row');
        const customActivities = [];
        rows.forEach(row => {
            const name = row.querySelector('.activity-name').value.trim();
            const val = row.querySelector('.activity-value').value.trim();
            if (name) customActivities.push({ name, value: val });
        });

        this.modalState.log = {
            keywords: this.elements.keywordsInput.value.split(/[,，]/).map(k => k.trim()).filter(k => k),
            metrics: {
                exercise: (this.elements.metrics.exercise && parseInt(this.elements.metrics.exercise.value)) || 0,
                reading: (this.elements.metrics.reading && parseInt(this.elements.metrics.reading.value)) || 0,
                social: (this.elements.metrics.social && this.elements.metrics.social.value) || ''
            },
            ...this.buildMoneyData(),
            sleepData: this.sleepSelector ? this.sleepSelector.getValue() : {},
            three_good_things: this.elements.goodThings.map(el => el.value).filter(v => v),
            journal: this.elements.journalInput.value,
            indicator_checkins: this.elements.habitChecks.map(el => el.checked),
            checkin_texts: this.elements.habitInputs.map(el => el.value.trim()),
            custom_activities: customActivities
        };
    }

    loadDailyRecord(date, fallbackRecord = {}) {
        const records = JSON.parse(localStorage.getItem('dailyRecords') || '{}');

        if (records[date]) {
            this.modalState.status = records[date].status || {};
            this.modalState.log = records[date].log || {};
            return;
        }

        this.modalState.status = {
            mood: fallbackRecord.mood || null,
            emotions: fallbackRecord.emotions || [],
            weather: fallbackRecord.weather || null,
            body_state: fallbackRecord.body_state || null,
            vitality: fallbackRecord.vitality || null,
            body_condition: fallbackRecord.body_condition || {},
            nourishments: fallbackRecord.nourishments || []
        };

        this.modalState.log = {
            keywords: fallbackRecord.keywords || [],
            metrics: fallbackRecord.metrics || {},
            money_feeling: fallbackRecord.money_feeling || fallbackRecord.money?.feeling || null,
            money_saving: fallbackRecord.money_saving || fallbackRecord.money?.saving || null,
            money_impulse: fallbackRecord.money_impulse || fallbackRecord.money?.impulse || null,
            money_note: fallbackRecord.money_note || fallbackRecord.money?.note || '',
            money_alignment_score: fallbackRecord.money_alignment_score ?? 0,
            money: fallbackRecord.money || {
                feeling: fallbackRecord.money_feeling || null,
                saving: fallbackRecord.money_saving || null,
                impulse: fallbackRecord.money_impulse || null,
                note: fallbackRecord.money_note || ''
            },
            sleepData: fallbackRecord.sleepData || {},
            three_good_things: fallbackRecord.three_good_things || [],
            journal: fallbackRecord.journal || '',
            indicator_checkins: fallbackRecord.indicator_checkins || [],
            checkin_texts: fallbackRecord.checkin_texts || [],
            custom_activities: fallbackRecord.custom_activities || []
        };
    }

    refreshCalendar() {
        if (typeof globalThis.refreshCalendar === 'function') globalThis.refreshCalendar();
    }

    refreshSummary() {
        const records = JSON.parse(localStorage.getItem('dailyRecords') || '{}');
        const periods = Calendar.getXunPeriods(new Date().getFullYear());
        const period = periods.find((item) => item.index === this.currentXunIndex);

        const vitalityToEnergy = {
            '需要恢复': 3,
            '正常运转': 5,
            '状态很好': 7,
            '高能日': 9
        };

        let entries = Object.entries(records || {});
        if (period) {
            const start = Calendar.formatLocalDate(period.startDate);
            const end = Calendar.formatLocalDate(period.endDate);
            entries = entries.filter(([date]) => date >= start && date <= end);
        }

        const sleepValues = entries
            .map(([, record]) => Number(record?.log?.sleepData?.duration))
            .filter((value) => Number.isFinite(value) && value > 0);

        const energyValues = entries
            .map(([, record]) => {
                const vitality = record?.status?.body_state?.title;
                if (vitality && vitalityToEnergy[vitality]) return vitalityToEnergy[vitality];
                const numericVitality = Number(record?.status?.vitality);
                return Number.isFinite(numericVitality) ? numericVitality : null;
            })
            .filter((value) => Number.isFinite(value));

        const recordDays = entries.length;
        const daysInXun = period?.days || 10;
        const summarySnapshot = {
            avgSleep: sleepValues.length ? Number((sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1)) : 0,
            avgEnergy: energyValues.length ? Number((energyValues.reduce((a, b) => a + b, 0) / energyValues.length).toFixed(1)) : 0,
            recordDays,
            completionRate: Math.round((recordDays / daysInXun) * 100)
        };

        globalThis.__dailyRecordsSummarySnapshot = summarySnapshot;

        if (typeof globalThis.refreshSummary === 'function') globalThis.refreshSummary();
    }

    closeModal() {
        this.close();
    }
    delete() {
        if (!confirm('确定要删除今天的记录吗？')) return;
        const state = store.getState();
        const userData = { ...state.userData };
        delete userData[this.currentDateStr];
        store.setState({ userData });
        this.close();
        if (this.onSave) this.onSave({ action: 'delete', dateStr: this.currentDateStr, dayData: null });
    }
}
