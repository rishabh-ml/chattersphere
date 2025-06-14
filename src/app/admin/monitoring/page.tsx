"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { RefreshCw, AlertTriangle, Clock } from "lucide-react";

interface PerformanceMetric {
  route: string;
  method: string;
  duration: number;
  timestamp: string;
  status: number;
}

interface RoutePerformance {
  route: string;
  avgDuration: number;
}

interface PerformanceData {
  metrics: PerformanceMetric[];
  stats: {
    avgResponseTime: number;
    slowestRoutes: RoutePerformance[];
    totalRequests: number;
  };
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  // Fetch performance data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/performance");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch performance data: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error fetching performance data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication and fetch data on mount
  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        router.push("/sign-in?redirect_url=/admin/monitoring");
        return;
      }

      fetchData();

      // Refresh data every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, userId, router]);

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get status badge color
  const getStatusColor = (status: number) => {
    if (status < 300) return "bg-green-500";
    if (status < 400) return "bg-blue-500";
    if (status < 500) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get duration color
  const getDurationColor = (duration: number) => {
    if (duration < 100) return "text-green-500";
    if (duration < 500) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Performance Monitoring</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-80 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Performance Monitoring</h1>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Average Response Time</CardTitle>
                <CardDescription>Across all endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center">
                  {data.stats.avgResponseTime}ms
                  <Clock className="ml-2 h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Requests</CardTitle>
                <CardDescription>In the monitoring period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.stats.totalRequests}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Slowest Route</CardTitle>
                <CardDescription>Highest average response time</CardDescription>
              </CardHeader>
              <CardContent>
                {data.stats.slowestRoutes.length > 0 ? (
                  <div>
                    <div className="text-3xl font-bold">
                      {data.stats.slowestRoutes[0].avgDuration}ms
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {data.stats.slowestRoutes[0].route}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="routes">Routes</TabsTrigger>
              <TabsTrigger value="requests">Recent Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Time by Route</CardTitle>
                  <CardDescription>Average response time in milliseconds</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.stats.slowestRoutes}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="route"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          interval={0}
                        />
                        <YAxis
                          label={{
                            value: "Response Time (ms)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgDuration" fill="#8884d8" name="Avg. Response Time (ms)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="routes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Routes by Performance</CardTitle>
                  <CardDescription>Sorted by average response time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Route</th>
                          <th className="text-right py-3 px-4">Avg. Response Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.stats.slowestRoutes.map((route, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-mono text-sm">{route.route}</td>
                            <td
                              className={`py-3 px-4 text-right font-mono ${getDurationColor(route.avgDuration)}`}
                            >
                              {route.avgDuration}ms
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Requests</CardTitle>
                  <CardDescription>Last {data.metrics.length} requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Time</th>
                          <th className="text-left py-3 px-4">Method</th>
                          <th className="text-left py-3 px-4">Route</th>
                          <th className="text-center py-3 px-4">Status</th>
                          <th className="text-right py-3 px-4">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.metrics.map((metric, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm">{formatTime(metric.timestamp)}</td>
                            <td className="py-3 px-4 font-mono text-sm">{metric.method}</td>
                            <td className="py-3 px-4 font-mono text-sm truncate max-w-xs">
                              {metric.route}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={getStatusColor(metric.status)}>
                                {metric.status}
                              </Badge>
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-mono ${getDurationColor(metric.duration)}`}
                            >
                              {metric.duration}ms
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
