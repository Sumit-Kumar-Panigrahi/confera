<div align="center">

# 🎥 Confera

**Enterprise Real-Time WebRTC Video Conferencing & Workspace Intelligence Platform**

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://confera-eight.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon%20Postgres-00E599?logo=postgresql)](https://neon.tech)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk)](https://clerk.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[**Live Demo**](https://confera-eight.vercel.app) • [**Report Bug**](https://github.com/Sumit-Kumar-Panigrahi/confera/issues) • [**Request Feature**](https://github.com/Sumit-Kumar-Panigrahi/confera/issues)

</div>

---

## 📌 Overview

**Confera** is a modern, high-performance video conferencing and collaboration platform built with **WebRTC**, **Socket.IO**, **React 19**, **Tailwind CSS v4**, **Node.js**, **Neon Serverless PostgreSQL**, and **Clerk**.

It delivers low-latency mesh video conferences, high-definition screen sharing, live chat transcript archiving, calendar schedule synchronization, and subscription tier management directly in the browser—with zero plugins or desktop software required.

---

## ✨ Key Features

- **⚡ Real-Time WebRTC Mesh Video**: Peer-to-peer adaptive bitrate streaming, studio-grade audio with acoustic echo cancellation.
- **🖥️ Instant Screen Sharing**: Full HD display capture and real-time presentation capabilities with active speaker detection.
- **💬 Persistent In-Room Chat**: Real-time Socket.IO messaging with full message archiving into Neon PostgreSQL.
- **👥 Live Attendee Roster**: Participant presence monitoring, host controls, and connection state indicators.
- **🔒 Clerk Identity & Auth Gate**: Strict route guards for dashboards, personal rooms, and conferences with automatic user synchronization.
- **📊 Real Analytics Dashboard**: 7-day dynamic activity timeline, completed/active meeting metrics, and monthly capacity counters.
- **💳 Clerk Pricing & Plans**: Embedded `<PricingTable />` for scalable subscriptions and tier-based room limits.
- **🔗 Permanent Personal Meeting Rooms (PMI)**: Dedicated permanent meeting links and one-click quick join codes.
- **📅 Interactive Calendar & Integrations**: Meeting day indicators, scheduling dialogs, and workspace integrations (Google Calendar, Slack, Notion).

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **Core**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Authentication**: [@clerk/react](https://clerk.com/)
- **Signaling & WebSockets**: [Socket.IO Client](https://socket.io/)
- **Toasts**: [react-hot-toast](https://react-hot-toast.com/)

### Backend (`server/`)
- **Runtime**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/)
- **Signaling Engine**: [Socket.IO](https://socket.io/)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **Auth Middleware**: [@clerk/express](https://clerk.com/)

---

## 📂 Project Structure

```bash
confera/
├── client/                     # Frontend Vite + React application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── meeting/        # VideoGrid, VideoTile, ControlBar, ChatPanel, ParticipantList
│   │   │   ├── sessions/       # SessionCard, SessionDetailsModal, EmptySessions, Tabs
│   │   │   ├── ui/             # Dialog, Button, Reusable UI
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Protectedlayout.jsx  # Master Dashboard Shell (Sidebar + Header)
│   │   ├── hooks/
│   │   │   ├── useWebRTC.js    # WebRTC mesh peer connection lifecycle
│   │   │   └── useChat.js      # Socket.IO chat state management
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx # Hero showcase, Clerk PricingTable, Live Stage Preview
│   │   │   ├── Dashboard.jsx   # Analytics, calendar, upcoming sessions, PMI
│   │   │   ├── MeetingRoom.jsx # WebRTC multi-party stage
│   │   │   ├── Sessions.jsx    # Real meeting logs & attendee transcripts
│   │   │   ├── Pricing.jsx     # Clerk subscription management
│   │   │   └── Login.jsx       # Branded authentication portal
│   │   ├── services/
│   │   │   ├── api.js          # REST client with JWT credentials
│   │   │   └── socket.js       # Socket.IO connection manager
│   │   ├── App.jsx             # Router definition
│   │   └── main.jsx            # ClerkProvider & root mounting
│   ├── .env.example
│   └── package.json
├── server/                     # Backend Express + Socket.IO server
│   ├── config/
│   │   └── db.js               # Neon PostgreSQL schema initialization
│   ├── controllers/
│   │   ├── meetingController.js # CRUD for sessions, stats, logs
│   │   └── webhookController.js # Clerk webhook handler
│   ├── middleware/
│   │   └── auth.js             # Clerk auth verification & Neon user sync
│   ├── routes/
│   │   └── meetingRoutes.js
│   ├── socket.js               # WebRTC signaling (offer, answer, candidate, chat)
│   ├── server.js               # Main HTTP & WebSocket server entrypoint
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Neon PostgreSQL Database](https://neon.tech/) account
- [Clerk](https://clerk.com/) account for API keys

### 1. Clone the Repository
```bash
git clone https://github.com/Sumit-Kumar-Panigrahi/confera.git
cd confera
```

### 2. Configure Backend
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=3000
ORIGINS=http://localhost:5173,http://localhost:3000
DATABASE_URL=postgresql://your_user:your_password@ep-your-db.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

Start the backend server:
```bash
node server.js
```
The server will start on `http://localhost:3000` and automatically initialize database tables (`users`, `meetings`, `meeting_participants`, `meeting_messages`).

### 3. Configure Frontend
Open a new terminal window:
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SERVER_URL=http://localhost:3000
```

Start the development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌐 Production Deployment Guide

### Phase 1: Deploy Backend (Render / Railway)
1. Link your GitHub repository (`Sumit-Kumar-Panigrahi/confera`) to **Render**.
2. Create a new **Web Service**:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. Add environment variables:
   - `DATABASE_URL`: Your Neon DB connection string
   - `CLERK_PUBLISHABLE_KEY`: Clerk publishable key
   - `CLERK_SECRET_KEY`: Clerk secret key
   - `ORIGINS`: Your Vercel frontend URL (e.g. `https://confera-eight.vercel.app`)

### Phase 2: Deploy Frontend (Vercel)
1. Import repository to **Vercel**.
2. Select **`client`** as Root Directory.
3. Framework Preset: **Vite**.
4. Add environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `VITE_SERVER_URL`: Your live backend URL from Render (e.g. `https://confera-backend.onrender.com`)
5. Click **Deploy**.

---

## 🛡️ Security & Privacy

- **Mesh P2P Video**: Video and audio streams travel directly between peers using encrypted WebRTC media channels (DTLS-SRTP).
- **Authentication**: Protected via Clerk industry-standard JSON Web Tokens (JWT) with automatic user credential rotation.
- **Database Safety**: SQL queries parameterized via Neon serverless tagged template literals, immune to SQL injection.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).

---

<div align="center">
Made with ❤️ by <a href="https://github.com/Sumit-Kumar-Panigrahi">Sumit Kumar Panigrahi</a>
</div>
