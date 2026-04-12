import { backgroundLoader } from './BackgroundLoader.js';

export class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize background loader
        backgroundLoader.seasonalPreload();

        // Load saved theme
        const savedTheme = localStorage.getItem('xun_theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
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

            // Bind theme menu buttons with event delegation
            menu.addEventListener('click', (e) => {
                const themeBtn = e.target.closest('.theme-btn');
                if (themeBtn) {
                    const themeName = themeBtn.dataset.theme;
                    this.setTheme(themeName);
                }
            });
        }
    }

    async setTheme(themeName) {
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
    }
}
