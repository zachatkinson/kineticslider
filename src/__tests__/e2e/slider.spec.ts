import { test, expect } from '@playwright/test';

test.describe('KineticSlider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate through slides using keyboard', async ({ page }) => {
    const slider = page.getByTestId('kinetic-slider');
    await expect(slider).toBeVisible();

    const firstSlide = slider.getByTestId('slide-0');
    await expect(firstSlide).toBeVisible();

    await page.keyboard.press('ArrowRight');
    const secondSlide = slider.getByTestId('slide-1');
    await expect(secondSlide).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(firstSlide).toBeVisible();
  });

  test('should navigate through slides using touch gestures', async ({ page }) => {
    const slider = page.getByTestId('kinetic-slider');
    await expect(slider).toBeVisible();

    const firstSlide = slider.getByTestId('slide-0');
    await expect(firstSlide).toBeVisible();

    // Simulate swipe left
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(100, 300);
    await page.mouse.up();

    const secondSlide = slider.getByTestId('slide-1');
    await expect(secondSlide).toBeVisible();

    // Simulate swipe right
    await page.mouse.move(100, 300);
    await page.mouse.down();
    await page.mouse.move(400, 300);
    await page.mouse.up();

    await expect(firstSlide).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    const slider = page.getByTestId('kinetic-slider');
    await expect(slider).toHaveAttribute('role', 'region');
    await expect(slider).toHaveAttribute('aria-label', 'Image Slider');

    const slides = slider.getByRole('img');
    await expect(slides.first()).toHaveAttribute('alt');
  });
}); 