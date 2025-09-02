import os
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    CSV_PATH = os.getenv("CSV_PATH", os.path.join(os.path.dirname(__file__), "data", "FreshBites_SupplyChain_Data.csv"))
    PORT = int(os.getenv("PORT", 8000))
