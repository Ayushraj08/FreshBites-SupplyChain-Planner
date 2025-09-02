// frontend/src/pages/InventoryDashboard.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader, Download, Upload } from "lucide-react";

export default function InventoryDashboard() {
  const [predictorData, setPredictorData] = useState([]);
  const [safetyStock, setSafetyStock] = useState([]);
  const [rebalancing, setRebalancing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceLevel, setServiceLevel] = useState(95);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const predRes = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/inventory_predictor");
      const predData = await predRes.json();
      setPredictorData(predData);

      const ssRes = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/safety_stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_level: serviceLevel / 100 }),
      });
      const ssData = await ssRes.json();
      setSafetyStock(ssData);

      const rebRes = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/rebalance");
      const rebData = await rebRes.json();
      setRebalancing(rebData);

    } catch (err) {
      console.error("❌ Error fetching inventory data:", err);
    }
    setLoading(false);
  };

  // Upload Inventory CSV
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/upload_inventory", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      console.log("✅ Upload success:", result);

      // Re-fetch after upload
      fetchData();
    } catch (err) {
      console.error("❌ Upload failed:", err);
    }
  };

  // Export CSV utility
  const downloadCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
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
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
            📦 Inventory Optimization
          </h2>

          <div className="flex items-center gap-3">
            {/* Upload Button */}
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500 text-blue-300 rounded-lg cursor-pointer hover:bg-blue-500/30 transition">
              <Upload className="w-4 h-4" /> Upload CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Refresh Button */}
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-orange-500/20 border border-orange-500 text-orange-300 rounded-lg hover:bg-orange-500/30 transition"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin w-8 h-8 text-orange-400" />
          </div>
        ) : (
          <>
            {/* Stock-Out & Overstock Predictor */}
            <h3 className="text-lg font-semibold text-orange-300 mb-2">
              🔍 Stock-Out & Overstock Predictor
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {predictorData.map((item, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border text-center ${
                    item.Status === "Shortage"
                      ? "bg-red-500/20 text-red-300 border-red-500"
                      : item.Status === "Overstock"
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500"
                      : "bg-green-500/20 text-green-300 border-green-500"
                  }`}
                >
                  <p className="font-bold">{item.SKU} ({item.Region})</p>
                  <p>Forecast: {item.Forecast}</p>
                  <p>Stock: {item.Stock}</p>
                  <p>Status: {item.Status}</p>
                </div>
              ))}
            </div>

            {/* Safety Stock Recommendations */}
            <h3 className="text-lg font-semibold text-orange-300 mb-2">
              🛡️ Safety Stock Recommendations
            </h3>
            <div className="mb-4 flex items-center gap-3">
              <label>Service Level:</label>
              <input
                type="range"
                min="80"
                max="99"
                value={serviceLevel}
                onChange={(e) => setServiceLevel(Number(e.target.value))}
                onMouseUp={() => fetchData()}
              />
              <span>{serviceLevel}%</span>
            </div>
            <table className="w-full border border-gray-700 rounded-lg text-sm mb-8">
              <thead className="bg-[#1a1a2e] text-orange-300">
                <tr>
                  <th className="px-4 py-2 border border-gray-700">SKU</th>
                  <th className="px-4 py-2 border border-gray-700">Region</th>
                  <th className="px-4 py-2 border border-gray-700">Safety Stock</th>
                  <th className="px-4 py-2 border border-gray-700">Service Level</th>
                </tr>
              </thead>
              <tbody>
                {safetyStock.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="px-4 py-2 border border-gray-700">{row.SKU}</td>
                    <td className="px-4 py-2 border border-gray-700">{row.Region}</td>
                    <td className="px-4 py-2 border border-gray-700 text-orange-400 font-semibold">
                      {row.SafetyStock}
                    </td>
                    <td className="px-4 py-2 border border-gray-700">{row.ServiceLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Automated Rebalancing */}
            <h3 className="text-lg font-semibold text-orange-300 mb-2">
              🔄 Automated Rebalancing Suggestions
            </h3>
            <table className="w-full border border-gray-700 rounded-lg text-sm">
              <thead className="bg-[#1a1a2e] text-orange-300">
                <tr>
                  <th className="px-4 py-2 border border-gray-700">SKU</th>
                  <th className="px-4 py-2 border border-gray-700">From</th>
                  <th className="px-4 py-2 border border-gray-700">To</th>
                  <th className="px-4 py-2 border border-gray-700">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {rebalancing.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="px-4 py-2 border border-gray-700">{row.SKU}</td>
                    <td className="px-4 py-2 border border-gray-700">{row.From}</td>
                    <td className="px-4 py-2 border border-gray-700">{row.To}</td>
                    <td className="px-4 py-2 border border-gray-700 text-orange-400 font-semibold">
                      {row.Quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </motion.div>
    </div>
  );
}
