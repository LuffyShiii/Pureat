"use client";

import { useRouter } from "next/navigation";
import { setOnboardingComplete } from "@/lib/storage/indexeddb";

export default function OnboardingPage() {
  const router = useRouter();

  const handleStart = () => {
    setOnboardingComplete();
    router.push("/");
  };

  return (
    <div className="flex min-h-full flex-col justify-between px-6 py-12">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white text-2xl font-bold mb-6">
            P
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
            拍照识嘌呤
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            拍一张食物照片，帮你快速了解：
          </p>
          <ul className="mt-4 space-y-3 text-zinc-600">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm">
                1
              </span>
              这是什么
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm">
                2
              </span>
              大概吃了多少
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm">
                3
              </span>
              嘌呤大约多少
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm">
                4
              </span>
              建议吃多少
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <strong>免责声明：</strong>
          AI 食物识别、份量估算及嘌呤估算可能存在误差，仅用于日常饮食管理参考，不能替代医生的诊断、治疗或个体化医疗建议。
        </div>
        <button
          onClick={handleStart}
          className="w-full rounded-xl bg-emerald-500 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-transform"
        >
          开始使用
        </button>
      </div>
    </div>
  );
}
