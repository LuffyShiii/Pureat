import { prisma } from "@/lib/db/prisma";
import type { RecommendationRule } from "@/generated/prisma/client";
import { generateMealAdvice, rankItemsByPurine } from "./meal-advice";
export { generateMealAdvice, rankItemsByPurine };

export interface RecommendationContext {
  food: {
    id: string;
    category: string;
    subcategory: string | null;
    state: string;
    purine_min_mg_per_100g: number;
    purine_max_mg_per_100g: number;
  };
  portion: {
    purine_min_mg: number;
    purine_max_mg: number;
  };
  daily: {
    purine_min_mg: number;
    purine_max_mg: number;
  };
}

interface Condition {
  purine_max_mg_per_100g?: { gte?: number; lt?: number };
  purine_max_mg?: { gte?: number; lt?: number };
  daily_purine_max_mg?: { gte?: number; lt?: number };
  category?: string[];
  subcategory?: string[];
}

function evaluateCondition(
  condition: Condition,
  ctx: RecommendationContext
): boolean {
  if (condition.category?.length) {
    if (!condition.category.includes(ctx.food.category)) return false;
  }

  if (condition.subcategory?.length) {
    if (!ctx.food.subcategory) return false;
    if (!condition.subcategory.includes(ctx.food.subcategory)) return false;
  }

  if (condition.purine_max_mg_per_100g) {
    const val = ctx.food.purine_max_mg_per_100g;
    if (
      condition.purine_max_mg_per_100g.gte !== undefined &&
      val < condition.purine_max_mg_per_100g.gte
    ) {
      return false;
    }
    if (
      condition.purine_max_mg_per_100g.lt !== undefined &&
      val >= condition.purine_max_mg_per_100g.lt
    ) {
      return false;
    }
  }

  if (condition.purine_max_mg) {
    const val = ctx.portion.purine_max_mg;
    if (
      condition.purine_max_mg.gte !== undefined &&
      val < condition.purine_max_mg.gte
    ) {
      return false;
    }
    if (
      condition.purine_max_mg.lt !== undefined &&
      val >= condition.purine_max_mg.lt
    ) {
      return false;
    }
  }

  if (condition.daily_purine_max_mg) {
    const val = ctx.daily.purine_max_mg;
    if (
      condition.daily_purine_max_mg.gte !== undefined &&
      val < condition.daily_purine_max_mg.gte
    ) {
      return false;
    }
    if (
      condition.daily_purine_max_mg.lt !== undefined &&
      val >= condition.daily_purine_max_mg.lt
    ) {
      return false;
    }
  }

  return true;
}

export async function evaluateRecommendation(
  ctx: RecommendationContext
): Promise<{ level: "green" | "yellow" | "red"; recommendation: string }> {
  const rules = await prisma.recommendationRule.findMany({
    where: { active: true },
    orderBy: [{ priority: "desc" }, { id: "asc" }],
  });

  for (const rule of rules) {
    const condition = rule.condition as Condition;
    if (evaluateCondition(condition, ctx)) {
      return {
        level: rule.level as "green" | "yellow" | "red",
        recommendation: rule.recommendation,
      };
    }
  }

  return {
    level: "green",
    recommendation: "可以吃，适量即可。",
  };
}
