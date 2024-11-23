"use client";

import { useState } from "react";
import axios from "axios";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentChats, setRecentChats] = useState([
    "Chat with Alex",
    "Support Inquiry",
    "General Feedback",
    "Product Inquiry",
    "Order Status",
    "Technical Support",
    "Return Request",
    "Subscription Inquiry",
    "Payment Issues",
    "Feedback",
    "Chat with Alex",
    "Support Inquiry",
    "General Feedback",
    "Product Inquiry",
    "Order Status",
    "Technical Support",
    "Return Request",
    "Subscription Inquiry",
    "Payment Issues",
  ]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { type: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("/api/message", { text: input });
      setMessages([...newMessages, { type: "bot", text: response.data }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([...newMessages, { type: "bot", text: "Error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const selectRecentChat = (chat) => {
    // Placeholder for selecting a recent chat
    console.log(`Selected chat: ${chat}`);
    // Implement logic to load the selected chat if necessary
  };

  return (
    <main className="vh-100 d-flex">
      {/* Sidebar */}
      <div className="bg-dark text-white p-3" style={{ width: "250px", height: "100%", position: "relative" }}>
        <h3 className="mb-4">DermaServTech</h3>
        <ul className="list-unstyled">
          <li className="mb-3">
            <button onClick={startNewChat} className="btn btn-light w-100">
              New Chat
            </button>
          </li>
          <li className="mb-3">
            <h3 className="h5 text-warning">Recent Chats</h3>
            <div className="recent-chats-scrollable" style={{ height: "calc(100vh - 250px)", overflowY: "auto" }}>
              <ul className="list-unstyled">
                {recentChats.map((chat, index) => (
                  <li key={index} className="mb-2">
                    <button className="btn btn-light w-100 text-start" onClick={() => selectRecentChat(chat)}>
                      {chat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        </ul>
        <div className="position-absolute bottom-0 start-0 p-3 w-100">
          <hr className="bg-light" />
          <div className="d-flex align-items-center mb-2">
            <i className="fas fa-user-cog me-2"></i>
            <a href="#" className="text-white text-decoration-none">Settings</a>
          </div>
          <div className="d-flex align-items-center">
            <i className="fas fa-user me-2"></i>
            <a href="#" className="text-white text-decoration-none">ALL EYES ON ME</a>
          </div>
        </div>
      </div>

      {/* Chatbot UI */}
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center bg-light">
        <h1 className="display-6 text-warning fw-bold text-center my-3">
          Chat Bot
        </h1>
        <div className="chatbot-container border rounded bg-white shadow p-3 w-75" style={{ height: "70vh" }}>
          <div className="chatbot-messages overflow-auto mb-3" style={{ height: "calc(100% - 60px)" }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message p-2 my-2 rounded ${msg.type === "user" ? "bg-primary text-white align-self-end" : "bg-secondary text-white align-self-start"
                  }`}
                style={{ maxWidth: "80%" }}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="message p-2 my-2 rounded bg-secondary text-white align-self-start" style={{ maxWidth: "80%" }}>
                Typing...
              </div>
            )}
          </div>
          <div className="d-flex mt-2">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="btn btn-warning" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
