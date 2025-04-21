import { useState } from 'react';
import { useLocation } from 'wouter';
import { usePterodactyl } from '@/hooks/use-pterodactyl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ServerList() {
  const { servers, isLoadingServers } = usePterodactyl();
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter servers based on search and status
  const filteredServers = servers?.filter(server => {
    const matchesSearch = 
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.ipAddress.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || 
      server.status.toLowerCase() === statusFilter.toLowerCase();
      
    return matchesSearch && matchesStatus;
  });

  if (isLoadingServers) {
    return (
      <div className="bg-dark-card rounded-lg shadow-md p-4 border border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-lg font-semibold text-white">Your Game Servers</h2>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-44 bg-dark-surface/50" />
            <Skeleton className="h-10 w-32 bg-dark-surface/50" />
            <Skeleton className="h-10 w-28 bg-dark-surface/50" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="w-full h-64 bg-dark-surface/50" />
        </div>
      </div>
    );
  }

  // Get status color and class
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-success/10 text-success';
      case 'offline':
        return 'bg-danger/10 text-danger';
      case 'starting':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Get game type icon (placeholder using remixicon)
  const getGameIcon = (gameType: string | null): { icon: string | null, fallback: string } => {
    // Handle null or empty gameType
    if (!gameType) {
      return { icon: null, fallback: "ri-gamepad-line" };
    }
    
    switch (gameType.toLowerCase()) {
      case 'minecraft':
        return { icon: "https://cdn.pixabay.com/photo/2013/07/12/19/25/minecraft-154749_960_720.png", fallback: "ri-gamepad-line" };
      case 'rust':
        return { icon: "https://cdn.pixabay.com/photo/2021/06/06/21/20/logo-6316441_960_720.png", fallback: "ri-gamepad-line" };
      case 'csgo':
      case 'cs2':
        return { icon: "https://cdn.pixabay.com/photo/2023/05/27/18/15/cs2-8022044_960_720.png", fallback: "ri-gamepad-line" };
      case 'fivem':
        return { icon: "https://cdn.pixabay.com/photo/2014/04/03/11/07/animal-crossing-311446_960_720.png", fallback: "ri-gamepad-line" };
      default:
        return { icon: null, fallback: "ri-gamepad-line" };
    }
  };

  return (
    <div className="bg-dark-card rounded-lg shadow-md p-4 border border-gray-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-lg font-semibold text-white">Your Game Servers</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search servers..."
              className="text-sm rounded-lg pl-8 pr-4 w-full sm:w-44 bg-dark-surface border border-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-search-line text-gray-400"></i>
            </div>
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="text-sm rounded-lg py-2 px-3 bg-dark-surface border border-gray-700 w-32">
              <SelectValue placeholder="All Servers" />
            </SelectTrigger>
            <SelectContent className="bg-dark-surface border-gray-700">
              <SelectItem value="all">All Servers</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="starting">Starting</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="hidden sm:flex items-center text-sm rounded-lg py-2 px-3"
            onClick={() => navigate('/servers/new')}
          >
            <i className="ri-add-line mr-1"></i> New Server
          </Button>
        </div>
      </div>
      
      {/* Server List */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              <th className="px-4 py-3">Server</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">Node</th>
              <th className="px-4 py-3">Memory</th>
              <th className="px-4 py-3">CPU</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredServers && filteredServers.length > 0 ? (
              filteredServers.map((server) => {
                const gameIcon = getGameIcon(server.gameType);
                
                return (
                  <tr key={server.id} className="hover:bg-dark-surface/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded flex items-center justify-center bg-dark-surface">
                          {gameIcon.icon ? (
                            <img src={gameIcon.icon} alt={server.gameType || 'Game server'} className="h-8 w-8 rounded" />
                          ) : (
                            <i className={`${gameIcon.fallback} text-xl text-gray-400`}></i>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">{server.name}</div>
                          <div className="text-xs text-gray-400">{server.gameType || 'Unknown'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(server.status)}`}>
                        {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {server.ipAddress}:{server.port}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {server.node || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-700 rounded-full h-1.5 mr-2">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (server.memoryLimit ? (server.memoryLimit * 0.6) / server.memoryLimit * 100 : 0))}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {Math.round(server.memoryLimit * 0.6)}/{server.memoryLimit} MB
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-700 rounded-full h-1.5 mr-2">
                          <div 
                            className="bg-accent h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (server.cpuLimit ? 25 : 0))}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">25%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      <div className="flex space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 p-0 rounded-md bg-dark-surface hover:bg-gray-700"
                                onClick={() => navigate(`/servers/${server.pterodactylId}/console`)}
                              >
                                <i className="ri-terminal-box-line"></i>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Console</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 p-0 rounded-md bg-dark-surface hover:bg-gray-700"
                                onClick={() => navigate(`/servers/${server.pterodactylId}/files`)}
                              >
                                <i className="ri-folder-line"></i>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Files</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 p-0 rounded-md bg-dark-surface hover:bg-gray-700"
                                onClick={() => navigate(`/servers/${server.pterodactylId}/settings`)}
                              >
                                <i className="ri-settings-3-line"></i>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Settings</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 p-0 rounded-md bg-dark-surface hover:bg-gray-700"
                                onClick={() => navigate(`/servers/${server.pterodactylId}`)}
                              >
                                <i className="ri-more-2-fill"></i>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>More</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {searchQuery || statusFilter !== 'all' ? (
                    <>
                      <div className="text-lg mb-2">No servers match your filters</div>
                      <p>Try changing your search or filter criteria</p>
                    </>
                  ) : (
                    <>
                      <div className="text-lg mb-2">You don't have any servers yet</div>
                      <Button 
                        onClick={() => navigate('/servers/new')}
                        className="mt-2"
                      >
                        <i className="ri-add-line mr-2"></i> Create your first server
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {filteredServers && filteredServers.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-700 pt-4">
          <div className="flex items-center text-sm text-gray-400">
            Showing <span className="font-medium text-white mx-1">1-{filteredServers.length}</span> of <span className="font-medium text-white mx-1">{filteredServers.length}</span> servers
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3 py-1.5 rounded-md bg-dark-surface text-gray-400 hover:bg-gray-700 hover:text-white"
              disabled={true}
            >
              <i className="ri-arrow-left-s-line"></i>
            </Button>
            <Button
              variant="default"
              size="sm"
              className="px-3 py-1.5 rounded-md"
            >
              1
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3 py-1.5 rounded-md bg-dark-surface text-gray-400 hover:bg-gray-700 hover:text-white"
              disabled={true}
            >
              <i className="ri-arrow-right-s-line"></i>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
