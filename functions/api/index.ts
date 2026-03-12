import { createClient } from "npm:@blinkdotnew/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const blink = createClient({
  projectId: Deno.env.get("BLINK_PROJECT_ID") || "saferoute-cm-e6pb5nhn",
  auth: { mode: "managed" },
});

interface Route {
  pattern: RegExp;
  method: string;
  handler: (req: Request, match: RegExpMatchArray) => Promise<Response>;
}

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.user_id || null;
  } catch {
    return null;
  }
}

async function handleRequest(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // Auth routes
  if (path === "/api/auth/user" && method === "GET") {
    return handleAuthUser(req);
  }
  if (path === "/api/auth/signup" && method === "POST") {
    return handleSignup(req);
  }
  if (path === "/api/auth/init" && method === "POST") {
    return handleInit(req);
  }
  if (path === "/api/logout" && method === "GET") {
    return handleLogout(req);
  }
  if (path === "/api/login" && method === "GET") {
    return handleLogin(req);
  }

  // Protected routes - check auth
  const userId = await getUserId(req);
  
  // Cameras
  if (path === "/api/cameras" && method === "GET") {
    return handleGetCameras(req, userId);
  }
  if (path === "/api/cameras" && method === "POST") {
    return handleCreateCamera(req, userId);
  }
  if (path.match(/^\/api\/cameras\/\d+$/) && method === "GET") {
    return handleGetCamera(req, userId);
  }
  if (path.match(/^\/api\/cameras\/\d+$/) && method === "PATCH") {
    return handleUpdateCamera(req, userId);
  }
  if (path.match(/^\/api\/cameras\/\d+$/) && method === "DELETE") {
    return handleDeleteCamera(req, userId);
  }

  // Contacts
  if (path === "/api/contacts" && method === "GET") {
    return handleGetContacts(req, userId);
  }
  if (path === "/api/contacts" && method === "POST") {
    return handleCreateContact(req, userId);
  }
  if (path.match(/^\/api\/contacts\/\d+$/) && method === "GET") {
    return handleGetContact(req, userId);
  }
  if (path.match(/^\/api\/contacts\/\d+$/) && method === "PATCH") {
    return handleUpdateContact(req, userId);
  }
  if (path.match(/^\/api\/contacts\/\d+$/) && method === "DELETE") {
    return handleDeleteContact(req, userId);
  }

  // Alerts
  if (path === "/api/alerts" && method === "GET") {
    return handleGetAlerts(req, userId);
  }
  if (path === "/api/alerts" && method === "POST") {
    return handleCreateAlert(req, userId);
  }
  if (path.match(/^\/api\/alerts\/\d+$/) && method === "GET") {
    return handleGetAlert(req, userId);
  }
  if (path.match(/^\/api\/alerts\/\d+$/) && method === "PATCH") {
    return handleUpdateAlert(req, userId);
  }

  // Videos
  if (path === "/api/videos" && method === "GET") {
    return handleGetVideos(req, userId);
  }
  if (path === "/api/videos/upload" && method === "POST") {
    return handleUploadVideo(req, userId);
  }
  if (path.match(/^\/api\/videos\/\d+$/) && method === "GET") {
    return handleGetVideo(req, userId);
  }
  if (path.match(/^\/api\/videos\/\d+\/process$/) && method === "POST") {
    return handleProcessVideo(req, userId);
  }

  // Settings
  if (path === "/api/settings" && method === "GET") {
    return handleGetSettings(req, userId);
  }
  if (path === "/api/settings" && method === "POST") {
    return handleCreateSetting(req, userId);
  }

  // Analytics
  if (path === "/api/analytics" && method === "GET") {
    return handleGetAnalytics(req, userId);
  }

  // Users (admin)
  if (path === "/api/users" && method === "GET") {
    return handleGetUsers(req, userId);
  }

  // 404 for API routes
  if (path.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fallback
  return new Response("Not found", { status: 404, headers: corsHeaders });
}

// Auth handlers
async function handleAuthUser(req: Request): Promise<Response> {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return new Response(JSON.stringify(null), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Get user data from DB
    const users = await blink.db.select<any[]>("users", { id: userId });
    const dbUser = users[0] || {};
    
    // Decode display name from JWT if available
    let firstName = dbUser.first_name || "User";
    let lastName = dbUser.last_name || "";
    let email = dbUser.email || "";
    
    try {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!firstName || firstName === "User") {
        firstName = payload.first_name || payload.given_name || payload.name?.split(" ")[0] || "User";
      }
      if (!lastName) {
        lastName = payload.last_name || payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "";
      }
      if (!email) {
        email = payload.email || "";
      }
    } catch {}
    
    const responseUser = {
      id: userId,
      email,
      firstName,
      lastName,
      role: dbUser.role || "dispatcher",
      city: dbUser.city || "",
      phone: dbUser.phone,
    };
    
    return new Response(JSON.stringify(responseUser), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Auth user error:", error);
    return new Response(JSON.stringify(null), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function handleSignup(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, role, city, organization } = body;
    
    // Create user in DB
    const userId = crypto.randomUUID();
    await blink.db.insert("users", {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      phone: phone || "",
      role: role || "dispatcher",
      city,
      organization: organization || "",
      is_active: "true",
    });
    
    // Seed initial data
    await seedUserData(userId);
    
    return new Response(JSON.stringify({ 
      message: "Account created successfully",
      user: { id: userId, email, firstName, lastName, role, city }
    }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return new Response(JSON.stringify({ error: "Failed to create account" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function handleInit(req: Request): Promise<Response> {
  const userId = await getUserId(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  await seedUserData(userId);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleLogout(req: Request): Promise<Response> {
  return new Response("", {
    status: 302,
    headers: {
      ...corsHeaders,
      "Location": "/",
    },
  });
}

async function handleLogin(req: Request): Promise<Response> {
  // Redirect to Blink auth
  const loginUrl = `${req.url.split("/api/login")[0]}/`;
  blink.auth.login(loginUrl);
  return new Response("", {
    status: 302,
    headers: {
      ...corsHeaders,
      "Location": loginUrl,
    },
  });
}

// Camera handlers
async function handleGetCameras(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  try {
    const cameras = await blink.db.select<any[]>("cameras", { user_id: userId });
    return new Response(JSON.stringify(cameras), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get cameras error:", error);
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function handleCreateCamera(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  try {
    const body = await req.json();
    const { name, location, latitude, longitude, status, streamUrl, description } = body;
    
    const result = await blink.db.insert("cameras", {
      user_id: userId,
      name,
      location,
      latitude: String(latitude),
      longitude: String(longitude),
      status: status || "active",
      stream_url: streamUrl || "",
      description: description || "",
    });
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Create camera error:", error);
    return new Response(JSON.stringify({ error: "Failed to create camera" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function handleGetCamera(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const id = req.url.split("/api/cameras/")[1]?.split("?")[0];
  const cameras = await blink.db.select<any[]>("cameras", { id: String(id) });
  const camera = cameras[0];
  
  if (!camera) {
    return new Response(JSON.stringify({ error: "Camera not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  return new Response(JSON.stringify(camera), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleUpdateCamera(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const id = req.url.split("/api/cameras/")[1]?.split("?")[0];
  const body = await req.json();
  
  await blink.db.update("cameras", { id: String(id) }, body);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleDeleteCamera(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const id = req.url.split("/api/cameras/")[1]?.split("?")[0];
  
  await blink.db.delete("cameras", { id: String(id) });
  
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Contact handlers
async function handleGetContacts(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const contacts = await blink.db.select<any[]>("contacts", { user_id: userId });
  return new Response(JSON.stringify(contacts), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleCreateContact(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const body = await req.json();
  const result = await blink.db.insert("contacts", {
    ...body,
    user_id: userId,
  });
  
  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGetContact(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const id = req.url.split("/api/contacts/")[1]?.split("?")[0];
  const contacts = await blink.db.select<any[]>("contacts", { id: String(id) });
  
  if (!contacts[0]) {
    return new Response(JSON.stringify({ error: "Contact not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  return new Response(JSON.stringify(contacts[0]), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleUpdateContact(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const id = req.url.split("/api/contacts/")[1]?.split("?")[0];
  const body = await req.json();
  
  await blink.db.update("contacts", { id: String(id) }, body);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleDeleteContact(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const id = req.url.split("/api/contacts/")[1]?.split("?")[0];
  
  await blink.db.delete("contacts", { id: String(id) });
  
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Alert handlers
async function handleGetAlerts(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const alerts = await blink.db.select<any[]>("alerts", { user_id: userId });
  return new Response(JSON.stringify(alerts), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleCreateAlert(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const body = await req.json();
  const result = await blink.db.insert("alerts", {
    ...body,
    user_id: userId,
  });
  
  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGetAlert(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const id = req.url.split("/api/alerts/")[1]?.split("?")[0];
  const alerts = await blink.db.select<any[]>("alerts", { id: String(id) });
  
  if (!alerts[0]) {
    return new Response(JSON.stringify({ error: "Alert not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  return new Response(JSON.stringify(alerts[0]), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleUpdateAlert(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const id = req.url.split("/api/alerts/")[1]?.split("?")[0];
  const body = await req.json();
  
  await blink.db.update("alerts", { id: String(id) }, body);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Video handlers
async function handleGetVideos(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const videos = await blink.db.select<any[]>("videos", { user_id: userId });
  return new Response(JSON.stringify(videos), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleUploadVideo(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  // For now, return a mock response - file upload requires more complex handling
  return new Response(JSON.stringify({ 
    id: Date.now(),
    filename: "mock-video.mp4",
    status: "pending"
  }), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGetVideo(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const id = req.url.split("/api/videos/")[1]?.split("?")[0];
  const videos = await blink.db.select<any[]>("videos", { id: String(id) });
  
  if (!videos[0]) {
    return new Response(JSON.stringify({ error: "Video not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  return new Response(JSON.stringify(videos[0]), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleProcessVideo(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const id = req.url.split("/api/videos/")[1]?.split("/process")[0];
  
  // Update video status to processing
  await blink.db.update("videos", { id: String(id) }, { status: "processing" });
  
  return new Response(JSON.stringify({ success: true, message: "Processing started" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Settings handlers
async function handleGetSettings(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const settings = await blink.db.select<any[]>("settings", {});
  return new Response(JSON.stringify(settings), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleCreateSetting(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const body = await req.json();
  const result = await blink.db.insert("settings", body);
  
  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Analytics handler
async function handleGetAnalytics(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const alerts = await blink.db.select<any[]>("alerts", { user_id: userId });
  const cameras = await blink.db.select<any[]>("cameras", { user_id: userId });
  
  const analytics = {
    totalAlerts: alerts.length,
    highSeverity: alerts.filter((a: any) => a.severity === "high").length,
    mediumSeverity: alerts.filter((a: any) => a.severity === "medium").length,
    lowSeverity: alerts.filter((a: any) => a.severity === "low").length,
    totalCameras: cameras.length,
    activeCameras: cameras.filter((c: any) => c.status === "active").length,
    recentAlerts: alerts.slice(-10),
  };
  
  return new Response(JSON.stringify(analytics), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Users handler (admin)
async function handleGetUsers(req: Request, userId: string | null): Promise<Response> {
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const users = await blink.db.select<any[]>("users", { id: userId });
  const currentUser = users[0];
  
  if (!currentUser || currentUser.role !== "admin") {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const allUsers = await blink.db.select<any[]>("users", {});
  return new Response(JSON.stringify(allUsers), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Seed initial data
async function seedUserData(userId: string) {
  // Check if user already has data
  const existingCameras = await blink.db.select<any[]>("cameras", { user_id: userId });
  if (existingCameras.length > 0) return;

  // Seed cameras
  const cameras = [
    { name: "Central Station Cam 1", location: "Yaounde Central Station", latitude: 3.848, longitude: 11.502, status: "active" },
    { name: "Downtown Junction", location: "Yaounde Downtown", latitude: 3.867, longitude: 11.518, status: "active" },
    { name: "Airport Road Cam", location: "Douala Airport Road", latitude: 4.125, longitude: 9.736, status: "active" },
    { name: "Market Square Cam", location: "Bamenda Market Square", latitude: 5.963, longitude: 10.141, status: "active" },
    { name: "University Campus Cam", location: "Buea University", latitude: 4.151, longitude: 9.242, status: "inactive" },
  ];

  for (const camera of cameras) {
    await blink.db.insert("cameras", { ...camera, user_id: userId });
  }

  // Seed contacts
  const contacts = [
    { name: "Emergency Services", role: "police", phone: "+237677000001", priority: 1, is_active: 1 },
    { name: "Central Hospital", role: "hospital", phone: "+237677000002", priority: 1, is_active: 1 },
    { name: "Fire Department", role: "fire", phone: "+237677000003", priority: 2, is_active: 1 },
    { name: "Ambulance Service", role: "ambulance", phone: "+237677000004", priority: 1, is_active: 1 },
  ];

  for (const contact of contacts) {
    await blink.db.insert("contacts", { ...contact, user_id: userId });
  }

  // Seed settings
  const settings = [
    { key: "smsAlerts", value: "true", category: "notifications" },
    { key: "voiceAlerts", value: "true", category: "notifications" },
    { key: "emailAlerts", value: "true", category: "notifications" },
    { key: "autoDispatch", value: "true", category: "dispatch" },
    { key: "twilioPhoneNumber", value: "+1234567890", category: "twilio" },
  ];

  for (const setting of settings) {
    await blink.db.insert("settings", setting);
  }

  // Seed sample alerts
  const alerts = [
    { type: "collision", severity: "high", confidence: 0.95, latitude: 3.848, longitude: 11.502, location: "Yaounde Central Station", status: "resolved" },
    { type: "pedestrian", severity: "medium", confidence: 0.87, latitude: 4.125, longitude: 9.736, location: "Douala Airport Road", status: "pending" },
  ];

  for (const alert of alerts) {
    await blink.db.insert("alerts", { ...alert, user_id: userId });
  }
}

Deno.serve(handleRequest);
