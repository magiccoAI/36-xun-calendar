export class XunRow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['period-index', 'start-date', 'end-date', 'hue', 'is-current', 'goal', 'remarks', 'progress-html', 'days-passed', 'total-days'];
    }

    connectedCallback() {
        this.render();
        this.setupListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
            this.setupListeners();
        }
    }

    setupListeners() {
        const goalInput = this.shadowRoot.querySelector('.goal-input');
        const remarksInput = this.shadowRoot.querySelector('.remarks-input');
        
        if (goalInput) {
            goalInput.addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('update-goal', {
                    detail: { index: parseInt(this.getAttribute('period-index')), value: e.target.value },
                    bubbles: true,
                    composed: true
                }));
            });
            goalInput.addEventListener('input', this.autoResize);
        }
        
        if (remarksInput) {
            remarksInput.addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('update-remarks', {
                    detail: { index: parseInt(this.getAttribute('period-index')), value: e.target.value },
                    bubbles: true,
                    composed: true
                }));
            });
            remarksInput.addEventListener('input', this.autoResize);
        }

        // Forward click events from progress HTML
        const progressContainer = this.shadowRoot.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action="toggle-checkin"]');
                if (btn) {
                    e.stopPropagation();
                    this.dispatchEvent(new CustomEvent('toggle-checkin', {
                        detail: { 
                            date: btn.dataset.date,
                            index: parseInt(btn.dataset.index)
                        },
                        bubbles: true,
                        composed: true
                    }));
                }
            });
        }
    }

    autoResize(e) {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    }

    render() {
        const index = this.getAttribute('period-index');
        const startDate = this.getAttribute('start-date');
        const endDate = this.getAttribute('end-date');
        const hue = this.getAttribute('hue');
        const isCurrent = this.getAttribute('is-current') === 'true';
        const goal = this.getAttribute('goal') || '';
        const remarks = this.getAttribute('remarks') || '';
        const progressHtml = this.getAttribute('progress-html') || '';
        const daysPassed = this.getAttribute('days-passed') || '0';
        const totalDays = this.getAttribute('total-days') || '10';

        const bgColor = `hsl(${hue}, 70%, 96%)`;
        const currentBadge = isCurrent ? `<div class="current-badge">当前</div>` : '';
        const currentClass = isCurrent ? 'current-row' : '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    border-bottom: 1px solid #f3f4f6;
                    position: relative;
                    background-color: ${bgColor};
                    transition: background-color 0.2s;
                }
                :host(:hover) {
                    opacity: 0.9;
                }
                * {
                    box-sizing: border-box;
                }
                .row {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0;
                    font-size: 0.875rem;
                    min-height: 3rem;
                }
                @media (min-width: 768px) {
                    .row {
                        grid-template-columns: repeat(12, minmax(0, 1fr));
                        border-bottom: none;
                    }
                    :host {
                        border-bottom: none;
                    }
                }
                .col {
                    padding: 0.5rem;
                    display: flex;
                    align-items: center;
                }
                .col-index {
                    grid-column: span 1;
                    justify-content: center;
                    font-weight: 500;
                    color: #4b5563;
                }
                .col-date {
                    grid-column: span 2;
                    justify-content: center;
                    font-family: monospace;
                    font-size: 0.75rem;
                    color: #6b7280;
                }
                .col-goal {
                    grid-column: span 4;
                }
                .col-progress {
                    grid-column: span 3;
                    justify-content: center;
                }
                .col-remarks {
                    grid-column: span 2;
                }
                textarea {
                    width: 100%;
                    min-height: 2.5rem;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 0.375rem;
                    padding: 0.25rem 0.5rem;
                    font-size: 0.875rem;
                    color: #374151;
                    resize: none;
                    overflow: hidden;
                    transition: all 0.2s;
                }
                textarea:hover {
                    background: rgba(255,255,255,0.5);
                }
                textarea:focus {
                    background: white;
                    border-color: #93c5fd;
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.5);
                }
                textarea::placeholder {
                    color: #9ca3af;
                }
                .current-badge {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                    z-index: 20;
                    animation: indicatorPulse 2s ease-in-out infinite;
                }
                @keyframes indicatorPulse {
                    0%, 100% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.05); opacity: 1; }
                }
                .current-row {
                    border: 2px solid #60a5fa;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    z-index: 10;
                }
                .progress-container {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                /* Mobile specific styles */
                @media (max-width: 767px) {
                    .col-index { display: none; }
                    .col-date {
                        position: absolute;
                        top: 0.5rem;
                        left: 0.5rem;
                        font-size: 0.7rem;
                        padding: 0;
                    }
                    .col-goal { padding: 1.5rem 0.5rem 0.5rem; }
                    .col-progress {
                        overflow-x: auto;
                        padding: 0.5rem 0;
                        justify-content: flex-start;
                    }
                    .col-remarks { padding-top: 0; }
                }
            </style>
            
            <div class="row ${currentClass}">
                ${currentBadge}
                
                <div class="col col-index">
                    第${index}旬
                </div>
                
                <div class="col col-date flex-col">
                    <span>${startDate}</span>
                    <span class="text-gray-400 mx-1">-</span>
                    <span>${endDate}</span>
                </div>
                
                <div class="col col-goal" data-input="true">
                    <textarea class="goal-input" 
                        placeholder="第${index}旬核心目标..." 
                        rows="1">${goal}</textarea>
                </div>
                
                <div class="col col-progress progress-container">
                    ${progressHtml}
                </div>
                
                <div class="col col-remarks" data-input="true">
                    <textarea class="remarks-input" 
                        placeholder="复盘与备注..." 
                        rows="1">${remarks}</textarea>
                </div>
            </div>
        `;
    }
}

customElements.define('xun-row', XunRow);
