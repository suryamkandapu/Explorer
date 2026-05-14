import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiCamera, FiMic, FiSmile } from "react-icons/fi";
import { HiOutlinePhotograph } from "react-icons/hi";
import { API_URL } from "../../ConfigApi/Api";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../Styles/ChatIn.css";

// socket import
import { socket } from "../../socket";

const ChatIn = () => {
  const { id } = useParams(); //  chat user id from URL
  const navigate = useNavigate();

  const [chatUser, setChatUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);

  //  Auto Scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //  Fetch Logged-in User
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/user/userProfile`, {
          withCredentials: true,
        });

        if (res.data.success) {
          setLoggedInUser(res.data.user);
        }
      } catch (err) {
        console.error("Failed to load logged-in user:", err);
      }
    };

    fetchLoggedInUser();
  }, []);

  // Fetch Chat User
  useEffect(() => {
    if (!id) return;

    const fetchChatUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/user/profile/${id}`, {
          withCredentials: true,
        });

        if (res.data.success) {
          setChatUser(res.data.user);
        }
      } catch (error) {
        console.error("Failed to fetch chat user data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatUser();
  }, [id]);

  // ✅ Create/Get Conversation between logged-in user and chat user
  useEffect(() => {
    if (!loggedInUser?._id || !id) return;

    const createConversation = async () => {
      try {
        const res = await axios.post(
          `${API_URL}/conversations`,
          {
            senderId: loggedInUser._id,
            receiverId: id,
          },
          { withCredentials: true }
        );

        setConversationId(res.data._id);
      } catch (error) {
        console.error("Error creating conversation:", error);
      }
    };

    createConversation();
  }, [loggedInUser, id]);

  // ✅ Fetch Messages for conversation
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/messages/${conversationId}`, {
          withCredentials: true,
        });

        setMessages(res.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // ✅ Receive message in real-time
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          senderId: data.senderId,
          text: data.message,
          createdAt: new Date().toISOString(),
        },
      ]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  // ✅ Send Message (DB + Socket)
  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!conversationId || !loggedInUser?._id) return;

    try {
      // ✅ 1) Save message in DB
      const res = await axios.post(
        `${API_URL}/messages`,
        {
          conversationId,
          senderId: loggedInUser._id,
          text: newMessage,
        },
        { withCredentials: true }
      );

      // ✅ show instantly
      setMessages((prev) => [...prev, res.data]);

      // ✅ 2) Real-time send to receiver
      socket.emit("sendMessage", {
        senderId: loggedInUser._id,
        receiverId: id,
        message: newMessage,
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // ✅ Enter key support
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  if (loading) return <div className="chat-loading">Loading chat...</div>;

  return (
    <div className="chat-page-container">
      {/* 🔝 CHAT HEADER */}
      <div className="chat-header">
        <div className="chat-header-left">
          {/* ✅ Back Button */}
          <button className="chat-back-btn" onClick={() => navigate(-1)}>
            ←
          </button>

          <Link to={`/profile/${chatUser?._id}`} state={{ user: chatUser }}>
            <img
              className="chat-header-avatar"
              src={
                chatUser?.profilePic?.startsWith("http")
                  ? chatUser.profilePic
                  : `${API_URL}/${chatUser?.profilePic?.replace(/^\/+/, "")}`
              }
              alt="User"
            />
          </Link>

          <div className="chat-header-info">
            <Link
              to={`/profile/${chatUser?._id}`}
              state={{ user: chatUser }}
              className="text-decoration-none text-dark"
            >
              <p className="chat-header-name">{chatUser?.fullName}</p>
            </Link>
            <p className="chat-header-status">Active now</p>
          </div>
        </div>

        <div className="chat-header-right">
          <button className="chat-icon-btn">📞</button>
          <button className="chat-icon-btn">🎥</button>
          <button className="chat-icon-btn">ℹ️</button>
        </div>
      </div>

      {/* ✅ CHAT BODY */}
      <div className="chat-body">
        {messages.length === 0 ? (
          <p className="chat-placeholder-text">Start the conversation 👋</p>
        ) : (
         messages.map((msg, index) => {
  const senderId =
    typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;

  const isMine = senderId === loggedInUser?._id;

  return (
    <div
      key={msg._id || index}
      className={isMine ? "chat-msg outgoing" : "chat-msg incoming"}
    >
      {msg.text}
    </div>
  );
})
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* ✅ CHAT INPUT SECTION */}
      <div className="chat-input-section">
        {/* Left Camera Button */}
        <button className="chat-camera-btn" type="button">
          <FiCamera />
        </button>

        {/* Input Pill */}
        <div className="chat-input-pill">
          <input
            className="chat-input"
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Right Icons inside pill */}
          <div className="chat-pill-icons">
            <button className="chat-pill-btn" type="button">
              <FiSmile />
            </button>

            <button className="chat-pill-btn" type="button">
              <HiOutlinePhotograph />
            </button>

            <button className="chat-pill-btn" type="button">
              <FiMic />
            </button>
          </div>
        </div>

        {/* Send Button */}
        <button className="chat-send-btn" type="button" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatIn;
