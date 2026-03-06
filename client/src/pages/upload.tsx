import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload as UploadIcon,
  FileVideo,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Trash2,
  Video,
  Search,
  Eye,
  Target,
  FileUp,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Video as VideoType, Camera } from "@shared/schema";

type ProcessingStep = "idle" | "uploading" | "analyzing" | "detecting" | "reporting" | "completed" | "error";

const PROCESSING_STEPS: { key: ProcessingStep; label: string; icon: typeof UploadIcon }[] = [
  { key: "uploading", label: "Uploading file", icon: FileUp },
  { key: "analyzing", label: "Analyzing frames", icon: Search },
  { key: "detecting", label: "Detecting objects", icon: Eye },
  { key: "reporting", label: "Generating report", icon: Target },
];

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [currentVideoId, setCurrentVideoId] = useState<number | null>(null);
  const [processingResult, setProcessingResult] = useState<VideoType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: videos, isLoading: videosLoading } = useQuery<VideoType[]>({
    queryKey: ["/api/videos"],
    refetchInterval: 2000,
  });

  const { data: cameras } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const processingVideo = videos?.find(
    (v) => v.id === currentVideoId && v.status === "processing"
  );
  const completedVideo = videos?.find(
    (v) => v.id === currentVideoId && v.status === "completed"
  );

  if (completedVideo && processingStep !== "completed" && processingStep !== "idle") {
    setProcessingStep("completed");
    setProcessingResult(completedVideo);
  }

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedCameraId && selectedCameraId !== "none") {
        formData.append("cameraId", selectedCameraId);
      }

      const response = await fetch("/api/videos/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
  });

  const processVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      return apiRequest("POST", `/api/videos/${videoId}/process`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Processing Started",
        description: "Video is being analyzed for accidents...",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      return apiRequest("DELETE", `/api/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video Deleted",
        description: "The video has been removed.",
      });
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("video/") || file.type.startsWith("image/")
    );

    if (droppedFiles.length > 0) {
      setSelectedFile(droppedFiles[0]);
      setProcessingStep("idle");
      setProcessingResult(null);
      setCurrentVideoId(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setProcessingStep("idle");
      setProcessingResult(null);
      setCurrentVideoId(null);
    }
  };

  const handleStartProcessing = async () => {
    if (!selectedFile) return;

    setProcessingStep("uploading");

    try {
      const result = await uploadMutation.mutateAsync(selectedFile);
      const videoId = result.id;
      setCurrentVideoId(videoId);

      setProcessingStep("analyzing");

      await processVideoMutation.mutateAsync(videoId);

      setProcessingStep("detecting");

      setTimeout(() => {
        if (processingStep !== "completed") {
          setProcessingStep("reporting");
        }
      }, 3000);
    } catch {
      setProcessingStep("error");
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing your file.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" data-testid="badge-status-pending">Pending</Badge>;
      case "processing":
        return <Badge className="bg-warning text-warning-foreground" data-testid="badge-status-processing">Processing</Badge>;
      case "completed":
        return <Badge className="bg-success text-success-foreground" data-testid="badge-status-completed">Completed</Badge>;
      case "error":
        return <Badge variant="destructive" data-testid="badge-status-error">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStepIndex = (step: ProcessingStep): number => {
    const idx = PROCESSING_STEPS.findIndex((s) => s.key === step);
    return idx >= 0 ? idx : -1;
  };

  const currentStepIndex = getStepIndex(processingStep);

  const isProcessing = processingStep !== "idle" && processingStep !== "completed" && processingStep !== "error";

  return (
    <div className="space-y-6 p-6">
      <div data-testid="page-header">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Process Media</h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Upload video or image for AI-powered accident detection
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-upload-title">Upload Video or Image</CardTitle>
              <CardDescription data-testid="text-upload-formats">
                Supported formats: MP4, AVI, MOV, MKV, JPG, PNG
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div
                className={`border-2 border-dashed rounded-md p-12 text-center transition-colors cursor-pointer ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-dropzone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                  data-testid="input-file-upload"
                />
                {selectedFile ? (
                  <div className="space-y-3">
                    {selectedFile.type.startsWith("video/") ? (
                      <FileVideo className="mx-auto h-14 w-14 text-primary" />
                    ) : (
                      <ImageIcon className="mx-auto h-14 w-14 text-primary" />
                    )}
                    <p className="text-lg font-medium" data-testid="text-selected-filename">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-selected-filesize">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click or drop to replace
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <UploadIcon className="mx-auto h-14 w-14 text-muted-foreground" />
                    <p className="text-lg font-medium" data-testid="text-drop-prompt">
                      Drop your file here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                )}
              </div>

              <Select
                value={selectedCameraId}
                onValueChange={setSelectedCameraId}
              >
                <SelectTrigger data-testid="select-camera-location">
                  <SelectValue placeholder="Select Camera Location (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No camera selected</SelectItem>
                  {cameras?.map((camera) => (
                    <SelectItem
                      key={camera.id}
                      value={String(camera.id)}
                      data-testid={`select-camera-option-${camera.id}`}
                    >
                      {camera.name} - {camera.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 no-default-hover-elevate"
                size="lg"
                disabled={!selectedFile || isProcessing}
                onClick={handleStartProcessing}
                data-testid="button-start-processing"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Processing
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-processing-status-title">Processing Status</CardTitle>
            </CardHeader>
            <CardContent>
              {processingStep === "idle" && !processingResult && (
                <div className="flex flex-col items-center justify-center py-8 text-center" data-testid="status-waiting">
                  <Video className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Waiting for file upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a file and start processing to begin
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-4 py-4" data-testid="status-processing">
                  {PROCESSING_STEPS.map((step, index) => {
                    const isActive = step.key === processingStep;
                    const isCompleted = currentStepIndex > index;
                    const isPending = currentStepIndex < index;
                    const StepIcon = step.icon;

                    return (
                      <div
                        key={step.key}
                        className="flex items-center gap-3"
                        data-testid={`processing-step-${step.key}`}
                      >
                        <div
                          className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${
                            isCompleted
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                              : isActive
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : isActive ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <StepIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              isActive
                                ? "font-medium"
                                : isCompleted
                                  ? "text-muted-foreground"
                                  : isPending
                                    ? "text-muted-foreground/60"
                                    : ""
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                        {isActive && (
                          <Badge variant="secondary" className="text-xs">
                            In progress
                          </Badge>
                        )}
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    );
                  })}
                  {processingVideo && processingVideo.processedFrames != null && processingVideo.totalFrames != null && processingVideo.totalFrames > 0 && (
                    <div className="mt-4 space-y-2" data-testid="processing-progress">
                      <Progress
                        value={(processingVideo.processedFrames / processingVideo.totalFrames) * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        {processingVideo.processedFrames} / {processingVideo.totalFrames} frames analyzed
                      </p>
                    </div>
                  )}
                </div>
              )}

              {processingStep === "error" && (
                <div className="flex flex-col items-center justify-center py-8 text-center" data-testid="status-error">
                  <AlertCircle className="h-12 w-12 text-destructive mb-3" />
                  <p className="text-sm font-medium">Processing Failed</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    An error occurred during analysis
                  </p>
                </div>
              )}

              {processingStep === "completed" && processingResult && (
                <div className="space-y-4 py-4" data-testid="status-completed">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium">Analysis Complete</p>
                      <p className="text-sm text-muted-foreground">
                        {processingResult.originalName}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-medium" data-testid="text-result-status">
                        {processingResult.status === "completed" ? "Analyzed" : processingResult.status}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Format</p>
                      <p className="text-sm font-medium" data-testid="text-result-format">
                        {processingResult.format.toUpperCase()}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">File Size</p>
                      <p className="text-sm font-medium" data-testid="text-result-size">
                        {formatFileSize(processingResult.fileSize)}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground">Frames</p>
                      <p className="text-sm font-medium" data-testid="text-result-frames">
                        {processingResult.totalFrames ?? "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle data-testid="text-how-it-works-title">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3" data-testid="step-1">
                <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Upload your video or image file</p>
                  <p className="text-xs text-muted-foreground">
                    Drag and drop or browse to select media
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="step-2">
                <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">YOLOv8 AI analyzes for vehicles and collisions</p>
                  <p className="text-xs text-muted-foreground">
                    Advanced object detection identifies accident scenarios
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="step-3">
                <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Automatic SMS alerts sent to emergency services</p>
                  <p className="text-xs text-muted-foreground">
                    Responders are notified immediately upon detection
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle data-testid="text-recent-uploads-title">Recent Uploads</CardTitle>
          <CardDescription>Previously uploaded files and their processing status</CardDescription>
        </CardHeader>
        <CardContent>
          {videosLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-md">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : videos && videos.length > 0 ? (
            <div className="space-y-2">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 p-3 border rounded-md"
                  data-testid={`video-row-${video.id}`}
                >
                  <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-muted">
                    <FileVideo className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`text-video-name-${video.id}`}>
                      {video.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(video.fileSize)} -- {video.format.toUpperCase()}
                    </p>
                    {video.status === "processing" && video.processedFrames != null && video.totalFrames != null && video.totalFrames > 0 && (
                      <div className="mt-2">
                        <Progress
                          value={(video.processedFrames / video.totalFrames) * 100}
                          className="h-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {video.processedFrames}/{video.totalFrames} frames
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2 flex-wrap">
                    {getStatusBadge(video.status)}
                    {video.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => processVideoMutation.mutate(video.id)}
                        disabled={processVideoMutation.isPending}
                        data-testid={`button-process-video-${video.id}`}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Analyze
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteVideoMutation.mutate(video.id)}
                      disabled={deleteVideoMutation.isPending}
                      data-testid={`button-delete-video-${video.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="empty-uploads">
              <FileVideo className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No uploads yet</p>
              <p className="text-xs text-muted-foreground">
                Upload video or image files to start accident detection
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
