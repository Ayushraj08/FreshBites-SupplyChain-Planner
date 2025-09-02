// frontend/src/pages/ReportsKPIs.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DemandDashboard from "./DemandDashboard";
import ProductionPlanner from "./ProductionPlanner";
import InventoryOptimizer from "./InventoryOptimizer";
import SupplierTracker from "./SupplierTracker";
import SimulationLab from "./SimulationLab";   // ✅ Correct import
import { MessageSquare, CheckCircle } from "lucide-react";

export default function ReportsKPIs() {
  const [activeTab, setActiveTab] = useState("demand");

  // Collaboration state
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  // KPI state
  const [kpis, setKpis] = useState({
    service_level: 0,
    stockouts: 0,
    excess_cost: 0,
    supplier_reliability: 0,
  });

  // 🔹 Fetch Notes from backend
  const fetchNotes = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/notes");
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error("❌ Error fetching notes:", err);
    }
  };

  // 🔹 Add Note
  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch("http://localhost:8000/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        fetchNotes(); // refresh list
      }
    } catch (err) {
      console.error("❌ Error adding note:", err);
    }
  };

  // 🔹 Approve Note
  const approveNote = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/notes/${id}/approve`, {
        method: "POST", // ✅ matches backend
      });
      if (res.ok) {
        fetchNotes(); // refresh list
      }
    } catch (err) {
      console.error("❌ Error approving note:", err);
    }
  };

  // 🔹 Fetch KPIs from backend
  const fetchKPIs = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/kpis");
      const data = await res.json();
      setKpis(data);
    } catch (err) {
      console.error("❌ Error fetching KPIs:", err);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchKPIs();
  }, []);

  // 🔹 Render tab content
  const renderTab = () => {
    switch (activeTab) {
      case "demand": return <DemandDashboard />;
      case "production": return <ProductionPlanner />;
      case "inventory": return <InventoryOptimizer />;
      case "supplier": return <SupplierTracker />;
      case "simulation": return <SimulationLab />;   // ✅ Simulation Tab
      default: return <DemandDashboard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f172a] text-white">
      {/* Top Navigation */}
      <div className="flex gap-6 px-6 py-4 border-b border-gray-700 bg-[#111]">
        {["demand", "production", "inventory", "supplier", "simulation"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === tab
                ? "bg-blue-500/20 border border-blue-400 text-blue-300"
                : "bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:bg-white/10"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto">{renderTab()}</div>

      {/* Collaboration Panel */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-[#1a1a2e] border-t border-gray-700 p-4 flex flex-col gap-4"
      >
        <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Collaboration Panel
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note / alert..."
            className="flex-1 px-3 py-2 bg-[#0f172a] border border-gray-600 rounded-lg text-sm"
          />
          <button
            onClick={addNote}
            className="px-4 py-2 bg-purple-500/20 border border-purple-500 text-purple-300 rounded-lg hover:bg-purple-500/30"
          >
            Add
          </button>
        </div>

        <div className="space-y-3 max-h-32 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-gray-400 text-sm">No notes yet. Collaborate with your team!</p>
          ) : (
            notes.map((note, i) => (
              <div
                key={i}
                className={`flex justify-between items-center p-3 rounded-lg border ${
                  note.approved ? "bg-green-500/10 border-green-400" : "bg-gray-800 border-gray-600"
                }`}
              >
                <div>
                  <p className="text-sm">{note.text}</p>
                  <p className="text-xs text-gray-400">{note.timestamp}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {!note.approved && (
                    <button
                      onClick={() => approveNote(i)}
                      className="px-3 py-1 text-xs bg-green-500/20 border border-green-500 text-green-300 rounded-lg hover:bg-green-500/30"
                    >
                      Approve
                    </button>
                  )}
                  {note.approved && <CheckCircle className="text-green-400 w-5 h-5" />}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* KPI Tracker Bottom Bar */}
      <div className="flex justify-around items-center bg-[#111] border-t border-gray-700 py-3 text-sm">
        <div className="flex flex-col items-center">
          <span className="text-gray-400">Service Level</span>
          <span className="text-green-400 font-bold">{kpis.service_level}%</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-gray-400">Stockouts</span>
          <span className="text-red-400 font-bold">{kpis.stockouts}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-gray-400">Excess Cost</span>
          <span className="text-yellow-400 font-bold">${kpis.excess_cost}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-gray-400">Supplier Reliability</span>
          <span className="text-blue-400 font-bold">{kpis.supplier_reliability}%</span>
        </div>
      </div>
    </div>
  );
}
