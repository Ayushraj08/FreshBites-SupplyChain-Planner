// frontend/src/pages/Dashboard.jsx
import { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Upload, X, RefreshCcw, Eye } from "lucide-react";
import { DataContext } from "../context/DataContext"; // ✅ global context
import { NavLink } from "react-router-dom"; // ✅ React Router Link

export default function Dashboard() {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // ✅ Global data refresh function
  const { fetchAllData } = useContext(DataContext);

  // Select files (drag/drop area only)
  const handleFileSelection = (event) => {
    const selected = Array.from(event.target.files);
    if (pendingFiles.length + selected.length > 5) {
      alert("You can only select up to 5 CSV files!");
      return;
    }
    setPendingFiles((prev) => [...prev, ...selected]);
  };

  // Attach files → send to backend
  const attachFiles = async () => {
    if (pendingFiles.length === 0) {
      alert("No files selected to upload!");
      return;
    }

    const formData = new FormData();
    pendingFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      console.log("✅ Backend received:", result);

      // ✅ Move pending → attached
      setFiles((prev) => [...prev, ...pendingFiles]);
      setPendingFiles([]);

      // ✅ Refresh global data so dashboards auto-update
      fetchAllData();
    } catch (error) {
      console.error("❌ Upload error:", error);
      alert("Upload failed. Check backend logs.");
    }
  };

  // Remove single file
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  /// Reset All → global reset
const resetAll = async () => {
  if (window.confirm("⚠️ This will reset ALL dashboards, data, and charts. Continue?")) {
    try {
      const res = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/reset", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Reset failed");

      const result = await res.json();
      console.log("✅ Reset:", result);

      // ✅ Clear local state
      setPendingFiles([]);
      setFiles([]);
      setPreviewContent(null);
      setPreviewFile(null);

      // ✅ Refresh global context (clears charts)
      fetchAllData();

      alert("✅ All dashboards and data reset successfully!");
    } catch (err) {
      console.error("❌ Reset error:", err);
      alert("Reset failed. Check backend logs.");
    }
  }
};


  // Preview CSV content
  const previewFileContent = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split("\n").slice(0, 10);
      setPreviewFile(file.name);
      setPreviewContent(rows);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f172a] text-white font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 p-6 glass-card flex flex-col h-screen">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-8">
          FreshBites: Supply Chain Planner
        </h1>
        <nav className="space-y-4 flex-1">
          <NavLink
            to="/demand"
            className={({ isActive }) =>
              `block w-full text-left px-3 py-2 rounded-lg transition ${
                isActive ? "bg-purple-600/30 text-purple-300 font-semibold" : "hover:bg-white/10"
              }`
            }
          >
            📊 Demand Dashboard
          </NavLink>

          <NavLink
            to="/production"
            className={({ isActive }) =>
              `block w-full text-left px-3 py-2 rounded-lg transition ${
                isActive ? "bg-green-600/30 text-green-300 font-semibold" : "hover:bg-white/10"
              }`
            }
          >
            🏭 Production Planner
          </NavLink>

          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              `block w-full text-left px-3 py-2 rounded-lg transition ${
                isActive ? "bg-yellow-600/30 text-yellow-300 font-semibold" : "hover:bg-white/10"
              }`
            }
          >
            📦 Inventory Optimizer
          </NavLink>

          <NavLink
            to="/suppliers"
            className={({ isActive }) =>
              `block w-full text-left px-3 py-2 rounded-lg transition ${
                isActive ? "bg-pink-600/30 text-pink-300 font-semibold" : "hover:bg-white/10"
              }`
            }
          >
            🚚 Supplier Tracker
          </NavLink>

          <NavLink
            to="/procurement"
            className={({ isActive }) =>
              `block w-full text-left px-3 py-2 rounded-lg transition ${
                isActive ? "bg-purple-600/30 text-purple-300 font-semibold" : "hover:bg-white/10"
              }`
            }
          >
            📦 Procurement
          </NavLink>

          <NavLink
            to="/simulation"
            className={({ isActive }) =>
              `block w-full text-left px-3 py-2 rounded-lg transition ${
                isActive ? "bg-blue-600/30 text-blue-300 font-semibold" : "hover:bg-white/10"
              }`
            }
          >
            ⚡ AI Simulation Lab
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `block w-full text-left px-3 py-2 rounded-lg transition ${
                isActive ? "bg-purple-600/30 text-purple-300 font-semibold" : "hover:bg-white/10"
              }`
            }
          >
            📑 Reports & KPIs
          </NavLink>
        </nav>
        <footer className="text-xs text-gray-400 mt-auto">
          © 2025 FreshBites AI
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <motion.div 
          className="glass-card p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              📂 Upload CSV Files
            </h2>

            <div className="flex items-center gap-3">
              {/* Upload Button */}
              <button
                onClick={attachFiles}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500 text-purple-300 rounded-lg hover:bg-purple-500/30 transition"
              >
                <Upload className="w-4 h-4" /> Upload CSV
              </button>

              {/* Reset All Button */}
              <button 
                onClick={resetAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/30 transition"
              >
                <RefreshCcw className="w-4 h-4" /> Reset All (Danger)
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-300 mb-4">
            First select CSVs below, then click <strong>Upload CSV</strong> to attach them, you can upload <strong>up-to 5 csv files</strong>.
          </p>

          {/* File Selection (drop area) */}
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-400 rounded-xl cursor-pointer hover:bg-white/5 transition">
            <Upload className="w-8 h-8 text-purple-400 mb-2" />
            <span className="text-sm text-gray-300">Click to select or drag & drop CSV files</span>
            <input type="file" accept=".csv" multiple onChange={handleFileSelection} className="hidden" />
          </label>

          {/* Attached Files */}
          <div className="mt-4 flex flex-wrap gap-3">
            {files.length > 0 ? (
              files.map((file, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => previewFileContent(file)}
                >
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">File {index + 1}: {file.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No files attached yet</p>
            )}
          </div>
        </motion.div>

        {/* Preview Modal */}
        {previewContent && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#1a1a2e] p-6 rounded-xl w-3/4 max-h-[80vh] overflow-y-auto shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-purple-300">
                Preview: {previewFile}
              </h3>
              <pre className="bg-black/40 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
                {previewContent.join("\n")}
              </pre>
              <button 
                onClick={() => setPreviewContent(null)} 
                className="mt-4 px-4 py-2 bg-purple-500/20 border border-purple-500 text-purple-300 rounded-lg hover:bg-purple-500/30 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
