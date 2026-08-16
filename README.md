# 🚢 SmartPort AI

## AI-Powered Smart Port Management, Congestion Prediction & Operational Decision Support Platform

SmartPort AI is an integrated, database-driven **Smart Port Management System** designed to connect port stakeholders through a single end-to-end digital workflow.

The platform coordinates shipping companies, port authorities, customs, terminal operations, warehouse operations, trucking operators, logistics teams, AI administrators, data analysts, and system administrators.

Unlike a traditional port system that mainly records operational activities, SmartPort AI combines **real-time operational workflow management with AI/ML-based risk analysis and congestion prediction** to help identify bottlenecks earlier and support preventive operational decisions.

---

# 🎯 Project Objective

The primary objective of SmartPort AI is to transform fragmented and reactive port operations into a:

> **Connected → Visible → Predictive → Coordinated → Preventive**

port management ecosystem.

The platform aims to help reduce:

- Vessel waiting time
- Berth conflicts
- Container handling delays
- Yard congestion
- Truck queues
- Gate congestion
- Documentation delays
- Customs clearance delays
- Poor coordination between stakeholders
- Operational bottlenecks

The system does not simply display congestion after it occurs.

It continuously collects operational information, analyses current conditions, predicts potential risks, and provides decision support so that operational teams can take action earlier.

---

# 🚨 Problem Statement

Modern ports involve many stakeholders and operational stages.

A single shipment can involve:

**Shipping Company → Port Authority → Customs → Terminal → Warehouse → Trucking → Gate → Logistics**

When these activities are handled through disconnected systems, spreadsheets, emails, manual approvals, and isolated operational tools, several problems can occur:

- Delayed vessel approvals
- Berth scheduling conflicts
- Missing documentation
- Delayed customs clearance
- Uncoordinated container movement
- Yard overcrowding
- Truck appointment conflicts
- Gate queues
- Lack of real-time visibility
- Delayed decision-making
- Reactive congestion management

A delay at one stage can propagate into several downstream operations.

For example:

```
Delayed Port Approval
        ↓
Delayed Berth Allocation
        ↓
Delayed Vessel Handling
        ↓
Delayed Container Unloading
        ↓
Yard Congestion
        ↓
Delayed Warehouse Movement
        ↓
Truck Queue Formation
        ↓
Delivery Delay

```


💡 Proposed Solution

SmartPort AI provides a centralized platform where every major operational activity is connected through a common workflow and database.

The platform combines:

Role-based operational portals
Real-time database persistence
Workflow state management
Document management
Approval management
Berth allocation
Container tracking
Yard operations
Warehouse operations
Truck and gate operations
Logistics tracking
Notifications
Audit logging
AI verification
ML-based risk prediction
Congestion analysis
Analytics and operational dashboards

The central concept is:

OPERATIONAL DATA
       ↓
DATA VALIDATION
       ↓
WORKFLOW PROCESSING
       ↓
REAL-TIME MONITORING
       ↓
AI / ML ANALYSIS
       ↓
RISK & CONGESTION PREDICTION
       ↓
BOTTLENECK IDENTIFICATION
       ↓
DECISION SUPPORT
       ↓
OPERATIONAL ACTION
       ↓
CONTINUOUS MONITORING
🏗️ Complete Port Workflow

The implemented platform follows an interconnected operational workflow.

┌──────────────────────────┐
│     SHIPPING COMPANY     │
│ Vessel & Cargo Submission│
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│   DOCUMENT MANAGEMENT    │
│ Upload & Verification    │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│      AI VERIFICATION     │
│ Risk & Document Analysis │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│     PORT AUTHORITY       │
│ Review & Approval        │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│     BERTH MANAGEMENT     │
│ Allocation & Scheduling  │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│      CUSTOMS             │
│ Clearance / Inspection   │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│   TERMINAL OPERATIONS    │
│ Unloading & Manifest     │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│    YARD OPERATIONS       │
│ Container Placement      │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│ WAREHOUSE OPERATIONS     │
│ Storage & Dispatch       │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│    TRUCKING OPERATIONS   │
│ Truck & Driver Assignment│
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│      GATE OPERATIONS     │
│ Gate-in / Transit / Out  │
└─────────────┬────────────┘
              ↓
┌──────────────────────────┐
│   LOGISTICS CONTROL      │
│ Tracking & Delivery      │
└─────────────┬────────────┘
              ↓
        ┌──────────────┐
        │  DELIVERED   │
        └──────────────┘

At every important stage, the system records:

Current status
Responsible stakeholder
Timestamp
Workflow event
Database change
Notification
Audit information
🧩 10 Operational Portals

SmartPort AI contains 10 interconnected portals.

1. 🚢 Shipping Line Portal

Route:

/app/shipping
/app/documents

The Shipping Line portal allows users to:

Create vessel submissions
Enter vessel information
Enter IMO number
Enter voyage number
Enter cargo information
Enter container quantities
Provide ETA / ETD
Save drafts
Edit submissions
Upload required documents
Track document verification
View approval status
Receive modification requests
Resubmit corrected documents
Monitor shipment progress

A successful submission enters the central workflow and becomes available to the Port Authority.

2. ⚓ Port Authority Portal

Routes:

/app/port-authority
/app/approvals

The Port Authority manages vessel approval and berth coordination.

Functions include:

Review incoming vessel submissions
Inspect submitted information
Review AI risk information
Review document status
Approve submissions
Reject submissions
Request modifications
Add approval/rejection notes
Allocate available berths
Monitor berth occupancy
Detect potential berth conflicts
Monitor operational congestion

The Port Authority is a critical decision point in the workflow.

Example:

Shipping Submission
        ↓
Authority Review
        ↓
Approve
        ↓
Berth Allocation
        ↓
Customs
3. 🛃 Customs Clearance Portal

Route:

/app/customs

Customs officers receive shipments after Port Authority approval.

Functions include:

Review customs queue
Inspect cargo information
Check dangerous goods / IMDG information
Review documents
Approve customs clearance
Hold shipment for inspection
Record inspection notes
Reject clearance
Trigger workflow notifications
Maintain customs audit history

Example:

Authority Approved
        ↓
Customs Review
        ↓
 ┌──────┴──────┐
 ↓             ↓
Clear         Hold
 ↓             ↓
Terminal     Inspection
4. 🏗️ Terminal Operations Portal

Route:

/app/terminal

The Terminal Operations portal manages vessel and container handling.

Functions include:

View approved vessel calls
Schedule unloading
Register container manifests
Create container records
Assign cranes
Assign operational resources
Assign yard slots
Track container movement
Update container operational stages
Release cargo toward warehouse operations

Container lifecycle:

AT VESSEL
    ↓
UNLOADING
    ↓
YARD
    ↓
WAREHOUSE RECEIVED
5. 🏭 Warehouse Operations Portal

Route:

/app/warehouse

Warehouse teams manage containers received from terminal operations.

Functions include:

Receive containers
Allocate storage slots
Manage stored cargo
Identify dangerous goods
Prepare cargo for dispatch
Update container status
Release containers for trucking

Container lifecycle:

WAREHOUSE RECEIVED
        ↓
STORED
        ↓
DISPATCH READY

When cargo becomes dispatch-ready, the trucking workflow can begin.

6. 🚛 Trucking Fleet Portal

Route:

/app/truck

The Trucking portal coordinates transportation of containers outside the terminal.

Functions include:

View dispatch-ready containers
Assign truck
Enter truck registration
Assign driver
Schedule pickup
Validate pickup appointment
Start trip
Track transportation status

Container lifecycle:

DISPATCH READY
       ↓
ASSIGNED TRUCK
       ↓
IN TRANSIT
7. 🚪 Gate Operations

Gate operations are integrated into the transportation workflow.

The system validates:

Truck appointment
Gate-in sequence
Movement state
Gate-out sequence
Invalid movement attempts
Duplicate gate-out attempts

This helps prevent unnecessary truck queues and incorrect gate movements.

Example:

Appointment
    ↓
Gate In
    ↓
Terminal Movement
    ↓
Gate Out
    ↓
In Transit

Invalid operational sequences are rejected by the workflow/state engine.

8. 📦 Logistics Control Tower

Route:

/app/logistics

The Logistics portal provides cross-stage visibility.

Functions include:

Track active shipments
Track container movement
Monitor transportation
Monitor delivery status
Confirm final delivery
Record proof-of-delivery information
Close completed consignments

Final lifecycle:

IN TRANSIT
     ↓
DELIVERY
     ↓
PROOF OF DELIVERY
     ↓
DELIVERED
9. 🤖 AI Administrator Portal

Route:

/app/ai

The AI Administrator portal manages the machine learning and intelligence layer.

Functions include:

Feature extraction
Dataset preparation
Model training
Model evaluation
Model deployment
Risk prediction
Delay prediction
Congestion analysis
Feature importance
Explainability
Model telemetry

Operational features include:

Container Count
Dangerous Goods
Document Completeness
Terminal Workload
IMO Validation
ETA Lead Time
Expired Documents

These features are used to analyse operational risk.

10. 📊 Data Analyst & Super Admin Portals
Data Analyst

Route:

/app/analytics

Provides:

Operational KPIs
Shipment volume
Processing times
Clearance rates
Container statistics
Throughput trends
Delivery statistics
Congestion-related analytics
CSV export
Super Admin

Route:

/app/admin

Provides:

User management
Role management
User activation/deactivation
Role approval
System monitoring
Audit log inspection
Administrative controls
🤖 Artificial Intelligence & Machine Learning

SmartPort AI includes a machine learning pipeline connected to operational data.

The ML pipeline extracts operational features from the platform database.

Feature Set

The current feature extraction pipeline uses:

Feature	Description
containerCount	Number of containers / TEU volume
dangerousGoods	IMDG / dangerous goods indicator
docCompleteness	Required document completion ratio
terminalWorkload	Current operational workload
hasImo	IMO number validation
etaLeadDays	ETA lead time
hasExpiredDocs	Expired document indicator
📈 ML Predictions

The system is designed to provide:

Risk Prediction

A risk score from:

0 ─────────────────────── 100
LOW                       HIGH
Delay Prediction

Prediction of potential operational delay in hours.

Congestion Prediction

Analysis of operational conditions to identify possible congestion risk.

🧠 Explainable AI

SmartPort AI does not only generate a prediction.

It also identifies which operational factors contributed to the risk.

Example:

CONGESTION / OPERATIONAL RISK
            ↓
       Risk Score: 72
            ↓
 ┌─────────────────────────┐
 │ Main Contributing Factors│
 └─────────────────────────┘
            ↓
Dangerous Goods       +34.2%
Document Completeness +25.8%
Cargo Volume          +16.4%
Terminal Workload     +13.1%
Expired Documents     +10.5%

This allows operational teams to understand why a shipment or operation has elevated risk.

🚦 How SmartPort AI Helps Reduce Port Congestion

SmartPort AI is designed around preventive congestion management.

It does not physically remove congestion by itself.

Instead, it helps operational teams identify conditions that can create congestion and take corrective action earlier.

For example:

High Vessel Volume
       +
High Berth Occupancy
       +
High Container Volume
       +
High Yard Workload
       +
High Truck Demand
       ↓
AI Detects Increasing Risk
       ↓
Operational Team Receives Alert
       ↓
Potential Bottleneck Identified
       ↓
Operational Adjustment
       ↓
Reduced Probability of Queue Formation

Possible operational responses include:

Adjusting vessel scheduling
Selecting another available berth
Prioritizing certain operations
Managing container movement
Coordinating warehouse release
Managing truck appointments
Controlling gate flow
Monitoring yard capacity

Therefore, the platform follows:

Predict → Identify → Coordinate → Act → Monitor

rather than:

Congestion → Queue → Delay → React

🏙️ How SmartPort AI Helps Urban Areas

Port congestion can affect the surrounding urban transportation network.

When port operations become congested:

Port Congestion
      ↓
Truck Queue
      ↓
More Heavy Vehicles Near Port
      ↓
Road Congestion
      ↓
Longer Travel Times
      ↓
Fuel Consumption & Emissions
      ↓
Urban Traffic Impact

SmartPort AI can help reduce this impact by improving coordination between:

Cargo availability
Truck appointments
Gate operations
Container readiness
Warehouse operations
Port capacity

For example:

Container Not Ready
        ↓
Traditional System:
Truck Arrives
        ↓
Truck Waits
        ↓
Queue Forms


SmartPort AI:
Container Status Monitored
        ↓
Dispatch Readiness Confirmed
        ↓
Truck Appointment Coordinated
        ↓
Truck Arrives When Cargo Is Ready
        ↓
Reduced Unnecessary Waiting

This can contribute to:

Reduced truck waiting
Better traffic flow around port areas
Reduced unnecessary vehicle movement
Improved logistics efficiency
Lower idling time
Potential reduction in emissions
Better coordination between port and urban transport

SmartPort AI therefore acts as a port-to-urban logistics coordination layer.

🔄 Central Workflow State Engine

The platform uses a controlled workflow/state engine.

Shipment stages include operational states such as:

UPLOADED
   ↓
AUTHORITY REVIEW
   ↓
AUTHORITY APPROVED
   ↓
BERTH ASSIGNED
   ↓
CUSTOMS REVIEW
   ↓
CUSTOMS CLEARED
   ↓
TERMINAL SCHEDULED
   ↓
UNLOADING
   ↓
WAREHOUSE RECEIVED
   ↓
DISPATCH READY
   ↓
IN TRANSIT
   ↓
DELIVERED

Alternative paths are supported for operational exceptions.

Example:

AUTHORITY REVIEW
       ↓
MODIFICATION REQUESTED
       ↓
SHIPPING CORRECTION
       ↓
RESUBMISSION
       ↓
AUTHORITY REVIEW

Customs can also place shipments on hold:

CUSTOMS REVIEW
       ↓
CUSTOMS HOLD
       ↓
INSPECTION
       ↓
CUSTOMS CLEARANCE

Invalid state transitions are rejected.

🔔 Real-Time Notifications

Workflow transitions generate targeted notifications.

Examples:

Shipping Submission
        ↓
Port Authority Notification
Port Approval
        ↓
Customs Notification
Customs Clearance
        ↓
Terminal Notification
Dispatch Ready
        ↓
Trucking Notification
Trip Started
        ↓
Logistics Notification

Notifications help stakeholders act without manually checking every portal.

📝 Audit Trail

Important operational activities are recorded in the audit system.

Audit events include:

Submission creation
Document upload
Document verification
Approval
Rejection
Modification request
Customs decision
Container movement
Truck assignment
Delivery confirmation
Role changes
Administrative actions
ML training actions

This provides operational traceability.

🗄️ Database Architecture

SmartPort AI uses Supabase/PostgreSQL as the primary backend data platform.

Core database entities include:

profiles
user_roles
shipment_submissions
submission_documents
ai_verifications
containers
workflow_events
notifications
audit_logs
berths

The database stores real operational state rather than relying on temporary frontend mock data.

🔐 Security & Authorization

SmartPort AI implements role-based authorization and database-level security.

Security mechanisms include:

Authentication
Role-based access control
PostgreSQL Row-Level Security
Database state validation
Protected document access
Audit logging
Controlled administrative operations
Input validation

Different stakeholders can access only the operations permitted for their roles.

Example:

Shipping User
     ✕
Port Authority Approval


Trucking User
     ✕
Customs Clearance


Non-Admin User
     ✕
Audit Log Modification

Unauthorized actions are rejected by the backend/database security layer.

⚓ Berth Conflict Prevention

Berth allocation is an important part of congestion prevention.

The system tracks berth usage and prevents conflicting active allocations.

Example:

BERTH PPT-B01
      ↓
Vessel A Assigned
      ↓
Berth Occupied
      ↓
Vessel B Requests Same Berth
      ↓
Conflict Detected
      ↓
Assignment Rejected

This helps prevent vessel scheduling conflicts and unnecessary waiting.

📦 Container Lifecycle

Each container is tracked through operational stages.

AT VESSEL
     ↓
UNLOADING
     ↓
YARD
     ↓
WAREHOUSE RECEIVED
     ↓
STORED
     ↓
DISPATCH READY
     ↓
ASSIGNED TRUCK
     ↓
IN TRANSIT
     ↓
DELIVERED

This provides visibility from vessel unloading to final delivery.

📊 Operational Analytics

The analytics layer provides operational visibility across the platform.

Important indicators include:

Total submissions
Active shipments
Delivered shipments
Container volume
Active containers
Berth occupancy
Customs workload
Warehouse workload
Dispatch-ready containers
In-transit containers
Processing times
Throughput trends
Operational risk

The platform uses server-side aggregation for important dashboard metrics to reduce unnecessary data transfer and client-side processing.

⚡ Performance Optimization

The system includes database and frontend performance optimizations.

Implemented optimizations include:

Composite database indexes
Server-side aggregation
Dashboard summary RPC
TanStack Query caching
Pagination
Memoized filtering
Optimized realtime subscriptions
Subscription cleanup
Skeleton loading states
Reduced unnecessary database requests

Example database indexes include:

shipment_submissions
    (stage, created_at)


containers
    (submission_id, stage)


notifications
    (user_id, read, created_at)


audit_logs
    (created_at)
🧪 Functional Validation

The platform has been designed and tested around real end-to-end workflow scenarios.

Example test:

Create Shipment
      ↓
Upload Documents
      ↓
AI Verification
      ↓
Port Authority Approval
      ↓
Berth Allocation
      ↓
Customs Clearance
      ↓
Terminal Scheduling
      ↓
Container Registration
      ↓
Warehouse Storage
      ↓
Dispatch Ready
      ↓
Truck Assignment
      ↓
Trip Start
      ↓
Delivery Confirmation
      ↓
DELIVERED

The workflow is intended to operate through the application interface and database workflow engine without requiring manual database state manipulation.

🔁 Rejection & Resubmission Workflow

SmartPort AI also supports exception handling.

Example:

Shipping Submission
        ↓
Port Authority Review
        ↓
Missing Document
        ↓
Modification Requested
        ↓
Shipping User Notified
        ↓
Missing Document Uploaded
        ↓
Resubmit
        ↓
Port Authority Review
        ↓
Approval

This prevents rejected shipments from becoming dead-end records.

🧠 Intelligent Operational Loop

The overall intelligence model follows:

┌──────────────┐
│    OBSERVE   │
└──────┬───────┘
       ↓
┌──────────────┐
│    ANALYSE   │
└──────┬───────┘
       ↓
┌──────────────┐
│    PREDICT   │
└──────┬───────┘
       ↓
┌──────────────┐
│    IDENTIFY  │
│   BOTTLENECK │
└──────┬───────┘
       ↓
┌──────────────┐
│   RECOMMEND  │
└──────┬───────┘
       ↓
┌──────────────┐
│     ACT      │
└──────┬───────┘
       ↓
┌──────────────┐
│    MONITOR   │
└──────┬───────┘
       │
       └──────────────→ OBSERVE

This creates a continuous operational intelligence cycle.

🏗️ System Architecture
┌──────────────────────────────────────────┐
│              USER INTERFACE              │
│          React + TypeScript              │
│                                          │
│  10 Role-Based Operational Portals       │
└───────────────────┬──────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│       AUTHENTICATION & RBAC              │
│     Session / Role / Permission          │
└───────────────────┬──────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│          APPLICATION WORKFLOW             │
│       State Engine / Notifications        │
│        Audit / Operational Logic          │
└───────────────────┬──────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│             SUPABASE                     │
│                                          │
│ PostgreSQL | Auth | Storage | Realtime   │
└───────────────┬───────────────┬──────────┘
                ↓               ↓
       ┌──────────────┐  ┌───────────────┐
       │ Operational  │  │  Documents    │
       │   Database   │  │    Storage    │
       └──────────────┘  └───────────────┘
                ↓
┌──────────────────────────────────────────┐
│             AI / ML LAYER                │
│                                          │
│ Feature Extraction                       │
│ Risk Prediction                          │
│ Delay Prediction                         │
│ Congestion Analysis                      │
│ Explainability                           │
└───────────────────┬──────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│        DECISION SUPPORT & ALERTS          │
│                                          │
│ Risk Alerts | Recommendations | KPIs      │
└──────────────────────────────────────────┘
🛠️ Technology Stack
Layer	Technology
Frontend	React
Programming Language	TypeScript
Build Tool	Vite
UI	React-based component system
Data Fetching	TanStack Query
Backend Platform	Supabase
Database	PostgreSQL
Authentication	Supabase Auth
File Storage	Supabase Storage
Realtime	Supabase Realtime
Security	PostgreSQL RLS
Workflow	Database + Application State Engine
AI/ML	Machine Learning Pipeline
Analytics	Database Aggregation + React Dashboards
Version Control	Git / GitHub
📁 Project Structure

The project structure is based on the implemented application architecture.

SmartPort-AI/
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   ├── workflow.ts
│   │   ├── status-engine.ts
│   │   ├── ml-pipeline.ts
│   │   └── ...
│   │
│   ├── routes/
│   │   ├── app.shipping.tsx
│   │   ├── app.documents.tsx
│   │   ├── app.port-authority.tsx
│   │   ├── app.approvals.tsx
│   │   ├── app.customs.tsx
│   │   ├── app.terminal.tsx
│   │   ├── app.warehouse.tsx
│   │   ├── app.truck.tsx
│   │   ├── app.logistics.tsx
│   │   ├── app.ai.tsx
│   │   ├── app.analytics.tsx
│   │   └── app.admin.tsx
│   │
│   └── ...
│
├── supabase/
│   ├── migrations/
│   └── ...
│
├── public/
│
├── README.md
├── package.json
└── ...
