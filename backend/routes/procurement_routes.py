from flask import Blueprint, request, jsonify
import pandas as pd
from models import db, Demand, Supplier

procurement_bp = Blueprint("procurement", __name__)


# ---------------- Upload Procurement CSV ----------------
@procurement_bp.route("/upload_procurement", methods=["POST"])
def upload_procurement():
    """Upload single procurement CSV with SKU and Forecast_Demand"""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        df = pd.read_csv(file)

        required_cols = {"SKU", "Forecast_Demand"}
        if not required_cols.issubset(df.columns):
            return jsonify({"error": f"CSV must contain {required_cols}"}), 400

        # Clear old demand records
        db.session.query(Demand).delete()
        db.session.commit()

        # Insert fresh demand data
        for _, row in df.iterrows():
            demand = Demand(
                sku=str(row["SKU"]).strip().upper(),
                region="GLOBAL",  # default (since not needed now)
                week=0,           # dummy placeholder
                forecast=int(row["Forecast_Demand"]),
                actual=0          # not used now
            )
            db.session.add(demand)

        db.session.commit()
        return jsonify({"message": "✅ Procurement data uploaded successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- Reset Procurement Data ----------------
@procurement_bp.route("/reset_procurement", methods=["POST"])
def reset_procurement():
    """Clear all demand and supplier data"""
    try:
        db.session.query(Demand).delete()
        db.session.query(Supplier).delete()
        db.session.commit()
        return jsonify({"message": "✅ Procurement data reset successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- Procurement Planning ----------------
# ---------------- Procurement Planning ----------------
@procurement_bp.route("/procurement_plan", methods=["GET"])
def procurement_plan():
    """Return only SKU and Forecast Demand"""
    try:
        demand = (
            db.session.query(
                Demand.sku,
                db.func.sum(Demand.forecast).label("Total_Forecast")
            )
            .group_by(Demand.sku)
            .all()
        )
        demand_df = pd.DataFrame(demand, columns=["SKU", "Total_Forecast"])

        if demand_df.empty:
            return jsonify([])

        results = []
        for _, row in demand_df.iterrows():
            results.append({
                "SKU": row["SKU"],
                "Forecast_Demand": int(row["Total_Forecast"])
            })

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

