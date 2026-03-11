
import { CONFIG } from '../config.js';
import { store } from './State.js';
import { Calendar } from './Calendar.js';
import { backgroundLoader } from './BackgroundLoader.js';
import { MacroView } from '../components/MacroView.js';
import { OverviewView } from '../components/OverviewView.js';
import { DetailView } from '../components/DetailView.js';
import { SummaryView } from '../components/SummaryView.js';
import { Modal } from '../components/Modal.js';
import { BackupModal } from '../components/BackupModal.js';
import { SettingsModal } from '../components/SettingsModal.js';
import { QuoteSystem } from '../quote.js';

import MenstrualView from '../components/MenstrualView.js';

class App {
    constructor() {
        this.xunPeriods = Calendar.getXunPeriods(CONFIG.YEAR);
        this.initViews();
        this.initModal();
        this.initBackup();
        this.menstrualBtn = document.getElementById('menstrual-view-btn');
        this.initSettings();
        this.initTheme();
        this.initYearProgress();
        this.initNavigation();
        this.initEnergySlider();
        this.initPixelFarm();
        this.initPixelFarmToggle();
        QuoteSystem.init();
        this.checkMenstrualPrediction();
        
        // Initialize mobile current xun FAB
        this.initMobileCurrentXunFAB();
        
        // Subscribe to store
        store.subscribe(this.render.bind(this));
        
        // Initial Render
        this.render(store.getState());
        
        // Force initial view to macro and scroll to current xun
        const currentXun = Calendar.getCurrentXun(this.xunPeriods);
        const initialXunIndex = currentXun ? currentXun.index : 1;
        
        // Debug logging
        console.log('App initialization:');
        console.log('- Today:', new Date().toISOString());
        console.log('- Current Xun found:', currentXun);
        console.log('- Initial Xun Index:', initialXunIndex);
        console.log('- Today date:', new Date().toDateString());
        console.log('- Today time:', new Date().toTimeString());
        console.log('- Xun Periods:', this.xunPeriods.slice(0, 10).map(p => ({
            index: p.index,
            start: p.startDate.toISOString().split('T')[0],
            end: p.endDate.toISOString().split('T')[0],
            startFull: p.startDate.toString(),
            endFull: p.endDate.toString()
        })));

        store.setState({ 
            currentView: 'macro', 
            viewedXunIndex: initialXunIndex 
        });

        // Auto-scroll to current xun on initial load
        if (currentXun) {
            console.log('Scrolling to Xun:', currentXun.index);
            this.scrollToXun(currentXun.index);
        } else {
            console.log('No current xun found, calculating manually...');
            // 手动计算今天应该属于哪一旬
            const now = new Date();
            const startOfYear = new Date(CONFIG.YEAR, 0, 1);
            const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
            const calculatedXunIndex = Math.ceil(dayOfYear / 10);
            
            console.log('Day of year:', dayOfYear);
            console.log('Calculated Xun index:', calculatedXunIndex);
            
            // 确保索引在有效范围内
            const targetXunIndex = Math.max(1, Math.min(calculatedXunIndex, CONFIG.XUN_COUNT));
            console.log('Force scrolling to Xun', targetXunIndex);
            this.scrollToXun(targetXunIndex);
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

                if (selectedMood === '5' && seedPacketContainer) {
                    seedPacketContainer.classList.remove('hidden');
                } else if (seedPacketContainer) {
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

        this.modal.elements.deleteBtn.addEventListener('click', () => {
            const date = this.modal.elements.dateTitle.textContent;
            const oldData = store.getDay(date);
            store.deleteDay(date);
            this.modal.close();
            this.initPixelFarm(); // Re-render the farm
            this.showToast('记录已删除', () => {
                store.updateDay(date, oldData);
                this.initPixelFarm();
            });
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
        // 确保DOM完全加载后再初始化SettingsModal
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initSettingsModal();
            });
        } else {
            this.initSettingsModal();
        }
    }

    initSettingsModal() {
        this.settingsModal = new SettingsModal('settings-modal');
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.onclick = () => this.settingsModal.open();
        }
    }

    initTheme() {
        // Initialize background loader
        backgroundLoader.seasonalPreload();
        
        // Expose setTheme to window for legacy onclick
        window.setTheme = async (themeName) => {
            // Reset body classes
            document.body.className = "bg-gray-50 text-gray-800 antialiased overflow-x-hidden";
            
            if (themeName !== 'default') {
                // Use background loader for optimized loading
                await backgroundLoader.loadTheme(themeName);
            } else {
                // Clear theme
                document.body.classList.remove('theme-spring', 'theme-summer', 'theme-autumn', 'theme-winter');
            }
            
            localStorage.setItem('xun_theme', themeName);
            
            // Preload next theme
            if (themeName !== 'default') {
                backgroundLoader.preloadNextTheme(themeName);
            }
            
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

    updateNavigation(currentView) {
        const macroBtn = document.getElementById('nav-macro');
        const overviewBtn = document.getElementById('nav-overview');

        if (currentView === 'macro') {
            macroBtn.className = 'nav-item nav-item-active';
            overviewBtn.className = 'nav-item nav-item-inactive';
        } else {
            macroBtn.className = 'nav-item nav-item-inactive';
            overviewBtn.className = 'nav-item nav-item-active';
        }

        // Mobile Navigation Highlight (保持原有的移动端逻辑)
        const mobNavMacro = document.getElementById('mobile-nav-macro');
        const mobNavOverview = document.getElementById('mobile-nav-overview');

        if (mobNavMacro && mobNavOverview) {
            if (currentView === 'macro') {
                mobNavMacro.classList.add('text-blue-600');
                mobNavMacro.classList.remove('text-gray-400', 'hover:text-gray-600');
                mobNavOverview.classList.remove('text-blue-600');
                mobNavOverview.classList.add('text-gray-400', 'hover:text-gray-600');
            } else {
                mobNavOverview.classList.add('text-blue-600');
                mobNavOverview.classList.remove('text-gray-400', 'hover:text-gray-600');
                mobNavMacro.classList.remove('text-blue-600');
                mobNavMacro.classList.add('text-gray-400', 'hover:text-gray-600');
            }
        }
    }

    initEnergySlider() {
        const slider = document.getElementById('energy-level');
        if (!slider) return;

        const updateEnergyFeel = () => {
            const value = slider.value;
            // 完整区间渐变：左侧偏冷、右侧偏暖，中间过渡
            const color = 'linear-gradient(90deg, #22c55e 0%, #3b82f6 33%, #a855f7 66%, #f97316 100%)';
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
            // 基础像素土地块：留出间隔，由容器 gap 控制
            plot.className = 'w-4 h-4 cursor-pointer hover:ring-2 hover:ring-amber-400 border border-amber-400/50 flex items-center justify-center rounded-sm';
            plot.dataset.date = dateStr;
            plot.setAttribute('title', dateStr);
            plot.setAttribute('aria-label', dateStr);
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

    initPixelFarmToggle() {
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
        if (!menu) return;

        const rect = element.getBoundingClientRect();
        const menuWidth = 200; // Approximate menu width based on max-w-xs and content
        
        // Calculate initial position
        let left = window.scrollX + rect.left;
        let top = window.scrollY + rect.bottom + 5;
        
        // Adjust horizontal position if menu would go beyond right viewport
        if (left + menuWidth > window.innerWidth + window.scrollX) {
            left = window.scrollX + rect.right - menuWidth;
            // Ensure menu doesn't go beyond left viewport either
            if (left < window.scrollX) {
                left = window.scrollX + 10;
            }
        }
        
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
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

    showToast(message, onUndo) {
        const toast = document.getElementById('toast-container');
        const messageEl = document.getElementById('toast-message');
        const undoBtn = document.getElementById('toast-undo');

        if (!toast || !messageEl || !undoBtn) return;

        messageEl.textContent = message;

        const undoHandler = () => {
            onUndo();
            toast.classList.add('hidden');
            clearTimeout(timer);
        };

        undoBtn.onclick = undoHandler;

        toast.classList.remove('hidden');

        const timer = setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);
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
                // Check if mobile device
                const isMobile = window.innerWidth <= 768;
                
                // Enhanced scroll with better positioning
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: isMobile ? 'start' : 'center', // On mobile, scroll to top for better visibility
                    inline: 'nearest'
                });
                
                // Enhanced highlight animation sequence
                element.style.transition = 'all 0.5s ease-in-out';
                
                // Different effects for mobile vs desktop
                if (isMobile) {
                    // Mobile: more subtle but still noticeable effects
                    element.style.transform = 'scale(1.015)';
                    element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5), 0 4px 20px rgba(59, 130, 246, 0.2)';
                    element.style.zIndex = '30';
                } else {
                    // Desktop: stronger effects
                    element.style.transform = 'scale(1.03)';
                    element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.6), 0 8px 30px rgba(59, 130, 246, 0.3), 0 0 50px rgba(59, 130, 246, 0.2)';
                    element.style.zIndex = '50';
                }
                
                // Create a temporary flash effect
                const flashOverlay = document.createElement('div');
                const flashIntensity = isMobile ? 0.15 : 0.2;
                flashOverlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, rgba(59, 130, 246, ${flashIntensity}), rgba(147, 197, 253, ${flashIntensity * 1.5}));
                    border-radius: inherit;
                    pointer-events: none;
                    z-index: 51;
                    animation: flashHighlight 1s ease-out;
                `;
                element.style.position = 'relative';
                element.appendChild(flashOverlay);
                
                // Add flash animation keyframes if not already present
                if (!document.getElementById('flash-highlight-style')) {
                    const style = document.createElement('style');
                    style.id = 'flash-highlight-style';
                    style.textContent = `
                        @keyframes flashHighlight {
                            0% { opacity: 0; }
                            20% { opacity: 1; }
                            100% { opacity: 0; }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                // Mobile-specific: Add haptic feedback if available
                if (isMobile && navigator.vibrate) {
                    navigator.vibrate(50); // Short vibration for attention
                }
                
                // Gradually reduce the highlight effects
                setTimeout(() => {
                    if (isMobile) {
                        element.style.transform = 'scale(1.01)';
                        element.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.4), 0 2px 15px rgba(59, 130, 246, 0.2)';
                        element.style.zIndex = '10';
                    } else {
                        element.style.transform = 'scale(1.02)';
                        element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3), 0 4px 20px rgba(59, 130, 246, 0.15), 0 0 30px rgba(59, 130, 246, 0.1)';
                        element.style.zIndex = '10';
                    }
                    
                    // Remove flash overlay
                    if (flashOverlay.parentNode) {
                        flashOverlay.parentNode.removeChild(flashOverlay);
                    }
                }, isMobile ? 800 : 1000);
                
                // Final gentle return to normal state (keeping the current-xun-highlight class effects)
                setTimeout(() => {
                    element.style.transform = '';
                    element.style.boxShadow = '';
                    element.style.zIndex = '';
                }, isMobile ? 2000 : 2500);
            }
        }, 100); // A short delay
    }

    initMobileCurrentXunFAB() {
        const fab = document.getElementById('mobile-current-xun-fab');
        const xunNumber = document.getElementById('current-xun-number');
        
        if (!fab || !xunNumber) return;
        
        // Update FAB with current xun info
        const updateFAB = () => {
            const currentXun = Calendar.getCurrentXun(this.xunPeriods);
            const state = store.getState();
            const isMobile = window.innerWidth <= 768;
            
            if (currentXun && isMobile && state.currentView === 'macro') {
                xunNumber.textContent = currentXun.index;
                fab.classList.add('show');
                fab.onclick = () => {
                    this.scrollToXun(currentXun.index);
                    // Haptic feedback on mobile
                    if (navigator.vibrate) {
                        navigator.vibrate(30);
                    }
                };
            } else {
                fab.classList.remove('show');
            }
        };
        
        // Initial update
        updateFAB();
        
        // Update on view changes and window resize
        store.subscribe(updateFAB);
        window.addEventListener('resize', updateFAB);
        
        // Show/hide based on scroll position
        let lastScrollY = window.scrollY;
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const scrollThreshold = 200;
            
            // Only show/hide if in macro view and on mobile
            const state = store.getState();
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile && state.currentView === 'macro') {
                if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
                    if (currentScrollY > lastScrollY) {
                        // Scrolling down - hide FAB
                        fab.style.transform = 'translateY(100px) scale(0.8)';
                        fab.style.opacity = '0';
                    } else {
                        // Scrolling up - show FAB
                        fab.style.transform = 'translateY(0) scale(1)';
                        fab.style.opacity = '1';
                    }
                    lastScrollY = currentScrollY;
                }
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    render(state, key, value) {
        // Save view state
        localStorage.setItem('xun_last_viewed_view', state.currentView);
        if (state.viewedXunIndex) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_VIEWED_XUN, state.viewedXunIndex);
        }

        if (this.menstrualBtn) {
            this.menstrualBtn.style.display = state.settings.showMenstrualCycle ? 'block' : 'none';
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
        this.updateNavigation(state.currentView);

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

        this.checkMenstrualPrediction();
    }

    getWeightedPeriodPredictionInfo(cycles) {
        if (!Array.isArray(cycles) || cycles.length === 0) {
            return null;
        }

        // 只保留有 start 的周期，并按开始时间排序
        const history = cycles
            .filter(c => !!c.start)
            .slice()
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        if (history.length < 2) {
            return null;
        }

        const getDaysBetween = (startStr, endStr) => {
            const start = new Date(startStr);
            const end = new Date(endStr);
            const diffTime = end - start;
            return Math.round(diffTime / (1000 * 60 * 60 * 24));
        };

        // 计算相邻两次开始日期之间的周期长度
        const cycleLengths = [];
        for (let i = 1; i < history.length; i++) {
            cycleLengths.push(getDaysBetween(history[i - 1].start, history[i].start));
        }

        if (cycleLengths.length === 0) {
            return null;
        }

        // 加权移动平均（最近的记录权重更高）
        const baseWeights = [0.2, 0.3, 0.5]; // 针对最近 3 次
        const recent = cycleLengths.slice(-3);
        const weights = baseWeights.slice(baseWeights.length - recent.length);
        const weightSum = weights.reduce((a, b) => a + b, 0);

        let weightedSum = 0;
        for (let i = 0; i < recent.length; i++) {
            weightedSum += recent[i] * weights[i];
        }
        const avgCycle = weightedSum / (weightSum || 1);

        const addDays = (date, days) => {
            const d = new Date(date.getTime());
            d.setDate(d.getDate() + days);
            return d;
        };

        const lastStart = new Date(history[history.length - 1].start);
        const predictedDate = addDays(lastStart, Math.round(avgCycle));

        const month = predictedDate.getMonth() + 1;
        const day = predictedDate.getDate();
        const text = `预计下次：${month}月${day}日左右，请提前准备好卫生巾、棉条等用品。`;

        return {
            text,
            predictedDate
        };
    }

    checkMenstrualPrediction() {
        const { settings, menstrualData } = store.getState();
        if (!settings.showMenstrualCycle || !menstrualData) return;

        const banner = document.getElementById('menstrual-prediction-banner');
        const bannerText = document.getElementById('menstrual-prediction-text');
        const closeBtn = document.getElementById('close-menstrual-banner');

        if (!banner || !bannerText || !closeBtn) return;

        const info = this.getWeightedPeriodPredictionInfo(menstrualData.cycles || []);

        if (info && info.predictedDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const predictionDate = new Date(info.predictedDate.getFullYear(), info.predictedDate.getMonth(), info.predictedDate.getDate());
            const diffTime = predictionDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0 && diffDays <= 3) {
                bannerText.textContent = info.text;
                banner.classList.remove('hidden');
            } else {
                banner.classList.add('hidden');
            }
        } else {
            banner.classList.add('hidden');
        }

        closeBtn.onclick = () => banner.classList.add('hidden');
    }
}

// Helper to expose to window for modules that might not import Calendar directly
// or for inline HTML usage if any remains
window.showView = (viewName) => {
    store.setState({ currentView: viewName });
};

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    new MenstrualView();
});
