
import { CONFIG } from '../config.js';
import { store } from './State.js';
import { Calendar } from './Calendar.js';
import { MacroView } from '../components/MacroView.js';
import { OverviewView } from '../components/OverviewView.js';
import { DetailView } from '../components/DetailView.js';
import { SummaryView } from '../components/SummaryView.js';
import { Modal } from '../components/Modal.js';
import { BackupModal } from '../components/BackupModal.js';
import { SettingsModal } from '../components/SettingsModal.js';
import { QuoteSystem } from '../quote.js';

class App {
    constructor() {
        this.xunPeriods = Calendar.getXunPeriods(CONFIG.YEAR);
        this.initViews();
        this.initModal();
        this.initBackup();
        this.initSettings();
        this.initTheme();
        this.initYearProgress();
        this.initNavigation();
        this.initEnergySlider();
        this.initPixelFarm();
        QuoteSystem.init();
        
        // Subscribe to store
        store.subscribe(this.render.bind(this));
        
        // Initial Render
        this.render(store.getState());
        
        // Force initial view to macro and scroll to current xun
        const currentXun = Calendar.getCurrentXun(this.xunPeriods);
        const initialXunIndex = currentXun ? currentXun.index : 1;

        store.setState({ 
            currentView: 'macro', 
            viewedXunIndex: initialXunIndex 
        });

        // Auto-scroll to current xun on initial load
        if (currentXun) {
            this.scrollToXun(currentXun.index);
        }
    }

    initViews() {
        this.macroView = new MacroView('macro-list', (view, index) => {
            store.setState({ currentView: view, viewedXunIndex: index });
        });
        
        this.overviewView = new OverviewView('overview-grid', (dateStr) => {
            // On date click in overview -> go to detail for that xun (Keep in Overview mode for combined view)
            const xun = Calendar.getXunPeriodByDateStr(this.xunPeriods, dateStr);
            if (xun) {
                store.setState({ currentView: 'overview', viewedXunIndex: xun.index });
                // Optional: Scroll to detail view?
                const detailEl = document.getElementById('detail-view');
                if (detailEl) detailEl.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        this.detailView = new DetailView('detail-content', {
            onChangeXun: (delta) => {
                const state = store.getState();
                let newIndex = state.viewedXunIndex + delta;
                if (newIndex < 1) newIndex = 1;
                if (newIndex > CONFIG.XUN_COUNT) newIndex = CONFIG.XUN_COUNT;
                store.setState({ viewedXunIndex: newIndex });
            },
            onShowSummary: (period) => {
                store.setState({ currentView: 'summary' });
            },
            onGoMacro: () => {
                store.setState({ currentView: 'macro' });
            },
            onDayClick: (dateStr) => {
                const xun = Calendar.getXunPeriodByDateStr(this.xunPeriods, dateStr);
                this.modal.open(dateStr, xun ? xun.index : 1);
            }
        });
        
        this.summaryView = new SummaryView('summary-view');
    }

    initModal() {
        this.modal = new Modal('modal', () => {
            // On save/delete, store updates, which triggers render
        });

        // The logic for the modal's internal elements is being initialized here.
        // This is a temporary placement to follow the current refactoring step.
        const moodButtons = document.querySelectorAll('.mood-btn');
        const seedPacketContainer = document.getElementById('seed-packet-selection');
        const seedPackets = document.querySelectorAll('.seed-packet');
        let selectedMood = null;
        let selectedCrop = null;

        moodButtons.forEach(button => {
            button.addEventListener('click', () => {
                selectedMood = button.dataset.mood;
                moodButtons.forEach(btn => btn.classList.remove('ring-2', 'ring-offset-2', 'ring-green-400'));
                button.classList.add('ring-2', 'ring-offset-2', 'ring-green-400');

                if (selectedMood === '5') {
                    seedPacketContainer.classList.remove('hidden');
                } else {
                    seedPacketContainer.classList.add('hidden');
                    selectedCrop = null; // Reset crop if mood changes
                    seedPackets.forEach(p => p.classList.remove('ring-2', 'ring-yellow-400'));
                }
            });
        });

        seedPackets.forEach(packet => {
            packet.addEventListener('click', () => {
                selectedCrop = packet.dataset.crop;
                seedPackets.forEach(p => p.classList.remove('ring-2', 'ring-yellow-400'));
                packet.classList.add('ring-2', 'ring-yellow-400');
            });
        });

        this.modal.elements.saveBtn.addEventListener('click', () => {
            const date = this.modal.elements.dateTitle.textContent;
            const dayData = store.getDay(date) || {};

            // Combine existing data with new data
            const newData = {
                ...dayData,
                mood: parseInt(selectedMood, 10),
                crop: selectedMood === '5' ? selectedCrop : dayData.crop, // Keep old crop if mood is no longer superb
                // ... gather other data from modal inputs ...
            };

            store.updateDay(date, newData);
            this.modal.close();
            this.initPixelFarm(); // Re-render the farm to show the new crop
        });
        
        // Expose openModal to window if needed by inline onclicks (though we should avoid them)
        // Or better, views should handle clicks and call app.openModal
        // DetailView generates HTML with onclicks? No, DetailView should use event delegation or bind events.
        // Let's check DetailView.js... I didn't verify if it handles day clicks to open modal.
        // DetailView.js renders months. I need to make sure it attaches click listeners to days.
        // I'll check DetailView.js later. If it doesn't, I need to fix it.
        // For now, I'll assume DetailView or OverviewView calls window.openModal or similar.
        // I'll expose it just in case.
        window.openModal = (dateStr) => {
             const xun = Calendar.getXunPeriodByDateStr(this.xunPeriods, dateStr);
             this.modal.open(dateStr, xun ? xun.index : 1);
        };
    }

    initBackup() {
        this.backupModal = new BackupModal('backup-modal');
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.onclick = () => this.backupModal.open();
        }
    }

    initSettings() {
        this.settingsModal = new SettingsModal('settings-modal');
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.onclick = () => this.settingsModal.open();
        }
    }

    initTheme() {
        // Expose setTheme to window for legacy onclick
        window.setTheme = (themeName) => {
            document.body.className = "bg-gray-50 text-gray-800 antialiased overflow-x-hidden"; // Reset
            if (themeName !== 'default') {
                document.body.classList.add(`theme-${themeName}`);
            }
            localStorage.setItem('xun_theme', themeName);
            
            // Close menu if open
            const menu = document.getElementById('theme-menu');
            if (menu) menu.classList.add('hidden');
        };

        // Load saved theme
        const savedTheme = localStorage.getItem('xun_theme');
        if (savedTheme) {
            window.setTheme(savedTheme);
        }
        
        // Theme toggle button
        const btn = document.getElementById('theme-btn');
        const menu = document.getElementById('theme-menu');
        if (btn && menu) {
            btn.onclick = (e) => {
                e.stopPropagation();
                menu.classList.toggle('hidden');
            };
            document.addEventListener('click', () => {
                if (!menu.classList.contains('hidden')) menu.classList.add('hidden');
            });
        }
    }

    initYearProgress() {
        const update = () => {
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

            // Spring Festival Theme Check (Approx. Late Jan to Feb)
            // 2026 CNY is Feb 17. We enable it for Feb and late Jan.
            const isSpringFestival = (now.getMonth() === 1) || (now.getMonth() === 0 && now.getDate() > 20);
            const isMarch = now.getMonth() === 2; // March is month 2
            const header = document.querySelector('header');
            const flower = document.querySelector('.flower-path');

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
        };
        
        update();
        setInterval(update, 60000); // Update every minute
    }

    initNavigation() {
        const navMacro = document.getElementById('nav-macro');
        const navOverview = document.getElementById('nav-overview');
        
        if (navMacro) navMacro.onclick = () => store.setState({ currentView: 'macro' });
        if (navOverview) navOverview.onclick = () => store.setState({ currentView: 'overview' });

        // Mobile Navigation
        const mobNavMacro = document.getElementById('mobile-nav-macro');
        const mobNavOverview = document.getElementById('mobile-nav-overview');

        if (mobNavMacro) mobNavMacro.onclick = () => store.setState({ currentView: 'macro' });
        if (mobNavOverview) mobNavOverview.onclick = () => store.setState({ currentView: 'overview' });
    }

    initEnergySlider() {
        const slider = document.getElementById('energy-level');
        if (!slider) return;

        const updateEnergyFeel = () => {
            const value = slider.value;
            const percentage = (value / slider.max) * 100;
            // Gradient from a tired green to a vibrant yellow/orange
            const color = `linear-gradient(90deg, #86efac ${percentage}%, #e5e7eb ${percentage}%)`;
            slider.style.background = color;
        };

        slider.addEventListener('input', updateEnergyFeel);
        
        // Also update when modal opens and sets the value
        // We can use a MutationObserver on the slider's value attribute
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    updateEnergyFeel();
                }
            });
        });
        observer.observe(slider, { attributes: true });

        updateEnergyFeel(); // Initial call
    }

    initPixelFarm() {
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
            // 自检修复：确保边框清晰可见，移除任何可能冲突的背景色类
            // 更改为实心土地背景色 bg-yellow-200
            plot.className = 'w-4 h-4 bg-amber-300 cursor-pointer hover:ring-2 hover:ring-amber-400 border border-amber-400/50 flex items-center justify-center rounded-sm';
            plot.dataset.date = dateStr;
            plot.onclick = (e) => {
                e.stopPropagation();
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
                plot.classList.remove('bg-amber-300', 'border-amber-400/50');
                plot.classList.add('bg-amber-600', 'border-amber-700/50');

            } else if (dayDate < today) { // 过去的日子，默认显示嫩芽
                plot.innerHTML = '<div class="w-1 h-1 bg-green-500 rounded-full"></div>';
                // 为过去未种植的地块也加深背景色
                plot.classList.remove('bg-amber-300', 'border-amber-400/50');
                plot.classList.add('bg-amber-600', 'border-amber-700/50');
            } 

            if (dayDate.getTime() === today.getTime()) {
                plot.classList.add('ring-2', 'ring-blue-500');
            }

            grid.appendChild(plot);
        }
    }

    showCropSelection(dateStr, element) {
        const menu = document.getElementById('crop-selection-menu');
        if (!menu) return;

        const rect = element.getBoundingClientRect();
        menu.style.top = `${window.scrollY + rect.bottom + 5}px`;
        menu.style.left = `${window.scrollX + rect.left}px`;
        menu.classList.remove('hidden');

        const newMenu = menu.cloneNode(true);
        menu.parentNode.replaceChild(newMenu, menu);

        newMenu.querySelectorAll('.seed-packet').forEach(packet => {
            packet.onclick = () => {
                const crop = packet.dataset.crop;
                const dayData = store.getAllData()[dateStr] || {};
                const currentData = store.getAllData();
                const updatedData = { 
                    ...currentData, 
                    [dateStr]: { ...dayData, crop: crop } 
                };
                store.setState({ userData: updatedData });
                newMenu.classList.add('hidden');
                this.initPixelFarm();
            };
        });

        const hideMenu = (e) => {
            if (!newMenu.contains(e.target)) {
                newMenu.classList.add('hidden');
                document.body.removeEventListener('click', hideMenu);
            }
        };
        document.body.addEventListener('click', hideMenu);
    }

    showCropDisplay(dateStr) {
        const panel = document.getElementById('crop-display-panel');
        const dateEl = document.getElementById('crop-display-date');
        const imageContainer = document.getElementById('crop-display-image-container');
        if (!panel || !dateEl || !imageContainer) return;

        const dayData = store.getAllData()[dateStr] || {};
        const cropImage = dayData.crop ? `<img src="${dayData.crop}" class="w-full h-full object-contain"/>` : '<span class="text-gray-400 text-xs">未种植</span>';

        dateEl.textContent = dateStr;
        imageContainer.innerHTML = cropImage;

        panel.classList.remove('hidden');

        // Optional: auto-hide after a few seconds
        setTimeout(() => {
            panel.classList.add('hidden');
        }, 4000);
    }





    scrollToXun(xunIndex) {
        // Use a timeout to ensure the element is in the DOM after a render
        setTimeout(() => {
            const element = document.getElementById(`xun-row-${xunIndex}`);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                // Highlight the row briefly
                element.style.transition = 'background-color 0.5s ease-in-out';
                element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; // blue-500 with 10% opacity
                setTimeout(() => {
                    element.style.backgroundColor = '';
                }, 2000);
            }
        }, 100); // A short delay
    }

    render(state, key, value) {
        // Save view state
        localStorage.setItem('xun_last_viewed_view', state.currentView);
        if (state.viewedXunIndex) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_VIEWED_XUN, state.viewedXunIndex);
        }

        // Toggle Containers
        const views = {
            'macro': document.getElementById('macro-view'),
            'overview': document.getElementById('overview-view'),
            'detail': document.getElementById('detail-view'), // detail view
            'summary': document.getElementById('summary-view')
        };
        const farmContainer = document.getElementById('pixel-farm-container');
        
        // Hide all first
        Object.values(views).forEach(el => {
            if (el) el.classList.add('hidden');
        });

        // Show/Hide Farm based on view
        if (farmContainer) {
            if (state.currentView === 'macro') {
                farmContainer.classList.remove('hidden');
            } else {
                farmContainer.classList.add('hidden');
            }
        }

        // Navigation State
        const navMacro = document.getElementById('nav-macro');
        const navOverview = document.getElementById('nav-overview');
        
        // Mobile Navigation Highlight
        const mobNavMacro = document.getElementById('mobile-nav-macro');
        const mobNavOverview = document.getElementById('mobile-nav-overview');

        if (navMacro && navOverview) {
            if (state.currentView === 'macro') {
                navMacro.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                navMacro.classList.remove('text-gray-500');
                navOverview.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                navOverview.classList.add('text-gray-500');
                
                if (mobNavMacro && mobNavOverview) {
                    mobNavMacro.classList.add('text-blue-600');
                    mobNavMacro.classList.remove('text-gray-400', 'hover:text-gray-600');
                    mobNavOverview.classList.remove('text-blue-600');
                    mobNavOverview.classList.add('text-gray-400', 'hover:text-gray-600');
                }
            } else {
                navOverview.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                navOverview.classList.remove('text-gray-500');
                navMacro.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                navMacro.classList.add('text-gray-500');

                if (mobNavMacro && mobNavOverview) {
                    mobNavOverview.classList.add('text-blue-600');
                    mobNavOverview.classList.remove('text-gray-400', 'hover:text-gray-600');
                    mobNavMacro.classList.remove('text-blue-600');
                    mobNavMacro.classList.add('text-gray-400', 'hover:text-gray-600');
                }
            }
        }

        // Render Specific View
        if (state.currentView === 'macro') {
            const el = document.getElementById('macro-view');
            if (el) el.classList.remove('hidden');
            
            // Only re-render if needed? 
            // For simplicity, re-render. MacroView should handle diffing or just clear/redraw.
            // It's fast enough.
            const currentXun = Calendar.getCurrentXun(this.xunPeriods);
            this.macroView.render(this.xunPeriods, currentXun);
        }
        else if (state.currentView === 'overview') {
            const el = document.getElementById('overview-view');
            if (el) el.classList.remove('hidden');
            this.overviewView.render(this.xunPeriods);

            // Also render DetailView (Combined Mode)
            const detailEl = document.getElementById('detail-view');
            if (detailEl) detailEl.classList.remove('hidden');
            
            const index = state.viewedXunIndex || 1;
            const period = this.xunPeriods.find(p => p.index === index);
            if (period) {
                this.detailView.render(period);
            }
        }
        else if (state.currentView === 'detail') {
            const el = document.getElementById('detail-view'); // I will rename in HTML
            if (el) el.classList.remove('hidden');
            
            const index = state.viewedXunIndex || 1;
            const period = this.xunPeriods.find(p => p.index === index);
            if (period) {
                this.detailView.render(period);
            }
        }
        else if (state.currentView === 'summary') {
            const el = document.getElementById('summary-view');
            if (el) el.classList.remove('hidden');
            
            const index = state.viewedXunIndex || 1;
            const period = this.xunPeriods.find(p => p.index === index);
            if (period) {
                this.summaryView.render(period);
            }
        }
    }
}

// Helper to expose to window for modules that might not import Calendar directly
// or for inline HTML usage if any remains
window.showView = (viewName) => {
    store.setState({ currentView: viewName });
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
