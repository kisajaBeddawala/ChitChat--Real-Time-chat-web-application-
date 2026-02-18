import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
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
        origin: "*",
    }
});

// store online users
export const userSocketMap = {}

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("New client connected: ", userId);

    if(userId){
        userSocketMap[userId] = socket.id;
        
        // Join user to all their group rooms
        joinUserGroups(socket, userId);
    }

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
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}))

app.use("/api/status", (req,res) => res.send("server is live"))
app.use("/api/auth",userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);

// connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5000

// For local development
if (process.env.NODE_ENV !== "production") {
    server.listen(PORT, () => console.log("Server is running on PORT : " + PORT))
}

// Export for Vercel serverless
export default server;