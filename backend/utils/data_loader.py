import pandas as pd
from models import db, Demand, Production, Inventory, Supplier

def load_csv_to_db(filepath):
    """Parse FreshBites CSV (any subset of columns) and insert data into DB."""

    df = pd.read_csv(filepath)

    # Normalize columns to lowercase
    df.columns = [col.strip().lower() for col in df.columns]

    # Buffers for bulk insert
    demand_records, prod_records, inv_records, supplier_records = [], [], [], []

    for _, row in df.iterrows():
        # ---------------- DEMAND ----------------
        if {"week", "sku", "region", "forecast_demand", "actual_demand"}.issubset(df.columns):
            demand_records.append(
                Demand(
                    week=row["week"],
                    sku=row["sku"],
                    region=row["region"],
                    forecast=row["forecast_demand"],
                    actual=row["actual_demand"],
                )
            )

        # ---------------- PRODUCTION ----------------
        if {"week", "sku", "plant", "capacity", "produced"}.issubset(df.columns):
            prod_records.append(
                Production(
                    week=row["week"],
                    sku=row["sku"],
                    plant=row["plant"],
                    capacity=row["capacity"],
                    produced=row["produced"],
                )
            )

        # ---------------- INVENTORY ----------------
        if {"week", "sku", "region", "stock"}.issubset(df.columns):
            inv_records.append(
                Inventory(
                    week=row["week"],
                    sku=row["sku"],
                    region=row["region"],
                    stock=row["stock"],
                )
            )

        # ---------------- SUPPLIERS ----------------
        if "supplier" in df.columns:
            supplier_records.append(
                Supplier(
                    name=row["supplier"],
                    raw_material=row.get("raw_material", None),
                    lead_time=row.get("lead_time", None),
                    on_time=row.get("on_time", None),
                )
            )

    # Bulk insert (efficient)
    if demand_records:
        db.session.bulk_save_objects(demand_records)
    if prod_records:
        db.session.bulk_save_objects(prod_records)
    if inv_records:
        db.session.bulk_save_objects(inv_records)
    if supplier_records:
        db.session.bulk_save_objects(supplier_records)

    db.session.commit()
    print(f"✅ Loaded {len(demand_records)} demand, {len(prod_records)} production, "
          f"{len(inv_records)} inventory, {len(supplier_records)} suppliers from {filepath}")
