import { UserGuidance } from './UserGuidance.js';

export class OnboardingFlow {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.currentStep = 0;
        this.steps = UserGuidance.createOnboardingFlow();
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.loadProgress();
    }

    render() {
        const step = this.steps[this.currentStep];
        if (!step) return;

        this.container.innerHTML = `
            <div class="onboarding-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
                <div class="onboarding-content bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h2 id="onboarding-title" class="text-2xl font-bold text-gray-900">${step.title}</h2>
                            <button class="onboarding-close text-gray-400 hover:text-gray-600 transition-colors" aria-label="关闭引导">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="flex items-center mt-4 space-x-2">
                            ${this.steps.map((_, index) => `
                                <div class="onboarding-indicator h-2 flex-1 rounded-full transition-all duration-300 ${
                                    index === this.currentStep ? 'bg-blue-600' : 
                                    index < this.currentStep ? 'bg-green-500' : 'bg-gray-300'
                                }"></div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="p-6">
                        ${step.content}
                    </div>
                    
                    <div class="p-6 border-t border-gray-200 bg-gray-50">
                        <div class="flex justify-between items-center">
                            <button class="onboarding-prev px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors ${
                                this.currentStep === 0 ? 'invisible' : ''
                            }" ${this.currentStep === 0 ? 'disabled' : ''}>
                                ← 上一步
                            </button>
                            
                            <div class="flex space-x-3">
                                ${step.actions.map(action => `
                                    <button class="onboarding-action px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        action.type === 'next' || action.type === 'finish' 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                            : action.type === 'action'
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }" data-action="${action.type}">
                                        ${action.text}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Focus management
        const titleElement = this.container.querySelector('#onboarding-title');
        if (titleElement) titleElement.focus();
    }

    setupEventListeners() {
        // Close button
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.onboarding-close')) {
                this.close();
            }
        });

        // Navigation buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.onboarding-prev')) {
                this.previousStep();
            } else if (e.target.closest('.onboarding-action')) {
                const action = e.target.closest('.onboarding-action').dataset.action;
                this.handleAction(action);
            }
        });

        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            } else if (e.key === 'ArrowLeft') {
                this.previousStep();
            } else if (e.key === 'ArrowRight') {
                this.nextStep();
            }
        });

        // Click outside to close
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container.querySelector('.onboarding-overlay')) {
                this.close();
            }
        });
    }

    handleAction(action) {
        const step = this.steps[this.currentStep];
        
        switch (action) {
            case 'next':
                this.nextStep();
                break;
            case 'prev':
                this.previousStep();
                break;
            case 'finish':
                this.complete();
                break;
            case 'info':
                this.showAdditionalInfo(step.id);
                break;
            case 'action':
                this.executeStepAction(step.id);
                break;
        }
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.saveProgress();
            this.render();
        } else {
            this.complete();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.saveProgress();
            this.render();
        }
    }

    complete() {
        this.saveProgress();
        this.clearProgress();
        this.onComplete();
    }

    close() {
        this.saveProgress();
        this.container.innerHTML = '';
    }

    showAdditionalInfo(stepId) {
        const infoContent = {
            'welcome': `
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-blue-900 mb-2">36旬时间管理法</h4>
                    <p class="text-blue-800 text-sm">相比月度目标，旬目标更具体、更易实现。相比每日目标，旬目标更灵活、更有弹性。</p>
                    <div class="mt-3 text-blue-800 text-sm">
                        <strong>优势：</strong>
                        <ul class="list-disc list-inside mt-1 space-y-1">
                            <li>目标周期适中，避免过于频繁或过于宽松</li>
                            <li>便于复盘总结，及时调整策略</li>
                            <li>培养持续性和节奏感</li>
                        </ul>
                    </div>
                </div>
            `,
            'goal-setting': `
                <div class="bg-green-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-green-900 mb-2">更多目标示例</h4>
                    <div class="space-y-2 text-green-800 text-sm">
                        <div><strong>健康类：</strong>"本旬完成8次瑜伽练习，每次20分钟"</div>
                        <div><strong>学习类：</strong>"本旬读完一本书，每天阅读30页"</div>
                        <div><strong>工作类：</strong>"本旬完成项目报告的初稿"</div>
                        <div><strong>社交类：</strong>"本旬主动联系3位老朋友"</div>
                    </div>
                </div>
            `,
            'daily-checkin': `
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-purple-900 mb-2">设置打卡提醒</h4>
                    <p class="text-purple-800 text-sm">建议每天固定时间打卡，如晚上9点。可以使用浏览器通知或手机提醒。</p>
                    <div class="mt-3">
                        <button class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
                            设置浏览器提醒
                        </button>
                    </div>
                </div>
            `
        };

        const content = infoContent[stepId];
        if (content) {
            this.showModal('补充信息', content);
        }
    }

    executeStepAction(stepId) {
        switch (stepId) {
            case 'daily-checkin':
                this.requestNotificationPermission();
                break;
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showModal('提醒设置成功', '您将收到每日打卡提醒。');
                }
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            this.showModal('提醒已开启', '您的每日打卡提醒已经开启。');
        } else {
            this.showModal('无法设置提醒', '请检查浏览器通知权限设置。');
        }
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">${title}</h3>
                <div>${content}</div>
                <button class="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    确定
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.tagName === 'BUTTON') {
                document.body.removeChild(modal);
            }
        });
    }

    saveProgress() {
        localStorage.setItem('macroview_onboarding_progress', this.currentStep.toString());
    }

    loadProgress() {
        const saved = localStorage.getItem('macroview_onboarding_progress');
        if (saved !== null) {
            this.currentStep = parseInt(saved);
        }
    }

    clearProgress() {
        localStorage.removeItem('macroview_onboarding_progress');
    }

    shouldShowOnboarding() {
        return !localStorage.getItem('macroview_onboarding_completed');
    }

    markCompleted() {
        localStorage.setItem('macroview_onboarding_completed', 'true');
    }
}
