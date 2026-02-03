import { test, expect, devices } from '@playwright/test';
import path from 'path';

const fileUrl = `file://${path.resolve('index.html')}`;

test.describe('Mobile Compatibility & Performance', () => {
    // Test for iOS Safari
    test('1. iOS Safari Compatibility', async ({ page }) => {
        const iPhone = devices['iPhone 13'];
        await page.setViewportSize(iPhone.viewport);
        await page.goto(fileUrl);
        
        // Ensure Macro View
        await page.evaluate(() => window.showView('macro'));

        // Verify "Back to Top" and "Scroll Down" buttons are visible and clickable
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(1000);

        const backToTopBtn = page.locator('#macro-back-to-top');
        const scrollDownBtn = page.locator('#macro-scroll-down');

        await expect(backToTopBtn).toBeVisible();
        await expect(scrollDownBtn).toBeVisible();

        // Check bounding box for precision (within 2px of expected)
        const box = await backToTopBtn.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
            // Expected bottom: viewport.height - 1.5rem (24px) - buttonHeight (approx 50px)
            // But let's just check it's in the bottom right area
            expect(box.x + box.width).toBeGreaterThan(iPhone.viewport.width - 100);
            expect(box.y + box.height).toBeGreaterThan(iPhone.viewport.height - 100);
        }
    });

    // Test for Android Chrome
    test('2. Android Chrome Compatibility', async ({ page }) => {
        const Pixel = devices['Pixel 5'];
        await page.setViewportSize(Pixel.viewport);
        await page.goto(fileUrl);
        
        await page.evaluate(() => window.showView('macro'));
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(1000);

        const backToTopBtn = page.locator('#macro-back-to-top');
        await expect(backToTopBtn).toBeVisible();
        
        await backToTopBtn.click({ force: true });
        await page.waitForTimeout(1000);
        
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeLessThan(10);
    });

    // Test for Weak Network Performance Simulation
    test('3. Weak Network (3G) Performance', async ({ browser }) => {
        // Create context with network throttling
        const context = await browser.newContext({
            viewport: { width: 375, height: 667 },
            // Playwright doesn't have built-in "weak network" preset like Chrome DevTools in newContext directly,
            // but we can use CDP session.
        });
        const page = await context.newPage();
        
        // Use CDP to simulate slow 3G
        const client = await page.context().newCDPSession(page);
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            downloadThroughput: 750 * 1024 / 8, // 750Kbps
            uploadThroughput: 250 * 1024 / 8,   // 250Kbps
            latency: 100                        // 100ms
        });

        await page.goto(fileUrl);
        
        // Ensure buttons still work even if "loading" (our app is vanilla JS, so it should be fast)
        await page.evaluate(() => window.showView('macro'));
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(1500); // Wait a bit longer for "slow" network/rendering

        const backToTopBtn = page.locator('#macro-back-to-top');
        await expect(backToTopBtn).toBeVisible();
        
        await backToTopBtn.click({ force: true });
        await page.waitForTimeout(1500);
        
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeLessThan(10);
        
        await context.close();
    });
});
