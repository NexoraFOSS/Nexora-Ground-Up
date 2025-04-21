import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { PterodactylProvider } from "@/hooks/use-pterodactyl";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ServersPage from "@/pages/servers-page";
import ServerDetailPage from "@/pages/server-detail-page";
import BillingPage from "@/pages/billing-page";
import TicketsPage from "@/pages/tickets-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/servers" component={ServersPage} />
      <ProtectedRoute path="/servers/:id" component={ServerDetailPage} />
      <ProtectedRoute path="/billing" component={BillingPage} />
      <ProtectedRoute path="/tickets" component={TicketsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PterodactylProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </PterodactylProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
