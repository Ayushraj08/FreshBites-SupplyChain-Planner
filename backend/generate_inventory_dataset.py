# generate_inventory_dataset.py
import pandas as pd
import random

# Config
num_skus = 20
regions = ["Mumbai", "Delhi", "Bangalore", "Kolkata", "Chennai", "Hyderabad"]
rows = []

for sku_id in range(1, num_skus + 1):
    sku_name = f"SKU-{sku_id}"
    
    # Pick 3 regions for guaranteed cases
    chosen_regions = random.sample(regions, 3)
    
    # Shortage case
    forecast = random.randint(500, 1500)
    stock = int(forecast * random.uniform(0.4, 0.8))  # less than forecast
    rows.append({"SKU": sku_name, "Region": chosen_regions[0], "Forecast": forecast, "Stock": stock})
    
    # Balanced case
    forecast = random.randint(500, 1500)
    stock = int(forecast * random.uniform(0.9, 1.1))  # roughly equal
    rows.append({"SKU": sku_name, "Region": chosen_regions[1], "Forecast": forecast, "Stock": stock})
    
    # Overstock case
    forecast = random.randint(500, 1500)
    stock = int(forecast * random.uniform(1.4, 2.0))  # > 1.3 × forecast
    rows.append({"SKU": sku_name, "Region": chosen_regions[2], "Forecast": forecast, "Stock": stock})
    
    # Fill extra random regions for variety
    for region in regions:
        if region not in chosen_regions:
            forecast = random.randint(500, 1500)
            # Random status
            status_type = random.choice(["short", "balanced", "over"])
            if status_type == "short":
                stock = int(forecast * random.uniform(0.5, 0.8))
            elif status_type == "balanced":
                stock = int(forecast * random.uniform(0.9, 1.1))
            else:
                stock = int(forecast * random.uniform(1.4, 2.0))
            rows.append({"SKU": sku_name, "Region": region, "Forecast": forecast, "Stock": stock})

# Convert to DataFrame
df = pd.DataFrame(rows)

# Shuffle rows
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# Ensure 600–700 rows
df = df.head(650)

# Save
df.to_csv("inventory_dataset.csv", index=False)

print("✅ inventory_dataset.csv generated with", len(df), "rows.")

