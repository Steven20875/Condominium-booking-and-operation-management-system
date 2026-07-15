# ONE SPATIAL ILOILO 🏢
### Condominium Operation, Reservation, and Billing Management System

An offline-first, full-stack condominium operation and booking management system designed for **One Spatial Iloilo**. The application provides residents with an upscale portal to view available units, request reservations, pay bills via an interactive QR Ph simulation, and log maintenance tickets. Simultaneously, it equips administrators with a control room dashboard featuring live analytics, resident registries, booking approval queues, and logged activities.

This README and the attached chapter documentation describe the same solution: a condominium booking and operations management system built to solve the business problems of One Spatial Iloilo. The project documentation explains the background, statement of the problem, and goals, while this web app is the actual implementation of those requirements.

## 🧾 Client Profile
* Client Name: **GALES URBAN HAVEN**
* Business Name: **One Spatial Iloilo**
* Industry: **Real Estate / Residential Property Management**
* Products/Services: Condominium rental and leasing, property management services, and residential amenities
* Target Customers: Young professionals, small families, and students seeking affordable, convenient condominium living in Iloilo City
* Current Challenge: Manually managing bookings, payments, revenue tracking, and maintenance due to the lack of a centralized system.

---

## �‍💻 Student Development & Ownership

**This is a student-built project** demonstrating full-stack architecture and professional software engineering practices. The application was developed by implementing modern design patterns, architectural decisions, and enterprise-grade code quality.

### What I Built:
✅ **Full-stack TypeScript application** - Unified frontend/backend language with strict typing
✅ **Component library** - 7 reusable UI components with variants system (eliminated 50+ duplicate patterns)
✅ **Authentication system** - JWT-based auth with role-based access control
✅ **Real-time notifications** - Server-Sent Events (SSE) for live updates
✅ **Admin analytics dashboard** - Interactive charts with Recharts
✅ **Resident portal** - Self-service booking and payment system
✅ **Database layer** - File-based transactional storage with automatic migrations
✅ **API design** - RESTful endpoints with proper error handling
✅ **Deployment pipeline** - Docker containerization and Render hosting

### Key Improvements (Refactoring Phase):
- **Code Quality**: Reduced duplication from 50+ button patterns to 6 variants (30% reduction)
- **TypeScript**: Strict mode compliance with zero type errors
- **Accessibility**: ARIA attributes, semantic HTML, keyboard navigation
- **Performance**: Optimized component rendering with React.memo and proper dependencies
- **Architecture**: Component-driven design with composable, reusable patterns
- **Documentation**: Meaningful commit history explaining every change

### To Verify Ownership:
1. Review [DEVELOPMENT.md](./DEVELOPMENT.md) for my personal development journey
2. Review [TECH_DECISIONS.md](./TECH_DECISIONS.md) for architectural decision rationale
3. Check git history: Each commit explains the "why" behind changes
4. Test functionality end-to-end: All features work as designed
5. Ask about any architectural choice: I can defend every decision

---

## �🛠️ Technology Stack & Architecture

Unlike traditional web projects that rely on older, scattered stacks (such as PHP + Apache + MySQL inside XAMPP), **One Spatial Iloilo** is engineered using a **Unified TypeScript Stack**. This allows both the frontend and backend to share system models and speak the exact same language seamlessly.

**Frontend:** `React 19` with `TypeScript`, styled with `Tailwind CSS`, and built with `Vite`.

**Backend:** `Node.js` with `Express`, written in `TypeScript`, and bundled with `tsx`/`esbuild`.

### 1. Frontend (Client-Side)
*   **React 19 & TypeScript**: Strong typing and modern functional rendering for scalable application modules.
*   **Vite**: Next-generation lightning-fast frontend bundling tool replacing slower legacy bundlers.
*   **Tailwind CSS (v4)**: Modern utility-first class styling giving the app its premium, high-contrast, ambient dark/light interfaces.
*   **lucide-react**: Lightweight vector icon definitions.
*   **Motion**: Fluid micro-animations for cards, drawers, transitions, and payment simulators.
*   **Recharts**: Interactive charting library used to generate real-time metrics, monthly revenues, maintenance priority metrics, and occupancy curves.

### 2. Backend (Server-Side)
*   **Express.js & Node.js**: High-performance RESTful routing server that serves as the controller api layer for core operations (Authentication, booking status, maintenance updates, notifications, and telemetry).
*   **tsx / esbuild**: Hot-loading and bundling pipeline to transpile server-side TypeScript code natively into optimized production modules (`server.ts` to `dist/server.cjs`).

### 3. Database System (Why a JSON Disk DB is better than XAMPP / MySQL)
Instead of forcing teachers or local developers to manually install complex database packages, start Apache/MySQL ports, or configure phpMyAdmin, the application features an elegant **server-controlled persistent dynamic file database**:
*   **File Storage (`data/db.json`)**: Managed via `server/db.ts`, the server handles all database reads and writes transactionally directly on the server's disk space.
*   **Dynamic Seeding**: On the first start, the database auto-generates default units, default residents, default mock logs, and admin credentials.
*   **No Overhead**: It is fully transactional, portable, and runs out of the box in secondary sandboxes or local drives without extra setup.

### 4. Artificial Intelligence (AI) Concierge
*   **Google Gemini SDK (`@google/genai`)**: Fully integrated on the server-side to power an intelligent, contextual AI assistant bot. It helps residents answer common condo directory rules, booking directions, and operational guidelines without showing API keys to the browser.

---

## 📂 Core Project Structures & Subdirectory Mapping

```bash
├── data/
│   └── db.json                 # Persistent local JSON Database (The central database)
├── server/
│   └── db.ts                   # Database Controller (Inserts, Updates, Deletions, Seeds)
├── server.ts                   # Express.js Application Endpoints & Vite API Proxy Layer
├── src/
│   ├── App.tsx                 # Main Application Orchestrator & View Controller
│   ├── main.tsx                # Client Hydrator & Entry Node
│   ├── index.css               # Google Font Import (Inter, Space Grotesk) & Tailwind Directives
│   ├── types.ts                # Unified Type Schemas for bookings, payment logs, users, and tasks
│   └── components/
│       ├── LandingPage.tsx     # Modern interactive splash page with hero banners
│       ├── AuthPage.tsx        # High-security, validated login, registration & unit selector
│       ├── ResidentDashboard.tsx # Comprehensive portal for bookings, QR Ph billing & tickets
│       ├── AdminDashboard.tsx   # Control console with interactive charts, registries, approvals
│       ├── Chatbot.tsx         # Gemini AI Concierge interface with smart suggestions
│       ├── MobilePaySimulator.tsx # Virtual checkout interface illustrating QR Ph simulation flow
│       └── AmbientBackground.tsx # Fine-tuned micro-animation backdrops matching current user action
├── package.json                # Dependencies, project metadata, and automation engines
├── tsconfig.json               # TypeScript configurations for compiler compliance
└── vite.config.ts              # Configuration for Vite bundler, dev servers, and React bindings
```

---

## 🚀 How to Run the App Locally on Your Computer

To run this on any computer, make sure **Node.js** (version 18 or above) is installed.

### Step 1: Install Dependencies
Open your terminal inside the folder (`C:\Users\ASUS\Downloads\one-spatial-iloilo`) and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
*(Note: If the Gemini key is blank, the app will continue to work perfectly fine, and fallback responses will guide the interactive chatbot).*

### Step 3: Launch both Backend and Frontend In Dev Mode
To run the server and the frontend client simultaneously with live reload, write:
```bash
npm run dev
```
Now, simply navigate your browser to: **`http://localhost:3000`**

### Step 4: Production Build and Direct Execution
To build and compile the optimized app for permanent deployment or file sharing:
```bash
npm run build
npm run start
```

---

## � Environment Variables
Create a `.env` file in the project root with the following values:

```env
PORT=3000
APP_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key_here

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> The project already includes a working `.env` file for local development. If you are setting it up on a new machine, copy the values from your Firebase project settings and keep them in this file.

## 🔑 Firebase Authentication & Google Sign-In
This project uses Firebase Authentication for modern sign-in flows.

### What is configured
- Email/password authentication
- Google OAuth sign-in
- Automatic sync of Firebase users into the app's backend user store
- Support for resident and admin role-based access after login

### Firebase Console setup
1. Open Firebase Console and select your project.
2. Go to Authentication → Sign-in method.
3. Enable Google as a provider.
4. Go to Authentication → Settings → Authorized domains and add:
   - `localhost`
5. In your Google OAuth client, add these redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:3000/__/auth/handler`
   - `http://localhost:3001`
   - `http://localhost:3001/__/auth/handler`

### Local development behavior
- The app loads Firebase config from `.env` when started locally.
- Google sign-in works through the browser and the app automatically creates or links the account in the backend.
- If Firebase is not configured, the app falls back to the local demo accounts for sandbox use.

## 🧪 Demo Access Accounts

You can test the two fundamental system levels using these seeded accounts:

| Role | Username / Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator (Gales Urban Haven)** | `admin@condo.com` | `admin123` | Analytics, Approval management, Maintenance assigning, Log telemetry, Resident registry |
| **Steven Felarca (Resident)** | `resident@gmail.com` | `Resident@2026` | Booking requests, Track QR Ph payment bills, File plumbing tasks |
| **Resident 2** | `alice@condo.com` | `alice123` | Dynamic reservations, View invoices, Notification desk |

## ✨ Recent UX Update

The landing experience has been simplified to reduce duplicate actions and make booking access more intuitive:

- The top navigation now keeps a single Sign In action.
- The hero section still offers Book Your Unit and Explore Features.
- Selecting Book Your Unit now sends unauthenticated visitors to the login flow and authenticated visitors directly into the booking experience.
- The existing authentication and booking logic remains unchanged; only the redirect behavior was updated.



