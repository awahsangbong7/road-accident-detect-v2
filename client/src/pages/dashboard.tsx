import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  Camera, 
  Users, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Bell
} from "lucide-react";
import type { Alert, Camera as CameraType, Contact } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  variant = "default"
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  description: string;
  trend?: string;
  variant?: "default" | "warning" | "success" | "emergency";
}) {
  const variantStyles = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    emergency: "bg-emergency/10 text-emergency",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-md p-2 ${variantStyles[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
          {trend && <span className="text-success ml-1">{trend}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

function RecentAlertItem({ alert }: { alert: Alert }) {
  const severityColors = {
    high: "bg-emergency text-emergency-foreground",
    medium: "bg-warning text-warning-foreground",
    low: "bg-success text-success-foreground",
  };

  const statusColors = {
    pending: "bg-warning/20 text-warning border-warning/30",
    acknowledged: "bg-primary/20 text-primary border-primary/30",
    resolved: "bg-success/20 text-success border-success/30",
    false_alarm: "bg-muted text-muted-foreground border-muted",
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${severityColors[alert.severity as keyof typeof severityColors] || "bg-muted"}`} />
        <div>
          <p className="text-sm font-medium">{alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Detected</p>
          <p className="text-xs text-muted-foreground">{alert.location}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={statusColors[alert.status as keyof typeof statusColors] || ""}>
          {alert.status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {Math.round(alert.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 3000,
  });

  const { data: cameras, isLoading: camerasLoading } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras"],
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const activeAlerts = alerts?.filter(a => a.status === "pending") || [];
  const activeCameras = cameras?.filter(c => c.status === "active") || [];
  const activeContacts = contacts?.filter(c => c.isActive) || [];
  const todayAlerts = alerts?.filter(a => {
    const today = new Date();
    const alertDate = new Date(a.createdAt);
    return alertDate.toDateString() === today.toDateString();
  }) || [];

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time monitoring and accident detection overview
            </p>
          </div>
          <Button asChild data-testid="button-view-alerts">
            <Link href="/alerts">
              <Bell className="mr-2 h-4 w-4" />
              View All Alerts
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {alertsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Active Alerts"
              value={activeAlerts.length}
              icon={AlertTriangle}
              description="Pending incidents"
              variant={activeAlerts.length > 0 ? "emergency" : "default"}
            />
            <StatCard
              title="Cameras Online"
              value={`${activeCameras.length}/${cameras?.length || 0}`}
              icon={Camera}
              description="Connected cameras"
              variant="success"
            />
            <StatCard
              title="Today's Detections"
              value={todayAlerts.length}
              icon={Activity}
              description="Incidents detected today"
              variant="warning"
            />
            <StatCard
              title="Response Contacts"
              value={activeContacts.length}
              icon={Users}
              description="Active responders"
              variant="default"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
            <CardDescription>
              Latest accident detections and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div>
                {alerts.slice(0, 5).map((alert) => (
                  <RecentAlertItem key={alert.id} alert={alert} />
                ))}
                {alerts.length > 5 && (
                  <Button variant="ghost" className="w-full mt-2" asChild>
                    <Link href="/alerts">View all {alerts.length} alerts</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-success mb-3" />
                <p className="text-sm font-medium">No Active Alerts</p>
                <p className="text-xs text-muted-foreground">
                  All systems are running smoothly
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              System Performance
            </CardTitle>
            <CardDescription>
              Detection accuracy and response metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm">Detection Accuracy</span>
                </div>
                <span className="text-sm font-medium">92.8%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[92.8%] bg-success rounded-full" />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm">Alert Delivery Rate</span>
                </div>
                <span className="text-sm font-medium">99.5%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[99.5%] bg-primary rounded-full" />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg Response Time</span>
                </div>
                <span className="text-sm font-medium">0.5s</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>SMS: Active</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Email: Active</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Voice: Active</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>AI: Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
}
