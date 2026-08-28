export interface WeightRange {
  min: number;
  max: number;
}

export interface PurineRange {
  min: number;
  max: number;
}

export type ConfidenceLevel = "high" | "medium" | "low";

export type FoodState = "raw" | "cooked" | "dried" | "processed";

export interface RecognizedItem {
  name: string;
  state?: FoodState;
  estimated_weight_g: WeightRange;
  confidence_level: ConfidenceLevel;
}

export interface NormalizedFood {
  food_id: string;
  canonical_name: string;
  state: FoodState;
  matched_alias?: string;
  confidence: ConfidenceLevel;
}

export interface AnalysisItem extends RecognizedItem {
  food_id: string;
  canonical_name: string;
  purine_range: PurineRange;
  level: "green" | "yellow" | "red" | "unknown";
  recommendation: string;
  confirmed?: boolean;
}

export interface FoodLog {
  id: string;
  food_id: string;
  food_name: string;
  weight_min_g: number;
  weight_max_g: number;
  purine_min_mg: number;
  purine_max_mg: number;
  thumbnail?: string;
  source: "photo" | "search" | "manual";
  date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface DailySummary {
  date: string;
  purine_min_mg: number;
  purine_max_mg: number;
  count: number;
}
