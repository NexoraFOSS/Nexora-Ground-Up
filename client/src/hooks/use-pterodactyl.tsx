import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Server, ServerStat } from "@shared/schema";

interface PterodactylServer {
  id: string;
  attributes: {
    identifier: string;
    name: string;
    description: string;
    node: string;
    status: string;
    allocation: {
      ip: string;
      port: number;
    };
    limits: {
      memory: number;
      disk: number;
      cpu: number;
    };
  };
}

interface ResourceUsage {
  serverId: string;
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    state: string;
  };
}

type PterodactylContextType = {
  servers: Server[] | null;
  isLoadingServers: boolean;
  errorServers: Error | null;
  getServerById: (id: string) => Server | undefined;
  getResourceUsage: (id: string) => ResourceUsage | undefined;
  serverStats: ServerStat[] | null;
  startServerMutation: (id: string) => void;
  stopServerMutation: (id: string) => void;
  restartServerMutation: (id: string) => void;
  sendCommandMutation: (params: { id: string; command: string }) => void;
  isPowerActionPending: boolean;
};

export const PterodactylContext = createContext<PterodactylContextType | null>(null);

export function PterodactylProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const {
    data: servers,
    error: errorServers,
    isLoading: isLoadingServers,
  } = useQuery<Server[], Error>({
    queryKey: ["/api/servers"],
    enabled: true,
  });

  const { data: serverStats } = useQuery<ServerStat[], Error>({
    queryKey: ["/api/server-stats"],
    enabled: !!servers,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const startServerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/servers/${id}/power`, { action: "start" });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/server-stats"] });
      toast({
        title: "Server started",
        description: "Server is starting up now.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start server",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stopServerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/servers/${id}/power`, { action: "stop" });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/server-stats"] });
      toast({
        title: "Server stopped",
        description: "Server has been stopped.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to stop server",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restartServerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/servers/${id}/power`, { action: "restart" });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/server-stats"] });
      toast({
        title: "Server restarted",
        description: "Server is restarting now.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to restart server",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendCommandMutation = useMutation({
    mutationFn: async (params: { id: string; command: string }) => {
      await apiRequest("POST", `/api/servers/${params.id}/command`, { command: params.command });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send command",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getServerById = (id: string) => {
    return servers?.find(server => server.pterodactylId === id);
  };

  const getResourceUsage = (id: string): ResourceUsage | undefined => {
    if (!serverStats) return undefined;
    
    const latestStats = serverStats
      .filter(stat => stat.serverId.toString() === id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    if (!latestStats) return undefined;
    
    return {
      serverId: id,
      resources: {
        memoryUsage: latestStats.ramUsage ?? 0,
        cpuUsage: latestStats.cpuUsage ?? 0,
        diskUsage: latestStats.diskUsage ?? 0,
        state: latestStats.state ?? 'unknown'
      }
    };
  };

  const isPowerActionPending = 
    startServerMutation.isPending || 
    stopServerMutation.isPending || 
    restartServerMutation.isPending;

  return (
    <PterodactylContext.Provider
      value={{
        servers,
        isLoadingServers,
        errorServers,
        getServerById,
        getResourceUsage,
        serverStats,
        startServerMutation: (id) => startServerMutation.mutate(id),
        stopServerMutation: (id) => stopServerMutation.mutate(id),
        restartServerMutation: (id) => restartServerMutation.mutate(id),
        sendCommandMutation: (params) => sendCommandMutation.mutate(params),
        isPowerActionPending
      }}
    >
      {children}
    </PterodactylContext.Provider>
  );
}

export function usePterodactyl() {
  const context = useContext(PterodactylContext);
  if (!context) {
    throw new Error("usePterodactyl must be used within a PterodactylProvider");
  }
  return context;
}
