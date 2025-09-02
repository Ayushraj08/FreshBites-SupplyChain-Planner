import { useState } from "react";
import { motion } from "framer-motion";
import { Info, X } from "lucide-react";

export default function AIModule() {
  const [forecast, setForecast] = useState(null);
  const [forecastFile, setForecastFile] = useState(null);

  const [optimizationResult, setOptimizationResult] = useState([]);
  const [optimizationFile, setOptimizationFile] = useState(null);

  const [whatif, setWhatif] = useState(null);
  const [whatifFile, setWhatifFile] = useState(null);
  const [demandChange, setDemandChange] = useState(0);
  const [capacityChange, setCapacityChange] = useState(0);

  // Forecast Adjustment
  const runForecast = async () => {
    if (forecastFile) {
      const formData = new FormData();
      formData.append("file", forecastFile);

      const res = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/forecast_adjust", {
        method: "POST",
        body: formData,
      });
      setForecast(await res.json());
    } else {
      const series = [120, 135, 150, 170, 200, 220];
      const res = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/forecast_adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ series, periods: 4 }),
      });
      setForecast(await res.json());
    }
  };

  // Optimization Engine
  const runOptimization = async () => {
    if (optimizationFile) {
      const formData = new FormData();
      formData.append("file", optimizationFile);

      const res = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/optimize_allocation", {
        method: "POST",
        body: formData,
      });
      setOptimizationResult(await res.json());
    } else {
      alert("Upload CSV first!");
    }
  };

  // What-If Analyzer (sliders)
  const runWhatIf = async (demand, capacity) => {
    const res = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/whatif", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demand_change: demand, capacity_change: capacity }),
    });
    setWhatif(await res.json());
  };

  // What-If Analyzer (CSV)
  const uploadWhatIfCSV = async () => {
    if (!whatifFile) return alert("Select a CSV file first!");
    const formData = new FormData();
    formData.append("file", whatifFile);

    const res = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/whatif", {
      method: "POST",
      body: formData,
    });
    setWhatif(await res.json());
  };

  return (
    <div className="p-6 space-y-8 text-white">
      {/* Forecast Adjustment */}
      <section className="glass-card p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-purple-300">📈 Forecast Adjustment</h3>
          <div className="relative group">
            <Info className="w-5 h-5 text-gray-400 cursor-pointer" />
            <div className="absolute right-0 mt-6 hidden group-hover:block bg-black text-xs text-gray-300 p-2 rounded-lg w-64">
              Predicts demand for future weeks using ARIMA. Upload demand history or run demo.
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">👉 Upload demand CSV or run demo series.</p>
        <div className="flex gap-2 items-center mt-2">
          <input type="file" accept=".csv" onChange={(e) => setForecastFile(e.target.files[0])} />
          {forecastFile && (
            <span className="text-xs flex items-center gap-2">
              {forecastFile.name}
              <X className="w-4 h-4 cursor-pointer" onClick={() => setForecastFile(null)} />
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-3">
          <button
            onClick={runForecast}
            className="px-4 py-2 bg-purple-500/20 border border-purple-400 rounded-lg hover:bg-purple-500/30"
          >
            Run Forecast
          </button>
          <button
            onClick={() => {
              setForecast(null);
              setForecastFile(null);
            }}
            className="px-4 py-2 bg-red-500/20 border border-red-400 rounded-lg hover:bg-red-500/30"
          >
            Reset
          </button>
        </div>
        {forecast?.forecast && (
          <div className="mt-4 text-green-400 text-sm">
            🔮 Predicted demand (next weeks): {forecast.forecast.join(", ")}
          </div>
        )}
      </section>

      {/* Optimization Engine */}
      <section className="glass-card p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-green-300">⚙️ Optimization Engine</h3>
          <div className="relative group">
            <Info className="w-5 h-5 text-gray-400 cursor-pointer" />
            <div className="absolute right-0 mt-6 hidden group-hover:block bg-black text-xs text-gray-300 p-2 rounded-lg w-64">
              Allocates SKUs across plants to maximize profit. Upload CSV with Plant, SKU, Capacity, Demand, Profit.
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">👉 Upload plant & SKU data, then optimize.</p>
        <div className="flex gap-2 items-center mt-2">
          <input type="file" accept=".csv" onChange={(e) => setOptimizationFile(e.target.files[0])} />
          {optimizationFile && (
            <span className="text-xs flex items-center gap-2">
              {optimizationFile.name}
              <X className="w-4 h-4 cursor-pointer" onClick={() => setOptimizationFile(null)} />
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-3">
          <button
            onClick={runOptimization}
            className="px-4 py-2 bg-green-500/20 border border-green-400 rounded-lg hover:bg-green-500/30"
          >
            Run Optimization
          </button>
          <button
            onClick={() => {
              setOptimizationResult([]);
              setOptimizationFile(null);
            }}
            className="px-4 py-2 bg-red-500/20 border border-red-400 rounded-lg hover:bg-red-500/30"
          >
            Reset
          </button>
        </div>
        {optimizationResult.length > 0 && (
          <div className="mt-4 text-sm">
            <h4 className="font-semibold text-green-400 mb-2">📊 Allocation Results</h4>
            <table className="w-full border border-gray-700 text-xs">
              <thead className="bg-[#1a1a2e]">
                <tr>
                  <th className="p-2 border">Plant</th>
                  <th className="p-2 border">SKU</th>
                  <th className="p-2 border">Allocated</th>
                </tr>
              </thead>
              <tbody>
                {optimizationResult.map((row, i) => (
                  <tr key={i} className="border">
                    <td className="p-2 border">{row.Plant}</td>
                    <td className="p-2 border">{row.SKU}</td>
                    <td className="p-2 border text-green-400">{row.Allocated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* What-If Analyzer */}
      <section className="glass-card p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-yellow-300">🤔 What-If Analyzer</h3>
          <div className="relative group">
            <Info className="w-5 h-5 text-gray-400 cursor-pointer" />
            <div className="absolute right-0 mt-6 hidden group-hover:block bg-black text-xs text-gray-300 p-2 rounded-lg w-64">
              Simulates KPI impact when demand/capacity changes. Upload CSV or adjust sliders.
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">👉 Upload CSV or adjust sliders to analyze scenarios.</p>

        {/* Upload CSV for What-If */}
        <div className="flex gap-2 items-center mt-2">
          <input type="file" accept=".csv" onChange={(e) => setWhatifFile(e.target.files[0])} />
          {whatifFile && (
            <span className="text-xs flex items-center gap-2">
              {whatifFile.name}
              <X className="w-4 h-4 cursor-pointer" onClick={() => setWhatifFile(null)} />
            </span>
          )}
          <button
            onClick={uploadWhatIfCSV}
            className="px-3 py-1 bg-blue-500/20 border border-blue-400 text-blue-300 rounded-lg hover:bg-blue-500/30"
          >
            Upload CSV
          </button>
        </div>

        {/* Sliders */}
        <div className="flex gap-6 items-center mt-4">
          <label>Demand %: <span className="text-blue-400">{demandChange}%</span></label>
          <input
            type="range"
            min="-20"
            max="50"
            step="5"
            value={demandChange}
            onChange={(e) => {
              setDemandChange(Number(e.target.value));
              runWhatIf(Number(e.target.value), capacityChange);
            }}
          />
          <label>Capacity %: <span className="text-blue-400">{capacityChange}%</span></label>
          <input
            type="range"
            min="-20"
            max="50"
            step="5"
            value={capacityChange}
            onChange={(e) => {
              setCapacityChange(Number(e.target.value));
              runWhatIf(demandChange, Number(e.target.value));
            }}
          />
        </div>

        <button
          onClick={() => {
            setWhatif(null);
            setWhatifFile(null);
            setDemandChange(0);
            setCapacityChange(0);
          }}
          className="mt-3 px-4 py-2 bg-red-500/20 border border-red-400 rounded-lg hover:bg-red-500/30"
        >
          Reset
        </button>

        {/* Results */}
        {whatif && (
          <div className="mt-4 text-sm space-y-1">
            <p>📦 Adjusted Demand: {whatif.adjusted_demand}</p>
            <p>🏭 Adjusted Capacity: {whatif.adjusted_capacity}</p>
            <p>❌ Stockouts: {whatif.stockouts}</p>
            <p>✅ Service Level: {whatif.service_level}%</p>
            <p>💰 Excess Cost: ${whatif.excess_cost}</p>
          </div>
        )}
      </section>
    </div>
  );
}
