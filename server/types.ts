// Pterodactyl API Types

export interface PterodactylApiResponse {
  object: string;
  data: PterodactylServer[] | PterodactylServer;
}

export interface PterodactylServer {
  object: string;
  attributes: {
    id: number;
    external_id: string | null;
    uuid: string;
    identifier: string;
    name: string;
    description: string | null;
    status: string;
    suspended: boolean;
    limits: {
      memory: number;
      swap: number;
      disk: number;
      io: number;
      cpu: number;
      threads: number | null;
    };
    feature_limits: {
      databases: number;
      allocations: number;
      backups: number;
    };
    user: number;
    node: string;
    allocation: {
      id: number;
      ip: string;
      alias: string | null;
      port: number;
      notes: string | null;
      assigned: boolean;
    };
    nest: number;
    egg: number;
    container: {
      startup_command: string;
      image: string;
      installed: boolean;
      environment: { [key: string]: string };
    };
    updated_at: string;
    created_at: string;
  };
}

export interface PterodactylResourceStats {
  object: string;
  attributes: {
    current_state: string;
    is_suspended: boolean;
    resources: {
      memory_bytes: number;
      cpu_absolute: number;
      disk_bytes: number;
      network_rx_bytes: number;
      network_tx_bytes: number;
    };
  };
}

export interface PterodactylResourceResponse {
  object: string;
  data: {
    attributes: {
      current_state: string;
      is_suspended: boolean;
      memory_bytes: number;
      cpu_absolute: number;
      disk_bytes: number;
      network_rx_bytes: number;
      network_tx_bytes: number;
      state: string;
    }
  }
}

export interface ServerResponse {
  id: number;
  userId: number;
  pterodactylId: string;
  name: string;
  description: string | null;
  node: string;
  gameType: string;
  status: string;
  ipAddress: string;
  port: number;
  memoryLimit: number;
  diskLimit: number;
  cpuLimit: number;
  createdAt: Date;
}

export interface ServerUsage {
  cpu: number;
  memory: number;
  disk: number;
  state: string;
}
