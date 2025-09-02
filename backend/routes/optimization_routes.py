# backend/routes/optimization_routes.py
from flask import Blueprint, request, jsonify
import pandas as pd
from models import db, Demand, Supplier

optimization_bp = Blueprint("optimization", __name__)

@optimization_bp.route("/optimize_production", methods=["POST"])
def optimize_production():
    """
    Allocates production across SKUs based on demand and supplier constraints.
    """
    try:
        req = request.get_json()
        total_capacity = req.get("capacity", 1000)

        # Demand aggregated by SKU
        demand = (
            db.session.query(Demand.sku, db.func.sum(Demand.forecast).label("Total_Forecast"))
            .group_by(Demand.sku).all()
        )
        demand_df = pd.DataFrame(demand, columns=["SKU", "Total_Forecast"])

        suppliers = db.session.query(Supplier).all()
        if demand_df.empty or not suppliers:
            return jsonify([])

        results = []
        used_capacity = 0

        for _, row in demand_df.iterrows():
            sku = row["SKU"]
            forecast = row["Total_Forecast"]

            # Get suppliers linked to this SKU
            sku_suppliers = [s for s in suppliers if s.sku_linked == sku]
            if not sku_suppliers:
                continue

            for s in sku_suppliers:
                # Allocate respecting supplier constraints
                alloc = min(
                    forecast - used_capacity,
                    s.max_capacity,
                    total_capacity - used_capacity
                )
                alloc = max(s.min_order_qty, alloc)

                if alloc <= 0:
                    continue

                used_capacity += alloc

                results.append({
                    "SKU": sku,
                    "Forecast": forecast,
                    "Allocated": alloc,
                    "Supplier_ID": s.supplier_id,
                    "Supplier_Name": s.name,
                    "Unit_Cost": s.unit_cost,
                    "Total_Cost": round(alloc * s.unit_cost, 2)
                })

                if used_capacity >= total_capacity:
                    break

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
