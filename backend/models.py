# backend/models.py
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Demand(db.Model):
    __tablename__ = "demand"
    id = db.Column(db.Integer, primary_key=True)
    week = db.Column(db.Integer, nullable=True)  # make optional (some CSVs may not have)
    sku = db.Column(db.String(50), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    forecast = db.Column(db.Integer, nullable=True)  # allow missing forecasts
    actual = db.Column(db.Integer, nullable=True)    # allow missing actuals

class Production(db.Model):
    __tablename__ = "production"
    id = db.Column(db.Integer, primary_key=True)
    week = db.Column(db.Integer, nullable=True)
    sku = db.Column(db.String(50), nullable=False)
    plant = db.Column(db.String(50), nullable=True)   # optional
    capacity = db.Column(db.Integer, nullable=True)
    produced = db.Column(db.Integer, nullable=True)

class Inventory(db.Model):
    __tablename__ = "inventory"
    id = db.Column(db.Integer, primary_key=True)
    week = db.Column(db.Integer, nullable=True)
    sku = db.Column(db.String(50), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    stock = db.Column(db.Integer, nullable=True)
    forecast = db.Column(db.Integer, nullable=True, default=0)

class Supplier(db.Model):
    __tablename__ = "suppliers"

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Supplier identity
    supplier_id = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    # SLA / performance metrics
    committed_lead_time = db.Column(db.Integer, nullable=False, default=0)
    avg_lead_time = db.Column(db.Integer, nullable=False, default=0)
    deliveries = db.Column(db.Integer, nullable=False, default=0)
    on_time_deliveries = db.Column(db.Integer, nullable=False, default=0)

    # 🔹 Procurement planning fields
    material = db.Column(db.String(100), nullable=True)
    sku_linked = db.Column(db.String(50), nullable=True)   # demand SKU this supplier provides
    unit_cost = db.Column(db.Float, nullable=True)         # cost per unit
    min_order_qty = db.Column(db.Integer, nullable=True)   # MOQ constraint
    max_capacity = db.Column(db.Integer, nullable=True)    # supplier's max supply
    lead_time_days = db.Column(db.Integer, nullable=True)  # promised lead time
    current_inventory = db.Column(db.Integer, nullable=True)  # stock on hand
    reorder_point = db.Column(db.Integer, nullable=True)      # threshold to reorder


