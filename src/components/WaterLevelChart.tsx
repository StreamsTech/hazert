import { useMemo } from 'react'
import Chart from 'react-apexcharts'
import type { WaterLevelPrediction, WaterLevelObservation } from '../types/map'

interface WaterLevelChartProps {
  predictions: WaterLevelPrediction[]
  observations: WaterLevelObservation[]
  title: string
  loading?: boolean
  stationId?: string
}

export function WaterLevelChart({ predictions, observations, title, loading, stationId }: WaterLevelChartProps) {
  const chartData = useMemo(() => {
    // Define data point type
    interface DataPoint {
      x: number
      y: number
    }

    // Convert observations to chart format
    const observationsData: DataPoint[] = observations
      .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime())
      .map(item => ({
        x: new Date(item.t).getTime(),
        y: item.v
      }))

    // Convert predictions to chart format
    const predictionsData: DataPoint[] = predictions
      .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime())
      .map(item => ({
        x: new Date(item.t).getTime(),
        y: item.v
      }))

    // Create series array
    const series: Array<{ name: string; data: DataPoint[] }> = []

    if (observationsData.length > 0) {
      series.push({
        name: 'Observations',
        data: observationsData
      })
    }

    if (predictionsData.length > 0) {
      series.push({
        name: 'Predictions',
        data: predictionsData
      })
    }

    return { series }
  }, [predictions, observations])

  const options = {
    chart: {
      type: 'line' as const,
      height: 300,
      animations: {
        enabled: true,
        easing: 'easeinout' as const,
        speed: 800
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    colors: ['#B4E50D', '#36A2EB'], // Green for observations, Blue for predictions
    stroke: {
      curve: 'monotoneCubic' as const, // Smooth curves for better continuity
      width: 3,
      lineCap: 'round' as const
    },
    markers: {
      size: 0, // Hide markers for clean continuous line
      hover: {
        size: 7,
        sizeOffset: 3
      }
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        format: 'yyyy-MM-dd HH:mm'
      },
      title: {
        text: 'Time'
      },
      crosshairs: {
        show: true,
        width: 1,
        position: 'back',
        opacity: 0.9,
        stroke: {
          color: '#b6b6b6',
          width: 1,
          dashArray: 3
        }
      }
    },
    yaxis: {
      title: {
        text: 'Water Level (feet)'
      },
      labels: {
        formatter: (value: number) => `${value.toFixed(2)} feet`
      }
    },
    grid: {
      show: true,
      borderColor: '#e5e7eb'
    },
    legend: {
      show: true,
      position: 'top' as const,
      horizontalAlign: 'center' as const,
      markers: {
        width: 12,
        height: 12,
        strokeWidth: 0,
        radius: 6
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: 'dark',
      followCursor: false,
      style: {
        fontSize: '13px',
        fontFamily: 'inherit'
      },
      x: {
        format: 'ddd, MMM dd yyyy, HH:mm',
        formatter: undefined
      },
      y: {
        formatter: (value: number) => {
          return value !== null && value !== undefined ? `${value.toFixed(2)}ft` : 'N/A'
        }
      },
      marker: {
        show: true
      },
      custom: undefined
    },
    title: {
      text: title,
      align: 'center' as const,
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#374151'
      }
    },
    noData: {
      text: loading ? 'Loading...' : 'No data available',
      align: 'center' as const,
      verticalAlign: 'middle' as const,
      style: {
        color: '#6B7280',
        fontSize: '14px'
      }
    }
  }

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading water level data...</p>
        </div>
      </div>
    )
  }

  if ((!predictions || predictions.length === 0) && (!observations || observations.length === 0)) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600">No water level data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <Chart
        options={options}
        series={chartData.series}
        type="line"
        height={300}
      />
    </div>
  )
}
