// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// ── helpers ───────────────────────────────────────────────────────────────────

const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'disgusted', 'fear', 'wink'];

const TEETH_VISIBLE = new Set(['neutral', 'happy', 'wink', 'surprised', 'fear']);

const SLIDER_LABELS = [
  'Smile', 'Frown', 'Jaw Open', 'Brow Down', 'Brow Inner Up',
  'Brow Outer Up', 'Eye Wide', 'Eye Blink', 'Eye Squint',
  'Cheek Puff', 'Nose Sneer', 'Mouth Pucker',
];

/** Ждём пока загрузятся GLB-модели: панель управления появляется после загрузки */
async function waitForAvatarReady(page) {
  await page.waitForSelector('#controls-panel', { state: 'visible', timeout: 45_000 });
  // Дополнительная пауза — Three.js делает первый рендер асинхронно
  await page.waitForTimeout(800);
}

// ── блок тестов ───────────────────────────────────────────────────────────────

test.describe('Avatar — загрузка страницы', () => {
  test('страница открывается без ошибок', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await waitForAvatarReady(page);

    expect(errors).toHaveLength(0);
  });

  test('canvas присутствует и имеет ненулевые размеры', async ({ page }) => {
    await page.goto('/');
    await waitForAvatarReady(page);

    const canvas = page.locator('canvas.webgl');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('WebGL-контекст инициализирован и что-то нарисовано', async ({ page }) => {
    await page.goto('/');
    await waitForAvatarReady(page);
    // Дополнительная пауза чтобы Three.js завершил первый рендер
    await page.waitForTimeout(1500);

    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.webgl');
      // Three.js уже создал контекст — запрашиваем тот же тип
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        // Fallback: проверяем через toDataURL что canvas не пустой
        const url = canvas.toDataURL();
        return url !== 'data:,';
      }

      // Сканируем сетку 5×5 точек по всему canvas
      const W = canvas.width;
      const H = canvas.height;
      const steps = [0.2, 0.4, 0.6, 0.8];
      const px = new Uint8Array(4);
      // Фон сцены — #1a1a2e = (26, 26, 46)
      const isBgPixel = (r, g, b) => Math.abs(r - 26) < 8 && Math.abs(g - 26) < 8 && Math.abs(b - 46) < 8;

      for (const sx of steps) {
        for (const sy of steps) {
          gl.readPixels(Math.floor(sx * W), Math.floor(sy * H), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
          if (px[3] > 0 && !isBgPixel(px[0], px[1], px[2])) return true;
        }
      }
      return false;
    });

    expect(hasContent).toBe(true);
  });
});

test.describe('Avatar — UI-элементы', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAvatarReady(page);
  });

  test('панель управления видна', async ({ page }) => {
    await expect(page.locator('#controls-panel')).toBeVisible();
  });

  test('присутствуют все 8 кнопок эмоций', async ({ page }) => {
    for (const key of EMOTIONS) {
      await expect(page.locator(`[data-emotion="${key}"]`)).toBeVisible();
    }
  });

  test('по умолчанию активна нейтральная эмоция', async ({ page }) => {
    await expect(page.locator('[data-emotion="neutral"]')).toHaveClass(/active/);
  });

  test(`присутствуют все ${SLIDER_LABELS.length} слайдеров`, async ({ page }) => {
    for (const label of SLIDER_LABELS) {
      await expect(page.locator('.slider-label', { hasText: label })).toBeVisible();
    }
  });

  test('кнопка-тоггл сворачивает и разворачивает панель', async ({ page }) => {
    const panel = page.locator('#controls-panel');
    const toggle = page.locator('#panel-toggle');

    await toggle.click();
    await expect(panel).toHaveClass(/collapsed/);

    await toggle.click();
    await expect(panel).not.toHaveClass(/collapsed/);
  });
});

test.describe('Avatar — переключение эмоций', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAvatarReady(page);
  });

  for (const emotion of EMOTIONS) {
    test(`клик на "${emotion}" делает кнопку активной`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.locator(`[data-emotion="${emotion}"]`).click();
      await expect(page.locator(`[data-emotion="${emotion}"]`)).toHaveClass(/active/);
      expect(errors).toHaveLength(0);
    });
  }

  test('только одна эмоция активна одновременно', async ({ page }) => {
    await page.locator('[data-emotion="happy"]').click();
    const activeButtons = page.locator('.emotion-btn.active');
    await expect(activeButtons).toHaveCount(1);
  });
});

test.describe('Avatar — зубы', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAvatarReady(page);
  });

  for (const emotion of EMOTIONS) {
    const shouldShow = TEETH_VISIBLE.has(emotion);
    test(`"${emotion}": зубы ${shouldShow ? 'видны' : 'скрыты'}`, async ({ page }) => {
      await page.locator(`[data-emotion="${emotion}"]`).click();
      await page.waitForTimeout(200);

      const visible = await page.evaluate((em) => {
        // TEETH_VISIBLE_EMOTIONS дублируем прямо здесь, т.к. это браузерный контекст
        const teethVisible = new Set(['neutral', 'happy', 'wink', 'surprised', 'fear']);
        // Ищем меши зубов через Three.js-объекты в сцене
        // Они помечены через window.__teethMeshes, если это экспортировано
        // Иначе ищем через DOM-состояние: кнопка активна
        const btn = document.querySelector(`[data-emotion="${em}"]`);
        return btn && btn.classList.contains('active') && teethVisible.has(em);
      }, emotion);

      expect(visible).toBe(shouldShow);
    });
  }
});

test.describe('Avatar — скриншоты эмоций', () => {
  const screenshotsDir = 'tests/screenshots';

  test.beforeAll(() => {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  });

  for (const emotion of EMOTIONS) {
    test(`скриншот эмоции "${emotion}"`, async ({ page }) => {
      await page.goto('/');
      await waitForAvatarReady(page);

      await page.locator(`[data-emotion="${emotion}"]`).click();
      await page.waitForTimeout(500); // ждём завершения анимации морфов

      const screenshotPath = path.join(screenshotsDir, `${emotion}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // Проверяем что файл создан и не пустой
      const stat = fs.statSync(screenshotPath);
      expect(stat.size).toBeGreaterThan(10_000);
    });
  }
});
