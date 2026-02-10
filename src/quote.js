
const STORAGE_KEY_DATE = 'daily_quote_date';
const STORAGE_KEY_DATA = 'daily_quote_content';

export const QuoteSystem = {
    init: function() {
        this.updateDOM(); // Try to load from cache first
        
        const today = new Date().toISOString().split('T')[0];
        const lastDate = localStorage.getItem(STORAGE_KEY_DATE);

        if (lastDate !== today) {
            this.fetchQuote(false);
        }

        const refreshBtn = document.getElementById('refresh-quote');
        if (refreshBtn) {
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
        // Simple random strategy selection or round-robin? 
        // Let's just pick random.
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];

        return this._executeFetch(strategy).then(data => {
            this.saveQuote(data);
            this.render(data);
        }).catch(err => {
            console.error('Quote fetch failed:', err);
            const fallback = this.getFallback();
            this.render(fallback);
        }).finally(() => {
            if (refreshBtn) refreshBtn.classList.remove('animate-spin');
            quoteText.style.opacity = '1';
        });
    },
    
    _executeFetch: async function(strategy) {
        // Implementation based on strategy type
        if (strategy.type === 'hitokoto') {
            const res = await fetch(strategy.url);
            const json = await res.json();
            const content = (json?.hitokoto || '').trim();
            const rawAuthor = (json?.from_who || json?.from || '').trim();
            const source = (json?.from || '').trim();
            const authorName = rawAuthor || '佚名';
            let author = `—— ${authorName}`;
            if (source && source !== authorName) author += ` «${source}»`;
            return { content, author };
        } else if (strategy.type === 'jinrishici') {
            const res = await fetch(strategy.url);
            const json = await res.json();
            const data = json?.data || json || {};
            const content = (data?.content || '').trim();
            const authorName = (data?.origin?.author || '').trim() || '佚名';
            const title = (data?.origin?.title || '').trim();
            let author = `—— ${authorName}`;
            if (title) author += ` «${title}»`;
            return { content, author };
        }
        throw new Error('Unknown strategy');
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
        const safeData = data && typeof data === 'object' ? data : this.getFallback();
        const content = safeData.content || this.getFallback().content;
        const author = safeData.author || '—— 佚名';
        if (quoteText) quoteText.textContent = content;
        if (quoteAuthor) quoteAuthor.textContent = author;
    }
};
