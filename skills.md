# AI Developer Guidelines (`skill.md`)

## 🎯 Project Overview
You are acting as an expert Full Stack Developer assisting in the creation of a dual-sided healthcare platform. The application serves two distinct user types with separated experiences: 
1. **Doctors:** Interface for clinic management, patient history, and writing prescriptions.
2. **Patients:** Interface for booking appointments and viewing live trackers.

## 🛠 Core Tech Stack
* **Frontend Framework:** React 19
* **Language:** TypeScript (Strict mode enabled)
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Backend / Database:** Supabase (PostgreSQL)
* **Authentication:** Supabase Auth
* **Mobile Wrapper:** Capacitor (Targeting native Android)

---

## 🏗 Development Rules & Best Practices

### 1. Frontend & UI (React + TypeScript + Tailwind)
* **Strict Typing:** Never use `any`. Define clear `Interfaces` or `Types` for all component props, Supabase data models, and state variables.
* **Modern React:** Utilize React 19 features. Prioritize functional components, custom hooks for logic extraction, and modern state management.
* **Role Separation:** Keep Doctor and Patient components, layouts, and routing logically separated. Never mix access-level UI components.
* **Styling:** Use Tailwind CSS for all styling. Ensure layouts are mobile-first and fully responsive, as the end goal includes an Android app.

### 2. Backend & Security (Supabase)
* **Data Fetching:** Use the `@supabase/supabase-js` client for database interactions. Handle loading and error states globally or at the component level.
* **Row Level Security (RLS):** This is a strict requirement. When writing or modifying database schema, you must account for PostgreSQL RLS policies. Ensure Doctors can only see their patients/data, and Patients can only access their own records.
* **Auth:** Rely on Supabase's built-in authentication for session handling and role assignment.

### 3. Mobile Deployment (Capacitor)
* **Environment Awareness:** Write UI and UX logic that feels native on an Android device. Avoid web-only APIs (like `window.alert` or complex browser-specific routing) that might break or feel clunky in a Capacitor wrapper.
* **Plugin Usage:** Only implement or modify Capacitor plugins (e.g., Camera, Geolocation, Push Notifications) when explicitly asked to handle mobile-specific features. Provide web fallbacks where applicable.

### 4. General Code Guidelines
* **Clean Code:** Write modular, DRY (Don't Repeat Yourself) code. 
* **Focus:** When given a task, ask yourself if it applies to the Doctor context, the Patient context, or both before generating code.
* **Dependencies:** Do not introduce new libraries or dependencies without asking first, especially state managers or UI frameworks, as the stack is already defined.


More details:
## 1. Core Frontend Development
*   **React 19**: Understanding of the latest React features, including Server Components (if used), modern hooks, and the transition from React 18.
*   **TypeScript**: Advanced proficiency in TypeScript is critical. The project relies on strict typing for data structures like `Appointment`, `Doctor`, and `Prescription`.
*   **Vite**: Familiarity with Vite for development builds, environment variable management, and production bundling.
*   **Tailwind CSS**: Mastery of utility-first CSS for responsive design, especially since the app is used on both mobile (via Capacitor) and desktop.

## 2. Backend & Database (Supabase)
*   **PostgreSQL**: Deep understanding of relational database design, indexing, and complex queries.
*   **Supabase Client**: Experience using the `@supabase/supabase-js` library for CRUD operations and real-time subscriptions.
*   **Row Level Security (RLS)**: Crucial for data privacy. You must be able to write and audit SQL policies that ensure doctors only see their own patients and data.
*   **Supabase Auth**: Understanding of phone-based OTP (One-Time Password) flows for patients and traditional email/password flows for doctors.

## 3. Mobile Development
*   **Capacitor**: Knowledge of how Capacitor wraps web apps into native shells. Ability to sync web assets with the Android project using `npx cap sync`.
*   **Android Studio / Java**: Basic familiarity with Android project structures and Gradle to handle builds, signing APKs, and troubleshooting native plugin issues.

## 4. Specialized Tooling
*   **jsPDF & jsPDF-AutoTable**: Used for the most critical part of the app: generating digital prescriptions and medical reports.
*   **Recharts**: Proficiency in building data visualizations for the doctor's analytics dashboard.
*   **Lucide React**: Management of the icon system used throughout the UI.

## 5. Domain Knowledge (Healthcare SaaS)
*   **Queue Mechanics**: Understanding of "Live Serial" management, including how to handle cancellations, delays, and arrivals in a clinic environment.
*   **Prescription Workflows**: Familiarity with medical terminology and the workflow of a doctor when documenting diagnosis, symptoms, and medication.
*   **Compliance & Privacy**: Understanding the sensitivity of medical data and the importance of secure data handling (e.g., encryption at rest and in transit).

---

### **Development Roadmap for New Contributors**
1.  **Level 1**: Learn the `types.ts` file to understand the data architecture.
2.  **Level 2**: Master the `storage.ts` file to see how frontend actions translate to Supabase database calls.
3.  **Level 3**: Explore `views/doctor/SerialManager.tsx` to understand the most complex logic in the app (live queue management).
