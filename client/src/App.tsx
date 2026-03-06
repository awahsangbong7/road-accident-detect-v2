import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Loader2 } from "lucide-react";
import { AccidentNotificationManager } from "@/components/accident-notification";
import type { Alert } from "@shared/schema";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Upload from "@/pages/upload";
import LiveMonitoring from "@/pages/live-monitoring";
import Alerts from "@/pages/alerts";
import MapView from "@/pages/map-view";
import Cameras from "@/pages/cameras";
import Contacts from "@/pages/contacts";
import Analytics from "@/pages/analytics";
import AIAssistant from "@/pages/ai-assistant";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import Signup from "@/pages/signup";
import RespondersDashboard from "@/pages/responders-dashboard";
import HospitalDashboard from "@/pages/hospital-dashboard";
import PoliceDashboard from "@/pages/police-dashboard";
import AmbulanceDashboard from "@/pages/ambulance-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminLogin from "@/pages/admin-login";

function RoleBasedHome({ userRole }: { userRole: string }) {
  switch (userRole) {
    case "admin": return <AdminDashboard />;
    case "police": return <PoliceDashboard />;
    case "ambulance": return <AmbulanceDashboard />;
    case "hospital": return <HospitalDashboard />;
    default: return <Dashboard />;
  }
}

function AuthenticatedRouter({ userRole }: { userRole: string }) {
  return (
    <Switch>
      <Route path="/">{() => <RoleBasedHome userRole={userRole} />}</Route>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/upload" component={Upload} />
      <Route path="/live" component={LiveMonitoring} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/map" component={MapView} />
      <Route path="/cameras" component={Cameras} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/assistant" component={AIAssistant} />
      <Route path="/settings" component={Settings} />
      <Route path="/responders" component={RespondersDashboard} />
      <Route path="/hospital" component={HospitalDashboard} />
      <Route path="/police" component={PoliceDashboard} />
      <Route path="/ambulance" component={AmbulanceDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

const roleColors: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  dispatcher: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  police: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  ambulance: "bg-red-500/10 text-red-500 border-red-500/20",
  fire: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  hospital: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  dispatcher: "Dispatcher",
  police: "Police",
  ambulance: "Ambulance",
  fire: "Fire Dept",
  hospital: "Hospital",
};

function GlobalAlertNotifications() {
  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 3000,
  });

  if (!alerts) return null;
  return <AccidentNotificationManager alerts={alerts} />;
}

function AuthenticatedApp() {
  const { user, logout, isLoggingOut } = useAuth();
  
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  const userInitials = user 
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const userRole = (user as any)?.role || 'dispatcher';
  const userCity = (user as any)?.city || '';

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar userRole={userRole} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || 'User'} />
                  <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-medium" data-testid="text-username">
                    {user?.firstName || 'User'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={`text-xs py-0 ${roleColors[userRole]}`} data-testid="badge-role">
                      {roleLabels[userRole] || 'User'}
                    </Badge>
                    {userCity && (
                      <span className="text-xs text-muted-foreground" data-testid="text-city">
                        {userCity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                disabled={isLoggingOut}
                data-testid="button-logout"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-muted/30">
            <AuthenticatedRouter userRole={userRole} />
          </main>
        </div>
      </div>
      <GlobalAlertNotifications />
    </SidebarProvider>
  );
}

function UnauthenticatedRouter() {
  return (
    <Switch>
      <Route path="/signup" component={Signup} />
      <Route path="/admin" component={AdminLogin} />
      <Route component={Landing} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <UnauthenticatedRouter />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
