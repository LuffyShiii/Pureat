/**
 * Fallback Nutrition5k-style reference data.
 *
 * These values are hand-curated typical Western portion sizes. They are kept as
 * a safety net so the runtime can still provide weight anchors if the generated
 * reference from the real Nutrition5k dataset is missing or invalid.
 */

import { WeightReference } from "./reference";

export const FALLBACK_NUTRITION5K_REFERENCES: Record<string, WeightReference> = {
  poultry: {
    category: "poultry",
    small_g: 120,
    medium_g: 170,
    large_g: 230,
    samples: [120, 150, 170, 190, 230],
  },
  beef: {
    category: "beef",
    small_g: 150,
    medium_g: 220,
    large_g: 300,
    samples: [150, 180, 220, 260, 300],
  },
  pork: {
    category: "pork",
    small_g: 130,
    medium_g: 190,
    large_g: 260,
    samples: [130, 160, 190, 220, 260],
  },
  fish: {
    category: "fish",
    small_g: 120,
    medium_g: 170,
    large_g: 230,
    samples: [120, 140, 170, 200, 230],
  },
  seafood: {
    category: "seafood",
    small_g: 100,
    medium_g: 140,
    large_g: 200,
    samples: [100, 120, 140, 170, 200],
  },
  rice: {
    category: "rice",
    small_g: 150,
    medium_g: 230,
    large_g: 350,
    samples: [150, 190, 230, 280, 350],
  },
  pasta: {
    category: "pasta",
    small_g: 180,
    medium_g: 280,
    large_g: 400,
    samples: [180, 230, 280, 340, 400],
  },
  potato: {
    category: "potato",
    small_g: 120,
    medium_g: 190,
    large_g: 280,
    samples: [120, 150, 190, 230, 280],
  },
  bread: {
    category: "bread",
    small_g: 60,
    medium_g: 90,
    large_g: 130,
    samples: [60, 75, 90, 110, 130],
  },
  salad: {
    category: "salad",
    small_g: 100,
    medium_g: 180,
    large_g: 280,
    samples: [100, 140, 180, 230, 280],
  },
  vegetable: {
    category: "vegetable",
    small_g: 80,
    medium_g: 130,
    large_g: 200,
    samples: [80, 100, 130, 160, 200],
  },
  fruit: {
    category: "fruit",
    small_g: 80,
    medium_g: 120,
    large_g: 180,
    samples: [80, 100, 120, 150, 180],
  },
  dessert: {
    category: "dessert",
    small_g: 80,
    medium_g: 140,
    large_g: 220,
    samples: [80, 110, 140, 180, 220],
  },
  beverage: {
    category: "beverage",
    small_g: 240,
    medium_g: 350,
    large_g: 500,
    samples: [240, 300, 350, 420, 500],
  },
  egg: {
    category: "egg",
    small_g: 50,
    medium_g: 100,
    large_g: 180,
    samples: [50, 70, 100, 140, 180],
  },
  soup: {
    category: "soup",
    small_g: 200,
    medium_g: 350,
    large_g: 500,
    samples: [200, 280, 350, 420, 500],
  },
  mixed_dish: {
    category: "mixed_dish",
    small_g: 250,
    medium_g: 400,
    large_g: 600,
    samples: [250, 320, 400, 500, 600],
  },
};

export const FALLBACK_FOOD_NAME_TO_CATEGORY: Record<string, string> = {
  // poultry
  "chicken breast": "poultry",
  "chicken wing": "poultry",
  "chicken": "poultry",
  "turkey": "poultry",
  "duck": "poultry",
  "chicken nuggets": "poultry",
  // beef
  "steak": "beef",
  "beef": "beef",
  "roast beef": "beef",
  "beef patty": "beef",
  "hamburger": "beef",
  "ground beef": "beef",
  // pork
  "pork chop": "pork",
  "pork": "pork",
  "bacon": "pork",
  "ham": "pork",
  "sausage": "pork",
  // fish
  "salmon": "fish",
  "cod fish": "fish",
  "cod": "fish",
  "tuna": "fish",
  "fish": "fish",
  // seafood
  "shrimp": "seafood",
  "prawn": "seafood",
  "scallop": "seafood",
  "crab": "seafood",
  "lobster": "seafood",
  // rice
  "rice": "rice",
  "fried rice": "rice",
  "white rice": "rice",
  "risotto": "rice",
  // pasta
  "pasta": "pasta",
  "spaghetti": "pasta",
  "noodles": "pasta",
  "macaroni and cheese": "pasta",
  // potato
  "fries": "potato",
  "french fries": "potato",
  "baked potato": "potato",
  "mashed potato": "potato",
  "potato": "potato",
  // bread
  "bread": "bread",
  "toast": "bread",
  "bun": "bread",
  "bagel": "bread",
  "croissant": "bread",
  // salad
  "salad": "salad",
  "green salad": "salad",
  "caesar salad": "salad",
  // vegetable
  "broccoli": "vegetable",
  "carrot": "vegetable",
  "green beans": "vegetable",
  "vegetable": "vegetable",
  "spinach": "vegetable",
  "mushroom": "vegetable",
  // fruit
  "apple": "fruit",
  "banana": "fruit",
  "berry": "fruit",
  "strawberry": "fruit",
  "fruit": "fruit",
  // dessert
  "cake": "dessert",
  "ice cream": "dessert",
  "cookie": "dessert",
  "chocolate": "dessert",
  "dessert": "dessert",
  // beverage
  "soda": "beverage",
  "soft drink": "beverage",
  "juice": "beverage",
  "milk": "beverage",
  "coffee": "beverage",
  "tea": "beverage",
  "drink": "beverage",
  // egg
  "egg": "egg",
  "omelette": "egg",
  // soup
  "soup": "soup",
  "stew": "soup",
  "curry": "soup",
  // mixed_dish
  "pizza": "mixed_dish",
  "burger": "mixed_dish",
  "sandwich": "mixed_dish",
  "taco": "mixed_dish",
  "burrito": "mixed_dish",
  "hotdog": "mixed_dish",
};
