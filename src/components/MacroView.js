import { store } from '../core/State.js';
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';
import './web-components/XunRow.js';

const DEFAULT_GOAL_DATA = {
    title: '',
    domain: '',
    horizon: '',
    difficulty: '',
    energyCost: '',
    identityTag: '',
    notes: ''
};

export class MacroView {
    constructor(containerId, onViewChange) {
        this.container = document.getElementById(containerId);
        this.onViewChange = onViewChange;
        this.selectionState = {
            anchorDate: null,
            rangeActive: false
        };
        this.initEventListeners();
    }

    initEventListeners() {
        this.container.addEventListener('update-goal', (e) => {
            this.handleMacroGoalUpdate(e.detail.index, e.detail.value);
        });

        this.container.addEventListener('update-remarks', (e) => {
            this.handleRemarksUpdate(e.detail.index, e.detail.value);
        });

        this.container.addEventListener('toggle-checkin', (e) => {
            this.handleCheckinToggle(e.detail.date, e.detail.index, e.detail.shiftKey);
        });

        this.container.addEventListener('navigate-xun', (e) => {
            this.handleNavigationRequest(e.detail.index);
        });
    }

    normalizeGoalData(goalEntry = {}) {
        const normalized = {
            ...DEFAULT_GOAL_DATA,
            ...goalEntry
        };

        if (!normalized.title && goalEntry.goal) {
            normalized.title = goalEntry.goal;
        }
        if (!normalized.notes && goalEntry.remarks) {
            normalized.notes = goalEntry.remarks;
        }

        // Legacy compatibility fields
        normalized.goal = normalized.title;
        normalized.remarks = normalized.notes;

        return normalized;
    }

    handleCheckinToggle(dateStr) {
        const state = store.getState();
        const userData = structuredClone(state.userData || {});
        const currentData = userData[dateStr] || {};

        currentData.goal_checkin = !currentData.goal_checkin;
        userData[dateStr] = currentData;

        this.selectionState.anchorDate = dateStr;
        this.selectionState.rangeActive = false;

        store.setState({ userData });
    }

    handleMacroGoalUpdate(index, value) {
        const state = store.getState();
        const macroGoals = structuredClone(state.macroGoals || {});
        const nextGoal = this.normalizeGoalData(macroGoals[index]);

        nextGoal.title = value;
        nextGoal.goal = value;

        macroGoals[index] = nextGoal;
        store.setState({ macroGoals });
    }

    handleRemarksUpdate(index, value) {
        const state = store.getState();
        const macroGoals = structuredClone(state.macroGoals || {});
        const nextGoal = this.normalizeGoalData(macroGoals[index]);

        nextGoal.notes = value;
        nextGoal.remarks = value;

        macroGoals[index] = nextGoal;
        store.setState({ macroGoals });
    }

    handleNavigationRequest(index) {
        if (this.onViewChange) this.onViewChange('overview', index);
    }

    calculateXunStats(progressData) {
        const eligibleDays = progressData.days.filter(day => !day.isFuture);
        const checkedDays = eligibleDays.filter(day => day.intensityLevel === 2);
        const completionRate = eligibleDays.length > 0
            ? Math.round((checkedDays.length / eligibleDays.length) * 100)
            : 0;

        let longestStreak = 0;
        let rollingStreak = 0;
        eligibleDays.forEach(day => {
            if (day.intensityLevel === 2) {
                rollingStreak += 1;
                longestStreak = Math.max(longestStreak, rollingStreak);
            } else {
                rollingStreak = 0;
            }
        });

        let currentStreak = 0;
        for (let i = eligibleDays.length - 1; i >= 0; i -= 1) {
            if (eligibleDays[i].intensityLevel === 2) {
                currentStreak += 1;
            } else {
                break;
            }
        }

        return {
            completionRate,
            currentStreak,
            longestStreak
        };
    }

    getTimeStatus(period) {
        const today = Calendar.getStartOfToday();
        if (today > period.endDate) return 'past';
        if (today < period.startDate) return 'future';
        return 'current';
    }

    buildProgressData(period, userData) {
        const days = Calendar.getDatesInRange(period.startDate, period.endDate).map((dateObj) => {
            const date = Calendar.formatLocalDate(dateObj);
            const dayRecord = userData[date] || {};
            const isChecked = dayRecord.goal_checkin === true;
            const isToday = date === Calendar.getTodayString();
            const isFuture = Calendar.isFutureDate(dateObj);
            const hasAnyRecord = Object.keys(dayRecord).length > 0;
            const intensityLevel = isChecked ? 2 : (hasAnyRecord ? 1 : 0);

            return {
                date,
                isChecked,
                isToday,
                isFuture,
                intensityLevel
            };
        });

        const checkedCount = days.filter(day => day.isChecked).length;

        return {
            days,
            checkedCount,
            totalDays: days.length
        };
    }

    buildXunViewModel(period, state, currentXun) {
        const hue = (period.index * CONFIG.visual.xunHueStep) % 360;
        const progressData = this.buildProgressData(period, state.userData || {});
        const goalData = this.normalizeGoalData((state.macroGoals || {})[period.index]);
        const stats = this.calculateXunStats(progressData);
        const timeStatus = this.getTimeStatus(period);

        return {
            index: period.index,
            startDate: period.startDate,
            endDate: period.endDate,
            hue,
            progressData,
            stats,
            goalData,
            timeStatus,
            isCurrent: Boolean(currentXun && currentXun.index === period.index)
        };
    }

    render(xunPeriods, currentXun) {
        const state = store.getState();
        const viewModels = xunPeriods.map(period => this.buildXunViewModel(period, state, currentXun));

        const fragment = document.createDocumentFragment();
        viewModels.forEach((viewModel) => {
            const row = document.createElement('xun-row');
            row.viewModel = viewModel;
            row.progressData = viewModel.progressData;
            row.timeStatus = viewModel.timeStatus;
            fragment.appendChild(row);
        });

        this.container.replaceChildren(fragment);
    }
}
