
// 统一的数据记录模型
export const DAY_RECORD_SCHEMA = {
    date: "2026-03-22",
    sleepData: { duration: 7, quality: 8 },
    metrics: { exercise: 30, reading: 20, social: "和朋友散步" },
    money_feeling: ["long_term"],
    money_saving: "in_rhythm",
    money_impulse: "balanced",
    money_note: "今天把钱花在长期有复利的事情上",
    money_alignment_score: 1,
    money: { feeling: ["long_term"], saving: "in_rhythm", impulse: "balanced", note: "今天把钱花在长期有复利的事情上" },
    emotions: ["快乐", "专注"],
    keywords: ["工作", "学习"],
    mood: 4,
    body_state: { title: "状态很好", id: "good" },
    body_condition: { level: "良好", note: "" },
    weather: "sunny",
    checkin_texts: ["今日任务1", "今日任务2", "今日任务3"],
    indicator_checkins: [true, false, true],
    nourishments: ["阅读", "运动"],
    three_good_things: ["完成项目", "帮助同事", "学习新知识"],
    custom_activities: [{ name: "冥想", value: 15 }],
    journal: "今天过得很有充实感"
};

// Vitality到精力值的映射
export const VITALITY_TO_ENERGY = {
    "需要恢复": 3,
    "正常运转": 5,
    "状态很好": 7,
    "高能日": 9
};

// 数据验证规则
export const DATA_VALIDATION_RULES = {
    sleepDuration: { min: 0, max: 24, required: false },
    sleepQuality: { min: 1, max: 10, required: false },
    exerciseMinutes: { min: 0, max: 300, required: false },
    readingMinutes: { min: 0, max: 480, required: false },
    mood: { min: 1, max: 5, required: false },
    energy: { min: 1, max: 10, required: false }
};

export const CONFIG = {
    YEAR: 2026,
    XUN_COUNT: 36,
    XUN_DAYS: 10,
    LAST_XUN_DAYS: 15, // 最后一旬15天作为年末总结期
    visual: {
        xunHueStep: 10
    },
    macroView: {
        zoomLevel: 'xun',
        heatmapEnabled: true,
        streakEnabled: true
    },
    STORAGE_KEYS: {
        USER_DATA: 'xun_calendar_data_v2',
        MACRO_GOALS: 'xun_macro_goals',
        CUSTOM_EMOTIONS: 'xun_custom_emotions',
        CUSTOM_NOURISHMENTS: 'xun_custom_nourishments',
        SETTINGS: 'xun_settings',
        LAST_VIEWED_XUN: 'xun_last_viewed_index'
    },
    DEFAULT_EMOTIONS: [
        { text: '😄 快乐', value: '快乐' },
        { text: '😆 兴奋', value: '兴奋' },
        { text: '🙏 感激', value: '感激' },
        { text: '🌟 期待', value: '期待' },
        { text: '🦁 自豪', value: '自豪' },
        { text: '💪 充实', value: '充实' },
        { text: '😌 平静', value: '平静' },
        { text: '🧠 专注', value: '专注' },
        { text: '😶‍🌫️ 迷茫', value: '迷茫' },
        { text: '😰 焦虑', value: '焦虑' },
        { text: '😫 疲惫', value: '疲惫' },
        { text: '😠 生气', value: '生气' },
        { text: '🍂 孤独', value: '孤独' },
        { text: '😞 失落', value: '失落' }
    ],
    DEFAULT_NOURISHMENTS: [
        { text: '📚 阅读', value: '阅读' },
        { text: '🧘 冥想', value: '冥想' },
        { text: '🏃 运动', value: '运动' },
        { text: '🥗 健康饮食', value: '健康饮食' },
        { text: '🥚 蛋白质', value: '蛋白质' },
        { text: '🥬 蔬菜', value: '蔬菜' },
        { text: '🌲 大自然', value: '大自然' },
        { text: '☕ 社交', value: '社交' },
        { text: '🎨 创作', value: '创作' }
    ],
    SPECIAL_DATES: {
        '2026-01-01': { name: '元旦', type: 'holiday' },
        '2026-02-17': { name: '春节', type: 'holiday' },
        // Add more 2026 special dates here
    }
};
