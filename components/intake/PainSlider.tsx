import { useRef } from "react";
import { Chip } from "@/components/ui/Chip";
import type { Answer, PainLevel } from "@/lib/intake/types";

// 未回答の間、つまみはこの位置で隠しておく。この値は記録しない
const HIDDEN_THUMB_VALUE = 5;
// つまみの当たり判定の幅。globals.css の .pain-slider と合わせる
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
      <p className="mb-4 text-title" id="pain-level-label">
        痛みはどのくらいですか？
      </p>
      <p className="mb-2 text-center text-headline" aria-live="polite">
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
        <span>0：痛くない</span>
        <span className="text-right">10：考えられる一番の痛み</span>
      </div>
      <Chip
        label="答えられない"
        tone="primary"
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
