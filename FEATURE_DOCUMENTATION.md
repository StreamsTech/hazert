# Feature Documentation - Web to Flutter Migration

Concise technical reference for implementing HazERT web features in Flutter.

---

## 1. Pen Mode - Water Depth Query

**Purpose**: Click map to query water depth from WMS raster layers via GetFeatureInfo API.

**Business Logic**: Emergency responders need instant depth readings at specific locations. Supports querying multiple active layers simultaneously (coastal + inland flood maps).

### State Structure
```pseudocode
penModeActive: boolean
markerPosition: LatLng | null
markerDepth: number | null
isLoadingDepth: boolean
cancelToken: AbortController/CancelToken
```

### Queryable Layers Config
```pseudocode
QUERYABLE_LAYERS = {
  'water_surface_elevation': {
    geoserverLayer: 'flood-app:rendered_noaa_wse',
    source: 'dropdown'  // Only one visible
  },
  'water_surface_elevation_second_phase': {
    geoserverLayer: 'flood-app:noaa_wse_second',
    source: 'dropdown'
  },
  'inland_flood_map': {
    geoserverLayer: 'flood-app:Inland_Flood_Map',
    source: 'checkbox'  // Can combine with others
  }
}
```

### Enable/Disable Logic
```pseudocode
FUNCTION isPenModeDisabled():
  hasDropdownLayer = any(dropdownLayerVisibility.values)
  hasInlandFloodMap = checkboxLayerVisibility['inland_flood_map']
  RETURN NOT (hasDropdownLayer OR hasInlandFloodMap)

ON layerVisibility OR checkboxLayerVisibility CHANGE:
  IF getVisibleQueryableLayers().isEmpty AND penModeActive:
    penModeActive = false
    markerPosition = null
    markerDepth = null
```

### Data Flow

**1. Map Click**
```pseudocode
ON MAP_CLICK(event):
  IF NOT penModeActive: RETURN

  visibleLayers = getVisibleQueryableLayers()
  IF visibleLayers.isEmpty: RETURN

  SET markerPosition = event.latlng
  SET markerDepth = null

  CALL fetchWaterDepth(event.latlng, map, visibleLayers)
```

**2. Collect Visible Layers**
```pseudocode
FUNCTION getVisibleQueryableLayers():
  visibleLayers = []

  FOR EACH layerId IN QUERYABLE_LAYERS:
    config = QUERYABLE_LAYERS[layerId]
    isVisible = config.source == 'dropdown'
      ? dropdownLayerVisibility[layerId]
      : checkboxLayerVisibility[layerId]

    IF isVisible:
      visibleLayers.push(config.geoserverLayer)

  RETURN visibleLayers  // ['flood-app:rendered_noaa_wse', 'flood-app:Inland_Flood_Map']
```

**3. Build GetFeatureInfo Request**
```pseudocode
FUNCTION fetchWaterDepth(latlng, map, layerNames):
  // Cancel previous request
  cancelToken?.abort()
  cancelToken = new CancelToken()

  SET isLoadingDepth = true

  // Get map bounds and size
  bounds = map.getBounds()  // {west, south, east, north}
  mapSize = map.getSize()   // {width, height} in pixels

  // Calculate degrees per pixel (EPSG:4326 - no projection needed)
  degPerPixelX = (bounds.east - bounds.west) / mapSize.width
  degPerPixelY = (bounds.north - bounds.south) / mapSize.height

  // Create 101x101 pixel window centered on click
  halfSize = 50
  halfWidthDeg = halfSize * degPerPixelX
  halfHeightDeg = halfSize * degPerPixelY

  // Build BBOX [minX, minY, maxX, maxY]
  bbox = "${latlng.lng - halfWidthDeg},${latlng.lat - halfHeightDeg},"
         "${latlng.lng + halfWidthDeg},${latlng.lat + halfHeightDeg}"

  // Build request
  params = {
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetFeatureInfo',
    QUERY_LAYERS: layerNames.join(','),  // Comma-separated
    LAYERS: layerNames.join(','),
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: '50',
    X: '50',          // Center of 101x101 grid
    Y: '50',
    SRS: 'EPSG:4326',
    WIDTH: '101',
    HEIGHT: '101',
    BBOX: bbox,
    FORMAT: 'image/jpeg',
    TRANSPARENT: 'true'
  }

  url = 'http://geoserver.com/flood-app/wms?{params}&STYLES'
  response = await fetch(url, cancelToken)

  // Parse response
  data = await response.json()

  // Response: { type: 'FeatureCollection', features: [{properties: {GRAY_INDEX: 2.45}}] }

  foundDepth = null
  FOR EACH feature IN data.features:
    grayIndex = feature.properties?.GRAY_INDEX
    IF grayIndex != null:
      foundDepth = grayIndex
      BREAK

  SET markerDepth = foundDepth
  SET isLoadingDepth = false
```

**Key Details:**
- **101x101 pixels**: Center at (50,50), provides context for interpolation
- **GRAY_INDEX**: Property name containing depth value (feet/meters)
- **null values**: NoData pixels (land, outside model bounds)
- **Request cancellation**: Prevents 10+ simultaneous requests on rapid clicks
- **Multi-layer**: Queries all visible layers, returns first non-null value

**Flutter Packages:**
```yaml
flutter_map: ^6.0.0
latlong2: ^0.9.0
dio: ^5.0.0  # For CancelToken
flutter_map_marker_popup: ^6.0.0
```

---

## 2. Dropdown with "No Data" Option

**Purpose**: Radio-button WMS layer selector with explicit "hide all" option.

**Business Logic**: Only one overlay at a time. "No Data" = intentionally hidden (not broken).

### State Structure
```pseudocode
layerVisibility: Map<String, bool> = {
  'water_surface_elevation': true,      // First layer default
  'water_surface_elevation_second_phase': false
}

selectedLayerId: String = findFirst(layerVisibility, value == true) ?? 'none'
```

### Toggle Logic
```pseudocode
FUNCTION handleLayerToggle(layerId):
  IF layerId == 'none':
    // Hide all layers
    FOR EACH key IN layerVisibility:
      layerVisibility[key] = false
  ELSE:
    // Radio behavior: only selected layer true
    FOR EACH key IN layerVisibility:
      layerVisibility[key] = (key == layerId)
```

### Rendering
```pseudocode
FOR EACH layer IN TOGGLEABLE_WMS_LAYERS:
  IF layerVisibility[layer.id]:
    RENDER WMSTileLayer(layer)
  // Don't render hidden layers (not just opacity: 0)
```

**Flutter:**
- Use `DropdownButton<String>` with Provider/Riverpod
- Add "No Data" as first option (`value: 'none'`)
- Conditional rendering: `if (isVisible) TileLayer(...)`

---

## 3. Checkbox WMS Layers

**Purpose**: 4 independent toggleable layers (NOAA Stations + 3 Jeddah layers) with zoom navigation.

**Business Logic**: Auxiliary layers that can combine. Jeddah layers have zoom buttons for quick navigation.

### Layer Configurations

| Layer ID | Name | GeoServer Layer | Z-Index | Center (Jeddah) | Zoom Button |
|----------|------|-----------------|---------|-----------------|-------------|
| `raster_geo_point` | NOAA Stations | `flood-app:NOAA_Pred_Sts_Prj` | 503 | - | No |
| `drainage_network` | Drainage Network | `flood-app:Drainage_Network` | 504 | 21.614, 39.322 | Yes |
| `inland_flood_map` | Inland Flood Map | `flood-app:Inland_Flood_Map` | 505 | 21.547, 39.220 | Yes |
| `watershades` | Watersheds | `flood-app:Watersheds` | 506 | 21.614, 39.322 | Yes |

**Z-Index Hierarchy**: Base map (0) → Dropdown layers (501) → NOAA (503) → Drainage (504) → Inland (505) → Watersheds (506)

### State Structure
```pseudocode
checkboxLayerVisibility: Map<String, bool> = {
  'raster_geo_point': true,     // All checked by default
  'drainage_network': true,
  'inland_flood_map': true,
  'watershades': true
}
```

### Toggle Logic
```pseudocode
FUNCTION handleCheckboxLayerToggle(layerId):
  checkboxLayerVisibility[layerId] = NOT checkboxLayerVisibility[layerId]
  // Simple toggle - no radio behavior
```

### Zoom to Layer
```pseudocode
FUNCTION handleZoomToLayer(lat, lon, zoom):
  mapController.setView([lat, lon], zoom)
  // Or animated: mapController.flyTo([lat, lon], zoom, duration: 1500ms)
```

**Zoom Levels**: 0=world, 5=continent, 10=city, 12=neighborhood (used), 15=street, 18=building, 21=max

**Flutter:**
- Use `CheckboxListTile` for each layer
- Add `IconButton(icon: Icons.near_me)` for layers with center
- Render in z-index order (order in children array)
- Use `AnimationController` with `Tween<LatLng>` for smooth animation

---

## 4. Geo Station Point Layer

**Purpose**: Clickable WMS point layer showing NOAA stations. Click triggers GetFeatureInfo → Bottom sheet modal with charts/data.

**Business Logic**: Map-based station discovery more intuitive than lists. Instant access to historical water level data.

### Click Detection Flow

**1. Map Click Handler**
```pseudocode
ON MAP_CLICK(event):
  // 1. Ignore clicks on UI controls
  IF event.target.closest('.layer-controller-prevent-click'): RETURN

  // 2. Pen mode takes precedence
  IF penModeActive:
    handlePenModeClick(event)
    RETURN

  // 3. Build GetFeatureInfo params
  map = event.target
  size = map.getSize()
  bounds = map.getBounds()
  containerPoint = map.latLngToContainerPoint(event.latlng)

  params = {
    x: round(containerPoint.x),
    y: round(containerPoint.y),
    width: size.width,
    height: size.height,
    bbox: "${bounds.west},${bounds.south},${bounds.east},${bounds.north}",
    layers: 'flood-app:NOAA_Pred_Sts_Prj'
  }

  CALL queryStation(params)
```

**2. GetFeatureInfo Request**
```pseudocode
FUNCTION queryStation(params):
  requestParams = {
    SERVICE: 'WMS',
    VERSION: '1.3.0',         // Note: 1.3.0 (not 1.1.1)
    REQUEST: 'GetFeatureInfo',
    QUERY_LAYERS: params.layers,
    LAYERS: params.layers,
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: '50',
    I: params.x,              // WMS 1.3.0 uses I, J (not X, Y)
    J: params.y,
    CRS: 'EPSG:4326',         // WMS 1.3.0 uses CRS (not SRS)
    WIDTH: params.width,
    HEIGHT: params.height,
    BBOX: params.bbox,
    FORMAT: 'image/png',
    TRANSPARENT: 'true'
  }

  url = 'http://geoserver.com/geoserver/wms?{requestParams}'
  response = await fetch(url)
  data = await response.json()

  IF data.features.isEmpty:
    THROW 'NO_STATION_FOUND'

  RETURN data
```

**3. Response Structure**
```json
{
  "type": "FeatureCollection",
  "features": [{
    "id": "NOAA_Pred_Sts_Prj.1",
    "geometry": { "type": "Point", "coordinates": [-76.282, 36.844] },
    "properties": {
      "Station": "Norfolk Harbor",
      "StationID": "8638863",
      "Latitude": 36.844,
      "Longitude": -76.282
    }
  }],
  "timeStamp": "2025-10-27T10:30:15.123Z"
}
```

**4. Station Modal**
```pseudocode
WHEN stationData RECEIVED:
  SET selectedStation = stationData
  SET modalVisible = true
  RESET clickParams = null
```

### Bottom Sheet Modal

**Features:**
1. Station info header (name, ID, icon)
2. Date range controls (date picker, day/week/2week buttons, auto-calculated end date)
3. View toggle (chart ↔ table)
4. CSV export button

**State Structure:**
```pseudocode
selectedDate: Date = today()
dateViewMode: 'day' | 'week' | '2week' = 'day'
startDate: Date
endDate: Date
waterLevelData: WaterLevelPrediction[]
viewMode: 'chart' | 'table' = 'chart'
```

**Date Range Calculation:**
```pseudocode
ON selectedDate OR dateViewMode CHANGE:
  startDate = selectedDate

  SWITCH dateViewMode:
    CASE 'day':   endDate = startDate + 1 day
    CASE 'week':  endDate = startDate + 7 days
    CASE '2week': endDate = startDate + 14 days

  CALL fetchWaterLevelData(stationId, startDate, endDate)
```

**CSV Export:**
```pseudocode
FUNCTION exportCSV():
  csv = 'Time,Water Level (v),NAVD (v_navd),Datum,Type\n'
  FOR EACH prediction IN waterLevelData:
    csv += "${prediction.t},${prediction.v},${prediction.v_navd},${prediction.datum},${prediction.type}\n"

  DOWNLOAD(csv, filename: "station_{stationId}_{startDate}_to_{endDate}.csv")
```

**Flutter:**
- Use `showModalBottomSheet(isScrollControlled: true, height: 50%)`
- `showDatePicker` for date selection
- `SegmentedButton<DateViewMode>` for day/week/2week
- `fl_chart` or `syncfusion_flutter_charts` for chart
- `file_saver` or `share` package for CSV export

---

## 5. Direction Icon - Zoom to Layer

**Purpose**: Arrow button (➜) next to Jeddah layer checkboxes for quick navigation.

**Business Logic**: Jeddah is 6,400 miles from Norfolk (default center). Quick access prevents manual searching.

### Implementation
```pseudocode
// Layer config
CheckboxWMSLayer {
  id: String
  name: String
  center: LatLng?      // null for PERMANENT_LAYER
  zoomLevel: double = 12.0
}

// Button rendering
FOR EACH layer IN checkboxWmsLayers:
  RENDER Checkbox(layer.name)
  IF layer.center != null:
    RENDER IconButton(
      icon: '➜',  // or Icons.near_me in Flutter
      onClick: () => zoomToLayer(layer.center!, layer.zoomLevel)
    )

// Zoom handler
FUNCTION zoomToLayer(center, zoom):
  // Option 1: Instant
  mapController.setView(center, zoom)

  // Option 2: Animated (1-2 seconds for long-distance)
  ANIMATE:
    FROM mapController.center TO center
    FROM mapController.zoom TO zoom
    DURATION 1500ms
    CURVE easeInOutCubic
```

**Flutter Animation:**
```pseudocode
FUNCTION animatedFlyTo(target, targetZoom):
  animController = AnimationController(duration: 1500ms, vsync: this)

  latTween = Tween(begin: currentCenter.lat, end: target.lat)
  lngTween = Tween(begin: currentCenter.lng, end: target.lng)
  zoomTween = Tween(begin: currentZoom, end: targetZoom)

  curvedAnim = CurvedAnimation(parent: animController, curve: Curves.easeInOutCubic)

  animController.addListener(() =>
    mapController.move(
      LatLng(latTween.evaluate(curvedAnim), lngTween.evaluate(curvedAnim)),
      zoomTween.evaluate(curvedAnim)
    )
  )

  animController.forward()
  animController.addStatusListener((status) =>
    IF status == AnimationStatus.completed: animController.dispose()
  )
```

---

## Summary Table

| Feature | Core Algorithm | API | Flutter Packages | Complexity |
|---------|---------------|-----|------------------|------------|
| Pen Mode | BBOX calculation (101x101 px), multi-layer query | WMS GetFeatureInfo | flutter_map, dio, latlong2 | High |
| Dropdown | Radio button state, conditional rendering | - | Provider/Riverpod | Low |
| Checkbox Layers | Independent toggle, z-index ordering | - | Provider/Riverpod | Medium |
| Geo Station Point | Click detection, GetFeatureInfo, bottom sheet | WMS GetFeatureInfo | showModalBottomSheet, fl_chart | High |
| Direction Icon | Animated map navigation | - | AnimationController, Tween | Low |

---

## Critical Implementation Notes

### WMS GetFeatureInfo Parameters

| Web Version | Flutter Version | Notes |
|-------------|----------------|-------|
| `X, Y` (1.1.1) | `I, J` (1.3.0) | Pixel coordinates |
| `SRS` (1.1.1) | `CRS` (1.3.0) | Coordinate system |
| `BBOX` format | `"west,south,east,north"` | EPSG:4326 decimal degrees |

### Performance Optimizations

**Request Cancellation:**
```pseudocode
// Web
abortController = new AbortController()
fetch(url, { signal: abortController.signal })
abortController.abort()

// Flutter
cancelToken = CancelToken()
dio.get(url, cancelToken: cancelToken)
cancelToken.cancel()
```

**Conditional Rendering:**
```pseudocode
// ❌ Bad: Renders hidden layers
if (visible) opacity = 1.0 else opacity = 0.0

// ✅ Good: Don't render at all
if (visible) TileLayer(...) else SizedBox.shrink()
```

### State Management Recommendation

**Flutter:** Use Riverpod for type-safe, testable state:
```dart
final penModeProvider = StateProvider<bool>((ref) => false);
final markerPositionProvider = StateProvider<LatLng?>((ref) => null);
final layerVisibilityProvider = StateNotifierProvider<LayerVisibilityNotifier, Map<String, bool>>(...);
```

### Testing Checklist

- [ ] Pen mode: single layer, multi-layer, auto-disable
- [ ] Dropdown: "No Data" hides all, radio behavior
- [ ] Checkbox: independent toggles, z-index order
- [ ] Station click: returns data, empty click safe, modal UI
- [ ] Zoom: correct location, smooth animation
- [ ] Request cancellation on rapid clicks
- [ ] Loading indicators during API calls
- [ ] Error handling (no crashes on network errors)
- [ ] UI controls don't trigger map clicks

---

**Document Version**: 2.0
**Last Updated**: 2025-10-27
**Target**: Flutter Mobile App
**Source**: React/TanStack Start Web App
