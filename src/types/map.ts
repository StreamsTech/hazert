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