import { MainLayout } from "@/components/layouts/main-layout";
import { ServerList } from "@/components/servers/server-list";

export default function ServersPage() {
  return (
    <MainLayout title="Servers">
      <div className="grid grid-cols-1 gap-4">
        <ServerList />
      </div>
    </MainLayout>
  );
}
