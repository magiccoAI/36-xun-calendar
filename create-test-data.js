// 创建当前旬期的金钱观察测试数据
const CONFIG = { YEAR: 2026 };

// 模拟 Calendar 类
const Calendar = {
    getXunPeriods: (year) => {
        const periods = [];
        let periodIndex = 1;
        
        for (let quarter = 1; quarter <= 4; quarter++) {
            for (let xun = 1; xun <= 9; xun++) {
                const startMonth = (quarter - 1) * 3 + 1;
                const startDay = (xun - 1) * 10 + 1;
                const startDate = new Date(year, startMonth - 1, startDay);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 9);
                
                periods.push({
                    index: periodIndex++,
                    year,
                    quarter,
                    xun,
                    startDate,
                    endDate,
                    label: `Q${quarter}-X${xun}`
                });
            }
        }
        
        return periods;
    },

    getCurrentXun: (periods) => {
        if (!periods || !Array.isArray(periods)) {
            return null;
        }
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
        
        for (const period of periods) {
            if (today >= period.startDate && today <= period.endDate) {
                return period;
            }
        }
        
        return null;
    }
};

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 创建测试数据
function createTestDataForCurrentXun() {
    console.log('Creating test data for current xun...');
    
    // 获取当前旬期
    const periods = Calendar.getXunPeriods(CONFIG.YEAR);
    const currentXun = Calendar.getCurrentXun(periods);
    
    if (!currentXun) {
        console.error('Could not determine current xun');
        return;
    }
    
    console.log('Current xun:', currentXun);
    
    // 生成这个旬期的日期
    const dates = [];
    for (let i = 0; i < 10; i++) {
        const date = new Date(currentXun.startDate);
        date.setDate(currentXun.startDate.getDate() + i);
        dates.push(formatDate(date));
    }
    
    console.log('Dates for current xun:', dates);
    
    // 创建测试记录
    const testRecords = [
        {
            step1: ['花掉的一笔'],
            step2: {
                lifeSupport: ['让生活正常运转'],
                selfState: '在维持生活的我',
                breathFeeling: '平稳的'
            },
            step3: '我愿意继续',
            customText: '今天买了午餐，感觉很正常',
            summary: '今天的钱主要在维持生活的基本运转，在帮「当下的基本运转」。如果成为常态，我愿意让它继续。',
            step: 3,
            timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000
        },
        {
            step1: ['赚到的一笔'],
            step2: {
                lifeSupport: ['往长远处走'],
                selfState: '在推进未来的我',
                breathFeeling: '舒展的'
            },
            step3: '我愿意继续',
            customText: '接到了一个自由职业项目',
            summary: '今天的钱主要在投资未来，在帮「未来的我」成长。如果成为常态，我愿意让它继续。',
            step: 3,
            timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
        },
        {
            step1: ['留下来的一笔'],
            step2: {
                lifeSupport: ['给自己一点空间'],
                selfState: '在照顾当下的我',
                breathFeeling: '留神的'
            },
            step3: '我希望调整一点',
            customText: '存了一笔钱，但感觉有点紧张',
            summary: '今天的钱主要在为自己创造空间，支持身心的疗愈，在帮「此刻的我」喘口气。如果成为常态，我想稍微调整一下。',
            step: 3,
            timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
        },
        {
            step1: ['换时间的一笔'],
            step2: {
                lifeSupport: ['帮我省出时间'],
                selfState: '在照顾当下的我',
                breathFeeling: '平稳的'
            },
            step3: '我愿意继续',
            customText: '打车回家，节省了时间',
            summary: '今天的钱主要在换取时间，提升生活的效率，在帮「此刻的我」喘口气。如果成为常态，我愿意让它继续。',
            step: 3,
            timestamp: Date.now()
        }
    ];
    
    // 保存数据到 localStorage
    let savedCount = 0;
    dates.forEach((date, index) => {
        if (index < testRecords.length) {
            const key = `moneyObservationDraft_${date}`;
            localStorage.setItem(key, JSON.stringify(testRecords[index]));
            console.log(`Saved test data for ${date}:`, testRecords[index]);
            savedCount++;
        }
    });
    
    console.log(`Created ${savedCount} test records for current xun`);
    alert(`已创建 ${savedCount} 条当前旬期的测试数据！`);
}

// 如果在浏览器环境中，绑定到全局
if (typeof window !== 'undefined') {
    window.createTestDataForCurrentXun = createTestDataForCurrentXun;
}

// 如果在 Node.js 环境中，导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createTestDataForCurrentXun };
}
