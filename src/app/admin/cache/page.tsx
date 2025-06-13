'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertTriangle, Trash2, BarChart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  sets: number;
  deletes: number;
}

interface CacheData {
  stats: CacheStats;
  hitRate: number;
  timestamp: string;
}

export default function CacheDashboard() {
  const [data, setData] = useState<CacheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [invalidatePattern, setInvalidatePattern] = useState('*');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  // Fetch cache statistics
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setActionMessage(null);
    
    try {
      const response = await fetch('/api/admin/cache');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cache statistics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching cache statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset cache statistics
  const resetStats = async () => {
    setLoading(true);
    setError(null);
    setActionMessage(null);
    
    try {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to reset cache statistics: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      setActionMessage(result.message);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error resetting cache statistics:', err);
      setLoading(false);
    }
  };

  // Invalidate cache keys
  const invalidateCache = async () => {
    if (!invalidatePattern) {
      setError('Please enter a pattern to invalidate');
      return;
    }
    
    setLoading(true);
    setError(null);
    setActionMessage(null);
    
    try {
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'invalidate', pattern: invalidatePattern }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to invalidate cache: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      setActionMessage(result.message);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error invalidating cache:', err);
      setLoading(false);
    }
  };

  // Check authentication and fetch data on mount
  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        router.push('/sign-in?redirect_url=/admin/cache');
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

  // Prepare data for pie chart
  const getPieChartData = () => {
    if (!data) return [];
    
    return [
      { name: 'Hits', value: data.stats.hits },
      { name: 'Misses', value: data.stats.misses },
    ];
  };

  // Colors for pie chart
  const COLORS = ['#4ade80', '#f87171'];

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Cache Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-80 mb-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Cache Dashboard</h1>
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
        <h1 className="text-3xl font-bold">Cache Dashboard</h1>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {actionMessage && (
        <Alert className="mb-6">
          <AlertTitle>Action Completed</AlertTitle>
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Cache Hit Rate</CardTitle>
                <CardDescription>Percentage of cache hits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.hitRate.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Last updated: {formatTime(data.timestamp)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Operations</CardTitle>
                <CardDescription>Cache operations count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.stats.hits + data.stats.misses + data.stats.sets + data.stats.deletes}
                </div>
                <div className="text-sm text-muted-foreground">
                  Hits: {data.stats.hits}, Misses: {data.stats.misses}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Cache Actions</CardTitle>
                <CardDescription>Sets and deletes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.stats.sets + data.stats.deletes}
                </div>
                <div className="text-sm text-muted-foreground">
                  Sets: {data.stats.sets}, Deletes: {data.stats.deletes}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Hit/Miss Ratio</CardTitle>
                  <CardDescription>Distribution of cache hits and misses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`${value}`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="actions" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reset Cache Statistics</CardTitle>
                    <CardDescription>Reset all cache statistics to zero</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">This will reset all cache statistics (hits, misses, etc.) to zero. The actual cache data will not be affected.</p>
                    <Button onClick={resetStats} variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reset Statistics
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Invalidate Cache</CardTitle>
                    <CardDescription>Remove cache entries matching a pattern</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2">Enter a pattern to invalidate cache keys. Use * as a wildcard.</p>
                        <p className="text-sm text-muted-foreground mb-4">Examples: post:*, user:123:*, *</p>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          value={invalidatePattern}
                          onChange={(e) => setInvalidatePattern(e.target.value)}
                          placeholder="Cache key pattern"
                        />
                        <Button onClick={invalidateCache} variant="destructive">
                          Invalidate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
