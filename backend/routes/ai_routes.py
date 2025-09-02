# backend/routes/ai_routes.py
from flask import Blueprint, request, jsonify
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from ortools.linear_solver import pywraplp

ai_bp = Blueprint("ai", __name__)

# ---------------- Forecast Adjustment ----------------
@ai_bp.route("/forecast_adjust", methods=["POST"])
def forecast_adjust():
    """
    Adjust forecast using ARIMA (time-series).
    Input:
      - JSON: { "series": [list], "periods": 4 }
      - OR CSV upload with a column "Demand"
    """
    try:
        series = []
        periods = 4

        # ✅ CSV upload mode
        if "file" in request.files:
            file = request.files["file"]
            df = pd.read_csv(file)
            if "Demand" not in df.columns:
                return jsonify({"error": "CSV must contain a 'Demand' column"}), 400
            series = df["Demand"].dropna().astype(float).tolist()
            periods = 4  # default if CSV
        else:
            # ✅ JSON mode
            data = request.json or {}
            series = data.get("series", [])
            periods = int(data.get("periods", 4))

        if len(series) < 3:
            return jsonify({"error": "Need at least 3 data points"}), 400

        # Fit ARIMA model
        model = ARIMA(series, order=(1, 1, 1))
        model_fit = model.fit()
        forecast = model_fit.forecast(steps=periods)

        return jsonify({
            "original_series": [round(x, 2) for x in series],
            "forecast": [round(x, 2) for x in forecast.tolist()]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- Optimization Engine ----------------
@ai_bp.route("/optimize_allocation", methods=["POST"])
def optimize_allocation():
    """
    Optimize allocation using OR-Tools LP solver.
    Input:
      - JSON: { "plants": [...], "skus": [...] }
      - OR CSV upload with columns: Plant, SKU, Capacity, Demand, Profit
    """
    try:
        plants, skus = [], []

        # ✅ CSV upload mode
        if "file" in request.files:
            file = request.files["file"]
            df = pd.read_csv(file)

            required_cols = {"Plant", "SKU", "Capacity", "Demand", "Profit"}
            if not required_cols.issubset(df.columns):
                return jsonify({"error": f"CSV must contain {required_cols}"}), 400

            # Aggregate unique plants
            plants = (
                df.groupby("Plant")["Capacity"].first().reset_index()
                .rename(columns={"Plant": "name", "Capacity": "capacity"})
                .to_dict(orient="records")
            )

            # Aggregate unique SKUs
            skus = (
                df.groupby("SKU")[["Demand", "Profit"]].first().reset_index()
                .rename(columns={"SKU": "sku", "Demand": "demand", "Profit": "profit"})
                .to_dict(orient="records")
            )
        else:
            # ✅ JSON mode
            data = request.json or {}
            plants = data.get("plants", [])
            skus = data.get("skus", [])

        solver = pywraplp.Solver.CreateSolver("SCIP")
        if not solver:
            return jsonify({"error": "Solver not available"}), 500

        # Variables: allocation[plant][sku]
        alloc = {}
        for p in plants:
            for s in skus:
                alloc[(p["name"], s["sku"])] = solver.IntVar(
                    0, solver.infinity(), f"{p['name']}_{s['sku']}"
                )

        # Constraints: plant capacity
        for p in plants:
            solver.Add(sum(alloc[(p["name"], s["sku"])] for s in skus) <= p["capacity"])

        # Constraints: demand fulfillment
        for s in skus:
            solver.Add(sum(alloc[(p["name"], s["sku"])] for p in plants) <= s["demand"])

        # Objective: maximize profit
        solver.Maximize(
            sum(alloc[(p["name"], s["sku"])] * s["profit"] for p in plants for s in skus)
        )

        solver.Solve()

        result = []
        for p in plants:
            for s in skus:
                qty = alloc[(p["name"], s["sku"])].solution_value()
                if qty > 0:
                    result.append(
                        {
                            "Plant": p["name"],
                            "SKU": s["sku"],
                            "Allocated": round(qty, 2)
                        }
                    )

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- What-If Analyzer ----------------
@ai_bp.route("/whatif", methods=["POST"])
def whatif():
    """
    What-if analysis with demand/capacity scaling.
    Input:
      - JSON: { "demand_change": 10, "capacity_change": -5 }
      - OR CSV upload with columns: Demand, Capacity
    """
    try:
        base_demand, base_capacity, base_cost, base_service = 1000, 1200, 5000, 95
        demand_change, capacity_change = 0, 0

        # ✅ CSV upload mode
        if "file" in request.files:
            file = request.files["file"]
            df = pd.read_csv(file)
            if not {"Demand", "Capacity"}.issubset(df.columns):
                return jsonify({"error": "CSV must have 'Demand' and 'Capacity' columns"}), 400

            base_demand = df["Demand"].sum()
            base_capacity = df["Capacity"].sum()
        else:
            # ✅ JSON mode
            data = request.json or {}
            demand_change = float(data.get("demand_change", 0))
            capacity_change = float(data.get("capacity_change", 0))

        adjusted_demand = base_demand * (1 + demand_change / 100)
        adjusted_capacity = base_capacity * (1 + capacity_change / 100)

        stockouts = max(0, adjusted_demand - adjusted_capacity)
        service_level = min(100, (adjusted_capacity / adjusted_demand) * 100)
        excess_cost = base_cost * (1 + demand_change / 200)

        return jsonify(
            {
                "adjusted_demand": round(adjusted_demand, 2),
                "adjusted_capacity": round(adjusted_capacity, 2),
                "stockouts": round(stockouts, 2),
                "service_level": round(service_level, 2),
                "excess_cost": round(excess_cost, 2),
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
