import { CONFIG } from '../config.js';
import { store } from './State.js';
import { Calendar } from './Calendar.js';

export class PixelFarm {
    constructor() {
        this.init();
        this.initToggle();
    }

    init() {
        const grid = document.getElementById('pixel-farm-grid');
        if (!grid) return;
        grid.innerHTML = ''; // Clear grid before redraw

        const year = CONFIG.YEAR;
        const totalDays = 365;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allData = store.getAllData();

        for (let i = 0; i < totalDays; i++) {
            const dayDate = new Date(year, 0, i + 1);
            const dateStr = Calendar.formatLocalDate(dayDate);

            const plot = document.createElement('div');
            plot.id = `plot-${dateStr}`;
            // 基础像素土地块：留出间隔，由容器 gap 控制
            plot.className = 'w-4 h-4 cursor-pointer hover:ring-2 hover:ring-amber-400 border border-amber-400/50 flex items-center justify-center rounded-sm';
            plot.dataset.date = dateStr;
            plot.setAttribute('title', dateStr);
            plot.setAttribute('aria-label', dateStr);
            plot.onclick = (e) => {
                e.stopPropagation();
                console.log(`Plot clicked: ${dateStr}`, plot);
                this.showCropSelection(dateStr, plot);
            };

            const dayData = allData[dateStr];
            const crop = dayData ? dayData.crop : null;

            // 重置样式，为状态化渲染做准备
            plot.textContent = ''; // Use textContent instead of innerHTML for emojis
            plot.style.backgroundImage = '';
            plot.style.backgroundSize = '';
            plot.style.backgroundPosition = '';
            plot.style.backgroundRepeat = '';

            // 默认使用像素土地贴图作为背景
            plot.style.backgroundImage = "url('src/images/pixel square.png')";
            plot.style.backgroundSize = 'cover';
            plot.style.backgroundPosition = 'center';
            plot.style.backgroundRepeat = 'no-repeat';

            if (crop) {
                if (crop.includes('/')) { // 作物是图片
                    plot.style.backgroundImage = `url('${crop}')`;
                    plot.style.backgroundSize = 'contain';
                    plot.style.backgroundPosition = 'center';
                    plot.style.backgroundRepeat = 'no-repeat';
                } else { // Emoji crop
                    plot.textContent = crop;
                }
                // 为已种植的地块加深背景色
                plot.classList.add('bg-amber-600', 'border-amber-700/50');

            } else if (dayDate < today) { // 过去的日子，默认显示嫩芽
                plot.innerHTML = '<div class="w-1 h-1 bg-green-500 rounded-full"></div>';
                // 为过去未种植的地块也加深背景色
                plot.classList.add('bg-amber-600', 'border-amber-700/50');
            }

            if (dayDate.getTime() === today.getTime()) {
                plot.classList.add('ring-2', 'ring-blue-500');
            }

            grid.appendChild(plot);
        }
    }

    initToggle() {
        const toggleBtn = document.getElementById('pixel-farm-toggle');
        const wrapper = document.getElementById('pixel-farm-grid-wrapper');
        if (!toggleBtn || !wrapper) return;

        const collapsedKey = 'pixel_farm_collapsed';
        const applyState = (collapsed) => {
            if (collapsed) {
                wrapper.classList.add('hidden');
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.querySelector('span').textContent = '展开';
                const icon = toggleBtn.querySelector('svg');
                if (icon) icon.classList.add('rotate-180');
            } else {
                wrapper.classList.remove('hidden');
                toggleBtn.setAttribute('aria-expanded', 'true');
                toggleBtn.querySelector('span').textContent = '收起';
                const icon = toggleBtn.querySelector('svg');
                if (icon) icon.classList.remove('rotate-180');
            }
        };

        const saved = localStorage.getItem(collapsedKey);
        const initialCollapsed = saved === '1';
        applyState(initialCollapsed);

        toggleBtn.onclick = () => {
            const isCollapsed = !wrapper.classList.contains('hidden');
            const nextCollapsed = isCollapsed;
            applyState(nextCollapsed);
            localStorage.setItem(collapsedKey, nextCollapsed ? '1' : '0');
        };
    }

    showCropSelection(dateStr, element) {
        const menu = document.getElementById('crop-selection-menu');
        if (!menu) {
            console.error('Crop selection menu not found');
            return;
        }

        console.log(`Showing crop selection for: ${dateStr}`, element);

        const rect = element.getBoundingClientRect();
        const menuWidth = 200; // Approximate menu width based on max-w-xs and content
        const menuHeight = 100; // Approximate menu height
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        // Calculate initial position
        let left = scrollX + rect.left;
        let top = scrollY + rect.bottom + 5;

        console.log(`Initial position: left=${left}, top=${top}, rect=${JSON.stringify(rect)}`);

        // Adjust horizontal position if menu would go beyond right viewport
        if (left + menuWidth > window.innerWidth + scrollX) {
            left = scrollX + rect.right - menuWidth;
            // Ensure menu doesn't go beyond left viewport either
            if (left < scrollX) {
                left = scrollX + 10;
            }
        }

        // Adjust vertical position if menu would go beyond bottom viewport
        if (top + menuHeight > window.innerHeight + scrollY) {
            top = scrollY + rect.top - menuHeight - 5;
            // Ensure menu doesn't go above top viewport
            if (top < scrollY) {
                top = scrollY + 10;
            }
        }

        console.log(`Final position: left=${left}, top=${top}`);

        menu.style.position = 'fixed';
        menu.style.top = `${top - scrollY}px`;
        menu.style.left = `${left - scrollX}px`;
        menu.style.zIndex = '9999';
        menu.classList.remove('hidden');

        // Use event delegation instead of cloneNode+replaceChild to preserve DOM references
        const cropClickHandler = (e) => {
            const packet = e.target.closest('.seed-packet');
            if (!packet) return;
            const crop = packet.dataset.crop;
            const dayData = store.getAllData()[dateStr] || {};
            const currentData = store.getAllData();
            const updatedData = {
                ...currentData,
                [dateStr]: { ...dayData, crop: crop }
            };
            store.setState({ userData: updatedData });
            menu.classList.add('hidden');
            menu.removeEventListener('click', cropClickHandler);
            this.init();
        };
        menu.addEventListener('click', cropClickHandler);

        const hideMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.classList.add('hidden');
                document.body.removeEventListener('click', hideMenu);
                menu.removeEventListener('click', cropClickHandler);
            }
        };
        document.body.addEventListener('click', hideMenu);
    }
}
