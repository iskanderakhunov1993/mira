import { expect, type Page, test } from '@playwright/test';

async function finishOnboarding(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Настроить под себя/ }).click();
  await page.getByRole('button', { name: /Что происходит сегодня/ }).click();
  await page.getByRole('button', { name: /Продолжить/ }).click();
  await page.getByRole('button', { name: /Не помню/ }).click();
  await page.getByRole('button', { name: /Обычно похож/ }).click();
  await page.getByRole('button', { name: /Продолжить/ }).click();
  await page.getByRole('button', { name: /Пропустить вопрос/ }).click();
  await page.getByRole('button', { name: /Цикл и симптомы/ }).click();
  await page.getByRole('button', { name: /Продолжить/ }).click();
  await page.getByRole('button', { name: /Открыть мою главную/ }).click();
  await expect(page.getByRole('button', { name: 'Профиль' })).toBeVisible();
}

async function expectAccessibleCriticalSurface(page: Page) {
  const unnamedButtons = await page.locator('button:visible').evaluateAll((buttons) => buttons
    .filter((button) => {
      const element = button as HTMLButtonElement;
      return !element.disabled
        && !element.getAttribute('aria-label')?.trim()
        && !element.getAttribute('title')?.trim()
        && !element.innerText.trim();
    })
    .map((button) => button.outerHTML.slice(0, 180)));
  expect(unnamedButtons, `Кнопки без доступного имени: ${unnamedButtons.join('\n')}`).toEqual([]);

  const unnamedDialogs = await page.locator('[role="dialog"]:visible, [role="alertdialog"]:visible').evaluateAll((dialogs) => dialogs
    .filter((dialog) => {
      const labelledBy = dialog.getAttribute('aria-labelledby');
      return !dialog.getAttribute('aria-label')?.trim()
        && !(labelledBy && document.getElementById(labelledBy)?.textContent?.trim());
    })
    .map((dialog) => dialog.outerHTML.slice(0, 180)));
  expect(unnamedDialogs, `Диалоги без доступного имени: ${unnamedDialogs.join('\n')}`).toEqual([]);
}

test('onboarding → запись → persistence → Calendar', async ({ page }) => {
  await finishOnboarding(page);
  await expectAccessibleCriticalSurface(page);

  await page.getByRole('button', { name: 'Мне плохо' }).click();
  await expect(page.getByRole('dialog', { name: 'Что беспокоит сильнее всего?' })).toBeVisible();
  await expect(page.getByText('Начните с фактов')).toBeVisible();
  await expect(page.getByRole('button', { name: /Скрыть дополнительные поля/ })).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть' }).click();

  await page.getByRole('button', { name: 'Симптомы', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Что чувствовали в этот день?' })).toBeVisible();
  await expectAccessibleCriticalSurface(page);
  await page.getByRole('button', { name: /Головная боль/ }).click();
  await page.getByRole('button', { name: /Сохранить состояние/ }).click();
  await expect(page.getByRole('dialog', { name: /Mira учтёт это/ })).toContainText('Головная боль');
  await page.getByRole('button', { name: /Остаться на главной/ }).click();

  await page.reload();
  await expect(page.getByRole('button', { name: /Состояние отмечено/ })).toBeVisible();
  await page.getByRole('button', { name: 'Календарь' }).click();
  await expect(page.getByRole('heading', { name: 'Календарь' })).toBeVisible();
  await expectAccessibleCriticalSurface(page);
});

test('безопасный экспорт и подтверждённое удаление', async ({ page }) => {
  await finishOnboarding(page);
  await page.getByRole('button', { name: 'Профиль' }).click();
  await page.getByRole('button', { name: /Экспорт и резервная копия/ }).click();
  await expect(page.getByRole('dialog', { name: 'Данные и приватность' })).toBeVisible();
  await expectAccessibleCriticalSurface(page);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Сохранить копию/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('mira-aura-backup.json');

  await page.getByRole('button', { name: /Удалить все локальные данные/ }).click();
  await expect(page.getByRole('alertdialog', { name: /Удалить всю историю/ })).toBeVisible();
  await page.getByRole('button', { name: /Да, удалить данные/ }).click();
  await expect(page.getByRole('button', { name: /Настроить под себя/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /Настроить под себя/ })).toBeVisible();
});
