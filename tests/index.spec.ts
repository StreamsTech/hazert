import { test, expect } from '@playwright/test';

test.describe('Index Page - Map with Layer Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
  });

  test('should load the map correctly', async ({ page }) => {
    // Check if map container is visible
    await expect(page.locator('.leaflet-container')).toBeVisible();

    // Check if base layer is loaded
    await expect(page.locator('.leaflet-tile-pane')).toBeVisible();

    // Check if zoom controls are present
    await expect(page.locator('.leaflet-control-zoom')).toBeVisible();
  });

  test('should display WMS layer controller in top-left', async ({ page }) => {
    // Check if WMS layer controller is visible
    const layerController = page.locator('.absolute.top-4.left-4');
    await expect(layerController).toBeVisible();

    // Check if layer checkboxes are present
    await expect(layerController.locator('input[type="checkbox"]')).toHaveCount(2);

    // Check layer names
    await expect(layerController.getByText('Raster Data 1')).toBeVisible();
    await expect(layerController.getByText('Raster Data 2')).toBeVisible();
  });

  test('should display base layer switcher in bottom-right', async ({ page }) => {
    // Check if layer switcher is visible
    const layerSwitcher = page.locator('.absolute.bottom-4.right-4');
    await expect(layerSwitcher).toBeVisible();

    // Check if layer icon is present
    await expect(layerSwitcher.locator('svg')).toBeVisible();
  });

  test('should show layer dropdown on hover', async ({ page }) => {
    const layerSwitcher = page.locator('.absolute.bottom-4.right-4');

    // Hover over the layer switcher
    await layerSwitcher.hover();

    // Check if dropdown appears
    const dropdown = page.locator('.absolute.bottom-0.right-16');
    await expect(dropdown).toBeVisible();

    // Check if all layer options are present
    await expect(dropdown.getByText('Default')).toBeVisible();
    await expect(dropdown.getByText('Satellite')).toBeVisible();
    await expect(dropdown.getByText('Terrain')).toBeVisible();
  });

  test('should switch between base layers', async ({ page }) => {
    const layerSwitcher = page.locator('.absolute.bottom-4.right-4');

    // Hover to show dropdown
    await layerSwitcher.hover();

    // Click on Default layer
    await page.getByText('Default').click();

    // Wait for layer to load
    await page.waitForTimeout(1000);

    // Hover again and switch to Terrain
    await layerSwitcher.hover();
    await page.getByText('Terrain').click();

    // Wait for layer to load
    await page.waitForTimeout(1000);

    // Verify map is still functional
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should toggle WMS layers', async ({ page }) => {
    const layerController = page.locator('.absolute.top-4.left-4');

    // Get checkboxes
    const rasterData1Checkbox = layerController.locator('input[type="checkbox"]').first();
    const rasterData2Checkbox = layerController.locator('input[type="checkbox"]').last();

    // Verify both are checked initially
    await expect(rasterData1Checkbox).toBeChecked();
    await expect(rasterData2Checkbox).toBeChecked();

    // Uncheck first layer
    await rasterData1Checkbox.uncheck();
    await expect(rasterData1Checkbox).not.toBeChecked();

    // Check it again
    await rasterData1Checkbox.check();
    await expect(rasterData1Checkbox).toBeChecked();
  });

  test('should handle mobile viewport', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check if controls are still accessible on mobile
      await expect(page.locator('.absolute.top-4.left-4')).toBeVisible();
      await expect(page.locator('.absolute.bottom-4.right-4')).toBeVisible();

      // Test touch interaction
      const layerSwitcher = page.locator('.absolute.bottom-4.right-4');
      await layerSwitcher.tap();
    }
  });
});