import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiCamera, FiMic, FiSmile } from "react-icons/fi";
import { HiOutlinePhotograph } from "react-icons/hi";
import { API_URL } from "../../ConfigApi/Api";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../Styles/ChatIn.css";

// ✅ socket import
import { socket } from "../../socket";

const ChatIn = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chatUser, setChatUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [conversationId, setConversationId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);

  // ✅ Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ✅ Fetch logged-in user
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/user/userProfile`,
          {
            withCredentials: true,
          }
        );

        if (res.data.success) {
          setLoggedInUser(res.data.user);
        }

      } catch (err) {
        console.error(
          "Failed to load logged-in user:",
          err
        );
      }
    };

    fetchLoggedInUser();
  }, []);

useEffect(() => {
  if (loggedInUser?._id) {
    socket.emit("addUser", loggedInUser._id);

    console.log(
      "✅ USER REGISTERED:",
      loggedInUser._id
    );
  }
}, [loggedInUser]);

  // ✅ Fetch chat user
  useEffect(() => {
    if (!id) return;

    const fetchChatUser = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/user/profile/${id}`,
          {
            withCredentials: true,
          }
        );

        if (res.data.success) {
          setChatUser(res.data.user);
        }

      } catch (error) {
        console.error(
          "Failed to fetch chat user data",
          error
        );

      } finally {
        setLoading(false);
      }
    };

    fetchChatUser();
  }, [id]);

  // ✅ Create or get conversation
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
          {
            withCredentials: true,
          }
        );

        console.log(
          "Conversation response:",
          res.data
        );

        // ✅ FIXED
        setConversationId(
          res.data.conversation._id
        );

      } catch (error) {
        console.error(
          "Error creating conversation:",
          error
        );
      }
    };

    createConversation();
  }, [loggedInUser, id]);

  // ✅ Fetch messages
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/messages/${conversationId}`,
          {
            withCredentials: true,
          }
        );

        console.log(
          "Messages response:",
          res.data
        );

        // ✅ FIXED
        setMessages(
          res.data.messages || []
        );

      } catch (error) {
        console.error(
          "Error fetching messages:",
          error
        );
      }
    };

    fetchMessages();
  }, [conversationId]);

  // ✅ Receive real-time message
useEffect(() => {

  const handleReceiveMessage = (data) => {

    console.log(
      "📥 Received realtime message:",
      data
    );

    setMessages((prev) => [

      ...prev,

      {
        _id: Date.now(),

        senderId: {
          _id: data.senderId,
        },

        text: data.message,

        createdAt:
          new Date().toISOString(),
      },
    ]);
  };

  socket.on(
    "receiveMessage",
    handleReceiveMessage
  );

  return () => {
    socket.off(
      "receiveMessage",
      handleReceiveMessage
    );
  };

}, []);

  // ✅ Send message
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    if (
      !conversationId ||
      !loggedInUser?._id
    ) {
      console.log(
        "Missing conversationId or loggedInUser"
      );
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/messages`,
        {
          conversationId,
          senderId: loggedInUser._id,
          text: newMessage,
        },
        {
          withCredentials: true,
        }
      );

      console.log(
        "Send message response:",
        res.data
      );

      // ✅ instantly show
      setMessages((prev) => [
        ...prev,
        res.data.data,
      ]);

      // ✅ socket realtime
      const realtimeMessage = {
        senderId: loggedInUser._id,
        receiverId: id,
        message: newMessage,
      };

      console.log(
        "📤 Emitting realtime message:",
        realtimeMessage
      );

      socket.emit(
        "sendMessage",
        realtimeMessage
      );

      // ✅ clear input
      setNewMessage("");

    } catch (error) {
      console.error(
        "Error sending message:",
        error
      );
    }
  };

  // ✅ Enter support
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="chat-loading">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="chat-page-container">

      {/* ✅ HEADER */}
      <div className="chat-header">

        <div className="chat-header-left">

          {/* ✅ Back button */}
          <button
            className="chat-back-btn"
            onClick={() => navigate(-1)}
          >
            ←
          </button>

          <Link
            to={`/profile/${chatUser?._id}`}
            state={{ user: chatUser }}
          >
            <img
              className="chat-header-avatar"
              src={
                chatUser?.profilePic?.startsWith(
                  "http"
                )
                  ? chatUser.profilePic
                  : `${API_URL}/${chatUser?.profilePic?.replace(
                      /^\/+/,
                      ""
                    )}`
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
              <p className="chat-header-name">
                {chatUser?.fullName}
              </p>
            </Link>

            <p className="chat-header-status">
              Active now
            </p>

          </div>
        </div>

        <div className="chat-header-right">
          <button className="chat-icon-btn">
            📞
          </button>

          <button className="chat-icon-btn">
            🎥
          </button>

          <button className="chat-icon-btn">
            ℹ️
          </button>
        </div>
      </div>

      {/* ✅ CHAT BODY */}
      <div className="chat-body">

        {messages.length === 0 ? (
          <p className="chat-placeholder-text">
            Start the conversation 👋
          </p>
        ) : (
          messages.map((msg, index) => {

            const senderId =
              typeof msg.senderId === "object"
                ? msg.senderId._id
                : msg.senderId;

            const isMine =
              senderId === loggedInUser?._id;

            return (
              <div
                key={msg._id || index}
                className={
                  isMine
                    ? "chat-msg outgoing"
                    : "chat-msg incoming"
                }
              >
                {msg.text}
              </div>
            );
          })
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* ✅ INPUT SECTION */}
      <div className="chat-input-section">

        {/* camera */}
        <button
          className="chat-camera-btn"
          type="button"
        >
          <FiCamera />
        </button>

        {/* input pill */}
        <div className="chat-input-pill">

          <input
            className="chat-input"
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={(e) =>
              setNewMessage(e.target.value)
            }
            onKeyDown={handleKeyDown}
          />

          {/* icons */}
          <div className="chat-pill-icons">

            <button
              className="chat-pill-btn"
              type="button"
            >
              <FiSmile />
            </button>

            <button
              className="chat-pill-btn"
              type="button"
            >
              <HiOutlinePhotograph />
            </button>

            <button
              className="chat-pill-btn"
              type="button"
            >
              <FiMic />
            </button>

          </div>
        </div>

        {/* send */}
        <button
          className="chat-send-btn"
          type="button"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatIn;