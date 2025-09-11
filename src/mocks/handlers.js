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
  })
];