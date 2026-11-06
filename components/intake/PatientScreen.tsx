import { FieldCard } from "@/components/intake/FieldCard";
import { PatientField, type PatientFieldKey } from "@/components/intake/IntakeField";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import type { PatientAnswers } from "@/lib/intake/types";

type PatientScreenProps = {
  field: PatientFieldKey; // こどもの画面は、1画面に1問。説明文も文字を書く欄もない
  answers: PatientAnswers;
  onChange: (update: Partial<PatientAnswers>) => void;
  onNext: () => void;
  nextLabel: string;
};

export function PatientScreen({
  field,
  answers,
  onChange,
  onNext,
  nextLabel,
}: PatientScreenProps) {
  return (
    <>
      <div className="kana-text stagger flex flex-1 flex-col gap-6 px-4 py-4">
        <FieldCard bare>
          <PatientField field={field} answers={answers} onChange={onChange} />
        </FieldCard>
      </div>
      <BottomBar>
        <Button onClick={onNext}>{nextLabel}</Button>
      </BottomBar>
    </>
  );
}
