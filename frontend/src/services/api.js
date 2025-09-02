// frontend/src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://freshbites-supplychain-planner-backend.onrender.com/api", 
});

export default API;
