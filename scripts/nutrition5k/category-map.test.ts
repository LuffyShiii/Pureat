import { describe, expect, it } from "vitest";
import { CATEGORIES, mapIngredientToCategory } from "./category-map";

describe("nutrition5k category map", () => {
  it("maps proteins correctly", () => {
    expect(mapIngredientToCategory("chicken")).toBe("poultry");
    expect(mapIngredientToCategory("chicken breast")).toBe("poultry");
    expect(mapIngredientToCategory("ground beef")).toBe("beef");
    expect(mapIngredientToCategory("salmon")).toBe("fish");
    expect(mapIngredientToCategory("shrimp")).toBe("seafood");
    expect(mapIngredientToCategory("scrambled eggs")).toBe("egg");
  });

  it("maps starches and grains correctly", () => {
    expect(mapIngredientToCategory("white rice")).toBe("rice");
    expect(mapIngredientToCategory("brown rice")).toBe("rice");
    expect(mapIngredientToCategory("quinoa")).toBe("rice");
    expect(mapIngredientToCategory("spaghetti")).toBe("pasta");
    expect(mapIngredientToCategory("potato")).toBe("potato");
    expect(mapIngredientToCategory("multigrain bread")).toBe("bread");
    expect(mapIngredientToCategory("croutons")).toBe("bread");
  });

  it("maps produce correctly", () => {
    expect(mapIngredientToCategory("broccoli")).toBe("vegetable");
    expect(mapIngredientToCategory("mixed greens")).toBe("salad");
    expect(mapIngredientToCategory("apple")).toBe("fruit");
    expect(mapIngredientToCategory("blueberries")).toBe("fruit");
  });

  it("excludes condiments and oils", () => {
    expect(mapIngredientToCategory("olive oil")).toBe("excluded");
    expect(mapIngredientToCategory("soy sauce")).toBe("excluded");
    expect(mapIngredientToCategory("salt")).toBe("excluded");
    expect(mapIngredientToCategory("cheese")).toBe("excluded");
  });

  it("maps prepared foods to mixed_dish", () => {
    expect(mapIngredientToCategory("hummus")).toBe("mixed_dish");
    expect(mapIngredientToCategory("tofu")).toBe("mixed_dish");
    expect(mapIngredientToCategory("granola")).toBe("mixed_dish");
  });

  it("returns undefined for truly unknown ingredients", () => {
    expect(mapIngredientToCategory("xyz_unknown")).toBeUndefined();
  });

  it("normalizes casing and extra whitespace", () => {
    expect(mapIngredientToCategory("  White Rice  ")).toBe("rice");
    expect(mapIngredientToCategory("CHICKEN")).toBe("poultry");
  });

  it("covers all declared categories", () => {
    const mapped = CATEGORIES.map((category) => ({
      category,
      ingredient:
        category === "poultry"
          ? "chicken"
          : category === "beef"
          ? "beef"
          : category === "pork"
          ? "pork"
          : category === "fish"
          ? "salmon"
          : category === "seafood"
          ? "shrimp"
          : category === "rice"
          ? "rice"
          : category === "pasta"
          ? "pasta"
          : category === "potato"
          ? "potato"
          : category === "bread"
          ? "bread"
          : category === "salad"
          ? "salad"
          : category === "vegetable"
          ? "broccoli"
          : category === "fruit"
          ? "apple"
          : category === "dessert"
          ? "cake"
          : category === "beverage"
          ? "juice"
          : category === "egg"
          ? "egg"
          : category === "soup"
          ? "soup"
          : "pizza",
    }));

    for (const { category, ingredient } of mapped) {
      expect(mapIngredientToCategory(ingredient)).toBe(category);
    }
  });
});
