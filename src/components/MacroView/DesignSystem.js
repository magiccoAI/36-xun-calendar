export class DesignSystem {
    static applyXunColor(element, hue, intensity = 'base') {
        const intensities = {
            base: `hsl(${hue}, 70%, 96%)`,
            accent: `hsl(${hue}, 80%, 60%)`,
            hover: `hsl(${hue}, 80%, 50%)`,
            light: `hsl(${hue}, 70%, 98%)`
        };
        
        element.style.setProperty('--xun-hue', hue);
        element.style.backgroundColor = intensities[intensity] || intensities.base;
    }

    static getSpacing(size) {
        const sizes = {
            xs: 'var(--spacing-xs)',
            sm: 'var(--spacing-sm)',
            md: 'var(--spacing-md)',
            lg: 'var(--spacing-lg)',
            xl: 'var(--spacing-xl)',
            '2xl': 'var(--spacing-2xl)',
            '3xl': 'var(--spacing-3xl)',
            '4xl': 'var(--spacing-4xl)',
            '5xl': 'var(--spacing-5xl)'
        };
        
        return sizes[size] || sizes.md;
    }

    static getColor(color, shade = 500) {
        return `var(--color-${color}-${shade})`;
    }

    static getFontSize(size) {
        const sizes = {
            xs: 'var(--font-size-xs)',
            sm: 'var(--font-size-sm)',
            base: 'var(--font-size-base)',
            lg: 'var(--font-size-lg)',
            xl: 'var(--font-size-xl)',
            '2xl': 'var(--font-size-2xl)',
            '3xl': 'var(--font-size-3xl)',
            '4xl': 'var(--font-size-4xl)'
        };
        
        return sizes[size] || sizes.base;
    }

    static getBorderRadius(size) {
        const sizes = {
            xs: 'var(--radius-xs)',
            sm: 'var(--radius-sm)',
            md: 'var(--radius-md)',
            lg: 'var(--radius-lg)',
            xl: 'var(--radius-xl)',
            '2xl': 'var(--radius-2xl)',
            full: 'var(--radius-full)'
        };
        
        return sizes[size] || sizes.md;
    }

    static getShadow(size) {
        const sizes = {
            xs: 'var(--shadow-xs)',
            sm: 'var(--shadow-sm)',
            md: 'var(--shadow-md)',
            lg: 'var(--shadow-lg)',
            xl: 'var(--shadow-xl)'
        };
        
        return sizes[size] || sizes.sm;
    }

    static getTransition(speed = 'normal') {
        const speeds = {
            fast: 'var(--transition-fast)',
            normal: 'var(--transition-normal)',
            slow: 'var(--transition-slow)'
        };
        
        return speeds[speed] || speeds.normal;
    }

    static createResponsiveStyles(breakpoint, styles) {
        return `
            @media (min-width: ${breakpoint}) {
                ${styles}
            }
        `;
    }

    static generateProgressStyles(hue) {
        return `
            .progress-day {
                background-color: var(--color-xun-progress-bg);
                border-color: var(--color-xun-progress-border);
                border-radius: var(--radius-sm);
                transition: all var(--transition-normal);
            }
            
            .progress-day:checked {
                background-color: var(--color-xun-progress-checked);
                border-color: var(--color-xun-progress-checked);
            }
            
            .progress-day.today {
                border-color: var(--color-xun-progress-today);
                box-shadow: var(--shadow-md);
            }
            
            .progress-day:hover:not(:disabled) {
                transform: scale(1.1);
                box-shadow: var(--shadow-lg);
            }
            
            .progress-day:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
            
            /* Mobile specific progress styles */
            @media (max-width: 767px) {
                .mobile-progress-day button {
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: var(--radius-xl);
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-bold);
                }
                
                .mobile-progress-day button:active {
                    transform: scale(0.95);
                }
            }
        `;
    }

    static generateRowStyles(hue, isCurrent = false) {
        const baseStyles = `
            background-color: var(--color-xun-bg-base);
            border-bottom: 1px solid var(--color-border);
            transition: all var(--transition-normal);
            position: relative;
        `;

        const currentStyles = isCurrent ? `
            border: 2px solid var(--color-xun-current);
            box-shadow: var(--shadow-lg);
            z-index: 10;
        ` : '';

        const hoverStyles = `
            &:hover {
                opacity: 0.9;
                background-color: var(--color-surface-hover);
            }
            
            &:focus-within {
                outline: 2px solid var(--color-border-focus);
                outline-offset: 2px;
            }
        `;

        return `${baseStyles} ${currentStyles} ${hoverStyles}`;
    }

    static generateInputStyles() {
        return `
            background: transparent;
            border: 1px solid transparent;
            border-radius: var(--radius-md);
            padding: var(--spacing-sm) var(--spacing-md);
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
            resize: none;
            overflow: hidden;
            transition: all var(--transition-normal);
            width: 100%;
            min-height: 2.5rem;
            
            &:hover {
                background: rgba(255, 255, 255, 0.7);
            }
            
            &:focus {
                background: var(--color-background);
                border-color: var(--color-border-focus);
                outline: 2px solid var(--color-border-focus);
                outline-offset: 2px;
            }
            
            &::placeholder {
                color: var(--color-text-tertiary);
            }
        `;
    }

    static getAccessibilityStyles() {
        return `
            /* Screen reader only content */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            /* Focus visible for better keyboard navigation */
            :focus-visible {
                outline: 2px solid var(--color-border-focus);
                outline-offset: 2px;
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                :host {
                    border: 2px solid #000;
                }
                
                .progress-day {
                    border: 2px solid #000;
                }
                
                .current-badge {
                    background: #000;
                    color: #fff;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
    }

    static createComponentVariant(baseClass, variant) {
        const variants = {
            primary: {
                background: 'var(--color-primary-500)',
                color: 'var(--color-text-inverse)',
                hover: 'var(--color-primary-600)',
                focus: 'var(--color-primary-700)'
            },
            secondary: {
                background: 'var(--color-gray-100)',
                color: 'var(--color-text-primary)',
                hover: 'var(--color-gray-200)',
                focus: 'var(--color-gray-300)'
            },
            success: {
                background: 'var(--color-success-500)',
                color: 'var(--color-text-inverse)',
                hover: 'var(--color-success-600)',
                focus: 'var(--color-success-700)'
            },
            warning: {
                background: 'var(--color-warning-500)',
                color: 'var(--color-text-inverse)',
                hover: 'var(--color-warning-600)',
                focus: 'var(--color-warning-700)'
            },
            error: {
                background: 'var(--color-error-500)',
                color: 'var(--color-text-inverse)',
                hover: 'var(--color-error-600)',
                focus: 'var(--color-error-700)'
            }
        };
        
        const variantStyles = variants[variant] || variants.primary;
        
        return `
            .${baseClass} {
                background-color: ${variantStyles.background};
                color: ${variantStyles.color};
                border: 1px solid transparent;
                border-radius: var(--radius-md);
                padding: var(--spacing-sm) var(--spacing-lg);
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
                transition: all var(--transition-normal);
                cursor: pointer;
                
                &:hover {
                    background-color: ${variantStyles.hover};
                }
                
                &:focus {
                    background-color: ${variantStyles.focus};
                    outline: 2px solid var(--color-border-focus);
                    outline-offset: 2px;
                }
                
                &:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            }
        `;
    }
}
