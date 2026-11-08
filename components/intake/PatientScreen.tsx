import { PatientField, type PatientFieldKey } from "@/components/intake/IntakeField";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import type { PatientAnswers } from "@/lib/intake/types";

type PatientScreenProps = {
  field: PatientFieldKey; // こどもの画面は、1画面に1問。文字を書く欄はない
  answers: PatientAnswers;
  onChange: (update: Partial<PatientAnswers>) => void;
  onNext: () => void;
};

// こどもの画面。質問は上の案内ボックスの見出し（id="screen-heading"）で出し、
// 選ぶカードのまとまりは、その見出しを名前にする
export function PatientScreen({
  field,
  answers,
  onChange,
  onNext,
}: PatientScreenProps) {
  return (
    <>
      <div className="kana-text stagger flex flex-1 flex-col gap-6 px-4 py-4">
        <PatientField
          field={field}
          answers={answers}
          onChange={onChange}
          labelledBy="screen-heading"
        />
      </div>
      <BottomBar>
        <Button onClick={onNext}>つぎへ</Button>
      </BottomBar>
    </>
  );
}
