from flask import Blueprint, request, jsonify
import pandas as pd
from models import db, Demand, Inventory
import numpy as np

inventory_bp = Blueprint("inventory", __name__)


# 🔹 Upload Inventory CSV → Refresh DB dynamically
@inventory_bp.route("/upload_inventory", methods=["POST"])
def upload_inventory():
    """
    Upload a new inventory dataset (CSV) and update DB.
    Clears old data and inserts new rows dynamically.
    Supports Forecast column if present.
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        df = pd.read_csv(file)

        # Validate minimum required columns
        required_cols = {"SKU", "Region", "Stock"}
        if not required_cols.issubset(df.columns):
            return jsonify({"error": f"CSV must contain {required_cols}"}), 400

        # Check if Forecast column is included
        has_forecast = "Forecast" in df.columns

        # Clear old records
        db.session.query(Inventory).delete()
        db.session.commit()

        # Insert new data
        count = 0
        for _, row in df.iterrows():
            inv = Inventory(
                sku=str(row["SKU"]),
                region=str(row["Region"]),
                stock=int(row["Stock"]) if not pd.isna(row["Stock"]) else 0,
                forecast=int(row["Forecast"]) if has_forecast and not pd.isna(row["Forecast"]) else 0
            )
            db.session.add(inv)
            count += 1

        db.session.commit()

        return jsonify({
            "message": "✅ Inventory updated dynamically from uploaded CSV",
            "rows_uploaded": count,
            "forecast_included": has_forecast
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 1️⃣ Stock-Out & Overstock Predictor
@inventory_bp.route("/inventory_predictor", methods=["GET"])
def inventory_predictor():
    try:
        demand = (
            db.session.query(
                Demand.sku,
                Demand.region,
                db.func.sum(Demand.forecast).label("Forecast")
            )
            .group_by(Demand.sku, Demand.region).all()
        )
        inventory = (
            db.session.query(
                Inventory.sku,
                Inventory.region,
                db.func.sum(Inventory.stock).label("Stock")
            )
            .group_by(Inventory.sku, Inventory.region).all()
        )

        if not demand or not inventory:
            return jsonify([])

        demand_df = pd.DataFrame(demand, columns=["SKU", "Region", "Forecast"])
        inv_df = pd.DataFrame(inventory, columns=["SKU", "Region", "Stock"])

        merged = pd.merge(demand_df, inv_df, on=["SKU", "Region"], how="outer").fillna(0)

        results = []
        for _, row in merged.iterrows():
            status = "Balanced"
            if row["Stock"] < row["Forecast"]:
                status = "Shortage"
            elif row["Stock"] > row["Forecast"] * 1.3:
                status = "Overstock"

            results.append({
                "SKU": row["SKU"],
                "Region": row["Region"],
                "Forecast": int(row["Forecast"]),
                "Stock": int(row["Stock"]),
                "Status": status
            })
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 2️⃣ Safety Stock Recommendations
@inventory_bp.route("/safety_stock", methods=["POST"])
def safety_stock():
    try:
        data = request.json
        service_level = float(data.get("service_level", 0.95))  # default 95%

        demand = db.session.query(Demand.sku, Demand.region, Demand.forecast).all()
        if not demand:
            return jsonify([])

        df = pd.DataFrame(demand, columns=["SKU", "Region", "Forecast"])

        results = []
        for (sku, region), group in df.groupby(["SKU", "Region"]):
            sigma = np.std(group["Forecast"]) if len(group) > 1 else 10
            lead_time = 2  # assume 2 weeks avg
            z = 1.65 if service_level >= 0.95 else 1.28  # simplified
            ss = int(z * sigma * np.sqrt(lead_time))
            results.append({
                "SKU": sku,
                "Region": region,
                "SafetyStock": ss,
                "ServiceLevel": f"{int(service_level*100)}%"
            })
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 3️⃣ Automated Rebalancing Suggestions
@inventory_bp.route("/rebalance", methods=["GET"])
def rebalance():
    try:
        demand = db.session.query(
            Demand.sku, Demand.region,
            db.func.sum(Demand.forecast).label("Forecast")
        ).group_by(Demand.sku, Demand.region).all()

        inventory = db.session.query(
            Inventory.sku, Inventory.region,
            db.func.sum(Inventory.stock).label("Stock")
        ).group_by(Inventory.sku, Inventory.region).all()

        if not demand or not inventory:
            return jsonify([])

        demand_df = pd.DataFrame(demand, columns=["SKU", "Region", "Forecast"])
        inv_df = pd.DataFrame(inventory, columns=["SKU", "Region", "Stock"])
        merged = pd.merge(demand_df, inv_df, on=["SKU", "Region"], how="outer").fillna(0)

        suggestions = []

        for sku, group in merged.groupby("SKU"):
            shortages = group[group["Stock"] < group["Forecast"]]
            surpluses = group[group["Stock"] > group["Forecast"] * 1.3]

            # ✅ Case 1: surplus + shortage exist
            if not shortages.empty and not surpluses.empty:
                for _, short in shortages.iterrows():
                    for _, surplus in surpluses.iterrows():
                        transfer_qty = min(
                            max(short["Forecast"] - short["Stock"], 0),
                            max(surplus["Stock"] - surplus["Forecast"], 0)
                        )
                        if transfer_qty > 0:
                            suggestions.append({
                                "SKU": sku,
                                "From": surplus["Region"],
                                "To": short["Region"],
                                "Quantity": int(transfer_qty)
                            })

            # ⚡ Case 2: only shortages → take from region with max stock
            elif not shortages.empty:
                donor = group.loc[group["Stock"].idxmax()]
                for _, short in shortages.iterrows():
                    transfer_qty = max(short["Forecast"] - short["Stock"], 0)
                    if transfer_qty > 0 and donor["Region"] != short["Region"]:
                        suggestions.append({
                            "SKU": sku,
                            "From": donor["Region"],
                            "To": short["Region"],
                            "Quantity": int(min(transfer_qty, donor["Stock"]))
                        })

            # ⚡ Case 3: only surpluses → send to region with min stock
            elif not surpluses.empty:
                receiver = group.loc[group["Stock"].idxmin()]
                for _, surplus in surpluses.iterrows():
                    transfer_qty = max(surplus["Stock"] - surplus["Forecast"], 0)
                    if transfer_qty > 0 and receiver["Region"] != surplus["Region"]:
                        suggestions.append({
                            "SKU": sku,
                            "From": surplus["Region"],
                            "To": receiver["Region"],
                            "Quantity": int(transfer_qty)
                        })

        return jsonify(suggestions if suggestions else [{"SKU": "N/A", "From": "-", "To": "-", "Quantity": 0}])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
