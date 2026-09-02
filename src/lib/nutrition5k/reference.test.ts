import { describe, expect, it } from "vitest";
import {
  formatReferenceForPrompt,
  getCategoryByFoodName,
  getWeightReference,
  isValidReferenceFile,
} from "./reference";

const EXPECTED_CATEGORIES = [
  "poultry",
  "beef",
  "pork",
  "fish",
  "seafood",
  "rice",
  "pasta",
  "potato",
  "bread",
  "salad",
  "vegetable",
  "fruit",
  "dessert",
  "beverage",
  "egg",
  "soup",
  "mixed_dish",
];

describe("nutrition5k reference", () => {
  it("covers all expected categories", () => {
    for (const category of EXPECTED_CATEGORIES) {
      const ref = getWeightReference(category);
      expect(ref).toBeDefined();
      expect(ref!.category).toBe(category);
      expect(ref!.small_g).toBeGreaterThan(0);
      expect(ref!.medium_g).toBeGreaterThanOrEqual(ref!.small_g);
      expect(ref!.large_g).toBeGreaterThanOrEqual(ref!.medium_g);
      expect(ref!.samples.length).toBeGreaterThan(0);
    }
  });

  it("maps common food names to categories", () => {
    expect(getCategoryByFoodName("chicken breast")).toBe("poultry");
    expect(getCategoryByFoodName("grilled salmon")).toBe("fish");
    expect(getCategoryByFoodName("white rice")).toBe("rice");
    expect(getCategoryByFoodName("french fries")).toBe("potato");
    expect(getCategoryByFoodName("caesar salad")).toBe("salad");
    expect(getCategoryByFoodName("apple")).toBe("fruit");
    expect(getCategoryByFoodName("scrambled eggs")).toBe("egg");
    expect(getCategoryByFoodName("pizza")).toBe("mixed_dish");
  });

  it("prefers longer keyword matches", () => {
    // "chicken wing" should map to poultry, not mis-matched to another category.
    expect(getCategoryByFoodName("chicken wing")).toBe("poultry");
    // "fried rice" contains "rice" but the explicit longer mapping should win.
    expect(getCategoryByFoodName("fried rice")).toBe("rice");
  });

  it("returns undefined for unknown foods", () => {
    expect(getCategoryByFoodName("unknown_xyz")).toBeUndefined();
  });

  it("rejects invalid generated reference files", () => {
    expect(isValidReferenceFile(null)).toBe(false);
    expect(isValidReferenceFile({})).toBe(false);
    expect(isValidReferenceFile({ references: {} })).toBe(false);
    expect(
      isValidReferenceFile({
        references: {
          poultry: {
            category: "poultry",
            small_g: 0,
            medium_g: 0,
            large_g: 0,
            samples: [],
          },
        },
      })
    ).toBe(false);
  });

  it("formats reference prompt with all fields", () => {
    const ref = getWeightReference("poultry")!;
    const prompt = formatReferenceForPrompt(ref);
    expect(prompt).toContain(ref.category);
    expect(prompt).toContain(`${ref.small_g}g`);
    expect(prompt).toContain(`${ref.medium_g}g`);
    expect(prompt).toContain(`${ref.large_g}g`);
    for (const sample of ref.samples) {
      expect(prompt).toContain(`${sample}g`);
    }
  });
});
