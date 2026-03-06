import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  Navigation,
  Siren,
  Radio,
  Users,
  Flame,
  Car,
  Activity,
  Bell,
} from "lucide-react";
import type { Alert, Camera } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function RespondersDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 3000,
  });

  const { data: cameras } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const respondMutation = useMutation({
    mutationFn: (alertId: number) =>
      apiRequest("PATCH", `/api/alerts/${alertId}`, { status: "acknowledged" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Incident acknowledged - all units notified" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (alertId: number) =>
      apiRequest("PATCH", `/api/alerts/${alertId}`, { status: "resolved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Incident resolved" });
    },
  });

  const pendingAlerts = alerts?.filter(a => a.status === "pending") || [];
  const acknowledgedAlerts = alerts?.filter(a => a.status === "acknowledged") || [];
  const resolvedToday = alerts?.filter(a => {
    const today = new Date().toDateString();
    return a.status === "resolved" && new Date(a.respondedAt || a.createdAt).toDateString() === today;
  }) || [];
  const criticalAlerts = alerts?.filter(a => a.severity === "high" && (a.status === "pending" || a.status === "acknowledged")) || [];

  const getCameraName = (cameraId: number | null) => {
    if (!cameraId) return "Unknown Camera";
    return cameras?.find(c => c.id === cameraId)?.name || "Camera " + cameraId;
  };

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const severityColor = (severity: string) => {
    if (severity === "high") return "destructive";
    if (severity === "medium") return "secondary";
    return "outline";
  };

  return (
    <div className="p-6 space-y-6" data-testid="responders-dashboard">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600/10 p-3 rounded-lg">
          <Siren className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Emergency Responders</h1>
          <p className="text-muted-foreground">Unified command center for Police, Fire, and Emergency Services</p>
        </div>
        {pendingAlerts.length > 0 && (
          <Badge variant="destructive" className="ml-auto text-base px-3 py-1 animate-pulse" data-testid="badge-pending-count">
            <Bell className="h-4 w-4 mr-1" />
            {pendingAlerts.length} Active
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="stat-active-incidents">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{pendingAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Requiring immediate response</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-critical">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">High severity incidents</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-in-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{acknowledgedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Units responding</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-resolved">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedToday.length}</div>
            <p className="text-xs text-muted-foreground">Incidents closed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Live Incident Feed
            </CardTitle>
            <CardDescription>All active incidents — visible to Police, Fire, Ambulance, and Hospitals</CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : pendingAlerts.length === 0 && acknowledgedAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">All Clear</p>
                <p className="text-sm">No active incidents at this time</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {[...pendingAlerts, ...acknowledgedAlerts]
                  .sort((a, b) => {
                    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
                    const sA = severityOrder[a.severity] ?? 2;
                    const sB = severityOrder[b.severity] ?? 2;
                    if (sA !== sB) return sA - sB;
                    if (a.status === "pending" && b.status !== "pending") return -1;
                    if (b.status === "pending" && a.status !== "pending") return 1;
                    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
                  })
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-4 space-y-2 transition-colors ${
                        alert.status === "pending" && alert.severity === "high"
                          ? "border-red-500/50 bg-red-500/5"
                          : alert.status === "pending"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-border"
                      }`}
                      data-testid={`incident-${alert.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={severityColor(alert.severity)} data-testid={`severity-${alert.id}`}>
                              {alert.severity?.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.type.replace(/-/g, " ")}</Badge>
                            {alert.status === "pending" && (
                              <Badge variant="destructive" className="animate-pulse" data-testid={`status-${alert.id}`}>NEW</Badge>
                            )}
                            {alert.status === "acknowledged" && (
                              <Badge variant="secondary" data-testid={`status-${alert.id}`}>RESPONDING</Badge>
                            )}
                            {alert.smsSent && <Badge variant="outline" className="text-green-500 border-green-500/30">SMS Sent</Badge>}
                            {alert.callMade && <Badge variant="outline" className="text-blue-500 border-blue-500/30">Called</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{alert.location}</span>
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{getCameraName(alert.cameraId)}</span>
                            <span>{getTimeAgo(alert.detectedAt)}</span>
                            {alert.confidence && (
                              <span>Conf: {(alert.confidence * 100).toFixed(0)}%</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {alert.latitude && alert.longitude && (
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`navigate-${alert.id}`}
                              onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, "_blank")}
                            >
                              <Navigation className="h-3 w-3 mr-1" />
                              Map
                            </Button>
                          )}
                          {alert.status === "pending" && (
                            <Button
                              size="sm"
                              data-testid={`respond-${alert.id}`}
                              onClick={() => respondMutation.mutate(alert.id)}
                              disabled={respondMutation.isPending}
                            >
                              <Radio className="h-3 w-3 mr-1" />
                              Respond
                            </Button>
                          )}
                          {alert.status === "acknowledged" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              data-testid={`resolve-${alert.id}`}
                              onClick={() => resolveMutation.mutate(alert.id)}
                              disabled={resolveMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm">Cameras Online</span>
                </div>
                <span className="text-sm font-bold">{cameras?.filter(c => c.status === "active").length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm">Cameras Offline</span>
                </div>
                <span className="text-sm font-bold">{cameras?.filter(c => c.status === "offline").length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm">AI Detection</span>
                </div>
                <span className="text-sm font-bold text-green-500">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Auto-Call</span>
                </div>
                <span className="text-sm font-bold text-green-500">Enabled</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Emergency operations</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button variant="outline" className="justify-start h-auto py-3" data-testid="action-dispatch" onClick={() => toast({ title: "Connecting to central dispatch..." })}>
                <Radio className="h-5 w-5 mr-3 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium">Contact Dispatch</p>
                  <p className="text-xs text-muted-foreground">Central command coordination</p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" data-testid="action-all-units" onClick={() => toast({ title: "Broadcasting to all units..." })}>
                <Users className="h-5 w-5 mr-3 text-amber-500" />
                <div className="text-left">
                  <p className="font-medium">Alert All Units</p>
                  <p className="text-xs text-muted-foreground">Broadcast to police, fire, and ambulance</p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" data-testid="action-backup" onClick={() => toast({ title: "Backup request sent to nearby units" })}>
                <Shield className="h-5 w-5 mr-3 text-indigo-500" />
                <div className="text-left">
                  <p className="font-medium">Request Backup</p>
                  <p className="text-xs text-muted-foreground">Call for additional units</p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3" data-testid="action-traffic" onClick={() => toast({ title: "Traffic control panel opening..." })}>
                <Car className="h-5 w-5 mr-3 text-green-500" />
                <div className="text-left">
                  <p className="font-medium">Traffic Control</p>
                  <p className="text-xs text-muted-foreground">Road closures and diversions</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
