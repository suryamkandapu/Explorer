import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL } from "../../../../ConfigApi/Api";
import { Link } from "react-router-dom";
import HomeFooter from "../HomeFooter";
import ChatSection from "../../../ChatPages/ChatSection";
import "../../../Styles/ChatUserList.css";

// ✅ Import socket
import { socket } from "../../../../socket";

const ChatUserList = () => {
  const [followingList, setFollowingList] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // ✅ new
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 1️⃣ Fetch Logged-in User
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

  // ✅ 1.5️⃣ Add user to Socket + get online list
  useEffect(() => {
    if (!loggedInUser?._id) return;

    socket.emit("addUser", loggedInUser._id);

    socket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("getOnlineUsers");
    };
  }, [loggedInUser]);

  // 2️⃣ Fetch Following List
  useEffect(() => {
    if (!loggedInUser?._id) return;

    const fetchFollowingList = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/user/following/${loggedInUser._id}`,
          { withCredentials: true }
        );

        if (res.data.success) {
          setFollowingList(res.data.following);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching following list:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowingList();
  }, [loggedInUser]);

  // 3️⃣ UI States
  if (loading) return <div className="chat-loading">Loading...</div>;
  if (error) return <div className="chat-error">Something went wrong</div>;
  // even if the following list is empty, we still render the layout so the Gemini card is visible
  const noOtherUsers = followingList.length === 0;

  // 4️⃣ Main Layout
  return (
    <div className="chat-layout-container">
      <div className="chat-main-content">
        {/* LEFT: Chat User List */}
        <ChatSection />

        <div className="chat-user-list">
          {/* Gemini AI card always at top */}
          <div key="gemini" className="chat-user-card">
            <Link to="/chat/gemini">
              <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=GeminiAI&scale=80"
                alt="Gemini AI"
                className="chat-user-avatar"
                onError={(e) => (e.target.remove())}
              />

              <div className="chat-user-info">
                <p className="chat-user-name">Gemini AI</p>
                <p className="chat-user-subtext">Ask the assistant</p>
              </div>
            </Link>
          </div>
          {noOtherUsers && (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">👥</div>
              <h3 className="chat-empty-title">No conversations yet</h3>
              <p className="chat-empty-subtitle">
                Follow people to start amazing conversations!
              </p>
              <p className="chat-empty-hint">Once you follow someone, you can chat with them here.</p>
            </div>
          )}

          {followingList.map((following) => {
            const isOnline = onlineUsers.includes(following._id);

            return (
              <div key={following._id} className="chat-user-card">
                <Link to={`/chat/${following._id}`} state={{ user: following }}>
                  <img
                    className="chat-user-avatar"
                    src={
                      following.profilePic?.startsWith("http")
                        ? following.profilePic
                        : `${API_URL}/${following.profilePic?.replace(
                            /^\/+/,
                            ""
                          )}`
                    }
                    alt="User"
                  />

                  <div className="chat-user-info">
                    <p className="chat-user-name">{following.fullName}</p>
                    <p className="chat-user-subtext">
                      {isOnline ? "Active now ✅" : "Offline"}
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

export default ChatUserList;
