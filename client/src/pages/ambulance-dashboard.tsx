import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle,
  Navigation,
  Activity,
  Bell,
  Truck,
  UserCheck,
  Hospital,
  ArrowRight,
} from "lucide-react";
import type { Alert, Camera } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AmbulanceDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 3000,
  });

  const { data: cameras } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const enRouteMutation = useMutation({
    mutationFn: (alertId: number) =>
      apiRequest("PATCH", `/api/alerts/${alertId}`, { status: "acknowledged" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Status updated", description: "You are now en route to the scene" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const pickedUpMutation = useMutation({
    mutationFn: (alertId: number) =>
      apiRequest("PATCH", `/api/alerts/${alertId}`, { status: "acknowledged" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Patient picked up", description: "Heading to hospital" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const droppedMutation = useMutation({
    mutationFn: (alertId: number) =>
      apiRequest("PATCH", `/api/alerts/${alertId}`, { status: "resolved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Trip completed", description: "Patient dropped at hospital" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const pendingAlerts = alerts?.filter(a => a.status === "pending") || [];
  const acknowledgedAlerts = alerts?.filter(a => a.status === "acknowledged") || [];
  const resolvedAlerts = alerts?.filter(a => a.status === "resolved") || [];

  const resolvedToday = resolvedAlerts.filter(a => {
    const today = new Date().toDateString();
    return new Date(a.respondedAt || a.createdAt).toDateString() === today;
  });

  const currentAssignment = pendingAlerts.length > 0 ? pendingAlerts[0] : acknowledgedAlerts.length > 0 ? acknowledgedAlerts[0] : null;

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
    <div className="p-6 space-y-6" data-testid="ambulance-dashboard">
      <div className="flex items-center gap-3">
        <div className="bg-red-600/10 p-3 rounded-md">
          <Truck className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Ambulance Dashboard</h1>
          <p className="text-muted-foreground">Emergency medical response and patient transport</p>
        </div>
        {pendingAlerts.length > 0 && (
          <Badge variant="destructive" className="ml-auto text-base px-3 py-1 animate-pulse" data-testid="badge-pending-count">
            <Bell className="h-4 w-4 mr-1" />
            {pendingAlerts.length} New
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="stat-active-assignments">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{pendingAlerts.length + acknowledgedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Pending and in-progress</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-patients-picked-up">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Picked Up Today</CardTitle>
            <UserCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{resolvedToday.length}</div>
            <p className="text-xs text-muted-foreground">Transported today</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-completed-trips">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Trips</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Total resolved</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              Current Assignment
            </CardTitle>
            <CardDescription>Your active emergency call</CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32" />
              </div>
            ) : !currentAssignment ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">No Active Assignment</p>
                <p className="text-sm">Waiting for new emergency calls</p>
              </div>
            ) : (
              <div
                className={`border rounded-md p-5 space-y-4 ${
                  currentAssignment.severity === "high"
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-amber-500/30 bg-amber-500/5"
                }`}
                data-testid={`assignment-${currentAssignment.id}`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={severityColor(currentAssignment.severity)} data-testid="badge-severity">
                      {currentAssignment.severity?.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{currentAssignment.type.replace(/-/g, " ")}</Badge>
                    {currentAssignment.status === "pending" && (
                      <Badge variant="destructive" className="animate-pulse" data-testid="badge-status">NEW</Badge>
                    )}
                    {currentAssignment.status === "acknowledged" && (
                      <Badge variant="secondary" data-testid="badge-status">EN ROUTE</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(currentAssignment.detectedAt)}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span data-testid="text-location">{currentAssignment.location}</span>
                  </p>
                  {currentAssignment.description && (
                    <p className="text-sm text-muted-foreground" data-testid="text-description">{currentAssignment.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Source: {getCameraName(currentAssignment.cameraId)}
                    {currentAssignment.confidence && (
                      <span className="ml-2">Confidence: {(currentAssignment.confidence * 100).toFixed(0)}%</span>
                    )}
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap pt-2">
                  {currentAssignment.latitude && currentAssignment.longitude && (
                    <Button
                      data-testid="button-navigate"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentAssignment.latitude},${currentAssignment.longitude}`, '_blank')}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Navigate
                    </Button>
                  )}

                  {currentAssignment.status === "pending" && (
                    <Button
                      variant="secondary"
                      data-testid="button-en-route"
                      onClick={() => enRouteMutation.mutate(currentAssignment.id)}
                      disabled={enRouteMutation.isPending}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      En Route
                    </Button>
                  )}

                  {currentAssignment.status === "acknowledged" && (
                    <>
                      <Button
                        variant="secondary"
                        data-testid="button-picked-up"
                        onClick={() => pickedUpMutation.mutate(currentAssignment.id)}
                        disabled={pickedUpMutation.isPending}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Picked Up Patient
                      </Button>
                      <Button
                        variant="outline"
                        data-testid="button-dropped"
                        onClick={() => droppedMutation.mutate(currentAssignment.id)}
                        disabled={droppedMutation.isPending}
                      >
                        <Hospital className="h-4 w-4 mr-2" />
                        Dropped at Hospital
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500" />
              Pending Alerts
            </CardTitle>
            <CardDescription>Unacknowledged emergency calls</CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : pendingAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending alerts</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {pendingAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="border rounded-md p-3 space-y-1 border-red-500/30 bg-red-500/5"
                    data-testid={`pending-alert-${alert.id}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={severityColor(alert.severity)}>
                        {alert.severity?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{getTimeAgo(alert.detectedAt)}</span>
                    </div>
                    <p className="text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{alert.location}</span>
                    </p>
                    <Button
                      size="sm"
                      data-testid={`respond-${alert.id}`}
                      onClick={() => enRouteMutation.mutate(alert.id)}
                      disabled={enRouteMutation.isPending}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Respond
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Previous Assignments
          </CardTitle>
          <CardDescription>Acknowledged and resolved incidents</CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : [...acknowledgedAlerts, ...resolvedAlerts].length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No previous assignments</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {[...acknowledgedAlerts, ...resolvedAlerts]
                .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
                .map(alert => (
                  <div
                    key={alert.id}
                    className="border rounded-md p-3 flex items-center justify-between gap-3 flex-wrap"
                    data-testid={`previous-assignment-${alert.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={severityColor(alert.severity)}>
                          {alert.severity?.toUpperCase()}
                        </Badge>
                        {alert.status === "acknowledged" && (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                        {alert.status === "resolved" && (
                          <Badge variant="outline" className="text-green-600 border-green-500/30">Resolved</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{getTimeAgo(alert.detectedAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{alert.location}</span>
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {alert.latitude && alert.longitude && (
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`map-${alert.id}`}
                          onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, "_blank")}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Map
                        </Button>
                      )}
                      {alert.status === "acknowledged" && (
                        <Button
                          size="sm"
                          data-testid={`resolve-${alert.id}`}
                          onClick={() => droppedMutation.mutate(alert.id)}
                          disabled={droppedMutation.isPending}
                        >
                          <Hospital className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}