import React, { useState, useEffect } from "react";
import axios from "axios";

const backendURL = "http://localhost:5000";

function App() {
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateId, setUpdateId] = useState(null);

  useEffect(() => {
    axios
      .get(`${backendURL}/videos`)
      .then((res) => setVideos(res.data))
      .catch((err) => console.error("Error fetching videos:", err));
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const preview = URL.createObjectURL(selectedFile);
      setPreviewURL(preview);
    }
  };

  const uploadOrUpdateVideo = async () => {
    if (!file) {
      alert("Please select a video file");
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("video", file);

    try {
      if (updateId) {
        await axios.put(`${backendURL}/update/${updateId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          },
        });
        alert("Video updated successfully!");
        setVideos((prevVideos) => prevVideos.filter((v) => v._id !== updateId));
      } else {
        await axios.post(`${backendURL}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          },
        });
        alert("Video uploaded successfully!");
      }

      axios.get(`${backendURL}/videos`).then((res) => setVideos(res.data));
      setFile(null);
      setPreviewURL(null);
      setUpdateId(null);
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Error uploading video");
    } finally {
      setUploading(false);
    }
  };

  const prepareUpdate = (videoId) => {
    setUpdateId(videoId);
    setFile(null);
    setPreviewURL(null);
    alert("Please select a new file to replace the existing video.");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">🎥 Video Streaming App</h1>

      <div className="bg-gray-800 p-4 rounded-lg shadow-md">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="block w-full mb-3 text-gray-200"
        />

        {previewURL && (
          <video
            src={previewURL}
            controls
            className="w-[600px] max-h-[400px] md:max-h-[500px] mb-4 rounded-lg shadow-md"
          />
        )}

        <button
          onClick={uploadOrUpdateVideo}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition"
          disabled={uploading || (updateId && !file)}
        >
          {uploading
            ? `Uploading... ${progress}%`
            : updateId
            ? "Update Video"
            : "Upload Video"}
        </button>

        {uploading && (
          <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>

      <div className="mt-6">
        {videos.length === 0 ? (
          <p className="text-center text-gray-400">No videos available</p>
        ) : (
          videos.map((video) => (
            <div key={video._id} className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">{video.filename}</h3>
              <video
                src={`${backendURL}/videos/${video.filename}`}
                controls
                autoPlay
                loop
                className="w-[600px] max-h-[400px] md:max-h-[500px] rounded-lg shadow-md"
              />
              <div className="flex justify-between mt-2">
                <button
                  className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 rounded text-sm"
                  onClick={() => prepareUpdate(video._id)}
                >
                  Update
                </button>
                <button
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
                  onClick={() => setVideos(videos.filter((v) => v._id !== video._id))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
