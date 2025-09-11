import { useMemo } from 'react'
import Chart from 'react-apexcharts'

export function TideChart({ data, title, loading }) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return { series: [] }
    
    // Sort all data by timestamp first
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    
    // Split data based on type attribute
    const historicalData = []
    const predictedData = []
    let transitionPoint = null
    
    sortedData.forEach((item) => {
      const point = {
        x: new Date(item.timestamp).getTime(),
        y: item.elevation
      }
      
      if (item.type === 'historical') {
        historicalData.push(point)
        transitionPoint = point // Keep track of last historical point
      } else if (item.type === 'predicted') {
        // Add transition point to predicted series for smooth connection
        if (transitionPoint && predictedData.length === 0) {
          predictedData.push(transitionPoint)
        }
        predictedData.push(point)
      }
    })
    
    // Create series array
    const series = []
    
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
      type: 'line',
      height: 300,
      animations: {
        enabled: true,
        easing: 'easeinout',
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
      curve: 'monotoneCubic', // Smooth curves for better continuity
      width: 3,
      lineCap: 'round'
    },
    markers: {
      size: 0, // Hide markers for clean continuous line
      hover: {
        size: 6
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'MMM dd HH:mm'
      }
    },
    yaxis: {
      title: {
        text: 'Water Level (ft MLLW)'
      },
      labels: {
        formatter: (value) => `${value.toFixed(1)} ft`
      }
    },
    grid: {
      show: true,
      borderColor: '#e5e7eb'
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center',
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
      x: {
        format: 'MMM dd, yyyy HH:mm'
      },
      y: {
        formatter: (value, { seriesIndex }) => {
          const type = seriesIndex === 0 ? 'Historical' : 'Predicted'
          return `${value.toFixed(2)} ft (${type})`
        }
      }
    },
    title: {
      text: title,
      align: 'center',
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#374151'
      }
    },
    noData: {
      text: loading ? 'Loading...' : 'No data available',
      align: 'center',
      verticalAlign: 'middle',
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
          <p className="text-gray-600">Loading tide data...</p>
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