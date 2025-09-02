from flask import Blueprint, request, jsonify
from datetime import datetime

kpi_bp = Blueprint("kpi", __name__)

# In-memory storage (replace with DB for persistence if needed)
NOTES = []
KPIS = {
    "service_level": 96,          # %
    "stockouts": 3,               # count
    "excess_cost": 12500,         # USD
    "supplier_reliability": 92    # %
}

# ----------------- Notes / Collaboration -----------------
@kpi_bp.route("/notes", methods=["GET", "POST"])
def notes():
    if request.method == "POST":
        data = request.get_json()
        note = {
            "id": len(NOTES),  # ✅ add an ID so frontend can target the right note
            "text": data.get("text", ""),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "approved": False
        }
        NOTES.append(note)
        return jsonify({"message": "Note added", "note": note}), 201
    return jsonify(NOTES)

@kpi_bp.route("/notes/<int:note_id>/approve", methods=["PUT", "POST"])
def approve_note(note_id):
    if 0 <= note_id < len(NOTES):
        NOTES[note_id]["approved"] = True
        return jsonify({"message": "Note approved", "note": NOTES[note_id]})
    return jsonify({"error": "Note not found"}), 404


# ----------------- KPI Tracker -----------------
@kpi_bp.route("/kpis", methods=["GET"])
def kpis():
    return jsonify(KPIS)
