import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  Download,
  Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Alert, Camera } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: cameras } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const totalAlerts = alerts?.length || 0;
  const resolvedAlerts = alerts?.filter((a) => a.status === "resolved").length || 0;
  const falseAlarms = alerts?.filter((a) => a.status === "false_alarm").length || 0;
  const avgConfidence =
    alerts && alerts.length > 0
      ? alerts.reduce((sum, a) => sum + a.confidence, 0) / alerts.length
      : 0;

  const alertsByType = alerts?.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const alertsBySeverity = alerts?.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const alertsByCamera = alerts?.reduce((acc, alert) => {
    if (alert.cameraId) {
      const camera = cameras?.find((c) => c.id === alert.cameraId);
      const key = camera?.name || `Camera ${alert.cameraId}`;
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const maxAlertsByCamera = Math.max(...Object.values(alertsByCamera), 1);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Detection performance and accident statistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]" data-testid="select-time-range">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-analytics">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  Accidents detected
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {resolvedAlerts} resolved incidents
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {Math.round(avgConfidence * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Detection accuracy
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Alarms</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{falseAlarms}</div>
                <p className="text-xs text-muted-foreground">
                  {totalAlerts > 0 ? Math.round((falseAlarms / totalAlerts) * 100) : 0}% of total
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detections by Type
            </CardTitle>
            <CardDescription>
              Breakdown of accident types detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : Object.keys(alertsByType).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(alertsByType).map(([type, count]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${(count / totalAlerts) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Severity Distribution
            </CardTitle>
            <CardDescription>
              Incidents categorized by severity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : Object.keys(alertsBySeverity).length > 0 ? (
              <div className="space-y-4">
                {["high", "medium", "low"].map((severity) => {
                  const count = alertsBySeverity[severity] || 0;
                  const colors = {
                    high: "bg-emergency",
                    medium: "bg-warning",
                    low: "bg-success",
                  };
                  return (
                    <div key={severity} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${colors[severity as keyof typeof colors]}`} />
                          <span className="capitalize">{severity}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${colors[severity as keyof typeof colors]}`}
                          style={{
                            width: `${totalAlerts > 0 ? (count / totalAlerts) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detections by Camera</CardTitle>
          <CardDescription>
            Which cameras have detected the most incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          ) : Object.keys(alertsByCamera).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(alertsByCamera)
                .sort(([, a], [, b]) => b - a)
                .map(([camera, count]) => (
                  <div key={camera} className="flex items-center gap-4">
                    <div className="w-32 truncate text-sm font-medium">{camera}</div>
                    <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${(count / maxAlertsByCamera) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm font-medium">{count}</div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No camera data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Performance Metrics</CardTitle>
          <CardDescription>
            Detection accuracy and response time statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Precision</p>
              <p className="text-3xl font-bold">92.8%</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[92.8%] bg-success rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recall</p>
              <p className="text-3xl font-bold">89.6%</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[89.6%] bg-primary rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">F1 Score</p>
              <p className="text-3xl font-bold">91.2%</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[91.2%] bg-warning rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Alert Time</p>
              <p className="text-3xl font-bold">0.5s</p>
              <Badge variant="outline" className="text-success border-success/30">
                Excellent
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
