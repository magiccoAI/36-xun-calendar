
export const CONFIG = {
    YEAR: 2026,
    XUN_COUNT: 36,
    XUN_DAYS: 10,
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
