// chatapp.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function App() {
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [username, setUsername] = useState("");
  const [university, setUniversity] = useState("");
  const [status, setStatus] = useState("idle"); // idle | waiting | chatting
  const [room, setRoom] = useState(null);
  const [partner, setPartner] = useState(null);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingText, setTypingText] = useState("");
  const [nextCooldown, setNextCooldown] = useState(false);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:4000", { transports: ["websocket"] });
    const s = socketRef.current;

    s.on("connect", () => console.log("socket connected ->", s.id));

    s.on("waiting", ({ message }) => {
      setStatus("waiting");
      setMessages((prev) => [...prev, { sender: "System", message }]);
    });

    s.on("paired", ({ partner: partnerName, room: newRoom }) => {
      setStatus("chatting");
      setPartner(partnerName);
      setRoom(newRoom);
      setMessages([{ sender: "System", message: `You are now chatting with ${partnerName}` }]);
    });

    s.on("receiveMessage", ({ sender, message }) => {
      setMessages((prev) => [...prev, { sender, message }]);
    });

    // partnerLeft: the other user has left the room (not Next)
    s.on("partnerLeft", () => {
      setMessages((prev) => [...prev, { sender: "System", message: "Your partner has left the chat." }]);
      setRoom(null);
      setPartner(null);
      // auto rejoin queue (so partner doesn't fall back to selection)
      if (username && university) {
        s.emit("joinQueue", { username, university });
        setStatus("waiting");
      } else {
        setStatus("idle");
      }
    });

    // systemMessage: used by nextChat (server tells both "Chat ended. Searching...")
    s.on("systemMessage", ({ message }) => {
      setMessages((prev) => [...prev, { sender: "System", message }]);
      // if this came from nextChat we expect the server to requeue both; show waiting state
      if (message && message.toLowerCase().includes("searching for a new partner")) {
        setRoom(null);
        setPartner(null);
        setStatus("waiting");
      }
    });

    s.on("typing", ({ username: tname }) => {
      setTypingText(tname);
    });

    s.on("stopTyping", () => setTypingText(""));

    return () => {
      s.off();
      s.disconnect();
    };
  }, [username, university]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinQueue = () => {
    if (!username.trim()) {
      alert("Please enter a username before connecting!");
      return;
    }
    if (!university) {
      alert("Please select a university before connecting!");
      return;
    }
    socketRef.current.emit("joinQueue", { username, university });
    setMessages([]);
    setStatus("waiting");
  };

  const sendMessage = () => {
    if (!room) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    socketRef.current.emit("sendMessage", { room, message: trimmed, sender: username });
    setMessage("");
  };

  // Disconnect: leave chat and auto-rejoin *only* this user
  const disconnectChat = () => {
    if (room) {
      socketRef.current.emit("leaveChat", { room });
      setMessages([{ sender: "System", message: "You left the chat." }]);
      setPartner(null);
      setRoom(null);
      // rejoin only this user
      // socketRef.current.emit("joinQueue", { username, university });
      // setStatus("waiting");
    }
  };

  // Next: mutual skip — ask server to end the room for everyone, server will requeue all members
  const nextChat = () => {
    if (room) {
      socketRef.current.emit("leaveChat", { room, next: true });
      setMessages([{ sender: "System", message: "You ended the chat." }]);
      setPartner(null);
      setRoom(null);

      // cooldown
      setTimeout(() => {
        socketRef.current.emit("joinQueue", { username, university });
        setStatus("waiting");
      }, 2000);
    }
  };


  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!room) return;
    socketRef.current.emit("typing", { room, username });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current.emit("stopTyping", { room });
    }, 900);
  };

  // Inline minimal styling for your brutalist theme (kept same as before)
  const styles = {
    page: {
      width: "100%",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#bdbdbd",
      fontFamily: "Tahoma, Verdana, Geneva, sans-serif",
      padding: 10,
      boxSizing: "border-box",
    },
    window: {
      width: "90vw",
      maxWidth: "800px",
      minWidth: "300px",
      height: "80vh",
      maxHeight: "90vh",
      margin: "auto",
      border: "3px solid #000",
      boxShadow: "6px 6px 0 #000",
      background: "#e6e6e6",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#123366",
      color: "#fff",
      padding: "8px 10px",
      fontWeight: 700,
      borderBottom: "3px solid #000",
      flexShrink: 0, // keep fixed
    },
    body: {
      flex: 1,                  // take remaining height
      display: "flex",
      flexDirection: "column",
      padding: 10,
      overflow: "hidden",
    },
    formControl: {
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      padding: "6px 8px",
      border: "2px solid #000",
      marginBottom: 8,
      fontSize: 14,
      background: "#fff",
      color: "#000",
    },
    buttonPrimary: {
      width: "100%",
      padding: "8px 6px",
      background: "#123366",
      color: "#fff",
      border: "3px solid #000",
      fontWeight: 700,
      cursor: "pointer",
      boxSizing: "border-box",
    },
    chatWindow: {
      flex: 1,                  // grow vertically with parent
      overflowY: "auto",
      background: "#fff",
      border: "3px solid #000",
      padding: 8,
      fontSize: 13,
      lineHeight: "1.2",
      color: "#000",
      minHeight: "200px",       // safety minimum
    },
    systemMessage: {
      color: "#b00000",
      fontStyle: "italic",
      fontSize: 12,
      margin: "6px 0",
    },
    userBubble: {
      display: "inline-block",
      padding: 8,
      border: "2px solid #000",
      background: "#ffffff",
      borderRadius: 0,
      maxWidth: "85%",
    },
    myBubble: {
      display: "inline-block",
      padding: 8,
      border: "2px solid #000",
      background: "#dfffe0",
      borderRadius: 0,
      maxWidth: "85%",
    },
    senderName: { fontWeight: 700, marginBottom: 4 },
    inputRow: {
      display: "flex",
      gap: 8,
      marginTop: 8,
      alignItems: "center",
      flexShrink: 0, // stick to bottom
    },
    inputText: {
      flex: 1,
      padding: "6px 8px",
      border: "3px solid #000",
      background: "#fff",
      color: "#000",
      fontSize: 13,
    },
    sendBtn: {
      padding: "6px 10px",
      background: "#007000",
      color: "#fff",
      border: "3px solid #000",
      fontWeight: 700,
      cursor: "pointer",
    },
    typingRow: { marginTop: 6, flexShrink: 0 },
  };


  return (
    <div style={styles.page}>
      <div style={styles.window}>
        <div style={styles.header}>
          <div>chatUp!</div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {status === "chatting" && (
              <>
                <button
                  onClick={nextChat}
                  disabled={nextCooldown}
                  style={{
                    background: nextCooldown ? "#ddd" : "#f2f2f2",
                    color: "#000",
                    border: "3px solid #000",
                    padding: "4px 8px",
                    cursor: nextCooldown ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
                <button
                  onClick={disconnectChat}
                  style={{
                    background: "#f2f2f2",
                    color: "#000",
                    border: "3px solid #000",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  X
                </button>
              </>
            )}
          </div>
        </div>

        <div style={styles.body}>
          {status === "idle" && (
            <div>
              <input
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.formControl}
              />

              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                style={styles.formControl}
              >
                <option value="">Select university</option>
                <option value="AUF">Angeles University Foundation</option>
                <option value="FEU Pampanga">Far Eastern University Pampanga</option>
                <option value="HAU">Holy Angel University</option>
                <option value="NU Clark">National University Clark</option>
                <option value="OLFU Pampanga">Our Lady of Fatima Pampanga</option>
                <option value="PSAU">Pampanga State Agricultural University</option>
                <option value="PSU">Pampanga State University</option>
                <option value="SPCF">Systems Plus College Foundation</option>
              </select>

              <button style={styles.buttonPrimary} onClick={joinQueue}>
                Connect
              </button>
            </div>
          )}

          {status === "waiting" && (
            <div style={{ textAlign: "center", padding: 12, fontWeight: 700, color: "#000" }}>
              Establishing a connection...
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <div style={styles.chatWindow}>
              {messages.map((m, i) => (
                <div key={i} style={{ margin: "6px 0" }}>
                  {m.sender === "System" ? (
                    <div style={styles.systemMessage}>{m.message}</div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: m.sender === username ? "flex-end" : "flex-start" }}>
                      <div style={m.sender === username ? styles.myBubble : styles.userBubble}>
                        <div style={{ ...styles.senderName, color: m.sender === username ? "#006400" : "#003366" }}>{m.sender}:</div>
                        <div style={{ color: "#000" }}>{m.message}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {status === "chatting" && (
              <>
                <div style={styles.typingRow}>
                  {typingText && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 12, color: "#444" }}>{typingText} is typing</div>
                      <div className="typing-dots" aria-hidden>
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.inputRow}>
                  <input
                    value={message}
                    onChange={handleTyping}
                    onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                    placeholder="Type a message..."
                    style={styles.inputText}
                  />
                  <button onClick={sendMessage} style={styles.sendBtn}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* typing-dot CSS */}
        <style>{`
          .typing-dots{display:inline-block}
          .typing-dots span{display:inline-block;width:7px;height:7px;background:#444;border-radius:50%;margin:0 3px;opacity:0.25;transform:translateY(0);animation:td 1s infinite}
          .typing-dots span:nth-child(1){animation-delay:0s}
          .typing-dots span:nth-child(2){animation-delay:0.15s}
          .typing-dots span:nth-child(3){animation-delay:0.3s}
          @keyframes td{0%{transform:translateY(0);opacity:0.25}50%{transform:translateY(-6px);opacity:1}100%{transform:translateY(0);opacity:0.25}}
        `}</style>
      </div>
    </div>
  );
}
