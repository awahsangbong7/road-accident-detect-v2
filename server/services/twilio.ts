import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let twilioClient: Twilio.Twilio | null = null;

if (accountSid && authToken) {
  twilioClient = Twilio(accountSid, authToken);
}

export interface AlertNotification {
  to: string;
  alertType: string;
  location: string;
  severity: string;
  confidence: number;
  cameraName?: string;
  latitude?: number;
  longitude?: number;
  detectedAt?: string;
}

export function formatSMSBody(notification: AlertNotification): string {
  const conf = typeof notification.confidence === 'number' && notification.confidence < 1
    ? (notification.confidence * 100).toFixed(1)
    : String(notification.confidence);

  const typeLabel = notification.alertType
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const now = notification.detectedAt
    ? new Date(notification.detectedAt)
    : new Date();
  const timeStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const lat = notification.latitude != null ? `${Math.abs(notification.latitude).toFixed(4)}°${notification.latitude >= 0 ? 'N' : 'S'}` : '';
  const lng = notification.longitude != null ? `${Math.abs(notification.longitude).toFixed(4)}°${notification.longitude >= 0 ? 'E' : 'W'}` : '';
  const gpsLine = lat && lng ? `GPS: ${lat}, ${lng}` : '';

  let mapsLink = '';
  if (notification.latitude != null && notification.longitude != null) {
    mapsLink = `https://www.google.com/maps?q=${notification.latitude.toFixed(6)},${notification.longitude.toFixed(6)}`;
  }

  const lines = [
    'SAFEROUTE CM - EMERGENCY ALERT',
    '',
    'Accident Detected!',
    `Type: ${typeLabel}`,
    `Severity: ${notification.severity.toUpperCase()}`,
    `Location: ${notification.location}`,
  ];

  if (gpsLine) lines.push(gpsLine);
  if (notification.cameraName) lines.push(`Camera: ${notification.cameraName}`);
  lines.push(`Time: ${timeStr}`);
  lines.push(`Confidence: ${conf}%`);
  if (mapsLink) {
    lines.push('');
    lines.push(`Navigate: ${mapsLink}`);
  }
  lines.push('');
  lines.push('Respond immediately.');
  lines.push('');
  lines.push('-- SAFEROUTE CM Automated Alert System');

  return lines.join('\n');
}

export async function sendSMS(notification: AlertNotification, fromNumber: string): Promise<{ success: boolean; sid?: string; error?: string; messageBody?: string }> {
  const body = formatSMSBody(notification);

  if (!twilioClient) {
    return { success: false, error: "Twilio not configured", messageBody: body };
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: fromNumber,
      to: notification.to,
    });
    
    return { success: true, sid: message.sid, messageBody: body };
  } catch (error: any) {
    console.error("SMS Error:", error.message);
    return { success: false, error: error.message, messageBody: body };
  }
}

export async function makeVoiceCall(notification: AlertNotification, fromNumber: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!twilioClient) {
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const call = await twilioClient.calls.create({
      twiml: `<Response><Say voice="alice">Attention! SAFEROUTE CM Emergency Alert. ${notification.alertType} detected at ${notification.location}. Severity level: ${notification.severity}. Confidence: ${notification.confidence} percent. Please respond immediately to the emergency.</Say><Pause length="1"/><Say voice="alice">Repeating. ${notification.alertType} detected at ${notification.location}. Please respond immediately.</Say></Response>`,
      from: fromNumber,
      to: notification.to,
    });
    
    return { success: true, sid: call.sid };
  } catch (error: any) {
    console.error("Voice Call Error:", error.message);
    return { success: false, error: error.message };
  }
}

export function isTwilioConfigured(): boolean {
  return twilioClient !== null;
}
