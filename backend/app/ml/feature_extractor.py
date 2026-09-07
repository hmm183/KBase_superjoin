import math
from typing import Tuple, List, Optional
from rapidfuzz import fuzz, distance
from backend.app.models.fact import CanonicalFact, UnitType, ObservationType
from backend.app.models.ml_features import PairwiseFeatureVector

class FeatureExtractor:
    """
    Computes a 12-dimensional structured distance and similarity vector
    between two CanonicalFact instances.
    """

    @classmethod
    def extract_features(cls, fact_a: CanonicalFact, fact_b: CanonicalFact) -> PairwiseFeatureVector:
        # 1. Entity Similarity (String level Jaro-Winkler + Token Sort)
        ent_a = fact_a.subject.canonical_name.lower()
        ent_b = fact_b.subject.canonical_name.lower()
        jaro_sim = distance.JaroWinkler.similarity(ent_a, ent_b)
        token_sim = fuzz.token_sort_ratio(ent_a, ent_b) / 100.0
        entity_sim = (jaro_sim + token_sim) / 2.0

        # 2. Entity Embedding Cosine (Heuristic proxy when offline, or semantic score)
        # Check alias sets
        aliases_a = set([a.lower() for a in fact_a.subject.aliases] + [ent_a])
        aliases_b = set([b.lower() for b in fact_b.subject.aliases] + [ent_b])
        if aliases_a.intersection(aliases_b):
            entity_emb_sim = 1.0
        elif ent_a in ent_b or ent_b in ent_a:
            entity_emb_sim = 0.85
        else:
            entity_emb_sim = entity_sim

        # 3. Metric Similarity (Levenshtein + token ratio)
        met_a = fact_a.predicate.name.lower()
        met_b = fact_b.predicate.name.lower()
        metric_sim = fuzz.token_set_ratio(met_a, met_b) / 100.0

        # 4. Metric Definition Cosine (Proxy / text similarity of standard definitions)
        def_a = (fact_a.predicate.standard_definition or met_a).lower()
        def_b = (fact_b.predicate.standard_definition or met_b).lower()
        def_sim = fuzz.token_set_ratio(def_a, def_b) / 100.0

        # 5. Numeric Relative Difference: |v1 - v2| / max(|v1|, |v2|)
        val_a = fact_a.value.normalized_value
        val_b = fact_b.value.normalized_value
        denom = max(abs(val_a), abs(val_b), 1e-6)
        num_rel_diff = abs(val_a - val_b) / denom

        # 6. Numeric Log Ratio: log10(val_a / val_b) to immediately catch 10x or 100x unit/scaling discrepancies
        if val_a > 0 and val_b > 0:
            num_log_ratio = abs(math.log10(val_a / val_b))
        else:
            num_log_ratio = 0.0

        # 7. Unit Compatibility
        # 1.0 = identical unit, 0.5 = convertible (e.g. crore to lakh), 0.0 = incompatible (e.g. % vs crore)
        if fact_a.value.unit == fact_b.value.unit:
            unit_compat = 1.0
        elif cls._are_convertible_units(fact_a.value.unit, fact_b.value.unit):
            unit_compat = 0.5
        else:
            unit_compat = 0.0

        # 8. Temporal Period Overlap (IoU of start/end or exact period token match)
        period_a = fact_a.temporal.reference_period.upper().replace(" ", "")
        period_b = fact_b.temporal.reference_period.upper().replace(" ", "")
        if period_a == period_b:
            temp_iou = 1.0
        elif period_a in period_b or period_b in period_a:
            temp_iou = 0.7
        else:
            temp_iou = 0.0

        # 9. Temporal Vintage Delta (Normalized day difference between publications)
        vintage_delta = 0.0
        if fact_a.temporal.publication_time and fact_b.temporal.publication_time:
            # If different vintages
            if fact_a.temporal.data_vintage != fact_b.temporal.data_vintage:
                vintage_delta = 1.0
        elif fact_a.temporal.data_vintage != fact_b.temporal.data_vintage:
            vintage_delta = 0.8

        # 10. Forecast Status Match
        # 1.0 if both actual or both projection, 0.0 if one actual and one projection
        obs_a = fact_a.temporal.observation_type
        obs_b = fact_b.temporal.observation_type
        if obs_a == obs_b:
            forecast_match = 1.0
        elif (obs_a == ObservationType.ACTUAL and obs_b == ObservationType.PROJECTION) or \
             (obs_b == ObservationType.ACTUAL and obs_a == ObservationType.PROJECTION):
            forecast_match = 0.0
        else:
            forecast_match = 0.5

        # 11. Scope Overlap Score
        # Consolidated vs Standalone vs National
        scope_a = fact_a.scope_accounting.upper()
        scope_b = fact_b.scope_accounting.upper()
        if scope_a == scope_b:
            scope_score = 1.0
        elif (scope_a == "CONSOLIDATED" and scope_b == "STANDALONE") or \
             (scope_b == "CONSOLIDATED" and scope_a == "STANDALONE"):
            scope_score = 0.2
        else:
            scope_score = 0.5

        # 12. Source Independence Score
        # 0.0 if doc A cites doc B, 1.0 if independent publishers
        doc_a = fact_a.provenance.document_id
        doc_b = fact_b.provenance.document_id
        if doc_a == doc_b:
            source_indep = 0.0
        elif doc_b in fact_a.citations or doc_a in fact_b.citations:
            source_indep = 0.1
        else:
            source_indep = 1.0

        return PairwiseFeatureVector(
            entity_similarity=round(entity_sim, 4),
            entity_embedding_cosine=round(entity_emb_sim, 4),
            metric_similarity=round(metric_sim, 4),
            metric_definition_cosine=round(def_sim, 4),
            numeric_relative_diff=round(num_rel_diff, 4),
            numeric_log_ratio=round(num_log_ratio, 4),
            unit_compatibility=round(unit_compat, 4),
            temporal_period_overlap_iou=round(temp_iou, 4),
            temporal_vintage_delta_days=round(vintage_delta, 4),
            forecast_status_match=round(forecast_match, 4),
            scope_overlap_score=round(scope_score, 4),
            source_independence_score=round(source_indep, 4)
        )

    @staticmethod
    def _are_convertible_units(u1: UnitType, u2: UnitType) -> bool:
        currency_units = {
            UnitType.CURRENCY_INR_CRORE,
            UnitType.CURRENCY_INR_LAKH,
            UnitType.CURRENCY_USD_MILLION,
            UnitType.CURRENCY_USD_BILLION
        }
        return (u1 in currency_units and u2 in currency_units)
