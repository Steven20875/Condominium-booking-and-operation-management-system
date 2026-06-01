# ONE SPATIAL ILOILO 🏢
### Condominium Operation, Reservation, and Billing Management System

An offline-first, full-stack condominium operation and booking management system designed for **One Spatial Iloilo**. The application provides residents with an upscale portal to view available units, request reservations, pay bills via an interactive QR Ph simulation, and log maintenance tickets. Simultaneously, it equips administrators with a control room dashboard featuring live analytics, resident registries, booking approval queues, and logged activities.

---

## 🛠️ Technology Stack & Architecture

Unlike traditional web projects that rely on older, scattered stacks (such as PHP + Apache + MySQL inside XAMPP), **One Spatial Iloilo** is engineered using a **Unified TypeScript Stack**. This allows both the frontend and backend to share system models and speak the exact same language seamlessly.

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

## 🔑 Demo Access Accounts

You can test the two fundamental system levels using these seeded accounts:

| Role | Username / Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@condo.com` | `admin123` | Analytics, Approval management, Maintenance assigning, Log telemetry, Resident registry |
| **Resident 1** | `john@condo.com` | `john123` | Booking requests, Track QR Ph payment bills, File plumbing tasks |
| **Resident 2** | `alice@condo.com` | `alice123` | Dynamic reservations, View invoices, Notification desk |



