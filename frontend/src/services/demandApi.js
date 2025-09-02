// frontend/src/services/demandApi.js
import API from "./api";

export const fetchDemandData = async () => {
  try {
    const response = await API.get("/demand");
    return response.data;
  } catch (error) {
    console.error("Error fetching demand data:", error);
    return [];
  }
};
