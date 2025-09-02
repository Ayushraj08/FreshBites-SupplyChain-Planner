from flask import Blueprint, request, jsonify
from utils.optimization_engine import generate_production_plan

production_bp = Blueprint("production", __name__)

@production_bp.route("/production_plan", methods=["POST"])
def production_plan():
    """
    Generate production allocation based on strategy.
    Body:
      {
        "strategy": "equal" / "demand-priority" / "profit-priority",
        "uploaded_data": [   # optional, from CSV
            {
              "Plant": "Plant1",
              "SKU": "SKU1",
              "Capacity": 10000,
              "Forecast": 8000,
              "Allocated": 0,
              "Profit_Margin": 1.2
            },
            ...
        ]
      }
    """
    try:
        data = request.json or {}
        strategy = data.get("strategy", "demand-priority")

        # ✅ Handle uploaded CSV dataset if present
        uploaded_data = data.get("uploaded_data")

        plan = generate_production_plan(strategy, uploaded_data=uploaded_data)

        return jsonify(plan)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
