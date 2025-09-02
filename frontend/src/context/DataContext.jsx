// frontend/src/context/DataContext.jsx
import { createContext, useState, useEffect } from "react";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [demandData, setDemandData] = useState([]);
  const [productionData, setProductionData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [kpiData, setKpiData] = useState({});

  const fetchAllData = async () => {
    try {
      const demand = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/demand").then(r => r.json());
      const stock = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/stock").then(r => r.json());
      const suppliers = await fetch("https://freshbites-supplychain-planner-backend.onrender.com/api/suppliers").then(r => r.json());

      setDemandData(demand);
      setInventoryData(stock);
      setSupplierData(suppliers);

      // KPIs will come later
      setKpiData({ serviceLevel: 0, forecastAccuracy: 0 });
    } catch (err) {
      console.error("❌ Data fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchAllData(); // load once at startup
  }, []);

  return (
    <DataContext.Provider value={{
      demandData,
      productionData,
      inventoryData,
      supplierData,
      kpiData,
      fetchAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};
