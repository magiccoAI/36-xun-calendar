export class SleepSlider {
    constructor() {
        this.bedtimeSlider = document.getElementById('bedtime-slider');
        this.wakeuptimeSlider = document.getElementById('wakeuptime-slider');
        this.bedtimeHandle = document.getElementById('bedtime-handle');
        this.wakeuptimeHandle = document.getElementById('wakeuptime-handle');
        this.sleepRangeTrack = document.getElementById('sleep-range-track');
        this.bedtimeDisplay = document.getElementById('bedtime-display');
        this.wakeuptimeDisplay = document.getElementById('wakeuptime-display');
        this.sleepDurationDisplay = document.getElementById('sleep-duration-display');
        this.activeHandle = null; // 当前激活的滑块
        this.sleepQuality = null;
        
        this.init();
    }
    
    init() {
        if (!this.bedtimeSlider || !this.wakeuptimeSlider) {
            console.warn('SleepSlider: 滑块元素未找到', {
                bedtimeSlider: !!this.bedtimeSlider,
                wakeuptimeSlider: !!this.wakeuptimeSlider
            });
            return;
        }
        
        console.log('SleepSlider: 初始化开始', {
            initialBedtime: this.bedtimeSlider.value,
            initialWake: this.wakeuptimeSlider.value
        });
        
        // 初始化滑块位置
        this.updateSliderPositions();
        this.updateDisplays();
        
        // 绑定事件
        this.bedtimeSlider.addEventListener('input', () => this.onSliderChange());
        this.wakeuptimeSlider.addEventListener('input', () => this.onSliderChange());
        
        // 绑定睡眠质量按钮
        document.querySelectorAll('.sleep-quality-btn').forEach(btn => {
            btn.addEventListener('click', () => this.onSleepQualityClick(btn));
        });
        
        // 初始化拖拽功能
        this.initDragAndDrop();
        
        // 初始化键盘支持
        this.initKeyboardSupport();
        
        console.log('SleepSlider: 初始化完成', {
            finalBedtime: this.bedtimeSlider.value,
            finalWake: this.wakeuptimeSlider.value
        });
    }
    
    initDragAndDrop() {
        const handles = [
            { element: this.bedtimeHandle, slider: this.bedtimeSlider, type: 'bedtime' },
            { element: this.wakeuptimeHandle, slider: this.wakeuptimeSlider, type: 'wakeuptime' }
        ];
        
        // Get the track container for proper boundary calculations
        const trackContainer = this.bedtimeSlider.parentElement;
        
        handles.forEach(({ element, slider, type }) => {
            let isDragging = false;
            
            const onStartDrag = (e) => {
                isDragging = true;
                element.classList.add('cursor-grabbing');
                e.preventDefault();
            };
            
            const onDrag = (e) => {
                if (!isDragging) return;
                
                // Use track container for boundary calculation since inputs have pointer-events-none
                const rect = trackContainer.getBoundingClientRect();
                const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                const trackPercent = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
                
                // 现在是完整的24小时范围：0-1440分钟
                const value = Math.round(trackPercent * 1440 / 15) * 15;
                slider.value = Math.max(0, Math.min(1440, value));
                
                this.onSliderChange();
            };
            
            const onEndDrag = () => {
                isDragging = false;
                element.classList.remove('cursor-grabbing');
            };
            
            // Mouse events
            element.addEventListener('mousedown', onStartDrag);
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', onEndDrag);
            
            // Touch events
            element.addEventListener('touchstart', onStartDrag);
            document.addEventListener('touchmove', onDrag);
            document.addEventListener('touchend', onEndDrag);
        });
    }
    
    initKeyboardSupport() {
        // 监听键盘事件
        document.addEventListener('keydown', (e) => {
            // 只在滑块容器获得焦点时响应键盘事件
            const sliderContainer = this.bedtimeSlider.closest('.bg-white');
            if (!sliderContainer.contains(document.activeElement)) {
                return;
            }
            
            let targetSlider = null;
            let step = 15; // 15分钟步进
            
            // 确定目标滑块
            if (e.shiftKey) {
                // Shift + 方向键调整起床时间
                targetSlider = this.wakeuptimeSlider;
            } else {
                // 普通方向键调整入睡时间
                targetSlider = this.bedtimeSlider;
            }
            
            if (!targetSlider) return;
            
            let currentValue = parseInt(targetSlider.value);
            let newValue = currentValue;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    newValue = Math.max(0, currentValue - step);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    newValue = Math.min(1440, currentValue + step);
                    break;
                default:
                    return;
            }
            
            if (newValue !== currentValue) {
                targetSlider.value = newValue;
                this.onSliderChange();
                
                // 添加视觉反馈
                const handle = targetSlider === this.bedtimeSlider ? this.bedtimeHandle : this.wakeuptimeHandle;
                handle.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    handle.style.transform = '';
                }, 200);
            }
        });
        
        // 为滑块容器添加tabindex，使其可以获得焦点
        const sliderContainer = this.bedtimeSlider.closest('.bg-white');
        if (sliderContainer && !sliderContainer.hasAttribute('tabindex')) {
            sliderContainer.setAttribute('tabindex', '0');
        }
    }
    
    onSliderChange() {
        this.updateSliderPositions();
        this.updateDisplays();
    }
    
    updateSliderPositions() {
        const bedtimeValue = parseInt(this.bedtimeSlider.value);
        const wakeuptimeValue = parseInt(this.wakeuptimeSlider.value);
        
        // 现在是完整的24小时时间线：00:00 → 24:00
        // 入睡时间和起床时间都可以在 0-1440 分钟范围内
        const bedtimePercent = (bedtimeValue / 1440) * 100;
        const wakeuptimePercent = (wakeuptimeValue / 1440) * 100;
        
        // 更新手柄位置
        this.bedtimeHandle.style.left = `${bedtimePercent}%`;
        this.wakeuptimeHandle.style.left = `${wakeuptimePercent}%`;
        
        console.log('Slider positions:', {
            bedtimeValue,
            wakeuptimeValue,
            bedtimePercent: bedtimePercent.toFixed(2),
            wakeuptimePercent: wakeuptimePercent.toFixed(2)
        });
        
        // 更新轨道高亮
        this.updateTrackHighlight(bedtimePercent, wakeuptimePercent);
    }
    
    updateTrackHighlight(bedtimePercent, wakeuptimePercent) {
        // 在24小时时间线上判断跨昼夜
        // 如果入睡时间 < 起床时间，则为同一天内的睡眠
        // 如果入睡时间 > 起床时间，则为跨昼夜睡眠
        const isCrossDay = bedtimePercent > wakeuptimePercent;
        
        console.log('Track highlight:', {
            bedtimePercent: bedtimePercent.toFixed(1),
            wakeuptimePercent: wakeuptimePercent.toFixed(1),
            isCrossDay
        });
        
        if (isCrossDay) {
            // 跨昼夜：使用两个轨道段来更清楚地显示
            // 第一段：从入睡时间到右边界（24:00）
            const firstSegmentWidth = 100 - bedtimePercent;
            this.sleepRangeTrack.style.left = `${bedtimePercent}%`;
            this.sleepRangeTrack.style.width = `${firstSegmentWidth}%`;
            this.sleepRangeTrack.className = 'absolute h-full rounded-full transition-all duration-150 ease-out';
            // 使用更深的颜色表示第一段
            this.sleepRangeTrack.style.background = 'linear-gradient(to right, #6366f1, #8b5cf6)';
            
            // 如果存在第二个轨道元素，创建或更新它
            let secondTrack = document.getElementById('sleep-range-track-2');
            if (!secondTrack) {
                secondTrack = document.createElement('div');
                secondTrack.id = 'sleep-range-track-2';
                secondTrack.className = 'absolute h-full rounded-full transition-all duration-150 ease-out';
                this.sleepRangeTrack.parentNode.appendChild(secondTrack);
            }
            
            // 第二段：从左边界（00:00）到起床时间
            secondTrack.style.left = '0%';
            secondTrack.style.width = `${wakeuptimePercent}%`;
            secondTrack.style.background = 'linear-gradient(to right, #a855f7, #f59e0b)';
            
            console.log('Cross-day tracks:', {
                firstSegment: `${bedtimePercent.toFixed(1)}% -> 100% (${firstSegmentWidth.toFixed(1)}%)`,
                secondSegment: `0% -> ${wakeuptimePercent.toFixed(1)}% (${wakeuptimePercent.toFixed(1)}%)`
            });
            
        } else {
            // 同一天内：从入睡时间到起床时间
            this.sleepRangeTrack.style.left = `${bedtimePercent}%`;
            this.sleepRangeTrack.style.width = `${wakeuptimePercent - bedtimePercent}%`;
            this.sleepRangeTrack.className = 'absolute h-full rounded-full transition-all duration-150 ease-out';
            this.sleepRangeTrack.style.background = 'linear-gradient(to right, #6366f1, #a855f7, #f59e0b)';
            
            // 隐藏第二个轨道段（如果存在）
            const secondTrack = document.getElementById('sleep-range-track-2');
            if (secondTrack) {
                secondTrack.style.width = '0%';
            }
            
            console.log('Same day track:', {
                segment: `${bedtimePercent.toFixed(1)}% -> ${wakeuptimePercent.toFixed(1)}% (${(wakeuptimePercent - bedtimePercent).toFixed(1)}%)`
            });
        }
    }
    
    updateDisplays() {
        const bedtimeMinutes = parseInt(this.bedtimeSlider.value);
        const wakeuptimeMinutes = parseInt(this.wakeuptimeSlider.value);
        
        console.log('updateDisplays:', {
            rawBedtimeValue: this.bedtimeSlider.value,
            rawWakeValue: this.wakeuptimeSlider.value,
            parsedBedtime: bedtimeMinutes,
            parsedWake: wakeuptimeMinutes
        });
        
        // 转换为时间显示
        const bedtimeTime = this.minutesToTime(bedtimeMinutes);
        const wakeuptimeTime = this.minutesToTime(wakeuptimeMinutes);
        
        // 计算睡眠时长
        let duration;
        if (bedtimeMinutes > wakeuptimeMinutes) {
            // 跨昼夜：入睡时间在晚上，起床时间在早上
            duration = (1440 - bedtimeMinutes + wakeuptimeMinutes) / 60;
        } else {
            // 同一天内（虽然不太可能，但为了完整性）
            duration = (wakeuptimeMinutes - bedtimeMinutes) / 60;
        }
        
        // 更新显示
        this.bedtimeDisplay.textContent = bedtimeTime;
        this.wakeuptimeDisplay.textContent = wakeuptimeTime;
        this.sleepDurationDisplay.textContent = `${duration.toFixed(1)}h`;
    }
    
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    onSleepQualityClick(button) {
        // 移除所有按钮的选中状态
        document.querySelectorAll('.sleep-quality-btn').forEach(btn => {
            btn.classList.remove('bg-blue-100', 'border-blue-300', 'text-blue-700',
                              'bg-gray-100', 'border-gray-300', 'text-gray-700',
                              'bg-red-100', 'border-red-300', 'text-red-700');
            btn.classList.add('border-gray-200');
        });
        
        // 添加选中状态
        const quality = button.dataset.quality;
        this.sleepQuality = quality;
        
        switch (quality) {
            case 'excellent':
                button.classList.remove('border-gray-200');
                button.classList.add('bg-blue-100', 'border-blue-300', 'text-blue-700');
                break;
            case 'normal':
                button.classList.remove('border-gray-200');
                button.classList.add('bg-gray-100', 'border-gray-300', 'text-gray-700');
                break;
            case 'poor':
                button.classList.remove('border-gray-200');
                button.classList.add('bg-red-100', 'border-red-300', 'text-red-700');
                break;
        }
        
        // 将睡眠质量添加到备注栏
        // this.addSleepQualityToJournal(quality); // 已禁用，不再自动添加到日记
    }
    
    addSleepQualityToJournal(quality) {
        const journalInput = document.getElementById('journal-input');
        if (!journalInput) return;
        
        const qualityTexts = {
            excellent: '😴 睡得真香',
            normal: '😐 普普通通',
            poor: '😫 没睡好'
        };
        
        const qualityText = qualityTexts[quality];
        const currentText = journalInput.value.trim();
        
        // 如果当前备注中没有睡眠质量信息，则添加
        if (!currentText.includes('睡得') && !currentText.includes('睡眠质量')) {
            journalInput.value = currentText ? 
                `${currentText}\n\n睡眠质量：${qualityText}` : 
                `睡眠质量：${qualityText}`;
        }
    }
    
    // 获取当前睡眠数据（用于保存）
    getSleepData() {
        const bedtimeMinutes = parseInt(this.bedtimeSlider.value);
        const wakeuptimeMinutes = parseInt(this.wakeuptimeSlider.value);
        
        let duration;
        if (bedtimeMinutes > wakeuptimeMinutes) {
            duration = (1440 - bedtimeMinutes + wakeuptimeMinutes) / 60;
        } else {
            duration = (wakeuptimeMinutes - bedtimeMinutes) / 60;
        }
        
        return {
            bedtime: this.minutesToTime(bedtimeMinutes),
            wakeUpTime: this.minutesToTime(wakeuptimeMinutes),
            totalHours: parseFloat(duration.toFixed(1)),
            quality: this.sleepQuality
        };
    }
    
    // 设置睡眠数据（用于编辑时加载）
    setSleepData(data) {
        if (!data) return;
        
        // 设置入睡时间 - 现在支持0-24小时
        if (data.bedtime) {
            const [hours, minutes] = data.bedtime.split(':').map(Number);
            const bedtimeMinutes = hours * 60 + minutes;
            if (bedtimeMinutes >= 0 && bedtimeMinutes <= 1440) {
                this.bedtimeSlider.value = bedtimeMinutes;
            }
        }
        
        // 设置起床时间 - 现在支持0-24小时
        if (data.wakeUpTime) {
            const [hours, minutes] = data.wakeUpTime.split(':').map(Number);
            const wakeuptimeMinutes = hours * 60 + minutes;
            if (wakeuptimeMinutes >= 0 && wakeuptimeMinutes <= 1440) {
                this.wakeuptimeSlider.value = wakeuptimeMinutes;
            }
        }
        
        // 设置睡眠质量
        if (data.quality) {
            const button = document.querySelector(`[data-quality="${data.quality}"]`);
            if (button) {
                this.onSleepQualityClick(button);
            }
        }
        
        // 更新显示
        this.updateSliderPositions();
        this.updateDisplays();
    }
    
    // 重置滑块
    reset() {
        // 设置合理的默认值：22:30 入睡，07:30 起床 (9小时睡眠)
        this.bedtimeSlider.value = 1350; // 22:30
        this.wakeuptimeSlider.value = 450;  // 07:30
        this.sleepQuality = null;
        
        // 重置质量按钮
        document.querySelectorAll('.sleep-quality-btn').forEach(btn => {
            btn.classList.remove('bg-blue-100', 'border-blue-300', 'text-blue-700',
                              'bg-gray-100', 'border-gray-300', 'text-gray-700',
                              'bg-red-100', 'border-red-300', 'text-red-700');
            btn.classList.add('border-gray-200');
        });
        
        this.updateSliderPositions();
        this.updateDisplays();
    }
}
