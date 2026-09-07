import random
import copy
from typing import List, Dict, Tuple
from backend.app.models.fact import (
    CanonicalFact, FactSubject, FactPredicate, FactValue,
    TemporalScope, FactProvenance, UnitType, ObservationType
)
from backend.app.models.contradiction import ContradictionClass
from backend.app.models.ml_features import TrainingInstance, PairwiseFeatureVector
from backend.app.ml.feature_extractor import FeatureExtractor

class SyntheticGenerator:
    """
    Generates controlled synthetic fact pairs for weak supervision.
    Permutes phrasing, unit scaling, fiscal periods, forecast status,
    scope definitions, and value discrepancies.
    """

    # Real-world base facts sampled from Delhivery and India Macroeconomy
    BASE_SEEDS = [
        {
            "entity": "Delhivery Limited",
            "aliases": ["Delhivery", "Delhivery Ltd", "DLHV"],
            "metric": "Adjusted EBITDA",
            "val": 126.6,
            "unit": UnitType.CURRENCY_INR_CRORE,
            "period": "FY2023-24",
            "scope": "CONSOLIDATED",
            "obs_type": ObservationType.ACTUAL,
            "doc": "delhivery_ar_fy24",
            "page": 44,
            "cell": "Row 5, Col 3"
        },
        {
            "entity": "Delhivery Limited",
            "aliases": ["Delhivery"],
            "metric": "Revenue from Operations",
            "val": 8142.0,
            "unit": UnitType.CURRENCY_INR_CRORE,
            "period": "FY2023-24",
            "scope": "CONSOLIDATED",
            "obs_type": ObservationType.ACTUAL,
            "doc": "delhivery_ar_fy24",
            "page": 112,
            "cell": "Row 2, Col 2"
        },
        {
            "entity": "India",
            "aliases": ["Republic of India", "Indian Economy", "GoI"],
            "metric": "Real GDP Growth",
            "val": 6.5,
            "unit": UnitType.PERCENTAGE,
            "period": "FY2024-25",
            "scope": "NATIONAL",
            "obs_type": ObservationType.ACTUAL,
            "doc": "india_economic_survey_2025",
            "page": 48,
            "cell": "Table 1.1, Row 3"
        },
        {
            "entity": "Reserve Bank of India",
            "aliases": ["RBI", "Central Bank of India"],
            "metric": "Headline CPI Inflation",
            "val": 5.4,
            "unit": UnitType.PERCENTAGE,
            "period": "FY2023-24",
            "scope": "NATIONAL",
            "obs_type": ObservationType.ACTUAL,
            "doc": "rbi_annual_report_2025",
            "page": 32,
            "cell": "Box II.1"
        },
        {
            "entity": "International Monetary Fund",
            "aliases": ["IMF"],
            "metric": "Real GDP Growth",
            "val": 7.0,
            "unit": UnitType.PERCENTAGE,
            "period": "FY2024-25",
            "scope": "NATIONAL",
            "obs_type": ObservationType.PROJECTION,
            "doc": "imf_article_iv_2025",
            "page": 12,
            "cell": "Table 2"
        },
    ]

    @classmethod
    def create_fact_from_seed(cls, seed: Dict, fact_id: str) -> CanonicalFact:
        fp = CanonicalFact.generate_fingerprint(
            seed["entity"], seed["metric"], seed["period"], seed["scope"], seed["obs_type"].value
        )
        return CanonicalFact(
            fact_id=fact_id,
            fingerprint=fp,
            subject=FactSubject(
                entity_id=f"ent_{seed['entity'].lower().replace(' ', '_')}",
                canonical_name=seed["entity"],
                aliases=seed.get("aliases", [])
            ),
            predicate=FactPredicate(
                metric_id=f"met_{seed['metric'].lower().replace(' ', '_')}",
                name=seed["metric"],
                standard_definition=f"Standard measurement of {seed['metric']}"
            ),
            value=FactValue(
                raw_text=f"{seed['val']} {seed['unit'].value}",
                normalized_value=float(seed["val"]),
                unit=seed["unit"]
            ),
            temporal=TemporalScope(
                reference_period=seed["period"],
                observation_type=seed["obs_type"],
                data_vintage="2024-Q4"
            ),
            scope_accounting=seed["scope"],
            provenance=FactProvenance(
                document_id=seed["doc"],
                document_title=seed["doc"].replace("_", " ").title(),
                document_hash="hash_placeholder",
                page_number=seed["page"],
                table_cell=seed.get("cell"),
                raw_snippet=f"{seed['metric']} was reported as {seed['val']}"
            )
        )

    @classmethod
    def generate_pair(
        cls,
        seed: Dict,
        target_class: ContradictionClass,
        pair_idx: int
    ) -> Tuple[CanonicalFact, CanonicalFact, ContradictionClass]:
        """
        Generates a pair of facts exhibiting the target relationship with high realism.
        """
        fact_a = cls.create_fact_from_seed(seed, f"fact_{pair_idx}_A")
        fact_b = copy.deepcopy(fact_a)
        fact_b.fact_id = f"fact_{pair_idx}_B"
        fact_b.provenance.document_id = f"{seed['doc']}_source2"

        if target_class == ContradictionClass.CORROBORATES:
            # Different linguistic phrasing, same value and unit
            phrasings = [
                f"{fact_a.predicate.name} stood at {fact_a.value.normalized_value}",
                f"Reported {fact_a.predicate.name} of {fact_a.value.normalized_value}",
                f"{fact_a.subject.canonical_name} achieved {fact_a.value.normalized_value} in {fact_a.predicate.name}"
            ]
            fact_b.provenance.raw_snippet = random.choice(phrasings)
            defs = [
                fact_a.predicate.standard_definition,
                f"Standard reported measurement of {fact_a.predicate.name}",
                f"Consolidated audited figure for {fact_a.predicate.name}",
                f"Management metric measuring {fact_a.predicate.name}"
            ]
            fact_b.predicate.standard_definition = random.choice(defs)
            # Differing vintages (e.g. Earnings Presentation vs Annual Report) that confirm same figure
            if random.random() < 0.6:
                fact_a.temporal.data_vintage = "2024-Q4-Pres"
                fact_b.temporal.data_vintage = "2024-AR"

        elif target_class == ContradictionClass.UNIT_MISMATCH:
            # e.g. 126.6 Crore vs 1,266 Million or 10x multiplier parsing error
            if fact_a.value.unit == UnitType.CURRENCY_INR_CRORE:
                fact_b.value.normalized_value = fact_a.value.normalized_value * 10.0 # 1 Cr = 10 Million
                fact_b.value.unit = UnitType.CURRENCY_USD_MILLION
                fact_b.value.raw_text = f"{fact_b.value.normalized_value} Million"
            else:
                fact_b.value.normalized_value = fact_a.value.normalized_value * 10.0
                fact_b.value.raw_text = f"{fact_b.value.normalized_value}%"

        elif target_class == ContradictionClass.TIME_MISMATCH:
            # Compare FY24 with FY25 or H1 with full year
            fact_b.temporal.reference_period = "FY2024-25" if "2023-24" in fact_a.temporal.reference_period else "FY2023-24"
            fact_b.value.normalized_value = round(fact_a.value.normalized_value * 1.15, 2)

        elif target_class == ContradictionClass.FORECAST_ACTUAL_MISMATCH:
            # Projection vs Actual
            fact_a.temporal.observation_type = ObservationType.PROJECTION
            fact_b.temporal.observation_type = ObservationType.ACTUAL
            fact_b.value.normalized_value = round(fact_a.value.normalized_value + random.choice([-0.5, 0.5, -0.8]), 2)

        elif target_class == ContradictionClass.SCOPE_MISMATCH:
            # Consolidated vs Standalone or sub-index vs composite
            fact_a.scope_accounting = "CONSOLIDATED"
            fact_b.scope_accounting = "STANDALONE"
            fact_b.value.normalized_value = round(fact_a.value.normalized_value * 0.82, 2)

        elif target_class == ContradictionClass.REVISION:
            # Later vintage revision requires BOTH differing vintage AND changed value!
            fact_a.temporal.data_vintage = "2024-Q1-Prelim"
            fact_b.temporal.data_vintage = "2024-Q4-Revised"
            fact_b.value.normalized_value = round(fact_a.value.normalized_value * random.choice([1.04, 0.96, 1.08, 0.92]), 2)

        elif target_class == ContradictionClass.DEFINITION_MISMATCH:
            # Statutory EBITDA vs Adjusted EBITDA vs Service EBITDA
            prefixes = ["Statutory", "Service", "Operational", "Reported", "GAAP"]
            p = random.choice(prefixes)
            fact_b.predicate.name = f"{p} {fact_a.predicate.name}"
            fact_b.predicate.standard_definition = f"Differs from operating metric by including/excluding exceptional items for {p} reporting"
            fact_b.value.normalized_value = round(fact_a.value.normalized_value * random.choice([0.65, 0.45, 1.35]), 2)

        elif target_class == ContradictionClass.GENUINE_CONTRADICTION:
            # Same entity, metric, period, unit, scope - but irreconcilable divergence (e.g. 4.0% vs 2.8%, or 126.6 vs 1266)
            fact_b.predicate.name = fact_a.predicate.name
            fact_b.predicate.standard_definition = fact_a.predicate.standard_definition
            mult = random.choice([0.7, 0.4, 1.4, 2.5, 10.0])
            fact_b.value.normalized_value = round(fact_a.value.normalized_value * mult, 2)
            fact_b.value.raw_text = f"{fact_b.value.normalized_value} {fact_b.value.unit.value}"
            if random.random() < 0.5:
                fact_a.temporal.data_vintage = "Source1-2024"
                fact_b.temporal.data_vintage = "Source2-2024"

        elif target_class == ContradictionClass.LIKELY_CONTRADICTION:
            # Strong divergence (+35%) without clear scope or definition difference
            fact_b.value.normalized_value = round(fact_a.value.normalized_value * 1.35, 2)

        elif target_class == ContradictionClass.PARTIAL_CONTRADICTION:
            # Slight numeric range gap
            fact_b.value.normalized_value = round(fact_a.value.normalized_value * 1.08, 2)

        elif target_class == ContradictionClass.CONTEXTUAL_DIFFERENCE:
            # Sub-segment vs total or urban vs rural
            fact_b.provenance.raw_snippet = f"Express parcel business component was {round(fact_a.value.normalized_value * 0.65, 2)}"
            fact_b.value.normalized_value = round(fact_a.value.normalized_value * 0.65, 2)

        elif target_class == ContradictionClass.UNRESOLVED:
            # Ambiguous incomplete data
            fact_b.temporal.reference_period = "Unknown Period"
            fact_b.value.normalized_value = fact_a.value.normalized_value * 1.2

        return fact_a, fact_b, target_class

    @classmethod
    def generate_synthetic_dataset(cls, samples_per_class: int = 150) -> List[TrainingInstance]:
        """
        Generates a balanced dataset of training instances across all 12 contradiction classes.
        """
        instances: List[TrainingInstance] = []
        all_classes = list(ContradictionClass)
        pair_counter = 0

        for c in all_classes:
            for i in range(samples_per_class):
                seed = random.choice(cls.BASE_SEEDS)
                fact_a, fact_b, label = cls.generate_pair(seed, c, pair_counter)
                features = FeatureExtractor.extract_features(fact_a, fact_b)
                
                inst = TrainingInstance(
                    instance_id=f"syn_inst_{pair_counter}",
                    fact_a_id=fact_a.fact_id,
                    fact_b_id=fact_b.fact_id,
                    features=features,
                    label=label,
                    source_type="synthetic",
                    metadata={"target_class": label.value}
                )
                instances.append(inst)
                pair_counter += 1

        random.shuffle(instances)
        return instances
