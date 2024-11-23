"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axiosRes from "../lib/axios";
import ConfirmModal from "../modalComponents/confirmModal";
import { useRouter } from "next/navigation";

export default function ChatBot() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userID, setUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [currentConversation, setCurrentConversation] = useState([]);
  const [conversationId, setConversationId] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    display: false,
    message: "",
    title: "",
  });
  const [isLoadingBotResponse, setIsLoadingBotResponse] = useState(false);

  const suggestions = [
    "Malapit na klinika ng Derma sakin",
    "Magkano magpa diamond peel",
    "Fat Reduction",
    "Murang nag tatanggal ng wart",
    "Facial Treatment",
    "Deep Skin Hydration",
  ];

  const leftColumnSuggestions = suggestions.slice(0, 3); // First 3 items
  const rightColumnSuggestions = suggestions.slice(3); // Remaining items

  const handleClick = (query) => {
    // console.log(`You clicked on: ${query}`);
    setInput(query);
  };

  const handleConfirmClose = () => {
    setConfirmModal({ display: false });
  };

  const handleBack = () => {
    setConfirmModal({
      display: true,
      message: "Are you sure you want to go back?",
      title: "Hello, " + sessionStorage.getItem("username") + "!",
    });
  };

  const handleBackConfirm = () => {
    router.push("/mainDash");
  };

  useEffect(() => {
    const storedUserName = sessionStorage.getItem("username");
    if (storedUserName) {
      setUserId(sessionStorage.getItem("userId"));
      setUserName(storedUserName.toUpperCase());
    }

    const storedUserId = sessionStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);

      const getRecentChats = async () => {
        try {
          const response = await axiosRes.get("/chat-bot");
          // console.log("Response data:", response.data);

          const userIdNumber = Number(storedUserId);
          // console.log("Stored User ID (converted):", userIdNumber);

          // Filter chats based on userId
          const userChats = response.data.data.filter(
            (chat) => chat.user_id === userIdNumber
          );

          // console.log("All Chats:", response.data.data);
          // console.log("Filtered User Chats:", userChats);

          setRecentChats(userChats);

          // Set conversationId if there's a recent chat
          if (userChats.length > 0) {
            setConversationId(userChats[0].id); // Assuming 'id' is the property for conversation ID
          } else {
            setConversationId(null); // No chats available
          }
        } catch (error) {
          // console.error("No Recent Chat for this User");
        }
      };

      getRecentChats();
    }
  }, []);

  // Add this new useEffect for auto-refresh
  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userId");

    // Function to fetch recent chats
    const fetchRecentChats = async () => {
      if (!storedUserId) return;

      try {
        const response = await axiosRes.get("/chat-bot");
        const userIdNumber = Number(storedUserId);
        const userChats = response.data.data.filter(
          (chat) => chat.user_id === userIdNumber
        );
        setRecentChats(userChats);
      } catch (error) {
        // console.error("Error fetching recent chats:", error);
      }
    };

    // Initial fetch
    fetchRecentChats();

    // Set up interval for periodic refresh
    const intervalId = setInterval(fetchRecentChats, 3500);

    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this runs once on mount

  const startNewChat = async () => {
    setCurrentConversation([]); // Clear the current conversation
    setMessages([]); // Clear the displayed messages
    setIsLoading(true); // Set loading state

    const newChat = {
      user_id: userID, // Ensure you have the user's ID
      conversation: [], // Start with an empty conversation
      conversation_id: conversationId, // No conversation ID for a new chat
    };

    try {
      const response = await axiosRes.post("/new-chat", newChat);
      const welcomeMessage = response.data?.data?.conversation; // Assuming the welcome message is included in the response

      // Set the welcome message to the current conversation
      setCurrentConversation(welcomeMessage);
      setMessages(welcomeMessage);
      setConversationId(response.data?.data?.conversation_id); // Save conversation ID if applicable
    } catch (error) {
      // console.error("Error starting new chat:", error);
      const newBotMessage = {
        type: "bot",
        text: "Paumanhin, hindi ko maproseso ang iyong kahilingan.",
      };
      setCurrentConversation([newBotMessage]);
      setMessages([newBotMessage]);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  const sendMessage = async () => {
    setIsLoadingBotResponse(true);
    if (!input.trim()) {
      return;
    }

    const newUserMessage = { type: "user", text: input };
    const updatedConversation = [...currentConversation, newUserMessage];

    setCurrentConversation(updatedConversation);
    setMessages(updatedConversation);
    setIsLoading(true);

    const currentConversationId = conversationId || null;

    // Prepare payload for updating or creating a conversation
    const payload = {
      user_id: userID,
      conversation: updatedConversation,
      conversation_id: currentConversationId || undefined,
    };

    // console.log("Payload being sent: ", payload);

    try {
      const response = await axiosRes.post("/chat-bot", payload);
      const newConversation = response.data?.data?.conversation;
      const newConversationId = response.data?.data?.conversation_id;

      if (newConversation) {
        setCurrentConversation(newConversation);
        setMessages(newConversation);
        setConversationId(newConversationId);

        // Fetch and update recent chats after sending the message
        const storedUserId = sessionStorage.getItem("userId");
        if (storedUserId) {
          try {
            const recentResponse = await axiosRes.get("/chat-bot");
            const userIdNumber = Number(storedUserId);
            const userChats = recentResponse.data.data.filter(
              (chat) => chat.user_id === userIdNumber
            );
            setRecentChats(userChats); // Update recent chats
          } catch (error) {
            // console.error("Error fetching recent chats:", error);
          }
        }
      } else {
        const newBotMessage = {
          type: "bot",
          text: "Paumanhin, hindi ko maproseso ang iyong kahilingan.",
        };
        setCurrentConversation([...updatedConversation, newBotMessage]);
        setMessages([...updatedConversation, newBotMessage]);
      }
    } catch (error) {
      // console.error("Error sending message:", error);
      const newBotMessage = {
        type: "bot",
        text: "Paumanhin, hindi ko maproseso ang iyong kahilingan.",
      };
      setCurrentConversation([...updatedConversation, newBotMessage]);
      setMessages([...updatedConversation, newBotMessage]);
    } finally {
      setInput("");
      setIsLoading(false);
      setIsLoadingBotResponse(false);
    }
  };

  const selectRecentChat = (chat) => {
    let messages = [];

    // Check if conversation is a string (JSON) and parse it
    if (typeof chat.conversation === "string") {
      try {
        messages = JSON.parse(chat.conversation);

        // Check if parsed result is an array (valid conversation format)
        if (!Array.isArray(messages)) {
          // console.error("Parsed conversation is not an array:", messages);
          messages = [];
        }
      } catch (error) {
        // console.error("Error parsing conversation:", error);
        messages = [];
      }
    }
    // If it's already an array, just assign it to messages
    else if (Array.isArray(chat.conversation)) {
      messages = chat.conversation;
    }
    // Handle unexpected conversation format
    else {
      // console.error(
      //   "Unexpected conversation format:",
      //   typeof chat.conversation
      // );
      messages = [];
    }

    // Update states with the selected conversation messages
    setCurrentConversation(messages);
    setConversationId(chat.id);
    setMessages(messages);
    setInput("");
  };

  // const handleClick = (query) => {
  //   console.log(`You clicked on: ${query}`);
  //   setInput(query);
  // };

  useEffect(() => {
    // console.log("Messages updated:", messages);
  }, [messages]);

  return (
    <main className="vh-100 d-flex flex-column flex-md-row bg-white">
      {/* Burger Menu ka sakin */}
      <button
        className="btn btn-warning d-md-none m-3 rounded-4 text-white fw-bold"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasSidebar"
        aria-controls="offcanvasSidebar"
        data-bs-backdrop="false"
        data-bs-scroll="true"
      >
        <i className="bi bi-list"></i> Menu
      </button>
      {/* Off canvas ka sakin*/}
      <div
        className="offcanvas offcanvas-start d-md-none"
        tabIndex="-1"
        id="offcanvasSidebar"
        aria-labelledby="offcanvasSidebarLabel"
        data-bs-backdrop="false"
        data-bs-scroll="true"
      >
        <div className="offcanvas-header">
          <Link href="/mainDash" className="text-decoration-none">
            <h3 className="mt-2 text-dark fw-bold">DermaServTech</h3>
          </Link>
          <button
            type="button"
            className="btn-close text-reset"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
            data-bs-backdrop="false"
            data-bs-scroll="true"
          ></button>
        </div>
        <div className="offcanvas-body bg-white text-dark">
          <ul className="list-unstyled">
            <li className="mb-4">
              <button
                onClick={startNewChat}
                className="btn btn-outline-warning border border-2 border-warning w-100 text-dark fw-medium rounded rounded-4"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasSidebar"
                aria-controls="offcanvasSidebar"
                data-bs-backdrop="false"
                data-bs-scroll="true"
              >
                <i className="bi bi-plus me-1"></i>
                New Chat
              </button>
            </li>

            <li className="mb-3">
              <p className="lead fw-medium text-dark">Recent Chats</p>
              <div
                className="recent-chats-scrollable px-2 custom-scroll "
                style={{
                  maxHeight: "calc(100vh - 300px)",
                  overflowY: "auto",
                  width: "100%",
                }}
              >
                <ul className="list-unstyled">
                  {recentChats.length === 0 ? (
                    <li className="mb-2" style={{ color: "black" }}>
                      No recent chats available.
                    </li>
                  ) : (
                    recentChats.map((chat, index) => {
                      let messages = [];

                      if (typeof chat.conversation === "string") {
                        try {
                          messages = JSON.parse(chat.conversation);
                          if (!Array.isArray(messages)) {
                            messages = [];
                          }
                        } catch (error) {
                          // console.error("Error parsing conversation:", error);
                        }
                      } else if (Array.isArray(chat.conversation)) {
                        messages = chat.conversation;
                      }

                      // Handle both string and object message types
                      const lastMessage =
                        messages.length > 0
                          ? typeof messages[messages.length - 1].text ===
                            "object"
                            ? messages[messages.length - 1].text.message
                            : messages[messages.length - 1].text
                          : "No messages";

                      return (
                        <li key={index} className="mb-2">
                          <button
                            className="btn btn-light text-start rounded-4 w-100"
                            onClick={() => selectRecentChat(chat)}
                            type="button"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#offcanvasSidebar"
                            aria-controls="offcanvasSidebar"
                            data-bs-backdrop="false"
                            data-bs-scroll="true"
                          >
                            {lastMessage.length > 20
                              ? lastMessage.slice(0, 20) + "..."
                              : lastMessage}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>

              <div className="border border-2 border-light"></div>
            </li>
          </ul>
          <div className="position-absolute bottom-0 start-0 p-3 w-100 bg-white">
            <div className="d-flex align-items-center">
              <i className="fas fa-user me-2"></i>
              <label className="text-dark text-decoration-none fw-medium">
                <i className="bi bi-person-circle me-2"></i>
                {userName}
              </label>
            </div>
            <div className="d-flex align-items-center mb-2">
              <i className="fas fa-user-cog me-2"></i>
              <button
                onClick={handleBack}
                className="text-decoration-none fw-medium btn btn-md btn-warning w-100 text-white rounded rounded-4 mt-3"
              >
                <i className="bi bi-arrow-left-square me-3"></i>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - large ka sakin*/}
      <div
        className="bg-white text-white p-3 d-none d-md-block"
        style={{ width: "350px", height: "100%", position: "relative" }}
      >
        <Link href="/mainDash" className="text-decoration-none">
          <h3 className="mb-3 text-dark fw-bold">DermaServTech</h3>
        </Link>
        <ul className="list-unstyled">
          <li className="mb-4">
            <button
              onClick={startNewChat}
              className="btn btn-outline-warning border border-2 border-warning w-100 text-dark fw-medium rounded rounded-4"
            >
              <i className="bi bi-plus me-1"></i>
              New Chat
            </button>
          </li>
          <li className="mb-3">
            <p className="lead fw-medium text-dark">Recent Chats</p>
            <div
              className="recent-chats-scrollable px-2 custom-scroll "
              style={{
                maxHeight: "calc(100vh - 260px)",
                overflowY: "auto",
                width: "330px",
              }}
            >
              <ul className="list-unstyled">
                {recentChats.length === 0 ? (
                  <li className="mb-2" style={{ color: "black" }}>
                    No recent chats available.
                  </li>
                ) : (
                  recentChats.map((chat, index) => {
                    let messages = [];

                    if (typeof chat.conversation === "string") {
                      try {
                        messages = JSON.parse(chat.conversation);
                        if (!Array.isArray(messages)) {
                          messages = [];
                        }
                      } catch (error) {
                        // console.error("Error parsing conversation:", error);
                      }
                    } else if (Array.isArray(chat.conversation)) {
                      messages = chat.conversation;
                    }

                    // Handle both string and object message types
                    const lastMessage =
                      messages.length > 0
                        ? typeof messages[messages.length - 1].text === "object"
                          ? messages[messages.length - 1].text.message
                          : messages[messages.length - 1].text
                        : "No messages";

                    return (
                      <li key={index} className="mb-2">
                        <button
                          className="btn btn-light text-start rounded-4 w-100"
                          onClick={() => selectRecentChat(chat)}
                        >
                          {lastMessage.length > 20
                            ? lastMessage.slice(0, 20) + "..."
                            : lastMessage}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
            <div className="border border-2 border-light"></div>
          </li>
        </ul>
        <div className="position-absolute bottom-0 start-0 p-3 w-100 bg-white">
          <div className="d-flex align-items-center">
            <i className="fas fa-user me-2"></i>
            <label className="text-dark text-decoration-none fw-medium">
              <i className="bi bi-person-circle me-2"></i>
              {userName}
            </label>
          </div>
          <div className="d-flex align-items-center mb-2">
            <i className="fas fa-user-cog me-2"></i>
            <button
              onClick={handleBack}
              className="text-decoration-none fw-medium btn btn-md btn-warning w-100 text-white rounded rounded-4 mt-3"
            >
              <i className="bi bi-arrow-left-square me-3"></i>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Chatbot UI ka sakin*/}
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center bg-white py-2 px-3">
        <div
          className="chatbot-container p-3 w-100 w-md-75 vh-100 rounded-5"
          style={{
            backgroundColor: "#F1F1F1",
            maxHeight: "95%",
            maxWidth: "98%",
          }}
        >
          <div
            className="chatbot-messages overflow-auto mb-3 rounded-4 align-self-center"
            style={{ height: "calc(100% - 60px)" }}
          >
            <div className="d-flex justify-content-center align-items-center mt-3 mb-5 mx-3">
              <div className="imgLogo rounded-circle p-3">
                <img
                  src="/Materials/DermaServTech Logo/logo4.png"
                  className="img-fluid"
                  alt="logo"
                />
              </div>
              <div className="imgSideDiv p-3 rounded-4">
                <text className="fw-bold fs-5">
                  Kamusta! Ako Ang Iyong Virtual Assistant, Handang Tumulong
                  Sa’yo.
                </text>{" "}
                <br />
                <text>
                  Isang AI na Tagalog ang salita, pero marunong din ng konting
                  Ingles. Ano ang maitutulong ko sa'yo?
                </text>
              </div>
            </div>
            <div
              className="row justify-content-center align-items-center ms-1 mb-3"
              style={{ width: "calc(100% - 10px)" }}
            >
              <div className="col-lg-6">
                {leftColumnSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="mb-2 rounded-4 py-2 ps-3 pe-3 ms-1 d-flex justify-content-between align-items-center sampleQ"
                    onClick={() => handleClick(suggestion)}
                  >
                    <span>{suggestion}</span>
                    <i className="bi bi-arrow-right"></i>
                  </div>
                ))}
              </div>
              <div className="col-lg-6">
                {rightColumnSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="mb-2 rounded-4 py-2 ps-3 pe-3 ms-1 d-flex justify-content-between align-items-center sampleQ"
                    onClick={() => handleClick(suggestion)}
                  >
                    <span>{suggestion}</span>
                    <i className="bi bi-arrow-right"></i>
                  </div>
                ))}
              </div>
            </div>
            {messages.length > 0 &&
              messages.map((msg, index) => {
                if (typeof msg.text === "object" && msg.text.message) {
                  // if (
                  //   msg.text.message.includes(
                  //     "Narito ang ilang klinika malapit sa iyo:"
                  //   ) ||
                  //   msg.text.message.includes(
                  //     "Narito ang mga detalye ng klinika na iyong hinahanap:"
                  //   )
                  // ) {

                  // }

                  return (
                    <div
                      key={index}
                      className={`chatBox message p-2 my-2 rounded-4 ${
                        msg.type === "user"
                          ? "bg-white text-dark userChat"
                          : "bg-secondary text-white botChat"
                      } d-flex flex-column p-3`}
                      style={{
                        wordBreak: "break-word",
                        overflowX: "hidden",
                        overflowWrap: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <p
                        className="mb-2"
                        style={{
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.text.message}
                      </p>

                      {msg.text.clinics.map((clinic, clinicIndex) => (
                        <div
                          key={clinicIndex}
                          style={{ wordBreak: "break-word" }}
                          className="p-3"
                        >
                          <div>
                            {clinic.logo ? (
                              <img
                                className="me-3 img img-fluid rounded-circle p-2"
                                src={clinic.logo}
                                alt={clinic.name}
                                style={{
                                  width: "100px",
                                  height: "100px",
                                  objectFit: "cover",
                                  marginBottom: "10px",
                                }}
                              />
                            ) : null}
                            <strong>{clinic.name ? clinic.name : null}</strong>{" "}
                            ({clinic.distance ? clinic.distance : null})
                            <ul>
                              {clinic.number ? (
                                <li>Contact: {clinic.number}</li>
                              ) : null}
                              {clinic.operationHours ? (
                                <li>
                                  Operating Hours: {clinic.operationHours}
                                </li>
                              ) : null}
                              {clinic.healthCards ? (
                                <li>Health Cards: {clinic.healthCards}</li>
                              ) : null}
                              {clinic.specialization ? (
                                <li>Specialization: {clinic.specialization}</li>
                              ) : null}
                              {clinic.ratings ? (
                                <li>Rating: {clinic.ratings}</li>
                              ) : null}
                              {clinic.years_of_operation ? (
                                <li>
                                  Years in Operation:{" "}
                                  {clinic.years_of_operation}
                                </li>
                              ) : null}
                              {clinic.parkingSpot ? (
                                <li>Parking Available: {clinic.parkingSpot}</li>
                              ) : null}
                              {clinic.clinicType ? (
                                <li>Type: {clinic.clinicType}</li>
                              ) : null}
                              {clinic.consultationFee ? (
                                <li>
                                  Consultation Fee: {clinic.consultationFee}
                                </li>
                              ) : null}
                              {clinic.walkIn ? (
                                <li>Walk-ins: {clinic.walkIn}</li>
                              ) : null}
                              {clinic.facebookLink ? (
                                <li>
                                  <a
                                    href={clinic.facebookLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-warning"
                                  >
                                    Facebook Page
                                  </a>
                                </li>
                              ) : null}
                              {clinic.websiteLink ? (
                                <li>
                                  <a
                                    href={clinic.websiteLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-warning"
                                  >
                                    Website
                                  </a>
                                </li>
                              ) : null}
                              {clinic.popularity ? (
                                <li>Popularity: {clinic.popularity}</li>
                              ) : null}
                            </ul>
                            <a
                              href={clinic.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-warning text-decoration-none"
                            >
                              Tingnan sa Mapa
                            </a>
                            <div className="border-top my-2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={index}
                      className={`chatBox message p-2 my-2 rounded-4 ${
                        msg.type === "user"
                          ? "bg-white text-dark userChat"
                          : "bg-secondary text-white botChat"
                      }`}
                      style={{
                        wordBreak: "break-word",
                        overflowX: "hidden",
                        overflowWrap: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <p
                        className="mb-0"
                        style={{
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.text}
                      </p>
                    </div>
                  );
                }
              })}
            {isLoading && (
              <div className="chatBox message p-2 my-2 rounded-4 bg-secondary text-white align-self-start">
                Typing...
              </div>
            )}
          </div>
          <div className="d-flex mt-2">
            <input
              type="text"
              className="form-control me-2 rounded-4 shadow"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              id="chatInput"
              disabled={isLoadingBotResponse}
            />
            <button
              className="btn btn-warning rounded-4 shadow"
              onClick={sendMessage}
              id="sendButton"
              disabled={isLoadingBotResponse}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        display={confirmModal.display}
        message={confirmModal.message}
        title={confirmModal.title}
        onClose={handleConfirmClose}
        onConfirm={handleBackConfirm}
      />
    </main>
  );
}
