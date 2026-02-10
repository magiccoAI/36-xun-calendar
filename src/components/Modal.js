
import { store } from '../core/State.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';

export class Modal {
    constructor(modalId, onSave) {
        this.modal = document.getElementById(modalId);
        this.panel = document.getElementById('modal-panel');
        this.onSave = onSave;
        this.currentDateStr = null;
        
        this.initElements();
        this.initListeners();
    }

    initElements() {
        this.elements = {
            dateTitle: document.getElementById('modal-date'),
            closeBtn: document.getElementById('modal-close'),
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
            energyInput: document.getElementById('energy-level'),
            nourishmentTags: document.getElementById('nourishment-tags-container'),
            metrics: {
                sleep: document.getElementById('metric-sleep'),
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
            saveBtn: document.getElementById('modal-save')
        };
    }

    initListeners() {
        this.elements.closeBtn.onclick = () => this.close();
        this.modal.onclick = (e) => {
            if (e.target === this.modal) this.close();
        };

        // Mood Buttons
        this.elements.moodBtns.forEach(btn => {
            btn.onclick = () => {
                this.elements.moodBtns.forEach(b => b.classList.remove('bg-blue-100', 'ring-2', 'ring-blue-300'));
                btn.classList.add('bg-blue-100', 'ring-2', 'ring-blue-300');
                this.currentMood = parseInt(btn.dataset.mood);
            };
        });

        // Weather Buttons
        this.elements.weatherBtns.forEach(btn => {
            btn.onclick = () => {
                this.elements.weatherBtns.forEach(b => b.classList.remove('bg-blue-100', 'ring-2', 'ring-blue-300'));
                btn.classList.add('bg-blue-100', 'ring-2', 'ring-blue-300');
                this.currentWeather = btn.dataset.weather;
            };
        });

        // Save Button
        this.elements.saveBtn.onclick = () => this.save();

        // Delete Button
        this.elements.deleteBtn.onclick = () => this.delete();
        
        // Add Activity
        this.elements.addActivityBtn.onclick = () => this.addCustomActivityInput();
    }

    open(dateStr, xunIndex) {
        this.currentDateStr = dateStr;
        this.currentXunIndex = xunIndex;
        this.elements.dateTitle.textContent = dateStr;
        
        const state = store.getState();
        const data = state.userData[dateStr] || {};
        const macroGoal = state.macroGoals[xunIndex] || {};

        // Reset UI
        this.resetUI();

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

        // Energy
        this.elements.energyInput.value = data.energy_level || 50;

        // Nourishment
        this.renderNourishmentTags(data.nourishments || []);
        
        // Metrics
        if (data.metrics) {
            this.elements.metrics.sleep.value = data.metrics.sleep || '';
            this.elements.metrics.exercise.value = data.metrics.exercise || '';
            this.elements.metrics.reading.value = data.metrics.reading || '';
            this.elements.metrics.wealth.value = data.metrics.wealth || '';
            this.elements.metrics.social.value = data.metrics.social || '';
        }

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

        // Show Modal
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        setTimeout(() => {
            this.panel.classList.remove('scale-95');
            this.panel.classList.add('scale-100');
        }, 10);
    }

    close() {
        this.panel.classList.remove('scale-100');
        this.panel.classList.add('scale-95');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }, 300);
    }

    resetUI() {
        this.elements.moodBtns.forEach(b => b.classList.remove('bg-blue-100', 'ring-2', 'ring-blue-300'));
        this.currentMood = null;
        this.currentWeather = null;
        this.elements.weatherBtns.forEach(b => b.classList.remove('bg-blue-100', 'ring-2', 'ring-blue-300'));
        this.elements.keywordsInput.value = '';
        this.elements.energyInput.value = 50;
        Object.values(this.elements.metrics).forEach(el => el.value = '');
        this.elements.goodThings.forEach(el => el.value = '');
        this.elements.journalInput.value = '';
        this.elements.habitChecks.forEach(el => el.checked = false);
        // Clear tags selection visual
        this.selectedEmotions = new Set();
        this.selectedNourishments = new Set();
    }

    renderEmotionTags(selectedTags = []) {
        const container = this.elements.emotionTags;
        container.innerHTML = '';
        this.selectedEmotions = new Set(selectedTags);
        
        const state = store.getState();
        const allEmotions = [...CONFIG.DEFAULT_EMOTIONS, ...state.customEmotions];

        allEmotions.forEach(emo => {
            const btn = document.createElement('button');
            const isSelected = this.selectedEmotions.has(emo.value);
            btn.className = `px-3 py-1 rounded-full text-xs border transition-colors ${isSelected ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`;
            btn.textContent = emo.text;
            btn.onclick = () => {
                if (this.selectedEmotions.has(emo.value)) {
                    this.selectedEmotions.delete(emo.value);
                    btn.className = 'px-3 py-1 rounded-full text-xs border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors';
                } else {
                    this.selectedEmotions.add(emo.value);
                    btn.className = 'px-3 py-1 rounded-full text-xs border bg-blue-100 border-blue-300 text-blue-700 transition-colors';
                }
            };
            container.appendChild(btn);
        });
        
        // Add "Add" button
        const addBtn = document.createElement('button');
        addBtn.className = "px-3 py-1 rounded-full text-xs border border-dashed border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-300";
        addBtn.textContent = "+ 自定义";
        addBtn.onclick = () => {
            // Replace button with input
            const form = document.createElement('form');
            form.className = "inline-flex items-center gap-1";
            form.innerHTML = `
                <input type="text" class="w-24 px-2 py-1 text-xs border border-blue-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="🤔 思考">
                <button type="submit" class="text-blue-500 hover:text-blue-700 p-1">✓</button>
                <button type="button" class="text-gray-400 hover:text-gray-600 p-1">✕</button>
            `;
            
            const input = form.querySelector('input');
            const cancelBtn = form.querySelector('button[type="button"]');
            
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
             const btn = document.createElement('button');
            const isSelected = this.selectedNourishments.has(item.value);
            btn.className = `px-3 py-1 rounded-full text-xs border transition-colors ${isSelected ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`;
            btn.textContent = item.text;
            btn.onclick = () => {
                if (this.selectedNourishments.has(item.value)) {
                    this.selectedNourishments.delete(item.value);
                    btn.className = 'px-3 py-1 rounded-full text-xs border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors';
                } else {
                    this.selectedNourishments.add(item.value);
                    btn.className = 'px-3 py-1 rounded-full text-xs border bg-green-100 border-green-300 text-green-700 transition-colors';
                }
            };
            container.appendChild(btn);
        });

        // Add "Add" button
        const addBtn = document.createElement('button');
        addBtn.className = "px-3 py-1 rounded-full text-xs border border-dashed border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-300";
        addBtn.textContent = "+ 自定义";
        addBtn.onclick = () => {
             // Replace button with input
             const form = document.createElement('form');
             form.className = "inline-flex items-center gap-1";
             form.innerHTML = `
                <input type="text" class="w-24 px-2 py-1 text-xs border border-green-300 rounded-full focus:outline-none focus:ring-1 focus:ring-green-400" placeholder="🎵 听歌">
                <button type="submit" class="text-green-500 hover:text-green-700 p-1">✓</button>
                <button type="button" class="text-gray-400 hover:text-gray-600 p-1">✕</button>
             `;
            
             const input = form.querySelector('input');
             const cancelBtn = form.querySelector('button[type="button"]');

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
        };
        container.appendChild(addBtn);
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

    save() {
        if (!this.currentDateStr) return;

        const data = {
            mood: this.currentMood,
            emotions: Array.from(this.selectedEmotions),
            keywords: this.elements.keywordsInput.value.split(/[,，]/).map(k => k.trim()).filter(k => k),
            weather: this.currentWeather,
            energy_level: this.elements.energyInput.value,
            nourishments: Array.from(this.selectedNourishments),
            metrics: {
                sleep: parseFloat(this.elements.metrics.sleep.value) || 0,
                exercise: parseInt(this.elements.metrics.exercise.value) || 0,
                reading: parseInt(this.elements.metrics.reading.value) || 0,
                wealth: parseFloat(this.elements.metrics.wealth.value) || 0,
                social: this.elements.metrics.social.value
            },
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
        
        this.close();
        if (this.onSave) this.onSave();
    }

    delete() {
        if (!confirm('确定要删除今天的记录吗？')) return;
        const state = store.getState();
        const userData = { ...state.userData };
        delete userData[this.currentDateStr];
        store.setState({ userData });
        this.close();
        if (this.onSave) this.onSave();
    }
}
