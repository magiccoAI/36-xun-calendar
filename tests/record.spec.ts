import { test, expect } from '@playwright/test';

test.describe('每日记录管理', () => {
  test.beforeEach(async ({ page }) => {
    // 每次测试前清空 localStorage
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('应该能正确新建每日记录并存入 LocalStorage', async ({ page }) => {
    await page.goto('/');

    // 等待宏观视图加载
    const macroList = page.locator('#macro-list');
    await expect(macroList).toBeVisible();

    // 切换到全景视图
    await page.click('#nav-overview');
    const overviewGrid = page.locator('#overview-grid');
    await expect(overviewGrid).toBeVisible();

    // 选择 1 月 5 日的日期格子（全景视图内唯一）
    const overviewDateCell = overviewGrid.locator('.day-cell[data-date="2026-01-05"]');
    await expect(overviewDateCell).toHaveCount(1); // 保证唯一
    await overviewDateCell.click();

    // 等待旬详情视图加载
    const detailView = page.locator('#detail-view');
    await expect(detailView).toBeVisible();

    // 点击详情视图内的日期格子
    const detailDateCell = detailView.locator('.day-cell[data-date="2026-01-05"]');
    await expect(detailDateCell).toHaveCount(1);
    await detailDateCell.click();

    // 弹窗出现
    const modal = page.locator('#modal');
    await expect(modal).not.toHaveClass(/hidden/);

    // 弹窗标题
    const modalTitle = modal.locator('#modal-date-title');
    await expect(modalTitle).toContainText('2026-01-05');

    // 选择心情按钮
    const moodBtn = modal.locator('button.mood-btn[data-mood="5"]');
    await expect(moodBtn).toHaveCount(1);
    await moodBtn.click();

    // 选择农作物种子
    const seedPacket = modal.locator('.seed-packet[data-crop="sunflower"]');
    if (await seedPacket.isVisible()) {
      await seedPacket.click();
    }

    // 填写小结文本
    const logInput = modal.locator('#modal-log');
    await logInput.fill('今天过得非常充实，完成了所有任务！');

    // 保存记录
    const saveBtn = modal.locator('#modal-save');
    await saveBtn.click();

    // 弹窗关闭验证
    await expect(modal).toHaveClass(/hidden/);

    // LocalStorage 数据验证
    const storedData = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('36_xun_user_data') || '{}');
    });

    expect(storedData['2026-01-05']).toBeDefined();
    expect(storedData['2026-01-05'].mood).toBe(5);
    expect(storedData['2026-01-05'].log).toBe('今天过得非常充实，完成了所有任务！');
  });
});