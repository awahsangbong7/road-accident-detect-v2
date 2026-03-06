import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  Building2,
  Truck,
  Users,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  Mail,
} from "lucide-react";
import type { Alert, Contact, User } from "@shared/schema";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ContactFormData = {
  name: string;
  role: string;
  phone: string;
  email: string;
  organization: string;
  priority: number;
  isActive: boolean;
};

const emptyContactForm: ContactFormData = {
  name: "",
  role: "hospital",
  phone: "",
  email: "",
  organization: "",
  priority: 1,
  isActive: true,
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormData>(emptyContactForm);
  const [dialogRole, setDialogRole] = useState<"hospital" | "ambulance">("hospital");

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 5000,
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createContactMutation = useMutation({
    mutationFn: (data: ContactFormData) =>
      apiRequest("POST", "/api/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact created successfully" });
      setDialogOpen(false);
      setContactForm(emptyContactForm);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create contact", description: error.message, variant: "destructive" });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContactFormData> }) =>
      apiRequest("PATCH", `/api/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact updated successfully" });
      setDialogOpen(false);
      setEditingContact(null);
      setContactForm(emptyContactForm);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update contact", description: error.message, variant: "destructive" });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete contact", description: error.message, variant: "destructive" });
    },
  });

  const hospitals = contacts?.filter(c => c.role === "hospital") || [];
  const ambulances = contacts?.filter(c => c.role === "ambulance") || [];

  const totalUsers = users?.length || 0;
  const totalHospitals = hospitals.length;
  const totalAmbulances = ambulances.length;
  const totalAccidents = alerts?.length || 0;

  const filterAlertsByDate = (alertsList: Alert[]) => {
    if (dateFilter === "all") return alertsList;
    const now = new Date();
    const cutoff = new Date();
    if (dateFilter === "today") cutoff.setHours(0, 0, 0, 0);
    else if (dateFilter === "7days") cutoff.setDate(now.getDate() - 7);
    else if (dateFilter === "30days") cutoff.setDate(now.getDate() - 30);
    return alertsList.filter(a => new Date(a.detectedAt) >= cutoff);
  };

  const filteredAlerts = filterAlertsByDate(alerts || []);

  const openAddDialog = (role: "hospital" | "ambulance") => {
    setEditingContact(null);
    setDialogRole(role);
    setContactForm({ ...emptyContactForm, role });
    setDialogOpen(true);
  };

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    setDialogRole(contact.role as "hospital" | "ambulance");
    setContactForm({
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      email: contact.email || "",
      organization: contact.organization || "",
      priority: contact.priority,
      isActive: contact.isActive,
    });
    setDialogOpen(true);
  };

  const handleSaveContact = () => {
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, data: contactForm });
    } else {
      createContactMutation.mutate(contactForm);
    }
  };

  const severityColor = (severity: string) => {
    if (severity === "high") return "destructive";
    if (severity === "medium") return "secondary";
    return "outline";
  };

  const statusColor = (status: string) => {
    if (status === "pending") return "destructive";
    if (status === "acknowledged") return "secondary";
    return "outline";
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

  const renderContactTable = (contactList: Contact[], role: "hospital" | "ambulance") => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {contactList.length} {role === "hospital" ? "hospitals" : "ambulances"} registered
        </p>
        <Button size="sm" onClick={() => openAddDialog(role)} data-testid={`button-add-${role}`}>
          <Plus className="h-4 w-4 mr-1" />
          Add {role === "hospital" ? "Hospital" : "Ambulance"}
        </Button>
      </div>
      {contactsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : contactList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No {role === "hospital" ? "hospitals" : "ambulances"} registered yet</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contactList.map(contact => (
              <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                <TableCell className="font-medium" data-testid={`text-contact-name-${contact.id}`}>{contact.name}</TableCell>
                <TableCell>{contact.organization || "—"}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </span>
                </TableCell>
                <TableCell>
                  {contact.email ? (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={contact.isActive ? "outline" : "secondary"} data-testid={`status-contact-${contact.id}`}>
                    {contact.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(contact)}
                      data-testid={`button-edit-contact-${contact.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteContactMutation.mutate(contact.id)}
                      disabled={deleteContactMutation.isPending}
                      data-testid={`button-delete-contact-${contact.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6" data-testid="admin-dashboard">
      <div className="flex items-center gap-3">
        <div className="bg-purple-600/10 p-3 rounded-md">
          <ShieldCheck className="h-8 w-8 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Admin Dashboard</h1>
          <p className="text-muted-foreground">System administration and management</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="stat-total-users">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-total-hospitals">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{totalHospitals}</div>
            <p className="text-xs text-muted-foreground">Registered hospitals</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-total-ambulances">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ambulances</CardTitle>
            <Truck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{totalAmbulances}</div>
            <p className="text-xs text-muted-foreground">Registered ambulances</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-total-accidents">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{totalAccidents}</div>
            <p className="text-xs text-muted-foreground">All recorded incidents</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hospitals" className="space-y-4">
        <TabsList data-testid="tabs-admin">
          <TabsTrigger value="hospitals" data-testid="tab-hospitals">
            <Building2 className="h-4 w-4 mr-1" />
            Hospitals
          </TabsTrigger>
          <TabsTrigger value="ambulances" data-testid="tab-ambulances">
            <Truck className="h-4 w-4 mr-1" />
            Ambulances
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-1" />
            Users
          </TabsTrigger>
          <TabsTrigger value="accidents" data-testid="tab-accidents">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Accidents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hospitals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-500" />
                Manage Hospitals
              </CardTitle>
              <CardDescription>Add, edit, or remove hospital contacts</CardDescription>
            </CardHeader>
            <CardContent>
              {renderContactTable(hospitals, "hospital")}
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
              <CardDescription>Add, edit, or remove ambulance contacts</CardDescription>
            </CardHeader>
            <CardContent>
              {renderContactTable(ambulances, "ambulance")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                View Users
              </CardTitle>
              <CardDescription>All registered users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No users registered yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow key={user.id} data-testid={`row-user-${index}`}>
                        <TableCell className="font-medium" data-testid={`text-user-name-${index}`}>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell data-testid={`text-user-email-${index}`}>{user.email || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-user-role-${index}`}>
                            {user.role || "dispatcher"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.organization || "—"}</TableCell>
                        <TableCell>{user.city || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive === "true" ? "outline" : "secondary"}
                            data-testid={`status-user-${index}`}
                          >
                            {user.isActive === "true" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accidents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    View Accidents
                  </CardTitle>
                  <CardDescription>All detected accidents and incidents</CardDescription>
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
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
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-50" />
                  <p>No accidents found for this period</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredAlerts
                    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
                    .map(alert => (
                      <div
                        key={alert.id}
                        className="border rounded-md p-4 space-y-2"
                        data-testid={`accident-${alert.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={severityColor(alert.severity)} data-testid={`severity-${alert.id}`}>
                                {alert.severity?.toUpperCase()}
                              </Badge>
                              <Badge variant={statusColor(alert.status)} data-testid={`status-${alert.id}`}>
                                {alert.status?.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{alert.type.replace(/-/g, " ")}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{alert.location}</span>
                            </p>
                            {alert.description && (
                              <p className="text-sm mt-1 truncate">{alert.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(alert.detectedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">
              {editingContact ? "Edit" : "Add"} {dialogRole === "hospital" ? "Hospital" : "Ambulance"}
            </DialogTitle>
            <DialogDescription>
              {editingContact ? "Update the contact details" : "Add a new contact to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                value={contactForm.name}
                onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Contact name"
                data-testid="input-contact-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-org">Organization</Label>
              <Input
                id="contact-org"
                value={contactForm.organization}
                onChange={e => setContactForm(f => ({ ...f, organization: e.target.value }))}
                placeholder="Organization name"
                data-testid="input-contact-org"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                value={contactForm.phone}
                onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+237 6XX XXX XXX"
                data-testid="input-contact-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                value={contactForm.email}
                onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                data-testid="input-contact-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-priority">Priority</Label>
              <Select
                value={String(contactForm.priority)}
                onValueChange={v => setContactForm(f => ({ ...f, priority: parseInt(v) }))}
              >
                <SelectTrigger data-testid="select-contact-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Highest</SelectItem>
                  <SelectItem value="2">2 - High</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - Low</SelectItem>
                  <SelectItem value="5">5 - Lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSaveContact}
              disabled={createContactMutation.isPending || updateContactMutation.isPending || !contactForm.name || !contactForm.phone}
              data-testid="button-save-contact"
            >
              {editingContact ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
