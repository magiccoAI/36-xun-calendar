(function(global) {
    const STORAGE_KEY_DATE = 'daily_quote_date';
    const STORAGE_KEY_DATA = 'daily_quote_content';

    const QuoteSystem = {
        init: function() {
            this.updateDOM(); // Try to load from cache first
            
            const today = new Date().toISOString().split('T')[0];
            const lastDate = localStorage.getItem(STORAGE_KEY_DATE);

            if (lastDate !== today) {
                this.fetchQuote(false);
            }

            const refreshBtn = document.getElementById('refresh-quote');
            if (refreshBtn) {
                // Remove old event listeners by cloning (simple way) or just assigning onclick
                // Since we are replacing logic, we can just overwrite onclick if it was set that way
                // But better to add event listener. 
                // Note: In index.html, it was refreshQuoteBtn.onclick = ...
                refreshBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.fetchQuote(true);
                };
            }
        },

        getStrategies: function() {
            return [
                { url: 'https://v1.hitokoto.cn?c=d', type: 'hitokoto' }, // Literature
                { url: 'https://v1.hitokoto.cn?c=h', type: 'hitokoto' }, // Film
                { url: 'https://v1.hitokoto.cn?c=j', type: 'hitokoto' }, // Music
                { url: 'https://v1.hitokoto.cn?c=k', type: 'hitokoto' }, // Philosophy
                { url: 'https://v1.hitokoto.cn?c=i', type: 'hitokoto' }, // Poetry
                { url: 'https://v2.jinrishici.com/one.json', type: 'jinrishici' } // Poetry Alternative
            ];
        },

        fetchQuote: function(forceRefresh = false) {
            const quoteText = document.getElementById('daily-quote-text');
            const quoteAuthor = document.getElementById('daily-quote-author');
            const refreshBtn = document.getElementById('refresh-quote');

            if (!quoteText || !quoteAuthor) return;

            if (refreshBtn) refreshBtn.classList.add('animate-spin');
            quoteText.style.opacity = '0.5';

            const strategies = this.getStrategies();
            const strategy = strategies[Math.floor(Math.random() * strategies.length)];
            const fetchUrl = strategy.url + (strategy.url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();

            return fetch(fetchUrl)
                .then(response => response.json())
                .then(data => {
                    const quoteData = this.processData(data, strategy.type);
                    this.saveQuote(quoteData);
                    this.render(quoteData);
                    return quoteData;
                })
                .catch(error => {
                    console.error('Error fetching quote:', error);
                    const fallback = this.getFallback();
                    // Don't save fallback to cache to retry next time? 
                    // Or save it so we don't error loop? Let's render but not save for now, or save as valid.
                    // User might want to refresh if they see fallback.
                    this.render(fallback);
                    return fallback;
                })
                .finally(() => {
                    if (refreshBtn) refreshBtn.classList.remove('animate-spin');
                    quoteText.style.opacity = '1';
                });
        },

        processData: function(data, type) {
            let content = '';
            let author = '';

            if (type === 'hitokoto') {
                content = data.hitokoto;
                const fromWho = data.from_who || '';
                const from = data.from || '';
                if (fromWho && from) {
                    author = `—— ${fromWho} «${from}»`;
                } else if (from) {
                    author = `—— «${from}»`;
                } else {
                    author = `—— ${fromWho || '佚名'}`;
                }
            } else if (type === 'jinrishici') {
                if (data.status === 'success') {
                    content = data.data.content;
                    author = `—— ${data.data.origin.author} «${data.data.origin.title}»`;
                } else {
                    throw new Error('Jinrishici API error');
                }
            }
            return { content, author };
        },

        getFallback: function() {
            const fallbacks = [
                { content: "生活明朗，万物可爱。", author: "—— 佚名" },
                { content: "星光不问赶路人，时光不负有心人。", author: "—— 大冰" },
                { content: "世界上只有一种英雄主义，就是在认清生活真相之后依然热爱生活。", author: "—— 罗曼·罗兰" },
                { content: "这里没有末路，你从不曾孤独。", author: "—— 韩寒" }
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        },

        saveQuote: function(data) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(STORAGE_KEY_DATE, today);
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
        },

        updateDOM: function() {
            const today = new Date().toISOString().split('T')[0];
            const lastDate = localStorage.getItem(STORAGE_KEY_DATE);
            const savedData = localStorage.getItem(STORAGE_KEY_DATA);

            if (lastDate === today && savedData) {
                try {
                    const data = JSON.parse(savedData);
                    this.render(data);
                } catch (e) {
                    console.error('Error parsing saved quote:', e);
                }
            }
        },

        render: function(data) {
            const quoteText = document.getElementById('daily-quote-text');
            const quoteAuthor = document.getElementById('daily-quote-author');
            if (quoteText) quoteText.textContent = data.content;
            if (quoteAuthor) quoteAuthor.textContent = data.author;
        }
    };

    global.QuoteSystem = QuoteSystem;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = QuoteSystem;
    }

})(typeof window !== 'undefined' ? window : this);
