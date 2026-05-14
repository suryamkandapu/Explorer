import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../../ConfigApi/Api";
import "../../../Styles/ExplorePage.css";
import HomeFooter from "../HomeFooter";
import { Link, useNavigate } from "react-router-dom";

const ExplorePage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch feed data
  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        const res = await axios.get(`${API_URL}/getFeed`, {
          withCredentials: true,
        });

        if (res.status === 200) {
          setData(res.data.data);
        } else {
          setError("Failed to fetch data");
        }
      } catch (err) {
        console.error("Error fetching feed data:", err);
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, []);

  // ✅ UI States
  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-5 text-danger">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="text-center mt-5">No data available</div>;
  }

  return (
    <div className="Explore-page">
      {/* ✅ SEARCH BAR (redirect to new search page) */}
      <div className="Explore-search-bar">
        <div
          className="Explore-search-box"
          onClick={() => navigate("/search")}
          role="button"
          tabIndex={0}
        >
          <span className="Explore-search-icon">🔍</span>
          <p className="Explore-search-placeholder">Search</p>
        </div>
      </div>

      {/* ✅ FEED GRID */}
      <div className="Explore-feed-container">
        {data.map((item) => (
          <div className="Explore-post" key={item._id}>
            <Link to="/contentDetails" state={{ post: item }}>
              {item.mediaUrl?.endsWith(".mp4") ? (
                <video className="Explore-media-reel" muted>
                  <source
                    src={
                      item.mediaUrl.startsWith("http")
                        ? item.mediaUrl
                        : `${API_URL}/${item.mediaUrl.replace(/^\/+/, "")}`
                    }
                    type="video/mp4"
                  />
                </video>
              ) : (
                <img
                  src={
                    item.mediaUrl.startsWith("http")
                      ? item.mediaUrl
                      : `${API_URL}/${item.mediaUrl.replace(/^\/+/, "")}`
                  }
                  className="Explore-media-image"
                  alt="feed content"
                />
              )}
            </Link>
          </div>
        ))}
      </div>

      <HomeFooter />
    </div>
  );
};

export default ExplorePage;
