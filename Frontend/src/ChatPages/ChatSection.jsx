import "../Styles/ChatSection.css";
import { API_URL } from "../../ConfigApi/Api";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const ChatSection = () => {
  const navigate = useNavigate()



  // ✅ handle search


  return (
    <div className="chat-top-section">
      {/* ✅ SEARCH BAR */}
      <div
          className="Explore-search-box"

          onClick={() => navigate("/search")}
          role="button"
          
          tabIndex={0}
        >
          <span className="Explore-search-icon">🔍</span>
          <p className="Explore-search-placeholder">Search for profile...</p>
        </div>
    </div>
  );
};

export default ChatSection;
