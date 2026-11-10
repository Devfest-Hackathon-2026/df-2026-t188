// 終了の画面。全面が青い画面で、ありがとうのキャラクターを出す。
// 動く画像は、端末で「動きを減らす」がオンのときは静止画に替える。
// PDF・印刷・QR・共有は作らない。入力した内容は保存していないので、閉じると消えることを伝える
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type EndScreenProps = {
  onBackToDoctor: () => void;
  onRestart: () => void; // 入力した内容をすべて消して、最初の画面に戻る
};

export function EndScreen({ onBackToDoctor, onRestart }: EndScreenProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <section
      aria-labelledby="end-title"
      className="flex flex-1 flex-col bg-splash px-5 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-on-splash"
    >
      <div className="arrive flex flex-1 flex-col items-center justify-center gap-4 py-4 text-center">
        <p className="rounded-full bg-surface-container-lowest px-4 py-1 text-support font-bold text-link">
          問診が終わりました
        </p>
        <div className="aspect-[3/2] w-[min(300px,80vw)]">
          <Image
            src="/mascot/thankyou.webp"
            alt=""
            width={480}
            height={320}
            unoptimized
            priority
            className="h-full w-full object-contain motion-reduce:hidden"
          />
          <Image
            src="/mascot/thankyou-still.webp"
            alt=""
            width={600}
            height={400}
            unoptimized
            className="hidden h-full w-full object-contain motion-reduce:block"
          />
        </div>
        <h1
          id="end-title"
          tabIndex={-1}
          data-screen-heading
          className="text-headline outline-none [text-shadow:0_1px_2px_rgb(0_71_105/0.28)]"
        >
          ありがとうございました！
        </h1>
        <div className="flex flex-col gap-1 rounded-[18px] bg-surface-container-lowest px-4 py-3 text-on-surface">
          <p className="text-body font-bold">ご回答、ありがとうございました</p>
          <p className="text-support text-on-surface-variant">
            入力した内容は保存していません。
            <br />
            この画面を閉じると消えます。
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isConfirming ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-[18px] bg-surface-container-lowest p-4 text-on-surface"
          >
            <p className="text-body font-bold">
              入力した内容がすべて消えます。はじめからにしますか？
            </p>
            <Button variant="outlined" onClick={onRestart}>
              消して、はじめからにする
            </Button>
            <Button variant="tonal" onClick={() => setIsConfirming(false)}>
              やめる
            </Button>
          </div>
        ) : (
          <>
            <Button variant="light" onClick={onBackToDoctor}>
              医師の画面にもどる
            </Button>
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className="press-feedback min-h-14 rounded-md border-2 border-on-splash px-6 text-title text-on-splash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-splash"
            >
              はじめから
            </button>
          </>
        )}
      </div>
    </section>
  );
}
