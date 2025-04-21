import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePterodactyl } from '@/hooks/use-pterodactyl';
import { useLocation } from 'wouter';

export function QuickActions() {
  const { servers, startServerMutation, stopServerMutation, restartServerMutation, isPowerActionPending } = usePterodactyl();
  const [_, navigate] = useLocation();
  
  // Get the most recently used server (first one for demo)
  const recentServer = servers?.[0];

  if (!servers || servers.length === 0) {
    return (
      <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800 h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="w-full h-20 bg-dark-surface/50" />
            <Skeleton className="w-full h-10 bg-dark-surface/50" />
            <Skeleton className="w-full h-10 bg-dark-surface/50" />
            <Skeleton className="w-full h-10 bg-dark-surface/50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-primary/20 text-primary';
      case 'offline':
        return 'bg-danger/20 text-danger';
      case 'starting':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-success';
      case 'offline':
        return 'bg-danger';
      case 'starting':
        return 'bg-warning';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-dark-card rounded-lg shadow-md p-4 border border-gray-800 h-full">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {/* Recent Server */}
        {recentServer && (
          <div className="bg-dark-surface rounded-lg p-3 mb-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${getStatusDot(recentServer.status)} mr-2`}></div>
                <h3 className="font-medium text-white">{recentServer.name}</h3>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(recentServer.status)}`}>
                {recentServer.status.charAt(0).toUpperCase() + recentServer.status.slice(1)}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-3">{recentServer.ipAddress}:{recentServer.port}</div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 bg-success/10 text-success border border-success/20 hover:bg-success/20"
                onClick={() => startServerMutation(recentServer.pterodactylId)}
                disabled={isPowerActionPending || recentServer.status.toLowerCase() === 'running'}
              >
                <i className="ri-play-fill mr-1"></i> Start
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 bg-dark-surface text-white border border-gray-700 hover:bg-gray-700"
                onClick={() => restartServerMutation(recentServer.pterodactylId)}
                disabled={isPowerActionPending || recentServer.status.toLowerCase() !== 'running'}
              >
                <i className="ri-refresh-line mr-1"></i> Restart
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20"
                onClick={() => stopServerMutation(recentServer.pterodactylId)}
                disabled={isPowerActionPending || recentServer.status.toLowerCase() !== 'running'}
              >
                <i className="ri-stop-fill mr-1"></i> Stop
              </Button>
            </div>
          </div>
        )}
        
        {/* Actions List */}
        <h3 className="text-sm font-medium text-gray-300 mb-2">Other Actions</h3>
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-dark-surface text-sm"
            onClick={() => navigate('/servers/new')}
          >
            <span className="flex items-center text-gray-300">
              <i className="ri-add-circle-line mr-2 text-primary"></i> Create New Server
            </span>
            <i className="ri-arrow-right-s-line text-gray-500"></i>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-dark-surface text-sm"
            onClick={() => navigate('/backups')}
          >
            <span className="flex items-center text-gray-300">
              <i className="ri-database-2-line mr-2 text-secondary"></i> Manage Backups
            </span>
            <i className="ri-arrow-right-s-line text-gray-500"></i>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-dark-surface text-sm"
            onClick={() => navigate('/settings?tab=security')}
          >
            <span className="flex items-center text-gray-300">
              <i className="ri-shield-star-line mr-2 text-accent"></i> Security Settings
            </span>
            <i className="ri-arrow-right-s-line text-gray-500"></i>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-dark-surface text-sm"
            onClick={() => navigate('/tickets')}
          >
            <span className="flex items-center text-gray-300">
              <i className="ri-customer-service-2-line mr-2 text-warning"></i> Contact Support
            </span>
            <span className="text-xs bg-warning text-dark-card px-1.5 py-0.5 rounded-full">2</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
