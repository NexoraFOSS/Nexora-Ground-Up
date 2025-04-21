import { useState, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { usePterodactyl } from '@/hooks/use-pterodactyl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ResourceMetricProps {
  label: string;
  value: string;
}

function ResourceMetric({ label, value }: ResourceMetricProps) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function ResourceUsageChart() {
  const { servers, serverStats } = usePterodactyl();
  const [resourceType, setResourceType] = useState<'cpu' | 'ram' | 'disk'>('cpu');
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Calculate metrics
  const currentCpuUsage = serverStats?.reduce((acc, stat) => acc + (stat.cpuUsage || 0), 0) ?? 0;
  const avgCpuLoad = serverStats?.length ? (currentCpuUsage / serverStats.length).toFixed(2) : '0';
  const peakCpu = serverStats?.reduce((max, stat) => Math.max(max, stat.cpuUsage || 0), 0) ?? 0;

  useEffect(() => {
    if (!serverStats?.length) {
      setLoading(true);
      return;
    }

    // Generate dummy time labels for chart (last 12 hours)
    const labels = [];
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(now.getHours() - i);
      labels.push(time.getHours() + ':00');
    }

    // Prepare chart data based on resource type
    let data;
    switch (resourceType) {
      case 'cpu':
        data = serverStats.slice(0, 12).map(stat => stat.cpuUsage || 0);
        break;
      case 'ram':
        data = serverStats.slice(0, 12).map(stat => stat.ramUsage || 0);
        break;
      case 'disk':
        data = serverStats.slice(0, 12).map(stat => stat.diskUsage || 0);
        break;
    }

    // Fill missing data points
    while (data.length < 12) {
      data.push(0);
    }

    setChartData({
      labels,
      datasets: [
        {
          label: resourceType.toUpperCase(),
          data,
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
        },
      ],
    });
    
    setLoading(false);
  }, [serverStats, resourceType]);

  return (
    <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold text-white">Resource Usage</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant={resourceType === 'cpu' ? "default" : "outline"} 
              size="sm"
              onClick={() => setResourceType('cpu')}
              className={resourceType === 'cpu' ? "bg-primary/20 text-primary border-primary/20 hover:bg-primary/30" : ""}
            >
              CPU
            </Button>
            <Button 
              variant={resourceType === 'ram' ? "default" : "outline"} 
              size="sm"
              onClick={() => setResourceType('ram')}
              className={resourceType === 'ram' ? "bg-primary/20 text-primary border-primary/20 hover:bg-primary/30" : ""}
            >
              RAM
            </Button>
            <Button 
              variant={resourceType === 'disk' ? "default" : "outline"} 
              size="sm"
              onClick={() => setResourceType('disk')}
              className={resourceType === 'disk' ? "bg-primary/20 text-primary border-primary/20 hover:bg-primary/30" : ""}
            >
              Disk
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="chart-container h-48 mb-4">
          {loading || !chartData ? (
            <Skeleton className="w-full h-full bg-dark-surface/50" />
          ) : (
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(75, 85, 99, 0.3)',
                    borderWidth: 1,
                  },
                },
                scales: {
                  x: {
                    grid: {
                      color: 'rgba(75, 85, 99, 0.1)',
                    },
                    ticks: {
                      color: 'rgba(156, 163, 175, 0.8)',
                    },
                  },
                  y: {
                    grid: {
                      color: 'rgba(75, 85, 99, 0.1)',
                    },
                    ticks: {
                      color: 'rgba(156, 163, 175, 0.8)',
                    },
                    beginAtZero: true,
                    suggestedMax: 100,
                  },
                },
              }}
            />
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <ResourceMetric 
            label="Current CPU" 
            value={`${Math.round(currentCpuUsage)}%`} 
          />
          <ResourceMetric 
            label="Avg Load" 
            value={avgCpuLoad} 
          />
          <ResourceMetric 
            label="Peak Today" 
            value={`${Math.round(peakCpu)}%`} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
