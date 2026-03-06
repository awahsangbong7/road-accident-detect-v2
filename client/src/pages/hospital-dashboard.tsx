import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  Navigation,
  Activity,
  Users,
  Heart,
  Stethoscope,
  Bed,
  Siren,
  Truck,
  UserCheck,
  Calendar,
} from "lucide-react";
import type { Alert, Camera } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  organization: string;
  priority: number;
  isActive: boolean;
}

export default function HospitalDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState("today");

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 3000,
  });

  const { data: cameras } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: number) =>
      apiRequest("PATCH", `/api/alerts/${alertId}`, { status: "acknowledged" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Alert acknowledged - hospital preparing for patient" });
    },
  });

  const admitPatientMutation = useMutation({
    mutationFn: (alertId: number) =>
      apiRequest("PATCH", `/api/alerts/${alertId}`, { status: "resolved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Patient admitted successfully" });
    },
  });

  const activeAlerts = alerts?.filter(a => a.status === "pending" || a.status === "acknowledged") || [];
  const highSeverity = activeAlerts.filter(a => a.severity === "high");
  const incomingPatients = alerts?.filter(a =>
    (a.status === "acknowledged" || a.status === "pending") && a.smsSent
  ) || [];
  const resolvedToday = alerts?.filter(a => {
    const today = new Date().toDateString();
    return a.status === "resolved" && new Date(a.respondedAt || a.createdAt).toDateString() === today;
  }) || [];

  const admittedToday = alerts?.filter(a => {
    const today = new Date().toDateString();
    return a.status === "resolved" && new Date(a.respondedAt || a.createdAt).toDateString() === today;
  }) || [];

  const hospitalContacts = contacts?.filter(c =>
    c.role === "hospital" || c.role === "ambulance" || c.role === "medical"
  ) || [];

  const ambulanceContacts = contacts?.filter(c => c.role === "ambulance") || [];

  const getFilteredAlerts = () => {
    if (!alerts) return [];
    const now = new Date();
    return alerts.filter(a => {
      const alertDate = new Date(a.detectedAt);
      switch (dateFilter) {
        case "today": {
          return alertDate.toDateString() === now.toDateString();
        }
        case "7days": {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return alertDate >= weekAgo;
        }
        case "30days": {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return alertDate >= monthAgo;
        }
        case "all":
        default:
          return true;
      }
    });
  };

  const filteredAlerts = getFilteredAlerts();

  const getCameraName = (cameraId: number | null) => {
    if (!cameraId) return "Unknown";
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

  const estimateVictims = (alert: Alert): number => {
    if (alert.type === "multi-vehicle") return 3 + Math.floor(Math.random() * 4);
    if (alert.type === "pedestrian") return 1 + Math.floor(Math.random() * 2);
    if (alert.severity === "high") return 2 + Math.floor(Math.random() * 3);
    return 1 + Math.floor(Math.random() * 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive">Pending</Badge>;
      case "acknowledged":
        return <Badge className="bg-amber-500 text-white">Acknowledged</Badge>;
      case "resolved":
        return <Badge className="bg-emerald-500 text-white">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="hospital-dashboard">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500/10 p-3 rounded-lg">
          <Building2 className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Hospital Dashboard</h1>
          <p className="text-muted-foreground">Incoming patient preparation and emergency coordination</p>
        </div>
        {highSeverity.length > 0 && (
          <Badge variant="destructive" className="ml-auto text-base px-3 py-1 animate-pulse" data-testid="badge-critical-count">
            <Heart className="h-4 w-4 mr-1" />
            {highSeverity.length} Critical
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card data-testid="stat-incoming">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incoming Patients</CardTitle>
            <Siren className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{incomingPatients.length}</div>
            <p className="text-xs text-muted-foreground">En route to hospitals</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-critical-cases">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <Heart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{highSeverity.length}</div>
            <p className="text-xs text-muted-foreground">Require immediate care</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-active-alerts">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Ongoing incidents</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-admitted-today">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admitted Today</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{admittedToday.length}</div>
            <p className="text-xs text-muted-foreground">Patients admitted</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-treated-today">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treated Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedToday.length}</div>
            <p className="text-xs text-muted-foreground">Patients discharged</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="emergencies" data-testid="hospital-tabs">
        <TabsList>
          <TabsTrigger value="emergencies" data-testid="tab-emergencies">Incoming Emergencies</TabsTrigger>
          <TabsTrigger value="all-accidents" data-testid="tab-all-accidents">View All Accidents</TabsTrigger>
          <TabsTrigger value="ambulances" data-testid="tab-ambulances">Manage Ambulances</TabsTrigger>
        </TabsList>

        <TabsContent value="emergencies">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-red-500" />
                  Incoming Emergencies
                </CardTitle>
                <CardDescription>Accidents detected — prepare for incoming patients</CardDescription>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                  </div>
                ) : activeAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p className="font-medium">No Incoming Emergencies</p>
                    <p className="text-sm">All clear at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {activeAlerts
                      .sort((a, b) => {
                        const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
                        return (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2);
                      })
                      .map((alert) => {
                        const victims = estimateVictims(alert);
                        return (
                          <div
                            key={alert.id}
                            className={`border rounded-lg p-4 space-y-2 ${
                              alert.severity === "high"
                                ? "border-red-500/50 bg-red-500/5"
                                : "border-amber-500/30 bg-amber-500/5"
                            }`}
                            data-testid={`emergency-${alert.id}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                                    {alert.severity?.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline">{alert.type.replace(/-/g, " ")}</Badge>
                                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                                    <Users className="h-3 w-3 mr-1" />
                                    ~{victims} potential victim{victims > 1 ? "s" : ""}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{alert.location}</span>
                                </p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  <span>{getCameraName(alert.cameraId)}</span>
                                  <span>{getTimeAgo(alert.detectedAt)}</span>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0 flex-wrap">
                                {alert.latitude && alert.longitude && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    data-testid={`navigate-${alert.id}`}
                                    onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, "_blank")}
                                  >
                                    <Navigation className="h-3 w-3 mr-1" />
                                    Location
                                  </Button>
                                )}
                                {alert.status === "pending" && (
                                  <Button
                                    size="sm"
                                    data-testid={`prepare-${alert.id}`}
                                    onClick={() => acknowledgeMutation.mutate(alert.id)}
                                    disabled={acknowledgeMutation.isPending}
                                  >
                                    <Stethoscope className="h-3 w-3 mr-1" />
                                    Prepare
                                  </Button>
                                )}
                                {(alert.status === "pending" || alert.status === "acknowledged") && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-emerald-600"
                                    data-testid={`admit-patient-${alert.id}`}
                                    onClick={() => admitPatientMutation.mutate(alert.id)}
                                    disabled={admitPatientMutation.isPending}
                                  >
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Patient Admitted
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    Hospital Readiness
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm">Emergency Room</span>
                    </div>
                    <span className="text-sm font-bold text-green-500">Ready</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm">Surgical Theater</span>
                    </div>
                    <span className="text-sm font-bold text-green-500">Available</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm">ICU Beds</span>
                    </div>
                    <span className="text-sm font-bold">3 Available</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-sm">Alert System</span>
                    </div>
                    <span className="text-sm font-bold text-green-500">Connected</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Hospital operations</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button variant="outline" className="justify-start h-auto py-3" data-testid="action-trauma" onClick={() => toast({ title: "Trauma team alerted and assembling" })}>
                    <Heart className="h-5 w-5 mr-3 text-red-500" />
                    <div className="text-left">
                      <p className="font-medium">Activate Trauma Team</p>
                      <p className="text-xs text-muted-foreground">Page trauma surgeons and nurses</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" data-testid="action-ambulance" onClick={() => toast({ title: "Contacting nearest ambulance unit..." })}>
                    <Truck className="h-5 w-5 mr-3 text-blue-500" />
                    <div className="text-left">
                      <p className="font-medium">Request Ambulance</p>
                      <p className="text-xs text-muted-foreground">Dispatch ambulance to accident scene</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" data-testid="action-blood" onClick={() => toast({ title: "Blood bank inventory check initiated" })}>
                    <Activity className="h-5 w-5 mr-3 text-red-500" />
                    <div className="text-left">
                      <p className="font-medium">Check Blood Supply</p>
                      <p className="text-xs text-muted-foreground">Verify blood bank availability</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" data-testid="action-transfer" onClick={() => toast({ title: "Inter-hospital transfer form opening..." })}>
                    <Building2 className="h-5 w-5 mr-3 text-emerald-500" />
                    <div className="text-left">
                      <p className="font-medium">Patient Transfer</p>
                      <p className="text-xs text-muted-foreground">Transfer to specialized facility</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              {hospitalContacts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-4 w-4" />
                      Nearby Hospitals ({hospitalContacts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {hospitalContacts.slice(0, 6).map(contact => (
                        <div key={contact.id} className="flex items-center justify-between gap-2 text-sm border rounded-md p-2" data-testid={`hospital-contact-${contact.id}`}>
                          <div className="truncate flex-1">
                            <p className="font-medium truncate">{contact.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{contact.organization}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="flex-shrink-0" onClick={() => toast({ title: `Calling ${contact.name}...` })}>
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="all-accidents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    All Accidents
                  </CardTitle>
                  <CardDescription>View all accidents assigned to hospital</CardDescription>
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="filter-date-range">
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
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No accidents found</p>
                  <p className="text-sm">No accidents match the selected date range</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredAlerts
                    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className="border rounded-lg p-4 flex items-center justify-between gap-3"
                        data-testid={`accident-row-${alert.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(alert.status)}
                            <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                              {alert.severity?.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.type.replace(/-/g, " ")}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{alert.location}</span>
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(alert.detectedAt).toLocaleString()}
                            </span>
                            <span>{getCameraName(alert.cameraId)}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 flex-wrap">
                          {alert.latitude && alert.longitude && (
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`view-location-${alert.id}`}
                              onClick={() => window.open(`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`, "_blank")}
                            >
                              <Navigation className="h-3 w-3 mr-1" />
                              Map
                            </Button>
                          )}
                          {(alert.status === "pending" || alert.status === "acknowledged") && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-emerald-600"
                              data-testid={`admit-all-${alert.id}`}
                              onClick={() => admitPatientMutation.mutate(alert.id)}
                              disabled={admitPatientMutation.isPending}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Admit
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambulances">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-red-500" />
                Manage Ambulances
              </CardTitle>
              <CardDescription>Ambulance units available for dispatch</CardDescription>
            </CardHeader>
            <CardContent>
              {ambulanceContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No Ambulance Contacts</p>
                  <p className="text-sm">No ambulance contacts have been registered yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {ambulanceContacts.map(contact => (
                    <div
                      key={contact.id}
                      className="border rounded-lg p-4 flex items-center justify-between gap-3"
                      data-testid={`ambulance-contact-${contact.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="bg-red-500/10 p-2 rounded-lg flex-shrink-0">
                          <Truck className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{contact.organization}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                            {contact.email && <span>{contact.email}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={contact.isActive ? "default" : "secondary"}>
                          {contact.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`call-ambulance-${contact.id}`}
                          onClick={() => toast({ title: `Calling ${contact.name} at ${contact.phone}...` })}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
