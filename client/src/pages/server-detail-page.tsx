import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { MainLayout } from "@/components/layouts/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServerControls } from "@/components/servers/server-controls";
import { ServerConsole } from "@/components/servers/server-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePterodactyl } from "@/hooks/use-pterodactyl";
import { useQuery } from "@tanstack/react-query";

export default function ServerDetailPage() {
  const [, params] = useRoute('/servers/:id');
  const { servers, isLoadingServers } = usePterodactyl();
  const [activeTab, setActiveTab] = useState('overview');
  
  const serverId = params?.id;
  
  const { data: server, isLoading: isLoadingServer } = useQuery({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !!serverId && !isLoadingServers,
    initialData: servers?.find(s => s.pterodactylId === serverId),
  });
  
  const isLoading = isLoadingServers || isLoadingServer;
  
  // Update active tab based on URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['overview', 'console', 'files', 'backups', 'schedules', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);
  
  // Update URL hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);
  
  return (
    <MainLayout title={server ? server.name : 'Server Details'}>
      <div className="space-y-6">
        {/* Server Controls */}
        <ServerControls server={server} isLoading={isLoading} />
        
        {/* Server Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 lg:w-auto w-full mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="w-full h-40 bg-dark-surface/50" />
                <Skeleton className="w-full h-40 bg-dark-surface/50" />
              </>
            ) : (
              <>
                <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Server Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Server Name</p>
                          <p className="text-white">{server?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">IP Address & Port</p>
                          <p className="text-white">{server?.ipAddress}:{server?.port}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Node</p>
                          <p className="text-white">{server?.node || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Game Type</p>
                          <p className="text-white">{server?.gameType || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Status</p>
                          <p className="text-white capitalize">{server?.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Created</p>
                          <p className="text-white">{server?.createdAt ? new Date(server.createdAt).toLocaleDateString() : 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Resource Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Memory</p>
                        <div className="flex items-center mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: '35%' }}></div>
                          </div>
                          <span className="ml-3 text-white">{(server?.memoryLimit || 0) / 1024} GB</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">350 MB used of {(server?.memoryLimit || 0) / 1024} GB</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">CPU</p>
                        <div className="flex items-center mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-accent h-2.5 rounded-full" style={{ width: '15%' }}></div>
                          </div>
                          <span className="ml-3 text-white">{server?.cpuLimit || 0}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">15% used of {server?.cpuLimit || 0}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Disk</p>
                        <div className="flex items-center mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-secondary h-2.5 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                          <span className="ml-3 text-white">{(server?.diskLimit || 0) / 1024} GB</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">3 GB used of {(server?.diskLimit || 0) / 1024} GB</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="console">
            <ServerConsole server={server} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="files">
            <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">File Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <div className="mb-4 text-gray-400">
                    <i className="ri-folder-line text-5xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">File manager is not available in this demo</h3>
                  <p className="text-gray-400">
                    In the full application, you would be able to browse, edit, upload, and download files from your server.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="backups">
            <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Backups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <div className="mb-4 text-gray-400">
                    <i className="ri-database-2-line text-5xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No backups available</h3>
                  <p className="text-gray-400 mb-4">
                    You don't have any backups for this server yet. Create a backup to protect your data.
                  </p>
                  <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">
                    <i className="ri-add-line mr-2"></i> Create Backup
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="schedules">
            <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <div className="mb-4 text-gray-400">
                    <i className="ri-calendar-line text-5xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No schedules found</h3>
                  <p className="text-gray-400 mb-4">
                    Create scheduled tasks like backups, restarts, or custom commands.
                  </p>
                  <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">
                    <i className="ri-add-line mr-2"></i> New Schedule
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Server Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Server Name</p>
                    <input type="text" className="w-full p-2 rounded bg-dark-surface border border-gray-700 text-white" value={server?.name || ''} readOnly />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Default Startup Command</p>
                    <textarea className="w-full p-2 rounded bg-dark-surface border border-gray-700 text-white h-20" readOnly>
                      java -Xms128M -Xmx{(server?.memoryLimit || 0) / 1024}G -jar server.jar nogui
                    </textarea>
                  </div>
                  <div className="pt-2">
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">
                      Save Changes
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
