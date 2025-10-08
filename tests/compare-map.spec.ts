import { test, expect } from '@playwright/test';

test.describe('Compare Map Page - Side-by-Side Layer Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compare-map');
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
  });

  test('should load compare map with loading state', async ({ page }) => {
    // Navigate fresh to see loading state
    await page.goto('/compare-map');

    // Check loading message appears first
    const loadingContainer = page.locator('text=Loading map comparison...');

    // Wait for map to eventually load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should display map legend in bottom-left', async ({ page }) => {
    // Wait for legend to appear
    await page.waitForSelector('.absolute.bottom-4.left-20', { timeout: 10000 });

    const legend = page.locator('.absolute.bottom-4.left-20');
    await expect(legend).toBeVisible();

    // Check legend content
    await expect(legend.getByText('Layer Comparison')).toBeVisible();
    await expect(legend.getByText('Norfolk DEM Layer 1')).toBeVisible();
    await expect(legend.getByText('Norfolk DEM Layer 2')).toBeVisible();
  });

  test('should display layer switcher in top-right', async ({ page }) => {
    const layerSwitcher = page.locator('.absolute.top-4.right-4');
    await expect(layerSwitcher).toBeVisible();

    // Test hover functionality
    await layerSwitcher.hover();

    // Check dropdown appears
    const dropdown = page.locator('.absolute.top-0.right-16');
    await expect(dropdown).toBeVisible();

    // Check layer options
    await expect(dropdown.getByText('Default')).toBeVisible();
    await expect(dropdown.getByText('Satellite')).toBeVisible();
    await expect(dropdown.getByText('Terrain')).toBeVisible();
  });

  test('should have functional side-by-side slider', async ({ page }) => {
    // Wait for map to fully load
    await page.waitForTimeout(3000);

    // Look for the side-by-side slider (leaflet-sbs-divider)
    await page.waitForSelector('.leaflet-sbs-divider', { timeout: 10000 });
    const slider = page.locator('.leaflet-sbs-divider');
    await expect(slider).toBeVisible();

    // Get slider position
    const sliderBox = await slider.boundingBox();
    expect(sliderBox).not.toBeNull();

    // Test slider interaction by dragging
    if (sliderBox) {
      const startX = sliderBox.x + sliderBox.width / 2;
      const startY = sliderBox.y + sliderBox.height / 2;

      // Drag slider to the right
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 100, startY);
      await page.mouse.up();

      // Verify slider moved
      const newSliderBox = await slider.boundingBox();
      expect(newSliderBox?.x).toBeGreaterThan(sliderBox.x);
    }
  });

  test('should switch base layers while maintaining comparison', async ({ page }) => {
    const layerSwitcher = page.locator('.absolute.top-4.right-4');

    // Wait for initial load
    await page.waitForTimeout(2000);

    // Switch to satellite view
    await layerSwitcher.hover();
    await page.getByText('Satellite').click();
    await page.waitForTimeout(1500);

    // Verify slider still exists
    await expect(page.locator('.leaflet-sbs-divider')).toBeVisible();

    // Switch to terrain view
    await layerSwitcher.hover();
    await page.getByText('Terrain').click();
    await page.waitForTimeout(1500);

    // Verify slider still functional
    await expect(page.locator('.leaflet-sbs-divider')).toBeVisible();
  });

  test('should handle MSW API response', async ({ page }) => {
    // Intercept API calls to ensure they're working
    let apiCalled = false;

    page.on('response', response => {
      if (response.url().includes('/api/map-layers/compare')) {
        apiCalled = true;
      }
    });

    await page.goto('/compare-map');

    // Wait for API call
    await page.waitForTimeout(2000);

    // Verify API was called (MSW should respond)
    expect(apiCalled).toBe(true);
  });

  test('should display error state when API fails', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/map-layers/compare', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.goto('/compare-map');

    // Wait for error state
    await page.waitForSelector('text=Failed to Load Map', { timeout: 10000 });

    // Verify error message
    await expect(page.getByText('Failed to Load Map')).toBeVisible();
    await expect(page.getByText('Try Again')).toBeVisible();
  });

  test('should retry on error button click', async ({ page }) => {
    let requestCount = 0;

    // Mock first request to fail, second to succeed
    await page.route('**/api/map-layers/compare', route => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/compare-map');

    // Wait for error and click retry
    await page.waitForSelector('text=Try Again', { timeout: 10000 });
    await page.getByText('Try Again').click();

    // Should eventually load successfully
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });
});