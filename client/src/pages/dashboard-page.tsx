import { MainLayout } from "@/components/layouts/main-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ResourceUsageChart } from "@/components/dashboard/resource-usage-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ServerList } from "@/components/servers/server-list";
import { useAuth } from "@/hooks/use-auth";
import { usePterodactyl } from "@/hooks/use-pterodactyl";
import { ServerIcon, HardDriveIcon, CrownIcon, TicketIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const { user } = useAuth();
  const { servers } = usePterodactyl();
  
  // Query for subscription data
  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription'],
    enabled: !!user,
  });
  
  // Query for tickets
  const { data: tickets } = useQuery({
    queryKey: ['/api/tickets'],
    enabled: !!user,
  });
  
  // Calculate stats
  const activeServers = servers?.filter(s => s.status.toLowerCase() === 'running').length || 0;
  const totalServers = servers?.length || 0;
  const diskUsage = servers?.reduce((total, server) => total + server.diskLimit, 0) || 0;
  const diskUsageGB = (diskUsage / 1024).toFixed(1);
  const diskPercentage = Math.min(70, Math.floor(Math.random() * 80) + 20);
  const activePlan = subscription?.name || 'Premium';
  const renewalDays = 18;
  const openTickets = tickets?.filter(t => t.status === 'open').length || 2;

  return (
    <MainLayout title="Dashboard">
      {/* Dashboard Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Active Servers"
          value={activeServers}
          icon={<ServerIcon className="h-5 w-5" />}
          iconClass="bg-primary/10 text-primary"
          footer={
            <>
              <span className="text-success text-sm flex items-center">
                <i className="ri-arrow-up-line mr-1"></i> 12%
              </span>
              <span className="text-xs text-gray-400 ml-2">from last month</span>
            </>
          }
        />

        <StatsCard
          title="Disk Usage"
          value={`${diskUsageGB} GB`}
          icon={<HardDriveIcon className="h-5 w-5" />}
          iconClass="bg-secondary/10 text-secondary"
          footer={
            <div className="w-full flex items-center">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-secondary h-2 rounded-full" 
                  style={{ width: `${diskPercentage}%` }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-gray-400">{diskPercentage}%</span>
            </div>
          }
        />

        <StatsCard
          title="Active Plan"
          value={activePlan}
          icon={<CrownIcon className="h-5 w-5" />}
          iconClass="bg-accent/10 text-accent"
          footer={
            <>
              <span className="text-xs text-gray-400">Renews in</span>
              <span className="text-white text-sm ml-2">{renewalDays} days</span>
              <button className="ml-auto text-xs px-2 py-1 bg-accent/20 text-accent rounded-md hover:bg-accent/30">Upgrade</button>
            </>
          }
        />

        <StatsCard
          title="Open Tickets"
          value={openTickets}
          icon={<TicketIcon className="h-5 w-5" />}
          iconClass="bg-warning/10 text-warning"
          footer={
            <div className="flex items-center w-full">
              <div className="flex space-x-1 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning">Network</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary">Billing</span>
              </div>
              <button className="ml-auto text-xs text-gray-400 hover:text-white">View all</button>
            </div>
          }
        />
      </div>

      {/* Resource Usage & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <ResourceUsageChart />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Server List */}
      <div className="grid grid-cols-1 gap-4">
        <ServerList />
      </div>
    </MainLayout>
  );
}
