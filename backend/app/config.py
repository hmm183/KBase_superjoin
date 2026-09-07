import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Multimodal Temporal Evidence Intelligence Graph"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # MongoDB
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/superjoin")
    MONGO_DB_NAME: str = "superjoin_evidence_graph"
    
    # Neo4j
    NEO4J_URI: str = os.getenv("NEO4J_URI", "neo4j+s://cac7b806.databases.neo4j.io")
    NEO4J_USERNAME: str = os.getenv("NEO4J_USERNAME", "cac7b806")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "vBO2RGeS_9jWf5Gz3YgdVKpyTszAJInQFIdli7GCK_g")
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # Multi-Key Model Gateways
    GEMINI_API_KEYS: List[str] = [
        os.getenv(f"GEMINI_API_KEY_{i}", "")
        for i in range(1, 6)
        if os.getenv(f"GEMINI_API_KEY_{i}")
    ]
    GROQ_API_KEYS: List[str] = [
        os.getenv(f"GROQ_API_KEY_{i}", "")
        for i in range(1, 6)
        if os.getenv(f"GROQ_API_KEY_{i}")
    ]
    CEREBRAS_API_KEYS: List[str] = [
        os.getenv(f"CEREBRAS_API_KEY_{i}", "")
        for i in range(1, 6)
        if os.getenv(f"CEREBRAS_API_KEY_{i}")
    ]
    
    # Local & Privacy Modes
    LOCAL_MODEL_ENDPOINT: str = os.getenv("LOCAL_MODEL_ENDPOINT", "http://localhost:11434/v1")
    PRIVACY_MODE: bool = os.getenv("PRIVACY_MODE", "false").lower() in ("true", "1", "yes")
    
    # File Storage Paths
    DATA_DIR: Path = ROOT_DIR / "data"
    STARTER_DATASETS_DIR: Path = ROOT_DIR / "data" / "starter-datasets"
    MODEL_ARTIFACTS_DIR: Path = ROOT_DIR / "models"
    UPLOAD_DIR: Path = ROOT_DIR / "data" / "uploads"

settings = Settings()
