import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";;

const socket = io("http://localhost:4000", { transports: ["websocket"] });

export default function App() {
  const [username, setUsername] = useState("");
  const [university, setUniversity] = useState("");
  const [status, setStatus] = useState("idle"); // idle | waiting | chatting
  const [room, setRoom] = useState(null);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState("");

  useEffect(() => {
    socket.on("waiting", ({ message }) => {
      setStatus("waiting");
      setMessages((prev) => [...prev, { sender: "System", message }]);
    });

    socket.on("paired", ({ partner, room }) => {
      setStatus("chatting");
      setPartner(partner);
      setRoom(room);
      setMessages([{ sender: "System", message: `You are now chatting with ${partner}` }]);
    });

    socket.on("receiveMessage", ({ sender, message }) => {
      setMessages((prev) => [...prev, { sender, message }]);
    });

    socket.on("partnerLeft", () => {
      setMessages((prev) => [...prev, { sender: "System", message: "Your partner has left the chat." }]);
      setStatus("idle");
      setPartner(null);
      setRoom(null);
    });

    socket.on("systemMessage", ({ message }) => {
      setMessages((prev) => [...prev, { sender: "System", message }]);
      setStatus("idle");
    });

    socket.on("typing", ({ username }) => setTyping(`${username} is typing...`));
    socket.on("stopTyping", () => setTyping(""));

    return () => {
      socket.off("waiting");
      socket.off("paired");
      socket.off("receiveMessage");
      socket.off("partnerLeft");
      socket.off("systemMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, []);

  const joinQueue = () => {
    if (!username.trim()) {
      alert("Please enter a username before connecting!");
      return;
    }
    if (!university) {
      alert("Please select a university before connecting!");
      return;
    }
    socket.emit("joinQueue", { username, university });
  };

  const sendMessage = () => {
    if (message.trim() && room) {
      socket.emit("sendMessage", { room, message, sender: username });
      setMessage(""); // don’t add message locally
    }
  };

  const disconnectChat = () => {
    if (room) {
      // leave current room
      socket.emit("leaveChat", { room });

      // clear old chat state
      setMessages([]);
      setPartner(null);
      setRoom(null);

      // immediately rejoin the queue with saved info
      socket.emit("joinQueue", { username, university });
      setStatus("waiting");
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (room) {
      socket.emit("typing", { room, username });
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socket.emit("stopTyping", { room });
      }, 1000);
    }

    const reconnect = () => {
      if (username) {
        socket.emit("joinQueue", { username, university: selectedUniversity });
        setMessages([]);
        setPartner(null);
        setStatus("waiting");
      }
    };
  };

  return (
    <div className="flex flex-col items-center p-6">
      {status === "idle" && (
        <div className="space-y-2">
          <input
            className="border p-2 rounded"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <select
            className="border p-2 rounded"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          >
            <option value="">Select university</option>
            <option value="AUF">Angeles University Foundation</option>
            <option value="FEU-PAMPANGA">Far Eastern University Pampanga</option>
            <option value="HAU">Holy Angel University</option>
            <option value="NU-CLARK">National University Clark</option>
            <option value="OLFU-PAMPANGA">Our Lady of Fatima Pampanga</option>
            <option value="PSAU">Pampanga State Agricultural University</option>
            <option value="PSU">Pampanga State University</option>
            <option value="SPCF">Systems Plus College Foundation</option>
          </select>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={joinQueue}
          >
            Connect
          </button>
        </div>
      )}

      {status === "waiting" && (
        <div className="text-gray-600 mt-4">Establishing a connection...</div>
      )}

      {status === "chatting" && (
        <div className="w-full max-w-md">
          <div className="border-b pb-2 mb-2 flex justify-between items-center">
            <span className="font-bold">chatUp!</span>
            <button
              className="bg-red-500 text-white px-3 py-1 rounded"
              onClick={disconnectChat}
            >
              Disconnect
            </button>
          </div>
          <div className="border h-64 overflow-y-auto p-2 mb-2 rounded">
            {messages.map((m, i) => (
              <div key={i} className={m.sender === "me" ? "text-right" : ""}>
                <span className="font-bold">{m.sender}: </span>
                {m.message}
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              className="border p-2 flex-grow rounded"
              value={message}
              onChange={handleTyping}
            />
            {typing && <div className="text-sm text-gray-500 mt-1">{typing}</div>}

            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
