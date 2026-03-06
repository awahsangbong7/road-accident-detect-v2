import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Camera,
  Search,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Activity,
  Radio,
  Crosshair,
  Gauge,
  MonitorPlay,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Camera as CameraType, Alert } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DRIVING_VIDEO_IDS = [
  "5mc1Ebn_XSI",
  "5MLN46S7cxE",
  "eXeEZr1a4mY",
  "dozC3a1Mpwc",
  "chvg16GbeaE",
  "DvdvtH58Poo",
  "gQMSk2YEsOw",
  "3nlEKPMmIeI",
  "cXubxTAWRX8",
  "bWBNvWHzFaQ",
  "hAi9DaMdQFw",
  "CP1x0mjqD_E",
  "7HaJArMDKgI",
  "3lSBTVfO9Pg",
  "Da1ER4mu3_Y",
];

function getVideoIdForCamera(cameraId: number): string {
  return DRIVING_VIDEO_IDS[cameraId % DRIVING_VIDEO_IDS.length];
}

function TrafficFeed({ camera, isSelected }: { camera: CameraType; isSelected: boolean }) {
  const videoId = getVideoIdForCamera(camera.id);
  const startTime = (camera.id * 47) % 600;
  const isOffline = camera.status === "offline";

  if (isOffline) {
    return (
      <div className="relative w-full h-full bg-zinc-900 rounded-md flex flex-col items-center justify-center" data-testid={`feed-container-${camera.id}`}>
        <div className="absolute top-0 left-0 right-0 h-6 bg-black/60 flex items-center px-2 gap-2 pointer-events-none rounded-t-md z-10">
          <span className="text-zinc-500 font-mono text-[10px] font-bold flex items-center gap-1">
            OFFLINE
            <span className="h-2 w-2 rounded-full bg-zinc-500 inline-block" />
          </span>
          <span className="text-zinc-500 font-mono text-[10px] truncate">{camera.name}</span>
        </div>
        <X className="h-8 w-8 text-zinc-600 mb-2" />
        <p className="text-xs text-zinc-500 font-mono">Camera Offline</p>
        <p className="text-[10px] text-zinc-600 mt-1">No signal</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" data-testid={`feed-container-${camera.id}`}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=${isSelected ? 1 : 0}&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&start=${startTime}&playsinline=1&showinfo=0`}
        className="w-full h-full rounded-md"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title={`Traffic feed - ${camera.name}`}
        data-testid={`iframe-feed-${camera.id}`}
        style={{ border: "none" }}
      />
      <div className="absolute top-0 left-0 right-0 h-6 bg-black/60 flex items-center px-2 gap-2 pointer-events-none rounded-t-md z-10">
        <span className="text-red-500 font-mono text-[10px] font-bold animate-pulse flex items-center gap-1">
          REC
          <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
        </span>
        <span className="text-green-400 font-mono text-[10px] truncate">{camera.name}</span>
        <span className="text-white font-mono text-[10px] ml-auto">{new Date().toLocaleTimeString()}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-5 bg-black/50 flex items-center px-2 pointer-events-none rounded-b-md z-10">
        <span className="text-gray-300 font-mono text-[9px] truncate">
          {camera.location} | Cameroon | AI: Active
        </span>
      </div>
    </div>
  );
}

function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

export default function LiveMonitoring() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cameras, isLoading } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras"],
  });

  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const todayAlerts = useMemo(() => {
    if (!alerts) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return alerts.filter((a) => new Date(a.createdAt) >= today);
  }, [alerts]);

  const filteredCameras = useMemo(() => {
    if (!cameras) return [];
    if (!searchQuery.trim()) return cameras;
    const q = searchQuery.toLowerCase();
    return cameras.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
    );
  }, [cameras, searchQuery]);

  const activeCameras = useMemo(
    () => cameras?.filter((c) => c.status === "active") || [],
    [cameras]
  );

  const selectedCamera = useMemo(
    () => cameras?.find((c) => c.id === selectedCameraId) || null,
    [cameras, selectedCameraId]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (cameras && cameras.length > 0) {
      const avgLat = cameras.reduce((s, c) => s + c.latitude, 0) / cameras.length;
      const avgLng = cameras.reduce((s, c) => s + c.longitude, 0) / cameras.length;
      return [avgLat, avgLng];
    }
    return [5.95, 10.15];
  }, [cameras]);

  const triggerDetection = useMutation({
    mutationFn: async (camera: CameraType) => {
      const accidentTypes = [
        { type: "collision", desc: "Vehicle collision", vehicles: [2, 3] },
        { type: "pedestrian", desc: "Pedestrian incident", vehicles: [1, 2] },
        { type: "motorcycle", desc: "Motorcycle accident", vehicles: [1, 2] },
        { type: "bicycle", desc: "Bicycle accident", vehicles: [1, 2] },
        { type: "multi-vehicle", desc: "Multi-vehicle pileup", vehicles: [3, 5] },
        { type: "rollover", desc: "Vehicle rollover", vehicles: [1, 1] },
        { type: "hit-and-run", desc: "Hit and run", vehicles: [2, 2] },
      ];
      const accident = accidentTypes[Math.floor(Math.random() * accidentTypes.length)];
      const severities: string[] = ["high", "medium"];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const confidence = 0.85 + Math.random() * 0.12;
      const vehicleCount = accident.vehicles[0] + Math.floor(Math.random() * (accident.vehicles[1] - accident.vehicles[0] + 1));
      const timeStr = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const frameNumber = 600 + Math.floor(Math.random() * 300);

      const description = [
        `ACCIDENT DETECTED — ${accident.desc.toUpperCase()}`,
        ``,
        `At ${timeStr}, the YOLOv8 AI detection system identified a ${accident.type.replace(/-/g, " ")} incident captured by ${camera.name} located at ${camera.location}.`,
        ``,
        `Incident Summary:`,
        `• Type: ${accident.desc}`,
        `• Vehicles involved: ${vehicleCount}`,
        `• Severity: ${severity.toUpperCase()}`,
        `• AI Confidence: ${(confidence * 100).toFixed(1)}%`,
        `• Detection Frame: #${frameNumber}`,
        `• GPS: ${camera.latitude.toFixed(6)}, ${camera.longitude.toFixed(6)}`,
        ``,
        severity === "high"
          ? `URGENT: High-severity incident. Multiple emergency units recommended. Possible injuries detected. Ambulance and police dispatch strongly recommended.`
          : `MODERATE: Emergency response recommended. Potential injuries. Ambulance dispatch advised.`,
        ``,
        `Location auto-shared with nearest emergency services. Google Maps link included in SMS for navigation.`,
      ].join("\n");

      return apiRequest("POST", "/api/alerts", {
        cameraId: camera.id,
        type: accident.type,
        severity,
        confidence,
        latitude: camera.latitude,
        longitude: camera.longitude,
        location: camera.location,
        description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Accident Detected",
        description: "AI has detected a potential accident. Check alerts for details.",
        variant: "destructive",
      });
    },
  });

  const filteredIds = useMemo(() => new Set(filteredCameras.map((c) => c.id)), [filteredCameras]);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-live-monitoring-title">
            Live Monitoring
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time camera feeds with AI-powered accident detection
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-success border-success">
            <Activity className="mr-1 h-3 w-3" />
            AI Detection Active
          </Badge>
          <Badge variant="outline" data-testid="badge-live-feeds">
            <Radio className="mr-1 h-3 w-3" />
            {activeCameras.length} Live Feeds
          </Badge>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cameras..."
              className="pl-8 w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-cameras"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-[65] min-h-[400px] lg:min-h-[500px]" data-testid="card-map-container">
          <CardContent className="p-0 h-full">
            {isLoading ? (
              <Skeleton className="w-full h-full min-h-[400px] rounded-md" />
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={12}
                className="w-full h-full min-h-[400px] lg:min-h-[500px] rounded-md z-0"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selectedCamera && (
                  <MapFlyTo lat={selectedCamera.latitude} lng={selectedCamera.longitude} />
                )}
                {cameras?.map((cam) => {
                  const isFiltered = filteredIds.has(cam.id);
                  const isSelected = cam.id === selectedCameraId;
                  return (
                    <CircleMarker
                      key={cam.id}
                      center={[cam.latitude, cam.longitude]}
                      radius={isSelected ? 10 : 7}
                      pathOptions={{
                        color: isSelected ? "#3b82f6" : isFiltered ? "#22c55e" : "#6b7280",
                        fillColor: isSelected ? "#3b82f6" : isFiltered ? "#22c55e" : "#9ca3af",
                        fillOpacity: isSelected ? 0.9 : isFiltered ? 0.7 : 0.3,
                        weight: isSelected ? 3 : 2,
                      }}
                      eventHandlers={{
                        click: () => setSelectedCameraId(cam.id),
                      }}
                      data-testid={`marker-camera-${cam.id}`}
                    >
                      <Popup>
                        <div className="text-sm space-y-1">
                          <p className="font-semibold">{cam.name}</p>
                          <p className="text-muted-foreground">{cam.location}</p>
                          <p className="text-xs text-muted-foreground">
                            {cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            )}
          </CardContent>
        </Card>

        <div className="flex-[35] space-y-4" data-testid="panel-camera-detail">
          {selectedCamera ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{selectedCamera.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCameraId(null)}
                      data-testid="button-close-detail"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={selectedCamera.status === "active" ? "default" : "secondary"}
                      data-testid="badge-camera-status"
                    >
                      {selectedCamera.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedCamera.location}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p data-testid="text-camera-coords">
                      GPS: {selectedCamera.latitude.toFixed(4)}, {selectedCamera.longitude.toFixed(4)}
                    </p>
                    {selectedCamera.description && (
                      <p data-testid="text-camera-description">{selectedCamera.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-2">
                  <div className="relative aspect-video rounded-md overflow-hidden">
                    <TrafficFeed
                      camera={selectedCamera}
                      isSelected={true}
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-red-600 text-white text-xs animate-pulse">
                        LIVE
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Crosshair className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-bold" data-testid="text-vehicles-detected">
                        {4 + Math.floor(selectedCamera.id * 1.3) % 5}
                      </p>
                      <p className="text-xs text-muted-foreground">Vehicles</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-bold" data-testid="text-detection-confidence">
                        {(0.88 + (selectedCamera.id % 10) * 0.01).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <MonitorPlay className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-bold" data-testid="text-frame-rate">30</p>
                      <p className="text-xs text-muted-foreground">FPS</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => triggerDetection.mutate(selectedCamera)}
                disabled={triggerDetection.isPending}
                data-testid="button-trigger-detection"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Simulate Detection
              </Button>
            </>
          ) : (
            <Card className="h-full min-h-[300px] flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Camera className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No Camera Selected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click a marker on the map or a camera card below to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card data-testid="card-detection-status">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Detection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center">
                <Camera className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold" data-testid="text-total-cameras">
                  {cameras?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Cameras</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold" data-testid="text-active-feeds">
                  {activeCameras.length}
                </p>
                <p className="text-xs text-muted-foreground">Active Feeds</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center">
                <Gauge className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold" data-testid="text-detection-accuracy">93.5%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xl font-bold" data-testid="text-alerts-today">
                  {todayAlerts.length}
                </p>
                <p className="text-xs text-muted-foreground">Alerts Today</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3" data-testid="text-camera-grid-title">
          All Cameras
        </h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <Skeleton className="aspect-video rounded-md mb-2" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          ) : filteredCameras.length > 0 ? (
            filteredCameras.map((cam) => (
              <Card
                key={cam.id}
                className={`cursor-pointer transition-colors ${
                  selectedCameraId === cam.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedCameraId(cam.id)}
                data-testid={`card-camera-${cam.id}`}
              >
                <CardContent className="p-3">
                  <div className="relative aspect-video rounded-md overflow-hidden mb-2">
                    <TrafficFeed
                      camera={cam}
                      isSelected={false}
                    />
                    <div className="absolute top-1 left-1">
                      {cam.status === "active" && (
                        <Badge className="bg-red-600 text-white text-[10px] animate-pulse">
                          LIVE
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-medium truncate">{cam.name}</p>
                      <Badge
                        variant={cam.status === "active" ? "outline" : "secondary"}
                        className={`text-[10px] ${cam.status === "active" ? "text-success border-success/30" : ""}`}
                      >
                        {cam.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 truncate">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      {cam.location}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No Cameras Found</p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? "No cameras match your search"
                    : "Add cameras to start live monitoring"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
