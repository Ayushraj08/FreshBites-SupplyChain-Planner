// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DemandDashboard from "./pages/DemandDashboard";
import ProductionPlanner from "./pages/ProductionPlanner";
import InventoryOptimizer from "./pages/InventoryOptimizer";
import SupplierTracker from "./pages/SupplierTracker";
import SimulationLab from "./pages/SimulationLab";
import ReportsKPIs from "./pages/ReportsKPIs";
import ProcurementDashboard from "./pages/ProcurementDashboard";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-white relative">
        <Routes>
          {/* Main dashboard (with file upload) */}
          <Route path="/" element={<Dashboard />} />

          {/* Feature pages */}
          <Route path="/demand" element={<DemandDashboard />} />
          <Route path="/production" element={<ProductionPlanner />} />
          <Route path="/inventory" element={<InventoryOptimizer />} />
          <Route path="/suppliers" element={<SupplierTracker />} />
          <Route path="/procurement" element={<ProcurementDashboard />} />
          <Route path="/simulation" element={<SimulationLab />} />
          <Route path="/reports" element={<ReportsKPIs />} />

          {/* Fallback: redirect unknown paths to dashboard */}
          <Route path="*" element={<Dashboard />} />
        </Routes>

        
      </div>
    </Router>
  );
}

export default App;
