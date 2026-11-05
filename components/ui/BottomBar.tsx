import type { ReactNode } from "react";

// 画面の主なボタンを、下に固定して置く場所。
// スマホの下の端（ホームバー）と重ならないよう、セーフエリアの余白をとる
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-outline-variant bg-surface-container-lowest px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-bar">
      {children}
    </div>
  );
}
