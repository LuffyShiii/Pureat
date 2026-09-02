import OpenAI from "openai";
import type { RecognizedItem } from "@/types";
import {
  formatReferenceForPrompt,
  getCategoryByFoodName,
  getWeightReference,
} from "@/lib/nutrition5k/fake-reference";

export interface VisionAdapter {
  recognize(
    imageBase64: string,
    mimeType: string,
    options?: {
      references?: string[];
      targetItem?: string;
    }
  ): Promise<{
    items: RecognizedItem[];
    error?: string;
  }>;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({ apiKey });
}

function buildSystemPrompt(references?: string[]): string {
  let prompt = `你是一名食物识别助手。用户上传了一张食物照片。请判断照片中是否有食物，并识别出主要食物。

对每种食物输出：
- name: 食物名称（尽量用日常中文或英文，如"grilled chicken breast"）
- state: 推断状态 raw/cooked/dried/processed，不确定则为 cooked
- estimated_weight_g: { min, max }，基于视觉估算的合理重量范围（克）。照片无法精确称重，给出一个合理范围即可，不要给精确单值。
- confidence_level: high / medium / low

重要约束：
- 禁止输出嘌呤含量、卡路里、医学建议或诊断。
- 禁止编造数字。
- 如果照片没有明显食物，返回空 items 并设置 error_code 为 "no_food"。
- 如果照片过于模糊，返回空 items 并设置 error_code 为 "blurry"。
- 如果不确定是什么食物，返回 confidence_level 为 low。
- 如果一盘中有多个独立食物，请分别列出每种食物。`;

  if (references && references.length > 0) {
    prompt += `\n\n在估算重量时，请参考以下 Nutrition5k 数据集中同类食物的实际重量数据作为锚点：\n\n${references.join(
      "\n\n"
    )}\n\n请结合图片和上述参考数据，给出一个合理的重量范围。优先输出范围，不要输出精确单值。`;
  }

  return prompt;
}

const schema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          state: {
            type: "string",
            enum: ["raw", "cooked", "dried", "processed"],
          },
          estimated_weight_g: {
            type: "object",
            properties: {
              min: { type: "number" },
              max: { type: "number" },
            },
            required: ["min", "max"],
            additionalProperties: false,
          },
          confidence_level: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
        },
        required: ["name", "state", "estimated_weight_g", "confidence_level"],
        additionalProperties: false,
      },
    },
    error_code: {
      type: ["string", "null"],
      enum: ["no_food", "blurry", null],
    },
  },
  required: ["items", "error_code"],
  additionalProperties: false,
} as const;

export class OpenAIVisionAdapter implements VisionAdapter {
  async recognize(
    imageBase64: string,
    mimeType: string,
    options: { references?: string[]; targetItem?: string } = {}
  ): Promise<{ items: RecognizedItem[]; error?: string }> {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(options.references) },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "food_recognition",
          strict: true,
          schema,
        },
      },
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { items: [], error: "AI 没有返回识别结果" };
    }

    const parsed = JSON.parse(content) as {
      items: RecognizedItem[];
      error_code: "no_food" | "blurry" | null;
    };

    if (parsed.error_code === "no_food") {
      return { items: [], error: "这张照片里好像没有明显的食物。" };
    }

    if (parsed.error_code === "blurry") {
      return { items: [], error: "照片有点模糊，我暂时无法可靠判断食物。" };
    }

    let items = parsed.items || [];

    // If we are refining a specific item, only return that item
    if (options.targetItem) {
      const target = items.find(
        (item) =>
          item.name.toLowerCase().includes(options.targetItem!.toLowerCase()) ||
          options.targetItem!.toLowerCase().includes(item.name.toLowerCase())
      );
      if (target) {
        items = [target];
      }
    }

    return { items };
  }
}

export class MockVisionAdapter implements VisionAdapter {
  async recognize(): Promise<{ items: RecognizedItem[]; error?: string }> {
    return {
      items: [
        {
          name: "红烧牛肉",
          state: "cooked",
          estimated_weight_g: { min: 100, max: 120 },
          confidence_level: "high",
        },
        {
          name: "米饭",
          state: "cooked",
          estimated_weight_g: { min: 150, max: 180 },
          confidence_level: "high",
        },
      ],
    };
  }
}

export const visionAdapter: VisionAdapter =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-")
    ? new OpenAIVisionAdapter()
    : new MockVisionAdapter();

/**
 * Build reference prompts for a list of recognized items.
 * Each item gets its own Nutrition5k reference text (if we have one).
 */
export function buildItemReferences(items: RecognizedItem[]): string[] {
  const refs: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const category = getCategoryByFoodName(item.name);
    if (!category) continue;

    const ref = getWeightReference(category);
    if (!ref) continue;

    const key = `${category}:${item.name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    refs.push(`For "${item.name}" (${category}):\n${formatReferenceForPrompt(ref)}`);
  }

  return refs;
}
