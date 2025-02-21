import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const backendURL = "http://localhost:5000";

export default function UpdateVideo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const updateVideo = async () => {
    if (!file) return alert("Please select a video file");

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("video", file);

    try {
      await axios.put(`${backendURL}/update/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      });

      alert("Video updated successfully!");
      navigate("/");
    } catch (error) {
      console.error("Update Error:", error);
      alert("Error updating video");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto min-h-screen bg-gray-900 text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">🔄 Update Video</h1>

      <div className="bg-white p-6 rounded-lg shadow-md text-black">
        <input type="file" accept="video/*" onChange={handleFileChange} className="block w-full mb-4 border border-gray-300 rounded-lg p-2" />

        <button
          onClick={updateVideo}
          className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-lg"
          disabled={uploading}
        >
          {uploading ? `Updating... ${progress}%` : "Update Video"}
        </button>

        {uploading && <div className="w-full bg-gray-300 h-2 mt-3"><div className="bg-blue-500 h-2" style={{ width: `${progress}%` }}></div></div>}
      </div>

      <button onClick={() => navigate("/")} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">Cancel</button>
    </div>
  );
}
