import { AnswerValue } from "@/components/intake/AnswerValue";
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
  familyChiefRow,
  patientChiefRow,
} from "@/lib/intake/unknowns";

type ReviewScreenProps = {
  canSelfReport: IntakeState["canSelfReport"];
  patient: PatientAnswers;
  family: FamilyAnswers;
  onEdit: (respondent: "patient" | "family", field: string) => void;
  onNext: () => void;
};

// 見直し画面の1項目。main は必ず出し、extra は回答があるときだけ下に出す
type ReviewItem = {
  title: string;
  field: string; // 「編集」で移る先の項目（FieldCard の名前）
  main: AnswerRow;
  extra?: AnswerRow;
};

function buildItems(
  patient: PatientAnswers,
  family: FamilyAnswers,
): ReviewItem[] {
  const patientRows = Object.fromEntries(
    buildPatientRows(patient).map((row) => [row.key, row]),
  );
  const familyRows = Object.fromEntries(
    buildFamilyRows(family).map((row) => [row.key, row]),
  );

  return [
    {
      title: "主訴（本人の言葉）",
      field: "chiefComplaint",
      main: patientChiefRow(patient),
    },
    {
      title: "主訴（保護者から見た症状）",
      field: "chiefConcern",
      main: familyChiefRow(family),
    },
    { title: "どんなかんじ", field: "feelings", main: patientRows.feelings },
    { title: "痛い場所", field: "painLocations", main: patientRows.painLocations },
    { title: "痛みの程度", field: "painLevel", main: patientRows.painLevel },
    {
      title: "感覚",
      field: "sensations",
      main: patientRows.sensations,
      extra: patientRows.sensationOther,
    },
    {
      title: "いつから",
      field: "onset",
      main: familyRows.onset,
      extra: familyRows.onsetDetail,
    },
    { title: "経過", field: "course", main: familyRows.course },
    { title: "体温", field: "temperature", main: familyRows.temperature },
    { title: "食事・水分", field: "foodIntake", main: familyRows.foodIntake },
    { title: "普段との違い", field: "differences", main: familyRows.differences },
    { title: "年齢", field: "age", main: familyRows.age },
    { title: "体重", field: "weight", main: familyRows.weight },
    {
      title: "持病・これまでの病気",
      field: "conditions",
      main: familyRows.conditions,
    },
    { title: "飲んでいる薬", field: "medications", main: familyRows.medications },
    { title: "アレルギー", field: "allergies", main: familyRows.allergies },
    {
      title: "今日相談したいこと",
      field: "consultation",
      main: familyRows.consultation,
    },
  ];
}

export function ReviewScreen({
  canSelfReport,
  patient,
  family,
  onEdit,
  onNext,
}: ReviewScreenProps) {
  const items = buildItems(patient, family);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        <p className="text-body">
          入力した内容です。直したいところは「編集」を押してください。
        </p>
        {canSelfReport === "difficult" && (
          <p className="text-support text-on-surface-variant">
            最初の質問で「お子さんが答えるのは難しい」が選ばれたため、本人の回答は「回答困難」です。本人の項目の「編集」は、最初の質問に移ります。
          </p>
        )}

        {/* 項目ごとのカード：小さなラベル、内容（入力そのまま）、右の「編集」ボタン */}
        <ul className="stagger flex flex-col gap-3">
          {items.map((item) => {
            const badge = RESPONDENT_BADGE[item.main.respondent];
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
                  {item.extra?.state === "answered" && (
                    <p className="mt-1 text-body font-medium break-words whitespace-pre-wrap">
                      {item.extra.text}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`${item.title}を編集`}
                  onClick={() => onEdit(item.main.respondent, item.field)}
                  className="press-feedback chunky inline-flex min-h-12 shrink-0 items-center gap-1 rounded-md border-2 border-card-line bg-surface-container-lowest px-3 text-support font-bold text-on-surface focus-visible:outline-2 focus-visible:outline-on-surface"
                >
                  <PencilIcon className="h-4 w-4" />
                  編集
                </button>
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
