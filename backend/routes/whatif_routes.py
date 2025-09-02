# backend/routes/whatif_routes.py
from flask import Blueprint, request, jsonify
import pandas as pd
from models import db, Demand, Inventory

whatif_bp = Blueprint("whatif", __name__)

@whatif_bp.route("/whatif_analysis", methods=["POST"])
def whatif_analysis():
    try:
        params = request.json
        capacity_change = float(params.get("capacity_factor", 1.0))
        leadtime_change = int(params.get("leadtime_days", 0))

        # Demand vs Stock baseline
        demand = db.session.query(
            Demand.sku, db.func.sum(Demand.forecast).label("Forecast")
        ).group_by(Demand.sku).all()
        inventory = db.session.query(
            Inventory.sku, db.func.sum(Inventory.stock).label("Stock")
        ).group_by(Inventory.sku).all()

        demand_df = pd.DataFrame(demand, columns=["SKU", "Forecast"])
        inv_df = pd.DataFrame(inventory, columns=["SKU", "Stock"])
        merged = (
    pd.merge(demand_df, inv_df, on="SKU", how="outer")
    .fillna(0)
    .infer_objects(copy=False)  # <- Explicit conversion
)


        results = []
        for _, row in merged.iterrows():
            adj_forecast = row["Forecast"] * capacity_change
            adj_stock = row["Stock"] - (leadtime_change * 10)  # crude penalty
            service_level = min(adj_stock / adj_forecast, 1) if adj_forecast > 0 else 1

            results.append({
                "SKU": row["SKU"],
                "Adjusted_Forecast": int(adj_forecast),
                "Adjusted_Stock": max(int(adj_stock), 0),
                "Service_Level": round(service_level * 100, 1)
            })

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
