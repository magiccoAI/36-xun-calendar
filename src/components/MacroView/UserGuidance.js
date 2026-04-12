export class UserGuidance {
    static createOnboardingFlow() {
        return [
            {
                id: 'welcome',
                title: '欢迎使用36旬日历',
                content: `
                    <div class="space-y-4">
                        <p class="text-gray-700">36旬日历将一年分为36个"旬"，每旬10天，帮助你更好地规划和追踪目标。</p>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-blue-900 mb-2">什么是旬？</h4>
                            <p class="text-blue-800">旬是中国传统的时间单位，每旬10天。一年有36旬，为你提供了一个介于日和月之间的时间管理维度。</p>
                        </div>
                    </div>
                `,
                actions: [
                    { text: '了解旬系统', type: 'info' },
                    { text: '下一步', type: 'next' }
                ]
            },
            {
                id: 'goal-setting',
                title: '设定有效目标',
                content: `
                    <div class="space-y-4">
                        <p class="text-gray-700">每旬设定一个核心目标，让目标更聚焦、更易实现。</p>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-green-900 mb-2">SMART目标原则</h4>
                            <ul class="text-green-800 space-y-1 text-sm">
                                <li><strong>S</strong>pecific - 具体明确</li>
                                <li><strong>M</strong>easurable - 可衡量</li>
                                <li><strong>A</strong>chievable - 可实现</li>
                                <li><strong>R</strong>elevant - 相关性</li>
                                <li><strong>T</strong>ime-bound - 有时限</li>
                            </ul>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-yellow-900 mb-2">示例目标</h4>
                            <div class="text-yellow-800 text-sm">
                                <p class="mb-2">❌ 不好的目标："我要健身"</p>
                                <p>✅ 好的目标："本旬完成5次30分钟的有氧运动"</p>
                            </div>
                        </div>
                    </div>
                `,
                actions: [
                    { text: '查看更多示例', type: 'info' },
                    { text: '开始设定目标', type: 'next' }
                ]
            },
            {
                id: 'daily-checkin',
                title: '每日打卡习惯',
                content: `
                    <div class="space-y-4">
                        <p class="text-gray-700">每天点击进度条完成打卡，建立持续的习惯和动力。</p>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-purple-900 mb-2">打卡的好处</h4>
                            <ul class="text-purple-800 space-y-1 text-sm">
                                <li>📈 建立连续性，看到进步轨迹</li>
                                <li>🎯 增强目标意识，保持专注</li>
                                <li>💪 培养自律，形成习惯</li>
                                <li>📊 数据可视化，便于复盘</li>
                            </ul>
                        </div>
                        <div class="bg-orange-50 p-4 rounded-lg">
                            <h4 class="font-semibold text-orange-900 mb-2">使用技巧</h4>
                            <ul class="text-orange-800 space-y-1 text-sm">
                                <li>⏰ 固定时间打卡，如每天晚上</li>
                                <li>📝 打卡时简单记录当日成果</li>
                                <li>🎉 为连续打卡设置小奖励</li>
                            </ul>
                        </div>
                    </div>
                `,
                actions: [
                    { text: '设置提醒', type: 'action' },
                    { text: '完成设置', type: 'finish' }
                ]
            }
        ];
    }

    static createGoalSuggestions(category = null) {
        const suggestions = {
            health: [
                { title: '运动健身', description: '完成15次运动，每次30分钟', metrics: { type: 'count', target: 15, unit: '次' } },
                { title: '健康饮食', description: '每天吃5份蔬菜水果', metrics: { type: 'daily', target: 5, unit: '份' } },
                { title: '充足睡眠', description: '平均每晚睡眠7小时以上', metrics: { type: 'average', target: 7, unit: '小时' } },
                { title: '体重管理', description: '减重2公斤或维持理想体重', metrics: { type: 'result', target: 2, unit: '公斤' } }
            ],
            career: [
                { title: '技能学习', description: '完成在线课程5个章节', metrics: { type: 'count', target: 5, unit: '章节' } },
                { title: '工作效率', description: '每天专注工作4小时', metrics: { type: 'daily', target: 4, unit: '小时' } },
                { title: '项目推进', description: '完成项目里程碑3个', metrics: { type: 'count', target: 3, unit: '里程碑' } },
                { title: '人脉拓展', description: '联系3位行业同行', metrics: { type: 'count', target: 3, unit: '位' } }
            ],
            personal: [
                { title: '阅读习惯', description: '阅读2本书，每天30分钟', metrics: { type: 'count', target: 2, unit: '本' } },
                { title: '冥想练习', description: '每天冥想15分钟', metrics: { type: 'daily', target: 15, unit: '分钟' } },
                { title: '创意表达', description: '创作5篇作品或练习', metrics: { type: 'count', target: 5, unit: '篇' } },
                { title: '数字排毒', description: '每天减少屏幕时间1小时', metrics: { type: 'daily', target: 1, unit: '小时' } }
            ],
            relationships: [
                { title: '家庭时光', description: '每周3次高质量家庭时间', metrics: { type: 'weekly', target: 3, unit: '次' } },
                { title: '朋友联系', description: '主动联系5位朋友', metrics: { type: 'count', target: 5, unit: '位' } },
                { title: '感恩表达', description: '每天记录3件感恩的事', metrics: { type: 'daily', target: 3, unit: '件' } },
                { title: '志愿服务', description: '参与2次志愿活动', metrics: { type: 'count', target: 2, unit: '次' } }
            ]
        };

        return category ? suggestions[category] || [] : suggestions;
    }

    static createReflectionPrompt(periodIndex, goal, progress) {
        const prompts = [
            {
                id: 'achievement',
                title: '成就回顾',
                questions: [
                    `这旬我最大的成就是什么？`,
                    `哪些时刻让我感到自豪？`,
                    `我学到了什么新技能或知识？`
                ]
            },
            {
                id: 'challenge',
                title: '挑战分析',
                questions: [
                    `遇到了哪些主要挑战？`,
                    `我是如何克服这些困难的？`,
                    `哪些方面还需要改进？`
                ]
            },
            {
                id: 'learning',
                title: '经验总结',
                questions: [
                    `这旬最重要的收获是什么？`,
                    `哪些方法或策略最有效？`,
                    `下次我会做些什么不同的尝试？`
                ]
            },
            {
                id: 'next-steps',
                title: '下步规划',
                questions: [
                    `基于这旬的经验，下旬的目标应该是什么？`,
                    `我需要哪些资源或支持？`,
                    `如何保持这个势头？`
                ]
            }
        ];

        return prompts.map(prompt => ({
            ...prompt,
            contextualized: prompt.questions.map(q => 
                q.replace(/{goal}/g, goal || '这个旬的目标')
                     .replace(/{progress}/g, `${progress.checkedCount}/${progress.totalCount}`)
            )
        }));
    }

    static generateGoalTemplate(category) {
        const templates = {
            health: '本旬我将[具体行动]，目标是[可衡量的结果]，预计在10天内完成。',
            career: '本旬我将专注于[具体技能/项目]，通过[具体方法]来提升[具体指标]。',
            personal: '本旬我将培养[具体习惯]，每天[具体行动]，持续10天来改善[具体方面]。',
            relationships: '本旬我将加强与[具体人群]的联系，通过[具体行动]来增进[具体关系]。'
        };

        return templates[category] || templates.personal;
    }

    static createMotivationalQuote() {
        const quotes = [
            { text: '千里之行，始于足下。', author: '老子' },
            { text: '不积跬步，无以至千里。', author: '荀子' },
            { text: '业精于勤，荒于嬉。', author: '韩愈' },
            { text: '天行健，君子以自强不息。', author: '《周易》' },
            { text: '博学之，审问之，慎思之，明辨之，笃行之。', author: '《礼记》' },
            { text: '路虽远，行则将至；事虽难，做则必成。', author: '古语' },
            { text: '水滴石穿，非一日之功。', author: '古语' },
            { text: '锲而不舍，金石可镂。', author: '荀子' }
        ];

        return quotes[Math.floor(Math.random() * quotes.length)];
    }
}
