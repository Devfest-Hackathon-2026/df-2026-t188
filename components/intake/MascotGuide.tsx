// 案内ボックス。キャラクターと、その画面の質問・説明、選んだ内容への短い返事を出す。
// 文は lib/intake/guide.ts の決まった文だけで、AI は使わない。
// 見出しは画面の見出しでもあり、画面が切り替わったときにフォーカスを受け取る
import Image from "next/image";
import type { Guide } from "@/lib/intake/guide";

export function MascotGuide({ guide, kana = false }: { guide: Guide; kana?: boolean }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-[18px] border border-[#bee6f7] bg-[#e7f7fd] px-3.5 py-3 ${
        kana ? "kana-text" : ""
      }`}
    >
      {/* 表情が変わるたびに作り直し、小さく弾ませる */}
      <span key={guide.pose} className="mascot-portrait mascot-pop" data-pose={guide.pose}>
        <Image
          src={`/mascot/guide/${guide.pose}.webp`}
          alt=""
          width={256}
          height={171}
          unoptimized
          priority
        />
      </span>
      <div className="min-w-0 flex-1">
        <h1
          id="screen-heading"
          tabIndex={-1}
          data-screen-heading
          className="text-title outline-none"
        >
          {guide.title}
        </h1>
        {/* 説明と、選んだ内容への返事は、同じ場所に重ねる。返事が出ると説明と入れ替わる。
            高さは長いほうに合わせるので、返事が出ても下のカードが動かない */}
        <div className="mt-1 grid">
          <p
            aria-hidden={guide.reaction !== ""}
            className={`[grid-area:1/1] text-support text-on-surface-variant ${
              guide.reaction === "" ? "" : "invisible"
            }`}
          >
            {guide.description}
          </p>
          {/* 返事が変わったときに、読み上げ機能が区切りのよいところで読む。
              空のときも消さずに置いておく（隠すと、出たときに読まれないことがあるため） */}
          <p
            aria-live="polite"
            className="[grid-area:1/1] self-center text-support font-bold text-[#176080]"
          >
            {guide.reaction}
          </p>
        </div>
      </div>
    </div>
  );
}
