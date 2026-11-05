import { useRef } from "react";
import type { Answer, PainLevel } from "@/lib/intake/types";

// 未回答の間、つまみはこの位置で隠しておく。この値は記録しない
const HIDDEN_THUMB_VALUE = 5;
const THUMB_SIZE_PX = 36;

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
      <p className="mb-3 text-xl font-bold" id="pain-level-label">
        痛みはどのくらいですか？
      </p>
      <p
        className="mb-2 text-center text-2xl font-bold"
        aria-live="polite"
      >
        {statusText(answer)}
      </p>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={sliderValue}
        aria-labelledby="pain-level-label"
        aria-valuetext={statusText(answer)}
        onPointerDown={() => {
          changedDuringPress.current = false;
        }}
        onPointerUp={handlePointerUp}
        onChange={(event) => {
          changedDuringPress.current = true;
          record(Number(event.target.value));
        }}
        className={`h-12 w-full cursor-pointer touch-pan-y appearance-none bg-transparent [&::-moz-range-thumb]:h-9 [&::-moz-range-thumb]:w-9 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-blue-700 [&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-zinc-300 [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-300 [&::-webkit-slider-thumb]:-mt-3 [&::-webkit-slider-thumb]:h-9 [&::-webkit-slider-thumb]:w-9 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-700 ${
          isAnswered
            ? ""
            : "[&::-moz-range-thumb]:opacity-0 [&::-webkit-slider-thumb]:opacity-0"
        }`}
      />
      <div className="mt-1 flex justify-between gap-6 text-base">
        <span>0：痛くない</span>
        <span className="text-right">10：考えられる一番の痛み</span>
      </div>
      <button
        type="button"
        aria-pressed={answer.status === "unable"}
        onClick={() =>
          onChange({
            respondent: "patient",
            status: "unable",
            reason: "pressed_unable",
          })
        }
        className={`mt-4 min-h-14 w-full rounded-xl border-2 px-3 py-2 text-lg font-medium ${
          answer.status === "unable"
            ? "border-blue-700 bg-blue-700 text-white"
            : "border-zinc-400 bg-background text-foreground"
        }`}
      >
        {answer.status === "unable" ? "✓ 答えられない" : "答えられない"}
      </button>
    </div>
  );
}
