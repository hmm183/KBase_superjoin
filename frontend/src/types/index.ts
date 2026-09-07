export interface GalaxyNode {
  id: string;
  node_type: 'DOCUMENT' | 'ENTITY' | 'FACT' | 'METRIC' | 'EVIDENCE';
  label: string;
  secondary_label?: string;
  value?: number;
  unit?: string;
  color: string;
  size: number;
  period?: string;
  year?: number;
  vintage?: string;
  status: 'NORMAL' | 'CORROBORATED' | 'CONTRADICTION' | 'FORECAST' | 'REVISION' | 'DOCUMENT' | 'ENTITY';
  pulse_intensity: number;
  document_id?: string;
  page_number?: number;
  bounding_box?: number[];
  metadata?: any;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

export interface GalaxyLink {
  id: string;
  source: string | any;
  target: string | any;
  link_type: string;
  weight: number;
  color: string;
  is_tension_laser: boolean;
  delta_value?: string;
}

export interface EvidenceGalaxyGraph {
  nodes: GalaxyNode[];
  links: GalaxyLink[];
  available_years: number[];
  total_facts: number;
  corroboration_count: number;
  contradiction_count: number;
  unresolved_count: number;
}

export interface CanonicalFact {
  fact_id: string;
  fingerprint: string;
  subject: {
    entity_id: string;
    canonical_name: string;
    aliases: string[];
    entity_type: string;
  };
  predicate: {
    metric_id: string;
    name: string;
    category: string;
    standard_definition?: string;
  };
  value: {
    raw_text: string;
    normalized_value: number;
    unit: string;
    scale_multiplier: number;
    currency?: string;
  };
  temporal: {
    reference_period: string;
    period_start?: string;
    period_end?: string;
    publication_time?: string;
    data_vintage: string;
    observation_type: string;
  };
  scope_accounting: string;
  provenance: {
    document_id: string;
    document_title: string;
    document_hash: string;
    page_number: number;
    bounding_box?: number[];
    table_cell?: string;
    raw_snippet: string;
    parser_engine: string;
    parser_confidence: number;
  };
  confidence_score: number;
  independent_source_count: number;
}

export interface HypothesisCard {
  hypothesis_id: string;
  code: string;
  title: string;
  description: string;
  probability: number;
  is_primary: boolean;
  supporting_factors: string[];
  counter_factors: string[];
}

export interface WhatWouldChangeMyMind {
  criterion_id: string;
  condition_description: string;
  status: string;
  impact_direction: string;
}

export interface PairwiseRelation {
  relation_id: string;
  fact_a_id: string;
  fact_b_id: string;
  fact_a_summary: string;
  fact_b_summary: string;
  classification: string;
  confidence: number;
  feature_contributions: Record<string, number>;
  hypotheses: HypothesisCard[];
  what_would_change_my_mind: WhatWouldChangeMyMind[];
  ml_probabilities: Record<string, number>;
}

export interface ParserDisagreement {
  conflict_id: string;
  document_id: string;
  page_number: number;
  cell_or_region: string;
  parser_a_name: string;
  parser_a_value: string;
  parser_a_bbox?: number[];
  parser_b_name: string;
  parser_b_value: string;
  parser_b_bbox?: number[];
  disagreement_type: string;
  adjudicated_value?: string;
  adjudicated_by?: string;
  adjudication_confidence: number;
  adjudication_explanation?: string;
}

export interface ActiveLearningItem {
  queue_id: string;
  fact_a_id: string;
  fact_b_id: string;
  fact_a_label: string;
  fact_b_label: string;
  predicted_class: string;
  confidence: number;
  uncertainty_score: number;
  alternative_class?: string;
  status: string;
}

export interface EvaluationReport {
  timestamp: string;
  model_version: string;
  overall_accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  entity_resolution_f1: number;
  evidence_grounding_rate: number;
  hallucination_rate: number;
  per_class_f1: Record<string, number>;
  confusion_matrix: Record<string, Record<string, number>>;
  error_taxonomy: Record<string, { count: number; description: string; mitigation: string }>;
}
