import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface ChartData {
  x: number | string;
  y: number;
}

interface ApexChartComponentProps {
  data1?: ChartData[];
  title1?: string;
  color1?: string;
  height?: number;
  brushHeight?: number;
}

// Generate dense sample data to match the docs example
const generateData = (startDate: string, endDate: string, baseValue: number, variance: number): ChartData[] => {
  const data: ChartData[] = [];
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const interval = (end - start) / 200; // Create 200+ data points for smooth curves
  
  for (let i = 0; i <= 200; i++) {
    const timestamp = start + (i * interval);
    const randomVariation = (Math.random() - 0.5) * variance;
    const trendVariation = Math.sin(i / 20) * (variance / 2); // Add wave pattern
    data.push({
      x: timestamp,
      y: Math.max(0, baseValue + randomVariation + trendVariation)
    });
  }
  return data;
};

// Dense sample data matching the docs style
const sampleData1 = generateData('2017-04-01', '2017-08-01', 45, 40); // Flies data (blue line)

const ApexChartComponent: React.FC<ApexChartComponentProps> = ({
  data1 = sampleData1,
  title1 = 'Flies',
  color1 = '#008FFB',
  height = 350,
  brushHeight = 130
}) => {
  const [chartState] = useState({
    series: [
      {
        name: title1,
        data: data1,
        type: 'line'
      }
    ],
    options: {
      chart: {
        id: 'main-chart',
        type: 'line',
        height: height,
        dropShadow: {
          enabled: true,
          enabledOnSeries: [1],
          top: 3,
          left: 2,
          blur: 3,
          opacity: 0.1
        },
        toolbar: {
          autoSelected: 'pan',
          show: false
        }
      },
      colors: [color1],
      stroke: {
        width: [2, 0], // Line for first series, no stroke for area
        curve: 'smooth'
      },
      
      fill: {
        type: ['solid', 'gradient'],
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.25,
          gradientToColors: [undefined, '#00E396'],
          inverseColors: true,
          opacityFrom: 0.85,
          opacityTo: 0.25,
          stops: [0, 100]
        }
      },
      markers: {
        size: 0
      },
      yaxis: [
        {
          seriesName: title1,
          min: 0,
          max: 100,
          axisTicks: {
            show: true,
            color: color1
          },
          axisBorder: {
            show: true,
            color: color1
          },
          labels: {
            style: {
              colors: color1,
              formatter: function (val: number) {
                return val.toFixed(0);
              }
            }
          },
          title: {
            text: title1,
            style: {
              color: color1
            }
          },
        }
      ],
      xaxis: {
        type: 'datetime',
        labels: {
          format: 'dd MMM',
        }
      },
      grid: {
        borderColor: '#f1f1f1',
        strokeDashArray: 3
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        markers: {
          width: 8,
          height: 8,
          radius: 4
        }
      }
    } as ApexOptions,

    seriesLine: [
      {
        name: title1,
        data: data1
      }
    ],
    optionsLine: {
      chart: {
        id: 'brush-chart',
        height: brushHeight,
        type: 'area',
        brush: {
          target: 'main-chart',
          enabled: true
        },
        selection: {
          enabled: true,
          xaxis: {
            min: new Date('2017-06-01').getTime(),
            max: new Date('2017-07-15').getTime()
          }
        },
        toolbar: {
          show: false
        }
      },
      colors: [color1],
      stroke: {
        width: [1, 1],
        curve: 'smooth'
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.4,
          opacityTo: 0.1,
        }
      },
      xaxis: {
        type: 'datetime',
        tooltip: {
          enabled: false
        },
        labels: {
          format: 'MMM \'yy'
        }
      },
      yaxis: {
        max: 100,
        tickAmount: 2,
        labels: {
          show: false
        }
      },
      grid: {
        show: false
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center'
      }
    } as ApexOptions,
  });

  return (
    <div className="w-full">
      <div id="chart-wrapper" className="space-y-4">
        {/* Main Chart */}
        <div id="main-chart-container" className="w-full">
          <ReactApexChart 
            options={chartState.options} 
            series={chartState.series} 
            type="line" 
            height={height} 
          />
        </div>
        
        {/* Brush/Navigator Chart */}
        <div id="brush-chart-container" className="w-full">
          <ReactApexChart 
            options={chartState.optionsLine} 
            series={chartState.seriesLine} 
            type="area" 
            height={brushHeight} 
          />
        </div>
      </div>
    </div>
  );
};

export default ApexChartComponent;