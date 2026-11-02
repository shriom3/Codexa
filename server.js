import express from "express";
import http from "http";
import { Server } from "socket.io";
import ACTIONS from "./src/Actions.js";
import LANGUAGES from "./src/languages.js";

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://code-sync-rd.vercel.app",
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
    },
    pingInterval: 25000, // Send heartbeat every 25 seconds
    pingTimeout: 60000, // Disconnect if no response for 60 seconds
});

const userSocketMap = {};
const roomLanguages = new Map();

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => ({
            socketId,
            username: userSocketMap[socketId],
        })
    );
}

io.on("connection", (socket) => {

    try {
        socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
            userSocketMap[socket.id] = username;
            socket.join(roomId);

            const clients = getAllConnectedClients(roomId);
            const language = roomLanguages.get(roomId) || "cpp";
            clients.forEach(({ socketId }) => {
                io.to(socketId).emit(ACTIONS.JOINED, {
                    clients,
                    username,
                    socketId: socket.id,
                    language,
                });
            });
        });

        socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
            if (!LANGUAGES.some((option) => option.value === language)) {
                console.warn(`Ignoring unsupported language "${language}" for room "${roomId}"`);
                return;
            }

            roomLanguages.set(roomId, language);
            io.to(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
        });

        socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
            socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
        });

        socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
            io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
        });

        socket.on("disconnecting", () => {
            const rooms = [...socket.rooms];
            rooms.forEach((roomId) => {
                if (roomId !== socket.id && io.sockets.adapter.rooms.get(roomId)?.size === 1) {
                    roomLanguages.delete(roomId);
                }
                socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                    socketId: socket.id,
                    username: userSocketMap[socket.id],
                });
            });

            delete userSocketMap[socket.id];
            socket.leave();
        });


    } catch (error) {
        console.error("❌ Socket error:", error);
    }
});
app.get("/", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
