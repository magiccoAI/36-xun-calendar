export class XunRow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['period-index', 'start-date', 'end-date', 'hue', 'is-current', 'goal', 'remarks', 'progress-html', 'days-passed', 'total-days', 'is-mobile'];
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

        // Add keyboard navigation for the row
        this.setupKeyboardNavigation();
    }

    setupKeyboardNavigation() {
        const row = this.shadowRoot.querySelector('.row');
        if (!row) return;

        row.addEventListener('keydown', (e) => {
            // Handle Enter/Space for row navigation
            if ((e.key === 'Enter' || e.key === ' ') && !e.target.matches('textarea, button, input')) {
                e.preventDefault();
                this.handleRowActivation();
            }

            // Handle arrow keys for navigation between periods
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.handleArrowNavigation(e.key);
            }

            // Handle Escape to blur inputs
            if (e.key === 'Escape') {
                const activeElement = this.shadowRoot.activeElement;
                if (activeElement && activeElement.matches('textarea')) {
                    activeElement.blur();
                    row.focus();
                }
            }
        });
    }

    handleRowActivation() {
        // Emit event for parent to handle navigation
        this.dispatchEvent(new CustomEvent('row-activate', {
            detail: { index: parseInt(this.getAttribute('period-index')) },
            bubbles: true,
            composed: true
        }));
    }

    handleArrowNavigation(key) {
        // Emit event for parent to handle navigation
        this.dispatchEvent(new CustomEvent('row-navigate', {
            detail: { 
                index: parseInt(this.getAttribute('period-index')),
                direction: key === 'ArrowDown' ? 'next' : 'prev'
            },
            bubbles: true,
            composed: true
        }));
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
        const isMobile = this.getAttribute('is-mobile') === 'true';

        const bgColor = `hsl(${hue}, 70%, 96%)`;
        const currentBadge = isCurrent ? `<div class="current-badge" role="status" aria-live="polite">当前旬</div>` : '';
        const currentClass = isCurrent ? 'current-row' : '';
        const rowRole = isCurrent ? 'article' : 'article';
        const rowLabel = `${index}旬，${startDate}至${endDate}${isCurrent ? '，当前旬' : ''}`;

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
                :host(:focus-within) {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
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
                    font-family: 'Georgia', serif; /* Artistic font */
                    font-size: 1.2rem; /* Slightly larger font size */
                    font-weight: 500;
                    color: #1f2937; /* Improved contrast */
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .col-index:hover {
                    background-color: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }
                .col-index .number-container {
                    position: relative;
                    display: inline-block;
                    width: 3.5rem;
                    height: 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                }
                .col-index .number {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #1f2937;
                    line-height: 1;
                    position: relative;
                    z-index: 2;
                    margin-right: 0.8rem;
                }
                .col-index .xun-char {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #6b7280;
                    position: absolute;
                    bottom: 0.2rem;
                    right: 0.2rem;
                    z-index: 1;
                    opacity: 0.8;
                }
                .col-index:hover .number {
                    color: #3b82f6;
                }
                .col-index:hover .xun-char {
                    color: #60a5fa;
                    opacity: 1;
                }
                .col-date {
                    grid-column: span 2;
                    justify-content: center;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: #374151; /* WCAG AA compliant contrast */
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.025em;
                    line-height: 1.5;
                }
                .col-date:hover {
                    background-color: rgba(59, 130, 246, 0.08);
                    color: #1d4ed8; /* Better contrast on hover */
                }
                .col-date span[aria-label] {
                    color: #1f2937; /* Stronger contrast for date numbers */
                }
                .col-goal {
                    grid-column: span 4;
                }
                .col-progress {
                    grid-column: span 3;
                    justify-content: center;
                    padding: 0.5rem;
                }
                .col-remarks {
                    grid-column: span 2;
                }
                textarea {
                    width: 100%;
                    min-height: 2.5rem;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                    font-weight: 400;
                    color: #111827; /* WCAG AAA contrast */
                    resize: none;
                    overflow: hidden;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    line-height: 1.5;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                }
                textarea:hover {
                    background: rgba(255,255,255,0.8);
                    border-color: rgba(59, 130, 246, 0.2);
                }
                textarea:focus {
                    background: white;
                    border-color: #3b82f6;
                    outline: 2px solid #3b82f6;
                    outline-offset: 1px;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
                textarea::placeholder {
                    color: #6b7280;
                    font-weight: 400;
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
                    border: 2px solid #3b82f6;
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
                    .row {
                        position: relative;
                        padding-top: 3rem;
                    }
                    .col-index { 
                        display: flex; 
                        position: absolute;
                        top: 0.5rem;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 10;
                        padding: 0.5rem 1rem;
                        background: transparent;
                        border-radius: 1.5rem;
                        justify-content: center;
                    }
                    .col-index .number-container {
                        width: auto;
                        height: auto;
                        min-width: 3.5rem;
                    }
                    .col-index .number {
                        font-size: 2rem;
                        font-weight: 700;
                        margin-right: 0.3rem;
                    }
                    .col-index .xun-char {
                        font-size: 0.8rem;
                        bottom: 0.3rem;
                        right: 0.2rem;
                    }
                    .current-row .col-index {
                        background: rgba(59, 130, 246, 0.1);
                    }
                    .current-row .col-index .number {
                        color: #3b82f6;
                    }
                    .col-date {
                        position: absolute;
                        top: 0.5rem;
                        right: 0.5rem;
                        font-size: 0.7rem;
                        padding: 0;
                        background: rgba(255, 255, 255, 0.9);
                        border-radius: 0.5rem;
                        padding: 0.25rem 0.5rem;
                    }
                    .col-goal { 
                        padding: 0.5rem;
                        margin-top: 0.5rem;
                    }
                    .col-progress {
                        padding: 0.5rem;
                        justify-content: center;
                        background: rgba(0, 0, 0, 0.02);
                        border-radius: 0.5rem;
                        margin: 0.5rem;
                    }
                    .col-remarks { 
                        padding: 0.5rem;
                        margin-top: 0.5rem;
                    }
                    .col-progress .flex {
                        justify-content: center;
                    }
                    .col-progress span {
                        display: block;
                        text-align: center;
                        margin-top: 0.25rem;
                        font-size: 0.75rem;
                        color: #6b7280;
                    }
                }
                /* High contrast mode support */
                @media (prefers-contrast: high) {
                    :host {
                        border: 2px solid #000;
                    }
                    textarea {
                        border: 2px solid #000;
                    }
                    .current-badge {
                        background: #000;
                        color: #fff;
                    }
                }
                /* Reduced motion support */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            </style>
            
            <div class="row ${currentClass}" role="${rowRole}" aria-label="${rowLabel}" tabindex="0">
                ${currentBadge}
                
                <div class="col col-index" aria-label="旬编号">
                    <div class="number-container">
                        <span class="number">${index}</span>
                        <span class="xun-char">旬</span>
                    </div>
                </div>
                
                <div class="col col-date flex-col" role="group" aria-label="日期范围">
                    <span aria-label="开始日期">${startDate}</span>
                    <span class="text-gray-400 mx-1" aria-hidden="true">-</span>
                    <span aria-label="结束日期">${endDate}</span>
                </div>
                
                <div class="col col-goal" data-input="true">
                    <textarea 
                        id="goal-${index}"
                        class="goal-input" 
                        placeholder="${index}旬核心目标..." 
                        rows="1"
                        aria-label="${index}旬核心目标">${goal}</textarea>
                </div>
                
                <div class="col col-progress progress-container" role="group" aria-label="每日打卡进度">
                    ${progressHtml}
                </div>
                
                <div class="col col-remarks" data-input="true">
                    <textarea 
                        id="remarks-${index}"
                        class="remarks-input" 
                        placeholder="复盘与备注..." 
                        rows="1"
                        aria-label="${index}旬复盘与备注">${remarks}</textarea>
                </div>
            </div>
        `;
    }
}

customElements.define('xun-row', XunRow);
