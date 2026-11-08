// 左上の「もどる」ボタン。1つ前の画面に戻る（入力した内容は消さない）。
// 押せる場所は縦横 48px 以上にする。見た目は参照の「下だけ厚い縁」の白いボタン。
// 読み上げ機能には、戻り先の画面の名前も伝える
import { ChevronIcon } from "@/components/ui/icons";

type BackButtonProps = {
  destination: string; // 戻り先の画面の正式な名前（例：「保護者」）
  onClick: () => void;
};

export function BackButton({ destination, onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press-feedback chunky inline-flex min-h-12 min-w-12 items-center gap-1 rounded-field border-2 border-card-line bg-surface-container-lowest pr-3 pl-2 text-support font-bold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
    >
      <ChevronIcon className="h-5 w-5 rotate-180" />
      もどる
      <span className="sr-only">（{destination}の画面へ）</span>
    </button>
  );
}
