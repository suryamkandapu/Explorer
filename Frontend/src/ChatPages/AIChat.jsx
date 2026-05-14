import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiCamera, FiSmile } from "react-icons/fi";
import { HiOutlinePhotograph } from "react-icons/hi";
import { API_URL } from "../../ConfigApi/Api";
import { useNavigate } from "react-router-dom";
import "../Styles/ChatIn.css"; // reuse existing styles

const AIChat = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // load user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/user/userProfile`, {
          withCredentials: true,
        });
        if (res.data.success) setLoggedInUser(res.data.user);
      } catch (err) {
        console.error("AI chat load user failure", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // fetch AI conversation history
  useEffect(() => {
    if (!loggedInUser?._id) return;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/ai/gemini/${loggedInUser._id}`,
          { withCredentials: true }
        );
        if (res.data.success) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error("Failed to load AI history", err);
      }
    };
    fetchHistory();
  }, [loggedInUser]);

  const handleSend = async () => {
    if (!newMessage.trim() || !loggedInUser?._id) return;

    // show sent message immediately
    const outgoing = { role: "user", text: newMessage };
    setMessages((prev) => [...prev, outgoing]);

    const payload = {
      userId: loggedInUser._id,
      message: newMessage,
    };

    setNewMessage(""); // clear input right away

    try {
      const res = await axios.post(`${API_URL}/api/ai/gemini`, payload, {
        withCredentials: true,
      });

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: res.data.reply },
        ]);
      } else {
        console.warn("AI responded but success flag false", res.data);
      }
    } catch (err) {
      console.error("Error sending AI message", err);
      // optionally display error message bubble
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "(failed to get response)" },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  if (loading) return <div className="chat-loading">Loading...</div>;

  return (
    <div className="chat-page-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="chat-back-btn" onClick={() => navigate(-1)}>
            ←
          </button>
          <img
            src="https://api.dicebear.com/7.x/bottts/svg?seed=GeminiAI&scale=80"
            alt="AI Avatar"
            className="chat-header-avatar"
            onError={(e) => (e.target.remove())}
          />
          <div className="chat-header-info">
            <p className="chat-header-name">Gemini AI</p>
            <p className="chat-header-status">AI assistant</p>
          </div>
        </div>
      </div>

      <div className="chat-body">
        {messages.length === 0 ? (
          <p className="chat-placeholder-text">Ask me anything 👋</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={
                msg.role === "user" ? "chat-msg outgoing" : "chat-msg incoming"
              }
            >
              {msg.role === "assistant" && (
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=GeminiAI&scale=80"
                  alt="AI"
                  className="chat-msg-avatar"
                  onError={(e) => (e.target.remove())}
                />
              )}
              {msg.text}
            </div>
          ))
        )}
        <div ref={bottomRef}></div>
      </div>

      <div className="chat-input-section">
        <button className="chat-camera-btn" type="button">
          <FiCamera />
        </button>

        <div className="chat-input-pill">
          <input
            className="chat-input"
            type="text"
            placeholder="Message the AI..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="chat-pill-icons">
            <button className="chat-pill-btn" type="button">
              <FiSmile />
            </button>
            <button className="chat-pill-btn" type="button">
              <HiOutlinePhotograph />
            </button>
          </div>
        </div>

        <button className="chat-send-btn" type="button" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default AIChat;
