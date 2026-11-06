import { Button } from "@/components/ui/Button";
import { HeartIcon } from "@/components/ui/icons";
import { APP_NAME } from "@/lib/appInfo";

// 最初の画面。アプリ名、短い説明、「はじめる」だけ
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
          からだの ことを、えらんで おしえてね。おうちの ひとと いっしょに やろう。
        </p>
      </div>
      <div aria-hidden="true" className="welcome-art">
        <span className="welcome-art-symbol">
          <HeartIcon className="h-12 w-12" />
        </span>
      </div>
      <Button size="lg" onClick={onStart}>
        はじめる
      </Button>
    </div>
  );
}
