import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { APP_NAME } from "@/lib/appInfo";

// ようこその画面。アプリ名、短い説明、キャラクター、「はじめる」だけ
export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="stagger flex flex-1 flex-col justify-center gap-8 px-5 py-8">
      <div>
        <h1
          tabIndex={-1}
          data-screen-heading
          className="text-headline outline-none"
        >
          {APP_NAME}
        </h1>
        <p className="kana-text mt-3 text-body text-on-surface-variant">
          つたえたいことを、いっしょに整理しよう。
        </p>
        <p className="kana-text mt-1 text-body text-on-surface-variant">
          おうちの ひとと いっしょに やろう。
        </p>
      </div>
      <div aria-hidden="true" className="welcome-art">
        <Image
          src="/mascot/welcome.webp"
          alt=""
          width={380}
          height={380}
          unoptimized
          priority
          className="relative z-10 h-48 w-auto object-contain"
        />
      </div>
      <Button size="lg" onClick={onStart}>
        はじめる
      </Button>
    </div>
  );
}
