
import { store } from '../core/State.js';

export class SettingsModal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        if (!this.modal) {
            console.error('Settings modal not found');
            return;
        }
        this.closeBtn = this.modal.querySelector('.close-btn');
        this.menstrualToggle = document.getElementById('toggle-menstrual-cycle');
        
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
        };
    }

    loadInitialState() {
        const state = store.getState();
        this.menstrualToggle.checked = state.settings.showMenstrualCycle;
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
