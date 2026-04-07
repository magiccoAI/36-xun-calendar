// GitHub Pages 缓存破坏和数据保护工具
// 在浏览器控制台中运行此脚本

(function() {
    console.log('🔄 GitHub Pages 缓存破坏工具启动');
    
    // 1. 备份当前 localStorage 数据
    const backupData = {};
    const keysToBackup = [
        'moneyObservationDrafts',
        'moneyObservationSummaries', 
        'moneyUserIntentions',
        'currentXunPeriod',
        'moneyAwarenessFormData'
    ];
    
    keysToBackup.forEach(key => {
        backupData[key] = localStorage.getItem(key);
    });
    
    console.log('✅ 数据已备份:', backupData);
    
    // 2. 添加版本参数到 URL
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('v', '20260403-01');
    currentUrl.searchParams.set('cache_bust', Date.now());
    
    console.log('🌐 建议访问的URL:', currentUrl.toString());
    
    // 3. 创建恢复函数
    window.restoreLocalStorage = function() {
        console.log('🔄 恢复 localStorage 数据...');
        keysToBackup.forEach(key => {
            if (backupData[key] !== null) {
                localStorage.setItem(key, backupData[key]);
                console.log(`✅ 已恢复: ${key}`);
            }
        });
        console.log('🎉 数据恢复完成！');
    };
    
    // 4. 创建数据导出功能
    window.exportMoneyData = function() {
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `money-data-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('💾 数据已导出');
    };
    
    // 5. 自动恢复（如果检测到版本参数）
    if (currentUrl.searchParams.has('v')) {
        setTimeout(() => {
            console.log('🔄 检测到版本参数，自动恢复数据...');
            restoreLocalStorage();
        }, 1000);
    }
    
    console.log('🛠️ 工具已加载！');
    console.log('📋 可用命令:');
    console.log('- restoreLocalStorage() - 恢复备份数据');
    console.log('- exportMoneyData() - 导出数据到文件');
})();
