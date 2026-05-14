import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineDotsVertical } from "react-icons/hi";
import axios from "axios";
import { API_URL } from "../../../ConfigApi/Api";
import "../../Styles/TopSection.css";

const UserProfileTop = ({ user }) => {
  const navigate = useNavigate();

  const [postsLength, setPostLength] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [userState, setUserState] = useState(user);

  // ✅ sync userState when parent prop changes
  useEffect(() => {
    setUserState(user);
  }, [user]);

  // ✅ sync bio input when userState changes
  useEffect(() => {
    setBioText(userState?.bio || "");
  }, [userState]);

  // ✅ fetch posts length
  useEffect(() => {
    if (!userState?._id) return;

    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${API_URL}/posts/${userState._id}`, {
          withCredentials: true,
        });

        if (res.data.success) {
          setPostLength(res.data.userPosts.length);
        }
      } catch (err) {
        console.error("Error fetching user posts length:", err);
      }
    };

    fetchPosts();
  }, [userState?._id]);

  // ✅ Logout with confirm
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;

    try {
      const res = await axios.post(
        `${API_URL}/user/logout`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        localStorage.removeItem("token");
        navigate("/signin");
      } else {
        alert("Logout failed!");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed!");
    }
  };

  //  Save Bio (update UI instantly)
const handleSaveBio = async () => {
  if (!bioText.trim()) {
    alert("Bio cannot be empty!");
    return;
  }

  try {
    console.log("📝 Saving bio:", bioText);

    //  1) Update DB
    const res = await axios.put(
      `${API_URL}/user/updateBio`,
      { bio: bioText.trim() },
      { withCredentials: true }
    );

    console.log("✅ Bio update response:", res.data);

    if (!res.data.success) {
      alert("Bio update failed: " + (res.data.message || "Unknown error"));
      return;
    }

    //  2) Update local state immediately
    setUserState({
      ...userState,
      bio: bioText.trim(),
    });
    setBioText(bioText.trim());
    
    setIsEditingBio(false);
    setShowMenu(false);
    
    console.log("✅ Bio updated successfully");
  } catch (error) {
    console.error("❌ Bio update failed:", error);
    alert("Bio update failed: " + (error.response?.data?.message || error.message));
  }
};


  //  Cancel edit bio
  const handleCancelBio = () => {
    setIsEditingBio(false);
    setBioText(userState?.bio || "");
  };

  //  Loading safety
  if (!userState) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div className="profile-wrapper">
      {/*  TOP BAR */}
      <div className="section1">
        <span className="appName">Explorer</span>

        {/*  Three dots menu */}
        <div style={{ position: "relative" }}>
          <button
            className="logout-btn"
            onClick={() => setShowMenu((prev) => !prev)}
          >
            <HiOutlineDotsVertical className="logout-icon" />
          </button>

          {/*  dropdown */}
          {showMenu && (
            <div className="profile-menu-dropdown">
              <button
                className="profile-menu-item"
                onClick={() => {
                  setIsEditingBio(true);
                  setShowMenu(false);
                }}
              >
                Edit Bio
              </button>

              <button
                className="profile-menu-item logout-item"
                onClick={() => {
                  setShowMenu(false);
                  handleLogout();
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/*  PROFILE SECTION */}
      <div className="profile-container">
        <div className="left-profile-section">
          <img
            src={
              userState?.profilePic?.startsWith("http")
                ? userState.profilePic
                : `${API_URL}/${userState?.profilePic?.replace(/^\/+/, "")}`
            }
            alt="Profile"
            className="profile-image"
          />
        </div>

        <div className="right-profile-section">
          <div className="username-row">
            <h2 className="username">{userState.fullName}</h2>
          </div>

          <div className="stats-row">
            <div className="stat">
              <strong>{postsLength}</strong>
              <span>posts</span>
            </div>

            <div className="stat">
              <Link
                to="/userFollowers"
                state={userState._id}
                className="text-decoration-none text-dark"
              >
                <strong>{userState.followers}</strong>
              </Link>
              <span>followers</span>
            </div>

            <div className="stat">
              <Link
                to="/userFollowing"
                state={{
                  userId: userState._id,
                  followingList: userState.followingList,
                }}
                className="text-decoration-none text-dark"
              >
                <strong>{userState.followingList?.length || 0}</strong>
              </Link>
              <span>following</span>
            </div>
          </div>

          {/*  BIO SECTION */}
          <div className="bio-section">
            {!isEditingBio ? (
              <p>{userState.bio || "No bio yet"}</p>
            ) : (
              <div className="bio-edit-container">
                <h4 className="bio-edit-title">Edit your bio</h4>
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  rows={4}
                  maxLength={150}
                  placeholder="Tell us about yourself..."
                  className="bio-textarea"
                />
                <div className="bio-char-count">
                  {bioText.length}/150 characters
                </div>

                <div className="bio-button-group">
                  <button className="bio-btn-save" onClick={handleSaveBio}>
                    Save Bio
                  </button>

                  <button
                    className="bio-btn-cancel"
                    onClick={handleCancelBio}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileTop;
