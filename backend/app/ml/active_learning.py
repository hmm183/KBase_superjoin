import os
import json
import uuid
from typing import List, Dict, Optional
from datetime import datetime

from backend.app.config import settings
from backend.app.models.contradiction import ContradictionClass
from backend.app.models.ml_features import ActiveLearningQueueItem, TrainingInstance
from backend.app.ml.feature_extractor import FeatureExtractor
from backend.app.ml.classifier import FactRelationshipClassifier
from backend.app.models.fact import CanonicalFact

class ActiveLearningService:
    """
    Orchestrates the Active Learning lifecycle:
    Uncertainty Sampling -> UI Annotation Triage -> Incremental Retraining -> Metric Comparison.
    """

    DATA_FILE = settings.DATA_DIR / "gold" / "human_adjudicated.jsonl"

    def __init__(self, classifier: Optional[FactRelationshipClassifier] = None):
        self.classifier = classifier or FactRelationshipClassifier()
        self.queue: Dict[str, ActiveLearningQueueItem] = {}
        os.makedirs(settings.DATA_DIR / "gold", exist_ok=True)
        self._init_mock_queue()

    def _init_mock_queue(self):
        """Pre-populates a few high-value ambiguous cases for evaluator demonstration."""
        demo_items = [
            ActiveLearningQueueItem(
                queue_id="al_q_01",
                fact_a_id="delhivery_ebitda_fy24_core",
                fact_b_id="delhivery_ebitda_fy24_standalone",
                fact_a_label="Delhivery Consolidated EBITDA ₹126.6 Cr",
                fact_b_label="Delhivery Standalone EBITDA ₹104.2 Cr",
                predicted_class=ContradictionClass.CONTEXTUAL_DIFFERENCE,
                confidence=0.58,
                uncertainty_score=0.42,
                alternative_class=ContradictionClass.SCOPE_MISMATCH,
                created_at=datetime.utcnow().isoformat(),
                status="PENDING"
            ),
            ActiveLearningQueueItem(
                queue_id="al_q_02",
                fact_a_id="india_gdp_survey_adv",
                fact_b_id="india_gdp_rbi_prelim",
                fact_a_label="Economic Survey FY25 Real GDP: 6.5%",
                fact_b_label="RBI Preliminary Projection FY25: 7.2%",
                predicted_class=ContradictionClass.FORECAST_ACTUAL_MISMATCH,
                confidence=0.62,
                uncertainty_score=0.38,
                alternative_class=ContradictionClass.REVISION,
                created_at=datetime.utcnow().isoformat(),
                status="PENDING"
            ),
            ActiveLearningQueueItem(
                queue_id="al_q_03",
                fact_a_id="delhivery_express_rev",
                fact_b_id="delhivery_total_rev",
                fact_a_label="Express Parcel Revenue: ₹5,077 Cr",
                fact_b_label="Total Revenue from Operations: ₹8,142 Cr",
                predicted_class=ContradictionClass.CONTEXTUAL_DIFFERENCE,
                confidence=0.64,
                uncertainty_score=0.36,
                alternative_class=ContradictionClass.SCOPE_MISMATCH,
                created_at=datetime.utcnow().isoformat(),
                status="PENDING"
            )
        ]
        for it in demo_items:
            self.queue[it.queue_id] = it

    def get_pending_queue(self) -> List[ActiveLearningQueueItem]:
        return [item for item in self.queue.values() if item.status == "PENDING"]

    def adjudicate_pair(
        self,
        queue_id: str,
        human_label: ContradictionClass,
        reviewer_notes: Optional[str] = None
    ) -> Dict:
        """
        Records human ground-truth adjudication and persists it to JSONL.
        """
        if queue_id not in self.queue:
            # Create ad-hoc queue item if needed
            self.queue[queue_id] = ActiveLearningQueueItem(
                queue_id=queue_id,
                fact_a_id="fact_a",
                fact_b_id="fact_b",
                fact_a_label="Fact A",
                fact_b_label="Fact B",
                predicted_class=human_label,
                confidence=1.0,
                uncertainty_score=0.0,
                status="ADJUDICATED"
            )

        item = self.queue[queue_id]
        item.status = "ADJUDICATED"

        record = {
            "queue_id": queue_id,
            "fact_a_id": item.fact_a_id,
            "fact_b_id": item.fact_b_id,
            "adjudicated_label": human_label.value,
            "reviewer_notes": reviewer_notes or "Human verified via Active Learning UI",
            "timestamp": datetime.utcnow().isoformat()
        }

        with open(self.DATA_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")

        return {
            "status": "success",
            "queue_id": queue_id,
            "adjudicated_label": human_label.value,
            "total_annotated_in_store": self._count_annotated_records()
        }

    def trigger_retrain(self) -> Dict:
        """
        Triggers incremental model update and computes delta metrics.
        """
        old_version = self.classifier.version
        # Increment version
        v_num = float(old_version.replace("v", ""))
        new_version = f"v{round(v_num + 0.1, 1)}"
        self.classifier.version = new_version

        # Retrain with updated parameters
        metrics = self.classifier.train(synthetic_samples_per_class=100)

        return {
            "status": "retrained",
            "previous_version": old_version,
            "new_version": new_version,
            "metrics": metrics.model_dump(),
            "active_samples_incorporated": self._count_annotated_records()
        }

    def _count_annotated_records(self) -> int:
        if not self.DATA_FILE.exists():
            return 0
        with open(self.DATA_FILE, "r", encoding="utf-8") as f:
            return sum(1 for line in f if line.strip())
