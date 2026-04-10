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
        this.xunPeriods = [];
        this.currentXun = null;
        this.unsubscribe = store.subscribe(() => {
            if (this.xunPeriods.length > 0) {
                this.render(this.xunPeriods, this.currentXun);
            }
        });
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

        this.container.addEventListener('xun-checkin-toggle', (e) => {
            this.handleCheckinToggle(e.detail.date, e.detail.index, e.detail.shiftKey);
        });

        this.container.addEventListener('xun-checkin-batch', (e) => {
            this.handleBatchCheckin(e.detail.index, e.detail.mode);
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

    getPeriodGoalKey(year, xunIndex) {
        return `${year}-${xunIndex}`;
    }

    getGoalByPeriod(period, macroGoals) {
        const goalKey = this.getPeriodGoalKey(period.startDate.getFullYear(), period.index);
        return macroGoals[goalKey] || macroGoals[period.index] || {};
    }

    normalizeDayData(dayData = {}) {
        return {
            goalCheckin: dayData.goalCheckin ?? dayData.goal_checkin ?? false,
            metrics: typeof dayData.metrics === 'object' && dayData.metrics !== null ? dayData.metrics : {},
            journal: typeof dayData.journal === 'string' ? dayData.journal : (typeof dayData.notes === 'string' ? dayData.notes : ''),
            ...dayData
        };
    }

    handleCheckinToggle(dateStr) {
        const state = store.getState();
        const userData = structuredClone(state.userData || {});
        const currentData = this.normalizeDayData(userData[dateStr] || {});

        currentData.goalCheckin = !currentData.goalCheckin;
        currentData.goal_checkin = currentData.goalCheckin;
        userData[dateStr] = currentData;

        this.selectionState.anchorDate = dateStr;
        this.selectionState.rangeActive = false;

        store.setState({ userData });
    }

    handleBatchCheckin(index, mode = 'complete-all') {
        const state = store.getState();
        const period = this.xunPeriods.find(item => item.index === index);
        if (!period) return;

        const userData = structuredClone(state.userData || {});
        const days = Calendar.getDatesInRange(period.startDate, period.endDate);

        days.forEach((dateObj) => {
            if (Calendar.isFutureDate(dateObj)) return;
            const dateStr = Calendar.formatLocalDate(dateObj);
            const currentData = this.normalizeDayData(userData[dateStr] || {});
            currentData.goalCheckin = mode === 'complete-all';
            currentData.goal_checkin = currentData.goalCheckin;
            userData[dateStr] = currentData;
        });

        store.setState({ userData });
    }

    handleMacroGoalUpdate(index, value) {
        const state = store.getState();
        const macroGoals = structuredClone(state.macroGoals || {});
        const period = this.xunPeriods.find(item => item.index === index);
        const year = period?.startDate?.getFullYear() || this.currentXun?.startDate?.getFullYear() || new Date().getFullYear();
        const key = this.getPeriodGoalKey(year, index);
        const nextGoal = this.normalizeGoalData(macroGoals[key] || macroGoals[index]);

        nextGoal.title = value;
        nextGoal.goal = value;

        macroGoals[key] = nextGoal;
        macroGoals[index] = nextGoal;
        store.setState({ macroGoals });
    }

    handleRemarksUpdate(index, value) {
        const state = store.getState();
        const macroGoals = structuredClone(state.macroGoals || {});
        const period = this.xunPeriods.find(item => item.index === index);
        const year = period?.startDate?.getFullYear() || this.currentXun?.startDate?.getFullYear() || new Date().getFullYear();
        const key = this.getPeriodGoalKey(year, index);
        const nextGoal = this.normalizeGoalData(macroGoals[key] || macroGoals[index]);

        nextGoal.notes = value;
        nextGoal.remarks = value;

        macroGoals[key] = nextGoal;
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
        const normalizedStart = Calendar.startOfDay(period.startDate);
        const normalizedEnd = Calendar.startOfDay(period.endDate);
        const totalDays = Calendar.daysBetween(normalizedStart, normalizedEnd) + 1;
        const days = Array.from({ length: totalDays }, (_, offset) => {
            const dateObj = Calendar.startOfDay(new Date(normalizedStart));
            dateObj.setDate(dateObj.getDate() + offset);
            const date = Calendar.formatLocalDate(dateObj);
            const dayRecord = this.normalizeDayData(userData[date] || {});
            const isChecked = dayRecord.goalCheckin === true;
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
        const goalData = this.normalizeGoalData(this.getGoalByPeriod(period, state.macroGoals || {}));
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
        this.xunPeriods = xunPeriods || this.xunPeriods;
        this.currentXun = currentXun || this.currentXun;
        const state = store.getState();
        const viewModels = this.xunPeriods.map(period => this.buildXunViewModel(period, state, this.currentXun));

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
