import { io } from "socket.io-client";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
    || (import.meta.env.DEV
        ? "http://localhost:5000"
        : "https://codesync-backend-7pna.onrender.com");

export const initSocket = () => {
    return io(BACKEND_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
    });
};
