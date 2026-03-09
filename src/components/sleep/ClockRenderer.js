import { TimeMath } from './TimeMath.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class ClockRenderer {
    constructor(container) {
        this.container = container;
        this.center = 120;
        this.radius = 92;

        this.buildDom();
    }

    buildDom() {
        this.container.innerHTML = `
            <div class="space-y-3 select-none">
                <svg viewBox="0 0 240 240" class="w-full max-w-[280px] mx-auto touch-none" data-role="sleep-clock"></svg>
                <div class="grid grid-cols-3 gap-2 text-xs text-gray-600 text-center">
                    <div><div class="text-[10px] text-gray-400">入睡</div><div data-role="bedtime-label" class="text-sm font-bold text-purple-600">--:--</div></div>
                    <div><div class="text-[10px] text-gray-400">时长</div><div data-role="duration-label" class="font-bold text-blue-600">0h 0m</div></div>
                    <div><div class="text-[10px] text-gray-400">醒来</div><div data-role="wake-label" class="text-sm font-bold text-yellow-500">--:--</div></div>
                </div>
            </div>
        `;

        this.svg = this.container.querySelector('[data-role="sleep-clock"]');
        this.labels = {
            bedtime: this.container.querySelector('[data-role="bedtime-label"]'),
            wake: this.container.querySelector('[data-role="wake-label"]'),
            duration: this.container.querySelector('[data-role="duration-label"]')
        };

        this.baseCircle = this.makeSvg('circle', {
            cx: this.center,
            cy: this.center,
            r: this.radius,
            fill: 'none',
            stroke: '#e5e7eb',
            'stroke-width': 16
        });
        this.arcPath = this.makeSvg('path', {
            fill: 'none',
            stroke: '#6366f1',
            'stroke-width': 16,
            'stroke-linecap': 'round'
        });
        this.bedtimeHandle = this.makeHandle('bedtime');
        this.wakeHandle = this.makeHandle('wake');

        // 添加中心睡眠时长显示
        this.durationText = this.makeSvg('text', {
            x: this.center,
            y: this.center - 8,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': '16',
            'font-weight': 'bold',
            fill: '#4338ca',
            'class': 'transition-all duration-200'
        });

        // 添加"睡眠时长"标签
        this.durationLabel = this.makeSvg('text', {
            x: this.center,
            y: this.center + 12,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': '10',
            'font-weight': 'normal',
            fill: '#9ca3af',
            'class': 'transition-all duration-200'
        });
        this.durationLabel.textContent = '睡眠时长';

        this.svg.append(this.baseCircle, this.arcPath, this.bedtimeHandle, this.wakeHandle, this.durationText, this.durationLabel);

        // 添加时间刻度
        for (let i = 0; i < 24; i++) {
            const angle = TimeMath.minutesToAngle(i * 60);
            
            // 主刻度（每3小时）
            if (i % 3 === 0) {
                const point = this.polarToPoint(angle, this.radius + 18);
                const text = this.makeSvg('text', {
                    x: point.x,
                    y: point.y,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    'font-size': '10',
                    fill: '#9ca3af',
                    'font-weight': 'bold'
                });
                text.textContent = String(i).padStart(2, '0');
                this.svg.append(text);

                // 刻度线
                const innerPoint = this.polarToPoint(angle, this.radius + 8);
                const outerPoint = this.polarToPoint(angle, this.radius + 14);
                const tick = this.makeSvg('line', {
                    x1: innerPoint.x,
                    y1: innerPoint.y,
                    x2: outerPoint.x,
                    y2: outerPoint.y,
                    stroke: '#9ca3af',
                    'stroke-width': 1
                });
                this.svg.append(tick);
            } else {
                // 小刻度（每小时）
                const innerPoint = this.polarToPoint(angle, this.radius + 10);
                const outerPoint = this.polarToPoint(angle, this.radius + 12);
                const tick = this.makeSvg('line', {
                    x1: innerPoint.x,
                    y1: innerPoint.y,
                    x2: outerPoint.x,
                    y2: outerPoint.y,
                    stroke: '#e5e7eb',
                    'stroke-width': 0.5
                });
                this.svg.append(tick);
            }
        }
    }

    makeHandle(name) {
        const g = this.makeSvg('g', {
            'data-handle': name,
            style: 'cursor: grab;'
        });

        // 背景圆圈 - 根据类型设置不同颜色
        const circleColor = name === 'bedtime' ? '#4338ca' : '#f59e0b'; // 月亮保持蓝色，太阳改为黄色
        const circle = this.makeSvg('circle', {
            r: 9,
            fill: '#fff',
            stroke: circleColor,
            'stroke-width': 3
        });

        // 图标
        let icon;
        if (name === 'bedtime') {
            // 月亮图标 - 使用emoji
            icon = this.makeSvg('text', {
                x: 0,
                y: 3,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                'font-size': '12',
                fill: '#fbbf24'
            });
            icon.textContent = '🌙';
        } else {
            // 太阳图标
            icon = this.makeSvg('g', {
                fill: '#fbbf24',
                stroke: '#f59e0b',
                'stroke-width': 0.5
            });
            
            // 太阳中心
            const sunCenter = this.makeSvg('circle', {
                cx: 0,
                cy: 0,
                r: 3
            });
            
            // 太阳光线
            const rays = [];
            for (let i = 0; i < 8; i++) {
                const angle = (i * 45) * Math.PI / 180;
                const innerRadius = 4;
                const outerRadius = 6;
                const x1 = Math.cos(angle) * innerRadius;
                const y1 = Math.sin(angle) * innerRadius;
                const x2 = Math.cos(angle) * outerRadius;
                const y2 = Math.sin(angle) * outerRadius;
                
                rays.push(this.makeSvg('line', {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2,
                    'stroke-width': 1
                }));
            }
            
            rays.forEach(ray => icon.appendChild(ray));
            icon.appendChild(sunCenter);
        }

        // 为太阳图标添加动态调整刻度
        if (name === 'wake') {
            const adjustmentRing = this.makeSvg('g', {
                'class': 'adjustment-ring',
                opacity: '0'
            });
            
            // 创建小刻度线围绕太阳图标
            for (let i = 0; i < 12; i++) {
                const angle = (i * 30) * Math.PI / 180; // 每30度一个刻度
                const innerRadius = 11;
                const outerRadius = 13;
                const x1 = Math.cos(angle) * innerRadius;
                const y1 = Math.sin(angle) * innerRadius;
                const x2 = Math.cos(angle) * outerRadius;
                const y2 = Math.sin(angle) * outerRadius;
                
                const tick = this.makeSvg('line', {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2,
                    stroke: '#f59e0b',
                    'stroke-width': 1,
                    opacity: '0.6'
                });
                
                adjustmentRing.appendChild(tick);
            }
            
            g.appendChild(adjustmentRing);
        }

        g.appendChild(circle);
        g.appendChild(icon);

        return g;
    }

    makeSvg(tag, attrs) {
        const el = document.createElementNS(SVG_NS, tag);
        Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
        return el;
    }

    polarToPoint(angle, radius = this.radius) {
        const rad = (angle * Math.PI) / 180;
        return {
            x: this.center + Math.cos(rad) * radius,
            y: this.center + Math.sin(rad) * radius
        };
    }

    describeArc(startAngle, endAngle) {
        const start = this.polarToPoint(startAngle);
        const end = this.polarToPoint(endAngle);
        const delta = (endAngle - startAngle + 360) % 360;
        const largeArcFlag = delta > 180 ? 1 : 0;
        return `M ${start.x} ${start.y} A ${this.radius} ${this.radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
    }

    render(snapshot) {
        const bedtimeAngle = TimeMath.minutesToAngle(snapshot.bedtimeMinutes);
        const wakeAngle = TimeMath.minutesToAngle(snapshot.wakeMinutes);
        const bedtimePoint = this.polarToPoint(bedtimeAngle);
        const wakePoint = this.polarToPoint(wakeAngle);

        this.bedtimeHandle.setAttribute('transform', `translate(${bedtimePoint.x}, ${bedtimePoint.y})`);
        this.wakeHandle.setAttribute('transform', `translate(${wakePoint.x}, ${wakePoint.y})`);

        this.arcPath.setAttribute('d', this.describeArc(bedtimeAngle, wakeAngle));
        this.labels.bedtime.textContent = snapshot.bedtimeLabel;
        this.labels.wake.textContent = snapshot.wakeLabel;
        this.labels.duration.textContent = `${Math.floor(snapshot.durationMinutes / 60)}h ${snapshot.durationMinutes % 60}m`;

        // 更新中心睡眠时长显示
        const durationHours = (snapshot.durationMinutes / 60).toFixed(1);
        this.durationText.textContent = `${durationHours}h`;
        
        // 根据睡眠时长调整颜色
        if (snapshot.durationMinutes < 360) { // 少于6小时
            this.durationText.setAttribute('fill', '#ef4444'); // 红色
        } else if (snapshot.durationMinutes < 420) { // 少于7小时
            this.durationText.setAttribute('fill', '#f59e0b'); // 橙色
        } else if (snapshot.durationMinutes <= 540) { // 7-9小时
            this.durationText.setAttribute('fill', '#10b981'); // 绿色
        } else { // 超过9小时
            this.durationText.setAttribute('fill', '#6366f1'); // 蓝色
        }
    }
}
