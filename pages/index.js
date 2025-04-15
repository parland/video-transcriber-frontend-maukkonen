import { useState } from 'react';

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

    const response = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setSubtitles(data.subtitles);
    setEditing(true);
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
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">Video to Subtitle</h1>

      <div className="mb-4">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <select
          className="ml-4 border px-2 py-1"
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="auto">Auto Detect</option>
          <option value="en">English</option>
          <option value="sv">Swedish</option>
        </select>
        <button
          onClick={handleUpload}
          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Transcribe
        </button>
      </div>

      {editing && (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Edit Subtitles</h2>
          {subtitles.map((s, i) => (
            <div key={i} className="mb-2">
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
                className="w-full border rounded p-2"
              />
            </div>
          ))}
          <button
            onClick={handleDownload}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            Download .srt
          </button>
        </div>
      )}
    </main>
  );
}
