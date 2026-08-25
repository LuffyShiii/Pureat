import { openDB, type DBSchema } from "idb";
import type { FoodLog, DailySummary } from "@/types";

interface PureatDB extends DBSchema {
  food_logs: {
    key: string;
    value: FoodLog;
    indexes: {
      by_date: string;
    };
  };
  thumbnails: {
    key: string;
    value: {
      id: string;
      dataUrl: string;
      created_at: string;
    };
  };
}

const DB_NAME = "pureat";
const DB_VERSION = 1;

export async function getDB() {
  return openDB<PureatDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("food_logs")) {
        const logStore = db.createObjectStore("food_logs", { keyPath: "id" });
        logStore.createIndex("by_date", "date");
      }
      if (!db.objectStoreNames.contains("thumbnails")) {
        db.createObjectStore("thumbnails", { keyPath: "id" });
      }
    },
  });
}

export async function addFoodLog(
  log: Omit<FoodLog, "id" | "created_at" | "updated_at">
): Promise<FoodLog> {
  const db = await getDB();
  const now = new Date().toISOString();
  const foodLog: FoodLog = {
    ...log,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
  await db.put("food_logs", foodLog);
  return foodLog;
}

export async function updateFoodLog(
  id: string,
  updates: Partial<Omit<FoodLog, "id" | "created_at">>
): Promise<FoodLog | null> {
  const db = await getDB();
  const existing = await db.get("food_logs", id);
  if (!existing) return null;

  const updated: FoodLog = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  await db.put("food_logs", updated);
  return updated;
}

export async function deleteFoodLog(id: string): Promise<boolean> {
  const db = await getDB();
  const tx = db.transaction(["food_logs", "thumbnails"], "readwrite");
  await tx.objectStore("food_logs").delete(id);
  await tx.objectStore("thumbnails").delete(id);
  await tx.done;
  return true;
}

export async function getFoodLogsByDate(date: string): Promise<FoodLog[]> {
  const db = await getDB();
  const tx = db.transaction("food_logs", "readonly");
  const index = tx.store.index("by_date");
  return index.getAll(date);
}

export async function getFoodLogsByDateRange(
  startDate: string,
  endDate: string
): Promise<FoodLog[]> {
  const db = await getDB();
  const tx = db.transaction("food_logs", "readonly");
  const index = tx.store.index("by_date");
  const range = IDBKeyRange.bound(startDate, endDate);
  return index.getAll(range);
}

export async function getDailySummary(date: string): Promise<DailySummary> {
  const logs = await getFoodLogsByDate(date);
  return {
    date,
    purine_min_mg: logs.reduce((sum, log) => sum + log.purine_min_mg, 0),
    purine_max_mg: logs.reduce((sum, log) => sum + log.purine_max_mg, 0),
    count: logs.length,
  };
}

export async function saveThumbnail(id: string, dataUrl: string): Promise<void> {
  const db = await getDB();
  await db.put("thumbnails", {
    id,
    dataUrl,
    created_at: new Date().toISOString(),
  });
}

export async function getThumbnail(id: string): Promise<string | undefined> {
  const db = await getDB();
  const item = await db.get("thumbnails", id);
  return item?.dataUrl;
}

export async function deleteThumbnail(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("thumbnails", id);
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let deviceId = localStorage.getItem("pureat_device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("pureat_device_id", deviceId);
  }
  return deviceId;
}

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("pureat_onboarding_complete") === "true";
}

export function setOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("pureat_onboarding_complete", "true");
}
