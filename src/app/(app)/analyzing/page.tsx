import { Suspense } from "react";
import AnalyzingContent from "./AnalyzingContent";

export default function AnalyzingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
        </div>
      }
    >
      <AnalyzingContent />
    </Suspense>
  );
}
