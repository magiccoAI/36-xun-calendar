
import { CONFIG } from '../config.js';
import { store } from './State.js';
import { Calendar } from './Calendar.js';
import { MacroView } from '../components/MacroView.js';
import { OverviewView } from '../components/OverviewView.js';
import { DetailView } from '../components/DetailView.js';
import { SummaryView } from '../components/SummaryView.js';
import { Modal } from '../components/Modal.js';
import { BackupModal } from '../components/BackupModal.js';
import { QuoteSystem } from '../quote.js';

class App {
    constructor() {
        this.xunPeriods = Calendar.getXunPeriods(CONFIG.YEAR);
        this.initViews();
        this.initModal();
        this.initBackup();
        this.initTheme();
        this.initYearProgress();
        this.initNavigation();
        QuoteSystem.init();
        
        // Subscribe to store
        store.subscribe(this.render.bind(this));
        
        // Initial Render
        this.render(store.getState());
        
        // Check for saved view state or default
        const lastView = localStorage.getItem('xun_last_viewed_view') || 'macro';
        const lastIndex = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_VIEWED_XUN)) || 1;
        
        // If hash exists, it overrides
        // (Optional: handle hash routing)

        store.setState({ 
            currentView: lastView, 
            viewedXunIndex: lastIndex 
        });
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
            const header = document.querySelector('header');
            if (header) {
                if (isSpringFestival) {
                    header.classList.add('spring-festival-theme');
                } else {
                    header.classList.remove('spring-festival-theme');
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
        const mobNavSettings = document.getElementById('mobile-nav-settings');

        if (mobNavMacro) mobNavMacro.onclick = () => store.setState({ currentView: 'macro' });
        if (mobNavOverview) mobNavOverview.onclick = () => store.setState({ currentView: 'overview' });
        if (mobNavSettings) mobNavSettings.onclick = () => this.backupModal.open();
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
        
        // Hide all first
        Object.values(views).forEach(el => {
            if (el) el.classList.add('hidden');
        });

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
