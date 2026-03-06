# THE REPUBLIC OF CAMEROON
## PEACE - WORK - FATHERLAND
### MINISTRY OF HIGHER EDUCATION
### THE ICT UNIVERSITY, YAOUNDE

# LA REPUBLIQUE DU CAMEROUN
## PAIX - TRAVAIL - PATRIE
### MINISTERE DE L'ENSEIGNEMENT SUPERIEURE
### THE ICT UNIVERSITY, YAOUNDE

---

A dissertation presented and submitted in partial fulfillment of the requirement for the degree of a Master of Science in Information Technology.

**Research Topic:** Design and Implementation of an AI-Powered Road Accident Detection and Emergency Alert System Using CCTV and GPS Data (SAFE ROUTE CM)

**BY:** SANGBONG ATUNGSIRI AWAH

**Registration Number:** ICTU20241865

**Email:** sangbong.awah@ictuniversity.edu.cm

**Supervised by:** Dr Pascal Nkandeu

---

## DECLARATION

I, Sangbong Atungsiri Awah, declare that this thesis entitled "Design and Implementation of an AI-Powered Road Accident Detection and Emergency Alert System Using CCTV and GPS Data (SAFE-ROUTE CM)" is my original work. It is submitted in partial fulfillment of the requirements for the degree of Master of Science in Information Technology at The ICT University. This thesis has not been submitted in whole or in part for any other degree or professional qualification at this or any other institution.

The research reported in this thesis was conducted at The ICT University under the supervision of Dr. Pascal Nkandeu. All sources of information and assistance received in the preparation of this work have been duly acknowledged in accordance with academic standards. I understand that any form of plagiarism or academic dishonesty may result in the rejection of this thesis and the application of disciplinary measures by the university.

Signed: __________________________                    Date: _____________________

Name: Sangbong Atungsiri Awah

Registration Number: ICTU20241865

---

## CERTIFICATION

This is to certify that the thesis entitled "SAFEROUTE CM: An AI-Powered Road Accident Detection and Emergency Alert System Using YOLOv8 and Deep Learning for Enhanced Road Safety in Cameroon" submitted by Sangbong Atungsiri Awah in partial fulfillment of the requirements for the award of the degree of Master of Science in Information Technology at The ICT University has been carried out under my supervision and is approved for submission.

Signed: __________________                              Date: _____________________

Name: Dr. NKANDEU PASCAL

---

## Academic Committee Approval

This thesis has been duly completed under the supervision of ICT University Research Academic Committee and is ready for examination with our approval.

Approved by

Signature __________________ Date __________________

Chairperson

Signature __________________ Date __________________

Dr. Nkandeu Pascal, Supervisor

Signature __________________ Date __________________

Examiner

Signature __________________ Date __________________

Committee Member

Signature __________________ Date __________________

Dr. Nkandeu Pascal, Dean

---

## DEDICATION

This thesis is dedicated to:

My beloved parents, whose unwavering support, sacrifices, and encouragement have been the foundation of my academic journey. Your belief in my abilities has been my greatest motivation.

The memory of all victims of road accidents in Cameroon and across Africa. May this work contribute to saving lives and reducing the devastating impact of road traffic accidents on families and communities.

All road safety advocates, emergency responders, and healthcare workers who work tirelessly to protect lives on our roads. Your dedication inspires this research.

The future of Cameroon and Africa, with the hope that technology and innovation will continue to improve the quality of life and safety for all citizens.

---

## ACKNOWLEDGEMENT

I wish to express my deepest gratitude to my supervisor, Dr. Pascal Nkandeu, for his invaluable guidance, patience, and continuous support throughout this research. His expertise in information and communication technologies, systems development, and research methodology greatly shaped and strengthened this work.

My sincere thanks also go to the faculty and staff of The ICT University for providing a conducive learning environment and the necessary academic and institutional support. I am grateful to my classmates and colleagues for their helpful discussions and encouragement during the course of this study.

Finally, I extend heartfelt appreciation to my parents and siblings for their love, prayers, and understanding during the many long hours devoted to study and research. Their belief in my abilities has been a constant source of motivation.

---

## Abstract

Road traffic accidents constitute a major public health crisis in Cameroon and across sub-Saharan Africa, claiming thousands of lives annually and causing significant economic losses. The World Health Organization reports that Cameroon has one of the highest road traffic fatality rates in Africa, with delayed emergency response being a critical factor contributing to preventable deaths. Traditional accident detection methods rely heavily on manual observation or citizen reports, leading to significant delays in emergency response times. This research aims to design, develop, and evaluate an AI-powered road accident detection and emergency alert system (SAFEROUTE CM) that utilizes deep learning techniques, specifically the YOLOv8 object detection algorithm combined with DeepSORT tracking, to automatically detect road accidents from CCTV camera feeds and dispatch emergency alerts to responders in real-time. The study employs a design science research methodology combined with an experimental approach. The system architecture integrates a React-based web application frontend, Node.js/Express backend, PostgreSQL database, and AI-powered detection module. The detection pipeline utilizes YOLOv8 for vehicle detection and collision analysis, with DeepSORT for multi-object tracking. Alert notifications are dispatched through Twilio's SMS and Voice APIs. The system was deployed and tested across four major cities in Cameroon: Yaounde, Douala, Bamenda, and Buea, with 15 CCTV camera integration points. The implemented SAFEROUTE CM system achieved an F1-Score of 87.2% for accident detection (precision 89.5%, recall 85.0%), with an overall accuracy of 90.0% and an AUC-ROC of 0.94. The average end-to-end time-to-alert was 11.8 seconds from accident detection to emergency notification delivery. SMS delivery succeeded in 97.1% of attempts and email delivery in 94.1%. Video processing was conducted at 24.3 frames per second with GPU acceleration. Comparative analysis showed the system achieves performance competitive with state-of-the-art systems while operating on offline CCTV footage with modest hardware requirements suitable for resource-constrained environments. SAFEROUTE CM represents a significant advancement in road safety technology for Cameroon, offering an automated, scalable, and cost-effective solution for accident detection and emergency response coordination. The system's successful implementation demonstrates the feasibility of applying advanced AI technologies to address real-world road safety challenges in developing countries. Future work includes training on local Cameroonian road data, integration with national emergency response networks, development of a companion mobile application, and expansion to cover additional urban and rural areas across the country.

**Keywords:** Road accident detection, YOLOv8, Deep learning, Emergency alert system, Computer vision, Road safety, Cameroon, CCTV surveillance, Real-time detection, Emergency response

---

## List of Figures

- Figure 1.1: Road Traffic Deaths per 100,000 Population in Africa
- Figure 2.1: Evolution of YOLO Object Detection Architecture (2016-2023)
- Figure 2.2: YOLOv8 Network Architecture showing Backbone, Neck, and Detection Head
- Figure 2.3: DeepSORT Multi-Object Tracking Pipeline
- Figure 2.4: Conceptual Framework for SAFEROUTE CM
- Figure 3.1: Design Science Research Methodology Flowchart
- Figure 3.2: SAFEROUTE CM Three-Tier System Architecture
- Figure 3.3: Database Entity-Relationship Diagram for SAFEROUTE CM
- Figure 3.4: UML Use Case Diagram for SAFEROUTE CM
- Figure 3.5: UML Sequence Diagram for Accident Detection and Alert Flow
- Figure 3.6: UML Sequence Diagram for Emergency Alert Dispatch
- Figure 3.7: UML Class Diagram for SAFEROUTE CM
- Figure 4.1: SAFEROUTE CM Detection Pipeline
- Figure 4.2: SAFEROUTE CM Landing Page with Hero Section and Feature Showcase
- Figure 4.3: Three-Step Signup Wizard (Personal Info, Role/City Selection, Organization Details)
- Figure 4.4: SAFEROUTE CM Main Dashboard with Statistics Cards and Quick Actions
- Figure 4.5: Live Monitoring Page with Camera Feed Grid and Detection Overlays
- Figure 4.6: Alert Management Page with Severity Indicators and Action Buttons
- Figure 4.7: Accident Notification Popup with 10-Second Countdown Timer
- Figure 4.8: SMS Emergency Alert Notification with Google Maps Navigation Link
- Figure 4.9: Map View with Leaflet/OpenStreetMap Showing Camera and Alert Markers
- Figure 4.10: Upload and Media Processing Interface with Drag-and-Drop Zone
- Figure 4.11: Camera Management Page with GPS Coordinates and CRUD Actions
- Figure 4.12: Emergency Contacts Management Page with Role Badges
- Figure 4.13: Police Dashboard with Indigo Theme and Incident Management
- Figure 4.14: Ambulance Dashboard with Emergency Red Theme and Unit Tracking
- Figure 4.15: Fire Department Dashboard with Orange Theme and Fleet Status
- Figure 4.16: Analytics Dashboard with Detection Metrics and Alert Distribution
- Figure 4.17: AI Assistant Chat Interface with Conversation History
- Figure 4.18: Settings Configuration Page with Detection and Notification Controls
- Figure 4.19: Detection Accuracy Visualization with Precision, Recall, and F1 Score Metrics
- Figure 4.20: Time-to-Alert Distribution Analysis
- Figure 4.21: User Acceptance Testing Satisfaction Scores Across Five Dimensions

---

## List of Tables

- Table 2.1: Road Traffic Accident Statistics in Cameroon (2019-2023)
- Table 2.2: Comparison of YOLOv8 Model Variants
- Table 2.3: Summary of Existing Accident Detection Systems
- Table 2.4: Literature Review Summary Matrix
- Table 3.1: System Requirements Specification (Functional)
- Table 3.2: Non-Functional Requirements Specification
- Table 3.3: Development Tools and Technologies
- Table 4.1: Implementation Environment Specifications
- Table 4.2: Functional Testing Results
- Table 4.3: Detection Performance Metrics (Confusion Matrix and Derived Metrics)
- Table 4.4: Time-to-Alert Performance Statistics
- Table 4.5: Comparison of SAFEROUTE CM with Related Systems
- Table 4.6: User Acceptance Testing Results

---

## LIST OF ACRONYMS AND ABBREVIATIONS

- **ACID:** Atomicity, Consistency, Isolation, Durability
- **AI:** Artificial Intelligence
- **API:** Application Programming Interface
- **AUC:** Area Under the Curve
- **CADP:** Car Accident Detection and Prediction (Dataset)
- **CCTV:** Closed-Circuit Television
- **CNN:** Convolutional Neural Network
- **CPU:** Central Processing Unit
- **CRUD:** Create, Read, Update, Delete
- **CSS:** Cascading Style Sheets
- **CV:** Computer Vision
- **DBMS:** Database Management System
- **DL:** Deep Learning
- **DOM:** Document Object Model
- **DSR:** Design Science Research
- **EMS:** Emergency Medical Services
- **FPS:** Frames Per Second
- **GPS:** Global Positioning System
- **GPU:** Graphics Processing Unit
- **GUI:** Graphical User Interface
- **HTML:** Hypertext Markup Language
- **HTTP:** Hypertext Transfer Protocol
- **ICT:** Information and Communication Technology
- **IoT:** Internet of Things
- **IoU:** Intersection over Union
- **JSON:** JavaScript Object Notation
- **mAP:** Mean Average Precision
- **ML:** Machine Learning
- **MVC:** Model-View-Controller
- **MVP:** Minimum Viable Product
- **OIDC:** OpenID Connect
- **ORM:** Object-Relational Mapping
- **ONNX:** Open Neural Network Exchange
- **R-CNN:** Region-based Convolutional Neural Network
- **REST:** Representational State Transfer
- **ROC:** Receiver Operating Characteristic
- **SMS:** Short Message Service
- **SMTP:** Simple Mail Transfer Protocol
- **SQL:** Structured Query Language
- **SSE:** Server-Sent Events
- **SSD:** Single Shot MultiBox Detector
- **TAM:** Technology Acceptance Model
- **TLS:** Transport Layer Security
- **UAT:** User Acceptance Testing
- **UI:** User Interface
- **UML:** Unified Modeling Language
- **URL:** Uniform Resource Locator
- **UX:** User Experience
- **WHO:** World Health Organization
- **YOLO:** You Only Look Once
- **YOLOv8:** You Only Look Once Version 8
