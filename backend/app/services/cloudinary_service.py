import os
from typing import Optional
from pathlib import Path
import cloudinary
import cloudinary.uploader
from backend.app.config import settings

class CloudinaryService:
    """
    Handles pre-generation and upload of PDF page images, table crops,
    and visual artifact previews to Cloudinary.
    """

    def __init__(self):
        self.is_configured = bool(
            settings.CLOUDINARY_CLOUD_NAME and
            settings.CLOUDINARY_API_KEY and
            settings.CLOUDINARY_API_SECRET
        )
        if self.is_configured:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )

    def upload_image(self, file_path: str, public_id: Optional[str] = None) -> Optional[str]:
        if not self.is_configured or not os.path.exists(file_path):
            return None
        try:
            res = cloudinary.uploader.upload(
                file_path,
                public_id=public_id,
                folder="superjoin_evidence_artifacts",
                overwrite=True,
                resource_type="image"
            )
            return res.get("secure_url")
        except Exception as e:
            print(f"[Cloudinary] Upload failed for {file_path}: {e}")
            return None

cloudinary_service = CloudinaryService()
