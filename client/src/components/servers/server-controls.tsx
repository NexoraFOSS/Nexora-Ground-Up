import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePterodactyl } from '@/hooks/use-pterodactyl';
import { Server } from '@shared/schema';
import { Loader2 } from 'lucide-react';

interface ServerControlsProps {
  server: Server | undefined;
  isLoading: boolean;
}

export function ServerControls({ server, isLoading }: ServerControlsProps) {
  const { startServerMutation, stopServerMutation, restartServerMutation, isPowerActionPending } = usePterodactyl();

  if (isLoading || !server) {
    return (
      <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Server Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-14 bg-dark-surface/50 mb-4" />
          <div className="flex space-x-2">
            <Skeleton className="flex-1 h-10 bg-dark-surface/50" />
            <Skeleton className="flex-1 h-10 bg-dark-surface/50" />
            <Skeleton className="flex-1 h-10 bg-dark-surface/50" />
          </div>
        </CardContent>
      </Card>
    );
  }

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
    <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Server Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-dark-surface rounded-lg p-3 mb-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${getStatusDot(server.status)} mr-2`}></div>
              <h3 className="font-medium text-white">{server.name}</h3>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(server.status)}`}>
              {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
            </span>
          </div>
          <div className="text-xs text-gray-400 mb-3">{server.ipAddress}:{server.port}</div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-success/10 text-success border border-success/20 hover:bg-success/20"
              onClick={() => startServerMutation(server.pterodactylId)}
              disabled={isPowerActionPending || server.status.toLowerCase() === 'running'}
            >
              {isPowerActionPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <i className="ri-play-fill mr-1"></i>
              )}
              Start
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-dark-surface text-white border border-gray-700 hover:bg-gray-700"
              onClick={() => restartServerMutation(server.pterodactylId)}
              disabled={isPowerActionPending || server.status.toLowerCase() !== 'running'}
            >
              {isPowerActionPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <i className="ri-refresh-line mr-1"></i>
              )}
              Restart
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20"
              onClick={() => stopServerMutation(server.pterodactylId)}
              disabled={isPowerActionPending || server.status.toLowerCase() !== 'running'}
            >
              {isPowerActionPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <i className="ri-stop-fill mr-1"></i>
              )}
              Stop
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
