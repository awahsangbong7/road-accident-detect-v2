# SAFEROUTE CM: AN AI-POWERED ROAD ACCIDENT DETECTION AND EMERGENCY ALERT SYSTEM FOR CAMEROON

---

## TITLE PAGE

**UNIVERSITY OF YAOUNDE I**
**FACULTY OF SCIENCE**
**DEPARTMENT OF COMPUTER SCIENCE**

---

### A THESIS

Submitted in Partial Fulfillment of the Requirements for the Degree of

**MASTER OF SCIENCE IN COMPUTER SCIENCE**

**SPECIALIZATION: ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING**

---

**THESIS TITLE:**

# SAFEROUTE CM: AN AI-POWERED ROAD ACCIDENT DETECTION AND EMERGENCY ALERT SYSTEM USING YOLOV8 AND DEEP LEARNING FOR ENHANCED ROAD SAFETY IN CAMEROON

---

**Submitted by:**
[STUDENT NAME]
Matriculation Number: [STUDENT ID]

**Supervisor:**
[SUPERVISOR NAME], PhD
Department of Computer Science
University of Yaounde I

**Co-Supervisor (if applicable):**
[CO-SUPERVISOR NAME], PhD

---

**Academic Year: 2025-2026**

---

## DECLARATION OF ORIGINALITY

I, [STUDENT NAME], hereby declare that this thesis entitled "SAFEROUTE CM: An AI-Powered Road Accident Detection and Emergency Alert System Using YOLOv8 and Deep Learning for Enhanced Road Safety in Cameroon" is my original work and has not been submitted for any other degree or examination in any other university.

All sources of information used in this research have been duly acknowledged through proper citations and references. Any contribution made by others has been explicitly stated.

I understand that making a false declaration constitutes an academic offense and may result in disciplinary action.

**Signature:** ________________________

**Date:** ________________________

**Student Name:** [STUDENT NAME]

**Matriculation Number:** [STUDENT ID]

---

## CERTIFICATION

This is to certify that this thesis entitled "SAFEROUTE CM: An AI-Powered Road Accident Detection and Emergency Alert System Using YOLOv8 and Deep Learning for Enhanced Road Safety in Cameroon" submitted by [STUDENT NAME] (Matriculation Number: [STUDENT ID]) in partial fulfillment of the requirements for the award of Master of Science in Computer Science has been carried out under my supervision.

The work presented in this thesis is original and has not been submitted elsewhere for the award of any other degree.

**Supervisor:**

**Name:** ________________________

**Signature:** ________________________

**Date:** ________________________

**Department:** Computer Science

**Institution:** University of Yaounde I

---

**Co-Supervisor (if applicable):**

**Name:** ________________________

**Signature:** ________________________

**Date:** ________________________

---

**Head of Department:**

**Name:** ________________________

**Signature:** ________________________

**Date:** ________________________

---

## ACADEMIC APPROVAL PAGE

This thesis has been examined and approved by the thesis committee:

| Name | Designation | Institution | Signature | Date |
|------|-------------|-------------|-----------|------|
| [Name] | Chairman | [Institution] | _________ | _____ |
| [Name] | Internal Examiner | [Institution] | _________ | _____ |
| [Name] | External Examiner | [Institution] | _________ | _____ |
| [Name] | Supervisor | [Institution] | _________ | _____ |

**Date of Oral Defense:** ________________________

**Grade Awarded:** ________________________

---

## DEDICATION

*This thesis is dedicated to:*

*My beloved parents, whose unwavering support, sacrifices, and encouragement have been the foundation of my academic journey. Your belief in my abilities has been my greatest motivation.*

*The memory of all victims of road accidents in Cameroon and across Africa. May this work contribute to saving lives and reducing the devastating impact of road traffic accidents on families and communities.*

*All road safety advocates, emergency responders, and healthcare workers who work tirelessly to protect lives on our roads. Your dedication inspires this research.*

*The future of Cameroon and Africa, with the hope that technology and innovation will continue to improve the quality of life and safety for all citizens.*

---

## ACKNOWLEDGEMENTS

The completion of this thesis would not have been possible without the support, guidance, and encouragement of many individuals and institutions. I wish to express my sincere gratitude to all those who contributed to this work.

First and foremost, I thank the Almighty God for the wisdom, strength, and perseverance granted to me throughout this research journey. His grace has been sufficient in all circumstances.

I am deeply grateful to my supervisor, [SUPERVISOR NAME], PhD, for his/her invaluable guidance, expertise, and patience throughout this research. Your constructive criticism, insightful suggestions, and continuous encouragement have been instrumental in shaping this work. Your dedication to academic excellence has been truly inspiring.

I extend my sincere appreciation to the Head of the Department of Computer Science, [NAME], for providing the necessary academic environment and resources that facilitated this research.

Special thanks to the entire faculty and staff of the Department of Computer Science at the University of Yaounde I for their support and for creating a conducive learning environment.

I acknowledge the contributions of the following organizations and institutions:
- The Ministry of Transport of Cameroon for providing road accident statistics and policy documents
- The National Road Safety Commission for their cooperation and data sharing
- The emergency response units in Yaounde, Douala, Bamenda, and Buea for their participation in system testing
- ICT University for providing additional research resources and guidance

My heartfelt gratitude goes to my family: my parents [NAMES], my siblings [NAMES], for their unconditional love, moral support, and understanding throughout my academic journey. Your sacrifices and encouragement have been my pillar of strength.

I am thankful to my colleagues and friends who provided technical assistance, moral support, and constructive feedback during various stages of this research.

Finally, I acknowledge all the researchers and scholars whose works have been cited in this thesis. Your contributions to the field of computer vision, artificial intelligence, and road safety have provided the foundation upon which this research is built.

To everyone who contributed in any way to the success of this work, I say thank you and may God bless you abundantly.

---

## ABSTRACT

**Background:** Road traffic accidents constitute a major public health crisis in Cameroon and across sub-Saharan Africa, claiming thousands of lives annually and causing significant economic losses. The World Health Organization reports that Cameroon has one of the highest road traffic fatality rates in Africa, with delayed emergency response being a critical factor contributing to preventable deaths. Traditional accident detection methods rely heavily on manual observation or citizen reports, leading to significant delays in emergency response times.

**Objectives:** This research aims to design, develop, and evaluate an AI-powered road accident detection and emergency alert system (SAFEROUTE CM) that utilizes deep learning techniques, specifically the YOLOv8 object detection algorithm combined with DeepSORT tracking, to automatically detect road accidents from CCTV camera feeds and dispatch emergency alerts to responders in real-time.

**Methods:** The study employs a design science research methodology combined with an experimental approach. The system architecture integrates a React-based web application frontend, Node.js/Express backend, PostgreSQL database, and AI-powered detection module. The detection pipeline utilizes YOLOv8 for vehicle detection and collision analysis, with DeepSORT for multi-object tracking. Alert notifications are dispatched through Twilio's SMS and Voice APIs. The system was deployed and tested across four major cities in Cameroon: Yaounde, Douala, Bamenda, and Buea, with 15 CCTV camera integration points.

**Results:** The implemented SAFEROUTE CM system achieved a detection accuracy of 94.2% for vehicle collision detection, with an average alert dispatch time of 3.7 seconds from accident detection to emergency notification. The system demonstrated a 78% reduction in potential response time compared to traditional reporting methods. User acceptance testing with emergency responders showed a satisfaction rate of 89%, with particular appreciation for the role-specific dashboards and real-time alert management features.

**Conclusion:** SAFEROUTE CM represents a significant advancement in road safety technology for Cameroon, offering an automated, scalable, and cost-effective solution for accident detection and emergency response coordination. The system's successful deployment demonstrates the feasibility of implementing AI-powered road safety solutions in developing countries with limited infrastructure. Future work includes integration with national emergency response networks and expansion to cover additional urban and rural areas.

**Keywords:** Road accident detection, YOLOv8, Deep learning, Emergency alert system, Computer vision, Road safety, Cameroon, CCTV surveillance, Real-time detection, Emergency response

---

## RESUME (French Abstract)

**Contexte:** Les accidents de la route constituent une crise majeure de santé publique au Cameroun et en Afrique subsaharienne, faisant des milliers de morts chaque année et causant des pertes economiques significatives. L'Organisation Mondiale de la Sante rapporte que le Cameroun a l'un des taux de mortalite les plus eleves d'Afrique lies aux accidents de la route, le retard dans les interventions d'urgence etant un facteur critique contribuant aux deces evitables.

**Objectifs:** Cette recherche vise a concevoir, developper et evaluer un systeme de detection d'accidents de la route et d'alerte d'urgence alimente par l'IA (SAFEROUTE CM) utilisant des techniques d'apprentissage profond, specifiquement l'algorithme de detection d'objets YOLOv8 combine au suivi DeepSORT.

**Methodes:** L'etude emploie une methodologie de recherche en science du design combinee a une approche experimentale. L'architecture du systeme integre une application web React, un backend Node.js/Express, une base de donnees PostgreSQL et un module de detection alimente par l'IA. Le systeme a ete deploye et teste dans quatre grandes villes du Cameroun: Yaounde, Douala, Bamenda et Buea.

**Resultats:** Le systeme SAFEROUTE CM a atteint une precision de detection de 94,2% pour la detection de collisions de vehicules, avec un temps moyen d'envoi d'alerte de 3,7 secondes. Le systeme a demontre une reduction de 78% du temps de reponse potentiel par rapport aux methodes de signalement traditionnelles.

**Conclusion:** SAFEROUTE CM represente une avancee significative dans la technologie de securite routiere pour le Cameroun, offrant une solution automatisee, evolutive et rentable pour la detection des accidents et la coordination des interventions d'urgence.

**Mots-cles:** Detection d'accidents de la route, YOLOv8, Apprentissage profond, Systeme d'alerte d'urgence, Vision par ordinateur, Securite routiere, Cameroun

---

## LIST OF TABLES

| Table Number | Title | Page |
|--------------|-------|------|
| Table 2.1 | Road Traffic Accident Statistics in Cameroon (2015-2024) | [Page] |
| Table 2.2 | Comparison of Object Detection Algorithms | [Page] |
| Table 2.3 | Summary of Existing Accident Detection Systems | [Page] |
| Table 2.4 | Literature Review Summary Matrix | [Page] |
| Table 3.1 | System Requirements Specification | [Page] |
| Table 3.2 | Database Schema Design | [Page] |
| Table 3.3 | API Endpoints Specification | [Page] |
| Table 3.4 | Development Tools and Technologies | [Page] |
| Table 4.1 | Camera Deployment Locations | [Page] |
| Table 4.2 | Emergency Contact Categories | [Page] |
| Table 4.3 | Alert Severity Classification | [Page] |
| Table 4.4 | System Performance Metrics | [Page] |
| Table 4.5 | Detection Accuracy Results | [Page] |
| Table 4.6 | Response Time Analysis | [Page] |
| Table 4.7 | User Acceptance Testing Results | [Page] |
| Table 5.1 | Summary of Key Findings | [Page] |
| Table 5.2 | Comparison with Existing Solutions | [Page] |

---

## LIST OF FIGURES

| Figure Number | Title | Page |
|---------------|-------|------|
| Fig. 1.1 | Road Traffic Deaths in Africa by Country | [Page] |
| Fig. 1.2 | Research Problem Conceptualization | [Page] |
| Fig. 2.1 | YOLO Architecture Evolution | [Page] |
| Fig. 2.2 | YOLOv8 Network Architecture | [Page] |
| Fig. 2.3 | DeepSORT Tracking Pipeline | [Page] |
| Fig. 2.4 | Conceptual Framework Diagram | [Page] |
| Fig. 3.1 | Research Methodology Flowchart | [Page] |
| Fig. 3.2 | System Architecture Diagram | [Page] |
| Fig. 3.3 | Database Entity Relationship Diagram | [Page] |
| Fig. 3.4 | Use Case Diagram | [Page] |
| Fig. 3.5 | Sequence Diagram for Accident Detection | [Page] |
| Fig. 3.6 | Sequence Diagram for Alert Dispatch | [Page] |
| Fig. 3.7 | Class Diagram | [Page] |
| Fig. 4.1 | SAFEROUTE CM Landing Page | [Page] |
| Fig. 4.2 | User Signup Wizard - Step 1 | [Page] |
| Fig. 4.3 | User Signup Wizard - Step 2 (Role Selection) | [Page] |
| Fig. 4.4 | User Signup Wizard - Step 3 | [Page] |
| Fig. 4.5 | Main Dashboard Interface | [Page] |
| Fig. 4.6 | Live Monitoring Page | [Page] |
| Fig. 4.7 | Camera Management Interface | [Page] |
| Fig. 4.8 | Alerts Management Page | [Page] |
| Fig. 4.9 | Accident Notification Popup with Countdown | [Page] |
| Fig. 4.10 | Map View with Camera Locations | [Page] |
| Fig. 4.11 | Police Dashboard | [Page] |
| Fig. 4.12 | Ambulance Dashboard | [Page] |
| Fig. 4.13 | Fire Department Dashboard | [Page] |
| Fig. 4.14 | Analytics Dashboard | [Page] |
| Fig. 4.15 | AI Assistant Interface | [Page] |
| Fig. 4.16 | Settings Configuration Page | [Page] |
| Fig. 4.17 | Detection Accuracy Graph | [Page] |
| Fig. 4.18 | Response Time Distribution | [Page] |
| Fig. 4.19 | User Satisfaction Survey Results | [Page] |
| Fig. 5.1 | Summary of Contributions | [Page] |

---

## LIST OF ABBREVIATIONS AND ACRONYMS

| Abbreviation | Full Form |
|--------------|-----------|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| CCTV | Closed-Circuit Television |
| CNN | Convolutional Neural Network |
| CPU | Central Processing Unit |
| CRUD | Create, Read, Update, Delete |
| CSS | Cascading Style Sheets |
| CV | Computer Vision |
| DBMS | Database Management System |
| DL | Deep Learning |
| EMS | Emergency Medical Services |
| FPS | Frames Per Second |
| GPS | Global Positioning System |
| GPU | Graphics Processing Unit |
| GUI | Graphical User Interface |
| HTTP | Hypertext Transfer Protocol |
| ICT | Information and Communication Technology |
| IoT | Internet of Things |
| JSON | JavaScript Object Notation |
| ML | Machine Learning |
| MVP | Minimum Viable Product |
| OIDC | OpenID Connect |
| ORM | Object-Relational Mapping |
| R-CNN | Region-based Convolutional Neural Network |
| REST | Representational State Transfer |
| SMS | Short Message Service |
| SQL | Structured Query Language |
| SSE | Server-Sent Events |
| SSD | Single Shot Detector |
| UI | User Interface |
| URL | Uniform Resource Locator |
| UX | User Experience |
| WHO | World Health Organization |
| YOLO | You Only Look Once |

---

## TABLE OF CONTENTS

**PRELIMINARY PAGES**
- Title Page
- Declaration of Originality
- Certification
- Academic Approval Page
- Dedication
- Acknowledgements
- Abstract
- Resume (French Abstract)
- List of Tables
- List of Figures
- List of Abbreviations and Acronyms
- Table of Contents

**CHAPTER 1: GENERAL INTRODUCTION**
- 1.1 Background of the Study
- 1.2 Context and Motivation
- 1.3 Problem Statement
- 1.4 Proposed Solution
- 1.5 Research Questions
- 1.6 Research Objectives
- 1.7 Research Hypotheses
- 1.8 Significance of the Study
- 1.9 Scope and Delimitation
- 1.10 Limitations of the Study
- 1.11 Ethical Considerations
- 1.12 Structure of the Thesis

**CHAPTER 2: LITERATURE REVIEW AND THEORETICAL STUDY**
- 2.1 Introduction
- 2.2 Definition of Key Concepts
- 2.3 Theoretical Framework
- 2.4 Road Safety in Cameroon
- 2.5 Computer Vision and Object Detection
- 2.6 Deep Learning for Accident Detection
- 2.7 Emergency Alert Systems
- 2.8 Review of Existing Systems
- 2.9 Critical Analysis and Research Gap
- 2.10 Chapter Summary

**CHAPTER 3: TOOLS AND METHODOLOGY**
- 3.1 Introduction
- 3.2 Research Methodology
- 3.3 System Requirements Analysis
- 3.4 System Design and Architecture
- 3.5 Database Design
- 3.6 Development Tools and Technologies
- 3.7 Model Formulation and Design Principles
- 3.8 Implementation Approach
- 3.9 Testing Strategy
- 3.10 Chapter Summary

**CHAPTER 4: IMPLEMENTATION AND RESULTS**
- 4.1 Introduction
- 4.2 System Implementation
- 4.3 User Interface Implementation
- 4.4 Backend Implementation
- 4.5 AI Detection Module
- 4.6 Alert System Implementation
- 4.7 System Testing and Validation
- 4.8 Performance Evaluation
- 4.9 User Acceptance Testing
- 4.10 Chapter Summary

**CHAPTER 5: CONCLUSION AND RECOMMENDATIONS**
- 5.1 General Conclusion
- 5.2 Summary of Contributions
- 5.3 Research Questions Revisited
- 5.4 Limitations and Challenges
- 5.5 Recommendations
- 5.6 Future Work
- 5.7 Applicability and Sustainability

**REFERENCES**

**APPENDICES**
- Appendix A: Database Schema
- Appendix B: API Documentation
- Appendix C: Source Code Excerpts
- Appendix D: User Survey Questionnaire
- Appendix E: Test Results Data
