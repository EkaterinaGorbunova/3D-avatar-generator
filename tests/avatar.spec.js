// @ts-check
import { test, expect } from '@playwright/test';

const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'disgusted', 'fear', 'wink'];

const SLIDER_LABELS = [
  'Smile', 'Frown', 'Jaw Open', 'Brow Down', 'Brow Inner Up',
  'Brow Outer Up', 'Eye Wide', 'Eye Blink', 'Eye Squint',
  'Cheek Puff', 'Nose Sneer', 'Mouth Pucker',
];

/** Ждём пока загрузятся GLB-модели — панель появляется после загрузки */
async function waitForAvatarReady(page) {
  await page.waitForSelector('#controls-panel', { state: 'visible', timeout: 45_000 });
  await page.waitForTimeout(800);
}

// ── 1. Загрузка ───────────────────────────────────────────────────────────────

test.describe('загрузка', () => {
  test('страница открывается без JS-ошибок', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await waitForAvatarReady(page);
    expect(errors).toHaveLength(0);
  });

  test('canvas видим и имеет ненулевые размеры', async ({ page }) => {
    await page.goto('/');
    await waitForAvatarReady(page);
    const box = await page.locator('canvas.webgl').boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('WebGL рендерит аватара (не только фон)', async ({ page }) => {
    await page.goto('/');
    await waitForAvatarReady(page);
    await page.waitForTimeout(1500);

    const hasAvatar = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.webgl');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return canvas.toDataURL() !== 'data:,';

      const W = canvas.width, H = canvas.height;
      const px = new Uint8Array(4);
      // Фон сцены #1a1a2e = (26, 26, 46)
      const isBg = (r, g, b) => Math.abs(r - 26) < 8 && Math.abs(g - 26) < 8 && Math.abs(b - 46) < 8;

      for (const sx of [0.2, 0.4, 0.6, 0.8]) {
        for (const sy of [0.2, 0.4, 0.6, 0.8]) {
          gl.readPixels(Math.floor(sx * W), Math.floor(sy * H), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
          if (px[3] > 0 && !isBg(px[0], px[1], px[2])) return true;
        }
      }
      return false;
    });

    expect(hasAvatar).toBe(true);
  });
});

// ── 2. UI-элементы ────────────────────────────────────────────────────────────

test.describe('UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAvatarReady(page);
  });

  test('панель управления видна', async ({ page }) => {
    await expect(page.locator('#controls-panel')).toBeVisible();
  });

  test('все 8 кнопок эмоций присутствуют', async ({ page }) => {
    for (const key of EMOTIONS) {
      await expect(page.locator(`[data-emotion="${key}"]`)).toBeVisible();
    }
  });

  test('по умолчанию активна нейтральная эмоция', async ({ page }) => {
    await expect(page.locator('[data-emotion="neutral"]')).toHaveClass(/active/);
  });

  test(`все ${SLIDER_LABELS.length} слайдеров присутствуют`, async ({ page }) => {
    for (const label of SLIDER_LABELS) {
      await expect(page.locator('.slider-label', { hasText: label })).toBeVisible();
    }
  });

  test('тоггл сворачивает и разворачивает панель', async ({ page }) => {
    const panel = page.locator('#controls-panel');
    const toggle = page.locator('#panel-toggle');

    await toggle.click();
    await expect(panel).toHaveClass(/collapsed/);

    await toggle.click();
    await expect(panel).not.toHaveClass(/collapsed/);
  });
});

// ── 3. Переключение эмоций ────────────────────────────────────────────────────

test.describe('эмоции', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAvatarReady(page);
  });

  for (const emotion of EMOTIONS) {
    test(`"${emotion}" — кнопка становится активной без ошибок`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.locator(`[data-emotion="${emotion}"]`).click();
      await expect(page.locator(`[data-emotion="${emotion}"]`)).toHaveClass(/active/);
      expect(errors).toHaveLength(0);
    });
  }

  test('одновременно активна только одна эмоция', async ({ page }) => {
    await page.locator('[data-emotion="happy"]').click();
    await expect(page.locator('.emotion-btn.active')).toHaveCount(1);
  });
});
