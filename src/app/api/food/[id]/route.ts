import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const food = await prisma.food.findUnique({
      where: { id },
      include: { aliases: true },
    });

    if (!food) {
      return NextResponse.json(
        { error: "食物不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      food_id: food.id,
      canonical_name: food.canonical_name,
      category: food.category,
      subcategory: food.subcategory,
      state: food.state,
      purine_range: {
        min: food.purine_min_mg_per_100g,
        max: food.purine_max_mg_per_100g,
      },
      source: food.source,
      source_url: food.source_url,
      data_confidence: food.data_confidence,
      notes: food.notes,
      aliases: food.aliases.map((a) => a.alias),
    });
  } catch (error) {
    console.error("Get food error:", error);
    return NextResponse.json(
      { error: "获取食物信息失败" },
      { status: 500 }
    );
  }
}
