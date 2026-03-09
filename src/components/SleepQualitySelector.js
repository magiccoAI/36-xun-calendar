/**
 * SleepQualitySelector - Vanilla JavaScript version
 * 单选恢复状态按钮组件
 */

const DEFAULT_OPTIONS = [
    { value: 5, emoji: '🤩', label: '精神爆棚' },
    { value: 4, emoji: '😊', label: '还不错' },
    { value: 3, emoji: '😐', label: '普通' },
    { value: 2, emoji: '😴', label: '困' },
    { value: 1, emoji: '😵', label: '没恢复' }
];

export class SleepQualitySelector {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options.options || DEFAULT_OPTIONS;
        this.title = options.title || '今日恢复状态';
        this.className = options.className || '';
        this.showSelectionHint = options.showSelectionHint !== false;
        this.onSelect = options.onSelect;
        this.value = options.value || options.defaultValue || null;
        
        this.render();
    }

    render() {
        const section = document.createElement('section');
        section.className = `w-full ${this.className}`.trim();

        // Title
        const title = document.createElement('h4');
        title.className = 'mb-3 text-xs font-medium text-gray-600';
        title.textContent = this.title;
        section.appendChild(title);

        // Options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4';

        this.options.forEach((option) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('data-value', option.value);
            
            const isSelected = option.value === this.value;
            button.setAttribute('aria-pressed', isSelected);
            
            button.className = [
                'min-w-[88px] rounded-xl border px-3 py-2 text-xs sm:text-sm',
                'transition-all duration-150 ease-out transform',
                'hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0',
                'focus:outline-none focus:ring-2 focus:ring-indigo-300',
                isSelected
                    ? 'border-indigo-500 bg-indigo-500 text-white shadow-md'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
            ].join(' ');

            // Emoji and label container
            const span = document.createElement('span');
            span.className = 'flex items-center justify-center gap-1.5';
            
            if (option.emoji) {
                const emojiSpan = document.createElement('span');
                emojiSpan.textContent = option.emoji;
                span.appendChild(emojiSpan);
            }
            
            const labelSpan = document.createElement('span');
            labelSpan.textContent = option.label;
            span.appendChild(labelSpan);
            
            button.appendChild(span);
            
            // Click handler
            button.addEventListener('click', () => {
                this.selectOption(option);
            });

            optionsContainer.appendChild(button);
        });

        section.appendChild(optionsContainer);

        // Selection hint
        if (this.showSelectionHint) {
            const hintContainer = document.createElement('div');
            hintContainer.className = 'mt-3 flex items-center justify-center text-xs text-gray-500';
            
            const selectedOption = this.options.find(option => option.value === this.value);
            
            if (selectedOption) {
                const hint = document.createElement('span');
                hint.className = 'inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700';
                
                const emojiSpan = document.createElement('span');
                emojiSpan.textContent = selectedOption.emoji || '✅';
                hint.appendChild(emojiSpan);
                
                const textSpan = document.createElement('span');
                textSpan.textContent = `已选择：${selectedOption.label}`;
                hint.appendChild(textSpan);
                
                hintContainer.appendChild(hint);
            } else {
                const hint = document.createElement('span');
                hint.className = 'text-gray-400';
                hint.textContent = '请选择今日恢复状态';
                hintContainer.appendChild(hint);
            }
            
            section.appendChild(hintContainer);
        }

        // Clear container and append new content
        this.container.innerHTML = '';
        this.container.appendChild(section);
    }

    selectOption(option) {
        this.value = option.value;
        this.render(); // Re-render to update selection state
        
        if (typeof this.onSelect === 'function') {
            this.onSelect(option.value, option);
        }
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
        this.render();
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

export { DEFAULT_OPTIONS };
