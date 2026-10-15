import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import { initDB } from "./config/db.js";
import { clerkMiddleware } from '@clerk/express';
import { handleClerkWebhook } from "./controllers/webhookController.js";
import meetingRouter from "./routes/meetingRoutes.js";
import { Server } from "socket.io";
import { setupSocketIO } from "./socket.js";

const app = express();
const server = http.createServer(app);

// Connect to Neon & Initialize Tables
await initDB();

const allowedOrigins = process.env.ORIGINS 
    ? process.env.ORIGINS.split(",").map(o => o.trim().replace(/\/$/, "")) 
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174"];

const checkOrigin = (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(cleanOrigin)) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
        return callback(null, true);
    }
    if (/^https:\/\/.*\.vercel\.app$/.test(cleanOrigin)) {
        return callback(null, true);
    }
    return callback(null, true);
};

app.use(cors({
    origin: checkOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(cookieParser());

// Clerk Webhook needs raw body
app.use("/api/clerk", express.raw({ type: "application/json" }), handleClerkWebhook);

app.use(express.json());
app.use(clerkMiddleware());

// Health & Status routes
app.get("/", (_req, res) => res.send("Confera API is Live!"));
app.get("/api/health", (_req, res) => res.json({ status: "healthy", timestamp: new Date().toISOString() }));

// Meeting APIs
app.use("/api/meetings", meetingRouter);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: checkOrigin,
        credentials: true,
        methods: ["GET", "POST"]
    }
});

setupSocketIO(io);

// Centralized Error Handler
app.use((err, _req, res, _next) => {
    console.error(`[Error] ${err.message}`);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});