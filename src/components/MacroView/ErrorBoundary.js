export class MacroViewErrorBoundary {
    constructor(container, fallbackRenderer) {
        this.container = container;
        this.fallbackRenderer = fallbackRenderer;
        this.hasError = false;
        this.error = null;
        this.errorInfo = null;
    }

    static create(container, fallbackRenderer) {
        return new MacroViewErrorBoundary(container, fallbackRenderer);
    }

    wrapRender(renderFunction) {
        return (...args) => {
            try {
                if (this.hasError) {
                    this.renderError();
                    return;
                }
                
                return renderFunction(...args);
            } catch (error) {
                this.handleError(error, null);
                this.renderError();
            }
        };
    }

    handleError(error, errorInfo) {
        this.hasError = true;
        this.error = error;
        this.errorInfo = errorInfo;
        
        console.error('MacroView Error Boundary caught an error:', error);
        
        // Log to monitoring service in production
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'exception', {
                description: error.message,
                fatal: false
            });
        }
    }

    renderError() {
        if (!this.container) return;
        
        const errorHTML = this.fallbackRenderer ? 
            this.fallbackRenderer(this.error, this.errorInfo) : 
            this.defaultErrorRenderer();
        
        this.container.innerHTML = errorHTML;
    }

    defaultErrorRenderer() {
        return `
            <div class="macro-view-error-boundary p-6 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="polite">
                <div class="flex items-center mb-4">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">宏视图加载失败</h3>
                    </div>
                </div>
                <div class="text-sm text-red-700 mb-4">
                    抱歉，宏视图遇到了一个错误。请刷新页面重试，或联系技术支持。
                </div>
                <div class="flex space-x-3">
                    <button onclick="window.location.reload()" class="bg-red-100 text-red-800 px-3 py-2 rounded text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                        刷新页面
                    </button>
                    <button onclick="this.parentElement.parentElement.style.display='none'" class="bg-white text-red-800 px-3 py-2 rounded text-sm font-medium border border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                        隐藏错误
                    </button>
                </div>
                ${this.error ? `
                    <details class="mt-4">
                        <summary class="text-xs text-red-600 cursor-pointer">技术详情</summary>
                        <pre class="mt-2 text-xs text-red-500 bg-red-100 p-2 rounded overflow-auto">${this.error.stack}</pre>
                    </details>
                ` : ''}
            </div>
        `;
    }

    reset() {
        this.hasError = false;
        this.error = null;
        this.errorInfo = null;
    }
}

// Higher-order function to wrap component methods
export function withErrorBoundary(errorBoundary) {
    return function(target, propertyName, descriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = function(...args) {
            try {
                return originalMethod.apply(this, args);
            } catch (error) {
                errorBoundary.handleError(error, { target, propertyName, args });
                errorBoundary.renderError();
                return null;
            }
        };
        
        return descriptor;
    };
}
