import { useMemo } from 'react'
import Chart from 'react-apexcharts'
import type { WaterLevelPrediction } from '../types/map'

interface WaterLevelChartProps {
  data: WaterLevelPrediction[] | undefined
  title: string
  loading?: boolean
  stationId?: string
}

export function WaterLevelChart({ data, title, loading, stationId }: WaterLevelChartProps) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return { series: [] }

    // Define data point type
    interface DataPoint {
      x: number
      y: number
    }

    // Sort all data by timestamp first
    const sortedData = [...data].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime())

    // Get current date/time for comparison
    const now = new Date()

    // Split data based on current date
    const historicalData: DataPoint[] = []
    const predictedData: DataPoint[] = []
    let transitionPoint: DataPoint | null = null

    sortedData.forEach((item) => {
      const itemDate = new Date(item.t)
      const point: DataPoint = {
        x: itemDate.getTime(),
        y: item.v
      }

      if (itemDate <= now) {
        // Historical: timestamp is before or equal to now
        historicalData.push(point)
        transitionPoint = point // Keep track of last historical point
      } else {
        // Predicted: timestamp is after now
        // Add transition point to predicted series for smooth connection
        if (transitionPoint && predictedData.length === 0) {
          predictedData.push(transitionPoint)
        }
        predictedData.push(point)
      }
    })

    // Create series array
    const series: Array<{ name: string; data: DataPoint[] }> = []

    if (historicalData.length > 0) {
      series.push({
        name: 'Historical Data',
        data: historicalData
      })
    }

    if (predictedData.length > 0) {
      series.push({
        name: 'Predicted Data',
        data: predictedData
      })
    }

    return { series }
  }, [data])

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
    colors: ['#3B82F6', '#8B5CF6'], // Blue for historical, Purple for predicted
    stroke: {
      curve: 'monotoneCubic' as const, // Smooth curves for better continuity
      width: 3,
      lineCap: 'round' as const
    },
    markers: {
      size: 0, // Hide markers for clean continuous line
      hover: {
        size: 6
      }
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        format: 'yyyy-MM-dd HH:mm'
      },
      title: {
        text: 'Time'
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
      style: {
        fontSize: '12px',
        fontFamily: 'inherit'
      },
      x: {
        format: 'yyyy-MM-dd HH:mm'
      },
      y: {
        formatter: (value: number, { seriesIndex }: { seriesIndex: number }) => {
          const type = seriesIndex === 0 ? 'Historical' : 'Predicted'
          return `${value.toFixed(2)} feet (${type})`
        }
      }
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

  if (!data || data.length === 0) {
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
