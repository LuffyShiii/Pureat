"use client";

import { useEffect, useState } from "react";
import { Trash2, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import type { FoodLog } from "@/types";
import {
  deleteFoodLog,
  getFoodLogsByDateRange,
  updateFoodLog,
} from "@/lib/storage/indexeddb";
import { formatPurineRange, formatWeightRange } from "@/lib/calc/purine";
import { getPortionText } from "@/lib/food/portion-text";

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (dateStr === today) return "今天";
  if (dateStr === yesterday) return "昨天";
  return dateStr;
}

export default function HistoryPage() {
  const [logsByDate, setLogsByDate] = useState<Record<string, FoodLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [newWeight, setNewWeight] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
      .toISOString()
      .split("T")[0];

    const logs = await getFoodLogsByDateRange(thirtyDaysAgo, today);
    const grouped = logs.reduce((acc, log) => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
      return acc;
    }, {} as Record<string, FoodLog[]>);

    // Sort dates descending
    const sorted: Record<string, FoodLog[]> = {};
    Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .forEach((date) => {
        sorted[date] = grouped[date].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

    setLogsByDate(sorted);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这条记录吗？")) return;
    await deleteFoodLog(id);
    await loadLogs();
  }

  function startEdit(log: FoodLog) {
    setEditingLog(log);
    setNewWeight(String(Math.round((log.weight_min_g + log.weight_max_g) / 2)));
  }

  async function saveEdit() {
    if (!editingLog) return;
    const weight = parseInt(newWeight, 10);
    if (isNaN(weight) || weight <= 0) return;

    const range = Math.max(10, Math.round(weight * 0.1));
    const weight_min_g = Math.max(10, weight - range);
    const weight_max_g = weight + range;

    const res = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        food_id: editingLog.food_id,
        weight_min_g,
        weight_max_g,
        daily_purine_min_mg: 0,
        daily_purine_max_mg: 0,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      await updateFoodLog(editingLog.id, {
        weight_min_g,
        weight_max_g,
        purine_min_mg: data.purine_range.min,
        purine_max_mg: data.purine_range.max,
      });
      setEditingLog(null);
      await loadLogs();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-6 py-6 pb-28">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">饮食记录</h1>

      {Object.keys(logsByDate).length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <p className="text-zinc-500">还没有记录，去拍一张照片吧</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(logsByDate).map(([date, logs]) => {
            const total = logs.reduce(
              (acc, log) => ({
                min: acc.min + log.purine_min_mg,
                max: acc.max + log.purine_max_mg,
              }),
              { min: 0, max: 0 }
            );

            return (
              <div key={date}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-900">
                    {formatDate(date)}
                  </h2>
                  <span className="text-sm text-zinc-500">
                    {formatPurineRange(total)}
                  </span>
                </div>

                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          {log.thumbnail && (
                            <img
                              src={log.thumbnail}
                              alt={log.food_name}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-zinc-900">{log.food_name}</p>
                            <p className="text-sm text-zinc-500">
                              {formatWeightRange({
                                min: log.weight_min_g,
                                max: log.weight_max_g,
                              })} · {getPortionText(log.weight_max_g)}
                            </p>
                            <p className="text-sm font-medium text-zinc-700">
                              {formatPurineRange({
                                min: log.purine_min_mg,
                                max: log.purine_max_mg,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(log)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">修改份量</h3>
            <p className="mb-4 text-zinc-600">{editingLog.food_name}</p>
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="mb-4 w-full rounded-xl border border-zinc-200 py-3 px-4 focus:border-emerald-500 focus:outline-none"
              placeholder="克数"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditingLog(null)}
                className="flex-1 rounded-xl bg-zinc-100 py-3 font-medium text-zinc-700"
              >
                取消
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 rounded-xl bg-emerald-500 py-3 font-medium text-white"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
