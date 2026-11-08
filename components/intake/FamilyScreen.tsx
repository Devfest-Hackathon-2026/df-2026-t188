import { FieldCard } from "@/components/intake/FieldCard";
import { FamilyField, type FamilyFieldKey } from "@/components/intake/IntakeField";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import type { FamilyAnswers } from "@/lib/intake/types";

// 保護者の画面は4つに分ける。最初はお子さんのこと（すべて任意）
export type FamilyPage = "profile" | "concern" | "condition" | "history";

// 1つのカードに入れる項目。2つ並べるものは配列にする
const PAGE_FIELDS: Record<FamilyPage, (FamilyFieldKey | [FamilyFieldKey, FamilyFieldKey])[]> = {
  profile: [["age", "weight"]],
  concern: ["chiefConcern", "onset"],
  condition: ["temperature", "foodIntake"],
  history: ["medications", "allergies", "conditions"],
};

type FamilyScreenProps = {
  page: FamilyPage;
  answers: FamilyAnswers;
  onChange: (update: Partial<FamilyAnswers>) => void;
  onNext: () => void;
  nextLabel: string;
};

export function FamilyScreen({
  page,
  answers,
  onChange,
  onNext,
  nextLabel,
}: FamilyScreenProps) {
  const renderField = (field: FamilyFieldKey) => (
    <FieldCard key={field}>
      <FamilyField field={field} answers={answers} onChange={onChange} />
    </FieldCard>
  );

  return (
    <>
      <div className="stagger flex flex-1 flex-col gap-4 px-4 py-4">
        {PAGE_FIELDS[page].map((item) =>
          Array.isArray(item) ? (
            <div key={item.join("-")} className="grid grid-cols-2 gap-3">
              {item.map(renderField)}
            </div>
          ) : (
            renderField(item)
          ),
        )}
      </div>
      <BottomBar>
        <Button onClick={onNext}>{nextLabel}</Button>
      </BottomBar>
    </>
  );
}
