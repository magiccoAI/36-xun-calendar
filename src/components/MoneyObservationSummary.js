// 金钱观察数据聚合器
import { Calendar } from '../core/Calendar.js';
import { CONFIG } from '../config.js';

class MoneyObservationSummary {
  constructor() {
    this.xunPeriod = null;
    this.records = [];
  }

  // 获取当前旬期的日期范围
  getXunDateRange(xunPeriod) {
    // 如果没有指定旬期，使用最近10天
    if (!xunPeriod) {
      const dates = [];
      for (let i = 9; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(this.formatDate(date));
      }
      return dates;
    }

    // 使用与主系统一致的旬期计算逻辑
    try {
      // 使用Calendar获取旬期信息
      const periods = Calendar.getXunPeriods(CONFIG.YEAR);
      const targetPeriod = periods.find(p => {
        // 将旬期索引转换为字符串格式匹配
        const quarter = Math.ceil(p.index / 3);
        const xun = ((p.index - 1) % 3) + 1;
        const xunStr = `${CONFIG.YEAR}-Q${quarter}-X${xun}`;
        return xunStr === xunPeriod;
      });
      
      if (targetPeriod) {
        const dates = [];
        for (let i = 0; i < 10; i++) {
          const date = new Date(targetPeriod.startDate);
          date.setDate(targetPeriod.startDate.getDate() + i);
          dates.push(this.formatDate(date));
        }
        console.log(`Generated date range for ${xunPeriod} using Calendar:`, dates);
        return dates;
      }
    } catch (error) {
      console.warn('Failed to use Calendar for date range, falling back to manual calculation:', error);
    }

    // 降级方案：手动解析旬期格式
    const [year, quarter, xun] = xunPeriod.split('-');
    const yearNum = parseInt(year);
    const quarterNum = parseInt(quarter.replace('Q', ''));
    const xunNum = parseInt(xun.replace('X', ''));
    
    // 计算全局旬索引（1-36）
    const globalXunIndex = (quarterNum - 1) * 3 + xunNum;
    
    // 使用与Calendar相同的计算逻辑
    const yearStart = new Date(yearNum, 0, 1);
    const daysFromStart = (globalXunIndex - 1) * 10;
    const startDate = new Date(yearStart);
    startDate.setDate(yearStart.getDate() + daysFromStart);
    
    // 生成这个旬期的10天日期
    const dates = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(this.formatDate(date));
    }
    
    console.log(`Generated date range for ${xunPeriod} (manual):`, dates);
    return dates;
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 聚合核心数据结构
  getAggregatedData() {
    return {
      // 区块A：记录概览
      overview: {
        recordedDays: 0,
        totalDays: 10,
        completionRate: 0
      },

      // 区块B：钱的流动地图
      flowMap: {
        flowTypes: {
          '花掉的一笔': 0,
          '赚到的一笔': 0,
          '留下来的一笔': 0,
          '投出去的一笔': 0,
          '换时间的一笔': 0,
          '换收入的一笔': 0
        },
        lifePurposes: {
          '往长远处走': 0,
          '让生活正常运转': 0,
          '维系重要关系': 0,
          '去看看世界': 0,
          '给自己一点空间': 0,
          '帮我省出时间': 0
        },
        topLifePurpose: null
      },

      // 区块C：呼吸感曲线
      breathingCurve: {
        dailyValues: [],
        distribution: {
          '舒展的': 0,
          '平稳的': 0,
          '留神的': 0,
          '收紧的': 0,
          '憋闷的': 0
        },
        averageScore: 0
      },

      // 区块D：三个版本的我
      selfStateAnalysis: {
        selfStates: {
          '在推进未来的我': 0,
          '在维持生活的我': 0,
          '在照顾当下的我': 0
        },
        continueWill: {
          '我愿意继续': 0,
          '我希望调整一点': 0,
          '我不希望继续': 0
        },
        insight: {
          hasInsight: false,
          triggerConditions: []
        }
      },

      // 区块E：觉察沉淀
      reflection: {
        autoSummary: '',
        userIntentions: '',
        recommendedTags: []
      }
    };
  }

  // 数据聚合方法
  aggregateRecords(dailyRecords) {
    const aggregated = this.getAggregatedData();
    
    // 使用所有记录，不再过滤，让每个记录贡献其已有的数据
    const validRecords = dailyRecords.filter(record => record);
    
    aggregated.overview.recordedDays = validRecords.length;
    aggregated.overview.completionRate = validRecords.length / 10;

    // 聚合各类数据
    validRecords.forEach((record, index) => {
      // 流动类型统计
      if (record.step1 && Array.isArray(record.step1)) {
        record.step1.forEach(flowType => {
          if (aggregated.flowMap.flowTypes.hasOwnProperty(flowType)) {
            aggregated.flowMap.flowTypes[flowType]++;
          }
        });
      }

      // 生活用途统计
      if (record.step2 && record.step2.lifeSupport && Array.isArray(record.step2.lifeSupport)) {
        record.step2.lifeSupport.forEach(purpose => {
          if (aggregated.flowMap.lifePurposes.hasOwnProperty(purpose)) {
            aggregated.flowMap.lifePurposes[purpose]++;
          }
        });
      }

      // 呼吸感映射和统计
      if (record.step2 && record.step2.breathFeeling) {
        const breathScore = this.mapBreathingToScore(record.step2.breathFeeling);
        aggregated.breathingCurve.dailyValues.push({
          day: index + 1,
          value: breathScore,
          label: record.step2.breathFeeling
        });
        
        if (aggregated.breathingCurve.distribution.hasOwnProperty(record.step2.breathFeeling)) {
          aggregated.breathingCurve.distribution[record.step2.breathFeeling]++;
        }
      }

      // 自我状态统计
      if (record.step2 && record.step2.selfState) {
        if (aggregated.selfStateAnalysis.selfStates.hasOwnProperty(record.step2.selfState)) {
          aggregated.selfStateAnalysis.selfStates[record.step2.selfState]++;
        }
      }

      // 继续意愿统计
      if (record.step3) {
        if (aggregated.selfStateAnalysis.continueWill.hasOwnProperty(record.step3)) {
          aggregated.selfStateAnalysis.continueWill[record.step3]++;
        }
      }
    });

    // 计算衍生数据
    this.calculateDerivedData(aggregated);
    
    return aggregated;
  }

  // 呼吸感映射为数值
  mapBreathingToScore(breathFeeling) {
    const mapping = {
      '舒展的': 5,
      '平稳的': 4,
      '留神的': 3,
      '收紧的': 2,
      '憋闷的': 1
    };
    return mapping[breathFeeling] || 3;
  }

  // 计算衍生数据
  calculateDerivedData(aggregated) {
    // 找出最高频的生活用途
    let maxCount = 0;
    Object.entries(aggregated.flowMap.lifePurposes).forEach(([purpose, count]) => {
      if (count > maxCount) {
        maxCount = count;
        aggregated.flowMap.topLifePurpose = purpose;
      }
    });

    // 计算呼吸感平均分
    const totalScore = aggregated.breathingCurve.dailyValues.reduce((sum, item) => sum + item.value, 0);
    aggregated.breathingCurve.averageScore = totalScore / aggregated.breathingCurve.dailyValues.length || 0;

    // 检查洞察条件
    this.checkInsightConditions(aggregated);

    // 生成自动总结
    aggregated.reflection.autoSummary = this.generateAutoSummary(aggregated);
    
    // 生成推荐标签
    aggregated.reflection.recommendedTags = this.generateRecommendedTags(aggregated);
  }

  // 检查洞察条件
  checkInsightConditions(aggregated) {
    const conditions = [];
    
    // 检查特定组合：希望调整 + 照顾当下 + 留神
    const validRecords = this.records || [];
    const hasSpecificPattern = validRecords.some(record => 
      record.step3 === '我希望调整一点' &&
      record.step2 && record.step2.selfState === '在照顾当下的我' &&
      record.step2 && record.step2.breathFeeling === '留神的'
    );

    if (hasSpecificPattern) {
      aggregated.selfStateAnalysis.insight.hasInsight = true;
      conditions.push('调整意愿与当下状态的觉察');
    }

    aggregated.selfStateAnalysis.insight.triggerConditions = conditions;
  }

  // 生成自动总结 - 使用温暖、非评判性的语言
  generateAutoSummary(aggregated) {
    const { overview, flowMap, breathingCurve, selfStateAnalysis } = aggregated;
    
    if (overview.recordedDays < 3) {
      return `这一旬你记录了${overview.recordedDays}天的金钱观察，每一次记录都是与自己对话的开始。`;
    }

    const topPurpose = flowMap.topLifePurpose ? this.getLifePurposeDescription(flowMap.topLifePurpose) : '生活的某个方面';
    const avgBreathing = this.getBreathingDescription(breathingCurve.averageScore);
    const willingRatio = selfStateAnalysis.continueWill['我愿意继续'] / overview.recordedDays;
    const willingDesc = willingRatio > 0.6 ? '比较接纳' : willingRatio > 0.3 ? '有些思考' : '想要调整';

    return `这一旬你记录了${overview.recordedDays}天，看见钱主要在${topPurpose}，呼吸感总体${avgBreathing}，对用钱方式整体${willingDesc}。`;
  }

  // 获取呼吸感描述 - 更温暖的表达
  getBreathingDescription(score) {
    if (score >= 4.5) return '比较舒展，内心有余裕';
    if (score >= 3.5) return '相对平稳，状态安定';
    if (score >= 2.5) return '需要留意，开始觉察';
    return '有些压力，需要更多关照';
  }

  // 获取生活用途的温暖描述
  getLifePurposeDescription(purpose) {
    const descriptions = {
      '往长远处走': '为未来的自己投资',
      '让生活正常运转': '支持着生活的基本运转',
      '维系重要关系': '滋养着重要的人际关系',
      '去看看世界': '支持着探索世界的愿望',
      '给自己一点空间': '为自己创造疗愈空间',
      '帮我省出时间': '换取宝贵的时间与自由'
    };
    return descriptions[purpose] || '支持着生活的某个方面';
  }

  // 生成推荐标签
  generateRecommendedTags(aggregated) {
    const tags = [];
    const { flowMap, selfStateAnalysis } = aggregated;

    // 基于缺失的流动类型推荐
    if (flowMap.flowTypes['赚到的一笔'] === 0) {
      tags.push('多留意赚到的部分');
    }
    if (flowMap.flowTypes['留下来的一笔'] === 0) {
      tags.push('关注存钱的机会');
    }
    if (flowMap.flowTypes['投出去的一笔'] === 0) {
      tags.push('探索投资的可能性');
    }

    // 基于自我状态推荐
    const totalStates = Object.values(selfStateAnalysis.selfStates).reduce((sum, count) => sum + count, 0);
    if (totalStates > 0 && selfStateAnalysis.selfStates['在推进未来的我'] / totalStates < 0.2) {
      tags.push('给未来更多投资');
    }

    return tags.slice(0, 3);
  }

  // 获取金钱观察记录
  getMoneyRecords() {
    const dates = this.getXunDateRange(this.xunPeriod);
    const records = [];
    
    console.log(`Getting money records for period: ${this.xunPeriod}, checking dates:`, dates);
    
    dates.forEach(date => {
      const key = `moneyObservationDraft_${date}`;
      const data = localStorage.getItem(key);
      console.log(`Checking key: ${key}, data exists: ${!!data}`);
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`Parsed data for ${date}:`, parsed);
          
          // 检查是否是有效的记录（有任何实际数据就认为是有效记录）
          if (parsed.step1 || parsed.step2 || parsed.step3 || parsed.completed) { 
            records.push({
              date,
              ...parsed
            });
            console.log(`Added valid record for ${date}`);
          } else {
            console.log(`Skipped empty record for ${date} (no meaningful data)`);
          }
        } catch (error) {
          console.warn(`Failed to parse money record for ${date}:`, error);
        }
      }
    });
    
    this.records = records;
    console.log(`Total records found: ${records.length}`, records);
    return records;
  }

  // 获取聚合数据
  getSummaryData() {
    const records = this.getMoneyRecords();
    return this.aggregateRecords(records);
  }
}

// 数据存储工具类
class MoneyDataRepository {
  static getDailyRecords(xunPeriod) {
    const aggregator = new MoneyObservationSummary();
    aggregator.xunPeriod = xunPeriod;
    return aggregator.getMoneyRecords();
  }

  static saveXunSummary(xunPeriod, summaryData) {
    const key = `moneyObservationSummary_${xunPeriod}`;
    localStorage.setItem(key, JSON.stringify({
      ...summaryData,
      savedAt: Date.now()
    }));
  }

  static getXunSummary(xunPeriod) {
    const key = `moneyObservationSummary_${xunPeriod}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static saveUserIntentions(xunPeriod, intentions) {
    const key = `moneyUserIntentions_${xunPeriod}`;
    localStorage.setItem(key, JSON.stringify({
      intentions,
      savedAt: Date.now()
    }));
  }
}

// 区块A：记录概览
class OverviewSection {
  render(data) {
    const { recordedDays, totalDays, completionRate } = data.overview;
    
    return `
      <section class="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl p-8 shadow-lg border-0 border-amber-100">
        <div class="text-center space-y-6">
          <div class="space-y-2">
            <h3 class="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
              <span class="text-2xl">💰</span>
              这一旬的金钱观察
            </h3>
            <p class="text-sm text-gray-600">每一笔记录，都是与自己的对话</p>
          </div>
          
          <!-- 10个圆点指示器 - 更温暖的设计 -->
          <div class="flex justify-center gap-3">
            ${Array.from({length: totalDays}, (_, i) => `
              <div class="relative group">
                <div class="w-4 h-4 rounded-full transition-all duration-500 transform hover:scale-110 ${
                  i < recordedDays 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-400 shadow-md' 
                    : 'bg-gray-100 border-2 border-gray-300'
                }" 
                title="第${i + 1}天${i < recordedDays ? ' - 已记录' : ' - 未记录'}">
                  ${i < recordedDays ? '<div class="absolute inset-0 rounded-full bg-amber-300 animate-pulse opacity-50"></div>' : ''}
                </div>
                <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ${i + 1}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="space-y-3">
            <div class="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              ${recordedDays}/${totalDays}
            </div>
            <p class="text-sm text-gray-700 leading-relaxed max-w-xs mx-auto">
              ${this.generateWarmDescription(recordedDays, totalDays)}
            </p>
          </div>
        </div>
      </section>
    `;
  }

  generateWarmDescription(recordedDays, totalDays) {
    const rate = recordedDays / totalDays;
    if (rate === 1) return '真好！你记录了这一旬的每一天，每一笔都是与自己的对话';
    if (rate >= 0.8) return '很棒！你几乎记录了这一旬的大部分时光，看见了自己与钱的关系';
    if (rate >= 0.5) return '不错！你记录了这一旬的一半以上，每一次记录都是觉察的开始';
    if (rate >= 0.3) return '继续加油，多记录会看见更多关于自己的模式';
    return '刚开始记录，每一笔都是了解自己的机会';
  }
}

// 区块B：钱的流动地图
class FlowMapSection {
  render(data) {
    const { flowTypes, lifePurposes, topLifePurpose } = data.flowMap;
    const recordedDays = data.overview.recordedDays;
    
    if (recordedDays === 0) {
      return `
        <section class="bg-white rounded-3xl p-8 shadow-lg border-0">
          <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-xl">🗺️</span>
            钱的流动地图
          </h3>
          <div class="text-center py-12 text-gray-500">
            <div class="text-4xl mb-4">🌱</div>
            <p class="text-sm font-medium text-gray-700 mb-2">还没有金钱观察记录</p>
            <p class="text-xs text-gray-500 max-w-xs mx-auto">开始记录后，这里会显示你与钱的关系模式，每一笔都是了解自己的机会</p>
          </div>
        </section>
      `;
    }
    
    return `
      <section class="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-8 flex items-center gap-2">
          <span class="text-xl">🗺️</span>
          钱的流动地图
        </h3>
        
        <!-- 流动类型条形图 -->
        <div class="space-y-6 mb-10">
          <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span class="w-2 h-2 bg-amber-400 rounded-full"></span>
            钱的流动类型
          </h4>
          <div class="space-y-4">
            ${Object.entries(flowTypes).map(([type, count]) => `
              <div class="flex items-center gap-4">
                <span class="text-sm text-gray-600 min-w-[90px] font-medium">${type}</span>
                <div class="flex-1 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-full h-3 relative overflow-hidden shadow-inner">
                  <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 rounded-full transition-all duration-700 ease-out shadow-sm"
                       style="width: ${this.calculatePercentage(count, recordedDays)}%"></div>
                </div>
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center shadow-sm">
                  <span class="text-xs font-bold text-amber-700">${count}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 生活用途气泡图 -->
        <div class="space-y-6">
          <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
            支持的生活领域
          </h4>
          <div class="flex flex-wrap gap-4 justify-center items-center min-h-[140px]">
            ${Object.entries(lifePurposes).map(([purpose, count]) => `
              <div class="relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div class="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-0 flex items-center justify-center shadow-sm"
                     style="width: ${this.calculateBubbleSize(count, recordedDays)}px; 
                            height: ${this.calculateBubbleSize(count, recordedDays)}px">
                  <div class="text-center">
                    <span class="text-xs font-semibold text-gray-700 block mb-1">${this.shortenPurpose(purpose)}</span>
                    <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center mx-auto">
                      <span class="text-sm font-bold text-blue-700">${count}</span>
                    </div>
                  </div>
                </div>
                <div class="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                  ${purpose}
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- 动态文案 -->
          ${topLifePurpose ? `
            <div class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-0 shadow-sm">
              <p class="text-sm text-gray-700 leading-relaxed">
                <span class="text-blue-600 font-semibold">💡 看见：</span>
                ${this.generatePurposeDescription(topLifePurpose)}
              </p>
            </div>
          ` : ''}
        </div>
      </section>
    `;
  }

  calculatePercentage(count, total) {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  calculateBubbleSize(count, total) {
    if (total === 0) return 60;
    const ratio = count / total;
    const minSize = 60;
    const maxSize = 120;
    return minSize + (maxSize - minSize) * ratio;
  }

  shortenPurpose(purpose) {
    const mapping = {
      '往长远处走': '长远',
      '让生活正常运转': '运转',
      '维系重要关系': '关系',
      '去看看世界': '世界',
      '给自己一点空间': '空间',
      '帮我省出时间': '省时'
    };
    return mapping[purpose] || purpose.slice(0, 4);
  }

  generatePurposeDescription(purpose) {
    const descriptions = {
      '往长远处走': '看见你的钱主要在为未来投资，支持着长远的发展',
      '让生活正常运转': '看见你的钱主要在支持生活的基本运转，维持日常的安定',
      '维系重要关系': '看见你的钱主要在维系重要的人际关系，滋养着情感连接',
      '去看看世界': '看见你的钱主要在支持探索世界的愿望，扩展生命的边界',
      '给自己一点空间': '看见你的钱主要在为自己创造空间，支持身心的疗愈',
      '帮我省出时间': '看见你的钱主要在换取时间，提升生活的自由度'
    };
    return descriptions[purpose] || '看见你的钱在支持着生活的某个重要方面';
  }
}

// 区块C：呼吸感曲线
class BreathingCurveSection {
  render(data) {
    const { dailyValues, distribution, averageScore } = data.breathingCurve;
    const recordedDays = data.overview.recordedDays;
    
    if (recordedDays === 0) {
      return `
        <section class="bg-white rounded-3xl p-8 shadow-lg border-0">
          <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-xl">🌊</span>
            呼吸感曲线
          </h3>
          <div class="text-center py-12 text-gray-500">
            <div class="text-4xl mb-4">🍃</div>
            <p class="text-sm font-medium text-gray-700 mb-2">还没有呼吸感记录</p>
            <p class="text-xs text-gray-500 max-w-xs mx-auto">开始记录后，这里会显示你与钱相处时的内心状态变化</p>
          </div>
        </section>
      `;
    }
    
    return `
      <section class="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-8 flex items-center gap-2">
          <span class="text-xl">🌊</span>
          呼吸感曲线
        </h3>
        
        <!-- 简化的曲线图 -->
        <div class="mb-8">
          <div class="relative h-40 bg-gradient-to-b from-green-50 via-emerald-50 to-white rounded-2xl p-6 shadow-inner">
            <div class="flex items-end justify-between h-full gap-2">
              ${dailyValues.map((point, index) => `
                <div class="flex-1 flex flex-col items-center justify-end group">
                  <div class="w-full bg-gradient-to-t from-green-300 via-emerald-300 to-green-200 rounded-t-lg transition-all duration-500 hover:shadow-lg relative"
                       style="height: ${(point.value / 5) * 100}%">
                    <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${point.label}
                    </div>
                  </div>
                  <div class="w-4 h-4 rounded-full bg-gradient-to-br from-green-200 to-emerald-200 mt-2 shadow-sm"></div>
                  <span class="text-xs text-gray-500 mt-1 font-medium">${index + 1}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 分布统计 -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span class="w-2 h-2 bg-green-400 rounded-full"></span>
            呼吸感分布
          </h4>
          <div class="grid grid-cols-5 gap-3">
            ${Object.entries(distribution).map(([feeling, count]) => `
              <div class="text-center p-3 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-0 transition-all duration-300 hover:shadow-md hover:scale-105">
                <div class="text-2xl mb-2">${this.getEmojiByFeeling(feeling)}</div>
                <div class="text-xs text-gray-600 font-medium mb-1">${this.shortenFeeling(feeling)}</div>
                <div class="w-6 h-6 rounded-full bg-gradient-to-br from-green-200 to-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                  <span class="text-xs font-bold text-green-700">${count}</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-0 shadow-sm">
            <p class="text-sm text-gray-700 leading-relaxed">
              <span class="text-green-600 font-semibold">💫 平均状态：</span>
              ${this.getBreathingDescription(averageScore)}
            </p>
          </div>
        </div>
      </section>
    `;
  }

  getEmojiByFeeling(feeling) {
    const emojiMap = {
      '舒展的': '😊',
      '平稳的': '🙂',
      '留神的': '😐',
      '收紧的': '😟',
      '憋闷的': '😫'
    };
    return emojiMap[feeling] || '😐';
  }

  shortenFeeling(feeling) {
    return feeling.replace('的', '');
  }

  getBreathingDescription(score) {
    if (score >= 4.5) return '呼吸感比较舒展，内心似乎有余裕';
    if (score >= 3.5) return '呼吸感相对平稳，状态看起来安定';
    if (score >= 2.5) return '呼吸感需要留意，开始有了觉察';
    return '呼吸感有些压力，也许需要更多关照';
  }
}

// 区块D：三个版本的我
class SelfStateSection {
  render(data) {
    const { selfStates, continueWill, insight } = data.selfStateAnalysis;
    const recordedDays = data.overview.recordedDays;
    
    if (recordedDays === 0) {
      return `
        <section class="bg-white rounded-3xl p-8 shadow-lg border-0">
          <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span class="text-xl">🪞</span>
            三个版本的我
          </h3>
          <div class="text-center py-12 text-gray-500">
            <div class="text-4xl mb-4">🌟</div>
            <p class="text-sm font-medium text-gray-700 mb-2">还没有自我状态记录</p>
            <p class="text-xs text-gray-500 max-w-xs mx-auto">开始记录后，这里会显示你在不同时刻的状态分布</p>
          </div>
        </section>
      `;
    }
    
    return `
      <section class="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-8 flex items-center gap-2">
          <span class="text-xl">🪞</span>
          三个版本的我
        </h3>
        
        <!-- 自我状态进度条 -->
        <div class="space-y-6 mb-10">
          <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span class="w-2 h-2 bg-purple-400 rounded-full"></span>
            自我状态分布
          </h4>
          <div class="space-y-4">
            ${Object.entries(selfStates).map(([state, count]) => `
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-700 font-medium">${this.shortenState(state)}</span>
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shadow-sm">
                    <span class="text-xs font-bold text-purple-700">${count}</span>
                  </div>
                </div>
                <div class="w-full bg-gradient-to-r from-purple-50 to-indigo-50 rounded-full h-3 shadow-inner">
                  <div class="bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-400 h-3 rounded-full transition-all duration-700 shadow-sm"
                       style="width: ${this.calculatePercentage(count, recordedDays)}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 继续意愿分布 -->
        <div class="space-y-6 mb-8">
          <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span class="w-2 h-2 bg-pink-400 rounded-full"></span>
            继续意愿分布
          </h4>
          <div class="grid grid-cols-3 gap-4">
            ${Object.entries(continueWill).map(([willing, count]) => `
              <div class="text-center p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border-0 transition-all duration-300 hover:shadow-md hover:scale-105">
                <div class="text-sm text-gray-700 mb-2 font-medium">${this.shortenWilling(willing)}</div>
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center mx-auto shadow-sm">
                  <span class="text-sm font-bold text-purple-700">${count}</span>
                </div>
                <div class="text-xs text-gray-500 mt-2">${this.calculatePercentage(count, recordedDays)}%</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 洞察卡片 -->
        ${insight.hasInsight ? this.renderInsightCard(insight) : ''}
      </section>
    `;
  }

  renderInsightCard(insight) {
    return `
          <div class="mt-8 p-6 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-3xl border-0 shadow-lg">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-orange-300 flex items-center justify-center flex-shrink-0 shadow-md">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
              <path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
            </svg>
          </div>
          <div class="flex-1">
            <h5 class="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span class="text-lg">✨</span>
              小发现
            </h5>
            <p class="text-sm text-gray-700 leading-relaxed">
              看起来你有一些时刻既想要调整现状，又在照顾当下的自己，同时保持着觉察。这种矛盾感也许是成长的信号。
            </p>
          </div>
        </div>
      </div>
    `;
  }

  shortenState(state) {
    const mapping = {
      '在推进未来的我': '未来的我',
      '在维持生活的我': '生活的我',
      '在照顾当下的我': '当下的我'
    };
    return mapping[state] || state;
  }

  shortenWilling(willing) {
    const mapping = {
      '我愿意继续': '愿意',
      '我希望调整一点': '调整',
      '我不希望继续': '不愿意'
    };
    return mapping[willing] || willing;
  }

  calculatePercentage(count, total) {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }
}

// 区块E：觉察沉淀
class ReflectionSection {
  render(data) {
    const { autoSummary, recommendedTags } = data.reflection;
    const recordedDays = data.overview.recordedDays;
    
    return `
      <section class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 shadow-lg border-0">
        <h3 class="text-lg font-semibold text-gray-900 mb-8 flex items-center gap-2">
          <span class="text-xl">💭</span>
          觉察沉淀
        </h3>
        
        <!-- 自动总结 -->
        <div class="mb-8 p-6 bg-white rounded-2xl border-0 shadow-sm">
          <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span class="w-2 h-2 bg-indigo-400 rounded-full"></span>
            这一旬的看见
          </h4>
          <p class="text-sm text-gray-700 leading-relaxed">${autoSummary}</p>
        </div>

        <!-- 下一旬意图 -->
        <div class="space-y-6">
          <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span class="w-2 h-2 bg-purple-400 rounded-full"></span>
            下一旬，关于钱，我想多留意的是——
          </h4>
          <textarea 
            id="next-xun-intention"
            class="w-full rounded-2xl border-0 bg-white px-5 py-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none transition-all duration-200 shadow-sm"
            rows="4"
            maxlength="100"
            placeholder="比如：多留意赚钱的机会，或者更关注存钱的感觉..."
          ></textarea>
          
          <!-- 推荐标签 -->
          ${recommendedTags.length > 0 ? `
            <div class="space-y-3">
              <p class="text-xs text-gray-600 font-medium">推荐方向（点击添加）</p>
              <div class="flex flex-wrap gap-3">
                ${recommendedTags.map(tag => `
                  <button type="button" 
                          class="intention-tag px-4 py-2 text-sm bg-white border-0 text-indigo-700 rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 shadow-sm hover:shadow-md"
                          data-tag="${tag}">
                    ${tag}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 完成按钮 -->
        <div class="mt-8 flex justify-end">
          <button 
            id="complete-money-summary-btn"
            class="px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            完成金钱小结
          </button>
        </div>
      </section>
    `;
  }

  bindEvents(callback) {
    // 推荐标签点击事件
    document.querySelectorAll('.intention-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        const textarea = document.getElementById('next-xun-intention');
        const tagText = e.target.dataset.tag;
        const currentText = textarea.value.trim();
        
        if (currentText && !currentText.includes(tagText)) {
          textarea.value = currentText + '，' + tagText;
        } else if (!currentText) {
          textarea.value = tagText;
        }
        
        textarea.focus();
      });
    });

    // 完成按钮事件
    const completeBtn = document.getElementById('complete-money-summary-btn');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        const intention = document.getElementById('next-xun-intention').value.trim();
        callback(intention);
      });
    }
  }
}

// 主金钱观察总结组件
export class MoneyObservationSummaryComponent {
  constructor(xunPeriod) {
    this.xunPeriod = xunPeriod;
    this.dataAggregator = new MoneyObservationSummary();
    this.dataAggregator.xunPeriod = xunPeriod; // 重要：设置旬期
    this.currentData = null;
    this.userIntentions = '';
    
    console.log(`MoneyObservationSummaryComponent initialized with period: ${xunPeriod}`);
  }

  render() {
    // 获取聚合数据
    this.currentData = this.dataAggregator.getSummaryData();
    
    if (!this.currentData) {
      return '<div class="text-center py-8">加载中...</div>';
    }

    const { recordedDays } = this.currentData.overview;
    
    // 根据记录天数决定显示哪些区块
    const showDetailedBlocks = recordedDays >= 3;
    
    const html = `
      <div class="space-y-8">
        <!-- 区块A：始终显示 -->
        ${new OverviewSection().render(this.currentData)}
        
        <!-- 区块B-E：根据记录天数决定是否显示 -->
        ${showDetailedBlocks ? `
          ${new FlowMapSection().render(this.currentData)}
          ${new BreathingCurveSection().render(this.currentData)}
          ${new SelfStateSection().render(this.currentData)}
          ${new ReflectionSection().render(this.currentData)}
        ` : `
          <!-- 空状态：显示简化的区块B和区块E -->
          ${new FlowMapSection().render(this.currentData)}
          <div class="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 shadow-lg border-0">
            <div class="text-center space-y-6">
              <div class="text-4xl mb-4">🌱</div>
              <h3 class="text-lg font-semibold text-gray-900">继续记录，看见更多模式</h3>
              <p class="text-sm text-gray-700 max-w-md mx-auto leading-relaxed">
                这一旬你记录了${recordedDays}天，每一次记录都是与自己对话的开始。
                继续记录会看见更多关于自己与钱的关系模式。
              </p>
              <div class="pt-4">
                ${new ReflectionSection().render(this.currentData)}
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    // 延迟绑定事件，确保DOM已渲染
    setTimeout(() => {
      this.bindEvents();
    }, 100);

    return html;
  }

  bindEvents() {
    if (this.currentData && this.currentData.overview.recordedDays >= 3) {
      new ReflectionSection().bindEvents((intention) => {
        this.handleComplete(intention);
      });
    } else {
      // 即使记录天数不足，也要绑定简化版的事件
      const completeBtn = document.getElementById('complete-money-summary-btn');
      if (completeBtn) {
        completeBtn.addEventListener('click', () => {
          const intention = document.getElementById('next-xun-intention')?.value.trim() || '';
          this.handleComplete(intention);
        });
      }

      // 推荐标签事件
      document.querySelectorAll('.intention-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
          const textarea = document.getElementById('next-xun-intention');
          if (textarea) {
            const tagText = e.target.dataset.tag;
            const currentText = textarea.value.trim();
            
            if (currentText && !currentText.includes(tagText)) {
              textarea.value = currentText + '，' + tagText;
            } else if (!currentText) {
              textarea.value = tagText;
            }
            
            textarea.focus();
          }
        });
      });
    }
  }

  handleComplete(intention) {
    // 保存用户意图
    this.userIntentions = intention;
    MoneyDataRepository.saveUserIntentions(this.xunPeriod, intention);
    
    // 保存总结数据
    MoneyDataRepository.saveXunSummary(this.xunPeriod, {
      ...this.currentData,
      userIntentions: intention,
      completedAt: Date.now()
    });

    // 显示成功提示
    this.showToast('金钱观察小结已保存');
  }

  showToast(message) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // 3秒后移除
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}
