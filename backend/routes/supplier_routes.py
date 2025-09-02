# backend/routes/supplier_routes.py
from flask import Blueprint, request, jsonify
import pandas as pd
from models import db, Supplier

supplier_bp = Blueprint("supplier", __name__)


# 🔹 Upload Supplier CSV → Refresh DB dynamically
@supplier_bp.route("/upload_suppliers", methods=["POST"])
def upload_suppliers():
    """
    Upload new supplier dataset (CSV) and update DB dynamically.
    Clears old supplier records and inserts new ones.
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        df = pd.read_csv(file)

        # ✅ Required columns for Supplier upload
        required_cols = {
            "Supplier_ID",
            "Name",
            "Committed_Lead_Time",
            "Avg_Lead_Time_Days",
            "Deliveries",
            "On_Time_Deliveries",
        }
        if not required_cols.issubset(df.columns):
            return jsonify({"error": f"CSV must contain {required_cols}"}), 400

        # Clear old supplier records
        db.session.query(Supplier).delete()
        db.session.commit()

        # Insert fresh supplier data
        for _, row in df.iterrows():
            supplier = Supplier(
                supplier_id=str(row["Supplier_ID"]),
                name=str(row["Name"]),
                committed_lead_time=int(row["Committed_Lead_Time"]),
                avg_lead_time=int(row["Avg_Lead_Time_Days"]),
                deliveries=int(row["Deliveries"]),
                on_time_deliveries=int(row["On_Time_Deliveries"]),
            )
            db.session.add(supplier)

        db.session.commit()

        return jsonify({"message": "✅ Supplier data updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 🔹 Supplier Reliability Tracker
@supplier_bp.route("/suppliers", methods=["GET"])
def get_suppliers():
    """
    Returns suppliers with reliability % and delay flags
    """
    try:
        suppliers = db.session.query(Supplier).all()
        if not suppliers:
            return jsonify([])

        results = []
        for s in suppliers:
            reliability = (
                round((s.on_time_deliveries / s.deliveries) * 100, 2)
                if s.deliveries > 0
                else 0
            )
            delay_flag = (
                "⚠️ Delayed"
                if s.avg_lead_time > s.committed_lead_time
                else "✅ On-Time"
            )

            results.append(
                {
                    "Supplier_ID": s.supplier_id,
                    "Name": s.name,
                    "Committed_Lead_Time": s.committed_lead_time,
                    "Avg_Lead_Time_Days": s.avg_lead_time,
                    "Deliveries": s.deliveries,
                    "On_Time_Deliveries": s.on_time_deliveries,
                    "Reliability": reliability,
                    "Status": delay_flag,
                }
            )

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
