import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon, SpeechIcon } from "@/components/ui/icons";
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
    <div className="stagger flex flex-1 flex-col gap-6 px-4 py-6">
      {/* 本人向けのやさしい呼びかけ */}
      <Card as="div" className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
          <SpeechIcon />
        </span>
        <p className="text-title">いま どんな ぐあい？</p>
      </Card>

      <h1 tabIndex={-1} data-screen-heading className="text-headline outline-none">
        本人は自分の症状を説明できますか？
      </h1>

      <div className="flex flex-col gap-4">
        <Button
          variant="outlined"
          size="lg"
          className="bg-surface-container-lowest"
          onClick={() => {
            setIsConfirming(false);
            onChooseAble();
          }}
        >
          できる
        </Button>
        <Button
          variant={isDifficult ? "tonal" : "outlined"}
          size="lg"
          className={isDifficult ? "" : "bg-surface-container-lowest"}
          aria-pressed={isDifficult}
          onClick={() => {
            if (hasPatientInput) {
              setIsConfirming(true);
            } else {
              onChooseDifficult();
            }
          }}
        >
          {isDifficult && <CheckIcon />}
          難しい
        </Button>
      </div>

      {isConfirming && (
        <Card tone="caution" as="div" role="alert" className="flex flex-col gap-4">
          <p className="text-body font-bold">
            「難しい」に変えると、入力した本人の回答はすべて消え、「回答困難」になります。変えますか？
          </p>
          <Button
            onClick={() => {
              setIsConfirming(false);
              onChooseDifficult();
            }}
          >
            回答を消して「難しい」に変える
          </Button>
          <Button
            variant="outlined"
            className="bg-surface-container-lowest"
            onClick={() => setIsConfirming(false)}
          >
            やめる（回答を残す）
          </Button>
        </Card>
      )}

      {isDifficult && (
        <div className="flex flex-col gap-4">
          <p className="text-body">
            本人の回答は「回答困難」として記録しました。
          </p>
          <Button onClick={onNext}>次へ（家族・介護者の入力）</Button>
        </div>
      )}
    </div>
  );
}
