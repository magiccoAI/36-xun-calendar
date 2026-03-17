
import { store } from '../core/State.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';
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
        this.checkinGuideShown = false;
        this.hasCheckinData = false;
        this.isHydrating = false;
        this.autoProgressTimer = null;
        this.autoProgressCancelled = false;
        
        this.initElements();
        this.initListeners();
    }

    initElements() {
        this.elements = {
            dateTitle: document.getElementById('modal-date'),
            closeBtn: document.getElementById('modal-close'),
            tabButtons: document.querySelectorAll('.modal-tab-btn'),
            tabPages: document.querySelectorAll('.modal-tab-page'),
            guideTip: document.getElementById('checkin-guide-tip'),
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
                wealth: document.getElementById('metric-wealth'),
                social: document.getElementById('metric-social')
            },
            goodThings: [
                document.getElementById('good-thing-1'),
                document.getElementById('good-thing-2'),
                document.getElementById('good-thing-3')
            ],
            customActivitiesContainer: document.getElementById('custom-activities-container'),
            addActivityBtn: document.getElementById('add-custom-activity'),
            journalInput: document.getElementById('journal-input'),
            deleteBtn: document.getElementById('modal-delete'),
            saveBtn: document.getElementById('modal-save'),
            autoProgressToast: document.getElementById('auto-progress-toast'),
            autoProgressCancelBtn: document.getElementById('auto-progress-cancel')
        };
    }

    initListeners() {
        this.elements.closeBtn.onclick = () => this.closeWithAutoSave();
        this.modal.onclick = (e) => {
            if (e.target === this.modal) this.closeWithAutoSave();
        };

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
            };
        });

        // Weather Buttons
        this.elements.weatherBtns.forEach(btn => {
            btn.onclick = () => {
                this.elements.weatherBtns.forEach(b => b.classList.remove('bg-white/80', 'ring-2', 'ring-blue-300/60', 'shadow-lg'));
                btn.classList.add('bg-white/80', 'ring-2', 'ring-blue-300/60', 'shadow-lg');
                this.currentWeather = btn.dataset.weather;
            };
        });

        this.elements.tabButtons.forEach(btn => {
            btn.onclick = () => this.switchTab(btn.dataset.tab);
        });

        if (this.elements.guideTip) {
            this.elements.guideTip.onclick = () => this.switchTab('record');
        }

        this.elements.bodyConditionBtns.forEach(btn => {
            btn.onclick = () => this.selectBodyCondition(btn.dataset.condition);
        });

        // Save Button
        this.elements.saveBtn.onclick = () => this.save({ closeAfterSave: true });

        // Delete Button
        this.elements.deleteBtn.onclick = () => this.delete();
        
        // Add Activity
        this.elements.addActivityBtn.onclick = () => this.addCustomActivityInput();

        if (this.elements.autoProgressCancelBtn) {
            this.elements.autoProgressCancelBtn.onclick = () => this.cancelAutoProgression();
        }
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
        const data = state.userData[dateStr] || {};
        const macroGoal = state.macroGoals[xunIndex] || {};

        console.log('Modal open:', dateStr, 'sleepData:', data.sleepData);

        // Reset UI
        this.resetUI();
        this.checkinGuideShown = false;
        this.switchTab('checkin');
        this.isHydrating = true;
        this.autoProgressCancelled = false;
        this.clearAutoProgressionTimer();
        this.hideAutoProgressToast();

        // Populate Data
        // Mood
        if (data.mood) {
            const btn = document.querySelector(`.mood-btn[data-mood="${data.mood}"]`);
            if (btn) btn.click();
        }

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
            if (this.elements.metrics.wealth) this.elements.metrics.wealth.value = data.metrics.wealth || '';
            if (this.elements.metrics.social) this.elements.metrics.social.value = data.metrics.social || '';
        }
        
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

        this.isHydrating = false;
        this.autoProgressCancelled = false;
        this.clearAutoProgressionTimer();
        this.hideAutoProgressToast();
        this.updateTabStatusIndicators();

        // Show Modal
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        setTimeout(() => {
            this.panel.classList.remove('scale-95');
            this.panel.classList.add('scale-100');
        }, 10);
    }

    close() {
        this.clearAutoProgressionTimer();
        this.hideAutoProgressToast();
        this.panel.classList.remove('scale-100');
        this.panel.classList.add('scale-95');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }, 300);
    }


    closeWithAutoSave() {
        this.save({ closeAfterSave: true });
    }

    resetUI() {
        this.elements.moodBtns.forEach(b => b.classList.remove('bg-white/80', 'ring-2', 'ring-blue-300/60', 'shadow-lg'));
        this.currentMood = null;
        this.currentWeather = null;
        this.elements.weatherBtns.forEach(b => b.classList.remove('bg-white/80', 'ring-2', 'ring-blue-300/60', 'shadow-lg'));
        this.elements.keywordsInput.value = '';
        this.elements.bodyConditionNote.value = '';
        this.currentBodyCondition = null;
        this.checkinGuideShown = false;
        this.hasCheckinData = false;
        this.isHydrating = false;
        this.autoProgressTimer = null;
        this.autoProgressCancelled = false;
        this.elements.bodyConditionBtns.forEach(btn => {
            btn.classList.remove('bg-blue-100', 'border-blue-300', 'text-blue-700');
        });
        Object.values(this.elements.metrics).forEach(el => {
            if (el && el.id && el.id !== 'metric-sleep') { // 跳过已删除的睡眠输入
                el.value = '';
            }
        });
        this.elements.goodThings.forEach(el => el.value = '');
        this.elements.journalInput.value = '';
        this.elements.habitChecks.forEach(el => el.checked = false);
        
        // Clear tags selection visual
        this.selectedEmotions = new Set();
        this.selectedNourishments = new Set();
        
        if (this.elements.guideTip) {
            this.elements.guideTip.classList.add('hidden');
        }
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
                // 可以在这里处理睡眠时间变化的逻辑
            },
            onQualityChange: (quality, option) => {
                // 可以在这里处理睡眠质量变化的逻辑
            }
        });
    }

    initBodyStateSelector(savedBodyState = null) {
        if (!this.elements.bodyStateSelectorContainer) return;

        if (!this.bodyStateSelector) {
            this.bodyStateSelector = new BodyStateSelector(this.elements.bodyStateSelectorContainer, {
                onChange: () => {
                    this.onCheckinInteraction('vitality');
                }
            });
        }

        this.bodyStateSelector.reset();

        if (savedBodyState) {
            this.bodyStateSelector.setValue(savedBodyState);
        }
    }

    selectBodyCondition(condition) {
        this.currentBodyCondition = condition;
        this.onCheckinInteraction('vitality');
        this.elements.bodyConditionBtns.forEach(btn => {
            const selected = btn.dataset.condition === condition;
            btn.classList.toggle('bg-blue-100', selected);
            btn.classList.toggle('border-blue-300', selected);
            btn.classList.toggle('text-blue-700', selected);
        });
    }

    setBodyCondition(bodyCondition) {
        if (!bodyCondition) return;
        if (bodyCondition.level) {
            this.selectBodyCondition(bodyCondition.level);
        }
        this.elements.bodyConditionNote.value = bodyCondition.note || '';
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        this.elements.tabButtons.forEach(btn => {
            const selected = btn.dataset.tab === tabName;
            btn.setAttribute('aria-selected', String(selected));
            btn.classList.toggle('bg-white/90', selected);
            btn.classList.toggle('text-blue-700', selected);
            btn.classList.toggle('shadow-sm', selected);
            btn.classList.toggle('text-gray-600', !selected);
        });

        if (tabName !== 'checkin') {
            this.clearAutoProgressionTimer();
            this.hideAutoProgressToast();
        }

        this.elements.tabPages.forEach(page => {
            const isActive = page.dataset.page === tabName;
            page.classList.toggle('hidden', !isActive);
            page.classList.toggle('opacity-0', !isActive);
            page.classList.toggle('opacity-100', isActive);
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
                } else {
                    this.selectedEmotions.add(emo.value);
                    tagBtn.className = 'px-3 py-1 rounded-full text-xs border bg-blue-100 border-blue-300 text-blue-700 transition-colors';
                    this.onCheckinInteraction('feelings');
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
                return;
            }
            statusEl.textContent = btn.dataset.tab === 'checkin' ? '✓' : '●';
        });
    }

    showCheckinGuideTip() {
        if (!this.elements.guideTip || this.checkinGuideShown || !this.hasMeaningfulCheckinData()) return;
        this.checkinGuideShown = true;
        this.elements.guideTip.classList.remove('hidden');
    }

    onCheckinInteraction(type) {
        if (!['mood', 'vitality', 'feelings'].includes(type)) return;
        this.updateTabStatusIndicators();
        if (this.isHydrating) return;
        this.showCheckinGuideTip();
        this.scheduleAutoProgression();
    }

    hasAutoProgressionRequirements() {
        const hasVitality = this.bodyStateSelector && !!this.bodyStateSelector.getValue();
        const hasMood = Number.isInteger(this.currentMood);
        const hasFeelings = this.selectedEmotions && this.selectedEmotions.size > 0;
        return hasVitality && (hasMood || hasFeelings);
    }

    clearAutoProgressionTimer() {
        if (!this.autoProgressTimer) return;
        clearTimeout(this.autoProgressTimer);
        this.autoProgressTimer = null;
    }

    hideAutoProgressToast() {
        if (!this.elements.autoProgressToast) return;
        this.elements.autoProgressToast.classList.add('hidden');
    }

    showAutoProgressToast() {
        if (!this.elements.autoProgressToast) return;
        this.elements.autoProgressToast.classList.remove('hidden');
    }

    cancelAutoProgression() {
        this.autoProgressCancelled = true;
        this.clearAutoProgressionTimer();
        this.hideAutoProgressToast();
    }

    scheduleAutoProgression() {
        if (this.currentTab !== 'checkin') return;
        if (this.autoProgressCancelled) return;

        if (!this.hasAutoProgressionRequirements()) {
            this.clearAutoProgressionTimer();
            this.hideAutoProgressToast();
            return;
        }

        this.showAutoProgressToast();
        this.clearAutoProgressionTimer();
        this.autoProgressTimer = setTimeout(() => {
            this.hideAutoProgressToast();
            this.autoProgressTimer = null;
            if (this.currentTab === 'checkin' && !this.autoProgressCancelled) {
                this.switchTab('record');
            }
        }, 1200);
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
    }

    save(options = {}) {
        if (!this.currentDateStr) return;

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
                wealth: (this.elements.metrics.wealth && parseFloat(this.elements.metrics.wealth.value)) || 0,
                social: (this.elements.metrics.social && this.elements.metrics.social.value) || ''
            },
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
        userData[this.currentDateStr] = { ...userData[this.currentDateStr], ...data };

        // Save everything
        store.setState({ userData, macroGoals });
        
        if (options.closeAfterSave) {
            this.close();
        }
        if (this.onSave) this.onSave({ action: 'save', dateStr: this.currentDateStr, dayData: data });
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
