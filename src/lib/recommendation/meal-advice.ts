import type { PurineRange } from "@/types";

export interface MealAdviceItem {
  name: string;
  purine_range: PurineRange;
  level: string;
}

export function rankItemsByPurine<T extends { purine_range: { max: number } }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => b.purine_range.max - a.purine_range.max);
}

export function generateMealAdvice(items: MealAdviceItem[]): string {
  const ranked = rankItemsByPurine(items);
  const highItems = ranked.filter(
    (item) => item.level === "red" || item.level === "yellow"
  );

  if (highItems.length === 0) {
    return "这餐嘌呤整体较低，可以放心吃。";
  }

  const names = highItems.map((item) => item.name).join("、");
  return `本餐主要嘌呤来源是 ${names}。如果想控制本餐嘌呤摄入，建议优先减少 ${highItems[0].name}。`;
}
