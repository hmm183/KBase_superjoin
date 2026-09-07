import os
from typing import Dict, Any, List, Optional
from pymongo import MongoClient
from backend.app.config import settings

class MongoService:
    """
    MongoDB Atlas interface for documents, evaluation runs, and UI state.
    """

    def __init__(self):
        self.client = None
        self.db = None
        try:
            self.client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=4000)
            self.db = self.client[settings.MONGO_DB_NAME]
            # Verify connectivity
            self.client.admin.command("ping")
            self.is_connected = True
        except Exception as e:
            print(f"[MongoService] Notice: Mongo connection fallback: {e}")
            self.is_connected = False
            self._in_memory_store = {
                "documents": {},
                "facts": {},
                "evaluations": {},
                "active_learning": {}
            }

    def save_document_meta(self, doc_data: Dict[str, Any]):
        if self.is_connected and self.db is not None:
            self.db.documents.update_one(
                {"document_id": doc_data["document_id"]},
                {"$set": doc_data},
                upsert=True
            )
        else:
            self._in_memory_store["documents"][doc_data["document_id"]] = doc_data

    def get_documents(self) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            docs = list(self.db.documents.find({}, {"_id": 0}))
            return docs
        return list(self._in_memory_store["documents"].values())

    def save_fact(self, fact_data: Dict[str, Any]):
        if self.is_connected and self.db is not None:
            self.db.facts.update_one(
                {"fact_id": fact_data["fact_id"]},
                {"$set": fact_data},
                upsert=True
            )
        else:
            self._in_memory_store["facts"][fact_data["fact_id"]] = fact_data

    def get_facts(self) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            return list(self.db.facts.find({}, {"_id": 0}))
        return list(self._in_memory_store["facts"].values())

mongo_service = MongoService()
