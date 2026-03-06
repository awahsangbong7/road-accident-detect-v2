import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Search,
  Filter,
  Bell,
  MapPin,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Activity,
  Shield,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Alert } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Alerts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 3000,
  });

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/alerts/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const sendAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest("POST", `/api/alerts/${alertId}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert Sent",
        description: "Emergency services have been notified.",
      });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest("DELETE", `/api/alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert Removed",
        description: "The alert has been deleted.",
      });
    },
  });

  const filteredAlerts = alerts?.filter((alert) => {
    const matchesSearch =
      alert.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || alert.status === statusFilter;
    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-amber-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30">Pending</Badge>;
      case "acknowledged":
        return <Badge className="bg-blue-500/15 text-blue-600 border border-blue-500/30">Acknowledged</Badge>;
      case "resolved":
        return <Badge className="bg-green-500/15 text-green-600 border border-green-500/30">Resolved</Badge>;
      case "false_alarm":
        return <Badge variant="secondary">False Alarm</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAccidentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      collision: "Vehicle Collision",
      pedestrian: "Pedestrian Incident",
      "multi-vehicle": "Multi-Vehicle Pileup",
      rollover: "Vehicle Rollover",
      motorcycle: "Motorcycle Accident",
      bicycle: "Bicycle Accident",
      "hit-and-run": "Hit and Run",
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const pendingCount = alerts?.filter(a => a.status === "pending").length || 0;
  const acknowledgedCount = alerts?.filter(a => a.status === "acknowledged").length || 0;
  const resolvedCount = alerts?.filter(a => a.status === "resolved").length || 0;

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-alerts-title">Alert Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage all detected incidents across the network
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-500">{pendingCount} Active</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
              <Activity className="h-3 w-3 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">{acknowledgedCount} In Progress</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500/10 border border-green-500/20">
              <Shield className="h-3 w-3 text-green-500" />
              <span className="text-sm font-medium text-green-500">{resolvedCount} Resolved</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by location, type, or description..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-alerts"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]" data-testid="select-status-filter">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="false_alarm">False Alarm</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full md:w-[180px]" data-testid="select-severity-filter">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : filteredAlerts && filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <Card key={alert.id} data-testid={`alert-card-${alert.id}`} className="hover-elevate transition-all">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div
                      className={`shrink-0 h-12 w-12 rounded-lg flex items-center justify-center ${getSeverityIcon(
                        alert.severity
                      )}`}
                    >
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold" data-testid={`text-alert-type-${alert.id}`}>
                          {getAccidentTypeLabel(alert.type)}
                        </h3>
                        {getStatusBadge(alert.status)}
                        <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{alert.location}</span>
                        <span className="text-xs">({alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)})</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(alert.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5" />
                          Confidence: {Math.round(alert.confidence * 100)}%
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {alert.smsSent && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            <MessageSquare className="mr-1 h-3 w-3" />
                            SMS Sent
                          </Badge>
                        )}
                        {alert.emailSent && (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                            <Mail className="mr-1 h-3 w-3" />
                            Email Sent
                          </Badge>
                        )}
                        {alert.callMade && (
                          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                            <Phone className="mr-1 h-3 w-3" />
                            Voice Call
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      {alert.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateAlertMutation.mutate({
                                id: alert.id,
                                status: "acknowledged",
                              })
                            }
                            data-testid={`button-acknowledge-${alert.id}`}
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => sendAlertMutation.mutate(alert.id)}
                            data-testid={`button-send-alert-${alert.id}`}
                          >
                            Send Alert
                          </Button>
                        </>
                      )}
                      {alert.status === "acknowledged" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateAlertMutation.mutate({
                              id: alert.id,
                              status: "resolved",
                            })
                          }
                          data-testid={`button-resolve-${alert.id}`}
                        >
                          Mark Resolved
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-500"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this alert?")) {
                            deleteAlertMutation.mutate(alert.id);
                          }
                        }}
                        data-testid={`button-delete-alert-${alert.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">No Alerts Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || statusFilter !== "all" || severityFilter !== "all"
                    ? "No alerts match your current filters. Try adjusting your search."
                    : "The system is actively monitoring all cameras. Alerts will appear here when incidents are detected."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
