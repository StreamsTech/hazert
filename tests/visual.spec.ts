import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('index page map rendering', async ({ page }) => {
    await page.goto('/');

    // Wait for map to fully load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for tiles to load

    // Hide dynamic elements that might cause flakiness
    await page.addStyleTag({
      content: `
        .leaflet-control-attribution { display: none !important; }
        .leaflet-control-zoom { display: none !important; }
      `
    });

    // Take screenshot of the full page
    await expect(page).toHaveScreenshot('index-page-full.png');

    // Take screenshot of just the map area
    await expect(page.locator('.leaflet-container')).toHaveScreenshot('index-map-area.png');
  });

  test('compare map rendering', async ({ page }) => {
    await page.goto('/compare-map');

    // Wait for map and comparison layers to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForTimeout(5000); // Wait for side-by-side to initialize

    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        .leaflet-control-attribution { display: none !important; }
        .leaflet-control-zoom { display: none !important; }
      `
    });

    // Take screenshot
    await expect(page).toHaveScreenshot('compare-map-full.png');

    // Test different base layers
    const layerSwitcher = page.locator('.absolute.top-4.right-4');
    await layerSwitcher.hover();
    await page.getByText('Satellite').click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('compare-map-satellite.png');
  });

  test('water level page with markers', async ({ page }) => {
    await page.goto('/water-level');

    // Wait for map and markers to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForSelector('.custom-circular-marker', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        .leaflet-control-attribution { display: none !important; }
        .leaflet-control-zoom { display: none !important; }
      `
    });

    // Take screenshot of the full layout
    await expect(page).toHaveScreenshot('water-level-full.png');

    // Click on a marker to show popup
    const firstMarker = page.locator('.custom-circular-marker').first();
    await firstMarker.click();
    await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

    // Screenshot with popup
    await expect(page).toHaveScreenshot('water-level-with-popup.png');

    // Click "View Tide Data" to show chart
    await page.getByText('View Tide Data').click();
    await page.waitForTimeout(2000);

    // Screenshot with chart
    await expect(page).toHaveScreenshot('water-level-with-chart.png');
  });

  test('layer switcher states', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    const layerSwitcher = page.locator('.absolute.bottom-4.right-4');

    // Screenshot of default state
    await expect(layerSwitcher).toHaveScreenshot('layer-switcher-closed.png');

    // Screenshot of hover state
    await layerSwitcher.hover();
    await page.waitForTimeout(500);
    await expect(page.locator('.absolute.bottom-4.right-4')).toHaveScreenshot('layer-switcher-open.png');
  });

  test('responsive design - mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('index-mobile.png');

    // Test compare map on mobile
    await page.goto('/compare-map');
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('compare-map-mobile.png');

    // Test water level on mobile
    await page.goto('/water-level');
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('water-level-mobile.png');
  });

  test('error states visual', async ({ page }) => {
    // Mock API failure for compare map
    await page.route('**/api/map-layers/compare', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.goto('/compare-map');
    await page.waitForSelector('text=Failed to Load Map', { timeout: 10000 });

    await expect(page).toHaveScreenshot('compare-map-error.png');
  });
});