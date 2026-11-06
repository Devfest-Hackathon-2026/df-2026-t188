import type { ReactNode } from "react";
import { CheckDot, SelectedLayer } from "@/components/ui/Chip";
import {
  FeelingBreathIcon,
  FeelingCoughIcon,
  FeelingFeverIcon,
  FeelingOtherIcon,
  FeelingPainIcon,
  FeelingSickIcon,
  FeelingTiredIcon,
} from "@/components/ui/icons";
import { FEELINGS, type Feeling } from "@/lib/intake/options";

const ILLUSTRATION_CLASS = "h-9 w-9";

const FEELING_ILLUSTRATIONS: Record<Feeling, ReactNode> = {
  いたい: <FeelingPainIcon className={ILLUSTRATION_CLASS} />,
  きもちわるい: <FeelingSickIcon className={ILLUSTRATION_CLASS} />,
  だるい: <FeelingTiredIcon className={ILLUSTRATION_CLASS} />,
  "いきが くるしい": <FeelingBreathIcon className={ILLUSTRATION_CLASS} />,
  "せきが でる": <FeelingCoughIcon className={ILLUSTRATION_CLASS} />,
  ねつっぽい: <FeelingFeverIcon className={ILLUSTRATION_CLASS} />,
  "そのほか・わからない": <FeelingOtherIcon className={ILLUSTRATION_CLASS} />,
};

type FeelingSelectProps = {
  selected: readonly Feeling[];
  onChange: (next: Feeling[]) => void;
};

// 「どんなかんじが する？」のカード。イラスト付きで、いくつでも選べる。
// 同時に選べない選択肢はない（「そのほか・わからない」も、ほかと一緒に選べる）
export function FeelingSelect({ selected, onChange }: FeelingSelectProps) {
  const toggle = (feeling: Feeling) =>
    onChange(
      selected.includes(feeling)
        ? selected.filter((item) => item !== feeling)
        : [...selected, feeling],
    );

  return (
    <fieldset>
      <legend className="text-headline">どんなかんじが する？</legend>
      <p className="mt-1 mb-4 text-body text-on-surface-variant">
        いくつ えらんでも いいよ。わかるところだけで だいじょうぶ。
      </p>
      <div className="grid grid-cols-2 gap-3">
        {FEELINGS.map((feeling, index) => {
          const isSelected = selected.includes(feeling);
          const isLast = index === FEELINGS.length - 1;
          return (
            <button
              key={feeling}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(feeling)}
              className={`press-feedback chunky relative flex items-center justify-center rounded-lg border-2 border-card-line bg-surface-container-lowest p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
                isSelected ? "text-on-primary-container" : "text-on-surface"
              } ${
                isLast
                  ? "col-span-2 min-h-20 flex-row gap-3"
                  : "min-h-30 flex-col gap-2"
              }`}
            >
              <SelectedLayer rounded="rounded-lg" />
              <span
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-on-primary-container ${
                  isSelected
                    ? "bg-surface-container-lowest"
                    : "bg-primary-container"
                }`}
              >
                {FEELING_ILLUSTRATIONS[feeling]}
              </span>
              <span className="relative text-center text-label font-bold">
                {feeling}
              </span>
              <span className="absolute top-2 right-2">
                <CheckDot />
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
