import { describe, it, expect } from "vitest";
import { calculatePurineRange, sumPurineRanges } from "./purine";

describe("calculatePurineRange", () => {
  it("calculates range correctly", () => {
    const result = calculatePurineRange(150, 170, { min: 100, max: 120 });
    expect(result).toEqual({ min: 150, max: 204 });
  });

  it("handles low values", () => {
    const result = calculatePurineRange(10, 20, { min: 50, max: 60 });
    expect(result).toEqual({ min: 5, max: 12 });
  });
});

describe("sumPurineRanges", () => {
  it("sums multiple ranges", () => {
    const result = sumPurineRanges([
      { min: 100, max: 120 },
      { min: 50, max: 80 },
    ]);
    expect(result).toEqual({ min: 150, max: 200 });
  });
});
