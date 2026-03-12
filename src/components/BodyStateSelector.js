export class BodyStateSelector {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.selectedState = null;
        
        this.bodyStates = [
            {
                id: "recover",
                icon: "🛌",
                title: "需要恢复",
                description: "今天身体比较疲惫<br>整体状态偏低",
                score: 25
            },
            {
                id: "normal",
                icon: "⚖️",
                title: "正常运转",
                description: "体力和精神都还稳定<br>一天基本顺利完成",
                score: 55
            },
            {
                id: "good",
                icon: "💪",
                title: "状态很好",
                description: "精力比较充足<br>很多事情推进得不错",
                score: 80
            },
            {
                id: "high",
                icon: "🌟",
                title: "高能日",
                description: "状态很在线<br>行动力和创造力都很强",
                score: 95
            }
        ];
        
        this.init();
    }
    
    init() {
        this.render();
        this.bindEvents();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="body-state-selector">
                <div class="grid grid-cols-2 gap-3">
                    ${this.bodyStates.map(state => this.renderStateCard(state)).join('')}
                </div>
            </div>
        `;
    }
    
    renderStateCard(state) {
        const isSelected = this.selectedState?.id === state.id;
        return `
            <div class="body-state-card ${isSelected ? 'selected' : ''}" data-state-id="${state.id}">
                <div class="p-3 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : ''}">
                    <div class="text-center">
                        <div class="text-2xl mb-2">${state.icon}</div>
                        <div class="font-medium text-sm text-gray-800 mb-1">${state.title}</div>
                        <div class="text-xs text-gray-500 leading-relaxed">${state.description}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const card = e.target.closest('.body-state-card');
            if (card) {
                const stateId = card.dataset.stateId;
                this.selectState(stateId);
            }
        });
    }
    
    selectState(stateId) {
        const state = this.bodyStates.find(s => s.id === stateId);
        if (!state) return;
        
        this.selectedState = state;
        this.updateUI();
        
        if (this.options.onChange) {
            this.options.onChange(state);
        }
    }
    
    updateUI() {
        this.container.querySelectorAll('.body-state-card').forEach(card => {
            const stateId = card.dataset.stateId;
            const isSelected = this.selectedState?.id === stateId;
            const innerDiv = card.querySelector('div');
            
            if (isSelected) {
                innerDiv.classList.add('border-blue-500', 'bg-blue-50');
                innerDiv.classList.remove('border-gray-200', 'bg-white');
            } else {
                innerDiv.classList.remove('border-blue-500', 'bg-blue-50');
                innerDiv.classList.add('border-gray-200', 'bg-white');
            }
        });
    }
    
    setValue(stateId) {
        if (stateId) {
            this.selectState(stateId);
        }
    }
    
    getValue() {
        return this.selectedState;
    }
    
    reset() {
        this.selectedState = null;
        this.updateUI();
    }
}
