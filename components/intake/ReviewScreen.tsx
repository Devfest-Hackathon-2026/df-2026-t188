import { AnswerValue } from "@/components/intake/AnswerValue";
import type { EditTarget } from "@/components/intake/EditSheet";
import type { FamilyFieldKey } from "@/components/intake/IntakeField";
import { Badge, RESPONDENT_BADGE } from "@/components/ui/Badge";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { PencilIcon } from "@/components/ui/icons";
import type {
  FamilyAnswers,
  IntakeState,
  PatientAnswers,
} from "@/lib/intake/types";
import {
  type AnswerRow,
  buildFamilyRows,
  buildPatientRows,
} from "@/lib/intake/unknowns";
import type { PatientSymptoms } from "@/lib/intake/symptoms";

type ReviewScreenProps = {
  canSelfReport: IntakeState["canSelfReport"];
  patient: PatientAnswers;
  symptoms: PatientSymptoms; // こどもの主症状と詳しい答え（言葉で出すだけ。Gemini には送らない）
  family: FamilyAnswers;
  onEdit: (target: EditTarget) => void;
  // こどもの最初の画面（「難しい」のときは最初の質問）に戻る。入力した内容は消さない
  onRedoPatient: () => void;
  onNext: () => void;
};

// 見直し画面の1項目
type ReviewItem = {
  title: string;
  field: string; // 項目の名前
  main: AnswerRow;
};

// 項目の名前。短い名前を出す
const ITEM_TITLES: Record<string, string> = {
  bodyParts: "へんなところ",
  feelings: "どんなかんじ",
  discomfort: "つらさ",
  chiefConcern: "一番心配なこと",
  onset: "いつから",
  temperature: "熱",
  foodIntake: "食べる・飲む",
  medications: "飲んでいる薬",
  allergies: "アレルギー",
  conditions: "持病",
  age: "年齢",
  sex: "性別",
  weight: "体重",
};

// 表にない項目（主症状ごとの詳しい答えなど）は、行の名前から「（本人が選んだもの）」を外して使う
function itemTitle(row: AnswerRow): string {
  return ITEM_TITLES[row.key] ?? row.label.replace("（本人が選んだもの）", "");
}

function buildItems(
  patient: PatientAnswers,
  symptoms: PatientSymptoms,
  family: FamilyAnswers,
): ReviewItem[] {
  return [...buildPatientRows(patient, symptoms), ...buildFamilyRows(family)].map(
    (row) => ({ title: itemTitle(row), field: row.key, main: row }),
  );
}

export function ReviewScreen({
  canSelfReport,
  patient,
  symptoms,
  family,
  onEdit,
  onRedoPatient,
  onNext,
}: ReviewScreenProps) {
  const items = buildItems(patient, symptoms, family);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        {/* こどもの答えは、ここでは書き換えない（本人と保護者の回答を混ぜないため）。
            直すときは、こどもの画面に戻って、お子さんと一緒に選び直す */}
        <div className="flex flex-col gap-3 rounded-lg bg-surface-container px-4 py-3">
          <p className="text-support text-on-surface-variant">
            {canSelfReport === "difficult"
              ? "最初の質問で「お子さんが答えるのは難しい」が選ばれたため、本人の回答は「回答困難」です。"
              : "本人の回答は、ここでは直せません。直すときは、お子さんと一緒に選び直してください。"}
          </p>
          <Button variant="outlined" onClick={onRedoPatient}>
            {canSelfReport === "difficult"
              ? "最初の質問にもどる"
              : "お子さんと一緒に選び直す"}
          </Button>
        </div>

        {/* 項目ごとのカード：小さなラベル、内容（入力そのまま）、右の「編集」ボタン */}
        <ul className="stagger flex flex-col gap-3">
          {items.map((item) => {
            const badge = RESPONDENT_BADGE[item.main.respondent];
            // こどもの項目は保護者が書き換えられないようにする（本人と保護者の回答を混ぜないため）
            const canEdit = item.main.respondent === "family";
            return (
              <li
                key={item.field}
                className="card-frame flex items-center gap-3 rounded-lg bg-surface-container-lowest p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary-container px-3 text-support font-bold text-on-primary-container">
                      {item.title}
                    </span>
                    <Badge kind={badge.kind}>{badge.label}</Badge>
                  </p>
                  <p className="mt-2 text-body font-medium">
                    <AnswerValue row={item.main} />
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    aria-label={`${item.title}を編集`}
                    data-edit-field={item.field}
                    onClick={() =>
                      onEdit({
                        title: item.title,
                        field: item.field as FamilyFieldKey,
                      })
                    }
                    className="press-feedback chunky inline-flex min-h-12 shrink-0 items-center gap-1 rounded-md border-2 border-card-line bg-surface-container-lowest px-3 text-support font-bold text-on-surface focus-visible:outline-2 focus-visible:outline-on-surface"
                  >
                    <PencilIcon className="h-4 w-4" />
                    編集
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <BottomBar>
        <Button onClick={onNext}>医師向けサマリーを作る</Button>
      </BottomBar>
    </>
  );
}
