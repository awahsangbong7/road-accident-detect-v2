# APPENDICES

## Appendix A: System API Endpoints

The following table documents the complete REST API endpoints implemented in the SAFEROUTE CM backend server.

### Camera Management API

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | /api/cameras | List all cameras | None | Array of camera objects |
| GET | /api/cameras/:id | Get camera by ID | None | Camera object |
| POST | /api/cameras | Create new camera | Camera data (name, location, lat, lng, city, status) | Created camera object |
| PATCH | /api/cameras/:id | Update camera | Partial camera data | Updated camera object |
| DELETE | /api/cameras/:id | Delete camera | None | Success message |

### Contact Management API

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | /api/contacts | List all contacts | None | Array of contact objects |
| GET | /api/contacts/:id | Get contact by ID | None | Contact object |
| POST | /api/contacts | Create new contact | Contact data (name, role, phone, email, city) | Created contact object |
| PATCH | /api/contacts/:id | Update contact | Partial contact data | Updated contact object |
| DELETE | /api/contacts/:id | Delete contact | None | Success message |

### Alert Management API

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | /api/alerts | List all alerts | None | Array of alert objects |
| GET | /api/alerts/:id | Get alert by ID | None | Alert object |
| POST | /api/alerts | Create new alert | Alert data (type, severity, location, cameraId) | Created alert object |
| PATCH | /api/alerts/:id | Update alert status | Status update data | Updated alert object |
| POST | /api/alerts/:id/send | Send alert notifications | Notification preferences | Delivery status |
| DELETE | /api/alerts/:id | Delete alert | None | Success message |

### Video Processing API

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | /api/videos | List all videos | None | Array of video objects |
| POST | /api/videos/upload | Upload video file | Multipart form data | Created video object |
| POST | /api/videos/:id/process | Start AI processing | Processing parameters | Processing status |
| DELETE | /api/videos/:id | Delete video | None | Success message |

### AI Assistant API

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | /api/conversations | List conversations | None | Array of conversation objects |
| GET | /api/conversations/:id | Get conversation with messages | None | Conversation with messages |
| POST | /api/conversations | Create conversation | Title | Created conversation |
| POST | /api/conversations/:id/messages | Send message (SSE streaming) | Message content | Streamed AI response |
| DELETE | /api/conversations/:id | Delete conversation | None | Success message |

### System Settings API

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | /api/settings | Get all settings | None | Settings key-value pairs |
| PUT | /api/settings | Save settings | Settings object | Updated settings |

## Appendix B: Database Schema

The following Drizzle ORM schema definitions describe the complete database structure used by SAFEROUTE CM.

### Users Table
- id: Serial primary key
- username: Unique text, not null
- password: Text, not null (hashed)
- role: Text (dispatcher, police, ambulance, fire)
- city: Text
- organization: Text
- createdAt: Timestamp with default

### Cameras Table
- id: Serial primary key
- name: Text, not null
- location: Text, not null
- latitude: Double precision
- longitude: Double precision
- city: Text
- status: Text (active, inactive, maintenance)
- streamUrl: Text

### Contacts Table
- id: Serial primary key
- name: Text, not null
- role: Text (ambulance, police, fire, medical, dispatcher)
- phone: Text
- email: Text
- city: Text

### Alerts Table
- id: Serial primary key
- type: Text (collision, rollover, pedestrian, multi-vehicle)
- severity: Text (high, medium, low)
- status: Text (pending, acknowledged, resolved, false_alarm)
- confidence: Double precision
- location: Text
- latitude: Double precision
- longitude: Double precision
- cameraId: Integer (foreign key to cameras)
- description: Text
- alertSent: Boolean
- alertSentAt: Timestamp
- createdAt: Timestamp with default

### Videos Table
- id: Serial primary key
- filename: Text, not null
- originalName: Text
- status: Text (uploaded, processing, completed, failed)
- detectionResults: JSON
- uploadedAt: Timestamp with default

### Detection Logs Table
- id: Serial primary key
- videoId: Integer (foreign key to videos)
- frameNumber: Integer
- objectsDetected: Integer
- accidentDetected: Boolean
- confidence: Double precision
- processingTime: Double precision
- timestamp: Timestamp with default

## Appendix C: Sample Alert SMS Content

The following is a sample SMS alert message generated by SAFEROUTE CM upon accident detection:

```
SAFEROUTE CM - EMERGENCY ALERT

Accident Detected!
Type: Vehicle Collision
Severity: HIGH
Location: Carrefour Warda, Yaounde
GPS: 3.8480°N, 11.5021°E
Camera: CAM-YDE-001
Time: 2026-02-06 14:23:45 UTC
Confidence: 92.3%

Respond immediately. View details at:
https://saferoute-cm.replit.app/alerts/42
```

## Appendix D: Glossary of Technical Terms

- **Anchor-free Detection:** An object detection approach that directly predicts object center points and sizes without relying on predefined anchor boxes, as used in YOLOv8.
- **Backbone Network:** The feature extraction component of an object detection model, responsible for processing input images into feature maps.
- **Data Association:** The process of matching detected objects in the current frame with existing tracks from previous frames in multi-object tracking.
- **Drizzle ORM:** A TypeScript-first Object-Relational Mapping library used for database interactions in the SAFEROUTE CM backend.
- **Feature Pyramid Network (FPN):** A multi-scale feature extraction architecture that enables detection of objects at different sizes.
- **Hungarian Algorithm:** An optimization algorithm used in SORT and DeepSORT for solving the assignment problem of matching detections to tracks.
- **Intersection over Union (IoU):** A metric measuring the overlap between predicted and ground-truth bounding boxes, calculated as the area of intersection divided by the area of union.
- **Kalman Filter:** A recursive mathematical algorithm used in DeepSORT to predict object positions in subsequent frames based on their motion dynamics.
- **Mean Average Precision (mAP):** A standard evaluation metric for object detection that averages precision across different recall levels and object classes.
- **Non-Maximum Suppression (NMS):** A post-processing technique that eliminates redundant overlapping detections, keeping only the most confident prediction for each detected object.
- **Re-identification (Re-ID):** The task of recognizing whether a detected object has been previously seen, using appearance features to maintain tracking identity across frames.
- **Transfer Learning:** A machine learning technique where a model pre-trained on a large dataset is fine-tuned on a smaller task-specific dataset, leveraging learned features to improve performance with limited training data.
