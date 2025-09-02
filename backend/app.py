from flask import Flask, jsonify
from flask_cors import CORS
from models import db, Demand, Inventory, Supplier
from routes.upload_routes import upload_bp
from routes.simulate_routes import simulate_bp
from routes.production_routes import production_bp
from routes.inventory_routes import inventory_bp
from routes.supplier_routes import supplier_bp
from routes.procurement_routes import procurement_bp
from routes.demand_routes import demand_bp
from routes.ai_routes import ai_bp
from routes.optimization_routes import optimization_bp
from routes.whatif_routes import whatif_bp
from routes.kpi_routes import kpi_bp
from routes.reset_routes import reset_bp
import os
from flask_migrate import Migrate  

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # allow React frontend requests

# ---------------- DATABASE CONFIG ----------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "freshbites.db")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# ✅ Init DB + Migrations
db.init_app(app)
migrate = Migrate(app, db)

with app.app_context():
    db.create_all()

# ---------------- REGISTER ROUTES ----------------
app.register_blueprint(upload_bp, url_prefix="/api")
app.register_blueprint(simulate_bp, url_prefix="/api")
app.register_blueprint(production_bp, url_prefix="/api")
app.register_blueprint(inventory_bp, url_prefix="/api")
app.register_blueprint(supplier_bp, url_prefix="/api")
app.register_blueprint(procurement_bp, url_prefix="/api")
app.register_blueprint(demand_bp, url_prefix="/api")
app.register_blueprint(ai_bp, url_prefix="/api")
app.register_blueprint(optimization_bp, url_prefix="/api")
app.register_blueprint(whatif_bp, url_prefix="/api")
app.register_blueprint(kpi_bp, url_prefix="/api")
app.register_blueprint(reset_bp, url_prefix="/api")

# ---------------- ROOT ----------------
@app.route("/")
def home():
    return {"message": "FreshBites Supply Chain Planner API is running 🚀"}

# ---------------- STOCK API ----------------
@app.route("/api/stock")
def get_stock():
    stock = (
        db.session.query(
            Inventory.region,
            Inventory.sku,
            db.func.sum(Inventory.stock).label("Stock_Level")
        )
        .group_by(Inventory.region, Inventory.sku)
        .all()
    )

    results = [
        {"Region": row[0], "SKU": row[1], "Stock_Level": row[2]}
        for row in stock
    ]
    return jsonify(results)

# ---------------- SUPPLIER API ----------------
@app.route("/api/suppliers")
def get_suppliers():
    """
    Returns supplier reliability and SLA performance.
    """
    suppliers = db.session.query(Supplier).all()
    if not suppliers:
        return jsonify([])

    results = []
    for s in suppliers:
        reliability = round((s.on_time_deliveries / s.deliveries) * 100, 2) if s.deliveries > 0 else 0
        delay_flag = "⚠️ Delayed" if s.avg_lead_time > s.committed_lead_time else "✅ On-Time"

        results.append({
            "Supplier_ID": s.supplier_id,
            "Name": s.name,
            "Committed_Lead_Time": s.committed_lead_time,
            "Avg_Lead_Time_Days": s.avg_lead_time,
            "Deliveries": s.deliveries,
            "On_Time_Deliveries": s.on_time_deliveries,
            "Reliability": reliability,
            "Status": delay_flag
        })
    return jsonify(results)

# ---------------- MAIN ----------------
if __name__ == "__main__":
    app.run(debug=True, port=8000)
