# utils/optimization_engine.py
import pandas as pd

def generate_production_plan(strategy="demand-priority", uploaded_data=None):
    """
    Generate production allocation per plant & SKU.
    Supports 'equal', 'demand-priority', 'profit-priority'.
    Works with uploaded CSV (if provided) or DB fallback.
    """

    # ✅ If uploaded_data (from frontend CSV upload) is provided
    if uploaded_data:
        df = pd.DataFrame(uploaded_data)
    else:
        # 🔹 TODO: Replace with DB query if you want DB fallback.
        return []

    # Ensure correct types
    df["Capacity"] = df["Capacity"].astype(float)
    df["Forecast"] = df["Forecast"].astype(float)
    df["Allocated"] = df["Allocated"].astype(float)
    if "Profit_Margin" in df.columns:
        df["Profit_Margin"] = df["Profit_Margin"].astype(float)
    else:
        df["Profit_Margin"] = 1.0  # fallback

    results = []

    for plant, group in df.groupby("Plant"):
        plant_capacity = group["Capacity"].iloc[0]  # same for all rows in plant
        allocations = []

        if strategy == "equal":
            # Equal split across SKUs
            equal_alloc = plant_capacity / len(group)
            allocations = [min(equal_alloc, f) for f in group["Forecast"]]

        elif strategy == "demand-priority":
            # Proportional to forecast demand
            total_forecast = group["Forecast"].sum()
            allocations = [
                (f / total_forecast) * plant_capacity if total_forecast > 0 else 0
                for f in group["Forecast"]
            ]

        elif strategy == "profit-priority":
            # Proportional to (forecast * profit margin)
            group["weighted"] = group["Forecast"] * group["Profit_Margin"]
            total_weight = group["weighted"].sum()
            allocations = [
                (w / total_weight) * plant_capacity if total_weight > 0 else 0
                for w in group["weighted"]
            ]

        # Save results
        for i, row in group.reset_index().iterrows():
            results.append({
                "Plant": row["Plant"],
                "SKU": row["SKU"],
                "Capacity": float(row["Capacity"]),
                "Forecast": float(row["Forecast"]),
                "Allocated": round(float(allocations[i]), 2),
                "Profit_Margin": float(row["Profit_Margin"])
            })

    return results
