import { useMemo } from 'react'
import Chart from 'react-apexcharts'

export function TideChart({ data, type, title, loading }) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return { series: [], categories: [] }
    
    const filteredData = data.filter(item => item.type === type)
    
    const series = [{
      name: `${type === 'historical' ? 'Observed' : 'Predicted'} Water Level`,
      data: filteredData.map(item => ({
        x: new Date(item.timestamp).getTime(),
        y: item.elevation
      }))
    }]
    
    return { series }
  }, [data, type])

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
    colors: [type === 'historical' ? '#3B82F6' : '#8B5CF6'], // Blue for historical, Purple for forecast
    stroke: {
      curve: 'smooth',
      width: 2
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
    tooltip: {
      x: {
        format: 'MMM dd, yyyy HH:mm'
      },
      y: {
        formatter: (value) => `${value.toFixed(2)} ft`
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