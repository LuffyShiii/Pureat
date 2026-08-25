import { NextRequest, NextResponse } from "next/server";
import { normalizeFoodName } from "@/lib/food/normalizer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "缺少 name 参数" },
        { status: 400 }
      );
    }

    const result = await normalizeFoodName(name);

    if (!result) {
      return NextResponse.json(
        { error: "未找到匹配的食物" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Normalize error:", error);
    return NextResponse.json(
      { error: "标准化失败" },
      { status: 500 }
    );
  }
}
