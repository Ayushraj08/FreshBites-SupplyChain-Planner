import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader, Upload, Download } from "lucide-react";

export default function SupplierDashboard() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/suppliers");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuppliers(data);
      } else {
        console.error("Unexpected API response:", data);
        setSuppliers([]);
      }
    } catch (err) {
      console.error("❌ Error fetching supplier data:", err);
      setSuppliers([]);
    }
    setLoading(false);
  };

  // Upload CSV
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://localhost:8000/api/upload_suppliers", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    console.log("✅ Upload result:", result);

    // Refresh Supplier table
    fetchSuppliers();

    // 🔹 Trigger Procurement auto-refresh
    window.dispatchEvent(new Event("suppliers:updated"));
  } catch (err) {
    console.error("❌ Upload error:", err);
  }
};

  // Download CSV
  const downloadCSV = () => {
    if (!suppliers.length) return;
    const headers = Object.keys(suppliers[0]).join(",");
    const rows = suppliers.map((row) => Object.values(row).join(","));
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "suppliers_export.csv");
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
        {/* Title + Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
            🏢 Supplier Reliability Tracker
          </h2>
          <div className="flex gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500 text-blue-300 rounded-lg hover:bg-blue-500/30 transition">
              <Upload className="w-4 h-4" />
              Upload CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 text-green-300 rounded-lg hover:bg-green-500/30 transition"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Loader / Empty / Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin w-8 h-8 text-blue-400" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center text-gray-400 h-64 flex items-center justify-center">
            No supplier data available. Please upload a CSV.
          </div>
        ) : (
          <table className="w-full border border-gray-700 rounded-lg text-sm">
            <thead className="bg-[#1a1a2e] text-blue-300">
              <tr>
                <th className="px-4 py-2 border border-gray-700">Supplier ID</th>
                <th className="px-4 py-2 border border-gray-700">Name</th>
                <th className="px-4 py-2 border border-gray-700">Committed Lead Time (days)</th>
                <th className="px-4 py-2 border border-gray-700">Avg Lead Time (days)</th>
                <th className="px-4 py-2 border border-gray-700">Deliveries</th>
                <th className="px-4 py-2 border border-gray-700">On-Time Deliveries</th>
                <th className="px-4 py-2 border border-gray-700">Reliability (%)</th>
                <th className="px-4 py-2 border border-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="px-4 py-2 border border-gray-700">{s.Supplier_ID}</td>
                  <td className="px-4 py-2 border border-gray-700">{s.Name}</td>
                  <td className="px-4 py-2 border border-gray-700">{s.Committed_Lead_Time}</td>
                  <td className="px-4 py-2 border border-gray-700">{s.Avg_Lead_Time_Days}</td>
                  <td className="px-4 py-2 border border-gray-700">{s.Deliveries}</td>
                  <td className="px-4 py-2 border border-gray-700">{s.On_Time_Deliveries}</td>
                  <td
                    className={`px-4 py-2 border border-gray-700 font-semibold ${
                      s.Reliability >= 90
                        ? "text-green-400"
                        : s.Reliability >= 70
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {s.Reliability}%
                  </td>
                  <td
                    className={`px-4 py-2 border border-gray-700 font-semibold ${
                      s.Status.includes("Delayed") ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {s.Status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
