import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../ConfigApi/Api";
import { Link, useNavigate } from "react-router-dom";
import "../../Styles/SearchPage.css";

const SearchPage = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ✅ Fetch users (debounced)
  useEffect(() => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingUsers(true);
        const res = await axios.get(
          `${API_URL}/user/searchProfile?query=${search}`,
          { withCredentials: true }
        );

        if (res.data.success) {
          setUsers(res.data.users);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.log("Search error:", err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="Search-page">
      {/* ✅ TOP BAR */}
      <div className="Search-topbar">
        <button className="Search-back-btn" onClick={() => navigate(-1)}>
          ←
        </button>

        <input
          className="Search-input"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* ✅ RESULTS */}
      <div className="Search-results">
        {loadingUsers ? (
          <p className="Search-status">Searching...</p>
        ) : users.length > 0 ? (
          users.map((user) => (
            <Link
              key={user._id}
              to={`/profile/${user._id}`}
              className="Search-user"
            >
              <img
                className="Search-avatar"
                src={
                  user.profilePic?.startsWith("http")
                    ? user.profilePic
                    : `${API_URL}/${user.profilePic?.replace(/^\/+/, "")}`
                }
                alt="profile"
              />
              <div className="Search-userinfo">
                <p className="Search-name">{user.fullName}</p>
                <p className="Search-sub">View profile</p>
              </div>
            </Link>
          ))
        ) : search.trim() ? (
          <p className="Search-status">No users found</p>
        ) : (
          <p className="Search-status">Search for people</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
