// 测试脚本：为当前旬添加三件好事测试数据
(function() {
    const store = window.store || (window.app && window.app.store);
    if (!store) {
        console.error('Store not found');
        return;
    }

    // 获取当前旬
    const state = store.getState();
    const currentXunIndex = state.viewedXunIndex || 1;
    
    // 创建测试数据
    const testData = {
        '2026-01-01': {
            mood: 5,
            three_good_things: [
                '早上喝到了一杯很香的咖啡，开启了美好的一天',
                '和朋友视频聊天，分享了很多有趣的事情',
                '晚上散步时看到了美丽的夕阳'
            ]
        },
        '2026-01-02': {
            mood: 4,
            three_good_things: [
                '完成了一个重要的工作任务',
                '收到了家人的关心信息',
                '尝试了一家新的餐厅，味道很棒'
            ]
        },
        '2026-01-03': {
            mood: 5,
            three_good_things: [
                '读到了一本好书，学到了新知识',
                '帮助了同事解决了一个技术问题',
                '晚上做了瑜伽，身心都得到了放松'
            ]
        },
        '2026-01-04': {
            mood: 4,
            three_good_things: [
                '天气很好，心情也很愉快',
                '买到了心仪已久的物品',
                '和朋友一起看了电影，很开心'
            ]
        },
        '2026-01-05': {
            mood: 5,
            three_good_things: [
                '早上被鸟叫声唤醒，很自然',
                '工作中得到了领导的表扬',
                '晚上和家人一起吃饭，很温馨'
            ]
        }
    };

    // 更新数据
    const userData = { ...state.userData, ...testData };
    store.setState({ userData });
    
    console.log('测试数据已添加，请查看本旬小结页面');
    console.log('测试数据包含：', Object.keys(testData).length, '天的三件好事记录');
})();
