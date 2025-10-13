export interface MapLayer {
  id: string
  name: string
  description: string
  type: 'raster' | 'vector'
  url: string
  attribution?: string
  maxZoom?: number
  minZoom?: number
  opacity?: number
  format?: string
  layers?: string // For WMS layers
  version?: string // For WMS layers
  transparent?: boolean
  bounds?: [[number, number], [number, number]] // SW, NE corners
  metadata?: {
    source?: string
    lastUpdated?: string
    category?: string
    tags?: string[]
  }
}

export interface MapLayersResponse {
  layers: MapLayer[]
  success: boolean
  message?: string
}

export interface CompareMapData {
  leftLayer: MapLayer
  rightLayer: MapLayer
  center: [number, number]
  zoom: number
}

// For the side-by-side plugin
export interface SideBySideOptions {
  thumbSize?: number
  padding?: number
}

// GeoServer GetFeatureInfo response interfaces
export interface StationProperties {
  StationID: string
  Station: string
  time: string
  v: number
  v_navd: number
  used_datum: string
  pred_type: string
}

export interface StationGeometry {
  type: 'Point'
  coordinates: [number, number]
}

export interface StationFeature {
  type: 'Feature'
  id: string
  geometry: StationGeometry
  geometry_name: string
  properties: StationProperties
  bbox: [number, number, number, number]
}

export interface StationClickResponse {
  type: 'FeatureCollection'
  features: StationFeature[]
  totalFeatures: string
  numberReturned: number
  timeStamp: string
  crs: {
    type: 'name'
    properties: {
      name: string
    }
  }
  bbox: [number, number, number, number]
}

// Click parameters for GetFeatureInfo request
export interface StationClickParams {
  x: number
  y: number
  width: number
  height: number
  bbox: string
  layers: string
}

// Water Level API Response interfaces
export interface WaterLevelPrediction {
  id: number
  station_id: string
  t: string
  v: number
  v_navd: number
  type: string
  used_datum: string
}

export interface StationWaterLevelData {
  status: string
  count: number
  predictions: WaterLevelPrediction[]
}

export interface WaterLevelResponse {
  saved_files: {
    [stationId: string]: StationWaterLevelData
  }
  date_range: {
    begin_date: string
    end_date: string
  }
}