"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import type { AnalysisItem, RecognizedItem } from "@/types";
import {
  addFoodLog,
  getDailySummary,
  getDeviceId,
  saveThumbnail,
} from "@/lib/storage/indexeddb";
import { formatPurineRange, formatWeightRange } from "@/lib/calc/purine";
import { getPortionText } from "@/lib/food/portion-text";
import { generateMealAdvice } from "@/lib/recommendation/meal-advice";

interface FoodOption {
  food_id: string;
  canonical_name: string;
  category: string;
  subcategory: string | null;
  state: string;
}

const LEVEL_STYLES = {
  green: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "可以吃",
  },
  yellow: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "建议限量",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "尽量避免",
  },
  unknown: {
    bg: "bg-zinc-100",
    text: "text-zinc-600",
    label: "无数据",
  },
};

export default function AnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "photo";

  const [items, setItems] = useState<AnalysisItem[]>([]);
  const [daily, setDaily] = useState({ purine_min_mg: 0, purine_max_mg: 0 });
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodOption[]>([]);
  const [showSearch, setShowSearch] = useState(mode === "search");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedForLog, setSelectedForLog] = useState<Set<number>>(
    () => new Set()
  );
  const [logging, setLogging] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState<Set<number>>(
    () => new Set()
  );

  useEffect(() => {
    async function init() {
      const today = new Date().toISOString().split("T")[0];
      const summary = await getDailySummary(today);
      setDaily({
        purine_min_mg: summary.purine_min_mg,
        purine_max_mg: summary.purine_max_mg,
      });

      if (mode === "photo") {
        const stored = sessionStorage.getItem("pureat_analysis_items");
        const mockFlag = sessionStorage.getItem("pureat_analysis_mock");
        const storedThumbnail = sessionStorage.getItem("pureat_analysis_thumbnail");
        setIsMock(mockFlag === "true");
        setThumbnail(storedThumbnail || undefined);
        if (stored) {
          const recognized: (RecognizedItem & {
            food_id?: string;
            canonical_name?: string;
            matched?: boolean;
          })[] = JSON.parse(stored);
          await analyzeItems(recognized, summary.purine_min_mg, summary.purine_max_mg);
        } else {
          setShowSearch(true);
        }
      } else {
        setShowSearch(true);
      }

      setLoading(false);
    }

    init();
  }, [mode]);

  async function analyzeItems(
    recognized: (RecognizedItem & {
      food_id?: string;
      canonical_name?: string;
      matched?: boolean;
    })[],
    dailyMin: number,
    dailyMax: number
  ) {
    const analyzed: AnalysisItem[] = [];

    for (const item of recognized) {
      if (!item.food_id || !item.matched) {
        analyzed.push({
          ...item,
          food_id: item.food_id || "",
          canonical_name: item.canonical_name || item.name,
          state: item.state || "cooked",
          purine_range: { min: 0, max: 0 },
          level: "unknown",
          recommendation: "暂时没有找到这个食物的可靠嘌呤数据，请手动选择食物。",
        });
        continue;
      }

      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          food_id: item.food_id,
          weight_min_g: item.estimated_weight_g.min,
          weight_max_g: item.estimated_weight_g.max,
          daily_purine_min_mg: dailyMin,
          daily_purine_max_mg: dailyMax,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        analyzed.push({
          ...item,
          food_id: item.food_id,
          canonical_name: data.canonical_name,
          state: data.state,
          purine_range: data.purine_range,
          level: data.level,
          recommendation: data.recommendation,
        });
      } else {
        analyzed.push({
          ...item,
          food_id: item.food_id,
          canonical_name: item.canonical_name || item.name,
          state: item.state || "cooked",
          purine_range: { min: 0, max: 0 },
          level: "red",
          recommendation: "嘌呤数据查询失败。",
        });
      }
    }

    setItems(analyzed);
    setSelectedForLog(
      new Set(
        analyzed
          .map((item, i) => ({ item, i }))
          .filter(({ item }) => item.food_id && item.level !== "unknown")
          .map(({ i }) => i)
      )
    );
    setNeedsConfirmation(
      new Set(
        analyzed
          .map((item, i) => ({ item, i }))
          .filter(({ item }) => item.confidence_level === "low")
          .map(({ i }) => i)
      )
    );
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.items || []);
    }
  }

  function markConfirmed(index: number) {
    setNeedsConfirmation((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], confirmed: true };
      return next;
    });
  }

  function openFoodSearchForConfirmation(index: number) {
    const query = items[index]?.canonical_name || items[index]?.name || "";
    setEditingIndex(index);
    setSearchQuery(query);
    setShowSearch(true);
    if (query) handleSearch(query);
  }

  async function addSearchFood(food: FoodOption) {
    const isReplacing = editingIndex !== null;
    const originalWeight = isReplacing
      ? items[editingIndex].estimated_weight_g
      : { min: 100, max: 120 };

    const newItem: AnalysisItem = {
      name: food.canonical_name,
      canonical_name: food.canonical_name,
      food_id: food.food_id,
      state: food.state as AnalysisItem["state"],
      estimated_weight_g: originalWeight,
      confidence_level: "high",
      purine_range: { min: 0, max: 0 },
      level: "green",
      recommendation: "",
    };

    const res = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        food_id: food.food_id,
        weight_min_g: originalWeight.min,
        weight_max_g: originalWeight.max,
        daily_purine_min_mg: daily.purine_min_mg,
        daily_purine_max_mg: daily.purine_max_mg,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      newItem.purine_range = data.purine_range;
      newItem.level = data.level;
      newItem.recommendation = data.recommendation;
    }

    const targetIndex = editingIndex !== null ? editingIndex : items.length;

    setItems((prev) => {
      const next = [...prev];
      if (editingIndex !== null) {
        next[editingIndex] = newItem;
      } else {
        next.push(newItem);
      }
      return next;
    });

    setSelectedForLog((prev) => {
      const next = new Set(prev);
      next.add(targetIndex);
      return next;
    });

    if (isReplacing) {
      markConfirmed(targetIndex);
    }

    setShowSearch(false);
    setEditingIndex(null);
    setSearchQuery("");
    setSearchResults([]);
  }

  function adjustWeight(index: number, delta: number) {
    setItems((prev) => {
      const next = [...prev];
      const item = next[index];
      const minAllowed = 1;
      const newMin = Math.max(
        minAllowed,
        Math.round(item.estimated_weight_g.min + delta)
      );
      // Preserve the original range width by shifting max by the same actual delta.
      const actualDelta = newMin - item.estimated_weight_g.min;
      const newMax = Math.max(
        newMin,
        Math.round(item.estimated_weight_g.max + actualDelta)
      );
      next[index] = {
        ...item,
        estimated_weight_g: {
          min: newMin,
          max: newMax,
        },
      };
      return next;
    });
  }

  async function recalculateItem(index: number) {
    const item = items[index];
    const res = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        food_id: item.food_id,
        weight_min_g: item.estimated_weight_g.min,
        weight_max_g: item.estimated_weight_g.max,
        daily_purine_min_mg: daily.purine_min_mg,
        daily_purine_max_mg: daily.purine_max_mg,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setItems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...data };
        return next;
      });
    }
  }

  async function handleAddToLog() {
    setLogging(true);
    const today = new Date().toISOString().split("T")[0];

    for (const index of selectedForLog) {
      if (needsConfirmation.has(index)) continue;
      const item = items[index];
      if (!item.food_id) continue;

      await addFoodLog({
        food_id: item.food_id,
        food_name: item.canonical_name,
        weight_min_g: item.estimated_weight_g.min,
        weight_max_g: item.estimated_weight_g.max,
        purine_min_mg: item.purine_range.min,
        purine_max_mg: item.purine_range.max,
        thumbnail: mode === "photo" ? thumbnail : undefined,
        source: mode === "photo" ? "photo" : "search",
        date: today,
      });
    }

    setLogging(false);
    router.push("/history");
  }

  function toggleSelection(index: number) {
    setSelectedForLog((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  const totalPurine = items.reduce(
    (acc, item) => ({
      min: acc.min + item.purine_range.min,
      max: acc.max + item.purine_range.max,
    }),
    { min: 0, max: 0 }
  );

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">
            {mode === "photo" ? "分析结果" : "食物分析"}
          </h1>
          <p className="text-sm text-zinc-500">
            今日已记录：{formatPurineRange({ min: daily.purine_min_mg, max: daily.purine_max_mg })}
          </p>
          {isMock && (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              开发模式：正在使用模拟识别结果。生产环境请配置 OPENAI_API_KEY。
            </div>
          )}
        </div>

        {showSearch && (
          <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-zinc-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索食物，如：牛肉、虾、米饭"
              className="w-full rounded-xl border border-zinc-200 py-3 pl-10 pr-4 focus:border-emerald-500 focus:outline-none"
              autoFocus
            />
          </div>

          {searchResults.length > 0 && (
            <ul className="mt-3 max-h-60 overflow-auto rounded-xl border border-zinc-100">
              {searchResults.map((food) => (
                <li
                  key={food.food_id}
                  onClick={() => addSearchFood(food)}
                  className="cursor-pointer border-b border-zinc-100 px-4 py-3 last:border-0 hover:bg-zinc-50"
                >
                  <p className="font-medium text-zinc-900">{food.canonical_name}</p>
                  <p className="text-xs text-zinc-500">{food.category} · {food.state}</p>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => {
              setShowSearch(false);
              setEditingIndex(null);
            }}
            className="mt-3 w-full rounded-xl bg-zinc-100 py-2 text-sm font-medium text-zinc-700"
          >
            取消
          </button>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => {
          const style = LEVEL_STYLES[item.level];
          const requiresConfirmation = needsConfirmation.has(index);
          return (
            <div key={index} className="rounded-2xl bg-white p-5 shadow-sm">
              {requiresConfirmation && (
                <div className="mb-4 rounded-xl bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-800">
                    AI 对这道菜不太确定
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    请确认食物是否正确，或修改为您认为正确的食物。
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => markConfirmed(index)}
                      className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-medium text-white active:bg-emerald-600"
                    >
                      确认无误
                    </button>
                    <button
                      onClick={() => openFoodSearchForConfirmation(index)}
                      className="flex-1 rounded-lg bg-zinc-100 py-2 text-sm font-medium text-zinc-700 active:bg-zinc-200"
                    >
                      修改食物
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {item.canonical_name || item.name}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {formatWeightRange(item.estimated_weight_g)} · {getPortionText(item.estimated_weight_g.max)}
                  </p>
                </div>
                {item.level !== "unknown" && (
                  <div
                    className={`rounded-full px-3 py-1 text-sm font-medium ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-zinc-500">预计嘌呤</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {formatPurineRange(item.purine_range)}
                </p>
              </div>

              <p className="mb-4 text-sm text-zinc-600">{item.recommendation}</p>

              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    adjustWeight(index, -20);
                    recalculateItem(index);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 active:bg-zinc-200"
                >
                  <Minus size={18} />
                </button>
                <span className="flex-1 text-center text-sm text-zinc-600">
                  调整份量
                </span>
                <button
                  onClick={() => {
                    adjustWeight(index, 20);
                    recalculateItem(index);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 active:bg-zinc-200"
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                onClick={() => {
                  setEditingIndex(index);
                  setShowSearch(true);
                }}
                className="text-sm text-emerald-600"
              >
                识别错了？修改食物
              </button>

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedForLog.has(index)}
                  onChange={() => toggleSelection(index)}
                  id={`select-${index}`}
                  disabled={requiresConfirmation || item.level === "unknown"}
                  className="h-5 w-5 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 disabled:opacity-40"
                />
                <label
                  htmlFor={`select-${index}`}
                  className={`text-sm ${requiresConfirmation || item.level === "unknown" ? "text-zinc-400" : "text-zinc-600"}`}
                >
                  {item.level === "unknown"
                    ? "无数据，请手动选择食物"
                    : requiresConfirmation
                    ? "需先确认才能记录"
                    : "加入今日饮食"}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && !showSearch && (
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <p className="mb-4 text-zinc-500">还没有分析任何食物</p>
          <button
            onClick={() => setShowSearch(true)}
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white"
          >
            手动添加食物
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
          <p className="text-sm text-emerald-800">
            本次预计总嘌呤：<span className="font-bold">{formatPurineRange({ min: totalPurine.min, max: totalPurine.max })}</span>
          </p>
          {items.length > 1 && (
            <p className="mt-2 text-sm text-emerald-700">
              {generateMealAdvice(
                items.map((item) => ({
                  name: item.canonical_name || item.name,
                  purine_range: item.purine_range,
                  level: item.level,
                }))
              )}
            </p>
          )}
        </div>
      )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-zinc-200 bg-white px-6 py-4"
        >
          <button
            onClick={handleAddToLog}
            disabled={
              logging ||
              selectedForLog.size === 0 ||
              needsConfirmation.size > 0
            }
            className="mx-auto flex h-14 w-full max-w-md items-center justify-center rounded-xl bg-emerald-500 font-semibold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            {logging
              ? "记录中..."
              : needsConfirmation.size > 0
              ? `请先确认 ${needsConfirmation.size} 个不确定的食物`
              : `加入今日饮食 (${selectedForLog.size})`}
          </button>
        </div>
      )}
    </div>
  );
}
