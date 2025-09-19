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
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

// Global waiting queue
let waiting = []; // { id, username, university }
const recentPartners = new Map(); // socketId -> Set of partnerIds
const blockedPairs = new Set(); // store "id1-id2"


// helper: add socket to waiting (no duplicates)
function addToQueue(s) {
    if (!s || !s.connected) return false;
    const id = s.id;
    const uname = s.data?.username;
    const uni = s.data?.university;
    if (!uname || !uni) return false;
    if (waiting.find((u) => u.id === id)) return false;
    waiting.push({ id, username: uname, university: uni });
    io.to(id).emit("waiting", { message: "Waiting for a peer..." });
    return true;
}

function addRecent(a, b) {
    if (!recentPartners.has(a)) recentPartners.set(a, new Set());
    if (!recentPartners.has(b)) recentPartners.set(b, new Set());
    recentPartners.get(a).add(b);
    recentPartners.get(b).add(a);

    // limit memory (keep max 3 recents)
    if (recentPartners.get(a).size > 3) {
        const first = recentPartners.get(a).values().next().value;
        recentPartners.get(a).delete(first);
    }
    if (recentPartners.get(b).size > 3) {
        const first = recentPartners.get(b).values().next().value;
        recentPartners.get(b).delete(first);
    }
}

function makePairKey(id1, id2) {
  return [id1, id2].sort().join("-");
}

function tryPair() {
  while (waiting.length >= 2) {
    let matched = false;

    for (let i = 0; i < waiting.length; i++) {
      for (let j = i + 1; j < waiting.length; j++) {
        const u1 = waiting[i];
        const u2 = waiting[j];
        const key = makePairKey(u1.id, u2.id);

        if (blockedPairs.has(key)) continue; // skip recently blocked pair

        // Found a valid pair
        waiting = waiting.filter((u) => u.id !== u1.id && u.id !== u2.id);

        const s1 = io.sockets.sockets.get(u1.id);
        const s2 = io.sockets.sockets.get(u2.id);
        if (!s1 || !s2) continue;

        const room = `${u1.id}-${u2.id}-${Date.now()}`;
        s1.join(room);
        s2.join(room);

        io.to(u1.id).emit("paired", {
          partner: `${u2.username} (${u2.university})`,
          room,
        });
        io.to(u2.id).emit("paired", {
          partner: `${u1.username} (${u1.university})`,
          room,
        });

        // block them from reconnecting instantly
        blockedPairs.add(key);
        setTimeout(() => blockedPairs.delete(key), 5000); // unblock after 5s

        matched = true;
        break;
      }
      if (matched) break;
    }

    if (!matched) break; // no available non-blocked pair found
  }
}


io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinQueue", ({ username, university }) => {
        if (!username || !university) {
            io.to(socket.id).emit("systemMessage", { message: "Username and university are required." });
            return;
        }

        // save on socket.data so we can requeue later
        socket.data.username = username;
        socket.data.university = university;

        addToQueue(socket);
        tryPair();
    });

    // Next: end room for everyone in it and requeue all members (once each)
    socket.on("nextChat", ({ room }) => {
        if (!room) return;

        // Notify everyone currently in the room
        io.to(room).emit("systemMessage", { message: "Chat ended. Searching for a new partner..." });

        // Snapshot room members (set of ids) before removing
        const members = Array.from(io.sockets.adapter.rooms.get(room) || []);

        // For each member: force leave then requeue (addToQueue guards duplicates)
        members.forEach((sid) => {
            const s = io.sockets.sockets.get(sid);
            if (!s) return;
            s.leave(room);
            addToQueue(s);
        });

        // Attempt to pair again
        tryPair();
    });

    socket.on("leaveChat", ({ room }) => {
        if (!room) return;
        // Inform remaining member(s)
        socket.leave(room);
        io.to(room).emit("partnerLeft");
        // NOTE: we do NOT automatically requeue others here; client will handle requeueing on partnerLeft (keeps behavior consistent)
    });

    socket.on("sendMessage", ({ room, message, sender }) => {
        if (!room) return;
        io.to(room).emit("receiveMessage", { sender, message });
    });

    socket.on("typing", ({ room, username }) => {
        if (!room) return;
        socket.to(room).emit("typing", { username });
    });

    socket.on("stopTyping", ({ room }) => {
        if (!room) return;
        socket.to(room).emit("stopTyping");
    });

    socket.on("disconnect", () => {
        console.log("Disconnect:", socket.id);
        // remove from waiting if present
        waiting = waiting.filter((u) => u.id !== socket.id);
    });
});

server.listen(4000, () => console.log("Server running on port 4000"));
