import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../ConfigApi/Api";
import { Link } from "react-router-dom";
import HomeFooter from "../HomeFooter";
import ChatSection from "../../../ChatPages/ChatSection";
import "../Styles/ChatConversationList.css";
import { socket } from "../../../../socket";

const ChatConversationList = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch Logged-in User
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/user/userProfile`, {
          withCredentials: true,
        });

        if (res.data.success) {
          setLoggedInUser(res.data.user);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setError(true);
      }
    };

    fetchLoggedInUser();
  }, []);

  // Connect Socket & Get Online Users
  useEffect(() => {
    if (!loggedInUser?._id) return;

    socket.emit("addUser", loggedInUser._id);

    socket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.off("getOnlineUsers");
  }, [loggedInUser]);

  // ✅ Fetch Conversations List
  useEffect(() => {
    if (!loggedInUser?._id) return;

    const fetchConversations = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/conversations/${loggedInUser._id}`,
          { withCredentials: true }
        );

        setConversations(res.data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [loggedInUser]);

  if (loading) return <div className="chat-loading">Loading...</div>;
  if (error) return <div className="chat-error">Something went wrong</div>;
  // don't bail out when conversations is empty; we still want to render the Gemini card

  // build gemini card before real conversations
  const geminiCard = (
    <div key="gemini" className="chat-user-card">
      <Link to="/chat/gemini">
        <img
          src="https://api.dicebear.com/7.x/bottts/svg?seed=GeminiAI&scale=80"
          alt= 'AI ChatBot'
          className="chat-user-avatar"
          onError={(e) => (e.target.remove())}
        />
        <div className="chat-user-info">
          <p className="chat-user-name">AI ChatBot</p>
          <p className="chat-user-subtext">Ask me anything</p>
        </div>
      </Link>
    </div>
  );

  return (
    <div className="chat-layout-container">
      <div className="chat-main-content">
        <ChatSection />

        <div className="chat-user-list">
          {geminiCard}
          {conversations.length === 0 && (
            <div className="chat-empty" style={{ padding: '20px 0' }}>
              No chats yet
            </div>
          )}
          {conversations.map((conv) => {
            // ✅ Find other user from members
            const otherUser = conv.members.find(
              (m) => m._id !== loggedInUser._id
            );

            if (!otherUser) return null;

            const isOnline = onlineUsers.includes(otherUser._id);

            return (
              <div key={conv._id} className="chat-user-card">
                <Link to={`/chat/${otherUser._id}`} state={{ user: otherUser }}>
                  <img
                    className="chat-user-avatar"
                    src={
                      otherUser.profilePic?.startsWith("http")
                        ? otherUser.profilePic
                        : `${API_URL}/${otherUser.profilePic?.replace(
                            /^\/+/,
                            ""
                          )}`
                    }
                    alt="User"
                  />

                  <div className="chat-user-info">
                    <p className="chat-user-name">{otherUser.fullName}</p>

                    <p className="chat-user-subtext">
                      {conv.lastMessage
                        ? conv.lastMessage
                        : isOnline
                        ? "Active now"
                        : "Tap here to chat"}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <HomeFooter />
    </div>
  );
};

export default ChatConversationList;
