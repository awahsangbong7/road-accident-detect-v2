# SAFEROUTE CM - Road Accident Detection and Emergency Alert System

## Overview
SAFEROUTE CM (formerly AccidentGuard AI) is an AI-powered road accident detection and emergency alert system designed for a Master's thesis project in Cameroon. The system monitors CCTV cameras with GPS locations across **Yaounde, Douala, Bamenda, and Buea**, automatically detects vehicle collisions and accidents using YOLOv8 simulation, and sends SMS/Email/Voice alerts to emergency responders via Twilio.

## Current State
The application is a fully functional MVP with:
- **16 complete React pages** (Dashboard, Upload, Live Monitoring, Alerts, Map View, Cameras, Contacts, Analytics, AI Assistant, Settings, Police Dashboard, Ambulance Dashboard, Hospital Dashboard, Admin Dashboard, Responders Dashboard, Signup)
- **5-module role-based system**: User/Dispatcher, Admin, Police, Ambulance, Hospital (each with dedicated dashboard and sidebar navigation)
- **Signup page** with 3-step wizard (Personal Info → Role/City Selection → Organization Details) supporting 6 roles
- Full PostgreSQL database with seeded data across 4 cities
- Complete REST API for all entities (cameras, contacts, alerts, videos, settings, conversations, users)
- Dark mode by default with emergency-themed colors (red for alerts, green for success, amber for warnings)
- AI chat assistant powered by OpenAI GPT-4o
- **Replit Auth integration** with user authentication and role-based routing
- **Landing page** for logged-out users with features showcase
- **SAFEROUTE CM branding** with ShieldCheck logo
- **Minimalist theme toggle** with 500ms spinning rotation animation on moon/sun icons
- **Twilio integration** for SMS and Voice call alerts
- **RealRider-style crash notification** with red gradient, countdown timer, auto-send GPS/crash data to paramedics
- **Real driving footage** in live monitoring (YouTube embedded Cameroon road footage)
- **Role-specific dashboards** with dedicated sidebar navigation per role
- **Role-based default routing**: Each role lands on their specific dashboard at /

## Tech Stack
- **Frontend**: React, TypeScript, TanStack Query, Wouter routing, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o for chat assistant
- **Detection**: YOLOv8 simulation (actual model integration would require Python backend)

## Project Architecture

### Frontend Structure (`client/src/`)
```
├── App.tsx                 # Main app with routing and sidebar
├── components/
│   ├── app-sidebar.tsx     # Navigation sidebar
│   ├── theme-toggle.tsx    # Dark/light mode toggle
│   └── ui/                 # Shadcn UI components
├── lib/
│   ├── queryClient.ts      # TanStack Query configuration
│   └── theme-provider.tsx  # Theme context provider
├── pages/
│   ├── dashboard.tsx       # Main dashboard with stats
│   ├── upload.tsx          # Video/image upload
│   ├── live-monitoring.tsx # Live CCTV feeds
│   ├── alerts.tsx          # Alert management with countdown
│   ├── map-view.tsx        # Geographic view of cameras/alerts
│   ├── cameras.tsx         # Camera CRUD management
│   ├── contacts.tsx        # Emergency contacts management
│   ├── analytics.tsx       # Detection statistics
│   ├── ai-assistant.tsx    # AI chat interface
│   ├── settings.tsx        # System configuration
│   ├── signup.tsx          # 3-step signup wizard
│   ├── landing.tsx         # Landing page for logged-out users
│   ├── responders-dashboard.tsx # Unified emergency responders (Police, Fire, Ambulance)
│   └── hospital-dashboard.tsx  # Hospital incoming patient preparation
```

### Backend Structure (`server/`)
```
├── index.ts                # Express server setup
├── db.ts                   # Database connection
├── storage.ts              # Data access layer (IStorage interface)
├── routes.ts               # API endpoints
├── seed.ts                 # Database seeding script
└── vite.ts                 # Vite development server
```

### Shared (`shared/`)
```
└── schema.ts               # Drizzle schema and Zod validation
```

## Database Schema

### Tables
1. **cameras** - CCTV camera locations with GPS coordinates
2. **contacts** - Emergency responders (ambulance, police, fire, medical, dispatcher)
3. **alerts** - Detected accidents with status, severity, confidence
4. **videos** - Uploaded video files for analysis
5. **settings** - System configuration key-value pairs
6. **conversations** - AI chat sessions
7. **messages** - AI chat messages
8. **detection_logs** - Detection analytics data

## API Endpoints

### Cameras
- `GET /api/cameras` - List all cameras
- `GET /api/cameras/:id` - Get camera by ID
- `POST /api/cameras` - Create camera
- `PATCH /api/cameras/:id` - Update camera
- `DELETE /api/cameras/:id` - Delete camera

### Contacts
- `GET /api/contacts` - List all contacts
- `GET /api/contacts/:id` - Get contact by ID
- `POST /api/contacts` - Create contact
- `PATCH /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Alerts
- `GET /api/alerts` - List all alerts
- `GET /api/alerts/:id` - Get alert by ID
- `POST /api/alerts` - Create alert
- `PATCH /api/alerts/:id` - Update alert status
- `POST /api/alerts/:id/send` - Send alert to responders
- `DELETE /api/alerts/:id` - Delete alert

### Videos
- `GET /api/videos` - List all videos
- `POST /api/videos/upload` - Upload video
- `POST /api/videos/:id/process` - Start video processing
- `DELETE /api/videos/:id` - Delete video

### Conversations (AI Assistant)
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/conversations` - Create conversation
- `POST /api/conversations/:id/messages` - Send message (SSE streaming)
- `DELETE /api/conversations/:id` - Delete conversation

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Save settings

## Key Features

### Alert System
- 10-second countdown timer before auto-sending alerts
- SMS, Email, and Voice call notification options
- Severity levels: High (red), Medium (amber), Low (green)
- Status tracking: Pending, Acknowledged, Resolved, False Alarm
- Sound alerts with mute option

### Detection Simulation
- Simulated accident detection for demo purposes
- Configurable confidence threshold (default 90%)
- YOLOv8 model selection (Nano, Small, Medium, Large)

### Analytics Dashboard
- Detection accuracy metrics (Precision, Recall, F1 Score)
- Alerts by type and severity distribution
- Camera-based alert statistics
- Time-based filtering (24h, 7d, 30d, 90d)

## User Preferences
- Default theme: Dark mode
- Emergency color scheme with red/amber/green status indicators
- Inter font family for professional appearance

## Running the Project
```bash
npm run dev          # Start development server
npm run db:push      # Push schema to database
npx tsx server/seed.ts  # Seed initial data
```

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `OPENAI_API_KEY` - OpenAI API key for AI assistant (optional)
- `SESSION_SECRET` - Session secret (auto-configured)

## Recent Changes
- Initial MVP implementation with all 10 pages
- Database schema with cameras, contacts, alerts, videos, settings, conversations, messages, detection_logs
- Seeded data with 5 cameras, 5 contacts, 3 sample alerts
- Dark mode theme with emergency color palette
- AI assistant with streaming responses (requires OpenAI API key)
- **Feb 2026**: Added Replit Auth integration with users/sessions tables
- **Feb 2026**: Renamed app to SAFEROUTE CM with ShieldCheck branding
- **Feb 2026**: Created landing page for logged-out users
- **Feb 2026**: Implemented minimalist theme toggle with 500ms spin animation
- **Feb 2026**: Added user profile display in header with logout button
- **Feb 2026**: Expanded to 4 cities with 15 cameras (Yaounde 5, Douala 4, Bamenda 3, Buea 3)
- **Feb 2026**: Created 3-step signup wizard with role selection (Dispatcher, Police, Ambulance, Fire)
- **Feb 2026**: Added role-specific dashboards with unique themes (Police indigo, Ambulance red, Fire orange)
- **Feb 2026**: Implemented AccidentNotificationManager with beep sound, 10-second countdown, and cancel for false alarms
- **Feb 2026**: Added Twilio integration for SMS and Voice alerts (phone: +18205008081)
- **Feb 2026**: Added idempotency checks for alert sending and cancel persists to database
- **Mar 2026**: Added 27 real Cameroon hospitals/emergency contacts across 4 cities
- **Mar 2026**: Redesigned crash notification to RealRider-style with red gradient and auto-send GPS/crash data
- **Mar 2026**: Replaced simulated camera feeds with real YouTube traffic footage
- **Mar 2026**: Enhanced alert descriptions with detailed AI incident summaries
- **Mar 2026**: Video upload now always triggers detection (guaranteed for demo)
- **Mar 2026**: Unified responders dashboard (Police, Fire, Ambulance share one view) + Hospital dashboard
- **Mar 2026**: Auto-call emergency services via Twilio immediately on accident detection (no delay)
- **Mar 2026**: Replaced canvas simulated feeds with realistic CCTV simulation (intersection/highway/roundabout/bridge scenes)
- **Mar 2026**: Added "hospital" contact role for hospitals to receive alerts and prepare for patients
- **Mar 2026**: Implemented 5-module role-based system (User, Admin, Police, Ambulance, Hospital)
- **Mar 2026**: Created dedicated Police Dashboard with date-filtered accident view
- **Mar 2026**: Created dedicated Ambulance Dashboard with Google Maps navigation and pickup/drop status
- **Mar 2026**: Enhanced Hospital Dashboard with admission status, accident history, and ambulance management
- **Mar 2026**: Created Admin Dashboard with hospital/ambulance CRUD, user management, and accident overview
- **Mar 2026**: Added role-based sidebar navigation (each role sees only relevant menu items)
- **Mar 2026**: Added role-based default routing (each role lands on their specific dashboard)
- **Mar 2026**: Added GET /api/users endpoint for admin user management
- **Mar 2026**: Updated auth storage to preserve role/city when merging signup data with Replit Auth
