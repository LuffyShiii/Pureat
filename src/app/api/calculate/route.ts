import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculatePurineRange } from "@/lib/calc/purine";
import { evaluateRecommendation } from "@/lib/recommendation/engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      food_id,
      weight_min_g,
      weight_max_g,
      daily_purine_min_mg = 0,
      daily_purine_max_mg = 0,
    } = body;

    if (!food_id || typeof weight_min_g !== "number" || typeof weight_max_g !== "number") {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const food = await prisma.food.findUnique({
      where: { id: food_id },
    });

    if (!food) {
      return NextResponse.json(
        { error: "食物不存在" },
        { status: 404 }
      );
    }

    const weightRange = { min: weight_min_g, max: weight_max_g };
    const purineRange = calculatePurineRange(
      food.purine_min_mg_per_100g,
      food.purine_max_mg_per_100g,
      weightRange
    );

    const recommendation = await evaluateRecommendation({
      food: {
        id: food.id,
        category: food.category,
        subcategory: food.subcategory,
        state: food.state,
        purine_min_mg_per_100g: food.purine_min_mg_per_100g,
        purine_max_mg_per_100g: food.purine_max_mg_per_100g,
      },
      portion: {
        purine_min_mg: purineRange.min,
        purine_max_mg: purineRange.max,
      },
      daily: {
        purine_min_mg: daily_purine_min_mg,
        purine_max_mg: daily_purine_max_mg,
      },
    });

    return NextResponse.json({
      food_id: food.id,
      canonical_name: food.canonical_name,
      state: food.state,
      weight_range: weightRange,
      purine_range: purineRange,
      level: recommendation.level,
      recommendation: recommendation.recommendation,
    });
  } catch (error) {
    console.error("Calculate error:", error);
    return NextResponse.json(
      { error: "计算失败" },
      { status: 500 }
    );
  }
}
