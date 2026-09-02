/**
 * Nutrition5k-based weight reference for portion-size estimation.
 *
 * This module loads a lightweight generated reference derived from the real
 * Nutrition5k dataset metadata. If the generated file is missing or invalid,
 * it falls back to hand-curated values from fallback-reference.ts.
 */

import generated from "./generated-reference.json";
import {
  FALLBACK_FOOD_NAME_TO_CATEGORY,
  FALLBACK_NUTRITION5K_REFERENCES,
} from "./fallback-reference";

export interface WeightReference {
  category: string;
  small_g: number;
  medium_g: number;
  large_g: number;
  samples: number[];
}

interface GeneratedReferenceFile {
  version: string;
  generated_at: string;
  source: string;
  references: Record<string, WeightReference>;
}

const EXPECTED_CATEGORIES = Object.keys(FALLBACK_NUTRITION5K_REFERENCES);

export function isValidReferenceFile(
  value: unknown
): value is GeneratedReferenceFile {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<GeneratedReferenceFile>;
  if (!candidate.references || typeof candidate.references !== "object") {
    return false;
  }
  return EXPECTED_CATEGORIES.every((category) => {
    const ref = candidate.references![category];
    return (
      ref &&
      typeof ref.small_g === "number" &&
      typeof ref.medium_g === "number" &&
      typeof ref.large_g === "number" &&
      Array.isArray(ref.samples) &&
      ref.samples.length > 0 &&
      ref.samples.every((n) => typeof n === "number")
    );
  });
}

const activeReferences: Record<string, WeightReference> = isValidReferenceFile(
  generated
)
  ? (generated as GeneratedReferenceFile).references
  : FALLBACK_NUTRITION5K_REFERENCES;

const activeFoodNameToCategory: Record<string, string> =
  FALLBACK_FOOD_NAME_TO_CATEGORY;

export function getCategoryByFoodName(name: string): string | undefined {
  const lower = name.toLowerCase();

  if (activeFoodNameToCategory[lower]) {
    return activeFoodNameToCategory[lower];
  }

  const sortedKeys = Object.keys(activeFoodNameToCategory).sort(
    (a, b) => b.length - a.length
  );
  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      return activeFoodNameToCategory[key];
    }
  }

  return undefined;
}

export function getWeightReference(
  category: string
): WeightReference | undefined {
  return activeReferences[category];
}

export function formatReferenceForPrompt(ref: WeightReference): string {
  return [
    `Reference weights for similar ${ref.category} items from Nutrition5k:`,
    `- Small portion: ~${ref.small_g}g`,
    `- Medium portion: ~${ref.medium_g}g`,
    `- Large portion: ~${ref.large_g}g`,
    `- Real sample weights: ${ref.samples.join("g, ")}g`,
    "Use these values as anchors when estimating the weight range. Output a reasonable range, not a precise single value.",
  ].join("\n");
}
