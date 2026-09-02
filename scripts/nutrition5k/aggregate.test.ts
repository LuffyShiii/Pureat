import { describe, expect, it } from "vitest";
import { aggregateCategory, aggregateAllCategories } from "./aggregate";
import { Category } from "./category-map";

describe("nutrition5k aggregate", () => {
  it("computes percentiles for a known distribution", () => {
    const grams = Array.from({ length: 20 }, (_, i) => 10 + i * 10);
    const result = aggregateCategory("poultry", grams);

    // Values below MIN_INGREDIENT_GRAMS (20) are filtered, leaving
    // [20, 30, 40, ..., 200] (19 values).
    expect(result).not.toBeNull();
    expect(result!.small_g).toBe(65); // P25 = 65
    expect(result!.medium_g).toBe(110); // P50 = 110
    expect(result!.large_g).toBe(155); // P75 = 155
  });

  it("returns null when no valid samples", () => {
    expect(aggregateCategory("poultry", [])).toBeNull();
    expect(aggregateCategory("poultry", [0, -5, 6000])).toBeNull();
  });

  it("falls back to null when below minimum sample threshold", () => {
    const grams = [20, 30, 40, 50, 60, 70, 80, 90, 100];
    const result = aggregateCategory("poultry", grams);
    expect(result).toBeNull();
  });

  it("filters out values below minimum ingredient grams", () => {
    const grams = [
      5, 10, 15, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210,
    ];
    const result = aggregateCategory("poultry", grams);
    expect(result).not.toBeNull();
    expect(result!.small_g).toBeGreaterThanOrEqual(100);
  });

  it("ensures small_g is at least 5g", () => {
    const grams = Array.from({ length: 20 }, (_, i) => 20 + i);
    const result = aggregateCategory("vegetable", grams);
    expect(result).not.toBeNull();
    expect(result!.small_g).toBeGreaterThanOrEqual(5);
  });

  it("aggregates all categories", () => {
    const data: Record<Category, number[]> = {
      poultry: Array.from({ length: 20 }, (_, i) => 50 + i * 10),
      beef: Array.from({ length: 20 }, (_, i) => 60 + i * 10),
      pork: Array.from({ length: 20 }, (_, i) => 40 + i * 10),
      fish: Array.from({ length: 20 }, (_, i) => 55 + i * 10),
      seafood: Array.from({ length: 20 }, (_, i) => 30 + i * 5),
      rice: Array.from({ length: 20 }, (_, i) => 25 + i * 5),
      pasta: Array.from({ length: 20 }, (_, i) => 35 + i * 5),
      potato: Array.from({ length: 20 }, (_, i) => 45 + i * 5),
      bread: Array.from({ length: 20 }, (_, i) => 20 + i * 5),
      salad: Array.from({ length: 20 }, (_, i) => 20 + i * 5),
      vegetable: Array.from({ length: 20 }, (_, i) => 15 + i * 5),
      fruit: Array.from({ length: 20 }, (_, i) => 30 + i * 5),
      dessert: Array.from({ length: 20 }, (_, i) => 25 + i * 5),
      beverage: Array.from({ length: 20 }, (_, i) => 100 + i * 20),
      egg: Array.from({ length: 20 }, (_, i) => 50 + i * 10),
      soup: Array.from({ length: 20 }, (_, i) => 100 + i * 20),
      mixed_dish: Array.from({ length: 20 }, (_, i) => 60 + i * 10),
    };

    const result = aggregateAllCategories(data);
    for (const category of Object.keys(data) as Category[]) {
      expect(result[category]).not.toBeNull();
      expect(result[category]!.category).toBe(category);
    }
  });
});
