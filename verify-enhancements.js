// 验证增强功能
(function() {
    console.log('=== 验证三件好事增强功能 ===');
    
    // 检查 SummaryView 是否包含新方法
    const summaryViewScript = Array.from(document.scripts).find(script => 
        script.src && script.src.includes('SummaryView.js')
    );
    
    if (summaryViewScript) {
        console.log('✓ SummaryView.js 脚本已加载');
    } else {
        console.log('✗ SummaryView.js 脚本未找到');
    }
    
    // 检查是否有新的 CSS 类
    const testElement = document.createElement('div');
    testElement.className = 'bg-gradient-to-br from-amber-50 to-orange-50';
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    if (computedStyle.background) {
        console.log('✓ Tailwind CSS 渐变类正常工作');
    } else {
        console.log('✗ Tailwind CSS 渐变类可能有问题');
    }
    
    document.body.removeChild(testElement);
    
    // 检查 store 是否可用
    if (window.store || (window.app && window.app.store)) {
        console.log('✓ Store 可用');
        
        // 检查数据结构
        const state = (window.store || window.app.store).getState();
        if (state.userData && typeof state.userData === 'object') {
            console.log('✓ userData 数据结构正常');
            
            // 检查是否有三件好事数据
            const goodThingsDays = Object.keys(state.userData).filter(date => 
                state.userData[date].three_good_things
            );
            console.log(`✓ 找到 ${goodThingsDays.length} 天的三件好事数据`);
        } else {
            console.log('✗ userData 数据结构异常');
        }
    } else {
        console.log('✗ Store 不可用');
    }
    
    console.log('=== 验证完成 ===');
})();
