from flask import Blueprint, request, jsonify
import os
from utils.data_loader import load_csv_to_db

upload_bp = Blueprint("upload", __name__)
UPLOAD_FOLDER = "backend/data/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@upload_bp.route("/upload", methods=["POST"])
def upload_files():
    if "files" not in request.files:
        return jsonify({"error": "No file part"}), 400

    uploaded_files = request.files.getlist("files")
    saved_files = []

    for file in uploaded_files:
        if file.filename.endswith(".csv"):
            filepath = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filepath)
            saved_files.append(file.filename)

            # ✅ Parse and insert into DB
            load_csv_to_db(filepath)
    
    return jsonify({"message": "Files uploaded successfully", "files": saved_files})
