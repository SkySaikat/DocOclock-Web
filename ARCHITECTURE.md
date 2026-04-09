# DocOClock - Production System Architecture Specification

## 1. Product Overview
DocOClock is a dual-sided B2B SaaS healthcare platform engineered specifically for the healthcare landscape in Bangladesh. Its primary goal is to digitize and streamline clinic operations, reducing administrative overhead for doctors while improving the booking and consultation experience for patients. 

**Core Philosophies & Global Rules:**
- **Role Isolation:** Strict separation of user experiences (Doctor Mode, Patient Mode, Admin Mode). No role UI leakage.
- **Single Source of Truth:** A unified database architecture ensuring zero duplicated data and no "fake syncing." All writes are permanent.
- **Performance First:** Optimized for busy doctors; minimal clicks, rapid data entry, and phone numerical reliance for patient context.

## 2. Core Features
- **Doctor Dashboards:** Live serial/queue management, high-speed digital prescription pad, patient history retrieval by phone number, clinic analytics.
- **Patient Portals:** Direct appointment booking, live queue tracking, read-only digital prescriptions access, family profile management under a single phone number.
- **Admin Control Systems:** BMDC (Bangladesh Medical and Dental Council) doctor verification, national medicine database management, prescription template overrides.
- **Live Serial Management:** Real-time queue traversal enforcing single-chamber per-day limits, optimizing clinic throughput.

## 3. User Roles and Permissions
The platform operates on a strict Role-Based Access Control (RBAC) model.
- **Doctor (Primary Paying User):** Edit access to appointments, prescriptions, and chambers. Access to doctor-specific analytics. Cannot access admin controls or the patient-specific booking discovery interface.
- **Patient (End User):** Identified primarily via phone number. Can manage multiple subsequent profiles (e.g., family members). Read-only access to prescriptions. Can create and cancel their own appointments.
- **Admin (System Controller):** System-wide entity oversight. Hard validation of doctors, management of global drug registries, and platform analytics. Can override configurations but cannot tamper with immutable prescription records.

## 4. System Architecture Overview
DocOClock leverages a **Modular Monolith Architecture** during its MVP and early-scale phases to reduce operational overhead while maintaining logical boundaries, later decoupling into microservices. 
- **Clients:** React SPAs (Web/Mobile-Web) functioning in strict contextual modes based on authentication tokens.
- **API Gateway/BFF (Backend for Frontend):** Routes requests, strips roles, and normalizes payloads.
- **Core Application Layer:** Centralized business logic strictly enforcing chamber combinations, booking logic, and prescription linking.
- **Data Layer:** Single RDBMS handling relational structures with explicit transactions to maintain data integrity.

## 5. Frontend Architecture
- **Framework:** React + TypeScript via Vite.
- **State Management:** React Query (TanStack Query) for server state (caching, synchronization). Context API / Zustand for strict local UI state (e.g., UI mode, basic auth state).
- **Routing:** React Router with layout-based role guarding. A user cannot traverse to `/doctor/*` without a verified Doctor JWT.
- **UI Architecture:** Component-driven, built progressively. Unified design system (no inline overcrowding; usage of modals/drawers for patient history).

## 6. Backend Architecture
- **Framework:** Node.js with Express / NestJS (preferred for modular architecture) OR Go for high-throughput concurrency. 
- **Logic Boundaries:** Different modules for `QueueManagement`, `Prescriptions`, `Users`, and `Billing`.
- **Validation Layer:** Strict DTO (Data Transfer Object) validation ensuring requests (e.g., booking a date) match the doctor's explicit chamber mappings.
- **Stateless Operations:** All user state is contained in JWTs or stored in the database.

## 7. API Design
- **Paradigm:** RESTful with strict JSON response standards. Future readiness for GraphQL for complex patient history queries.
- **Authentication Header:** `Authorization: Bearer <Token>`
- **Endpoints:**
  - `POST /api/v1/appointments` - Validates chamber logic against dates.
  - `POST /api/v1/prescriptions` - Creates immutable prescription linked to profile.
  - `GET /api/v1/queue/live` - Real-time polling or SSE/WebSocket for serial tracking.

## 8. Database Schema Design
A robust PostgreSQL relational database acting as the undisputed source of truth.
- **Users Table:** `id`, `phone_number` (Unique index), `role` (ENUM: DOCTOR, PATIENT, ADMIN), `password_hash`.
- **Patient_Profiles Table:** `id`, `user_id` (FK), `full_name`, `dob`, `gender`, `blood_group`. (Allows many profiles per phone number).
- **Doctors Table:** `id`, `user_id` (FK), `bmdc_number`, `specialty`, `verification_status`.
- **Chambers Table:** `id`, `doctor_id` (FK), `location_details`.
- **Doctor_Chamber_Schedules Table:** Enforces the "ONE chamber per day" rule. `doctor_id`, `chamber_id`, `day_of_week`, `start_time`, `end_time`. (Unique constraint on `doctor_id` + `day_of_week`).
- **Appointments Table:** `id`, `doctor_id`, `patient_profile_id`, `chamber_id`, `appointment_date`, `serial_number`, `status`.
- **Prescriptions Table:** `id`, `doctor_id`, `patient_profile_id`, `appointment_id`, `content_json`, `created_at`.

## 9. Authentication and Security
- **Strategy:** Phone Number + OTP for Patients. Email/Phone + Password with 2FA for Doctors and Admins.
- **Tokens:** Short-lived JWTs (Access Tokens) alongside HTTP-only secure Refresh Tokens.
- **Data Security:** Data in transit encrypted via TLS 1.3. PII (Personally Identifiable Information) encrypted at rest using AES-256 (database level).
- **Rate Limiting:** IP and Token-based throttling to prevent abuse on OTP and serial endpoints.

## 10. Prescription System Architecture
- **Immutability rule:** Once finalized, prescriptions append modifications via a versioning table or are strictly append-only (amendments).
- **Components:**
  - **Generator:** Merges standard template with `content_json` into a standardized format.
  - **Export Engine:** Serverless function (e.g., Puppeteer/Playwright or robust PDF library) generating print-ready PDFs.
- **Linking:** Hard foreign keys enforcing (`doctor_id`, `appointment_id`, `patient_profile_id`).

## 11. Appointment and Queue Management
- **Concurrency Control:** Serializable transactions or explicit row-locking when assigning `serial_number` for an `appointment_date` to prevent double-booking.
- **Chamber Validation:** Booking API strictly checks `Doctor_Chamber_Schedules`. If date maps to Tuesday, and Tuesday maps to Chamber A, API rejects Chamber B.
- **Live Serial Syncing:** Server-Sent Events (SSE) or WebSockets broadcasting strictly localized queue increments to the waiting room.

## 12. Notification System (SMS / WhatsApp / Push)
- **Message Bus:** RabbitMQ / Redis PubSub decoupling the API from third-party latency.
- **Handlers:** Workers consuming events (`Appointment_Created`, `Serial_Approaching`, `Prescription_Ready`).
- **Gateways:** Integration with local SMS gateways (e.g., SSL Wireless, Bongo) and WhatsApp Business API.

## 13. File Storage Architecture
- **Storage:** Amazon S3 or Cloudflare R2 for strict object storage.
- **Assets:** Prescription PDFs, Doctor profile images, UI assets.
- **Access Strategy:** Pre-signed URLs with limited expirations (e.g., 5 minutes) for retrieving private prescription PDFs.

## 14. Analytics and Reporting System
- **Separation of Concerns:** Analytics do NOT live on the primary Dashboard UI to avoid overcrowding. Dedicated Analytics route.
- **Data Processing:** Asynchronous cron jobs or CDC (Change Data Capture) via Debezium moving operational data from PostgreSQL to a read-replica or lightweight OLAP (e.g., ClickHouse) for querying revenue, footfall, and return patient rates.

## 15. AI Modules for Medical Assistance (Future)
- **Implementation Strategy:** API-first microservices (Python/FastAPI).
- **Features:** OCR parsing for past medical records, smart templates anticipating prescriptions based on minimal input, localized voice-to-text dictation models (Bengali/English).

## 16. Integration Architecture
- **Payments:** Local Payment Gateways (bKash, SSLCommerz, Nagad). Integrated via robust Webhooks with idempotency keys to handle network retries.
- **State Machine:** Payment intents stored dynamically; booking serials temporarily held and released if payment TTL expires.

## 17. Infrastructure Architecture
- **Compute:** Managed Container services (AWS ECS/Fargate, Google Cloud Run, or DigitalOcean App Platform) for stateless auto-scaling.
- **Database:** Fully managed PostgreSQL (AWS RDS / GCP Cloud SQL) with automated backups and read-replicas.
- **Caching:** Redis for caching national medicine lists, session states, and active queue positions.

## 18. Cloud Deployment Strategy
- **Environment Tiers:** Development (local), Staging (cloud sandbox parity), Production (locked down, highly available).
- **DNS / CDN:** Cloudflare handling DNS, DDoS protection, edge caching of static frontend assets.

## 19. DevOps and CI/CD Pipeline
- **Repositories:** GitHub / GitLab.
- **CI Logic:** On PR creation -> Linting, Type Checking, Unit Tests, Build dry-runs.
- **CD Logic:** On merge to `main` -> Docker build, automated push to Container Registry, rolling update to Production containers ensuring zero downtime.
- **IaC:** Infrastructure mapped via Terraform to prevent un-tracked server changes.

## 20. Scalability Strategy
- **Phase 1 (MVP - 0-1,000 Doctors):** Vertical scaling of DB. Standard instance sizes.
- **Phase 2 (1,000-10,000 Doctors):** Horizontal container scaling. DB Read replicas for queries/analytics.
- **Phase 3 (10,000+ Doctors, Millions of Patients):** Sharding DB logically by geographic region (Dhaka vs. Chittagong), fully decoupled microservices.

## 21. Monitoring and Logging
- **APM:** Datadog, New Relic, or open-source Sentry + Prometheus/Grafana stack.
- **Logging:** Centralized structured JSON logging (Winston/Pino) streamed to ELK stack or CloudWatch.
- **Alerting:** PagerDuty / Slack integrations for HTTP 500 spikes, dead-letter queue backups, or DB CPU threshold breaches.

## 22. Disaster Recovery and Backup
- **RPO (Recovery Point Objective):** 5 minutes via continuous WAL (Write-Ahead Log) archiving.
- **RTO (Recovery Time Objective):** < 1 Hour via automated Terraform re-deployment.
- **Redundancy:** Multi-AZ (Availability Zone) deployment to survive single data center outages.

## 23. Folder Structure
### Frontend (React/Vite)
```
src/
├── api/             # API client, TanStack Query hooks
├── assets/          # Static media
├── components/      # Shared atomic components (Buttons, Modals)
├── features/        # Feature-based architecture
│   ├── auth/
│   ├── queue/
│   ├── prescription/
├── hooks/           # Shared React hooks
├── layouts/         # Role-based App Shells (AdminLayout, DoctorLayout, PatientLayout)
├── pages/           # Routed page components
├── store/           # Global state (Zustand context)
├── types/           # TypeScript interfaces
└── utils/           # Formatters, generic helpers
```

### Backend (Node.js/TypeScript)
```
src/
├── config/          # Env, Constants
├── controllers/     # Route handlers
├── middlewares/     # Auth, RBAC, Validation, Error Handling
├── models/          # DB Entities / Prisma Schemas / TypeORM
├── routes/          # Express/Nest Route declarations
├── services/        # Core business logic (No HTTP context here)
├── utils/           # Shared utility functions
└── workers/         # Background job processors (PDF gen, SMS)
```

## 24. Technology Stack Recommendation
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, React Query, Zustand.
- **Backend:** Node.js, Express/NestJS, TypeScript, Prisma ORM or TypeORM.
- **Database:** PostgreSQL 16+.
- **Cache:** Redis.
- **Queue:** BullMQ (backed by Redis) or RabbitMQ.
- **Cloud/Infra:** AWS or DigitalOcean.
- **File Storage:** AWS S3.

## 25. Infrastructure Cost Estimation (Monthly, Startup Scale)
- **Web App / API Servers (Containers):** ~$50 - $100
- **Managed PostgreSQL (HA):** ~$100 - $150
- **Managed Redis:** ~$30 - $50
- **S3 / CDN:** ~$20
- **Third Party (SMS, OTPs, Mapping):** ~$50+ (Usage dependent)
- **Total Initial Est.:** $250 - $400 / month, highly scalable based on exact footprint.

## 26. Development Roadmap (MVP → Scale)
**Phase 1: Foundation (Weeks 1-4)**
- Set up repos, CI/CD, and DB infrastructure.
- Deliver core Auth system and granular Role Based routing.
- Deliver Patient Profile and global Chamber mapping models.

**Phase 2: Core Clinic Flow (Weeks 5-8)**
- Build Appointment Booking engine with strict Chamber-Day validation.
- Implement Live Queue/Serial system.
- Construct the high-speed Digital Prescription UI for doctors.

**Phase 3: Integration & Admin (Weeks 9-12)**
- PDF Generation pipeline for Prescriptions.
- SMS/OTP Integrations.
- Admin dashboard (BMDC verifications, global settings).

**Phase 4: Optimization & Launch**
- Load testing concurrent serial booking.
- Security audits on Role leakage.
- Soft launch to beta clinics in Dhaka.
- Iterate based on Doctor UI UX feedback.
