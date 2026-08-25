import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      env: {
        database: "connected",
        openai: process.env.OPENAI_API_KEY?.startsWith("sk-") ? "configured" : "mock",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
