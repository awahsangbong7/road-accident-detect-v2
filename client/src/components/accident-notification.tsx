import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, X, Phone, MapPin, Clock, Activity, Shield, CheckCircle2, XCircle, MessageSquare, Volume2, VolumeX, PhoneCall, ArrowRight, Ambulance, Car, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Alert, Contact, Camera } from "@shared/schema";

interface SMSResult {
  contact: string;
  phone: string;
  success: boolean;
  error?: string;
  messageBody?: string;
}

interface VoiceResult {
  contact: string;
  phone: string;
  success: boolean;
  error?: string;
}

interface SendAlertResponse {
  success: boolean;
  message: string;
  alert: Alert;
  notifications: {
    sms: SMSResult[];
    voice: VoiceResult[];
  };
  twilioConfigured: boolean;
  fromNumber: string;
}

function EmergencySentConfirmation({
  data,
  alert,
  onClose
}: {
  data: SendAlertResponse;
  alert: Alert;
  onClose: () => void;
}) {
  const smsMessages = data.notifications?.sms || [];
  const voiceMessages = data.notifications?.voice || [];
  const totalNotified = smsMessages.length + voiceMessages.length;
  const successCount = smsMessages.filter(s => s.success).length + voiceMessages.filter(v => v.success).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in"
      data-testid="overlay-emergency-sent"
    >
      <div className="w-full max-w-md mx-4 rounded-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-emergency-sent">
        <div
          className="px-6 py-8 flex flex-col items-center text-center"
          style={{ background: "linear-gradient(180deg, #166534, #15803d, #16a34a)" }}
          data-testid="header-emergency-sent"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide" data-testid="text-emergency-sent-title">
            Emergency Details Sent
          </h2>
          <p className="text-sm text-white/80 mt-2" data-testid="text-emergency-sent-subtitle">
            Your crash data and location have been automatically sent to emergency responders
          </p>
        </div>

        <div className="bg-card px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3" data-testid="section-sent-stats">
            <div className="bg-muted rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-foreground" data-testid="text-responders-notified">{totalNotified}</p>
              <p className="text-xs text-muted-foreground">Responders Notified</p>
            </div>
            <div className="bg-muted rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-green-600" data-testid="text-messages-delivered">{successCount}</p>
              <p className="text-xs text-muted-foreground">Messages Delivered</p>
            </div>
          </div>

          <div className="bg-muted rounded-md p-4 space-y-2" data-testid="section-data-sent">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Data Shared with Paramedics
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span>GPS Location: <span className="text-foreground font-medium">{alert.location}</span></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-3 w-3 flex-shrink-0" />
                <span>Crash Severity: <span className="text-foreground font-medium">{alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}</span></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>Time of Incident: <span className="text-foreground font-medium">{new Date(alert.createdAt || Date.now()).toLocaleTimeString()}</span></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="h-3 w-3 flex-shrink-0" />
                <span>Incident Type: <span className="text-foreground font-medium">{alert.type.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span></span>
              </div>
            </div>
          </div>

          {(smsMessages.length > 0 || voiceMessages.length > 0) && (
            <div className="space-y-1.5" data-testid="section-delivery-details">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Delivery Status</h3>
              {smsMessages.map((sms, i) => (
                <div key={`sms-${i}`} className="flex items-center justify-between gap-2 text-xs py-1.5 px-2 rounded-md bg-muted/50" data-testid={`sms-result-${i}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {sms.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="text-foreground truncate">{sms.contact}</span>
                  </div>
                  <Badge variant={sms.success ? "default" : "outline"} className={sms.success ? "bg-green-600 text-white" : ""}>
                    {sms.success ? "SMS Sent" : "Demo"}
                  </Badge>
                </div>
              ))}
              {voiceMessages.map((call, i) => (
                <div key={`voice-${i}`} className="flex items-center justify-between gap-2 text-xs py-1.5 px-2 rounded-md bg-muted/50" data-testid={`voice-result-${i}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {call.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="text-foreground truncate">{call.contact}</span>
                  </div>
                  <Badge variant={call.success ? "default" : "outline"} className={call.success ? "bg-green-600 text-white" : ""}>
                    {call.success ? "Called" : "Demo"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {!data.twilioConfigured && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 text-xs text-amber-700 dark:text-amber-400" data-testid="text-demo-notice">
              Demo Mode: Twilio is not configured. In production, real SMS and voice calls would be dispatched.
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2" data-testid="section-post-send-actions">
            <Button
              className="w-full bg-red-600 text-white font-semibold"
              onClick={() => window.open("tel:119")}
              data-testid="button-call-emergency"
            >
              <PhoneCall className="h-4 w-4 mr-2" />
              Call Emergency Services (119)
            </Button>
            <Button
              variant="outline"
              className="w-full font-semibold"
              onClick={onClose}
              data-testid="button-continue"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CircularCountdown({ timeRemaining, totalSeconds }: { timeRemaining: number; totalSeconds: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = timeRemaining / totalSeconds;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" data-testid="countdown-circle">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="6"
        />
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white" data-testid="text-countdown">{timeRemaining}</span>
        <span className="text-xs text-white/60">seconds</span>
      </div>
    </div>
  );
}

interface AccidentNotificationProps {
  alert: Alert;
  countdownSeconds?: number;
  onDismiss: () => void;
  onSent: () => void;
}

function playAlertBeep(muted: boolean) {
  if (muted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playTone(880, now, 0.15);
    playTone(880, now + 0.2, 0.15);
    playTone(1100, now + 0.45, 0.3);
  } catch {}
}

export function AccidentNotification({
  alert,
  countdownSeconds = 20,
  onDismiss,
  onSent
}: AccidentNotificationProps) {
  const [timeRemaining, setTimeRemaining] = useState(countdownSeconds);
  const [isMuted, setIsMuted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendAlertResponse | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allCameras = [] } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const camera = allCameras.find(c => c.id === alert.cameraId);
  const cameraName = camera?.name || (alert.cameraId ? `CAM-${String(alert.cameraId).padStart(3, '0')}` : "Unknown");

  const typeLabel = alert.type
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const confidencePercent = alert.confidence && alert.confidence < 1
    ? (alert.confidence * 100).toFixed(1)
    : String(alert.confidence || 0);

  const sendAlertMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/alerts/${alert.id}/send`, {});
      return res.json() as Promise<SendAlertResponse>;
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setSendResult(responseData);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Alerts",
        description: error.message || "Could not send alerts. Please try again.",
        variant: "destructive",
      });
      setIsSending(false);
    },
  });

  const handleSendNow = useCallback(() => {
    if (isSending) return;
    setIsSending(true);
    sendAlertMutation.mutate();
  }, [sendAlertMutation, isSending]);

  const cancelAlertMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/alerts/${alert.id}`, { status: "false_alarm" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Alert Cancelled",
        description: "This alert has been marked as a false alarm.",
      });
      onDismiss();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCancel = useCallback(() => {
    cancelAlertMutation.mutate();
  }, [cancelAlertMutation]);

  useEffect(() => {
    playAlertBeep(isMuted);
    beepIntervalRef.current = setInterval(() => {
      playAlertBeep(isMuted);
    }, 3000);
    return () => {
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
    };
  }, [isMuted]);

  useEffect(() => {
    if (timeRemaining <= 0 && !isSending) {
      handleSendNow();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, handleSendNow, isSending]);

  if (sendResult) {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
    return (
      <EmergencySentConfirmation
        data={sendResult}
        alert={alert}
        onClose={() => {
          setSendResult(null);
          onSent();
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in"
      data-testid="overlay-accident-notification"
    >
      <div
        className="w-full max-w-md mx-4 rounded-md overflow-hidden shadow-2xl"
        data-testid="modal-accident-notification"
      >
        <div
          className="px-6 pt-6 pb-4"
          style={{ background: "linear-gradient(180deg, #991b1b, #dc2626, #b91c1c)" }}
          data-testid="header-accident-notification"
        >
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <TriangleAlert className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-wider" data-testid="text-crash-detected">
                  CRASH DETECTED
                </h2>
                <p className="text-sm text-white/70" data-testid="text-crash-subtitle">
                  Emergency alert will be sent automatically
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/60 flex-shrink-0"
              onClick={() => setIsMuted(!isMuted)}
              data-testid="button-mute-toggle"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex items-center justify-center">
            <CircularCountdown timeRemaining={timeRemaining} totalSeconds={countdownSeconds} />
          </div>

          <p className="text-xs text-white/70 text-center mt-3" data-testid="text-countdown-info">
            {isSending
              ? "Sending emergency data to responders..."
              : "Sending alert to emergency services unless cancelled"}
          </p>
        </div>

        <div className="bg-card px-6 py-5 space-y-4">
          <div className="bg-muted rounded-md p-4 space-y-2.5" data-testid="section-emergency-details">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              Emergency Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2" data-testid="detail-location">
                <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-muted-foreground">Location:</span>
                <span className="text-foreground font-medium">{alert.location}</span>
              </div>
              <div className="flex items-center gap-2" data-testid="detail-type">
                <Car className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground font-medium">{typeLabel}</span>
              </div>
              <div className="flex items-center gap-2" data-testid="detail-severity">
                <Activity className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-muted-foreground">Severity:</span>
                <Badge variant="destructive">{alert.severity.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center gap-2" data-testid="detail-confidence">
                <TriangleAlert className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-muted-foreground">Confidence:</span>
                <span className="text-foreground font-bold">{confidencePercent}%</span>
              </div>
              <div className="flex items-center gap-2" data-testid="detail-camera">
                <Clock className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-muted-foreground">Source:</span>
                <span className="text-foreground font-medium">{cameraName}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 rounded-md p-3 flex items-start gap-2" data-testid="section-auto-send-info">
            <Ambulance className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Your GPS location and crash data will be auto-sent to the nearest paramedics and emergency services.
            </p>
          </div>

          <div className="flex flex-col gap-2" data-testid="section-actions">
            <Button
              className="w-full bg-red-600 text-white font-bold text-base"
              onClick={handleSendNow}
              disabled={isSending}
              data-testid="button-send-alert"
            >
              {isSending ? (
                <>Sending Emergency Alert...</>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Send Alert Now
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full font-semibold"
              onClick={handleCancel}
              disabled={isSending}
              data-testid="button-false-alarm"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel - I'm OK (False Alarm)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AccidentNotificationManagerProps {
  alerts: Alert[];
}

export function AccidentNotificationManager({ alerts }: AccidentNotificationManagerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const [sentAlerts, setSentAlerts] = useState<Set<number>>(new Set());
  const [activeAlertId, setActiveAlertId] = useState<number | null>(null);

  const pendingAlerts = alerts.filter(
    (alert) =>
      alert.status === "pending" &&
      !dismissedAlerts.has(alert.id) &&
      !sentAlerts.has(alert.id) &&
      !alert.smsSent
  );

  const activeAlert = activeAlertId !== null
    ? alerts.find(a => a.id === activeAlertId)
    : null;

  const nextPending = pendingAlerts[0];

  useEffect(() => {
    if (activeAlertId === null && nextPending) {
      setActiveAlertId(nextPending.id);
    }
  }, [activeAlertId, nextPending]);

  const displayAlert = activeAlert || nextPending;

  if (!displayAlert) {
    return null;
  }

  return (
    <AccidentNotification
      key={displayAlert.id}
      alert={displayAlert}
      countdownSeconds={20}
      onDismiss={() => {
        setDismissedAlerts((prev) => new Set([...Array.from(prev), displayAlert.id]));
        setActiveAlertId(null);
      }}
      onSent={() => {
        setSentAlerts((prev) => new Set([...Array.from(prev), displayAlert.id]));
        setActiveAlertId(null);
      }}
    />
  );
}
