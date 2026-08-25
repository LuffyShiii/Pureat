import type { PurineRange, WeightRange } from "@/types";

export function calculatePurineRange(
  purineMinPer100g: number,
  purineMaxPer100g: number,
  weightRange: WeightRange
): PurineRange {
  return {
    min: Math.round((purineMinPer100g * weightRange.min) / 100),
    max: Math.round((purineMaxPer100g * weightRange.max) / 100),
  };
}

export function sumPurineRanges(ranges: PurineRange[]): PurineRange {
  return ranges.reduce(
    (acc, range) => ({
      min: acc.min + range.min,
      max: acc.max + range.max,
    }),
    { min: 0, max: 0 }
  );
}

export function formatPurineRange(range: PurineRange): string {
  return `约 ${range.min}～${range.max}mg`;
}

export function formatWeightRange(range: WeightRange): string {
  return `约 ${range.min}～${range.max}g`;
}
