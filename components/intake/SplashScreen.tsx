"use client";

// 起動の画面。開いたときに一度だけ出し、約1.5秒でふわっと消える。押すとすぐ消える。
// 端末で「動きを減らす」がオンのときは、浮く動きを止め、短く消す。
// 画面の履歴には積まない（ブラウザの「戻る」で、この画面には戻らない）
import Image from "next/image";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/appInfo";

const SHOW_MS = 1500;
const LEAVE_MS = 850; // globals.css の .splash と合わせる
const LEAVE_MS_REDUCED = 350;

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [isLeaving, setIsLeaving] = useState(false);

  // しばらくしたら消し始める
  useEffect(() => {
    const timer = window.setTimeout(() => setIsLeaving(true), SHOW_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // 消え終わったら知らせる
  useEffect(() => {
    if (!isLeaving) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onDone, reduced ? LEAVE_MS_REDUCED : LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [isLeaving, onDone]);

  return (
    <div
      className="splash fixed inset-0 z-50 flex flex-col items-center justify-center bg-splash text-on-splash"
      data-leaving={isLeaving ? "" : undefined}
      onClick={() => setIsLeaving(true)}
    >
      <button
        type="button"
        onClick={() => setIsLeaving(true)}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 min-h-12 rounded-full bg-surface-container-lowest px-4 text-support font-bold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-splash"
      >
        とばす
      </button>
      <div className="flex -translate-y-3 flex-col items-center text-center">
        <div className="splash-mascot mb-6 h-40 w-40 overflow-hidden rounded-full">
          <Image
            src="/mascot/splash.webp"
            alt=""
            width={480}
            height={480}
            unoptimized
            priority
            className="h-full w-full object-cover"
          />
        </div>
        <p className="text-headline tracking-[0.12em] [text-shadow:0_2px_8px_rgb(10_120_160/0.25)]">
          {APP_NAME}
        </p>
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-[calc(2.25rem+env(safe-area-inset-bottom))] flex gap-2"
      >
        <span className="splash-dot h-2 w-2 rounded-full bg-on-splash" />
        <span className="splash-dot h-2 w-2 rounded-full bg-on-splash" />
        <span className="splash-dot h-2 w-2 rounded-full bg-on-splash" />
      </div>
    </div>
  );
}
