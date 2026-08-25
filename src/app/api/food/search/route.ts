import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    if (!query.trim()) {
      return NextResponse.json({ items: [] });
    }

    // Search aliases and return associated foods
    const aliasMatches = await prisma.foodAlias.findMany({
      where: {
        alias: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: { food: true },
      take: limit,
      orderBy: { priority: "desc" },
    });

    // Also search canonical names
    const foodMatches = await prisma.food.findMany({
      where: {
        canonical_name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: limit,
    });

    // Combine and dedupe by food id
    const foodMap = new Map();

    for (const match of aliasMatches) {
      if (!foodMap.has(match.food.id)) {
        foodMap.set(match.food.id, {
          food_id: match.food.id,
          canonical_name: match.food.canonical_name,
          category: match.food.category,
          subcategory: match.food.subcategory,
          state: match.food.state,
          matched_alias: match.alias,
        });
      }
    }

    for (const food of foodMatches) {
      if (!foodMap.has(food.id)) {
        foodMap.set(food.id, {
          food_id: food.id,
          canonical_name: food.canonical_name,
          category: food.category,
          subcategory: food.subcategory,
          state: food.state,
        });
      }
    }

    return NextResponse.json({ items: Array.from(foodMap.values()) });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "搜索失败" },
      { status: 500 }
    );
  }
}
