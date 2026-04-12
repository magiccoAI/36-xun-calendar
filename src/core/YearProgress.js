import { CONFIG } from '../config.js';
import { Calendar } from './Calendar.js';

export class YearProgress {
    constructor(xunPeriods) {
        this.xunPeriods = xunPeriods;
        this.init();
    }

    init() {
        this.update();
        setInterval(() => this.update(), 60000); // Update every minute
    }

    update() {
        const now = new Date();
        const start = new Date(CONFIG.YEAR, 0, 1);
        const end = new Date(CONFIG.YEAR, 11, 31, 23, 59, 59);
        const total = end - start;
        const current = now - start;
        let percentage = (current / total) * 100;
        percentage = Math.max(0, Math.min(100, percentage));

        const bar = document.getElementById('year-progress-bar');
        const walker = document.getElementById('year-progress-walker');
        const text = document.getElementById('year-progress-text');
        const bubble = document.getElementById('walker-bubble');
        const currentXunInfo = document.getElementById('current-xun-info');

        if (bar) bar.style.width = `${percentage}%`;
        if (walker) walker.style.left = `${percentage}%`;
        if (text) {
            // Mindful Progress Text
            const passedDays = Math.floor(current / (1000 * 60 * 60 * 24));
            const totalDays = 365; // Approximate
            const remainingDays = totalDays - passedDays;
            text.innerHTML = `
                <div class="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <div class="flex items-center gap-1.5 group cursor-default" title="已过去的时间">
                        <div class="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-blue-500 transition-colors"></div>
                        <span class="text-xs text-gray-500 font-medium">已走过 <span class="font-mono text-gray-700 font-bold text-sm">${passedDays}</span> 天</span>
                    </div>
                    <div class="h-4 w-[1px] bg-gray-200"></div>
                    <div class="flex items-center gap-1 cursor-default" title="当前进度">
                         <span class="font-mono font-bold text-blue-600 text-lg leading-none">${percentage.toFixed(1)}<span class="text-xs ml-0.5">%</span></span>
                    </div>
                    <div class="h-4 w-[1px] bg-gray-200"></div>
                    <div class="flex items-center gap-1.5 group cursor-default" title="剩余的时间">
                        <span class="text-xs text-gray-500 font-medium">余 <span class="font-mono text-gray-700 font-bold text-sm">${remainingDays}</span> 天</span>
                        <div class="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-green-500 transition-colors"></div>
                    </div>
                </div>
            `;
        }

        // Bubble interaction
        if (walker && bubble) {
            walker.onmouseenter = () => {
                bubble.textContent = Calendar.formatLocalDate(now);
                bubble.classList.remove('opacity-0');
            };
            walker.onmouseleave = () => bubble.classList.add('opacity-0');
        }

        // Current Xun Info
        const currentXun = Calendar.getCurrentXun(this.xunPeriods);
        if (currentXunInfo) {
            if (currentXun) {
                currentXunInfo.textContent = `Current: 第 ${currentXun.index} 旬`;
            } else {
                currentXunInfo.textContent = `Welcome to ${CONFIG.YEAR}`;
            }
        }

        // Seasonal theme decorations
        this.updateSeasonalDecorations(now);
    }

    updateSeasonalDecorations(now) {
        // Spring Festival Theme Check (Approx. Late Jan to Feb)
        // 2026 CNY is Feb 17. We enable it for Feb and late Jan.
        const isSpringFestival = (now.getMonth() === 1) || (now.getMonth() === 0 && now.getDate() > 20);
        const isMarch = now.getMonth() === 2; // March is month 2
        const isApril = now.getMonth() === 3; // April is month 3
        const header = document.querySelector('header');
        const flower = document.querySelector('.flower-path');
        const kite = document.querySelector('.kite-path');

        if (header) {
            if (isSpringFestival) {
                header.classList.add('spring-festival-theme');
            } else {
                header.classList.remove('spring-festival-theme');
            }
        }
        if (flower) {
            if (isMarch) {
                flower.classList.remove('hidden');
            } else {
                flower.classList.add('hidden');
            }
        }
        if (kite) {
            if (isApril) {
                kite.classList.remove('hidden');

                // Inject enhanced illustration-style SVG structure
                if (!kite.innerHTML || kite.dataset.styled !== 'true') {
                    kite.innerHTML = `
                        <svg viewBox="0 0 200 200" class="kite-illustration">
                            <path class="kite-string" d="M 20,180 Q 60,80 120,60 T 180,20" />
                            <g class="kite-body">
                                <!-- Enhanced swallow kite shape -->
                                <path class="kite-shape" d="M 170,30 L 180,20 L 190,30 L 180,45 Z" fill="rgba(16, 185, 129, 0.8)" />
                                <!-- Swallow wings -->
                                <path d="M 175,25 Q 165,20 160,25 Q 165,28 175,25" fill="rgba(125, 211, 252, 0.6)" />
                                <path d="M 185,25 Q 195,20 200,25 Q 195,28 185,25" fill="rgba(125, 211, 252, 0.6)" />
                                <!-- Tail ribbon -->
                                <path class="kite-ribbon" d="M 180,45 Q 185,55 180,65" fill="none" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1" />
                                <!-- Eye detail -->
                                <circle cx="172" cy="28" r="2" fill="white" opacity="0.8"/>
                                <circle cx="172" cy="28" r="1" fill="black"/>
                            </g>
                        </svg>
                    `;
                    kite.dataset.styled = 'true';
                }
            } else {
                kite.classList.add('hidden');
            }
        }
    }
}
