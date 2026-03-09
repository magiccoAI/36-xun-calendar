import { CircularSleepSelector } from './sleep/CircularSleepSelector.js';
import { SleepQualitySelector } from './SleepQualitySelector.js';

/**
 * CompleteSleepModule - 完整的睡眠记录模块
 * 集成了睡眠时间选择器和睡眠质量选择器
 */
export class CompleteSleepModule {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.sleepSelector = null;
        this.qualitySelector = null;
        
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="space-y-4">
                <!-- 睡眠时间选择器 -->
                <div>
                    <label class="text-xs text-gray-500 block mb-2">睡眠时间</label>
                    <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div id="sleep-time-container"></div>
                    </div>
                </div>
                
                <!-- 睡眠质量选择器 -->
                <div id="sleep-quality-container"></div>
                
                <!-- 睡眠数据汇总显示 -->
                <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div id="sleep-summary" class="text-xs text-gray-600">
                        <div class="flex items-center justify-between">
                            <span class="font-medium">睡眠时长：</span>
                            <span id="sleep-duration" class="font-mono">--</span>
                        </div>
                        <div class="flex items-center justify-between mt-1">
                            <span class="font-medium">恢复状态：</span>
                            <span id="sleep-quality" class="font-mono">--</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initSleepSelector();
        this.initQualitySelector();
    }

    initSleepSelector() {
        const timeContainer = document.getElementById('sleep-time-container');
        if (timeContainer) {
            this.sleepSelector = new CircularSleepSelector(timeContainer, {
                initialData: this.options.initialSleepData,
                onChange: (sleepData) => {
                    this.updateSummary();
                    if (this.options.onSleepChange) {
                        this.options.onSleepChange(sleepData);
                    }
                }
            });
        }
    }

    initQualitySelector() {
        const qualityContainer = document.getElementById('sleep-quality-container');
        if (qualityContainer) {
            this.qualitySelector = new SleepQualitySelector(qualityContainer, {
                title: '今日恢复状态',
                value: this.options.initialQuality,
                onSelect: (quality, option) => {
                    this.updateSummary();
                    if (this.options.onQualityChange) {
                        this.options.onQualityChange(quality, option);
                    }
                }
            });
        }
    }

    updateSummary() {
        const durationEl = document.getElementById('sleep-duration');
        const qualityEl = document.getElementById('sleep-quality');

        // 更新睡眠时长
        if (durationEl && this.sleepSelector) {
            const sleepData = this.sleepSelector.getValue();
            if (sleepData.duration) {
                durationEl.textContent = `${sleepData.duration} 小时`;
                durationEl.className = 'font-mono text-blue-600';
            } else {
                durationEl.textContent = '--';
                durationEl.className = 'font-mono';
            }
        }

        // 更新恢复状态
        if (qualityEl && this.qualitySelector) {
            const quality = this.qualitySelector.getValue();
            if (quality) {
                const option = this.qualitySelector.options.find(opt => opt.value === quality);
                if (option) {
                    qualityEl.innerHTML = `${option.emoji} ${option.label}`;
                    qualityEl.className = 'font-mono text-indigo-600';
                }
            } else {
                qualityEl.textContent = '--';
                qualityEl.className = 'font-mono';
            }
        }
    }

    getValue() {
        const sleepData = this.sleepSelector ? this.sleepSelector.getValue() : {};
        const quality = this.qualitySelector ? this.qualitySelector.getValue() : null;

        return {
            ...sleepData,
            quality: quality,
            // 为了兼容性，保留原有的睡眠数据结构
            sleepData: {
                bedtimeMinutes: sleepData.bedtimeMinutes,
                wakeMinutes: sleepData.wakeMinutes
            }
        };
    }

    setValue(data) {
        if (this.sleepSelector && data.sleepData) {
            this.sleepSelector.restore(data.sleepData);
        }
        
        if (this.qualitySelector && data.quality !== undefined) {
            this.qualitySelector.setValue(data.quality);
        }
        
        this.updateSummary();
    }

    reset() {
        if (this.sleepSelector) {
            this.sleepSelector.restore({});
        }
        
        if (this.qualitySelector) {
            this.qualitySelector.setValue(null);
        }
        
        this.updateSummary();
    }

    destroy() {
        if (this.sleepSelector) {
            // CircularSleepSelector 可能没有 destroy 方法，我们直接清理容器
            const timeContainer = document.getElementById('sleep-time-container');
            if (timeContainer) timeContainer.innerHTML = '';
        }
        
        if (this.qualitySelector) {
            this.qualitySelector.destroy();
        }
        
        this.container.innerHTML = '';
    }
}
