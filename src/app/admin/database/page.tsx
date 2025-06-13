'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Database, Archive, AlertTriangle, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function DatabaseDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('archiving');
  const [collections, setCollections] = useState({
    posts: true,
    comments: true,
    notifications: true,
    activities: true,
  });
  const [thresholdDays, setThresholdDays] = useState(90);
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  // Check authentication
  if (isLoaded && !userId) {
    router.push('/sign-in?redirect_url=/admin/database');
    return null;
  }

  // Handle archiving
  const handleArchive = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Build the collections parameter
      const selectedCollections = Object.entries(collections)
        .filter(([_, selected]) => selected)
        .map(([name]) => name);
      
      if (selectedCollections.length === 0) {
        setError('Please select at least one collection to archive');
        setLoading(false);
        return;
      }
      
      // Call the API to run the archiving task
      const response = await fetch('/api/admin/database/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collections: selectedCollections,
          thresholdDays,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to archive data');
      }
      
      const data = await response.json();
      setSuccess(`Successfully archived data: ${JSON.stringify(data.results)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error archiving data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Database Management</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="archiving">
            <Archive className="h-4 w-4 mr-2" />
            Data Archiving
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Database className="h-4 w-4 mr-2" />
            Database Stats
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="archiving" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Archive Old Data</CardTitle>
              <CardDescription>
                Archive old data to improve database performance. Archived data is moved to separate collections and can be restored if needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Select Collections to Archive</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="posts"
                        checked={collections.posts}
                        onCheckedChange={(checked: boolean) => setCollections({ ...collections, posts: !!checked })}
                      />
                      <Label htmlFor="posts">Posts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="comments"
                        checked={collections.comments}
                        onCheckedChange={(checked: boolean) => setCollections({ ...collections, comments: !!checked })}
                      />
                      <Label htmlFor="comments">Comments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifications"
                        checked={collections.notifications}
                        onCheckedChange={(checked: boolean) => setCollections({ ...collections, notifications: !!checked })}
                      />
                      <Label htmlFor="notifications">Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="activities"
                        checked={collections.activities}
                        onCheckedChange={(checked: boolean) => setCollections({ ...collections, activities: !!checked })}
                      />
                      <Label htmlFor="activities">Activities</Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Archive Threshold</h3>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={thresholdDays}
                      onChange={(e) => setThresholdDays(parseInt(e.target.value, 10))}
                      min={1}
                      max={365}
                      className="w-24"
                    />
                    <span>days old</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data older than this threshold will be archived.
                  </p>
                </div>
                
                <div>
                  <Button
                    onClick={handleArchive}
                    disabled={loading}
                    className="w-full md:w-auto"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Statistics</CardTitle>
              <CardDescription>
                View statistics about your database collections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Database statistics will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
