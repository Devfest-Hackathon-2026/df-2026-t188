import { useRef } from "react";
import { Chip } from "@/components/ui/Chip";
import { FaceIcon, faceLevel, type FaceLevel } from "@/components/ui/icons";
import type { Answer, PainLevel } from "@/lib/intake/types";

// 未回答の間、つまみはこの位置で隠しておく。この値は記録しない
const HIDDEN_THUMB_VALUE = 5;
// つまみの当たり判定の幅。globals.css の .pain-slider と合わせる
const THUMB_SIZE_PX = 36;

// 顔のアイコンの色。低いと緑、高いとオレンジ〜赤
const FACE_COLOR_CLASS: Record<FaceLevel, string> = {
  0: "text-face-low",
  1: "text-face-low",
  2: "text-face-low",
  3: "text-face-mid",
  4: "text-face-high",
};

type PainSliderProps = {
  answer: Answer<PainLevel, "patient">;
  onChange: (next: Answer<PainLevel, "patient">) => void;
};

function statusText(answer: Answer<PainLevel, "patient">) {
  if (answer.status === "answered") return `いまの痛み：${answer.value}`;
  if (answer.status === "unable") return "回答困難";
  return "未回答";
}

export function PainSlider({ answer, onChange }: PainSliderProps) {
  const changedDuringPress = useRef(false);
  const isAnswered = answer.status === "answered";
  const sliderValue = isAnswered ? answer.value : HIDDEN_THUMB_VALUE;

  const record = (value: number) => {
    onChange({
      respondent: "patient",
      status: "answered",
      value: value as PainLevel,
    });
  };

  // つまみと同じ位置や、スライダーの線をさわっただけでは change が起きないブラウザがあるため、
  // さわった位置から値を求めて記録する
  const handlePointerUp = (event: React.PointerEvent<HTMLInputElement>) => {
    if (changedDuringPress.current) return;

    const { left, width } = event.currentTarget.getBoundingClientRect();
    const trackWidth = width - THUMB_SIZE_PX;
    const x = event.clientX - left - THUMB_SIZE_PX / 2;

    if (isAnswered) {
      const thumbCenter = (answer.value / 10) * trackWidth;
      if (Math.abs(x - thumbCenter) <= THUMB_SIZE_PX / 2) return;
    }

    const ratio = Math.min(1, Math.max(0, x / trackWidth));
    record(Math.round(ratio * 10));
  };

  return (
    <div>
      <p className="mb-4 text-title" id="pain-level-label">
        痛みはどのくらいですか？
      </p>
      {/* 数値を大きく見せる。顔のアイコンは見た目の反応だけで、記録も送信もしない。
          未回答と「答えられない」のときは、顔を出さない */}
      <div className="mb-3 flex min-h-14 items-center gap-3" aria-live="polite">
        {isAnswered && (
          <span
            key={faceLevel(answer.value)}
            aria-hidden="true"
            className={`face-enter flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-container ${
              FACE_COLOR_CLASS[faceLevel(answer.value)]
            }`}
          >
            <FaceIcon level={faceLevel(answer.value)} className="h-9 w-9" />
          </span>
        )}
        {isAnswered ? (
          <p>
            <span className="block text-support text-on-surface-variant">
              いまの痛み
            </span>
            <span className="text-[2.5rem] leading-none font-bold">
              {answer.value}
            </span>
            <span className="text-body text-on-surface-variant"> / 10</span>
          </p>
        ) : (
          <p className="text-headline">{statusText(answer)}</p>
        )}
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={sliderValue}
        aria-labelledby="pain-level-label"
        aria-valuetext={statusText(answer)}
        data-answered={isAnswered}
        onPointerDown={() => {
          changedDuringPress.current = false;
        }}
        onPointerUp={handlePointerUp}
        onChange={(event) => {
          changedDuringPress.current = true;
          record(Number(event.target.value));
        }}
        className="pain-slider"
      />
      <div className="mt-2 flex justify-between gap-6 text-body">
        {/* 文言は変えない。幅が狭いときは、区切りのよい位置で折り返す */}
        <span className="shrink-0">0：痛くない</span>
        <span className="text-right">
          <span className="inline-block">10：考えられる</span>
          <span className="inline-block">一番の痛み</span>
        </span>
      </div>
      <Chip
        label="答えられない"
        selected={answer.status === "unable"}
        onClick={() =>
          onChange({
            respondent: "patient",
            status: "unable",
            reason: "pressed_unable",
          })
        }
        className="mt-4 w-full"
      />
    </div>
  );
}
