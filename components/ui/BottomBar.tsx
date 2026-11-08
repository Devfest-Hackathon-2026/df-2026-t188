import type { ReactNode } from "react";

// 画面の主なボタンを、下に固定して置く場所。上の端は背景に溶けるようにぼかす（参照と同じ）。
// スマホの下の端（ホームバー）と重ならないよう、セーフエリアの余白をとる
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-2 bg-linear-to-b from-surface/0 via-surface/95 via-25% to-surface px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}
