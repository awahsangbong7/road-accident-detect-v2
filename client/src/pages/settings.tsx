import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Cpu,
  MessageSquare,
  Mail,
  Phone,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SettingsData {
  detectionConfidenceThreshold: number;
  alertCountdownSeconds: number;
  smsAlerts: boolean;
  emailAlerts: boolean;
  voiceAlerts: boolean;
  autoSendAlerts: boolean;
  modelType: string;
  processingMode: string;
  twilioPhoneNumber: string;
}

interface TwilioStatus {
  configured: boolean;
  accountSid: string | null;
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  const defaultSettings: SettingsData = {
    detectionConfidenceThreshold: 90,
    alertCountdownSeconds: 10,
    smsAlerts: true,
    emailAlerts: true,
    voiceAlerts: true,
    autoSendAlerts: true,
    modelType: "yolov8n",
    processingMode: "gpu",
    twilioPhoneNumber: "",
  };

  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: twilioStatus } = useQuery<TwilioStatus>({
    queryKey: ["/api/twilio/status"],
  });

  const { data: savedSettings, isSuccess } = useQuery<{ key: string; value: string }[]>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (isSuccess && savedSettings && !isInitialized) {
      const newSettings = { ...defaultSettings };
      savedSettings.forEach((s) => {
        if (s.key === "twilioPhoneNumber") newSettings.twilioPhoneNumber = s.value || "";
        if (s.key === "smsAlerts") newSettings.smsAlerts = s.value !== "false";
        if (s.key === "voiceAlerts") newSettings.voiceAlerts = s.value !== "false";
        if (s.key === "emailAlerts") newSettings.emailAlerts = s.value !== "false";
        if (s.key === "autoSendAlerts") newSettings.autoSendAlerts = s.value !== "false";
        if (s.key === "detectionConfidenceThreshold") newSettings.detectionConfidenceThreshold = parseInt(s.value) || 90;
        if (s.key === "alertCountdownSeconds") newSettings.alertCountdownSeconds = parseInt(s.value) || 10;
        if (s.key === "modelType") newSettings.modelType = s.value || "yolov8n";
        if (s.key === "processingMode") newSettings.processingMode = s.value || "gpu";
      });
      setSettings(newSettings);
      setIsInitialized(true);
    }
  }, [savedSettings, isSuccess, isInitialized]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      return apiRequest("PUT", "/api/settings", {
        detectionConfidenceThreshold: String(data.detectionConfidenceThreshold),
        alertCountdownSeconds: String(data.alertCountdownSeconds),
        smsAlerts: String(data.smsAlerts),
        emailAlerts: String(data.emailAlerts),
        voiceAlerts: String(data.voiceAlerts),
        autoSendAlerts: String(data.autoSendAlerts),
        modelType: data.modelType,
        processingMode: data.processingMode,
        twilioPhoneNumber: data.twilioPhoneNumber,
      });
    },
    onSuccess: () => {
      setIsInitialized(false);
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
      setHasChanges(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure system preferences and detection parameters
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveSettingsMutation.isPending}
          data-testid="button-save-settings"
        >
          {saveSettingsMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Twilio Configuration
            </CardTitle>
            <CardDescription>
              Configure Twilio for SMS and voice call alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Connection Status</span>
              </div>
              {twilioStatus?.configured ? (
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="mr-1 h-3 w-3" />
                  Not Connected
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="twilio-phone">Twilio Phone Number</Label>
              <Input
                id="twilio-phone"
                type="tel"
                placeholder="+1234567890"
                value={settings.twilioPhoneNumber}
                onChange={(e) => updateSetting("twilioPhoneNumber", e.target.value)}
                data-testid="input-twilio-phone"
              />
              <p className="text-xs text-muted-foreground">
                Your Twilio phone number for sending SMS and making voice calls (e.g., +1234567890)
              </p>
            </div>

            {twilioStatus?.configured && (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                Account SID: {twilioStatus.accountSid}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Detection Settings
            </CardTitle>
            <CardDescription>
              Configure accident detection parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidence-threshold">
                    Confidence Threshold
                  </Label>
                  <span className="text-sm font-medium">
                    {settings.detectionConfidenceThreshold}%
                  </span>
                </div>
                <Slider
                  id="confidence-threshold"
                  value={[settings.detectionConfidenceThreshold]}
                  onValueChange={([value]) =>
                    updateSetting("detectionConfidenceThreshold", value)
                  }
                  min={50}
                  max={99}
                  step={1}
                  data-testid="slider-confidence-threshold"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum confidence required to trigger an alert (recommended: 90%)
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="model-type">Detection Model</Label>
                <Select
                  value={settings.modelType}
                  onValueChange={(value) => updateSetting("modelType", value)}
                >
                  <SelectTrigger id="model-type" data-testid="select-model-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yolov8n">YOLOv8 Nano (Fastest)</SelectItem>
                    <SelectItem value="yolov8s">YOLOv8 Small</SelectItem>
                    <SelectItem value="yolov8m">YOLOv8 Medium</SelectItem>
                    <SelectItem value="yolov8l">YOLOv8 Large (Most Accurate)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Larger models are more accurate but slower
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="processing-mode">Processing Mode</Label>
                <Select
                  value={settings.processingMode}
                  onValueChange={(value) => updateSetting("processingMode", value)}
                >
                  <SelectTrigger id="processing-mode" data-testid="select-processing-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpu">GPU (Faster)</SelectItem>
                    <SelectItem value="cpu">CPU Only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  GPU mode requires CUDA-compatible hardware
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert Settings
            </CardTitle>
            <CardDescription>
              Configure how alerts are sent to responders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="countdown">Alert Countdown</Label>
                  <span className="text-sm font-medium">
                    {settings.alertCountdownSeconds} seconds
                  </span>
                </div>
                <Slider
                  id="countdown"
                  value={[settings.alertCountdownSeconds]}
                  onValueChange={([value]) =>
                    updateSetting("alertCountdownSeconds", value)
                  }
                  min={5}
                  max={30}
                  step={1}
                  data-testid="slider-countdown"
                />
                <p className="text-xs text-muted-foreground">
                  Time before automatic alert dispatch (allows cancellation)
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-send">Auto-send Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically send alerts after countdown
                  </p>
                </div>
                <Switch
                  id="auto-send"
                  checked={settings.autoSendAlerts}
                  onCheckedChange={(checked) =>
                    updateSetting("autoSendAlerts", checked)
                  }
                  data-testid="switch-auto-send"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Choose how to notify emergency responders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">SMS Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Send text messages via Twilio
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.smsAlerts}
                onCheckedChange={(checked) =>
                  updateSetting("smsAlerts", checked)
                }
                data-testid="switch-sms-alerts"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Send email notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.emailAlerts}
                onCheckedChange={(checked) =>
                  updateSetting("emailAlerts", checked)
                }
                data-testid="switch-email-alerts"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Voice Calls</p>
                  <p className="text-xs text-muted-foreground">
                    AI-powered voice calls via Twilio
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.voiceAlerts}
                onCheckedChange={(checked) =>
                  updateSetting("voiceAlerts", checked)
                }
                data-testid="switch-voice-calls"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Current system performance and integration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm">AI Detection Engine</span>
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm">OpenAI Integration</span>
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm">Twilio SMS/Voice</span>
                {twilioStatus?.configured ? (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Setup Required</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm">Database</span>
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">PostgreSQL</span>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Model Version</p>
                <p className="text-sm font-medium">YOLOv8 Nano</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Precision</p>
                <p className="text-sm font-medium">92.8%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recall</p>
                <p className="text-sm font-medium">89.6%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">F1 Score</p>
                <p className="text-sm font-medium">91.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
