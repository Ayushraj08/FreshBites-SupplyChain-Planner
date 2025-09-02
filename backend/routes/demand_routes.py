from flask import Blueprint, request, jsonify
import pandas as pd
from models import db, Demand

demand_bp = Blueprint("demand", __name__)

# ---------------- Upload Demand CSV ----------------
@demand_bp.route("/upload_demand", methods=["POST"])
def upload_demand():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        df = pd.read_csv(file)

        print("📂 Uploaded columns:", list(df.columns))   # Debug

        # 🔹 Normalize col names
        df.columns = df.columns.str.strip()

        # 🔹 Required cols (match CSV exactly)
        required_cols = {"Week", "Region", "SKU", "Forecast_Demand", "Actual_Demand"}
        if not required_cols.issubset(df.columns):
            return jsonify({"error": f"CSV must contain {required_cols}"}), 400

        # Clear old records
        db.session.query(Demand).delete()
        db.session.commit()

        # Insert fresh rows
        inserted = 0
        for _, row in df.iterrows():
            demand = Demand(
                week=int(row["Week"]),
                region=str(row["Region"]).strip().title(),
                sku=str(row["SKU"]).strip().upper(),
                forecast=int(row["Forecast_Demand"]),
                actual=int(row["Actual_Demand"]),
            )
            db.session.add(demand)
            inserted += 1

        db.session.commit()
        return jsonify({"message": f"✅ Uploaded {inserted} rows"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- Get Demand Data ----------------
@demand_bp.route("/demand", methods=["GET"])
def get_demand():
    try:
        demand = (
            db.session.query(
                Demand.week,
                Demand.region,
                Demand.sku,
                db.func.sum(Demand.forecast).label("Forecast_Demand"),
                db.func.sum(Demand.actual).label("Actual_Demand"),
            )
            .group_by(Demand.week, Demand.region, Demand.sku)
            .all()
        )

        results = [
            {
                "Week": row[0],
                "Region": str(row[1]).title(),
                "SKU": str(row[2]).upper(),
                "Forecast_Demand": row[3],
                "Actual_Demand": row[4],
            }
            for row in demand
        ]
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- Simulate Demand (Spike) ----------------
@demand_bp.route("/simulate_demand", methods=["POST"])
def simulate_demand():
    """Apply spike to ACTUAL demand for a SKU + Region, also flag spikes vs previous week."""
    try:
        data = request.get_json()
        sku = str(data.get("sku", "")).strip().upper()
        region = str(data.get("region", "")).strip().title()
        spike_percent = float(data.get("spike_percent", 0))

        demand = (
            db.session.query(
                Demand.week,
                Demand.region,
                Demand.sku,
                db.func.sum(Demand.forecast).label("Forecast_Demand"),
                db.func.sum(Demand.actual).label("Actual_Demand"),
            )
            .filter(Demand.sku == sku, Demand.region == region)
            .group_by(Demand.week, Demand.region, Demand.sku)
            .order_by(Demand.week)  # ✅ ensure chronological order
            .all()
        )

        if not demand:
            return jsonify([])

        results = []
        prev_actual = None
        for row in demand:
            week, region_val, sku_val, forecast, actual = row

            # ✅ Simulate spike based on ACTUAL demand (with float precision)
            simulated_actual = round(float(actual) * (1 + spike_percent / 100.0), 2)

            # ✅ Spike detection (actual vs prev week actual)
            spike_flag = False
            if prev_actual is not None and prev_actual > 0:
                spike_flag = float(actual) > float(prev_actual) * (1 + spike_percent / 100.0)

            results.append({
                "Week": week,
                "Region": str(region_val).title(),
                "SKU": str(sku_val).upper(),
                "Forecast_Demand": forecast,
                "Actual_Demand": actual,
                "Simulated_Demand": simulated_actual,
                "Spike": spike_flag
            })

            prev_actual = actual

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
