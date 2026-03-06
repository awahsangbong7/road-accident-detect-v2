import { useState, useRef, useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Search,
  Camera,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Camera as CameraType, Alert } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const alertIcon = L.divIcon({
  className: "alert-pulse-marker",
  html: `<div style="width:16px;height:16px;background:hsl(0,84%,60%);border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(220,38,38,0.7);animation:pulse-ring 1.5s ease-out infinite;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const CAMEROON_CENTER: [number, number] = [5.0, 10.5];
const DEFAULT_ZOOM = 7;

const STREET_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SATELLITE_TILE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const SATELLITE_ATTR = '&copy; Esri, Maxar, Earthstar Geographics';

function MapPanner({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 14, { duration: 1 });
    }
  }, [target, map]);
  return null;
}

export default function MapView() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<{
    type: "camera" | "alert";
    id: number;
  } | null>(null);
  const [useSatellite, setUseSatellite] = useState(false);
  const [panTarget, setPanTarget] = useState<[number, number] | null>(null);

  const { data: cameras, isLoading: camerasLoading } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: number) =>
      apiRequest("PATCH", `/api/alerts/${alertId}`, { status: "acknowledged" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Alert acknowledged" });
    },
  });

  const sendAlertMutation = useMutation({
    mutationFn: (alertId: number) =>
      apiRequest("POST", `/api/alerts/${alertId}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Alert sent to emergency services" });
    },
  });

  const isLoading = camerasLoading || alertsLoading;

  const pendingAlerts = alerts?.filter((a) => a.status === "pending") || [];
  const activeCameras = cameras?.filter((c) => c.status === "active") || [];

  const selectedCamera =
    selectedMarker?.type === "camera"
      ? cameras?.find((c) => c.id === selectedMarker.id)
      : null;

  const selectedAlert =
    selectedMarker?.type === "alert"
      ? alerts?.find((a) => a.id === selectedMarker.id)
      : null;

  const filteredCameras = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return (cameras || []).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
    );
  }, [cameras, searchQuery]);

  const handleSearchSelect = (camera: CameraType) => {
    setSelectedMarker({ type: "camera", id: camera.id });
    setPanTarget([camera.latitude, camera.longitude]);
    setSearchQuery("");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredCameras.length > 0) {
      handleSearchSelect(filteredCameras[0]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] p-6 gap-6">
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.6); }
          70% { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
        .leaflet-container { border-radius: var(--radius); z-index: 0; }
      `}</style>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Search cameras by name or location..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              data-testid="input-search-map"
            />
            {searchQuery.trim() && filteredCameras.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-auto">
                <CardContent className="p-1">
                  {filteredCameras.map((cam) => (
                    <button
                      key={cam.id}
                      className="w-full text-left px-3 py-2 rounded-md text-sm hover-elevate flex items-center gap-2"
                      onClick={() => handleSearchSelect(cam)}
                      data-testid={`search-result-camera-${cam.id}`}
                    >
                      <Camera className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium">{cam.name}</span>
                      <span className="text-muted-foreground text-xs truncate">
                        {cam.location}
                      </span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
            {searchQuery.trim() && filteredCameras.length === 0 && (
              <Card className="absolute top-full left-0 right-0 mt-1 z-50">
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground text-center">
                    No cameras found
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <Button
            variant={useSatellite ? "default" : "outline"}
            size="icon"
            onClick={() => setUseSatellite(!useSatellite)}
            data-testid="button-toggle-layer"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 rounded-md overflow-hidden border">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <MapContainer
              center={CAMEROON_CENTER}
              zoom={DEFAULT_ZOOM}
              className="w-full h-full"
              data-testid="map-container"
            >
              <TileLayer
                key={useSatellite ? "satellite" : "street"}
                url={useSatellite ? SATELLITE_TILE : STREET_TILE}
                attribution={useSatellite ? SATELLITE_ATTR : STREET_ATTR}
              />
              <MapPanner target={panTarget} />

              {activeCameras.map((camera) => (
                <CircleMarker
                  key={`camera-${camera.id}`}
                  center={[camera.latitude, camera.longitude]}
                  radius={8}
                  pathOptions={{
                    color: "#16a34a",
                    fillColor:
                      selectedMarker?.type === "camera" &&
                      selectedMarker?.id === camera.id
                        ? "#2563eb"
                        : "#22c55e",
                    fillOpacity: 0.9,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedMarker({ type: "camera", id: camera.id });
                      setPanTarget(null);
                    },
                  }}
                  data-testid={`map-camera-${camera.id}`}
                >
                  <Popup>
                    <div className="text-sm space-y-1 min-w-[160px]">
                      <p className="font-semibold">{camera.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {camera.location}
                      </p>
                      <p className="text-xs">Status: {camera.status}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {pendingAlerts.map((alert) => (
                <Marker
                  key={`alert-${alert.id}`}
                  position={[alert.latitude, alert.longitude]}
                  icon={alertIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedMarker({ type: "alert", id: alert.id });
                      setPanTarget(null);
                    },
                  }}
                  data-testid={`map-alert-${alert.id}`}
                >
                  <Popup>
                    <div className="text-sm space-y-1 min-w-[160px]">
                      <p className="font-semibold capitalize">
                        {alert.type} Detected
                      </p>
                      <p className="text-xs">Severity: {alert.severity}</p>
                      <p className="text-xs">
                        Confidence: {Math.round(alert.confidence * 100)}%
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {alert.location}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Active Camera</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>Active Alert</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted-foreground" />
            <span>Offline Camera</span>
          </div>
          <span className="ml-auto">
            {useSatellite ? "Satellite View" : "Street View"}
          </span>
        </div>
      </div>

      <div className="w-80 shrink-0 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Map Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-bold" data-testid="text-active-cameras-count">
                    {activeCameras.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Cameras</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xl font-bold" data-testid="text-pending-alerts-count">
                    {pendingAlerts.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Alerts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedCamera && (
          <Card className="border-green-500/30" data-testid="card-camera-details">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4 text-green-500" />
                  Camera Details
                </CardTitle>
                <Badge variant="outline" className="text-green-600 border-green-500/30">
                  {selectedCamera.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium" data-testid="text-selected-camera-name">
                  {selectedCamera.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedCamera.location}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>
                  {selectedCamera.latitude.toFixed(4)},{" "}
                  {selectedCamera.longitude.toFixed(4)}
                </span>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => setLocation("/live")}
                data-testid="button-view-live-feed"
              >
                View Live Feed
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedAlert && (
          <Card className="border-red-500/30" data-testid="card-alert-details">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Alert Details
                </CardTitle>
                <Badge className="bg-red-500 text-white">
                  {selectedAlert.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium capitalize" data-testid="text-selected-alert-type">
                  {selectedAlert.type} Detected
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedAlert.location}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>
                  {selectedAlert.latitude.toFixed(4)},{" "}
                  {selectedAlert.longitude.toFixed(4)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Confidence: {Math.round(selectedAlert.confidence * 100)}%
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => acknowledgeMutation.mutate(selectedAlert.id)}
                  disabled={acknowledgeMutation.isPending}
                  data-testid="button-acknowledge-alert"
                >
                  Acknowledge
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-red-500 border-red-600 text-white"
                  onClick={() => sendAlertMutation.mutate(selectedAlert.id)}
                  disabled={sendAlertMutation.isPending}
                  data-testid="button-send-alert"
                >
                  Send Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="flex-1 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {alerts?.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2 transition-colors"
                    onClick={() => {
                      setSelectedMarker({ type: "alert", id: alert.id });
                      setPanTarget([alert.latitude, alert.longitude]);
                    }}
                    data-testid={`activity-alert-${alert.id}`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                        alert.status === "pending"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate capitalize">
                        {alert.type} - {alert.location}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!alerts || alerts.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
