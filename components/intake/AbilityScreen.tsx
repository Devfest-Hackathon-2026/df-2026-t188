import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon } from "@/components/ui/icons";
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
    <div className="stagger flex flex-1 flex-col gap-6 px-4 py-4">
      <div>
        <p className="text-body text-on-surface-variant">
          保護者の方がお選びください。
        </p>
        <h2 className="mt-1 text-headline">
          お子さんは、自分で答えられそうですか？
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        <Button
          variant="outlined"
          size="lg"
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
            「難しい」に変えると、入力したお子さんの回答はすべて消え、「回答困難」になります。変えますか？
          </p>
          <Button
            onClick={() => {
              setIsConfirming(false);
              onChooseDifficult();
            }}
          >
            回答を消して「難しい」に変える
          </Button>
          <Button variant="outlined" onClick={() => setIsConfirming(false)}>
            やめる（回答を残す）
          </Button>
        </Card>
      )}

      {isDifficult && (
        <div className="flex flex-col gap-4">
          <p className="text-body">
            お子さんの回答は「回答困難」として記録しました。
          </p>
          <Button onClick={onNext}>次へ（保護者の入力）</Button>
        </div>
      )}
    </div>
  );
}
