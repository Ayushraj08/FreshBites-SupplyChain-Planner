import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader, Download, Upload, AlertCircle } from "lucide-react";

export default function ProcurementDashboard() {
  const [procurement, setProcurement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProcurement();
  }, []);

  const fetchProcurement = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/procurement_plan");
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setProcurement([]);
      } else {
        console.log("📦 Procurement data:", data);
        setProcurement(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("❌ Error fetching procurement data:", err);
      setError("Failed to fetch procurement data. Please try again.");
      setProcurement([]);
    }
    setLoading(false);
  };

  const handleProcurementUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  try {
    await fetch("https://freshbites-supplychain-planner-backend.onrender.com//api/upload_procurement", {
      method: "POST",
      body: formData,
    });
    fetchProcurement();
  } catch (err) {
    setError("❌ Procurement upload error");
    console.error(err);
  }
};

  const handleReset = async () => {
    try {
      await fetch("https://freshbites-supplychain-planner-backend.onrender.com//api/reset_procurement", {
        method: "POST",
      });
      setProcurement([]);
      console.log("🔄 Procurement data reset");
    } catch (err) {
      setError("❌ Reset failed");
      console.error(err);
    }
  };

  useEffect(() => {
    const handleSupplierUpdate = () => fetchProcurement();
    const handleDemandUpdate = () => fetchProcurement();

    window.addEventListener("suppliers:updated", handleSupplierUpdate);
    window.addEventListener("demand:updated", handleDemandUpdate);

    return () => {
      window.removeEventListener("suppliers:updated", handleSupplierUpdate);
      window.removeEventListener("demand:updated", handleDemandUpdate);
    };
  }, []);

  const downloadCSV = () => {
    if (!procurement.length) return;
    const headers = Object.keys(procurement[0]).join(",");
    const rows = procurement.map((row) => Object.values(row).join(","));
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "procurement_plan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f172a] text-white p-8">
      <motion.div
        className="glass-card p-6 w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            📦 Procurement Planning
          </h2>
          <div className="flex gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500 text-blue-300 rounded-lg hover:bg-blue-500/30 transition">
              <Upload className="w-4 h-4" />
                  Upload Procurement CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleProcurementUpload} />
            </label>

            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 text-green-300 rounded-lg hover:bg-green-500/30 transition"
            >
              <Download className="w-4 h-4" /> Export Plan
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500 text-red-300 rounded-lg hover:bg-red-500/30 transition"
            >
              Reset Data
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin w-8 h-8 text-purple-400" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-400 bg-red-500/10 border border-red-500 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 mr-2" /> {error}
          </div>
        ) : procurement.length === 0 ? (
          <div className="text-center text-gray-400 h-64 flex items-center justify-center">
            No procurement data available. Please upload Supplier + Demand CSVs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-700 rounded-lg text-sm">
              <thead className="bg-[#1a1a2e] text-purple-300">
                <tr>
                  <th className="px-4 py-2 border border-gray-700">SKU</th>
                  <th className="px-4 py-2 border border-gray-700">Forecast Demand</th>
                </tr>
              </thead>
              <tbody>
                {procurement.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="px-4 py-2 border border-gray-700">{row.SKU}</td>
                    <td className="px-4 py-2 border border-gray-700">{row.Forecast_Demand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
