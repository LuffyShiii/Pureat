"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import {
  deletePendingPhoto,
  getDeviceId,
  getPendingPhoto,
} from "@/lib/storage/indexeddb";

const STEPS = [
  { label: "识别食物", progress: 25 },
  { label: "估算份量", progress: 50 },
  { label: "查询嘌呤", progress: 75 },
  { label: "生成建议", progress: 100 },
];

export default function AnalyzingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    async function analyze() {
      const pending = await getPendingPhoto();
      if (!pending) {
        setError("没有找到待分析的照片，请返回首页重新选择。");
        return;
      }

      setError("");
      setStep(0);

      interval = setInterval(() => {
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
      }, 800);

      try {
        const deviceId = getDeviceId();
        const formData = new FormData();
        formData.append("image", pending.file);
        formData.append("device_id", deviceId);

        const res = await fetch("/api/recognize", {
          method: "POST",
          body: formData,
        });

        if (interval) clearInterval(interval);

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "识别失败");
          return;
        }

        if (data.error) {
          setError(data.error);
          return;
        }

        // Store result in sessionStorage for analysis page
        sessionStorage.setItem(
          "pureat_analysis_items",
          JSON.stringify(data.items)
        );
        sessionStorage.setItem(
          "pureat_analysis_mock",
          data.mock ? "true" : "false"
        );
        if (data.thumbnail) {
          sessionStorage.setItem(
            "pureat_analysis_thumbnail",
            data.thumbnail
          );
        }

        // Clean up the temporary photo
        await deletePendingPhoto();

        router.replace("/analysis?mode=photo");
      } catch (err) {
        if (interval) clearInterval(interval);
        setError("网络错误，请重试");
        console.error(err);
      }
    }

    analyze();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6">
      {error ? (
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mx-auto">
            <Camera size={28} />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900">识别遇到问题</h2>
          <p className="mb-6 text-zinc-600">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.replace("/")}
              className="flex-1 rounded-xl bg-emerald-500 py-3 font-semibold text-white"
            >
              返回首页
            </button>
            <button
              onClick={() => router.replace("/analysis?mode=search")}
              className="flex-1 rounded-xl bg-zinc-100 py-3 font-semibold text-zinc-700"
            >
              手动搜索
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-300 border-t-emerald-600" />
          </div>

          <h2 className="mb-2 text-center text-xl font-semibold text-zinc-900">
            正在分析
          </h2>
          <p className="mb-8 text-center text-zinc-500">{STEPS[step].label}</p>

          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${STEPS[step].progress}%` }}
            />
          </div>

          <div className="mt-6 space-y-2">
            {STEPS.map((s, i) => (
              <div
                key={s.label}
                className={`flex items-center gap-3 text-sm ${
                  i <= step ? "text-zinc-900" : "text-zinc-400"
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    i <= step ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
