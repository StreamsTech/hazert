# Playwright Test Commands

## Installation

First, install Playwright:

```bash
# Install Playwright
pnpm add -D @playwright/test

# Install browsers
pnpm exec playwright install
```

## Test Scripts to Add to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report",
    "test:visual": "playwright test visual.spec.ts",
    "test:update-snapshots": "playwright test --update-snapshots"
  }
}
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests with browser visible
pnpm test:headed

# Run tests with UI mode (interactive)
pnpm test:ui

# Debug tests
pnpm test:debug

# Run specific test file
pnpm test tests/index.spec.ts

# Run tests matching pattern
pnpm test --grep "layer switching"

# View test reports
pnpm test:report

# Update visual regression screenshots
pnpm test:update-snapshots
```

## Test Structure

```
tests/
├── index.spec.ts          # Index page layer switching tests
├── compare-map.spec.ts    # Compare map side-by-side tests
├── water-level.spec.ts    # Water level circular markers tests
└── visual.spec.ts         # Visual regression tests
```

## Key Features Tested

### Index Page
- ✅ Map loading and controls
- ✅ WMS layer controller (top-left)
- ✅ Base layer switcher (bottom-right)
- ✅ Layer switching functionality
- ✅ Mobile responsiveness

### Compare Map
- ✅ Side-by-side comparison loading
- ✅ Layer legend display
- ✅ Slider functionality
- ✅ Base layer switching
- ✅ Error handling and retry
- ✅ MSW API integration

### Water Level
- ✅ Circular marker rendering
- ✅ Station value display
- ✅ Popup interactions
- ✅ Tide chart loading
- ✅ Station selection flow

### Visual Regression
- ✅ Screenshot comparisons
- ✅ Mobile viewport testing
- ✅ Error state visuals
- ✅ UI component states