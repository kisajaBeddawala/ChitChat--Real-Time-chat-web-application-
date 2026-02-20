import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from 'url';
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import groupRouter from "./routes/groupRoutes.js";
import { Server } from "socket.io";
import Group from "./models/Group.js";

const app = express();
const server = http.createServer(app)

// socket io setup
export const io = new Server(server, {
    cors:{
        origin: [
            "http://localhost:5173",
            "https://localhost:5173", 
            "http://localhost:5174",
            "https://localhost:5174",
            "http://10.10.1.60:5173",
            "https://10.10.1.60:5173",
            "http://10.10.1.60:5174",
            "https://10.10.1.60:5174",
            /^https?:\/\/10\.10\.\d+\.\d+:[0-9]+$/,
            /^https?:\/\/192\.168\.\d+\.\d+:[0-9]+$/,
            /^https?:\/\/172\.\d+\.\d+\.\d+:[0-9]+$/,
            /^https:\/\/.*\.ngrok\.io$/,
            /^https:\/\/.*\.ngrok-free\.app$/,
            /^https:\/\/.*\.ngrok-free\.dev$/,
            /^https:\/\/.*\.tunnels\.dev$/,
            "https://gatelike-elliott-elliott-unexperientially.ngrok-free.dev"
        ],
        credentials: true
    }
});

// store online users
export const userSocketMap = {}

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("🔌 New client connected:", userId);
    console.log("📍 Client IP:", socket.handshake.address);
    console.log("🌐 Client headers:", socket.handshake.headers.origin);

    if(userId){
        userSocketMap[userId] = socket.id;
        console.log("👤 User mapped:", userId, "->", socket.id);
        
        // Join user to all their group rooms
        joinUserGroups(socket, userId);
    } else {
        console.log("⚠️  No userId provided in connection");
    }

    console.log("👥 Current online users:", Object.keys(userSocketMap));
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Handle joining a specific group
    socket.on("joinGroup", (groupId) => {
        socket.join(`group_${groupId}`);
        console.log(`User ${userId} joined group ${groupId}`);
    });

    // Handle leaving a specific group
    socket.on("leaveGroup", (groupId) => {
        socket.leave(`group_${groupId}`);
        console.log(`User ${userId} left group ${groupId}`);
    });

    // Video Call Signaling Events
    socket.on("call-user", (data) => {
        const { to, offer, caller } = data;
        const receiverSocketId = userSocketMap[to];
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("incoming-call", {
                from: userId,
                offer,
                caller
            });
            console.log(`Call initiated from ${userId} to ${to}`);
        }
    });

    socket.on("answer-call", (data) => {
        const { to, answer } = data;
        const callerSocketId = userSocketMap[to];
        
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-answered", {
                from: userId,
                answer
            });
            console.log(`Call answered by ${userId} to ${to}`);
        }
    });

    socket.on("call-declined", (data) => {
        const { to } = data;
        const callerSocketId = userSocketMap[to];
        
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-declined", {
                from: userId
            });
            console.log(`Call declined by ${userId} to ${to}`);
        }
    });

    socket.on("call-ended", (data) => {
        const { to } = data;
        const otherUserSocketId = userSocketMap[to];
        
        if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("call-ended", {
                from: userId
            });
            console.log(`Call ended by ${userId} to ${to}`);
        }
    });

    socket.on("ice-candidate", (data) => {
        const { to, candidate } = data;
        const otherUserSocketId = userSocketMap[to];
        
        if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("ice-candidate", {
                from: userId,
                candidate
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected: ", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// Helper function to join user to all their groups
async function joinUserGroups(socket, userId) {
    try {
        const userGroups = await Group.find({ members: userId });
        userGroups.forEach(group => {
            socket.join(`group_${group._id}`);
        });
        console.log(`User ${userId} joined ${userGroups.length} groups`);
    } catch (error) {
        console.log("Error joining user groups:", error);
    }
}

app.use(express.json({limit:'4mb'}))
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5173", // Local HTTP access
        "https://localhost:5173", // Local HTTPS access 
        "http://localhost:5174", // Local HTTP access (alternate port)
        "https://localhost:5174", // Local HTTPS access (alternate port)
        /^https?:\/\/10\.10\.\d+\.\d+:[0-9]+$/, // Any 10.10.x.x network
        /^https?:\/\/192\.168\.\d+\.\d+:[0-9]+$/, // Any 192.168.x.x network
        /^https?:\/\/172\.\d+\.\d+\.\d+:[0-9]+$/, // Any 172.x.x.x network (private networks)
        /^https:\/\/.*\.ngrok\.io$/, // Support for old ngrok format
        /^https:\/\/.*\.ngrok-free\.app$/, // Support for new ngrok format
        /^https:\/\/.*\.ngrok-free\.dev$/, // Support for new ngrok format
        /^https:\/\/.*\.ngrok\.app$/, // Support for newer ngrok format
        /^https:\/\/.*\.tunnels\.dev$/ // Support for other tunnel services
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}))

app.use("/api/status", (req,res) => res.send("server is live"))
app.use("/api/auth",userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production or when accessed via ngrok, serve the built React app
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
    // Serve static files from frontend build
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    
    // Handle React Router routes - serve index.html for non-API requests
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
            res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
        } else {
            next();
        }
    });
}

// connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5000

// For local development
if (process.env.NODE_ENV !== "production") {
    const HOST = '0.0.0.0'; // Listen on all network interfaces
    server.listen(PORT, HOST, () => {
        console.log(`🚀 Server is running on:`);
        console.log(`   - Local:   http://localhost:${PORT}`);
        console.log(`   - Network: http://0.0.0.0:${PORT}`);
        console.log(`\n💡 To allow friend access:`);
        console.log(`   1. Run: ngrok http ${PORT}`);
        console.log(`   2. Share the ngrok HTTPS URL with your friend`);
        console.log(`   3. Update VITE_NGROK_BACKEND_URL in frontend/.env with the ngrok URL\n`);
    });
}

// Export for Vercel serverless
export default server;