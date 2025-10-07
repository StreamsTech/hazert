import { test, expect } from '@playwright/test';

test.describe('Water Level Page - Station Markers and Tide Charts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/water-level');
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
  });

  test('should load water level page with layout', async ({ page }) => {
    // Check main layout structure
    await expect(page.locator('.h-2\\/3')).toBeVisible(); // Map section
    await expect(page.locator('.flex-1.min-h-0')).toBeVisible(); // Chart section

    // Check if TideMonitoringSiteCategories is visible
    await expect(page.locator('.w-100.h-full')).toBeVisible();

    // Check map container
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should display circular markers with station values', async ({ page }) => {
    // Wait for stations to load
    await page.waitForSelector('.custom-circular-marker', { timeout: 10000 });

    // Check if circular markers are present
    const markers = page.locator('.custom-circular-marker');
    await expect(markers).toHaveCount(15); // Based on mock data

    // Check first marker has value displayed
    const firstMarker = markers.first();
    await expect(firstMarker).toBeVisible();

    // Verify marker contains numeric value
    const markerText = await firstMarker.textContent();
    expect(markerText).toMatch(/^\d+(\.\d+)?$/); // Should be a number
  });

  test('should show station popup on marker click', async ({ page }) => {
    // Wait for markers to load
    await page.waitForSelector('.custom-circular-marker', { timeout: 10000 });

    // Click on first marker
    const firstMarker = page.locator('.custom-circular-marker').first();
    await firstMarker.click();

    // Wait for popup to appear
    await page.waitForSelector('.leaflet-popup', { timeout: 5000 });

    // Check popup content
    const popup = page.locator('.leaflet-popup');
    await expect(popup).toBeVisible();

    // Check popup contains station information
    await expect(popup.getByText(/Station/)).toBeVisible();
    await expect(popup.getByText(/ID:/)).toBeVisible();
    await expect(popup.getByText(/Status:/)).toBeVisible();
    await expect(popup.getByText(/Value:/)).toBeVisible();
    await expect(popup.getByText('View Tide Data')).toBeVisible();
  });

  test('should load tide chart when station is selected', async ({ page }) => {
    // Wait for markers and click one
    await page.waitForSelector('.custom-circular-marker', { timeout: 10000 });
    const firstMarker = page.locator('.custom-circular-marker').first();
    await firstMarker.click();

    // Click "View Tide Data" button in popup
    await page.waitForSelector('.leaflet-popup', { timeout: 5000 });
    await page.getByText('View Tide Data').click();

    // Wait for chart to load
    await page.waitForSelector('text=Water Level Data', { timeout: 10000 });

    // Check if chart title is displayed
    await expect(page.getByText(/Water Level Data/)).toBeVisible();

    // Check if selected station indicator appears
    await page.waitForSelector('.absolute.bottom-4.left-4', { timeout: 5000 });
    const stationIndicator = page.locator('.absolute.bottom-4.left-4');
    await expect(stationIndicator).toBeVisible();
    await expect(stationIndicator.getByText(/Selected Station:/)).toBeVisible();
  });

  test('should show default state when no station selected', async ({ page }) => {
    // Check default chart area content
    const chartArea = page.locator('.flex-1.min-h-0');
    await expect(chartArea.getByText('Select a Station')).toBeVisible();
    await expect(chartArea.getByText('Click on a blue marker on the map')).toBeVisible();

    // Check for select icon
    await expect(chartArea.locator('svg')).toBeVisible();
  });

  test('should handle API loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/stations/*/tides*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });

    // Click marker and view tide data
    await page.waitForSelector('.custom-circular-marker', { timeout: 10000 });
    const firstMarker = page.locator('.custom-circular-marker').first();
    await firstMarker.click();

    await page.waitForSelector('.leaflet-popup', { timeout: 5000 });
    await page.getByText('View Tide Data').click();

    // Should show loading state (this depends on your TideChart component implementation)
    // You might need to adjust this based on your actual loading UI
  });

  test('should display WMS layers over base map', async ({ page }) => {
    // Check if WMS layers are loaded
    await page.waitForTimeout(3000);

    // Verify map has multiple tile layers
    const tileLayers = page.locator('.leaflet-tile-pane img');
    const tileCount = await tileLayers.count();
    expect(tileCount).toBeGreaterThan(0);
  });

  test('should handle different marker values correctly', async ({ page }) => {
    // Wait for all markers to load
    await page.waitForSelector('.custom-circular-marker', { timeout: 10000 });

    const markers = page.locator('.custom-circular-marker');
    const markerCount = await markers.count();

    // Check that different markers have different values
    const markerValues = [];
    for (let i = 0; i < Math.min(5, markerCount); i++) {
      const markerText = await markers.nth(i).textContent();
      markerValues.push(markerText);
    }

    // Should have some variety in values (not all the same)
    const uniqueValues = new Set(markerValues);
    expect(uniqueValues.size).toBeGreaterThan(1);
  });

  test('should maintain marker functionality during map interaction', async ({ page }) => {
    // Wait for markers
    await page.waitForSelector('.custom-circular-marker', { timeout: 10000 });

    // Zoom in on map
    await page.locator('.leaflet-control-zoom-in').click();
    await page.waitForTimeout(1000);

    // Markers should still be clickable
    const firstMarker = page.locator('.custom-circular-marker').first();
    await expect(firstMarker).toBeVisible();
    await firstMarker.click();

    // Popup should still work
    await page.waitForSelector('.leaflet-popup', { timeout: 5000 });
    await expect(page.locator('.leaflet-popup')).toBeVisible();
  });

  test('should handle mobile viewport for water level page', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check responsive layout
      await expect(page.locator('.leaflet-container')).toBeVisible();

      // Test marker tap on mobile
      await page.waitForSelector('.custom-circular-marker', { timeout: 10000 });
      const firstMarker = page.locator('.custom-circular-marker').first();
      await firstMarker.tap();

      // Check popup appears
      await page.waitForSelector('.leaflet-popup', { timeout: 5000 });
      await expect(page.locator('.leaflet-popup')).toBeVisible();
    }
  });
});