import { store } from './State.js';

export class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
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

    update(currentView) {
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
}
