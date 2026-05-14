import "../Styles/ChatSection.css";
import { useNavigate } from "react-router-dom";

const ChatSection = () => {
  const navigate = useNavigate();

  return (
    <div className="chat-top-section">

      <div
        className="Explore-search-box"
        onClick={() => navigate("/search")}
        role="button"
        tabIndex={0}
      >
        <span className="Explore-search-icon">
          🔍
        </span>

        <p className="Explore-search-placeholder">
          Search for profile...
        </p>
      </div>

    </div>
  );
};

export default ChatSection;