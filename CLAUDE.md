# CLAUDE.md

## 📋 Project Overview

**HazERT** is a TanStack Start-based flood alert and water level monitoring web application focused on the Norfolk, Virginia area. The application provides real-time and historical tide/water level data visualization through interactive maps, charts, and WMS (Web Map Service) layers from GeoServer.

### Key Capabilities
- **Interactive Maps**: Multi-layer mapping with Google Maps base layers and WMS overlay data
- **Side-by-Side Comparison**: Compare different DEM (Digital Elevation Model) datasets
- **Tide Monitoring**: Real-time station data with interactive charts and historical trends
- **Water Level Visualization**: ApexCharts-powered tide data with historical vs predicted data
- **Station Management**: Filterable monitoring sites with categorized station types
- **Interactive Station Points**: Click-to-query GeoServer point layers with modal data display
- **Pen Mode**: Hover-to-query water depth/elevation data with real-time tooltip display

## 🏗️ Architecture

### Technology Stack

- **Framework**: TanStack Start (full-stack React with file-based routing)
- **Routing**: TanStack Router with file-based routes in `src/routes/`
- **Data Fetching**: TanStack Query for server state management
- **Maps**: React Leaflet with Leaflet.js for interactive mapping
- **Charts**: ApexCharts/React-ApexCharts for data visualization
- **WMS Integration**: Leaflet WMS layers connecting to Norfolk GeoServer
- **Mock API**: MSW (Mock Service Worker) for development data
- **Styling**: Tailwind CSS for component styling
- **Icons**: Lucide React for consistent iconography
- **TypeScript**: Full type safety with custom interfaces

### Core Data Flow

1. **Map Layer Management**: WMS layers from Norfolk GeoServer (`http://202.4.127.189:5459/geoserver/wms`)
2. **Station Data**: Mock tide stations with real-time values via MSW handlers
3. **Tide Data**: Time-series water level data with historical/predicted classifications
4. **Layer Comparison**: Side-by-side visualization using leaflet-side-by-side plugin
5. **Interactive Points**: GeoServer GetFeatureInfo requests for real-time station data on map clicks

## 🗂️ File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── CompareMap.tsx              # Side-by-side map comparison
│   │   └── TideMonitoringSiteCategories.tsx  # Station filtering sidebar
│   ├── TideChart.jsx                   # Main tide data chart component
│   ├── DefaultCatchBoundary.tsx        # Error boundary component
│   ├── NotFound.tsx                    # 404 component
│   └── DebugMSW.jsx                    # MSW debugging component
├── hooks/
│   ├── useMapLayers.ts                 # Map data fetching hooks
│   ├── useStations.js                  # Station data management
│   └── useTideData.js                  # Tide data fetching
├── routes/
│   ├── __root.tsx                      # Root layout with QueryClient
│   ├── index.tsx                       # Main map with WMS layers
│   ├── compare-map.tsx                 # Side-by-side comparison route
│   ├── water-level.tsx                 # Tide monitoring interface
│   └── temporary.tsx                   # Temporary/test route
├── types/
│   └── map.ts                          # TypeScript interfaces for map data
├── mocks/
│   ├── handlers.js                     # MSW API handlers
│   └── browser.js                      # MSW browser setup
├── integrations/
│   └── tanstack-query/
│       └── root-provider.tsx           # QueryClient configuration
├── utils/
│   └── seo.ts                          # SEO meta tag utilities
└── styles/
    └── app.css                         # Global styles
```

## 🔑 Key Files & Components

### Map Components

#### `src/routes/index.tsx` - Main Map Interface
- **Purpose**: Primary flood alert map with WMS layers and base layer switching
- **Features**:
  - Water surface elevation raster overlay (`rendered_noaa_wse`)
  - Interactive point layer (`noaa_predictions`) with click-to-query functionality
  - Pen mode with hover-to-query depth data and floating tooltip
  - Layer visibility controls with toggleable layers
  - Base layer switcher (Default/Satellite/Terrain)
  - Google Maps base layers
  - Real-time station data modal on point clicks
  - Bottom sheet with date range controls (Day/Week/2 Week views)
- **Location**: Norfolk/Moyock area (36.8443205, -76.2820786)
- **Coordinate System**: EPSG:4326 (WGS84) for all WMS requests

#### `src/components/ui/CompareMap.tsx` - Side-by-Side Comparison
- **Purpose**: Advanced map comparison using leaflet-side-by-side plugin
- **Features**:
  - Drag slider for layer comparison
  - Loading states and error handling
  - Legend component for layer identification
  - Automatic layer switching

#### `src/routes/water-level.tsx` - Tide Monitoring
- **Purpose**: Station-based water level monitoring with charts
- **Features**:
  - Interactive station markers with water level values
  - Station selection and popup details
  - Integrated tide chart display
  - Two-panel layout (map + charts)

### WMS Integration

#### WMS Layers Configuration
```javascript
const WMS_LAYERS = [
  {
    id: 'water_surface_elevation',
    name: 'Water Surface Elevation',
    url: 'http://202.4.127.189:5459/geoserver/wms',
    layers: 'flood-app:rendered_noaa_wse',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 502
  },
  {
    id: 'raster_geo_point',
    name: 'NOAA Predictions',
    url: 'http://202.4.127.189:5459/geoserver/wms',
    layers: 'flood-app:NOAA_Pred_Sts_Prj',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    zIndex: 503
  }
]
```

**Note**: Previous DEM layers (`NorflokDEM10m_Prj1`, `NorflokDEM10m_Prj2`) were removed due to projection issues. The new `rendered_noaa_wse` layer uses EPSG:4326 (standard WGS84 lat/lon) for compatibility.

### Data Management

#### `src/hooks/useMapLayers.ts` - Map Data Hooks
- **`useMapLayers()`**: Fetches available map layers
- **`useCompareMapData()`**: Loads side-by-side comparison configuration
- **`useMapLayer(layerId)`**: Individual layer data fetching
- **`useStationClick(clickParams)`**: GeoServer GetFeatureInfo requests for interactive point data

#### `src/hooks/useStations.js` - Station Management
- **Purpose**: Loads GeoJSON FeatureCollection of monitoring stations
- **Data Structure**: Norfolk area stations with coordinates and current values

#### `src/hooks/useTideData.js` - Tide Data
- **Purpose**: Time-series tide data with configurable date ranges
- **Features**: Historical vs predicted data classification, retry logic

### Charts & Visualization

#### `src/components/TideChart.jsx` - Tide Data Visualization
- **Technology**: ApexCharts with time-series configuration
- **Features**:
  - Historical vs predicted data series (blue/purple)
  - Smooth monotonic cubic curves
  - Interactive tooltips and zoom
  - Loading states

### API & Mock Data

#### `src/mocks/handlers.js` - MSW API Handlers
- **Endpoints**:
  - `GET /api/stations` - Station FeatureCollection
  - `GET /api/stations/:id/tides` - Time-series tide data
  - `GET /api/map-layers` - Available map layers
  - `GET /api/map-layers/compare` - Comparison configuration
- **Data Generation**: Realistic tide patterns with tidal high/low cycles

## ⚙️ Setup & Configuration

### Development Commands
```bash
# Start development server (port 3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Setup
- **Node.js**: Modern ES modules with TypeScript
- **Vite**: Development server with HMR
- **MSW**: Mock service worker for API simulation
- **TanStack Router**: File-based routing with type safety

### Key Configuration Files
- **`vite.config.ts`**: Vite + TanStack Start + React configuration
- **`tsconfig.json`**: TypeScript with path aliases (`~/*`, `@/*`)
- **`package.json`**: Dependencies including Leaflet, ApexCharts, MSW

## 🎯 Key Features

### Map Functionality
1. **Multi-Layer Mapping**: Base layers + WMS overlays
2. **Layer Controls**: Toggle visibility, opacity, z-index management
3. **Interactive Markers**: Station data with custom circular icons
4. **Side-by-Side Comparison**: Leaflet plugin for DEM dataset comparison
5. **Point Layer Interaction**: Click-to-query station points with real-time data modal display
6. **Pen Mode**: Hover-based water depth queries with:
   - Real-time GetFeatureInfo API requests to GeoServer
   - Floating tooltip with depth values (GRAY_INDEX property)
   - Throttle + debounce optimization for performance
   - Velocity-based request skipping during fast cursor movement
   - EPSG:4326 coordinate system with degree-based BBOX calculations

### Alert Systems
1. **Station Monitoring**: 15 Norfolk area stations with real-time values
2. **Visual Indicators**: Color-coded markers based on water levels
3. **Interactive Popups**: Station details and data access
4. **Status Tracking**: Active/inactive station management

### Data Visualization
1. **Time-Series Charts**: Historical and predicted tide data
2. **Brush Navigation**: Zoom and pan through time ranges
3. **Multi-Series Data**: Historical (blue) vs Predicted (purple)
4. **Export Capabilities**: Chart download and selection tools

### Responsive Design
1. **Mobile-Friendly**: Responsive map and chart layouts
2. **Touch Support**: Mobile map interaction
3. **Adaptive UI**: Collapsible sidebars and panels

## 🚀 Development Notes

### Adding New WMS Layers
1. Update `WMS_LAYERS` configuration in route components
2. Add layer metadata to `src/types/map.ts`
3. Update MSW handlers for new layer APIs

### Interactive Point Layers
1. **Click Handler**: Map click events capture coordinates and build GetFeatureInfo requests
2. **GeoServer Integration**: Direct JSON API calls to Norfolk GeoServer WMS endpoints
3. **Modal Display**: Station data displayed in responsive bottom sheet with data tables
4. **Date Range Controls**: Day/Week/2-Week view modes with automatic date calculations
5. **TypeScript Support**: Full type safety for GeoServer response structures

### Pen Mode (Hover-to-Query)
1. **Activation**: Toggle button in top-right corner (below layer switcher)
2. **Coordinate System**: Uses EPSG:4326 (WGS84) for all calculations - no projection transformations needed
3. **BBOX Calculation**:
   - Calculates pixel size in degrees: `(bounds.getEast() - bounds.getWest()) / mapSize.x`
   - Creates 101x101 pixel window centered on cursor
   - Builds BBOX as `[lng±50px, lat±50px]` in decimal degrees
4. **API Request Format**:
   - `SRS=EPSG:4326` (not EPSG:6595)
   - `X=50, Y=50` (center of 101x101 grid)
   - `BBOX` in lat/lon format (e.g., `-76.036,36.802,-76.002,36.829`)
5. **Performance Optimizations**:
   - Abort controller for canceling previous requests
   - Throttle: Queries every 250ms during slow movement
   - Debounce: Final query after 400ms of inactivity
   - Velocity detection: Skips queries during fast cursor movement (>0.5px/ms)
6. **Response Handling**: Extracts `GRAY_INDEX` property from GeoServer response (returns null for NoData pixels)

### Extending Station Data
1. Modify station data in `src/mocks/handlers.js`
2. Update TypeScript interfaces in components
3. Add new chart series or map markers as needed

### Chart Customization
- ApexCharts options in `TideChart.jsx`
- Custom color schemes and themes
- Interactive features and tooltips

## 🎨 UI Components

### Pen Mode Components
- **`PenModeToggle`**: Toggle button for enabling/disabling pen mode
- **`PenModeTooltip`**: Floating tooltip that follows cursor with depth data
- **Features**: Loading states, null data handling, formatted depth display (meters, 2 decimal places)

### Station Modal (Bottom Sheet)
- **Design**: Bottom sheet that slides up from bottom (50% viewport height)
- **Header**: Station info, date range picker, view mode buttons (Day/Week/2 Week), export/table actions
- **Date Controls**: Selectable start date with auto-calculated end date based on view mode
- **Data Table**: Scrollable table with time, water level, NAVD, datum, and prediction type columns
- **Footer**: Last seen timestamp and record count

## 🔧 Technical Notes

### Coordinate System Migration
The application was migrated from EPSG:6595 (NAD83/Virginia Lambert) to EPSG:4326 (WGS84) for WMS requests:
- **Removed**: proj4 dependency and coordinate transformations
- **Simplified**: Direct degree-based calculations using Leaflet's native coordinate system
- **Benefit**: Compatibility with standard WMS layers, reduced complexity, better performance

### Known Limitations
- **Pen Mode NoData**: GRAY_INDEX returns `null` for pixels outside water coverage areas (land, model boundaries)
- **Layer Coverage**: `rendered_noaa_wse` has data only in specific flood model domains
- **Best Results**: Pen mode works best over water bodies (Chesapeake Bay, rivers, coastal areas)

This TanStack Start application provides a solid foundation for flood monitoring and water level visualization, with extensible architecture for additional GIS features and real-time data integration. The interactive point layer system enables direct querying of GeoServer data sources with responsive modal interfaces for detailed station information display. The pen mode feature offers real-time depth querying with optimized performance for smooth user experience.

---

## 🔄 Layer Comparison Feature (New Feature - In Development)

### Overview
A modal-based interface for comparing two WMS layers side-by-side with a draggable slider, allowing users to visually compare different flood model datasets or water surface elevation layers.

### User Flow

#### Step 1: Access Comparison Mode
- **Location**: Top-right corner, below Layer Controller panel
- **Trigger**: "Compare Layers" button with compare icon (🔀)
- **Action**: Opens comparison selection modal

#### Step 2: Layer Selection Modal
**Modal Structure**:
```
┌────────────────────────────────────────┐
│  Select Layers to Compare       [X]   │
├────────────────────────────────────────┤
│  Left Layer:                           │
│  ○ Water Surface Elevation            │
│  ○ Water Surface Elevation 2nd Phase  │
│  ○ NOAA Predictions                   │
│                                        │
│  Right Layer:                          │
│  ○ Water Surface Elevation            │
│  ○ Water Surface Elevation 2nd Phase  │
│  ○ NOAA Predictions                   │
│                                        │
│  [Enable Comparison] (disabled)       │
└────────────────────────────────────────┘
```

**Selection Rules**:
- User must select one layer for left side
- User must select one layer for right side
- Cannot select the same layer for both sides
- Enable button activates only when both layers selected
- Right side layer radio buttons disable the option already selected on left

#### Step 3: Enable Comparison
- **Action**: Click "Enable Comparison" button
- **Result**:
  - Modal closes
  - `comparisonMode` state set to `true`
  - LayerSwitcher component hidden
  - Map switches to split view

#### Step 4: Comparison View
**Split Map Interface**:
```
┌──────────────────────┬──────────────────────┐
│  Left Layer          │  Right Layer         │
│  (Water Surface 1)   │  (Water Surface 2)   │
│                      ║                      │
│                      ║                      │
│         MAP          ║         MAP          │
│                      ║                      │
│                      ║                      │
│                    <═╬═>  ← Draggable       │
│                      ║                      │
└──────────────────────┴──────────────────────┘
```

**Features in Comparison Mode**:
- Vertical draggable slider to adjust split position
- Both maps synchronized (zoom, pan)
- Layer labels displayed
- "Disable Comparison" button to exit mode

#### Step 5: Exit Comparison
- **Action**: Click "Disable Comparison" button
- **Result**:
  - `comparisonMode` state set to `false`
  - LayerSwitcher component shown again
  - Map returns to normal single view

### Component Architecture

#### New Components to Create

**1. ComparisonButton.tsx**
- Location: `src/components/ui/ComparisonButton.tsx`
- Purpose: Toggle button to open comparison modal
- Position: Top-right, below Layer Controller
- State: None (just triggers modal)

**2. ComparisonModal.tsx**
- Location: `src/components/ui/ComparisonModal.tsx`
- Purpose: Modal for layer selection
- Props:
  - `visible: boolean` - Modal visibility
  - `onClose: () => void` - Close handler
  - `onEnable: (left: string, right: string) => void` - Enable handler
  - `layers: WMS_LAYERS[]` - Available layers
- State:
  - `leftLayer: string | null` - Selected left layer ID
  - `rightLayer: string | null` - Selected right layer ID

**3. CompareMap.tsx** (Already exists)
- Location: `src/components/ui/CompareMap.tsx`
- Purpose: Split view map with slider
- Needs Update:
  - Accept layer IDs as props
  - Add disable button
  - Emit disable event

#### Modified Components

**index.tsx State Additions**:
```typescript
const [comparisonMode, setComparisonMode] = useState(false)
const [comparisonLeftLayer, setComparisonLeftLayer] = useState<string | null>(null)
const [comparisonRightLayer, setComparisonRightLayer] = useState<string | null>(null)
const [showComparisonModal, setShowComparisonModal] = useState(false)
```

**Conditional Rendering Logic**:
```typescript
// Hide LayerSwitcher when in comparison mode
{!comparisonMode && <LayerSwitcher ... />}

// Show comparison button only when not in comparison mode
{!comparisonMode && (
  <ComparisonButton onClick={() => setShowComparisonModal(true)} />
)}

// Main map rendering
{comparisonMode ? (
  <CompareMap
    leftLayerId={comparisonLeftLayer}
    rightLayerId={comparisonRightLayer}
    onDisable={() => setComparisonMode(false)}
  />
) : (
  <MapContainer>
    {/* Normal map view */}
  </MapContainer>
)}
```

### Technical Implementation Details

#### State Flow
1. **Initial State**: `comparisonMode = false`, modal closed
2. **Open Modal**: User clicks button → `showComparisonModal = true`
3. **Select Layers**: User selects left/right → update local modal state
4. **Enable**: User clicks Enable → `comparisonMode = true`, `showComparisonModal = false`, store layer IDs
5. **Disable**: User clicks Disable in CompareMap → `comparisonMode = false`

#### Layer Data Management
- Use `WMS_LAYERS` array as source
- Filter out NOAA Predictions if needed (only compare elevation layers)
- Pass layer configuration objects to CompareMap
- CompareMap renders two MapContainers with selected layers

#### Validation Rules
- `leftLayer !== rightLayer` - Cannot compare same layer
- `leftLayer && rightLayer` - Both must be selected
- Disable selection of already-picked layer in opposite side

#### UI/UX Considerations
- Modal backdrop click closes modal
- ESC key closes modal
- Clear visual feedback for selected layers (checkmarks, colors)
- Disabled state styling for Enable button
- Smooth transitions between modes
- Preserve main map state when exiting comparison

### Files to Modify/Create

**New Files**:
1. `src/components/ui/ComparisonButton.tsx`
2. `src/components/ui/ComparisonModal.tsx`

**Modified Files**:
1. `src/routes/index.tsx` - Add state and conditional rendering
2. `src/components/ui/CompareMap.tsx` - Update props and add disable button
3. `src/types/map.ts` - Add comparison-related types if needed

### Testing Checklist
- [ ] Comparison button appears below Layer Controller
- [ ] Modal opens on button click
- [ ] Can select left layer
- [ ] Can select right layer
- [ ] Cannot select same layer twice
- [ ] Enable button disabled until both selected
- [ ] Enable button activates when both selected
- [ ] Clicking Enable closes modal and shows split view
- [ ] LayerSwitcher hidden in comparison mode
- [ ] Split view works with draggable slider
- [ ] Maps are synchronized (zoom/pan)
- [ ] Disable button exits comparison mode
- [ ] LayerSwitcher reappears after disabling
- [ ] Normal map view restored after disabling
- [ ] Modal backdrop/ESC closes modal
- [ ] UI controls don't trigger map clicks (existing fix)

### Future Enhancements (Optional)
- Remember last comparison (localStorage)
- Opacity sliders for each layer
- Quick comparison presets
- Export comparison as image
- Add comparison annotations
- Sync/unsync zoom controls toggle
- Layer info tooltips in modal