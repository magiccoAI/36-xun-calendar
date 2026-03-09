const MINUTES_PER_DAY = 24 * 60;
const DEGREES_PER_DAY = 360;
const START_ANGLE_OFFSET = -90;

const normalizeMinutes = (minutes) => {
    const value = Number.isFinite(minutes) ? minutes : 0;
    return ((Math.round(value) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
};

const normalizeAngle = (angle) => {
    const value = Number.isFinite(angle) ? angle : 0;
    return ((value % DEGREES_PER_DAY) + DEGREES_PER_DAY) % DEGREES_PER_DAY;
};

export const TimeMath = {
    MINUTES_PER_DAY,

    normalizeMinutes,

    minutesToAngle(minutes) {
        return normalizeAngle((normalizeMinutes(minutes) / MINUTES_PER_DAY) * DEGREES_PER_DAY + START_ANGLE_OFFSET);
    },

    angleToMinutes(angle) {
        const normalized = normalizeAngle(angle - START_ANGLE_OFFSET);
        return normalizeMinutes((normalized / DEGREES_PER_DAY) * MINUTES_PER_DAY);
    },

    pointToAngle(x, y, centerX, centerY) {
        const radians = Math.atan2(y - centerY, x - centerX);
        return normalizeAngle((radians * 180) / Math.PI);
    },

    minutesToDisplay(minutes) {
        const value = normalizeMinutes(minutes);
        const hour = Math.floor(value / 60);
        const min = value % 60;
        return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    },

    durationBetween(startMinutes, endMinutes) {
        const start = normalizeMinutes(startMinutes);
        const end = normalizeMinutes(endMinutes);
        return (end - start + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    }
};
