// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => res.send("Backend is running!"));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Global waiting queue
let waiting = []; // [{ id, username, university }]

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinQueue", ({ username, university }) => {
        if (!username || !university) {
            io.to(socket.id).emit("systemMessage", {
                message: "Username and university are required."
            });
            return;
        }

        // If already waiting, ignore duplicate join
        if (waiting.some((u) => u.id === socket.id)) {
            io.to(socket.id).emit("waiting", { message: "Already waiting..." });
            return;
        }

        waiting.push({ id: socket.id, username, university });
        io.to(socket.id).emit("waiting", { message: "Waiting for a peer..." });

        // If >=2 -> pick 2 random distinct indices
        if (waiting.length >= 2) {
            const idx1 = Math.floor(Math.random() * waiting.length);
            let idx2 = Math.floor(Math.random() * waiting.length);
            while (idx2 === idx1) idx2 = Math.floor(Math.random() * waiting.length);

            const user1 = waiting[idx1];
            const user2 = waiting[idx2];

            // remove both from waiting
            waiting = waiting.filter((u) => u.id !== user1.id && u.id !== user2.id);

            const room = `${user1.id}-${user2.id}`;
            io.to(user1.id).emit("paired", {
                partner: `${user2.username} (${user2.university})`,
                room
            });
            io.to(user2.id).emit("paired", {
                partner: `${user1.username} (${user1.university})`,
                room
            });

            const s1 = io.sockets.sockets.get(user1.id);
            const s2 = io.sockets.sockets.get(user2.id);
            if (s1) s1.join(room);
            if (s2) s2.join(room);
        }
    });

    // Allow client to cancel waiting
    socket.on("leaveQueue", () => {
        waiting = waiting.filter((u) => u.id !== socket.id);
        io.to(socket.id).emit("leftQueue");
    });

    socket.on("sendMessage", ({ room, message, sender }) => {
        io.to(room).emit("receiveMessage", { sender, message });
    });

    socket.on("leaveChat", ({ room }) => {
        socket.leave(room);
        io.to(room).emit("partnerLeft");
        io.to(socket.id).emit("leftChat"); // optional ack for the one who left
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        // Remove from waiting if still queued
        waiting = waiting.filter((u) => u.id !== socket.id);
    });

    // Notify partner(s) if someone disconnects while in a room
    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                io.to(room).emit("systemMessage", {
                    message: "Your partner has disconnected."
                });
            }
        }
    });

    socket.on("typing", ({ room, username }) => {
        socket.to(room).emit("typing", { username });
    });

    socket.on("stopTyping", ({ room }) => {
        socket.to(room).emit("stopTyping");
    });
});

server.listen(4000, () => console.log("Server running on port 4000"));
