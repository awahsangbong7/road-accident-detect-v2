import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Smartphone,
} from "lucide-react";
import type { Camera as CameraType, Alert } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface RouteOption {
  id: string;
  name: string;
  distance: number;
  duration: string;
  riskLevel: "low" | "medium" | "high";
  incidents: number;
  cameras: number;
  accidents: number;
}

export function SafeRoutePlanner() {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("safety");

  const { data: cameras, isLoading: camerasLoading } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  // Generate mock route options based on selected locations
  const routeOptions = useMemo<RouteOption[]>(() => {
    if (!startLocation || !endLocation) return [];

    // Generate 3 route options with different safety levels
    const baseRoutes: RouteOption[] = [
      {
        id: "route-1",
        name: "Fastest Route (Main Highway)",
        distance: 24.5,
        duration: "32 mins",
        riskLevel: "high",
        incidents: 3,
        cameras: 2,
        accidents: 1,
      },
      {
        id: "route-2",
        name: "Balanced Route (Recommended)",
        distance: 26.8,
        duration: "38 mins",
        riskLevel: "low",
        incidents: 0,
        cameras: 8,
        accidents: 0,
      },
      {
        id: "route-3",
        name: "Scenic Route (Safest)",
        distance: 32.2,
        duration: "44 mins",
        riskLevel: "low",
        incidents: 0,
        cameras: 12,
        accidents: 0,
      },
    ];

    return baseRoutes.sort((a, b) => {
      if (sortBy === "safety") {
        const riskOrder = { low: 0, medium: 1, high: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "duration") {
        const aDuration = parseInt(a.duration);
        const bDuration = parseInt(b.duration);
        return aDuration - bDuration;
      }
      return 0;
    });
  }, [startLocation, endLocation, sortBy]);

  const selectedRouteData = routeOptions.find((r) => r.id === selectedRoute);
  const isLoading = camerasLoading || alertsLoading;

  const getRiskBadgeColor = (risk: string) => {
    if (risk === "high") return "destructive";
    if (risk === "medium") return "secondary";
    return "default";
  };

  const getRiskIndicator = (risk: string) => {
    if (risk === "high") return "⚠️ High Risk";
    if (risk === "medium") return "⚡ Medium Risk";
    return "✓ Low Risk";
  };

  return (
    <div className="space-y-6">
      {/* Route Planning Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>SafeRoute Planning</CardTitle>
              <CardDescription>
                Get the safest routes with real-time accident data and camera coverage
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-location">Start Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="start-location"
                    placeholder="e.g., Yaoundé Center"
                    className="pl-9"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-location">End Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="end-location"
                    placeholder="e.g., Douala Airport"
                    className="pl-9"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={!startLocation || !endLocation}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Find Safe Routes
              </Button>
              <Button variant="ghost" size="icon" title="Get current location">
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Routes Section */}
          {routeOptions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Available Routes</h3>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safety">Safety First</SelectItem>
                    <SelectItem value="distance">Shortest Distance</SelectItem>
                    <SelectItem value="duration">Fastest Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {routeOptions.map((route) => (
                  <Card
                    key={route.id}
                    className={`cursor-pointer transition-all ${
                      selectedRoute === route.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground"
                    }`}
                    onClick={() => setSelectedRoute(route.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{route.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {route.distance} km • {route.duration}
                            </p>
                          </div>
                          <Badge variant={getRiskBadgeColor(route.riskLevel)}>
                            {getRiskIndicator(route.riskLevel)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-xs">{route.incidents} incidents</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-xs">{route.cameras} cameras</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-xs">{route.accidents} accidents</span>
                          </div>
                        </div>

                        {selectedRoute === route.id && (
                          <div className="pt-2 border-t space-y-2">
                            <Button className="w-full">Start Navigation</Button>
                            <Button variant="outline" className="w-full">
                              Share Route
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {routeOptions.length === 0 && (startLocation || endLocation) && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Enter both start and end locations to find safe routes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Details Section */}
      {selectedRouteData && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Safety Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Safety Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">Camera Coverage</span>
                    <span className="text-sm font-bold text-primary">
                      {selectedRouteData.cameras}/12
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(selectedRouteData.cameras / 12) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">Safety Score</span>
                    <span className="text-sm font-bold text-success">
                      {selectedRouteData.riskLevel === "low"
                        ? "92%"
                        : selectedRouteData.riskLevel === "medium"
                          ? "65%"
                          : "38%"}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success transition-all"
                      style={{
                        width:
                          selectedRouteData.riskLevel === "low"
                            ? "92%"
                            : selectedRouteData.riskLevel === "medium"
                              ? "65%"
                              : "38%",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Incidents</p>
                    <p className="font-bold">{selectedRouteData.incidents}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Recent</p>
                    <p className="font-bold">
                      {selectedRouteData.accidents === 0 ? "None" : selectedRouteData.accidents}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Distance</span>
                  </div>
                  <span className="font-bold">{selectedRouteData.distance} km</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Duration</span>
                  </div>
                  <span className="font-bold">{selectedRouteData.duration}</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Avg Speed</span>
                  </div>
                  <span className="font-bold">
                    {Math.round(selectedRouteData.distance / (parseInt(selectedRouteData.duration) / 60))} km/h
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center gap-2 p-2 rounded bg-success/10 text-success text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Preferred route based on safety metrics</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cameras?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Active Cameras</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{alerts?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Active Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {cameras?.filter((c) => c.status === "active").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Online Cameras</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(
                    (cameras?.filter((c) => c.status === "active").length || 0) /
                    (cameras?.length || 1)
                  )
                    .toFixed(0)
                    .toString()}
                  %
                </p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
