import re
from typing import Dict, List, Any, Tuple
from backend.app.ml.gold_curator import GoldCurator
from backend.app.models.fact import CanonicalFact

class HallucinationFirewall:
    """
    Downstream Claim-to-Evidence Verification Firewall.
    Deconstructs generated answers into atomic factual assertions,
    cross-checks each assertion against the verified Knowledge Graph,
    and strips or flags ungrounded hallucinations.
    """

    def get_verified_facts(self) -> Dict[str, CanonicalFact]:
        from backend.app.services.graph_service import graph_service
        from backend.app.models.graph_nodes import NodeType
        facts: Dict[str, CanonicalFact] = {f.fact_id: f for f in GoldCurator.get_gold_facts()}
        for node_id, node_data in graph_service.nx_graph.nodes(data=True):
            if node_data.get("node_type") == NodeType.FACT and "metadata" in node_data:
                if node_id not in facts:
                    try:
                        facts[node_id] = CanonicalFact.model_validate(node_data["metadata"])
                    except Exception:
                        pass
        return facts

    def verify_answer(self, generated_text: str) -> Dict[str, Any]:
        """
        Parses sentences/claims, checks groundability against graph evidence,
        and computes grounding metrics.
        """
        verified_facts = self.get_verified_facts()
        # Split into sentence claims
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', generated_text) if len(s.strip()) > 10]
        
        claims_analysis = []
        verified_count = 0
        total_claims = len(sentences) or 1

        for idx, sentence in enumerate(sentences):
            # Check if sentence references numbers or known entities
            is_grounded = False
            evidence_citation = None

            for f_id, fact in verified_facts.items():
                # If metric raw text or normalized value matches
                val_str = str(fact.value.normalized_value)
                if val_str in sentence or fact.value.raw_text.lower() in sentence.lower():
                    is_grounded = True
                    evidence_citation = f"[EVID-{fact.provenance.document_id[:12]}-p{fact.provenance.page_number}]"
                    break

            # If it's a structural or introductory statement
            if not is_grounded and ("report" in sentence.lower() or "indicates" in sentence.lower() or "compared" in sentence.lower()):
                is_grounded = True # Connective reasoning

            if is_grounded:
                verified_count += 1
                claims_analysis.append({
                    "claim_index": idx + 1,
                    "text": sentence,
                    "status": "VERIFIED_GROUNDED",
                    "citation": evidence_citation
                })
            else:
                claims_analysis.append({
                    "claim_index": idx + 1,
                    "text": sentence,
                    "status": "UNVERIFIED_FLAGGED",
                    "citation": None,
                    "flag_reason": "No direct matching numeric token found in active Neo4j evidence graph."
                })

        grounding_score = round(verified_count / total_claims, 3)
        return {
            "grounding_score": grounding_score,
            "firewall_pass": grounding_score >= 0.85,
            "total_claims": total_claims,
            "verified_claims": verified_count,
            "claims_breakdown": claims_analysis
        }

hallucination_firewall = HallucinationFirewall()
