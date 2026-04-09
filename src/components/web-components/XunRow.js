import { Calendar } from '../../core/Calendar.js';

export class XunRow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._viewModel = null;
        this._progressData = null;
        this._timeStatus = 'current';
        this._listenersBound = false;
    }

    connectedCallback() {
        this.render();
        this.setupListeners();
    }

    set viewModel(value) {
        this._viewModel = value;
        if (value?.progressData) this._progressData = value.progressData;
        if (value?.timeStatus) this._timeStatus = value.timeStatus;
        if (this.isConnected) this.render();
    }

    get viewModel() {
        return this._viewModel;
    }

    set progressData(value) {
        this._progressData = value;
        if (this.isConnected) this.render();
    }

    get progressData() {
        return this._progressData;
    }

    set timeStatus(value) {
        this._timeStatus = value;
        if (this.isConnected) this.render();
    }

    get timeStatus() {
        return this._timeStatus;
    }

    setupListeners() {
        if (this._listenersBound) return;

        this.shadowRoot.addEventListener('change', (e) => {
            if (e.target.classList.contains('goal-input')) {
                this.dispatchEvent(new CustomEvent('update-goal', {
                    detail: { index: this._viewModel.index, value: e.target.value },
                    bubbles: true,
                    composed: true
                }));
            }

            if (e.target.classList.contains('remarks-input')) {
                this.dispatchEvent(new CustomEvent('update-remarks', {
                    detail: { index: this._viewModel.index, value: e.target.value },
                    bubbles: true,
                    composed: true
                }));
            }
        });

        this.shadowRoot.addEventListener('input', (e) => {
            if (e.target.classList.contains('goal-input') || e.target.classList.contains('remarks-input')) {
                this.autoResize(e);
            }
        });

        this.shadowRoot.addEventListener('click', (e) => {
            const dayButton = e.target.closest('[data-action="toggle-checkin"]');
            if (dayButton && !dayButton.disabled) {
                e.stopPropagation();
                this.dispatchEvent(new CustomEvent('toggle-checkin', {
                    detail: {
                        date: dayButton.dataset.date,
                        index: this._viewModel.index,
                        shiftKey: e.shiftKey
                    },
                    bubbles: true,
                    composed: true
                }));
                return;
            }

            const interactive = e.target.closest('textarea,button,.goal-input,.remarks-input');
            if (!interactive) {
                this.dispatchEvent(new CustomEvent('navigate-xun', {
                    detail: { index: this._viewModel.index },
                    bubbles: true,
                    composed: true
                }));
            }
        });

        this._listenersBound = true;
    }

    autoResize(e) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }

    formatDisplayDate(dateObj) {
        return `${Calendar.pad2(dateObj.getMonth() + 1)}.${Calendar.pad2(dateObj.getDate())}`;
    }

    renderProgressCells() {
        const progressData = this._progressData || this._viewModel.progressData;
        if (!progressData || !Array.isArray(progressData.days)) return '';

        return progressData.days.map((day) => {
            const xunColor = `hsl(${this._viewModel.hue}, 80%, 60%)`;
            const lightColor = `hsl(${this._viewModel.hue}, 80%, 88%)`;
            const intensityColor = day.intensityLevel === 2 ? xunColor : (day.intensityLevel === 1 ? lightColor : '#ffffff');
            const disabledClass = day.isFuture ? 'future' : 'active';
            const todayClass = day.isToday ? 'today' : '';
            const checkedClass = day.isChecked ? 'checked' : '';
            const label = `${day.date}: ${day.isFuture ? '未到达' : (day.isChecked ? '已完成' : '可打卡')}`;

            return `
                <button
                    class="day-cell ${disabledClass} ${todayClass} ${checkedClass}"
                    data-action="toggle-checkin"
                    data-date="${day.date}"
                    aria-label="${label}"
                    title="${label}"
                    ${day.isFuture ? 'disabled' : ''}
                    style="background-color:${intensityColor}; border-color:${day.isToday ? '#3b82f6' : '#d1d5db'};"
                ></button>
            `;
        }).join('');
    }

    render() {
        if (!this._viewModel) return;

        const { index, startDate, endDate, goalData, stats, isCurrent, progressData } = this._viewModel;
        const bgColor = `hsl(${this._viewModel.hue}, 70%, 96%)`;
        const currentBadge = isCurrent ? '<div class="current-badge">当前</div>' : '';
        const timeStatusClass = `time-${this._timeStatus || 'current'}`;

        this.shadowRoot.innerHTML = `
            <style>
                :host { display:block; width:100%; border-bottom:1px solid #f3f4f6; background:${bgColor}; }
                .row { display:grid; grid-template-columns:1fr; position:relative; }
                @media (min-width: 768px) { .row { grid-template-columns: repeat(12, minmax(0, 1fr)); } }
                .col { padding:.5rem; display:flex; align-items:center; }
                .col-index { justify-content:center; color:#4b5563; font-weight:600; }
                .col-date { justify-content:center; font-family:monospace; font-size:.75rem; color:#6b7280; }
                .col-goal { grid-column: span 4; }
                .col-progress { grid-column: span 3; justify-content:center; }
                .col-remarks { grid-column: span 2; }
                .current-badge { position:absolute; top:8px; right:8px; background:#2563eb; color:#fff; border-radius:999px; font-size:10px; padding:2px 8px; }
                textarea { width:100%; min-height:2.5rem; background:transparent; border:1px solid transparent; border-radius:6px; padding:.25rem .5rem; resize:none; }
                textarea:focus { background:#fff; border-color:#93c5fd; outline:none; }
                .progress-wrap { width:100%; display:flex; align-items:center; gap:8px; }
                .progress-grid { display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:4px; width:100%; }
                @media (min-width: 768px) { .progress-grid { grid-template-columns: repeat(10, minmax(0,1fr)); } }
                .day-cell { width:100%; aspect-ratio:1/1; border:1px solid #d1d5db; border-radius:2px; transition:transform .15s ease; cursor:pointer; }
                .day-cell.active:hover { transform:scale(1.1); }
                .day-cell.future { opacity:.35; cursor:not-allowed; }
                .day-cell.today { box-shadow:0 0 0 2px rgba(59,130,246,.25); }
                .stats { font-size:10px; color:#6b7280; white-space:nowrap; }
                .time-past { opacity:0.9; }
                .time-current { border-left:3px solid #3b82f6; }
                .time-future { opacity:0.75; }
                @media (max-width: 767px) {
                    .col-index { display:none; }
                    .col-goal { padding-top:1.4rem; }
                }
            </style>

            <div class="row ${timeStatusClass}">
                ${currentBadge}
                <div class="col col-index">第${index}旬</div>
                <div class="col col-date"><span>${this.formatDisplayDate(startDate)} - ${this.formatDisplayDate(endDate)}</span></div>
                <div class="col col-goal" data-input="true">
                    <textarea class="goal-input" placeholder="第${index}旬核心目标..." rows="1">${goalData.title || ''}</textarea>
                </div>
                <div class="col col-progress">
                    <div class="progress-wrap">
                        <div class="progress-grid">${this.renderProgressCells()}</div>
                        <div class="stats">${progressData.checkedCount}/${progressData.totalDays}<br>率:${stats.completionRate}% 连:${stats.currentStreak}/${stats.longestStreak}</div>
                    </div>
                </div>
                <div class="col col-remarks" data-input="true">
                    <textarea class="remarks-input" placeholder="复盘与备注..." rows="1">${goalData.notes || ''}</textarea>
                </div>
            </div>
        `;
    }
}

customElements.define('xun-row', XunRow);
