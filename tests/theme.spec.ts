import { test, expect } from '@playwright/test';

test.describe('主界面与主题切换', () => {
  test('应该能正确加载主界面', async ({ page }) => {
    // 访问首页
    await page.goto('/');

    // 验证标题存在
    await expect(page.locator('h1.text-3xl.font-light.text-gray-700').filter({ hasText: '2026' })).toBeVisible();

    // 验证当前旬信息存在
    await expect(page.locator('#current-xun-info')).toBeVisible();

    // 验证顶部导航按钮加载
    await expect(page.locator('#nav-macro')).toBeVisible();
    await expect(page.locator('#nav-overview')).toBeVisible();
  });

  test('应该能正确切换主题并持久化', async ({ page }) => {
    await page.goto('/');

    // 点击主题切换按钮
    await page.click('#theme-btn');
    
    // 等待菜单出现并点击春生主题
    const springThemeBtn = page.locator('button').filter({ hasText: '春生 (Spring)' });
    await expect(springThemeBtn).toBeVisible();
    await springThemeBtn.click();

    // 验证 body 上添加了 theme-spring 类
    await expect(page.locator('body')).toHaveClass(/theme-spring/);

    // 重新加载页面验证主题持久化
    await page.reload();
    await expect(page.locator('body')).toHaveClass(/theme-spring/);
    
    // 恢复默认主题
    await page.click('#theme-btn');
    const defaultThemeBtn = page.locator('button').filter({ hasText: '默认 (Default)' });
    await expect(defaultThemeBtn).toBeVisible();
    await defaultThemeBtn.click();
    
    // 验证主题被移除
    await expect(page.locator('body')).not.toHaveClass(/theme-spring/);
  });
});
