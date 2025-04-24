import { useState } from 'react';
import './style.css';

export default function Home() {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("auto");
  const [subtitles, setSubtitles] = useState([]);
  const [editing, setEditing] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Upload failed:", response.status, response.statusText);  // Log the status
        return;
      }

      const data = await response.json();
      console.log("Received data:", data);  // Log the data received from the server

      if (Array.isArray(data.subtitles)) {
        setSubtitles(data.subtitles); // Set subtitles if they exist and are in array format
        setEditing(true);
      } else {
        console.error("No valid subtitles found:", data.subtitles);
        alert("No subtitles found or failed to transcribe.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);  // Log any errors
    }
  };

  const handleDownload = async () => {
    const response = await fetch("http://localhost:5000/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtitles }),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "edited_subtitles.srt");
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center py-10">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl p-8 space-y-8 transform transition-all hover:scale-105 hover:shadow-2xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          Video to Subtitle Transcription
        </h1>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between space-x-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all"
            />
            <select
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all"
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="auto">Auto Detect</option>
              <option value="en">English</option>
              <option value="sv">Swedish</option>
            </select>
          </div>

          <button
            onClick={handleUpload}
            className="w-full py-3 bg-gradient-to-r from-teal-400 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-teal-500 hover:to-blue-700 transition-all transform hover:scale-105"
          >
            Transcribe Video
          </button>
        </div>

        {editing && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Subtitles</h2>
            <div className="space-y-4">
              {subtitles.length > 0 ? (
                subtitles.map((s, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <span className="text-sm text-gray-500">
                      {s.start} - {s.end}
                    </span>
                    <textarea
                      value={s.text}
                      onChange={(e) => {
                        const updated = [...subtitles];
                        updated[i].text = e.target.value;
                        setSubtitles(updated);
                      }}
                      className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all"
                      placeholder="Edit subtitle text here..."
                    />
                  </div>
                ))
              ) : (
                <p>No subtitles available to edit.</p>
              )}
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3 bg-gradient-to-r from-teal-400 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-teal-500 hover:to-blue-700 transition-all transform hover:scale-105 mt-6"
            >
              Download .srt
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
