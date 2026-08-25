"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, History } from "lucide-react";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-6 py-2 safe-area-pb">
        <div className="mx-auto flex max-w-md justify-around">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 px-4 py-2 ${
              pathname === "/" ? "text-emerald-600" : "text-zinc-500"
            }`}
          >
            <Camera size={24} />
            <span className="text-xs">拍照</span>
          </Link>
          <Link
            href="/history"
            className={`flex flex-col items-center gap-1 px-4 py-2 ${
              pathname === "/history" ? "text-emerald-600" : "text-zinc-500"
            }`}
          >
            <History size={24} />
            <span className="text-xs">记录</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
