# One Spatial Iloilo
### Web-Based Condominium Booking and Operations Management System

## Overview

One Spatial Iloilo is a web-based Condominium Booking and Operations Management System developed as a Capstone Project. The system is designed to simplify the process of managing condominium reservations while providing residents with a convenient way to view available units and book online.

A recent fix resolved a resident dashboard login issue where a missing icon reference caused a black screen after login. The dashboard now renders correctly after authentication.

The application provides separate access for administrators and residents. Administrators can manage bookings, residents, payments, and reports, while residents can browse available units, reserve a condominium, and monitor their booking status through an easy-to-use web interface.

To improve accessibility, the system also supports Google Sign-In through Firebase Authentication while keeping the existing email and password authentication connected to the backend database.

---
    
## Objectives

The main objectives of the project are:

- Simplify the condominium reservation process.
- Provide an organized booking management system.
- Allow administrators to manage residents, bookings, payments, and reports efficiently.
- Improve decision-making through analytics and reporting.
- Provide a secure authentication system for users.

---

## Key Features

### Public Website

- Modern landing page
- About section
- Available condominium units
- Features overview
- Contact information

### Resident Features

- User Registration
- Secure Login
- Google Sign-In
- Browse Available Units
- Book Condominium Units
- View Booking Status
- Manage Personal Profile

### Administrator Features

- Dashboard
- Booking Management
- Resident Management
- Payment Monitoring
- Unit Management
- Reports
- Analytics Dashboard

---

## Authentication

The system uses two authentication methods.

### Email and Password

Email and password authentication is handled by the application's Express backend and database.

### Google Sign-In

Google authentication is implemented using Firebase Authentication. Once a user successfully signs in with Google, the account is synchronized with the application's backend before accessing the system.

---

## Technologies Used

### Frontend

- React
- TypeScript
- Vite
- HTML5
- CSS3

### Backend

- Express.js
- Node.js

### Database

- Application Database
- Firebase Authentication (Google Sign-In only)

### Other Technologies

- Firebase
- REST API
- Git
- GitHub

---

## System Modules

### Landing Page

Displays project information, available units, features, and allows users to sign in.

### Booking Module

Allows residents to reserve available condominium units.

### Resident Module

Stores resident information and booking records.

### Payment Module

Tracks reservation payments and payment status.

### Dashboard

Provides administrators with an overview of system activities.

### Analytics

Displays booking trends and operational reports to support decision-making.

---

## User Roles

### Administrator

Administrators can:

- Manage residents
- Manage bookings
- Manage condominium units
- Monitor payments
- View analytics
- Generate reports

### Resident

Residents can:

- Register an account
- Log in securely
- Sign in using Google
- View available units
- Book condominium units
- View booking history

---

## Project Structure

```
condominium/
│
├── src/
├── server/
├── data/
├── docs/
├── dist/
├── package.json
├── server.ts
└── README.md
```

---

## Installation

Clone the repository.

```bash
git clone https://github.com/Steven20875/Condominium-booking-and-operation-management-system.git
```

Open the project folder.

```bash
cd condominium
```

Install dependencies.

```bash
npm install
```

Create a `.env` file and configure your Firebase credentials.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Run the development server.

```bash
npm run dev
```

---

## Google Authentication Setup

1. Create a Firebase Project.
2. Enable Google Authentication.
3. Add your Firebase Web App.
4. Copy the Firebase configuration into the `.env` file.
5. Restart the application.

## Private Government ID Storage

Government ID files are stored in a **Private** Vercel Blob store. Neon PostgreSQL
stores only the Blob pathname and verification metadata. The Firebase configuration
above is used for Authentication; Firebase Cloud Storage is not used for Government IDs.

For Vercel, create a Blob store with **Private** access and connect it to this project
for the Production and Preview environments. Vercel supplies the Blob store identity
and short-lived OIDC credentials to connected functions. Do not add a public Blob URL
or expose a Blob token to frontend variables.

For local development, use a private Blob store and provide its `BLOB_READ_WRITE_TOKEN`
in `.env` (or pull the Vercel Development environment with `vercel env pull`). Keep the
token server-side and never use the `VITE_` prefix. Government ID uploads remain limited
to 3 MiB and JPEG, PNG, or PDF.

---

## Future Improvements

Possible improvements for future development include:

- Online payment gateway integration
- Email notifications
- SMS notifications
- QR Code for reservations
- Mobile application
- Maintenance request management
- Visitor management system
- Real-time notifications

---

## Developers

Capstone Project

Bachelor of Science in Information Technology

PHINMA University of Iloilo

Academic Year 2026–2027

---

## License

This project was developed for academic purposes only.

All rights reserved © 2026.