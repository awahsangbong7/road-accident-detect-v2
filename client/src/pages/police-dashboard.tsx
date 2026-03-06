import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle,
  Navigation,
  Bell,
  FileText,
  Search,
} from "lucide-react";
import type { Alert, Camera } from "@shared/schema";

type DateRange = "today" | "7days" | "30days" | "all";

export default function PoliceDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("today");

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 3000,
  });

  const { data: cameras } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const filterByDate = (items: Alert[]) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case "today":
        return items.filter(a => new Date(a.detectedAt) >= startOfToday);
      case "7days": {
        const sevenDaysAgo = new Date(startOfToday);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return items.filter(a => new Date(a.detectedAt) >= sevenDaysAgo);
      }
      case "30days": {
        const thirtyDaysAgo = new Date(startOfToday);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return items.filter(a => new Date(a.detectedAt) >= thirtyDaysAgo);
      }
      case "all":
        return items;
      default:
        return items;
    }
  };

  const allAlerts = alerts || [];
  const filteredAlerts = filterByDate(allAlerts);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const todaysAccidents = allAlerts.filter(a => new Date(a.detectedAt) >= startOfToday);
  const thisWeekAccidents = allAlerts.filter(a => new Date(a.detectedAt) >= startOfWeek);
  const pendingInvestigation = allAlerts.filter(a => a.status === "pending" || a.status === "acknowledged");
  const resolvedCases = allAlerts.filter(a => a.status === "resolved");

  const pendingAlerts = filteredAlerts.filter(a => a.status === "pending");

  const getCameraName = (cameraId: number | null) => {
    if (!cameraId) return "Unknown Camera";
    return cameras?.find(c => c.id === cameraId)?.name || "Camera " + cameraId;
  };

  const getTimeAgo = (date: Date | string) => {
    const n = new Date();
    const then = new Date(date);
    const diff = Math.floor((n.getTime() - then.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const severityColor = (severity: string) => {
    if (severity === "high") return "destructive";
    if (severity === "medium") return "secondary";
    return "outline";
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending": return "New";
      case "acknowledged": return "Under Investigation";
      case "resolved": return "Resolved";
      default: return status;
    }
  };

  const statusVariant = (status: string): "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "pending": return "destructive";
      case "acknowledged": return "secondary";
      case "resolved": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="police-dashboard">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-indigo-600/10 p-3 rounded-md">
          <Shield className="h-8 w-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Police Dashboard</h1>
          <p className="text-muted-foreground">Accident monitoring and investigation management</p>
        </div>
        {pendingAlerts.length > 0 && (
          <Badge variant="destructive" className="ml-auto text-base px-3 py-1 animate-pulse" data-testid="badge-pending-count">
            <Bell className="h-4 w-4 mr-1" />
            {pendingAlerts.length} New
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="stat-todays-accidents">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Accidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{todaysAccidents.length}</div>
            <p className="text-xs text-muted-foreground">Detected today</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-weekly-total">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total This Week</CardTitle>
            <Clock className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-500">{thisWeekAccidents.length}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-pending-investigation">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Investigation</CardTitle>
            <Search className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{pendingInvestigation.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-resolved">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedCases.length}</div>
            <p className="text-xs text-muted-foreground">Total resolved</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Accident Reports
                </CardTitle>
                <CardDescription>
                  {dateRange === "today" ? "Today's" : dateRange === "7days" ? "Last 7 days'" : dateRange === "30days" ? "Last 30 days'" : "All"} accidents ({filteredAlerts.length})
                </CardDescription>
              </div>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)} data-testid="filter-date-range">
                <SelectTrigger className="w-[160px]" data-testid="filter-date-range">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">No Accidents Found</p>
                <p className="text-sm">No accidents reported for the selected period</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredAlerts
                  .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className={`border rounded-md p-4 space-y-2 transition-colors ${
                        alert.status === "pending" && alert.severity === "high"
                          ? "border-red-500/50 bg-red-500/5"
                          : alert.status === "pending"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-border"
                      }`}
                      data-testid={`accident-${alert.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={severityColor(alert.severity)} data-testid={`severity-${alert.id}`}>
                              {alert.severity?.toUpperCase()}
                            </Badge>
                            <Badge variant={statusVariant(alert.status)} data-testid={`status-${alert.id}`}>
                              {statusLabel(alert.status)}
                            </Badge>
                            <Badge variant="outline">{alert.type.replace(/-/g, " ")}</Badge>
                            {alert.smsSent && <Badge variant="outline" className="text-green-500 border-green-500/30">SMS Sent</Badge>}
                          </div>

                          {alert.description && (
                            <p className="text-sm mt-2" data-testid={`description-${alert.id}`}>{alert.description}</p>
                          )}

                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{alert.location}</span>
                          </p>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(alert.detectedAt)}
                            </span>
                            <span>{getCameraName(alert.cameraId)}</span>
                            <span>{getTimeAgo(alert.detectedAt)}</span>
                            {alert.confidence && (
                              <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
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
                <Bell className="h-5 w-5 text-indigo-500" />
                Notifications
              </CardTitle>
              <CardDescription>Recent alerts assigned to police</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : pendingAlerts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {pendingAlerts
                    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className="border border-red-500/30 bg-red-500/5 rounded-md p-3 space-y-1"
                        data-testid={`notification-${alert.id}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <Badge variant={severityColor(alert.severity)} className="text-xs">
                            {alert.severity?.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{getTimeAgo(alert.detectedAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{alert.location}</span>
                        </p>
                        {alert.latitude && alert.longitude && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-1"
                            data-testid={`notification-navigate-${alert.id}`}
                            onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, "_blank")}
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            View on Map
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">High Severity</span>
                <span className="text-sm font-bold text-red-500">
                  {filteredAlerts.filter(a => a.severity === "high").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Medium Severity</span>
                <span className="text-sm font-bold text-amber-500">
                  {filteredAlerts.filter(a => a.severity === "medium").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Low Severity</span>
                <span className="text-sm font-bold text-green-500">
                  {filteredAlerts.filter(a => a.severity === "low").length}
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">SMS Notifications</span>
                  <span className="text-sm font-bold">
                    {filteredAlerts.filter(a => a.smsSent).length}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calls Made</span>
                <span className="text-sm font-bold">
                  {filteredAlerts.filter(a => a.callMade).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}