import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Plus,
  MapPin,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Camera as CameraType, InsertCamera } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const cameraFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  status: z.string().default("active"),
  streamUrl: z.string().optional(),
  description: z.string().optional(),
});

type CameraFormData = z.infer<typeof cameraFormSchema>;

export default function Cameras() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CameraFormData>({
    resolver: zodResolver(cameraFormSchema),
    defaultValues: {
      name: "",
      location: "",
      latitude: 0,
      longitude: 0,
      status: "active",
      streamUrl: "",
      description: "",
    },
  });

  const { data: cameras, isLoading } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras"],
  });

  const createCameraMutation = useMutation({
    mutationFn: async (data: CameraFormData) => {
      return apiRequest("POST", "/api/cameras", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({
        title: "Camera Added",
        description: "The camera has been registered successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateCameraMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CameraFormData> }) => {
      return apiRequest("PATCH", `/api/cameras/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({
        title: "Camera Updated",
        description: "The camera has been updated successfully.",
      });
      setIsDialogOpen(false);
      setEditingCamera(null);
      form.reset();
    },
  });

  const deleteCameraMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/cameras/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({
        title: "Camera Deleted",
        description: "The camera has been removed.",
      });
    },
  });

  const openEditDialog = (camera: CameraType) => {
    setEditingCamera(camera);
    form.reset({
      name: camera.name,
      location: camera.location,
      latitude: camera.latitude,
      longitude: camera.longitude,
      status: camera.status,
      streamUrl: camera.streamUrl || "",
      description: camera.description || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCamera(null);
    form.reset({
      name: "",
      location: "",
      latitude: 3.8667,
      longitude: 11.5167,
      status: "active",
      streamUrl: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: CameraFormData) => {
    if (editingCamera) {
      updateCameraMutation.mutate({ id: editingCamera.id, data });
    } else {
      createCameraMutation.mutate(data);
    }
  };

  const activeCameras = cameras?.filter((c) => c.status === "active") || [];
  const offlineCameras = cameras?.filter((c) => c.status !== "active") || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cameras</h1>
          <p className="text-muted-foreground">
            Manage CCTV cameras and their GPS locations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-add-camera">
              <Plus className="mr-2 h-4 w-4" />
              Add Camera
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCamera ? "Edit Camera" : "Add New Camera"}
              </DialogTitle>
              <DialogDescription>
                {editingCamera
                  ? "Update the camera details below."
                  : "Register a new CCTV camera with its GPS location."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Camera Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Nlongkak Junction Cam 1"
                          {...field}
                          data-testid="input-camera-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Rond-point Nlongkak, Yaounde"
                          {...field}
                          data-testid="input-camera-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="3.8667"
                            {...field}
                            data-testid="input-camera-latitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="11.5167"
                            {...field}
                            data-testid="input-camera-longitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-camera-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="streamUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="rtsp://..."
                          {...field}
                          data-testid="input-camera-stream-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional details about this camera..."
                          {...field}
                          data-testid="input-camera-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createCameraMutation.isPending || updateCameraMutation.isPending
                    }
                    data-testid="button-save-camera"
                  >
                    {(createCameraMutation.isPending || updateCameraMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingCamera ? "Update" : "Add"} Camera
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cameras?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeCameras.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {offlineCameras.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Cameras</CardTitle>
          <CardDescription>All CCTV cameras in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : cameras && cameras.length > 0 ? (
            <div className="space-y-4">
              {cameras.map((camera) => (
                <div
                  key={camera.id}
                  className="flex flex-col gap-4 p-4 border rounded-lg md:flex-row md:items-center"
                  data-testid={`camera-item-${camera.id}`}
                >
                  <div className="shrink-0">
                    <div
                      className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        camera.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Camera className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{camera.name}</h3>
                      <Badge
                        variant={camera.status === "active" ? "default" : "secondary"}
                        className={
                          camera.status === "active"
                            ? "bg-success/20 text-success border-success/30"
                            : ""
                        }
                      >
                        {camera.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{camera.location}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      GPS: {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(camera)}
                      data-testid={`button-edit-camera-${camera.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteCameraMutation.mutate(camera.id)}
                      disabled={deleteCameraMutation.isPending}
                      data-testid={`button-delete-camera-${camera.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Camera className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No Cameras Registered</p>
              <p className="text-xs text-muted-foreground mb-4">
                Add cameras to start monitoring
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Camera
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
