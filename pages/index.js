import { useState, useEffect } from 'react';
import axios from 'axios';
// Global CSS is now imported in _app.js

// API URL from environment variable with fallback to default
// Using the server's hostname if running in a browser
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser, use the current hostname with the API prefix
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '8765'; // Backend port
    return `${protocol}//${hostname}:${port}/api`;
  }
  // During SSR, use the environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8765/api';
};

const API_URL = getApiUrl();

// Log the API URL for debugging
console.log("API URL:", API_URL);

// Status polling interval in milliseconds
const POLLING_INTERVAL = 2000;

export default function Home() {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("auto");
  const [subtitles, setSubtitles] = useState([]);
  const [editing, setEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [modelInfo, setModelInfo] = useState({
    model_size: 'unknown',
    gpu_type: 'unknown',
    gpu_memory: '0',
    available_models: [],
    recommended_model: 'small'
  });
  const [selectedModel, setSelectedModel] = useState('small');
  
  // Fetch status on page load to get model info
  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/status`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.model_info) {
            setModelInfo(data.model_info);
            console.log("Initial model info:", data.model_info);
            
            // Set the selected model to the recommended model
            if (data.model_info.recommended_model) {
              setSelectedModel(data.model_info.recommended_model);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching initial status:", error);
      }
    };
    
    fetchInitialStatus();
  }, []);

  // Function to poll for transcription status
  const pollStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/status`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Status data:", data);
      
      // Update model info if available
      if (data.model_info) {
        setModelInfo(data.model_info);
      }
      
      if (data.status === "completed" && data.subtitles) {
        // Transcription is complete
        setIsProcessing(false);
        setProgress(100);
        setStatusMessage("Transcription complete!");
        setSubtitles(data.subtitles);
        setEditing(true);
        return true; // Stop polling
      } else if (data.status === "processing") {
        // Update progress
        setProgress(data.progress || Math.min(progress + 5, 95));
        setStatusMessage(data.message || "Processing...");
        return false; // Continue polling
      } else if (data.status === "error") {
        // Handle error
        setIsProcessing(false);
        setProgress(100);
        setStatusMessage(`Error: ${data.message || "Unknown error"}`);
        
        // If we have empty subtitles, show an empty editor
        if (data.subtitles && Array.isArray(data.subtitles)) {
          setSubtitles(data.subtitles);
          setEditing(true);
        } else {
          setSubtitles([{
            start: "00:00:00,000",
            end: "00:00:05,000",
            text: "Transcription failed. Please try again with a shorter video."
          }]);
          setEditing(true);
        }
        
        console.error(`Transcription failed: ${data.message || "Unknown error"}`);
        return true; // Stop polling
      }
      
      return false; // Continue polling by default
    } catch (error) {
      console.error("Error checking status:", error);
      return false; // Continue polling despite error
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage("Uploading file...");
    setEditing(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    formData.append("model", selectedModel);
    
    try {
      console.log("Uploading to:", `${API_URL}/upload`);
      
      console.log("Uploading to:", `${API_URL}/upload`);
      
      // Use native fetch API with explicit CORS mode
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        headers: {
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
      });

      if (!response.ok) {
        setIsProcessing(false);
        setStatusMessage(`Error: HTTP ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Start polling for status
      setStatusMessage("Processing audio...");
      setProgress(10);
      
      // Poll for status every few seconds
      const pollInterval = setInterval(async () => {
        const done = await pollStatus();
        if (done) {
          clearInterval(pollInterval);
        }
      }, POLLING_INTERVAL);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsProcessing(false);
      setStatusMessage(`Error: ${error.message}`);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDownload = async () => {
    try {
      // Use native fetch API with explicit CORS mode
      const response = await fetch(`${API_URL}/download`, {
        method: 'POST',
        body: JSON.stringify({ subtitles }),
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "edited_subtitles.srt");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error downloading subtitles:", error);
      alert("Failed to download subtitles.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center py-10">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl p-8 space-y-8 transform transition-all hover:scale-105 hover:shadow-2xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          Video to Subtitle Transcription
        </h1>

        <div className="flex flex-col space-y-4">
          {/* System Information */}
          <div className="p-4 bg-gray-100 rounded-lg shadow-inner mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">System Information</h3>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <span className="font-medium">GPU Type:</span>
                <span className={`ml-2 px-2 py-1 rounded ${
                  modelInfo.gpu_type === 'nvidia'
                    ? 'bg-green-100 text-green-800'
                    : modelInfo.gpu_type === 'apple_silicon'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {modelInfo.gpu_type === 'nvidia'
                    ? 'NVIDIA'
                    : modelInfo.gpu_type === 'apple_silicon'
                      ? 'Apple Silicon'
                      : 'CPU Only'}
                </span>
              </div>
              <div>
                <span className="font-medium">GPU Memory:</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {modelInfo.gpu_memory ? `${modelInfo.gpu_memory} GB` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium">Recommended:</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded">
                  {modelInfo.recommended_model || 'small'}
                </span>
              </div>
            </div>
            
            {/* Model Selector */}
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Whisper Model:
              </label>
              <div className="flex flex-wrap gap-2">
                {['tiny', 'base', 'small', 'medium', 'large'].map(model => {
                  const isAvailable = modelInfo.available_models?.includes(model);
                  return (
                    <button
                      key={model}
                      onClick={() => setSelectedModel(model)}
                      disabled={!isAvailable}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all
                        ${selectedModel === model
                          ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                          : isAvailable
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                    >
                      {model}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
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
            disabled={isProcessing}
            className={`w-full py-3 bg-gradient-to-r from-teal-400 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-teal-500 hover:to-blue-700 transition-all transform hover:scale-105 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? 'Processing...' : 'Transcribe Video'}
          </button>
        </div>
        
        {/* Progress indicator */}
        {isProcessing && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Processing</h2>
            <p className="text-gray-600 mb-2">{statusMessage}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{progress}% complete</p>
          </div>
        )}

        {/* System information is now shown at the top of the page */}

        {/* Download button that appears when transcription is complete */}
        {editing && !isProcessing && (
          <div className="mt-6">
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-lg shadow-md hover:from-green-500 hover:to-blue-600 transition-all transform hover:scale-105"
            >
              Download .srt
            </button>
          </div>
        )}

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
