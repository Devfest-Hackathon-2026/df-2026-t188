import { FieldCard } from "@/components/intake/FieldCard";
import { FamilyField, type FamilyFieldKey } from "@/components/intake/IntakeField";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import type { FamilyAnswers } from "@/lib/intake/types";

// 保護者の画面は2つ。お子さんのこと（すべて任意）と、家族からの記録（1ページ）
export type FamilyPage = "profile" | "record";

// お子さんのこと。配列は2列に並べる（1つだけなら左半分）
const PROFILE_FIELDS: (FamilyFieldKey | FamilyFieldKey[])[] = [
  "sex",
  ["age", "weight"],
];

// 家族からの記録。1つのカードに、細い線で区切って並べる（かずまさんの v3 のデザインに寄せる）
const RECORD_FIELDS: FamilyFieldKey[] = [
  "chiefConcern",
  "onset",
  "temperature",
  "foodIntake",
  "conditions",
  "allergies",
  "medications",
];

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
      {page === "profile" ? (
        <div className="stagger flex flex-1 flex-col gap-4 px-4 py-4">
          {PROFILE_FIELDS.map((item) =>
            Array.isArray(item) ? (
              <div key={item.join("-")} className="grid grid-cols-2 gap-3">
                {item.map(renderField)}
              </div>
            ) : (
              renderField(item)
            ),
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-4 py-4">
          <div className="card-frame divide-y divide-line rounded-lg bg-surface-container-lowest px-4">
            {RECORD_FIELDS.map((field) => (
              <section key={field} className="py-4">
                <FamilyField
                  field={field}
                  answers={answers}
                  onChange={onChange}
                  compact
                />
              </section>
            ))}
          </div>
        </div>
      )}
      <BottomBar>
        <Button onClick={onNext}>{nextLabel}</Button>
      </BottomBar>
    </>
  );
}
