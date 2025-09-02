// frontend/src/pages/DemandDashboard.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Loader } from "lucide-react";

export default function DemandDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [simulatedData, setSimulatedData] = useState(null);
  const [simSku, setSimSku] = useState("");
  const [location, setLocation] = useState("");
  const [spikePercent, setSpikePercent] = useState(20);

  // ✅ Fetch demand (with sorting)
  useEffect(() => {
    fetch("http://localhost:8000/api/demand")
      .then((res) => res.json())
      .then((resData) => {
        const sorted = [...resData].sort((a, b) => a.Week - b.Week); // ensure weeks in order
        setData(sorted);
        if (sorted.length > 0) {
          setSimSku(sorted[0].SKU);
          setLocation(sorted[0].Region);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching demand data:", err);
        setLoading(false);
      });
  }, []);

  // ✅ Call backend simulation (with sorting)
  const simulateEvent = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/simulate_demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: location,
          sku: simSku,
          spike_percent: spikePercent,
        }),
      });
      const result = await response.json();
      const sortedSim = [...result].sort((a, b) => a.Week - b.Week);
      setSimulatedData(sortedSim);
    } catch (err) {
      console.error("❌ Simulation error:", err);
    }
  };

  const resetSimulation = () => setSimulatedData(null);

  // ✅ Re-run simulation automatically if SKU/Region changes while simulation is active
  useEffect(() => {
    if (simulatedData) {
      simulateEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simSku, location]);

  // Unique SKUs + Regions
  const skus = [...new Set(data.map((d) => d.SKU))];
  const regions = [...new Set(data.map((d) => d.Region))];

  // ✅ Filtered dataset (from simulated or original, both sorted)
  const filteredData = (simulatedData || data).filter(
    (d) => d.SKU === simSku && d.Region === location
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0f172a] text-white p-8">
      <motion.div
        className="glass-card p-6 w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-6">
          📊 Demand Forecast Dashboard
        </h2>

        {/* 🔥 Festival / Event Simulator */}
        <div className="glass-card p-4 mb-6 flex flex-wrap gap-4 items-center">
          <h3 className="text-lg font-semibold text-purple-300 mb-2 w-full">
            🎉 Festival / Event Impact Simulator
          </h3>

          {/* SKU Dropdown */}
          <select
            value={simSku}
            onChange={(e) => setSimSku(e.target.value)}
            className="bg-[#1a1a2e] border border-purple-400 px-3 py-2 rounded-lg text-sm"
          >
            {skus.map((sku, i) => (
              <option key={i} value={sku}>{sku}</option>
            ))}
          </select>

          {/* Region Dropdown */}
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-[#1a1a2e] border border-purple-400 px-3 py-2 rounded-lg text-sm"
          >
            {regions.map((region, i) => (
              <option key={i} value={region}>{region}</option>
            ))}
          </select>

          {/* Spike Slider */}
          <div className="flex flex-col items-center">
            <label className="text-xs text-white-400 mb-3">
              Spike (%): {spikePercent}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={spikePercent}
              onChange={(e) => setSpikePercent(Number(e.target.value))}
              className="w-40 accent-purple-500"
            />
          </div>

          {/* Buttons */}
          <button
            onClick={simulateEvent}
            className="px-4 py-2 bg-purple-500/20 border border-purple-500 text-purple-300 rounded-lg hover:bg-purple-500/30 transition"
          >
            Simulate Event
          </button>
          {simulatedData && (
            <button
              onClick={resetSimulation}
              className="px-4 py-2 bg-red-500/20 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/30 transition"
            >
              Reset Simulation
            </button>
          )}
        </div>

        {/* Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin w-8 h-8 text-purple-400" />
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="Week"
                  stroke="#bbb"
                  tickFormatter={(v) => `Week ${v}`}
                  label={{ value: "Weeks", position: "insideBottom", offset: -2, fill: "#aaa" }}
                />
                <YAxis
                  stroke="#bbb"
                  label={{ value: "Demand (Units)", angle: -90, position: "insideLeft", fill: "#aaa" }}
                />
                <Tooltip />
                <Legend />

                {/* Forecast as Bar */}
                <Bar
                  dataKey="Forecast_Demand"
                  barSize={20}
                  fill="#a855f7"
                  name="Forecast Demand (Bar)"
                />

                {/* Actual as Line */}
                <Line
                  type="monotone"
                  dataKey="Actual_Demand"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Actual Demand (Line)"
                />

                {/* Simulated as Line */}
                {simulatedData && (
                  <Line
                    type="monotone"
                    dataKey="Simulated_Demand"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    name="Simulated Demand (Event)"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>

            {/* Legend Explanation */}
            <div className="mt-6 text-sm text-gray-400 bg-[#1a1a2e] p-4 rounded-lg">
              <p>🟣 Forecast Demand (Bar)</p>
              <p>🔵 Actual Demand (Line)</p>
              {simulatedData && <p>🟠 Orange Dashed Line = Simulated Event Demand</p>}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
