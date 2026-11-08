// こどもの答えの区切り（おつかれさま）。全面が青い画面で、ここから保護者の番に変わる。
// 動く画像は、端末で「動きを減らす」がオンのときは静止画に替える。
// 青い面の上の白い文字は、大きな見出しだけにする（小さい文字は白いカードにのせる）
import Image from "next/image";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";

type BreakScreenProps = {
  backDestination: string;
  onBack: () => void;
  onNext: () => void;
};

export function BreakScreen({ backDestination, onBack, onNext }: BreakScreenProps) {
  return (
    <section
      aria-labelledby="break-title"
      className="kana-text flex flex-1 flex-col bg-splash px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-on-splash"
    >
      <div>
        <BackButton destination={backDestination} onClick={onBack} />
      </div>
      <div className="arrive flex flex-1 flex-col items-center justify-center gap-4 py-4 text-center">
        <p className="rounded-full bg-surface-container-lowest px-4 py-1 text-support font-bold text-link">
          ここまで できたよ！
        </p>
        <div className="praise-art aspect-[8/5] w-[min(300px,80vw)]">
          <Image
            src="/mascot/praise.webp"
            alt=""
            width={560}
            height={350}
            unoptimized
            priority
            className="h-full w-full object-cover motion-reduce:hidden"
          />
          <Image
            src="/mascot/praise-still.webp"
            alt=""
            width={560}
            height={350}
            unoptimized
            className="hidden h-full w-full object-cover motion-reduce:block"
          />
        </div>
        <h1
          id="break-title"
          tabIndex={-1}
          data-screen-heading
          className="text-headline outline-none [text-shadow:0_1px_2px_rgb(0_71_105/0.28)]"
        >
          おつかれさま！
          <br />
          よく がんばったね！
        </h1>
        <div className="flex flex-col gap-1 rounded-[18px] bg-surface-container-lowest px-4 py-3 text-on-surface">
          <p className="text-body font-bold">たくさん おしえてくれて ありがとう！</p>
          <p className="text-support text-link">ここからは おうちの ひとの ばんだよ</p>
        </div>
      </div>
      <Button variant="light" onClick={onNext}>
        つぎへ（おとなの ひとへ）
      </Button>
    </section>
  );
}
