import { http, HttpResponse } from 'msw';

// Generate realistic tide data
const generateTideData = (stationId, days = 7) => {
  const now = new Date();
  const data = [];
  
  for (let d = -days; d <= days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    
    // Generate 2 tides per day (high/low pattern)
    for (let tide = 0; tide < 2; tide++) {
      const baseTime = new Date(date);
      baseTime.setHours(tide === 0 ? 6 : 18, Math.random() * 60, 0, 0);
      
      const elevation = 2 + Math.sin((d + tide) * 0.5) * 1.5 + (Math.random() - 0.5) * 0.3;
      
      data.push({
        timestamp: baseTime.toISOString(),
        elevation: Number(elevation.toFixed(2)),
        type: d < 0 ? 'historical' : 'predicted',
        tide: tide === 0 ? 'high' : 'low'
      });
    }
  }
  
  return data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Generate station points
const stations = [
  { id: 'VA001', name: 'James River at Fort Monroe', lat: 36.9459, lng: -76.3081 },
  { id: 'VA002', name: 'Chesapeake Bay Bridge', lat: 36.9737, lng: -76.1099 },
  { id: 'VA003', name: 'Norfolk Harbor', lat: 36.8468, lng: -76.2951 },
  // Add more stations...
];

export const handlers = [
  // Get all stations
  http.get('/api/stations', () => {
    return HttpResponse.json({
      type: 'FeatureCollection',
      features: stations.map(station => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [station.lng, station.lat]
        },
        properties: {
          id: station.id,
          name: station.name,
          status: 'active'
        }
      }))
    });
  }),

  // Get tide data for specific station
  http.get('/api/stations/:stationId/tides', ({ params, request }) => {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    
    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(() => {
        const data = generateTideData(params.stationId, days);
        resolve(HttpResponse.json({
          stationId: params.stationId,
          data,
          metadata: {
            unit: 'feet',
            datum: 'MLLW',
            timezone: 'EST'
          }
        }));
      }, 800 + Math.random() * 1200); // 800-2000ms delay
    });
  }),

  // Simulate occasional errors
  http.get('/api/stations/ERROR001/tides', () => {
    return new HttpResponse(null, { status: 500 });
  }),

  // Get map layers for comparison
  http.get('/api/map-layers', () => {
    const mapLayers = [
      {
        id: 'openstreetmap',
        name: 'OpenStreetMap',
        description: 'Standard OpenStreetMap tiles',
        type: 'raster',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 1,
        opacity: 1.0,
        metadata: {
          source: 'OpenStreetMap Foundation',
          category: 'base-map',
          tags: ['street', 'roads', 'general']
        }
      },
      {
        id: 'satellite',
        name: 'Satellite Imagery',
        description: 'High-resolution satellite imagery',
        type: 'raster',
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attribution: '© Google Satellite',
        maxZoom: 20,
        minZoom: 1,
        opacity: 1.0,
        metadata: {
          source: 'Google',
          category: 'satellite',
          tags: ['satellite', 'imagery', 'aerial']
        }
      },
      {
        id: 'terrain',
        name: 'Terrain Map',
        description: 'Topographic terrain visualization',
        type: 'raster',
        url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        attribution: '© Google Terrain',
        maxZoom: 18,
        minZoom: 1,
        opacity: 1.0,
        metadata: {
          source: 'Google',
          category: 'terrain',
          tags: ['topography', 'elevation', 'terrain']
        }
      },
      {
        id: 'norfolk-dem-1',
        name: 'Norfolk DEM Layer 1',
        description: 'Digital Elevation Model - Dataset 1',
        type: 'raster',
        url: 'http://202.4.127.189:5459/geoserver/wms',
        layers: 'flood-app:NorflokDEM10m_Prj1',
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        attribution: '© Norfolk GeoServer',
        maxZoom: 18,
        minZoom: 8,
        opacity: 0.8,
        bounds: [[36.7, -76.5], [37.0, -76.0]],
        metadata: {
          source: 'Norfolk Municipal',
          category: 'elevation',
          tags: ['dem', 'elevation', 'norfolk', 'flooding']
        }
      },
      {
        id: 'norfolk-dem-2',
        name: 'Norfolk DEM Layer 2', 
        description: 'Digital Elevation Model - Dataset 2',
        type: 'raster',
        url: 'http://202.4.127.189:5459/geoserver/wms',
        layers: 'flood-app:NorflokDEM10m_Prj2',
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        attribution: '© Norfolk GeoServer',
        maxZoom: 18,
        minZoom: 8,
        opacity: 0.8,
        bounds: [[36.7, -76.5], [37.0, -76.0]],
        metadata: {
          source: 'Norfolk Municipal',
          category: 'elevation',
          tags: ['dem', 'elevation', 'norfolk', 'flooding']
        }
      }
    ];

    return HttpResponse.json({
      layers: mapLayers,
      success: true,
      message: 'Map layers retrieved successfully'
    });
  }),

  // Get specific comparison data
  http.get('/api/map-layers/compare', () => {
    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(HttpResponse.json({
          leftLayer: {
            id: 'norfolk-dem-1',
            name: 'Norfolk DEM Layer 1',
            description: 'Digital Elevation Model - Dataset 1',
            type: 'raster',
            url: 'http://202.4.127.189:5459/geoserver/wms',
            layers: 'flood-app:NorflokDEM10m_Prj1',
            format: 'image/png',
            transparent: true,
            version: '1.3.0',
            attribution: '© Norfolk GeoServer - Dataset 1',
            maxZoom: 18,
            minZoom: 8,
            opacity: 1.0
          },
          rightLayer: {
            id: 'norfolk-dem-2',
            name: 'Norfolk DEM Layer 2',
            description: 'Digital Elevation Model - Dataset 2',
            type: 'raster',
            url: 'http://202.4.127.189:5459/geoserver/wms',
            layers: 'flood-app:NorflokDEM10m_Prj2',
            format: 'image/png',
            transparent: true,
            version: '1.3.0',
            attribution: '© Norfolk GeoServer - Dataset 2',
            maxZoom: 18,
            minZoom: 8,
            opacity: 1.0
          },
          center: [36.8443205, -76.2820786], // Norfolk area center
          zoom: 12
        }));
      }, 500 + Math.random() * 800); // 500-1300ms delay
    });
  })
];