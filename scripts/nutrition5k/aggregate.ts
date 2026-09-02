/**
 * Aggregate Nutrition5k ingredient gram values into category-level weight references.
 */

import { Category } from "./category-map";
import {
  WeightReference,
} from "../../src/lib/nutrition5k/reference";

const MIN_SAMPLES = 10;
const MIN_GRAM_VALUE = 5;
const MIN_INGREDIENT_GRAMS = 20;

function roundTo5(value: number): number {
  return Math.max(MIN_GRAM_VALUE, Math.round(value / 5) * 5);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function iqrFilter(values: number[]): number[] {
  if (values.length < 4) return values;

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  return values.filter((v) => v >= lower && v <= upper);
}

export interface AggregationOptions {
  enableIqrFilter?: boolean;
}

export function aggregateCategory(
  category: Category,
  grams: number[],
  options: AggregationOptions = {}
): WeightReference | null {
  if (grams.length === 0) return null;

  let valid = grams.filter(
    (g) => g > 0 && g <= 5000 && g >= MIN_INGREDIENT_GRAMS
  );
  if (valid.length === 0) return null;

  if (options.enableIqrFilter) {
    const before = valid.length;
    valid = iqrFilter(valid);
    if (before !== valid.length) {
      console.log(
        `  ${category}: removed ${before - valid.length} IQR outlier(s)`
      );
    }
  }

  if (valid.length < MIN_SAMPLES) {
    console.warn(
      `  ${category}: only ${valid.length} sample(s), will fall back to hand-curated values`
    );
    return null;
  }

  const sorted = [...valid].sort((a, b) => a - b);

  return {
    category,
    small_g: roundTo5(quantile(sorted, 0.25)),
    medium_g: roundTo5(quantile(sorted, 0.5)),
    large_g: roundTo5(quantile(sorted, 0.75)),
    samples: [0.1, 0.3, 0.5, 0.7, 0.9].map((q) =>
      roundTo5(quantile(sorted, q))
    ),
  };
}

export function aggregateAllCategories(
  categoryGrams: Record<Category, number[]>,
  options: AggregationOptions = {}
): Record<Category, WeightReference | null> {
  const result: Partial<Record<Category, WeightReference | null>> = {};

  for (const category of Object.keys(categoryGrams) as Category[]) {
    result[category] = aggregateCategory(category, categoryGrams[category], options);
  }

  return result as Record<Category, WeightReference | null>;
}
