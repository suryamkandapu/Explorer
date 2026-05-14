import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../../../ConfigApi/Api";
import HomeFooter from "../HomeFooter";
import "../../../Styles/AddFeed.css";

const AddFeed = () => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);

    // ✅ preview (image/video)
    const url = URL.createObjectURL(selected);
    setPreview(url);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select an image/video!");
      return;
    }

    const formData = new FormData();
    formData.append("media", file);
    formData.append("description", description || "");

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/addFeed`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (response.data.success) {
        alert("✅ Post uploaded successfully!");
        setDescription("");
        removeFile();
      } else {
        alert("❌ Error while uploading post");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addfeed-page">
      {/* ✅ Header */}
      <div className="addfeed-header">
        <h2>Create Post</h2>
        <button
          className={`addfeed-post-btn ${loading ? "disabled" : ""}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>

      {/* ✅ Card */}
      <div className="addfeed-card">
        {/* ✅ Upload box */}
        {!file ? (
          <label className="addfeed-upload-box">
            <input type="file" hidden accept="image/*,video/*" onChange={handleFileChange} />
            <div className="upload-icon">＋</div>
            <p className="upload-title">Upload Photo / Video</p>
            <p className="upload-subtitle">Tap to choose from device</p>
          </label>
        ) : (
          <div className="addfeed-preview-box">
            {/* Preview media */}
            {file.type.startsWith("video") ? (
              <video src={preview} controls className="addfeed-preview-media" />
            ) : (
              <img src={preview} alt="preview" className="addfeed-preview-media" />
            )}

            <button className="remove-media-btn" onClick={removeFile}>
              ✖
            </button>
          </div>
        )}

        {/* ✅ Caption */}
        <div className="addfeed-caption-box">
          <p className="caption-label">Caption</p>
          <textarea
            className="addfeed-caption-input"
            placeholder="Write something... ✍️"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="caption-count">{description.length}/500</p>
        </div>
      </div>

      <HomeFooter />
    </div>
  );
};

export default AddFeed;
