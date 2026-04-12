export class LifeCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['xun-index', 'hue', 'life-data', 'is-empty', 'is-current'];
    }

    connectedCallback() {
        this.render();
        this.setupListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    setupListeners() {
        const card = this.shadowRoot.querySelector('.life-card');
        if (card) {
            card.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('life-card-click', {
                    detail: { 
                        xunIndex: parseInt(this.getAttribute('xun-index'))
                    },
                    bubbles: true,
                    composed: true
                }));
            });
        }
    }

    extractLifeFragments(lifeData) {
        if (!lifeData || typeof lifeData !== 'object') return null;

        const fragments = {
            moods: [],
            moments: [],
            keywords: [],
            snippet: ''
        };

        // Extract moods from daily records
        if (lifeData.dailyRecords) {
            Object.values(lifeData.dailyRecords).forEach(record => {
                if (record.mood) {
                    fragments.moods.push(record.mood);
                }
                if (record.three_good_things && Array.isArray(record.three_good_things)) {
                    fragments.moments.push(...record.three_good_things);
                }
                if (record.keywords && Array.isArray(record.keywords)) {
                    fragments.keywords.push(...record.keywords);
                }
            });
        }

        // Generate snippet from goal or remarks
        if (lifeData.goal) {
            fragments.snippet = lifeData.goal.length > 50 
                ? lifeData.goal.substring(0, 47) + '...' 
                : lifeData.goal;
        } else if (lifeData.remarks) {
            fragments.snippet = lifeData.remarks.length > 50 
                ? lifeData.remarks.substring(0, 47) + '...' 
                : lifeData.remarks;
        }

        // Remove duplicates and limit items
        fragments.moods = [...new Set(fragments.moods)].slice(0, 3);
        fragments.moments = [...new Set(fragments.moments)].slice(0, 3);
        fragments.keywords = [...new Set(fragments.keywords)].slice(0, 4);

        return fragments;
    }

    getMoodColor(mood) {
        const moodColors = {
            'calm': '#60a5fa',      // blue
            'happy': '#fbbf24',     // amber
            'anxious': '#f87171',   // red
            'sad': '#94a3b8',       // slate
            'energetic': '#34d399', // emerald
            'peaceful': '#a78bfa',  // purple
            'focused': '#06b6d4',   // cyan
            'grateful': '#fb923c'   // orange
        };
        return moodColors[mood] || '#9ca3af'; // gray default
    }

    render() {
        const xunIndex = this.getAttribute('xun-index');
        const hue = this.getAttribute('hue') || '0';
        const isEmpty = this.getAttribute('is-empty') === 'true';
        const isCurrent = this.getAttribute('is-current') === 'true';
        const lifeDataStr = this.getAttribute('life-data');
        
        let lifeData = null;
        try {
            lifeData = lifeDataStr ? JSON.parse(lifeDataStr) : null;
        } catch (e) {
            console.warn('Invalid life data format:', lifeDataStr);
        }

        const fragments = lifeData ? this.extractLifeFragments(lifeData) : null;
        const hasContent = fragments && (
            fragments.moods.length > 0 || 
            fragments.moments.length > 0 || 
            fragments.keywords.length > 0 || 
            fragments.snippet
        );

        const bgColor = `hsl(${hue}, 70%, 96%)`;
        const borderColor = `hsl(${hue}, 70%, 85%)`;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    min-height: 60px;
                }

                .life-card {
                    background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%);
                    border: 1px solid ${borderColor};
                    border-radius: 12px;
                    padding: 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    min-height: 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .life-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                    border-color: ${borderColor}cc;
                }

                .life-card:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }

                .current-xun {
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    border-color: #3b82f6;
                }

                /* Empty state styles */
                .empty-state {
                    text-align: center;
                    color: #6b7280;
                    font-size: 0.875rem;
                    font-style: italic;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }

                .life-card:hover .empty-state {
                    opacity: 1;
                    color: #4b5563;
                }

                .empty-state .icon {
                    font-size: 1.2rem;
                    margin-bottom: 4px;
                    opacity: 0.5;
                }

                /* Content styles */
                .life-content {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .mood-indicators {
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                }

                .mood-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }

                .mood-dot:hover {
                    transform: scale(1.3);
                }

                .life-moments {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .moment-tag {
                    background: rgba(255, 255, 255, 0.8);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 6px;
                    padding: 2px 6px;
                    font-size: 0.75rem;
                    color: #374151;
                    max-width: 80px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .keywords {
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                }

                .keyword {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                    border-radius: 4px;
                    padding: 1px 4px;
                    font-size: 0.7rem;
                    font-weight: 500;
                }

                .life-snippet {
                    font-size: 0.8rem;
                    color: #4b5563;
                    line-height: 1.3;
                    font-style: italic;
                    opacity: 0.8;
                }

                /* Responsive */
                @media (max-width: 767px) {
                    .life-card {
                        padding: 8px;
                        min-height: 50px;
                    }

                    .moment-tag {
                        font-size: 0.7rem;
                        max-width: 60px;
                    }

                    .life-snippet {
                        font-size: 0.75rem;
                    }
                }

                /* Animation for current xun */
                @keyframes gentle-pulse {
                    0%, 100% { opacity: 0.8; }
                    50% { opacity: 1; }
                }

                .current-xun::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #3b82f6, transparent);
                    animation: gentle-pulse 3s ease-in-out infinite;
                }
            </style>

            <div class="life-card ${isCurrent ? 'current-xun' : ''}" tabindex="0" role="button" aria-label="Life card for xun ${xunIndex}">
                ${isEmpty || !hasContent ? this.renderEmptyState() : this.renderContent(fragments)}
            </div>
        `;
    }

    renderEmptyState() {
        const messages = [
            "Begin recording your life moments",
            "Start your journey here",
            "Your story begins",
            "Capture the essence",
            "Begin your reflection"
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        return `
            <div class="empty-state">
                <div class="icon">...</div>
                <div>${randomMessage}</div>
            </div>
        `;
    }

    renderContent(fragments) {
        return `
            <div class="life-content">
                ${fragments.moods.length > 0 ? `
                    <div class="mood-indicators">
                        ${fragments.moods.map(mood => `
                            <div class="mood-dot" 
                                 style="background-color: ${this.getMoodColor(mood)}" 
                                 title="${mood}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${fragments.moments.length > 0 ? `
                    <div class="life-moments">
                        ${fragments.moments.map(moment => `
                            <span class="moment-tag" title="${moment}">${moment}</span>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${fragments.keywords.length > 0 ? `
                    <div class="keywords">
                        ${fragments.keywords.map(keyword => `
                            <span class="keyword">${keyword}</span>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${fragments.snippet ? `
                    <div class="life-snippet">${fragments.snippet}</div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('life-card', LifeCard);
