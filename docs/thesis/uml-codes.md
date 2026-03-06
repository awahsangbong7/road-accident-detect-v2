# SAFEROUTE CM - UML Diagram Codes

Use these codes with PlantUML (https://www.plantuml.com/plantuml/uml/) or any PlantUML-compatible tool to generate the diagrams yourself.

---

## 1. ER Diagram (Fig 3.3)

```plantuml
@startuml
skinparam linetype ortho

entity "users" as users {
  * id : serial <<PK>>
  --
  username : varchar
  email : varchar
  first_name : varchar
  last_name : varchar
  role : varchar
  city : varchar
  organization : varchar
  phone : varchar
  created_at : timestamp
}

entity "cameras" as cameras {
  * id : serial <<PK>>
  --
  name : varchar
  location : varchar
  city : varchar
  latitude : numeric
  longitude : numeric
  status : varchar
  stream_url : varchar
  created_at : timestamp
}

entity "contacts" as contacts {
  * id : serial <<PK>>
  --
  name : varchar
  role : varchar
  phone : varchar
  email : varchar
  city : varchar
  organization : varchar
  is_active : boolean
  created_at : timestamp
}

entity "alerts" as alerts {
  * id : serial <<PK>>
  --
  type : varchar
  location : varchar
  severity : varchar
  confidence : numeric
  status : varchar
  camera_id : integer <<FK>>
  description : text
  sent : boolean
  sent_at : timestamp
  cancelled : boolean
  created_at : timestamp
}

entity "videos" as videos {
  * id : serial <<PK>>
  --
  filename : varchar
  original_name : varchar
  size : integer
  status : varchar
  detection_count : integer
  uploaded_by : integer <<FK>>
  created_at : timestamp
}

entity "conversations" as conversations {
  * id : serial <<PK>>
  --
  title : varchar
  created_at : timestamp
}

entity "messages" as messages {
  * id : serial <<PK>>
  --
  conversation_id : integer <<FK>>
  role : varchar
  content : text
  created_at : timestamp
}

entity "detection_logs" as detection_logs {
  * id : serial <<PK>>
  --
  camera_id : integer <<FK>>
  type : varchar
  confidence : numeric
  model_used : varchar
  processing_time : numeric
  created_at : timestamp
}

entity "settings" as settings {
  * key : varchar <<PK>>
  --
  value : text
}

cameras ||--o{ alerts : "generates"
cameras ||--o{ detection_logs : "logs"
conversations ||--o{ messages : "contains"
users ||--o{ videos : "uploads"

@enduml
```

---

## 2. Use Case Diagram (Fig 3.4)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Dispatcher" as dispatcher
actor "Police Officer" as police
actor "Ambulance Staff" as ambulance
actor "Fire Department" as fire
actor "System Admin" as admin

rectangle "SAFEROUTE CM" {
  usecase "View Dashboard" as UC1
  usecase "Monitor Live Feeds" as UC2
  usecase "Manage Cameras" as UC3
  usecase "View Alerts" as UC4
  usecase "Acknowledge Alert" as UC5
  usecase "Send Emergency\nNotification" as UC6
  usecase "Cancel False Alarm" as UC7
  usecase "Upload Video" as UC8
  usecase "Process Video\nfor Detection" as UC9
  usecase "View Analytics" as UC10
  usecase "Chat with\nAI Assistant" as UC11
  usecase "Manage Contacts" as UC12
  usecase "Configure Settings" as UC13
  usecase "View Map" as UC14
  usecase "Sign Up / Login" as UC15
  usecase "View Role Dashboard" as UC16
  usecase "Simulate Detection" as UC17
}

dispatcher --> UC1
dispatcher --> UC2
dispatcher --> UC3
dispatcher --> UC4
dispatcher --> UC5
dispatcher --> UC6
dispatcher --> UC7
dispatcher --> UC8
dispatcher --> UC10
dispatcher --> UC11
dispatcher --> UC12
dispatcher --> UC14
dispatcher --> UC17

police --> UC15
police --> UC16
police --> UC4
police --> UC5

ambulance --> UC15
ambulance --> UC16
ambulance --> UC4
ambulance --> UC5

fire --> UC15
fire --> UC16
fire --> UC4
fire --> UC5

admin --> UC13
admin --> UC3
admin --> UC12

UC8 ..> UC9 : <<include>>
UC6 ..> UC4 : <<extend>>

@enduml
```

---

## 3. Sequence Diagram - Accident Detection (Fig 3.5)

```plantuml
@startuml
skinparam sequenceMessageAlign center

actor "CCTV Camera" as camera
participant "Video Stream\nProcessor" as processor
participant "YOLOv8\nDetection Model" as yolo
participant "Alert\nManager" as alertmgr
database "PostgreSQL\nDatabase" as db
participant "Notification\nPopup (UI)" as popup

camera -> processor : Send video frame
processor -> yolo : Process frame\nfor detection
yolo -> yolo : Analyze objects\n(vehicles, pedestrians)
yolo -> processor : Detection result\n(type, confidence, bbox)

alt Accident Detected (confidence >= threshold)
    processor -> alertmgr : Create alert\n(type, location, severity)
    alertmgr -> db : INSERT alert record\n(status: pending)
    db --> alertmgr : Alert ID
    alertmgr -> popup : Display notification\nwith countdown (10s)
    popup -> popup : Play beep sound\nStart countdown timer
    
    alt User cancels (false alarm)
        popup -> alertmgr : Cancel alert
        alertmgr -> db : UPDATE alert\n(status: false_alarm,\ncancelled: true)
    else Countdown expires OR user clicks Send
        popup -> alertmgr : Send alert
        alertmgr -> db : UPDATE alert\n(status: sent, sent: true)
    end
    
else No Accident Detected
    processor -> processor : Continue monitoring\nnext frame
end

@enduml
```

---

## 4. Sequence Diagram - Alert Dispatch (Fig 3.6)

```plantuml
@startuml
skinparam sequenceMessageAlign center

participant "Alert\nManager" as alertmgr
database "PostgreSQL\nDatabase" as db
participant "Contact\nService" as contacts
participant "Twilio\nSMS API" as sms
participant "Twilio\nVoice API" as voice
actor "Emergency\nResponder" as responder

alertmgr -> db : Fetch alert details\n(type, location, severity)
db --> alertmgr : Alert data

alertmgr -> db : Check idempotency\n(alert already sent?)
db --> alertmgr : Not yet sent

alertmgr -> contacts : Get contacts\nfor alert city
contacts -> db : SELECT contacts\nWHERE city = alert.city\nAND is_active = true
db --> contacts : Contact list
contacts --> alertmgr : Active contacts

loop For each contact
    alt SMS enabled in settings
        alertmgr -> sms : Send SMS\n(to: contact.phone,\nbody: alert details)
        sms --> alertmgr : Message SID\n(delivery confirmed)
        sms -> responder : SMS received
    end
    
    alt Voice enabled in settings
        alertmgr -> voice : Initiate call\n(to: contact.phone,\ntwiml: alert message)
        voice --> alertmgr : Call SID\n(call initiated)
        voice -> responder : Voice call received
    end
end

alertmgr -> db : UPDATE alert\n(sent: true, sent_at: now())
db --> alertmgr : Confirmed

@enduml
```

---

## 5. Class Diagram (Fig 3.7)

```plantuml
@startuml
skinparam classAttributeIconSize 0

class User {
  +id: number
  +username: string
  +email: string
  +firstName: string
  +lastName: string
  +role: string
  +city: string
  +organization: string
  +phone: string
  +createdAt: Date
  --
  +signup(): void
  +login(): void
  +logout(): void
}

class Camera {
  +id: number
  +name: string
  +location: string
  +city: string
  +latitude: number
  +longitude: number
  +status: string
  +streamUrl: string
  --
  +activate(): void
  +deactivate(): void
  +getFeed(): VideoStream
}

class Alert {
  +id: number
  +type: string
  +location: string
  +severity: string
  +confidence: number
  +status: string
  +cameraId: number
  +sent: boolean
  +cancelled: boolean
  --
  +acknowledge(): void
  +resolve(): void
  +markFalseAlarm(): void
  +sendNotification(): void
}

class Contact {
  +id: number
  +name: string
  +role: string
  +phone: string
  +email: string
  +city: string
  +organization: string
  +isActive: boolean
  --
  +notifyBySMS(): void
  +notifyByVoice(): void
  +notifyByEmail(): void
}

class Video {
  +id: number
  +filename: string
  +originalName: string
  +size: number
  +status: string
  +detectionCount: number
  --
  +upload(): void
  +process(): void
  +getResults(): Detection[]
}

class DetectionEngine {
  +model: string
  +confidenceThreshold: number
  --
  +processFrame(frame): Detection
  +processVideo(video): Detection[]
  +setModel(model): void
  +setThreshold(value): void
}

class NotificationService {
  +twilioSid: string
  +twilioToken: string
  +fromPhone: string
  --
  +sendSMS(to, message): void
  +makeVoiceCall(to, message): void
  +sendEmail(to, subject, body): void
}

class Conversation {
  +id: number
  +title: string
  +createdAt: Date
  --
  +addMessage(content): Message
  +getHistory(): Message[]
}

class Message {
  +id: number
  +conversationId: number
  +role: string
  +content: string
  +createdAt: Date
}

Camera "1" --> "*" Alert : generates
Camera "1" --> "*" DetectionEngine : feeds into
Alert "*" --> "*" Contact : notifies
Alert --> NotificationService : uses
Video --> DetectionEngine : processed by
User "1" --> "*" Video : uploads
Conversation "1" --> "*" Message : contains

@enduml
```

---

## 6. System Architecture Diagram (Fig 3.2)

```plantuml
@startuml
skinparam componentStyle rectangle

package "Frontend (React + TypeScript)" {
  [Dashboard Pages] as dashboard
  [Live Monitoring] as live
  [Alert Management] as alertui
  [Role Dashboards] as roles
  [AI Assistant Chat] as chat
  [Map View] as map
  [Analytics] as analytics
}

package "Backend (Node.js + Express)" {
  [REST API Routes] as api
  [Authentication\n(Replit Auth / OIDC)] as auth
  [Detection Simulation\n(YOLOv8 Simulation)] as detection
  [Alert Processing\nEngine] as alertengine
  [AI Chat Service\n(Google Gemini)] as ai
}

package "External Services" {
  [Twilio SMS API] as twilio_sms
  [Twilio Voice API] as twilio_voice
  [Google Gemini API] as gemini
}

database "PostgreSQL" as db {
  [users]
  [cameras]
  [alerts]
  [contacts]
  [videos]
  [conversations]
  [messages]
  [detection_logs]
  [settings]
}

dashboard --> api
live --> api
alertui --> api
roles --> api
chat --> api
map --> api
analytics --> api

api --> auth
api --> detection
api --> alertengine
api --> ai

alertengine --> twilio_sms
alertengine --> twilio_voice
ai --> gemini

api --> db
auth --> db
detection --> db
alertengine --> db

@enduml
```

---

## 7. Research Methodology Flowchart (Fig 3.1)

```plantuml
@startuml
start

:Literature Review;
note right
  Road safety in Cameroon
  Computer vision for detection
  Emergency alert systems
  YOLOv8 and DeepSORT
end note

:Problem Identification;
note right
  Slow accident response
  Manual detection methods
  No automated alert system
end note

:Requirements Analysis;
note right
  Stakeholder interviews
  System requirements
  Functional specifications
end note

:System Design;
note right
  Architecture design
  Database schema
  UML diagrams
  UI/UX mockups
end note

:Implementation;
note right
  Frontend (React + TypeScript)
  Backend (Node.js + Express)
  Database (PostgreSQL)
  AI Integration (Gemini)
  Alert System (Twilio)
end note

:Testing & Evaluation;
note right
  Unit testing
  Integration testing
  Detection accuracy testing
  User acceptance testing
end note

:Results Analysis;
note right
  Performance metrics
  Response time analysis
  User satisfaction survey
  Comparison with traditional methods
end note

:Documentation;
note right
  Thesis writing
  Visual documentation
  References compilation
end note

stop

@enduml
```

---

## How to Generate These Diagrams

### Option 1: PlantUML Online Server
1. Go to https://www.plantuml.com/plantuml/uml/
2. Paste the code (without the ```plantuml wrapper)
3. Click "Submit" to generate the diagram
4. Right-click the image to save as PNG

### Option 2: VS Code Extension
1. Install "PlantUML" extension in VS Code
2. Create a `.puml` file with the code
3. Press Alt+D to preview
4. Export as PNG/SVG

### Option 3: draw.io / diagrams.net
1. Go to https://app.diagrams.net/
2. Use Extras > PlantUML to import the code
3. Edit and export as needed

### Option 4: IntelliJ / JetBrains IDE
1. Install PlantUML Integration plugin
2. Create `.puml` files
3. Preview and export directly
