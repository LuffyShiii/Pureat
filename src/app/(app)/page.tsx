"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Image, Search } from "lucide-react";
import {
  getDailySummary,
  getDeviceId,
  isOnboardingComplete,
} from "@/lib/storage/indexeddb";
import { formatPurineRange } from "@/lib/calc/purine";

export default function HomePage() {
  const router = useRouter();
  const [summary, setSummary] = useState({ purine_min_mg: 0, purine_max_mg: 0 });
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.replace("/onboarding");
      return;
    }

    setDeviceId(getDeviceId());

    async function loadSummary() {
      const today = new Date().toISOString().split("T")[0];
      const daily = await getDailySummary(today);
      setSummary({
        purine_min_mg: daily.purine_min_mg,
        purine_max_mg: daily.purine_max_mg,
      });
      setLoading(false);
    }

    loadSummary();
  }, [router]);

  const handleCapture = () => {
    router.push("/analyzing?source=camera");
  };

  const handleGallery = () => {
    router.push("/analyzing?source=gallery");
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Pureat</h1>
        <p className="text-zinc-500">高尿酸人群的 AI 饮食决策助手</p>
      </div>

      <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500 mb-1">今日已记录嘌呤</p>
        <p className="text-3xl font-bold text-zinc-900">
          {formatPurineRange({ min: summary.purine_min_mg, max: summary.purine_max_mg })}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <button
          onClick={handleCapture}
          className="flex h-40 w-40 flex-col items-center justify-center gap-3 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform"
        >
          <Camera size={40} />
          <span className="text-lg font-semibold">拍照识嘌呤</span>
        </button>

        <div className="flex gap-4">
          <button
            onClick={handleGallery}
            className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-zinc-700 shadow-sm active:scale-95 transition-transform"
          >
            <Image size={20} />
            <span>从相册选择</span>
          </button>

          <Link
            href="/analysis?mode=search"
            className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-zinc-700 shadow-sm active:scale-95 transition-transform"
          >
            <Search size={20} />
            <span>手动搜索</span>
          </Link>
        </div>
      </div>

      <input type="hidden" value={deviceId} />
    </div>
  );
}
