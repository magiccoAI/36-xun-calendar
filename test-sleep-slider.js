// 测试睡眠滑块功能
(function() {
    console.log('=== 测试睡眠滑块功能 ===');
    
    // 检查 SleepSlider 是否正确加载
    if (typeof SleepSlider !== 'undefined') {
        console.log('✓ SleepSlider 类已定义');
    } else {
        console.log('✗ SleepSlider 类未找到');
        return;
    }
    
    // 检查 DOM 元素是否存在
    const requiredElements = [
        'bedtime-slider',
        'wakeuptime-slider', 
        'bedtime-handle',
        'wakeuptime-handle',
        'sleep-range-track',
        'bedtime-display',
        'wakeuptime-display',
        'sleep-duration-display'
    ];
    
    let allElementsExist = true;
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✓ ${id} 元素存在`);
        } else {
            console.log(`✗ ${id} 元素缺失`);
            allElementsExist = false;
        }
    });
    
    if (!allElementsExist) {
        console.log('部分必需元素缺失，请检查 HTML 结构');
        return;
    }
    
    // 检查睡眠质量按钮
    const qualityButtons = document.querySelectorAll('.sleep-quality-btn');
    if (qualityButtons.length === 3) {
        console.log('✓ 睡眠质量按钮存在');
    } else {
        console.log('✗ 睡眠质量按钮数量不正确');
    }
    
    // 测试数据结构
    const testSleepData = {
        bedtime: '23:30',
        wakeUpTime: '07:00',
        totalHours: 7.5,
        quality: 'excellent'
    };
    
    console.log('测试数据结构:', testSleepData);
    
    // 检查 Modal 是否包含 SleepSlider
    setTimeout(() => {
        if (window.modal && window.modal.sleepSlider) {
            console.log('✓ Modal 已集成 SleepSlider');
            
            // 测试获取睡眠数据
            const sleepData = window.modal.sleepSlider.getSleepData();
            console.log('当前睡眠数据:', sleepData);
        } else {
            console.log('✗ Modal 未集成 SleepSlider');
        }
    }, 1000);
    
    console.log('=== 测试完成 ===');
})();
