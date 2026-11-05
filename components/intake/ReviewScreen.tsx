import { AnswerValue } from "@/components/intake/AnswerValue";
import { Badge, RESPONDENT_BADGE } from "@/components/ui/Badge";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { PencilIcon } from "@/components/ui/icons";
import { TopBar } from "@/components/ui/TopBar";
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
      title: "主訴（家族から見た症状）",
      field: "chiefConcern",
      main: familyChiefRow(family),
    },
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
      <TopBar tone="inverse">入力内容の見直し</TopBar>
      <div className="stagger flex flex-1 flex-col gap-4 px-4 py-4">
        <p className="text-body">
          入力した内容です。直したいところは「編集」を押してください。
        </p>
        {canSelfReport === "difficult" && (
          <p className="text-support text-on-surface-variant">
            最初の質問で「本人が説明するのは難しい」が選ばれたため、本人の回答は「回答困難」です。本人の項目の「編集」は、最初の質問に移ります。
          </p>
        )}

        {/* 1枚のカードの中を、細い線で区切る（カードの中にカードを入れない） */}
        <ul className="divide-y divide-outline-variant rounded-lg bg-surface-container-lowest shadow-card">
          {items.map((item) => {
            const badge = RESPONDENT_BADGE[item.main.respondent];
            return (
              <li key={item.field} className="flex items-center gap-2 py-3 pr-2 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-label font-bold">{item.title}</span>
                    <Badge kind={badge.kind}>{badge.label}</Badge>
                  </p>
                  <p className="mt-1 text-body">
                    <AnswerValue row={item.main} />
                  </p>
                  {item.extra?.state === "answered" && (
                    <p className="mt-1 text-body break-words whitespace-pre-wrap">
                      {item.extra.text}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`${item.title}を編集`}
                  onClick={() => onEdit(item.main.respondent, item.field)}
                  className="press-feedback inline-flex min-h-14 min-w-14 shrink-0 flex-col items-center justify-center rounded-md text-support font-medium text-primary focus-visible:outline-2 focus-visible:outline-on-surface"
                >
                  <PencilIcon className="h-5 w-5" />
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
