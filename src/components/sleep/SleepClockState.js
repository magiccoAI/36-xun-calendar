import { TimeMath } from './TimeMath.js';

const DEFAULT_STATE = {
    bedtimeMinutes: 23 * 60,
    wakeMinutes: 7 * 60,
    activeHandle: null
};

export class SleepClockState {
    constructor(initialState = {}) {
        this.listeners = new Set();
        this.state = { ...DEFAULT_STATE };
        this.restore(initialState);
    }

    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.getSnapshot());
        return () => this.listeners.delete(listener);
    }

    restore(partial = {}) {
        this.state = {
            ...this.state,
            bedtimeMinutes: TimeMath.normalizeMinutes(partial.bedtimeMinutes ?? this.state.bedtimeMinutes),
            wakeMinutes: TimeMath.normalizeMinutes(partial.wakeMinutes ?? this.state.wakeMinutes),
            activeHandle: partial.activeHandle ?? null
        };
        this.emit();
    }

    setActiveHandle(handleName) {
        this.state.activeHandle = handleName;
        this.emit();
    }

    setMinutesForHandle(handleName, minutes) {
        if (!['bedtime', 'wake'].includes(handleName)) return;

        const key = `${handleName}Minutes`;
        this.state[key] = TimeMath.normalizeMinutes(minutes);
        this.emit();
    }

    getSnapshot() {
        const bedtimeMinutes = TimeMath.normalizeMinutes(this.state.bedtimeMinutes);
        const wakeMinutes = TimeMath.normalizeMinutes(this.state.wakeMinutes);
        const durationMinutes = TimeMath.durationBetween(bedtimeMinutes, wakeMinutes);

        return {
            bedtimeMinutes,
            wakeMinutes,
            durationMinutes,
            bedtimeLabel: TimeMath.minutesToDisplay(bedtimeMinutes),
            wakeLabel: TimeMath.minutesToDisplay(wakeMinutes),
            activeHandle: this.state.activeHandle
        };
    }

    emit() {
        const snapshot = this.getSnapshot();
        this.listeners.forEach(listener => listener(snapshot));
    }
}
