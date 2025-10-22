import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// Type definitions
interface DataPoint {
    x: number;
    y: number;
}

interface ChartData {
    predictions: DataPoint[];
    verified: DataPoint[];
    preliminary: DataPoint[];
    observedMinusPredicted: DataPoint[];
}

interface WaterLevelChartProps {
    title?: string;
    subtitle?: string;
    data?: ChartData | null;
    height?: number;
}

interface TooltipContext {
    series: number[][];
    seriesIndex: number;
    dataPointIndex: number;
    w: {
        globals: {
            seriesX: number[][];
            seriesNames: string[];
            colors: string[];
        };
    };
}

// Reusable Water Level Chart Component
const WaterLevelChart: React.FC<WaterLevelChartProps> = ({
                                                             title = "Observed Water Levels",
                                                             subtitle = "From 2025/10/19 00:00 GMT to 2025/10/20 23:59 GMT",
                                                             data = null,
                                                             height = 400
                                                         }) => {
    // Sample data structure - replace with your actual data
    const defaultData: ChartData = {
        predictions: [
            { x: new Date('2025-10-19 00:00').getTime(), y: 2.7 },
            { x: new Date('2025-10-19 04:00').getTime(), y: 0.4 },
            { x: new Date('2025-10-19 08:00').getTime(), y: 3.1 },
            { x: new Date('2025-10-19 12:00').getTime(), y: 3.0 },
            { x: new Date('2025-10-19 16:00').getTime(), y: 0.5 },
            { x: new Date('2025-10-19 20:00').getTime(), y: 2.7 },
            { x: new Date('2025-10-20 00:00').getTime(), y: 2.6 },
            { x: new Date('2025-10-20 04:00').getTime(), y: 0.3 },
            { x: new Date('2025-10-20 08:00').getTime(), y: 3.0 },
            { x: new Date('2025-10-20 12:00').getTime(), y: 3.2 },
            { x: new Date('2025-10-20 16:00').getTime(), y: 0.3 },
            { x: new Date('2025-10-20 20:00').getTime(), y: 2.7 },
        ],
        verified: [
            { x: new Date('2025-10-19 00:00').getTime(), y: 1.3 },
            { x: new Date('2025-10-19 04:00').getTime(), y: 1.2 },
            { x: new Date('2025-10-19 08:00').getTime(), y: 1.1 },
            { x: new Date('2025-10-19 12:00').getTime(), y: 1.0 },
            { x: new Date('2025-10-19 16:00').getTime(), y: 0.9 },
            { x: new Date('2025-10-19 20:00').getTime(), y: 0.7 },
            { x: new Date('2025-10-20 00:00').getTime(), y: 1.0 },
            { x: new Date('2025-10-20 04:00').getTime(), y: 0.9 },
            { x: new Date('2025-10-20 08:00').getTime(), y: 0.5 },
            { x: new Date('2025-10-20 12:00').getTime(), y: 0.6 },
            { x: new Date('2025-10-20 16:00').getTime(), y: 0.4 },
            { x: new Date('2025-10-20 20:00').getTime(), y: 0.5 },
        ],
        preliminary: [
            { x: new Date('2025-10-19 00:00').getTime(), y: 4.0 },
            { x: new Date('2025-10-19 04:00').getTime(), y: 2.0 },
            { x: new Date('2025-10-19 08:00').getTime(), y: 4.0 },
            { x: new Date('2025-10-19 12:00').getTime(), y: 3.9 },
            { x: new Date('2025-10-19 16:00').getTime(), y: 1.5 },
            { x: new Date('2025-10-19 20:00').getTime(), y: 2.8 },
            { x: new Date('2025-10-20 00:00').getTime(), y: 1.8 },
            { x: new Date('2025-10-20 04:00').getTime(), y: 1.3 },
            { x: new Date('2025-10-20 08:00').getTime(), y: 1.2 },
            { x: new Date('2025-10-20 12:00').getTime(), y: 3.6 },
            { x: new Date('2025-10-20 16:00').getTime(), y: 3.7 },
            { x: new Date('2025-10-20 20:00').getTime(), y: 3.6 },
        ],
        observedMinusPredicted: [
            { x: new Date('2025-10-19 00:00').getTime(), y: 1.0 },
            { x: new Date('2025-10-19 04:00').getTime(), y: 1.0 },
            { x: new Date('2025-10-19 08:00').getTime(), y: 0.8 },
            { x: new Date('2025-10-19 12:00').getTime(), y: 0.7 },
            { x: new Date('2025-10-19 16:00').getTime(), y: 0.7 },
            { x: new Date('2025-10-19 20:00').getTime(), y: 0.6 },
            { x: new Date('2025-10-20 00:00').getTime(), y: 1.0 },
            { x: new Date('2025-10-20 04:00').getTime(), y: 0.6 },
            { x: new Date('2025-10-20 08:00').getTime(), y: 0.5 },
            { x: new Date('2025-10-20 12:00').getTime(), y: 0.6 },
            { x: new Date('2025-10-20 16:00').getTime(), y: 0.7 },
            { x: new Date('2025-10-20 20:00').getTime(), y: 0.8 },
        ]
    };

    const chartData = data ?? defaultData;

    const [series] = useState([
        {
            name: 'Predictions',
            data: chartData?.predictions || [],
            color: '#36A2EB'
        },
        {
            name: 'Verified',
            data: chartData?.verified || [],
            color: '#B4E50D'
        },
        {
            name: 'Preliminary',
            data: chartData?.preliminary || [],
            color: '#FF4444'
        },
        {
            name: 'Observed - Predicted',
            data: chartData?.observedMinusPredicted || [],
            color: '#9966FF'
        }
    ]);

    const options: ApexOptions = {
        chart: {
            type: 'line',
            height: height,
            zoom: {
                enabled: true,
                type: 'x',
                autoScaleYaxis: true
            },
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            },
            animations: {
                enabled: true,
                speed: 800
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        title: {
            text: title,
            align: 'center',
            style: {
                fontSize: '14px',
                fontWeight: 'bold'
            }
        },
        subtitle: {
            text: subtitle,
            align: 'center',
            style: {
                fontSize: '12px'
            }
        },
        grid: {
            borderColor: '#e0e0e0',
            strokeDashArray: 4,
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            }
        },
        markers: {
            size: 0,
            hover: {
                size: 5
            }
        },
        xaxis: {
            type: 'datetime',
            labels: {
                datetimeUTC: false,
                format: 'HH:mm\nMM/dd',
                style: {
                    fontSize: '11px'
                }
            },
            title: {
                text: 'Time',
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            title: {
                text: 'Height in feet (MLLW)',
                style: {
                    fontSize: '12px'
                }
            },
            labels: {
                formatter: function(val: number): string {
                    return val?.toFixed(1);
                }
            },
            min: 0,
            max: 5
        },
        legend: {
            show: true,
            position: 'bottom',
            horizontalAlign: 'center',
            fontSize: '13px',
            itemMargin: {
                horizontal: 15,
                vertical: 5
            },
            onItemClick: {
                toggleDataSeries: true
            },
            onItemHover: {
                highlightDataSeries: true
            }
        },
        tooltip: {
            shared: true,
            intersect: false,
            x: {
                format: 'ddd, MMM dd yyyy, HH:mm'
            },
            y: {
                formatter: function(val: number): string {
                    if (val === null || val === undefined) return 'N/A';
                    return val.toFixed(2) + 'ft';
                }
            },
            custom: function({ series, seriesIndex, dataPointIndex, w }: TooltipContext): string {
                const date = new Date(w.globals.seriesX[seriesIndex][dataPointIndex]);
                const dateStr = date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                let html = '<div class="apexcharts-tooltip-custom" style="padding: 10px; background: white; border: 1px solid #e0e0e0; border-radius: 4px;">';
                html += '<div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">' + dateStr + '</div>';

                w.globals.seriesNames.forEach((name: string, idx: number) => {
                    const value = series[idx][dataPointIndex];
                    if (value !== null && value !== undefined) {
                        const color = w.globals.colors[idx];
                        html += '<div style="display: flex; align-items: center; margin-bottom: 4px;">';
                        html += '<span style="width: 10px; height: 10px; background: ' + color + '; margin-right: 8px; border-radius: 2px;"></span>';
                        html += '<span style="font-size: 12px;">' + name + ': <strong>' + value.toFixed(2) + 'ft</strong></span>';
                        html += '</div>';
                    }
                });

                html += '</div>';
                return html;
            }
        },
        annotations: {
            xaxis: [],
            yaxis: []
        }
    };

    return (
        <div className="water-level-chart-container" style={{ width: '100%', padding: '20px', background: '#fff' }}>
            <ReactApexChart
                options={options}
                series={series}
                type="line"
                height={height}
            />
            <div style={{
                textAlign: 'right',
                fontSize: '10px',
                color: '#999',
                marginTop: '10px',
                paddingRight: '20px'
            }}>
                NOAA: NOS: Center for Operational Oceanographic Products and Services
            </div>
        </div>
    );
};

// Demo/Example Usage
const App: React.FC = () => {
    // Example of custom data format
    const customData: ChartData = {
        predictions: [
            { x: new Date('2025-10-19 00:00').getTime(), y: 2.7 },
            { x: new Date('2025-10-19 06:00').getTime(), y: 0.5 },
            { x: new Date('2025-10-19 12:00').getTime(), y: 3.0 },
            { x: new Date('2025-10-19 18:00').getTime(), y: 0.6 },
            { x: new Date('2025-10-20 00:00').getTime(), y: 2.6 },
            { x: new Date('2025-10-20 06:00').getTime(), y: 0.3 },
            { x: new Date('2025-10-20 12:00').getTime(), y: 3.2 },
            { x: new Date('2025-10-20 18:00').getTime(), y: 0.4 },
        ],
        verified: [
            { x: new Date('2025-10-19 00:00').getTime(), y: 1.3 },
            { x: new Date('2025-10-19 06:00').getTime(), y: 1.1 },
            { x: new Date('2025-10-19 12:00').getTime(), y: 1.0 },
            { x: new Date('2025-10-19 18:00').getTime(), y: 0.8 },
            { x: new Date('2025-10-20 00:00').getTime(), y: 1.0 },
            { x: new Date('2025-10-20 06:00').getTime(), y: 0.7 },
            { x: new Date('2025-10-20 12:00').getTime(), y: 0.6 },
            { x: new Date('2025-10-20 18:00').getTime(), y: 0.5 },
        ],
        preliminary: [
            { x: new Date('2025-10-19 00:00').getTime(), y: 4.0 },
            { x: new Date('2025-10-19 06:00').getTime(), y: 2.2 },
            { x: new Date('2025-10-19 12:00').getTime(), y: 3.9 },
            { x: new Date('2025-10-19 18:00').getTime(), y: 1.8 },
            { x: new Date('2025-10-20 00:00').getTime(), y: 1.8 },
            { x: new Date('2025-10-20 06:00').getTime(), y: 1.2 },
            { x: new Date('2025-10-20 12:00').getTime(), y: 3.6 },
            { x: new Date('2025-10-20 18:00').getTime(), y: 3.7 },
        ],
        observedMinusPredicted: [
            { x: new Date('2025-10-19 00:00').getTime(), y: 1.0 },
            { x: new Date('2025-10-19 06:00').getTime(), y: 0.9 },
            { x: new Date('2025-10-19 12:00').getTime(), y: 0.7 },
            { x: new Date('2025-10-19 18:00').getTime(), y: 0.6 },
            { x: new Date('2025-10-20 00:00').getTime(), y: 1.0 },
            { x: new Date('2025-10-20 06:00').getTime(), y: 0.6 },
            { x: new Date('2025-10-20 12:00').getTime(), y: 0.6 },
            { x: new Date('2025-10-20 18:00').getTime(), y: 0.7 },
        ]
    };

    return (
        <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
                    Water Level Monitoring Dashboard
                </h1>

                {/* Simple usage with default data */}
                <WaterLevelChart />

                {/* Usage with custom data and configuration */}
                <div style={{ marginTop: '40px' }}>
                    <WaterLevelChart
                        title="Custom Water Level Chart"
                        subtitle="Custom date range and data"
                        data={customData}
                        height={450}
                    />
                </div>

                <div style={{
                    marginTop: '40px',
                    padding: '20px',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ marginTop: 0 }}>How to Use:</h3>
                    <pre style={{
                        background: '#f8f8f8',
                        padding: '15px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '13px'
                    }}>
{`import WaterLevelChart from './WaterLevelChart';

// Simple usage with default data
<WaterLevelChart />

// With custom data
const myData = {
  predictions: [{ x: timestamp, y: value }, ...],
  verified: [{ x: timestamp, y: value }, ...],
  preliminary: [{ x: timestamp, y: value }, ...],
  observedMinusPredicted: [{ x: timestamp, y: value }, ...]
};

<WaterLevelChart 
  title="My Custom Title"
  subtitle="My subtitle"
  data={myData}
  height={500}
/>`}
          </pre>
                    <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                        <strong>Features:</strong>
                        <ul>
                            <li>✅ Click legend items to show/hide series</li>
                            <li>✅ Hover over lines to see detailed tooltips</li>
                            <li>✅ Zoom and pan functionality</li>
                            <li>✅ Responsive design</li>
                            <li>✅ Easy to customize with props</li>
                            <li>✅ Full TypeScript support</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export the WaterLevelChart component
export { WaterLevelChart };
export default WaterLevelChart;

// Optionally export the demo App component as well
export { App as DemoApp };