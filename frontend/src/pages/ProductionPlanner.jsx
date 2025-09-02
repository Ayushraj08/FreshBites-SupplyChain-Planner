// frontend/src/pages/ProductionPlanner.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Line,
} from "recharts";
import { Loader, Download, Upload } from "lucide-react";
import Papa from "papaparse";

export default function ProductionPlanner() {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [strategy, setStrategy] = useState("demand-priority");
  const [loading, setLoading] = useState(true);
  const [uploadedData, setUploadedData] = useState(null);

  // ✅ Transform API result into chart-friendly format
  const transformDataForChart = (apiData) => {
    if (!apiData || apiData.length === 0) return [];
    const grouped = {};
    apiData.forEach((row) => {
      if (!grouped[row.Plant]) {
        grouped[row.Plant] = {
          Plant: row.Plant,
          Capacity: row.Capacity,
          TotalAllocated: 0,
          Profit: 0,
        };
      }
      grouped[row.Plant][row.SKU] = row.Allocated;
      grouped[row.Plant].TotalAllocated += row.Allocated;
      grouped[row.Plant].Profit += row.Allocated * (row.Profit_Margin || 0);
    });
    return Object.values(grouped);
  };

  // ✅ Fetch plan from backend
  const fetchPlan = async (selectedStrategy) => {
    setLoading(true);
    try {
      const body = { strategy: selectedStrategy };
      if (uploadedData) body.uploaded_data = uploadedData;

      const response = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/production_plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      setData(result);
      setChartData(transformDataForChart(result));
    } catch (err) {
      console.error("❌ Error fetching production plan:", err);
      setChartData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlan(strategy);
  }, [strategy]);

  const skus = [...new Set(data.map((row) => row.SKU))];

  // ✅ Utilization calculation
  const getUtilization = (plant) => {
    if (!plant || plant.Capacity === 0) return 0;
    return ((plant.TotalAllocated / plant.Capacity) * 100).toFixed(1);
  };

  const overallUtilization =
    chartData.length > 0
      ? (
          chartData.reduce((sum, p) => sum + Number(getUtilization(p)), 0) /
          chartData.length
        ).toFixed(1)
      : 0;

  // ✅ Profit calculations
  const totalProfit = data.reduce(
    (sum, row) => sum + row.Allocated * (row.Profit_Margin || 0),
    0
  );
  const plantProfits = chartData.map((p) => ({
    Plant: p.Plant,
    Profit: p.Profit,
  }));
  const mostProfitable =
    plantProfits.length > 0
      ? plantProfits.reduce((max, p) => (p.Profit > max.Profit ? p : max))
      : null;

  const getBadgeColor = (util) => {
    if (util > 100) return "bg-red-500/20 text-red-400 border-red-500";
    if (util > 85) return "bg-yellow-500/20 text-yellow-400 border-yellow-500";
    return "bg-green-500/20 text-green-400 border-green-500";
  };

  // ✅ Upload CSV
  const handleUploadCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data.map((row) => ({
          Plant: row.Plant,
          SKU: row.SKU,
          Capacity: Number(row.Capacity),
          Forecast: Number(row.Forecast),
          Allocated: Number(row.Allocated),
          Profit_Margin: Number(row.Profit_Margin || 1),
        }));
        setUploadedData(parsedData);
        setData(parsedData);
        setChartData(transformDataForChart(parsedData));
      },
    });
  };

  // ✅ Download CSV
  const downloadCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "production_plan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f172a] text-white font-sans p-8">
      <motion.div
        className="glass-card p-6 w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 🔹 Title Row with KPIs */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            🏭 Production Capacity Allocation
          </h2>

          <div className="flex items-center gap-6">
            {/* Overall Utilization */}
            <div
              className={`px-4 py-2 rounded-lg border text-sm font-semibold ${getBadgeColor(
                overallUtilization
              )}`}
            >
              Utilization: {overallUtilization}%
            </div>

            {/* Total Profit */}
            <div className="px-4 py-2 rounded-lg border text-sm font-semibold bg-purple-500/20 text-purple-300 border-purple-400">
              💰 Total Profit: ${totalProfit.toLocaleString()}
            </div>

            {/* Most Profitable Plant */}
            {mostProfitable && (
              <div className="px-4 py-2 rounded-lg border text-sm font-semibold bg-yellow-500/20 text-yellow-300 border-yellow-400">
                🏭 Best: {mostProfitable.Plant} (${mostProfitable.Profit.toLocaleString()})
              </div>
            )}

            {/* Upload */}
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500 text-blue-300 rounded-lg hover:bg-blue-500/30 transition cursor-pointer">
              <Upload className="w-4 h-4" /> Upload CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleUploadCSV}
              />
            </label>

            {/* Download */}
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 text-green-300 rounded-lg hover:bg-green-500/30 transition"
            >
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>
        </div>

        {/* 🔹 Strategy Buttons */}
        <div className="flex gap-4 mb-6">
          {["equal", "demand-priority", "profit-priority"].map((strat) => (
            <button
              key={strat}
              onClick={() => setStrategy(strat)}
              className={`px-4 py-2 rounded-lg border transition ${
                strategy === strat
                  ? "bg-green-500/20 border-green-400 text-green-300"
                  : "bg-[#1a1a2e] border border-white/20 text-gray-300 hover:bg-white/10"
              }`}
            >
              {strat.replace("-", " ").toUpperCase()}
            </button>
          ))}
        </div>

        {/* 🔹 Plant Badges (Utilization + Profit) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {chartData.map((plant, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border text-center font-semibold ${getBadgeColor(
                getUtilization(plant)
              )}`}
            >
              {plant.Plant}: {getUtilization(plant)}% | 💰 ${plant.Profit.toLocaleString()}
            </div>
          ))}
        </div>

        {/* 🔹 Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin w-8 h-8 text-green-400" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center text-gray-400 h-64 flex items-center justify-center">
            No production data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="Plant" stroke="#bbb" />
              <YAxis stroke="#bbb" yAxisId="left" />
              <YAxis stroke="#f59e0b" orientation="right" yAxisId="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #444",
                  color: "#fff",
                }}
              />
              <Legend />

              {skus.map((sku, i) => (
                <Bar
                  key={sku}
                  dataKey={sku}
                  stackId="a"
                  fill={["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#eab308"][i % 5]}
                  name={`Allocated ${sku}`}
                  yAxisId="left"
                />
              ))}

              <Line
                type="monotone"
                dataKey="Capacity"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                name="Plant Capacity"
                yAxisId="left"
              />

              {/* Profit Overlay */}
              <Line
                type="monotone"
                dataKey="Profit"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={true}
                name="Plant Profit"
                yAxisId="right"
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 🔹 Table */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border border-gray-700 rounded-lg text-sm">
            <thead className="bg-[#1a1a2e] text-green-300">
              <tr>
                <th className="px-4 py-2 border border-gray-700">Plant</th>
                <th className="px-4 py-2 border border-gray-700">SKU</th>
                <th className="px-4 py-2 border border-gray-700">Capacity</th>
                <th className="px-4 py-2 border border-gray-700">Forecast</th>
                <th className="px-4 py-2 border border-gray-700">Allocated</th>
                <th className="px-4 py-2 border border-gray-700">Profit Margin</th>
                <th className="px-4 py-2 border border-gray-700">Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="px-4 py-2 border border-gray-700">{row.Plant}</td>
                  <td className="px-4 py-2 border border-gray-700">{row.SKU}</td>
                  <td className="px-4 py-2 border border-gray-700">{row.Capacity}</td>
                  <td className="px-4 py-2 border border-gray-700">{row.Forecast}</td>
                  <td className="px-4 py-2 border border-gray-700 text-green-400 font-semibold">
                    {row.Allocated}
                  </td>
                  <td className="px-4 py-2 border border-gray-700">{row.Profit_Margin}</td>
                  <td className="px-4 py-2 border border-gray-700 text-yellow-300 font-semibold">
                    {(row.Allocated * (row.Profit_Margin || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
