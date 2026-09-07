from typing import List
from backend.app.models.fact import (
    CanonicalFact, FactSubject, FactPredicate, FactValue,
    TemporalScope, FactProvenance, UnitType, ObservationType
)
from backend.app.models.contradiction import ContradictionClass
from backend.app.models.ml_features import TrainingInstance
from backend.app.ml.feature_extractor import FeatureExtractor

class GoldCurator:
    """
    Curates hand-verified gold fact pairs directly from the Delhivery
    and India Macroeconomy starter datasets.
    """

    @classmethod
    def get_gold_facts(cls) -> List[CanonicalFact]:
        facts = [
            # Fact 1: Delhivery AR FY24 Adjusted EBITDA (Consolidated)
            CanonicalFact(
                fact_id="gold_dlhv_adj_ebitda_ar_fy24",
                fingerprint=CanonicalFact.generate_fingerprint("Delhivery Limited", "Adjusted EBITDA", "FY2023-24", "CONSOLIDATED", "ACTUAL"),
                subject=FactSubject(entity_id="ent_delhivery", canonical_name="Delhivery Limited", aliases=["Delhivery", "DLHV"]),
                predicate=FactPredicate(metric_id="met_adj_ebitda", name="Adjusted EBITDA", standard_definition="Profit before exceptional items, finance costs, depreciation and amortization"),
                value=FactValue(raw_text="₹126.6 Cr", normalized_value=126.6, unit=UnitType.CURRENCY_INR_CRORE, scale_multiplier=1e7, currency="INR"),
                temporal=TemporalScope(reference_period="FY2023-24", period_start="2023-04-01", period_end="2024-03-31", publication_time="2024-08-01T00:00:00Z", data_vintage="FY24-AR", observation_type=ObservationType.ACTUAL),
                scope_accounting="CONSOLIDATED",
                provenance=FactProvenance(
                    document_id="02-delhivery-annual-report-fy24-excerpt.pdf",
                    document_title="Delhivery Annual Report FY 2023-24",
                    document_hash="hash_dlhv_ar24",
                    page_number=36,
                    table_cell="Financial Highlights Table, Row 3",
                    raw_snippet="Adjusted EBITDA for FY24 stood at positive ₹126.6 Cr against a loss in FY23."
                ),
                citations=[]
            ),
            # Fact 2: Delhivery Q4 Presentation Adjusted EBITDA
            CanonicalFact(
                fact_id="gold_dlhv_adj_ebitda_pres_fy24",
                fingerprint=CanonicalFact.generate_fingerprint("Delhivery Limited", "Adjusted EBITDA", "FY2023-24", "CONSOLIDATED", "ACTUAL"),
                subject=FactSubject(entity_id="ent_delhivery", canonical_name="Delhivery Limited", aliases=["Delhivery"]),
                predicate=FactPredicate(metric_id="met_adj_ebitda", name="Adjusted EBITDA", standard_definition="Adjusted EBITDA after corporate allocation"),
                value=FactValue(raw_text="₹126.6 Cr", normalized_value=126.6, unit=UnitType.CURRENCY_INR_CRORE, scale_multiplier=1e7, currency="INR"),
                temporal=TemporalScope(reference_period="FY2023-24", period_start="2023-04-01", period_end="2024-03-31", publication_time="2024-05-17T00:00:00Z", data_vintage="FY24-Q4-Pres", observation_type=ObservationType.ACTUAL),
                scope_accounting="CONSOLIDATED",
                provenance=FactProvenance(
                    document_id="03-delhivery-q4-fy24-earnings-presentation.pdf",
                    document_title="Delhivery Q4 FY24 Earnings Presentation",
                    document_hash="hash_dlhv_pres24",
                    page_number=6,
                    table_cell="Slide 6, Key Metrics Table",
                    raw_snippet="Full year FY24 Adjusted EBITDA was ₹126.6 Cr."
                ),
                citations=[]
            ),
            # Fact 3: Synthetic / Parser-disagreement fact with 10x OCR shift
            CanonicalFact(
                fact_id="gold_dlhv_ebitda_parser_conflict",
                fingerprint=CanonicalFact.generate_fingerprint("Delhivery Limited", "Adjusted EBITDA", "FY2023-24", "CONSOLIDATED", "ACTUAL"),
                subject=FactSubject(entity_id="ent_delhivery", canonical_name="Delhivery Limited", aliases=["Delhivery"]),
                predicate=FactPredicate(metric_id="met_adj_ebitda", name="Adjusted EBITDA", standard_definition="Adjusted EBITDA"),
                value=FactValue(raw_text="₹1,266 Cr", normalized_value=1266.0, unit=UnitType.CURRENCY_INR_CRORE, scale_multiplier=1e7, currency="INR"),
                temporal=TemporalScope(reference_period="FY2023-24", period_start="2023-04-01", period_end="2024-03-31", publication_time="2024-08-01T00:00:00Z", data_vintage="FY24-AR", observation_type=ObservationType.ACTUAL),
                scope_accounting="CONSOLIDATED",
                provenance=FactProvenance(
                    document_id="02-delhivery-annual-report-fy24-excerpt.pdf",
                    document_title="Delhivery Annual Report FY 2023-24",
                    document_hash="hash_dlhv_ar24",
                    page_number=36,
                    table_cell="Financial Highlights Table, Row 3",
                    raw_snippet="Adjusted EBITDA for FY24: ₹1,266 Cr (Parser B decimal omission)",
                    parser_engine="ocr_fallback_raw"
                ),
                citations=[]
            ),
            # Fact 4: Delhivery Statutory EBITDA (Includes share-based compensation)
            CanonicalFact(
                fact_id="gold_dlhv_statutory_ebitda_fy24",
                fingerprint=CanonicalFact.generate_fingerprint("Delhivery Limited", "Statutory EBITDA", "FY2023-24", "CONSOLIDATED", "ACTUAL"),
                subject=FactSubject(entity_id="ent_delhivery", canonical_name="Delhivery Limited", aliases=["Delhivery"]),
                predicate=FactPredicate(metric_id="met_statutory_ebitda", name="Statutory EBITDA", standard_definition="GAAP statutory EBITDA including non-cash ESOP charges"),
                value=FactValue(raw_text="-₹68.2 Cr", normalized_value=-68.2, unit=UnitType.CURRENCY_INR_CRORE, scale_multiplier=1e7, currency="INR"),
                temporal=TemporalScope(reference_period="FY2023-24", period_start="2023-04-01", period_end="2024-03-31", publication_time="2024-08-01T00:00:00Z", data_vintage="FY24-AR", observation_type=ObservationType.ACTUAL),
                scope_accounting="CONSOLIDATED",
                provenance=FactProvenance(
                    document_id="02-delhivery-annual-report-fy24-excerpt.pdf",
                    document_title="Delhivery Annual Report FY 2023-24",
                    document_hash="hash_dlhv_ar24",
                    page_number=86,
                    table_cell="Consolidated Statement of Profit and Loss",
                    raw_snippet="Profit before tax and finance cost includes ESOP expense of ₹194.8 Cr."
                ),
                citations=[]
            ),
            # Fact 5: Economic Survey FY25 India Real GDP Growth (Official Actual / Advance Estimate)
            CanonicalFact(
                fact_id="gold_india_gdp_survey_fy25",
                fingerprint=CanonicalFact.generate_fingerprint("India", "Real GDP Growth", "FY2024-25", "NATIONAL", "ACTUAL"),
                subject=FactSubject(entity_id="ent_india", canonical_name="India", aliases=["Republic of India", "Indian Economy"]),
                predicate=FactPredicate(metric_id="met_real_gdp_growth", name="Real GDP Growth", standard_definition="Year-on-year real constant price gross domestic product growth rate"),
                value=FactValue(raw_text="6.5%", normalized_value=6.5, unit=UnitType.PERCENTAGE, scale_multiplier=1.0),
                temporal=TemporalScope(reference_period="FY2024-25", period_start="2024-04-01", period_end="2025-03-31", publication_time="2025-01-31T00:00:00Z", data_vintage="EcoSurvey-2024-25", observation_type=ObservationType.ACTUAL),
                scope_accounting="NATIONAL",
                provenance=FactProvenance(
                    document_id="01-india-economic-survey-2024-25-excerpt.pdf",
                    document_title="India Economic Survey 2024-25",
                    document_hash="hash_survey_25",
                    page_number=46,
                    table_cell="Table 1.1",
                    raw_snippet="Real GDP is projected to grow between 6.5 to 7.0 percent in 2024-25 with conservative baseline at 6.5%."
                ),
                citations=[]
            ),
            # Fact 6: IMF Article IV FY25 India GDP Forecast
            CanonicalFact(
                fact_id="gold_india_gdp_imf_fy25",
                fingerprint=CanonicalFact.generate_fingerprint("India", "Real GDP Growth", "FY2024-25", "NATIONAL", "PROJECTION"),
                subject=FactSubject(entity_id="ent_india", canonical_name="India", aliases=["India", "GoI"]),
                predicate=FactPredicate(metric_id="met_real_gdp_growth", name="Real GDP Growth", standard_definition="IMF staff estimates for real GDP growth"),
                value=FactValue(raw_text="7.0%", normalized_value=7.0, unit=UnitType.PERCENTAGE, scale_multiplier=1.0),
                temporal=TemporalScope(reference_period="FY2024-25", period_start="2024-04-01", period_end="2025-03-31", publication_time="2024-11-25T00:00:00Z", data_vintage="IMF-WEO-2024", observation_type=ObservationType.PROJECTION),
                scope_accounting="NATIONAL",
                provenance=FactProvenance(
                    document_id="03-imf-india-2025-article-iv-excerpt.pdf",
                    document_title="IMF India 2025 Article IV Consultation",
                    document_hash="hash_imf_25",
                    page_number=14,
                    table_cell="Table 1",
                    raw_snippet="Staff projects growth at 7.0 percent in FY2024/25 supported by buoyant domestic demand."
                ),
                citations=["01-india-economic-survey-2024-25-excerpt.pdf"]
            ),
            # Fact 7: RBI Annual Report FY24 CPI Inflation
            CanonicalFact(
                fact_id="gold_rbi_cpi_fy24",
                fingerprint=CanonicalFact.generate_fingerprint("India", "Headline CPI Inflation", "FY2023-24", "NATIONAL", "ACTUAL"),
                subject=FactSubject(entity_id="ent_india", canonical_name="India", aliases=["Reserve Bank of India", "RBI"]),
                predicate=FactPredicate(metric_id="met_cpi_inflation", name="Headline CPI Inflation", standard_definition="Consumer Price Index Combined All-India inflation rate"),
                value=FactValue(raw_text="5.4%", normalized_value=5.4, unit=UnitType.PERCENTAGE, scale_multiplier=1.0),
                temporal=TemporalScope(reference_period="FY2023-24", period_start="2023-04-01", period_end="2024-03-31", publication_time="2024-05-30T00:00:00Z", data_vintage="RBI-AR-2023-24", observation_type=ObservationType.ACTUAL),
                scope_accounting="NATIONAL",
                provenance=FactProvenance(
                    document_id="02-rbi-annual-report-2024-25-excerpt.pdf",
                    document_title="Reserve Bank of India Annual Report 2024-25",
                    document_hash="hash_rbi_25",
                    page_number=35,
                    table_cell="Box II.1",
                    raw_snippet="Headline CPI inflation moderated to 5.4 per cent during 2023-24 from 6.7 per cent in 2022-23."
                ),
                citations=[]
            ),
            # Fact 8: Economic Survey FY24 CPI Inflation (Corroborating RBI)
            CanonicalFact(
                fact_id="gold_survey_cpi_fy24",
                fingerprint=CanonicalFact.generate_fingerprint("India", "Headline CPI Inflation", "FY2023-24", "NATIONAL", "ACTUAL"),
                subject=FactSubject(entity_id="ent_india", canonical_name="India", aliases=["Government of India", "MoSPI"]),
                predicate=FactPredicate(metric_id="met_cpi_inflation", name="Headline CPI Inflation", standard_definition="Consumer Price Index Combined All-India inflation rate"),
                value=FactValue(raw_text="5.4%", normalized_value=5.4, unit=UnitType.PERCENTAGE, scale_multiplier=1.0),
                temporal=TemporalScope(reference_period="FY2023-24", period_start="2023-04-01", period_end="2024-03-31", publication_time="2025-01-31T00:00:00Z", data_vintage="EcoSurvey-2024-25", observation_type=ObservationType.ACTUAL),
                scope_accounting="NATIONAL",
                provenance=FactProvenance(
                    document_id="01-india-economic-survey-2024-25-excerpt.pdf",
                    document_title="India Economic Survey 2024-25",
                    document_hash="hash_survey_25",
                    page_number=28,
                    table_cell="Section 2.2 / Headline CPI Inflation",
                    raw_snippet="CPI-Combined inflation stood at 5.4 percent in FY24."
                ),
                citations=["02-rbi-annual-report-2024-25-excerpt.pdf"]
            ),
            # Fact 9: RBI FY26 CPI Inflation Projection (4.0%)
            CanonicalFact(
                fact_id="gold_rbi_cpi_fy26_proj",
                fingerprint=CanonicalFact.generate_fingerprint("India", "Headline CPI Inflation", "FY2025-26", "NATIONAL", "PROJECTION"),
                subject=FactSubject(entity_id="ent_india", canonical_name="India", aliases=["RBI", "Reserve Bank of India"]),
                predicate=FactPredicate(metric_id="met_cpi_inflation", name="Headline CPI Inflation", standard_definition="All-India CPI Combined inflation projection"),
                value=FactValue(raw_text="4.0%", normalized_value=4.0, unit=UnitType.PERCENTAGE, scale_multiplier=1.0),
                temporal=TemporalScope(reference_period="FY2025-26", period_start="2025-04-01", period_end="2026-03-31", publication_time="2025-05-30T00:00:00Z", data_vintage="RBI-AR-2024-25", observation_type=ObservationType.PROJECTION),
                scope_accounting="NATIONAL",
                provenance=FactProvenance(
                    document_id="02-rbi-annual-report-2024-25-excerpt.pdf",
                    document_title="Reserve Bank of India Annual Report 2024-25",
                    document_hash="hash_rbi_25",
                    page_number=17,
                    table_cell="Paragraph I.48",
                    raw_snippet="Taking into account these factors, CPI inflation for 2025-26 is projected at 4.0 per cent, with risks evenly balanced."
                ),
                citations=[]
            ),
            # Fact 10: IMF FY26 CPI Inflation Projection (2.8%)
            CanonicalFact(
                fact_id="gold_imf_cpi_fy26_proj",
                fingerprint=CanonicalFact.generate_fingerprint("India", "Headline CPI Inflation", "FY2025-26", "NATIONAL", "PROJECTION"),
                subject=FactSubject(entity_id="ent_india", canonical_name="India", aliases=["IMF", "International Monetary Fund"]),
                predicate=FactPredicate(metric_id="met_cpi_inflation", name="Headline CPI Inflation", standard_definition="All-India CPI Combined inflation projection"),
                value=FactValue(raw_text="2.8%", normalized_value=2.8, unit=UnitType.PERCENTAGE, scale_multiplier=1.0),
                temporal=TemporalScope(reference_period="FY2025-26", period_start="2025-04-01", period_end="2026-03-31", publication_time="2025-11-25T00:00:00Z", data_vintage="IMF-ArticleIV-2025", observation_type=ObservationType.PROJECTION),
                scope_accounting="NATIONAL",
                provenance=FactProvenance(
                    document_id="03-imf-india-2025-article-iv-excerpt.pdf",
                    document_title="IMF India 2025 Article IV Consultation",
                    document_hash="hash_imf_25",
                    page_number=13,
                    table_cell="Paragraph 12",
                    raw_snippet="Headline inflation is expected to remain benign and average 2.8 percent in FY2025/26, below the 4-percent target but within the RBI’s tolerance band..."
                ),
                citations=[]
            ),
            # Fact 11: Delhivery FY23 Revenue from Customers
            CanonicalFact(
                fact_id="gold_dlhv_rev_fy23",
                fingerprint=CanonicalFact.generate_fingerprint("Delhivery Limited", "Revenue from Customers", "FY2022-23", "CONSOLIDATED", "ACTUAL"),
                subject=FactSubject(entity_id="ent_delhivery", canonical_name="Delhivery Limited", aliases=["Delhivery"]),
                predicate=FactPredicate(metric_id="met_rev_customers", name="Revenue from Customers", standard_definition="Revenue generated from express and freight services"),
                value=FactValue(raw_text="₹7,225 Cr", normalized_value=7225.0, unit=UnitType.CURRENCY_INR_CRORE, scale_multiplier=1e7, currency="INR"),
                temporal=TemporalScope(reference_period="FY2022-23", period_start="2022-04-01", period_end="2023-03-31", publication_time="2024-05-17T00:00:00Z", data_vintage="FY24-Q4-Pres", observation_type=ObservationType.ACTUAL),
                scope_accounting="CONSOLIDATED",
                provenance=FactProvenance(
                    document_id="03-delhivery-q4-fy24-earnings-presentation.pdf",
                    document_title="Delhivery Q4 FY24 Earnings Presentation",
                    document_hash="hash_dlhv_pres24",
                    page_number=14,
                    table_cell="Slide 14, Adjusted EBITDA Bridge Table",
                    raw_snippet="Revenue from customers FY23: 7,225 ₹ Cr."
                ),
                citations=[]
            ),
            # Fact 12: Delhivery FY24 Revenue from Customers
            CanonicalFact(
                fact_id="gold_dlhv_rev_fy24",
                fingerprint=CanonicalFact.generate_fingerprint("Delhivery Limited", "Revenue from Customers", "FY2023-24", "CONSOLIDATED", "ACTUAL"),
                subject=FactSubject(entity_id="ent_delhivery", canonical_name="Delhivery Limited", aliases=["Delhivery"]),
                predicate=FactPredicate(metric_id="met_rev_customers", name="Revenue from Customers", standard_definition="Revenue generated from express and freight services"),
                value=FactValue(raw_text="₹8,142 Cr", normalized_value=8142.0, unit=UnitType.CURRENCY_INR_CRORE, scale_multiplier=1e7, currency="INR"),
                temporal=TemporalScope(reference_period="FY2023-24", period_start="2023-04-01", period_end="2024-03-31", publication_time="2024-05-17T00:00:00Z", data_vintage="FY24-Q4-Pres", observation_type=ObservationType.ACTUAL),
                scope_accounting="CONSOLIDATED",
                provenance=FactProvenance(
                    document_id="03-delhivery-q4-fy24-earnings-presentation.pdf",
                    document_title="Delhivery Q4 FY24 Earnings Presentation",
                    document_hash="hash_dlhv_pres24",
                    page_number=14,
                    table_cell="Slide 14, Adjusted EBITDA Bridge Table",
                    raw_snippet="Revenue from customers FY24: 8,142 ₹ Cr."
                ),
                citations=[]
            ),
            # Fact 13: Economic Survey Food Inflation CFPI
            CanonicalFact(
                fact_id="gold_survey_food_cpi_fy25",
                fingerprint=CanonicalFact.generate_fingerprint("India", "Consumer Food Price Index Inflation", "FY2024-25", "NATIONAL", "ACTUAL"),
                subject=FactSubject(entity_id="ent_india", canonical_name="India", aliases=["MoSPI", "Government of India"]),
                predicate=FactPredicate(metric_id="met_cfpi_food", name="Food Inflation CFPI", standard_definition="Consumer Food Price Index rate of inflation"),
                value=FactValue(raw_text="8.4%", normalized_value=8.4, unit=UnitType.PERCENTAGE, scale_multiplier=1.0),
                temporal=TemporalScope(reference_period="FY2024-25", period_start="2024-04-01", period_end="2024-12-31", publication_time="2025-01-31T00:00:00Z", data_vintage="EcoSurvey-2024-25", observation_type=ObservationType.ACTUAL),
                scope_accounting="SUB_INDEX",
                provenance=FactProvenance(
                    document_id="01-india-economic-survey-2024-25-excerpt.pdf",
                    document_title="India Economic Survey 2024-25",
                    document_hash="hash_survey_25",
                    page_number=28,
                    table_cell="Paragraph 1.53",
                    raw_snippet="Food inflation, measured by the Consumer Food Price Index (CFPI), has increased from 7.5 per cent in FY24 to 8.4 per cent in FY25 (April-December)..."
                ),
                citations=[]
            )
        ]
        return facts

    @classmethod
    def get_gold_test_pairs(cls) -> List[TrainingInstance]:
        """
        Creates hand-verified test pairs with canonical ground-truth labels
        covering the primary evaluation categories.
        """
        facts = {f.fact_id: f for f in cls.get_gold_facts()}
        pairs_meta = [
            ("gold_dlhv_adj_ebitda_ar_fy24", "gold_dlhv_adj_ebitda_pres_fy24", ContradictionClass.CORROBORATES, "Same company, metric, FY24 period, both 126.6 Cr"),
            ("gold_rbi_cpi_fy24", "gold_survey_cpi_fy24", ContradictionClass.CORROBORATES, "RBI and Economic Survey both report 5.4% CPI inflation"),
            ("gold_rbi_cpi_fy26_proj", "gold_imf_cpi_fy26_proj", ContradictionClass.GENUINE_CONTRADICTION, "Same FY26 period, same headline CPI metric, authentic 120 bps forecast divergence (4.0% vs 2.8%)"),
            ("gold_dlhv_adj_ebitda_ar_fy24", "gold_dlhv_ebitda_parser_conflict", ContradictionClass.GENUINE_CONTRADICTION, "126.6 Cr vs 1266 Cr direct numerical clash (OCR error)"),
            ("gold_dlhv_adj_ebitda_ar_fy24", "gold_dlhv_statutory_ebitda_fy24", ContradictionClass.DEFINITION_MISMATCH, "Adjusted EBITDA (126.6 Cr) vs Statutory EBITDA (-68.2 Cr)"),
            ("gold_india_gdp_survey_fy25", "gold_india_gdp_imf_fy25", ContradictionClass.FORECAST_ACTUAL_MISMATCH, "IMF 7.0% projection vs Economic Survey 6.5% actual estimate"),
            ("gold_dlhv_rev_fy23", "gold_dlhv_rev_fy24", ContradictionClass.TIME_MISMATCH, "FY23 (7,225 Cr) vs FY24 (8,142 Cr) different fiscal year periods"),
            ("gold_survey_cpi_fy24", "gold_survey_food_cpi_fy25", ContradictionClass.SCOPE_MISMATCH, "General CPI basket vs Food sub-index component")
        ]

        test_instances = []
        for idx, (f_a_id, f_b_id, label, note) in enumerate(pairs_meta):
            f_a = facts[f_a_id]
            f_b = facts[f_b_id]
            feats = FeatureExtractor.extract_features(f_a, f_b)
            inst = TrainingInstance(
                instance_id=f"gold_test_pair_{idx}",
                fact_a_id=f_a_id,
                fact_b_id=f_b_id,
                features=feats,
                label=label,
                source_type="gold_human",
                metadata={"evaluator_note": note}
            )
            test_instances.append(inst)

        return test_instances
