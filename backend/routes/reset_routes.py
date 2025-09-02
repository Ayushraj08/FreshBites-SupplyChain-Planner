from flask import Blueprint, jsonify
from models import db  # ✅ your SQLAlchemy instance
import os

reset_bp = Blueprint("reset", __name__)

@reset_bp.route("/reset", methods=["POST"])
def reset():
    """
    Reset all dashboards, data, and charts.
    Drops all tables, recreates schema, clears uploads.
    """
    try:
        # ✅ Drop & recreate tables
        db.drop_all()
        db.create_all()

        # ✅ (Optional) Clear uploaded CSV files
        upload_folder = os.path.join(os.getcwd(), "backend", "data", "uploads")
        if os.path.exists(upload_folder):
            for f in os.listdir(upload_folder):
                try:
                    os.remove(os.path.join(upload_folder, f))
                except Exception as e:
                    print("⚠️ Could not delete:", f, e)

        return jsonify({"message": "All dashboards and data reset successfully"}), 200

    except Exception as e:
        print("❌ Reset error:", str(e))
        return jsonify({"error": str(e)}), 500
