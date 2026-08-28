import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/db/prisma";
import { visionAdapter } from "@/lib/ai/vision";
import { normalizeFoodName } from "@/lib/food/normalizer";
import type { RecognizedItem } from "@/types";
import { Prisma } from "@/generated/prisma/client";

const DAILY_RECOGNITION_LIMIT = 20;

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

async function checkQuota(deviceId: string): Promise<{ allowed: boolean; count: number }> {
  const today = getToday();

  const usage = await prisma.deviceUsage.upsert({
    where: {
      device_id_date: {
        device_id: deviceId,
        date: today,
      },
    },
    update: {},
    create: {
      device_id: deviceId,
      date: today,
      recognition_count: 0,
    },
  });

  return {
    allowed: usage.recognition_count < DAILY_RECOGNITION_LIMIT,
    count: usage.recognition_count,
  };
}

async function incrementQuota(deviceId: string): Promise<void> {
  const today = getToday();
  await prisma.deviceUsage.update({
    where: {
      device_id_date: {
        device_id: deviceId,
        date: today,
      },
    },
    data: {
      recognition_count: { increment: 1 },
    },
  });
}

async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .withMetadata({ exif: {} })
    .toBuffer();
}

async function generateThumbnail(buffer: Buffer): Promise<string> {
  const thumb = await sharp(buffer)
    .resize({ width: 300, height: 300, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
  return `data:image/jpeg;base64,${thumb.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const deviceId = formData.get("device_id") as string | null;

    if (!deviceId) {
      return NextResponse.json(
        { error: "缺少 device_id" },
        { status: 400 }
      );
    }

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json(
        { error: "缺少图片" },
        { status: 400 }
      );
    }

    const quota = await checkQuota(deviceId);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "今日 AI 识别次数已用完，请明天继续使用。" },
        { status: 429 }
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const [compressed, thumbnail] = await Promise.all([
      compressImage(buffer),
      generateThumbnail(buffer),
    ]);
    const base64 = compressed.toString("base64");

    const { items: recognizedItems, error } = await visionAdapter.recognize(
      base64,
      "image/jpeg"
    );

    if (error) {
      return NextResponse.json({ error, items: [] });
    }

    // Normalize each recognized item
    const normalizedItems: (RecognizedItem & {
      food_id?: string;
      canonical_name?: string;
      matched?: boolean;
    })[] = [];

    for (const item of recognizedItems) {
      const normalized = await normalizeFoodName(item.name);
      if (normalized) {
        normalizedItems.push({
          ...item,
          food_id: normalized.food_id,
          canonical_name: normalized.canonical_name,
          matched: true,
        });
      } else {
        normalizedItems.push({
          ...item,
          matched: false,
        });
      }
    }

    // Log recognition result
    await prisma.recognitionResult.create({
      data: {
        device_id: deviceId,
        raw_ai_response: recognizedItems as unknown as Prisma.InputJsonValue,
        recognized_items: normalizedItems as unknown as Prisma.InputJsonValue,
        confidence_level:
          normalizedItems.length > 0
            ? normalizedItems[0].confidence_level
            : "low",
      },
    });

    await incrementQuota(deviceId);

    return NextResponse.json({
      items: normalizedItems,
      thumbnail,
      remaining_today: DAILY_RECOGNITION_LIMIT - quota.count - 1,
      mock: !process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith("sk-"),
    });
  } catch (error) {
    console.error("Recognize error:", error);
    return NextResponse.json(
      { error: "识别失败" },
      { status: 500 }
    );
  }
}
