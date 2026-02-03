const QuoteSystem = require('./quote.js');

describe('QuoteSystem', () => {
    let fetchMock;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="daily-quote-text"></div>
            <div id="daily-quote-author"></div>
            <button id="refresh-quote"></button>
        `;

        // Mock localStorage
        const localStorageMock = (function() {
            let store = {};
            return {
                getItem: jest.fn(key => store[key] || null),
                setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
                clear: jest.fn(() => { store = {}; })
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Mock fetch
        fetchMock = jest.fn(() => Promise.resolve({
            json: () => Promise.resolve({})
        }));
        global.fetch = fetchMock;

        // Reset QuoteSystem internal state if needed (none currently)
    });

    test('should fetch new quote if no local data exists', async () => {
        const spy = jest.spyOn(QuoteSystem, 'getStrategies').mockReturnValue([
            { url: 'https://v1.hitokoto.cn?c=d', type: 'hitokoto' }
        ]);

        // Setup mock response
        fetchMock.mockResolvedValueOnce({
            json: () => Promise.resolve({
                hitokoto: 'Test Quote',
                from_who: 'Test Author',
                from: 'Test Source'
            })
        });

        // Ensure date check fails (mock getItem returns null)
        window.localStorage.getItem.mockReturnValue(null);

        await QuoteSystem.fetchQuote(false);
        spy.mockRestore();

        expect(fetch).toHaveBeenCalled();
        expect(document.getElementById('daily-quote-text').textContent).toBe('Test Quote');
        expect(document.getElementById('daily-quote-author').textContent).toBe('—— Test Author «Test Source»');
    });

    test('should load from localStorage if data exists for today', () => {
        const today = new Date().toISOString().split('T')[0];
        const cachedData = JSON.stringify({ content: 'Cached Quote', author: 'Cached Author' });

        window.localStorage.getItem.mockImplementation((key) => {
            if (key === 'daily_quote_date') return today;
            if (key === 'daily_quote_content') return cachedData;
            return null;
        });

        // init calls updateDOM
        QuoteSystem.updateDOM();

        expect(document.getElementById('daily-quote-text').textContent).toBe('Cached Quote');
        expect(document.getElementById('daily-quote-author').textContent).toBe('Cached Author');
    });

    test('should fetch new quote on force refresh', async () => {
        const spy = jest.spyOn(QuoteSystem, 'getStrategies').mockReturnValue([
            { url: 'https://v1.hitokoto.cn?c=d', type: 'hitokoto' }
        ]);

        fetchMock.mockResolvedValueOnce({
            json: () => Promise.resolve({
                hitokoto: 'Refreshed Quote',
                from_who: 'Author',
                from: 'Source'
            })
        });

        await QuoteSystem.fetchQuote(true);
        spy.mockRestore();

        expect(fetch).toHaveBeenCalled();
        expect(document.getElementById('daily-quote-text').textContent).toBe('Refreshed Quote');
    });

    test('should handle Jinrishici API response', async () => {
        // Force Jinrishici strategy for test?
        // Since getStrategies is random, we might need to mock it or spy on it.
        // Or just mock the fetch response to match Jinrishici format regardless of URL?
        // Wait, processData uses type.
        // We can spy on getStrategies to return only jinrishici type.
        
        const spy = jest.spyOn(QuoteSystem, 'getStrategies').mockReturnValue([
            { url: 'https://v2.jinrishici.com/one.json', type: 'jinrishici' }
        ]);

        fetchMock.mockResolvedValueOnce({
            json: () => Promise.resolve({
                status: 'success',
                data: {
                    content: 'Jinrishici Quote',
                    origin: { author: 'Poet', title: 'Poem' }
                }
            })
        });

        await QuoteSystem.fetchQuote(false);
        spy.mockRestore();

        expect(document.getElementById('daily-quote-text').textContent).toBe('Jinrishici Quote');
        expect(document.getElementById('daily-quote-author').textContent).toBe('—— Poet «Poem»');
    });

    test('should use fallback on error', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network Error'));

        await QuoteSystem.fetchQuote(false);

        expect(document.getElementById('daily-quote-text').textContent).not.toBe('');
        // Fallback author is usually "佚名" or others in the list
        expect(document.getElementById('daily-quote-author').textContent).toContain('——');
    });
});
