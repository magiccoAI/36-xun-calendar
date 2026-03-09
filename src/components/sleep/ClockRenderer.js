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
                    <div><div class="text-[10px] text-gray-400">入睡</div><div data-role="bedtime-label">--:--</div></div>
                    <div><div class="text-[10px] text-gray-400">时长</div><div data-role="duration-label">0h 0m</div></div>
                    <div><div class="text-[10px] text-gray-400">醒来</div><div data-role="wake-label">--:--</div></div>
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

        this.svg.append(this.baseCircle, this.arcPath, this.bedtimeHandle, this.wakeHandle);

        for (let i = 0; i < 24; i += 3) {
            const angle = TimeMath.minutesToAngle(i * 60);
            const point = this.polarToPoint(angle, this.radius + 18);
            const text = this.makeSvg('text', {
                x: point.x,
                y: point.y,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                'font-size': '10',
                fill: '#9ca3af'
            });
            text.textContent = String(i).padStart(2, '0');
            this.svg.append(text);
        }
    }

    makeHandle(name) {
        return this.makeSvg('circle', {
            r: 9,
            fill: '#fff',
            stroke: '#4338ca',
            'stroke-width': 3,
            'data-handle': name,
            style: 'cursor: grab;'
        });
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

        this.bedtimeHandle.setAttribute('cx', bedtimePoint.x);
        this.bedtimeHandle.setAttribute('cy', bedtimePoint.y);
        this.wakeHandle.setAttribute('cx', wakePoint.x);
        this.wakeHandle.setAttribute('cy', wakePoint.y);

        this.arcPath.setAttribute('d', this.describeArc(bedtimeAngle, wakeAngle));
        this.labels.bedtime.textContent = snapshot.bedtimeLabel;
        this.labels.wake.textContent = snapshot.wakeLabel;
        this.labels.duration.textContent = `${Math.floor(snapshot.durationMinutes / 60)}h ${snapshot.durationMinutes % 60}m`;
    }
}
