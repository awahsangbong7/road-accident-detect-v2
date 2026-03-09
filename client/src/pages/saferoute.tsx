import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Navigation,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Shield,
  TrendingUp,
  Download,
  Share2,
  Phone,
} from "lucide-react";
import { SafeRoutePlanner } from "@/components/saferoute-planner";
import type { Alert } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function SafeRoute() {
  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 5000,
  });

  const recentAlerts = (alerts || [])
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
    .slice(0, 5);

  const highRiskAlerts = alerts?.filter((a) => a.severity === "high" && a.status === "pending") || [];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Navigation className="h-8 w-8 text-primary" />
            SafeRoute Planning
          </h1>
          <p className="text-muted-foreground mt-1">
            Find the safest routes with real-time incident data and camera coverage analysis
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Routes
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Areas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{highRiskAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Areas to avoid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{alerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Current incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safe Routes Found</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">3+</div>
            <p className="text-xs text-muted-foreground">Per destination</p>
          </CardContent>
        </Card>
      </div>

      {/* Main SafeRoute Planner */}
      <SafeRoutePlanner />

      {/* Recent Incidents on Routes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <CardTitle>Recent Incidents</CardTitle>
                <CardDescription>Latest accidents and traffic incidents detected</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-success opacity-50" />
              <p>No recent incidents reported</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={alert.severity === "high" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {alert.severity?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{alert.location}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {alert.description?.split("\n")[0] || "No description available"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alert.latitude?.toFixed(4)}, {alert.longitude?.toFixed(4)}
                    </span>
                    <span>
                      {new Date(alert.detectedAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              AI-Powered Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Real-time CCTV analysis with YOLOv8 detection for accident prevention
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-success/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Coverage Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Route monitoring with 24/7 camera coverage and incident alerts
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" />
              Emergency Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Direct SMS alerts to emergency services at incident detection
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
