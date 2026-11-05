import { useState } from "react";
import type { IntakeState } from "@/lib/intake/types";

type AbilityScreenProps = {
  canSelfReport: IntakeState["canSelfReport"];
  hasPatientInput: boolean;
  onChooseAble: () => void;
  onChooseDifficult: () => void;
  onNext: () => void;
};

export function AbilityScreen({
  canSelfReport,
  hasPatientInput,
  onChooseAble,
  onChooseDifficult,
  onNext,
}: AbilityScreenProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const isDifficult = canSelfReport === "difficult";

  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">本人は自分の症状を説明できますか？</h1>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            setIsConfirming(false);
            onChooseAble();
          }}
          className="min-h-16 rounded-xl border-2 border-zinc-400 bg-background px-3 py-2 text-xl font-bold"
        >
          できる
        </button>
        <button
          type="button"
          aria-pressed={isDifficult}
          onClick={() => {
            if (hasPatientInput) {
              setIsConfirming(true);
            } else {
              onChooseDifficult();
            }
          }}
          className={`min-h-16 rounded-xl border-2 px-3 py-2 text-xl font-bold ${
            isDifficult
              ? "border-blue-700 bg-blue-700 text-white"
              : "border-zinc-400 bg-background text-foreground"
          }`}
        >
          {isDifficult ? "✓ 難しい" : "難しい"}
        </button>
      </div>

      {isConfirming && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border-2 border-red-700 p-4"
        >
          <p className="text-lg font-bold">
            「難しい」に変えると、入力した本人の回答はすべて消え、「回答困難」になります。変えますか？
          </p>
          <button
            type="button"
            onClick={() => {
              setIsConfirming(false);
              onChooseDifficult();
            }}
            className="min-h-14 rounded-xl bg-red-700 px-3 py-2 text-lg font-bold text-white"
          >
            回答を消して「難しい」に変える
          </button>
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            className="min-h-14 rounded-xl border-2 border-zinc-400 bg-background px-3 py-2 text-lg font-medium"
          >
            やめる（回答を残す）
          </button>
        </div>
      )}

      {isDifficult && (
        <div className="flex flex-col gap-3">
          <p className="text-lg">本人の回答は「回答困難」として記録しました。</p>
          <button
            type="button"
            onClick={onNext}
            className="min-h-14 rounded-xl bg-blue-700 px-3 py-2 text-lg font-bold text-white"
          >
            次へ（家族・介護者の入力）
          </button>
        </div>
      )}
    </div>
  );
}
