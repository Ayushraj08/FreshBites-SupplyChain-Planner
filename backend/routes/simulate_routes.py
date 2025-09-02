from flask import Blueprint, request, jsonify
import pandas as pd
from models import db, Demand

simulate_bp = Blueprint("simulate", __name__)

@simulate_bp.route("/simulate_demand", methods=["POST"])
def simulate_demand():
    """
    Simulate demand spikes for given region, SKU, and one or multiple weeks.
    Returns adjusted demand dataset without modifying DB permanently.
    """
    data = request.json
    region = data.get("region", "All")
    sku = data.get("sku", "All")
    weeks = data.get("weeks", [])
    spike_percent = float(data.get("spike_percent", 0))

    # Normalize weeks (allow int or list)
    if isinstance(weeks, int):
        weeks = [weeks]

    # Load current demand data from DB
    demand = (
        db.session.query(
            Demand.week,
            Demand.region,
            Demand.sku,
            Demand.forecast,
            Demand.actual
        ).all()
    )

    df = pd.DataFrame(demand, columns=["Week", "Region", "SKU", "Forecast_Demand", "Actual_Demand"])

    # 🔹 Initialize Simulated_Demand as float, based on Actual_Demand
    df["Simulated_Demand"] = df["Actual_Demand"].astype(float)

    # Build mask for simulation
    mask = df["Week"].isin(weeks) if weeks else pd.Series(True, index=df.index)
    if region != "All":
        mask &= df["Region"] == region
    if sku != "All":
        mask &= df["SKU"] == sku

    # Apply spike to Actual_Demand values where mask is True
    df.loc[mask, "Simulated_Demand"] = (
        df.loc[mask, "Actual_Demand"].astype(float) * (1 + spike_percent / 100.0)
    ).round(2)

    # 🔹 Return filtered dataset (so frontend shows relevant view)
    result_df = df.copy()
    if region != "All":
        result_df = result_df[result_df["Region"] == region]
    if sku != "All":
        result_df = result_df[result_df["SKU"] == sku]

    return jsonify(result_df.to_dict(orient="records"))
