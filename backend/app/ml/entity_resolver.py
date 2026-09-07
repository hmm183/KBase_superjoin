from typing import Dict, List, Tuple, Optional
from rapidfuzz import fuzz, distance

class EntityResolver:
    """
    Hybrid Entity Resolution and Canonicalization engine.
    Combines string edit distance, known alias dictionaries,
    and relationship linking (ALIAS_OF, SUBSIDIARY_OF).
    """

    KNOWN_CANONICAL_ENTITIES = {
        "ent_delhivery": {
            "canonical_name": "Delhivery Limited",
            "aliases": ["delhivery", "delhivery ltd", "delhivery limited", "dlhv", "delhivery supply chain"],
            "subsidiaries": ["Spoton Logistics", "Delhivery Robotics", "Transition Robotics"],
            "type": "ORGANIZATION"
        },
        "ent_rbi": {
            "canonical_name": "Reserve Bank of India",
            "aliases": ["rbi", "reserve bank of india", "central bank of india", "monetary authority of india"],
            "subsidiaries": ["Deposit Insurance and Credit Guarantee Corporation (DICGC)", "BRBNMPL"],
            "type": "REGULATOR"
        },
        "ent_imf": {
            "canonical_name": "International Monetary Fund",
            "aliases": ["imf", "international monetary fund", "imf staff"],
            "subsidiaries": [],
            "type": "INTERNATIONAL_ORGANIZATION"
        },
        "ent_india": {
            "canonical_name": "India",
            "aliases": ["republic of india", "indian economy", "goi", "government of india", "mospi"],
            "subsidiaries": [],
            "type": "GEOGRAPHY"
        }
    }

    @classmethod
    def resolve_entity(cls, query_name: str) -> Tuple[str, str, float, str]:
        """
        Resolves a raw entity mention to (canonical_name, entity_id, match_confidence, relation_type)
        """
        clean_q = query_name.strip().lower()
        
        # 1. Exact alias match
        for ent_id, data in cls.KNOWN_CANONICAL_ENTITIES.items():
            if clean_q == data["canonical_name"].lower() or clean_q in data["aliases"]:
                return (data["canonical_name"], ent_id, 1.0, "ALIAS_OF")
            
            for sub in data["subsidiaries"]:
                if clean_q == sub.lower():
                    return (data["canonical_name"], ent_id, 0.95, "SUBSIDIARY_OF")

        # 2. Fuzzy similarity match
        best_match = None
        best_score = 0.0
        best_ent_id = None

        for ent_id, data in cls.KNOWN_CANONICAL_ENTITIES.items():
            # Check canonical name
            score = fuzz.token_sort_ratio(clean_q, data["canonical_name"].lower()) / 100.0
            if score > best_score:
                best_score = score
                best_match = data["canonical_name"]
                best_ent_id = ent_id

            # Check aliases
            for alias in data["aliases"]:
                a_score = fuzz.token_sort_ratio(clean_q, alias) / 100.0
                if a_score > best_score:
                    best_score = a_score
                    best_match = data["canonical_name"]
                    best_ent_id = ent_id

        if best_score >= 0.75:
            return (best_match, best_ent_id, round(best_score, 3), "ALIAS_OF")

        # Fallback to creating a new canonical entity representation
        gen_id = f"ent_{clean_q.replace(' ', '_')[:16]}"
        return (query_name.title(), gen_id, 0.6, "DISTINCT_ENTITY")

    @classmethod
    def get_relationship_between_entities(cls, ent_a: str, ent_b: str) -> str:
        """
        Determines the organizational link between two entity strings.
        """
        can_a, id_a, conf_a, _ = cls.resolve_entity(ent_a)
        can_b, id_b, conf_b, _ = cls.resolve_entity(ent_b)

        if id_a == id_b:
            return "SAME_ENTITY"

        data_a = cls.KNOWN_CANONICAL_ENTITIES.get(id_a)
        if data_a:
            for sub in data_a["subsidiaries"]:
                if fuzz.token_sort_ratio(ent_b.lower(), sub.lower()) >= 85:
                    return "SUBSIDIARY_OF"

        data_b = cls.KNOWN_CANONICAL_ENTITIES.get(id_b)
        if data_b:
            for sub in data_b["subsidiaries"]:
                if fuzz.token_sort_ratio(ent_a.lower(), sub.lower()) >= 85:
                    return "PARENT_OF"

        return "INDEPENDENT_ENTITIES"
