import { useState } from "react";
import { AnswerValue, MissingLabel } from "@/components/intake/AnswerValue";
import { DoctorSkeleton } from "@/components/intake/DoctorSkeleton";
import {
  SummarySection,
  useSummary,
  type SummaryCache,
} from "@/components/intake/SummarySection";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ChevronIcon } from "@/components/ui/icons";
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
  getUnknownRows,
  missingStateLabel,
  patientChiefRow,
} from "@/lib/intake/unknowns";
import { buildSummaryInput } from "@/lib/summary/input";

type DoctorScreenProps = {
  canSelfReport: IntakeState["canSelfReport"];
  patient: PatientAnswers;
  family: FamilyAnswers;
  summaryCache: SummaryCache | null;
  onSummaryReady: (cache: SummaryCache) => void;
};

const RESPONDENT_LABEL = { patient: "本人", family: "保護者" } as const;

// 「経過」に並べる項目と、「年齢・体重・薬・持病・アレルギー」に並べる項目（どちらも保護者の回答を入力どおりに出す）。
// 点と線で見せるのは、入力された「いつから」「くわしい時刻」「経過」だけ。時刻を作ったり推測したりしない
const TIMELINE_KEYS = ["onset", "onsetDetail", "course"];
const COURSE_OTHER_KEYS = ["foodIntake", "differences"];
const VERBATIM_KEYS = ["age", "weight", "medications", "conditions", "allergies"];

function pickRows(rows: AnswerRow[], keys: string[]): AnswerRow[] {
  return keys.flatMap((key) => rows.filter((row) => row.key === key));
}

// 項目名と値を縦に並べた1行。値は入力どおりに表示する
function RowList({ rows }: { rows: AnswerRow[] }) {
  return (
    <dl className="divide-y divide-outline-variant">
      {rows.map((row) => (
        <div key={row.key} className="py-3">
          <dt className="text-label font-bold">{row.label}</dt>
          <dd className="mt-1 text-body">
            <AnswerValue row={row} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

// 経過を、点と線で上から順に見せる。値は入力どおりに表示する
function Timeline({ rows }: { rows: AnswerRow[] }) {
  return (
    <ol className="mt-3 ml-1.5 flex flex-col gap-4 border-l-2 border-outline-variant pl-5">
      {rows.map((row) => (
        <li key={row.key} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-1.5 -left-[27px] h-3 w-3 rounded-full bg-primary"
          />
          <p className="text-support font-bold text-on-surface-variant">
            {row.label}
          </p>
          <p className="mt-1 text-body font-medium">
            <AnswerValue row={row} />
          </p>
        </li>
      ))}
    </ol>
  );
}

// 体温と痛みの程度を大きく見せる枠。値にラベルや色は付けない
function MetricTile({
  label,
  badge,
  value,
  row,
}: {
  label: string;
  badge: "patient" | "family";
  value: string | null; // 回答があるときの表示。なければ row の状態を出す
  row: AnswerRow;
}) {
  return (
    <Card as="div" className="p-3">
      <p className="flex flex-wrap items-center gap-2 text-support">
        {label}
        <Badge kind={badge}>{badge === "patient" ? "本人" : "保護者"}</Badge>
      </p>
      {value !== null ? (
        <p className="mt-1 text-headline">{value}</p>
      ) : (
        <p className="mt-2 text-body">
          <MissingLabel row={row} asUnknown={row.required} />
        </p>
      )}
    </Card>
  );
}

export function DoctorScreen({
  canSelfReport,
  patient,
  family,
  summaryCache,
  onSummaryReady,
}: DoctorScreenProps) {
  const unknownRows = getUnknownRows(patient, family);
  const patientRows = buildPatientRows(patient);
  const familyRows = buildFamilyRows(family);
  const patientChief = patientChiefRow(patient);
  const familyChief = familyChiefRow(family);
  const feelingsRow = pickRows(patientRows, ["feelings"])[0];
  const painLevelRow = pickRows(patientRows, ["painLevel"])[0];
  const temperatureRow = pickRows(familyRows, ["temperature"])[0];
  const consultationRow = pickRows(familyRows, ["consultation"])[0];

  const summaryStatus = useSummary(
    buildSummaryInput(patient, family),
    summaryCache,
    onSummaryReady,
  );

  // 要約があるときだけ、下の段を閉じられる。要約がないときは必ず開いておく
  const hasSummary = summaryStatus.kind === "ready";
  const [isOpenedByUser, setIsOpenedByUser] = useState(false);
  const isDetailOpen = !hasSummary || isOpenedByUser;

  // 要約の作成中は、この画面の代わりにスケルトンを出す。
  // スケルトンから切り替わるときは、カードが上から順にふわっと出る（.stagger）
  const isLoading = summaryStatus.kind === "loading";
  const [hasShownSkeleton, setHasShownSkeleton] = useState(isLoading);
  if (isLoading && !hasShownSkeleton) setHasShownSkeleton(true);

  const statusMessage = isLoading
    ? "AI が要約しています…"
    : hasShownSkeleton && hasSummary
      ? "要約ができました"
      : "";

  return (
    <>
      {/* 読み上げ機能に、要約の作成中と完了を伝える */}
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
      {isLoading ? (
        <DoctorSkeleton />
      ) : (
        <div className="stagger flex flex-1 flex-col gap-4 px-4 py-4">
          {/* 体温（入力どおり）と、痛みの程度（本人が答えた値） */}
          <div className="grid grid-cols-2 gap-2">
            <MetricTile
              label="体温"
              badge="family"
              value={temperatureRow.state === "answered" ? temperatureRow.text : null}
              row={temperatureRow}
            />
            <MetricTile
              label="痛みの程度"
              badge="patient"
              value={
                patient.painLevel.status === "answered"
                  ? `${patient.painLevel.value} / 10`
                  : null
              }
              row={painLevelRow}
            />
          </div>

          {/* 主訴。入力された文章をそのまま表示する（AI の要約は使わない） */}
          <Card>
            <h2 className="text-title">主訴</h2>
            <div className="mt-3">
              <Badge kind="patient">本人</Badge>
              {patientChief.state === "answered" ? (
                <blockquote className="mt-2 border-l-4 border-patient pl-3 text-title break-words whitespace-pre-wrap">
                  「{patientChief.text}」
                </blockquote>
              ) : (
                <p className="mt-2 text-body">
                  <MissingLabel row={patientChief} asUnknown />
                </p>
              )}
              <p className="mt-3 text-support font-bold text-on-surface-variant">
                {feelingsRow.label}
              </p>
              <p className="mt-1 text-body font-medium">
                <AnswerValue row={feelingsRow} />
              </p>
            </div>
            <div className="mt-4 border-t border-outline-variant pt-4">
              <Badge kind="family">保護者</Badge>
              <p className="mt-2 text-body">
                <AnswerValue row={familyChief} asUnknown />
              </p>
            </div>
          </Card>

          <SummarySection status={summaryStatus} />

          <Card>
            <h2 className="flex flex-wrap items-center gap-2 text-title">
              経過
              <Badge kind="family">保護者</Badge>
            </h2>
            <Timeline rows={pickRows(familyRows, TIMELINE_KEYS)} />
            <div className="mt-4 border-t border-outline-variant">
              <RowList rows={pickRows(familyRows, COURSE_OTHER_KEYS)} />
            </div>
          </Card>

          <Card tone="caution">
            <h2 className="text-title">不明の項目（{unknownRows.length}件）</h2>
            {unknownRows.length === 0 ? (
              <p className="mt-2 text-body">必須の項目に不明はありません。</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2 text-body">
                {unknownRows.map((row) => (
                  <li key={row.key}>
                    <span className="font-bold">
                      {RESPONDENT_LABEL[row.respondent]}：{row.label}
                    </span>
                    <br />
                    {row.state !== "answered" &&
                      missingStateLabel(row.state, true)}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="flex flex-wrap items-center gap-2 text-title">
              年齢・体重・薬・持病・アレルギー
              <Badge kind="family">保護者</Badge>
            </h2>
            <p className="mt-1 text-support text-on-surface-variant">
              入力されたとおりに表示しています。AIは通していません。
            </p>
            <RowList rows={pickRows(familyRows, VERBATIM_KEYS)} />
          </Card>

          <Card>
            <h2 className="flex flex-wrap items-center gap-2 text-title">
              今日相談したいこと
              <Badge kind="family">保護者</Badge>
            </h2>
            <p className="mt-2 text-body">
              <AnswerValue row={consultationRow} />
            </p>
          </Card>

          <Card className="p-0">
            <h2>
              <button
                type="button"
                aria-expanded={isDetailOpen}
                aria-controls="original-answers"
                disabled={!hasSummary}
                onClick={() => setIsOpenedByUser((isOpen) => !isOpen)}
                className="flex min-h-14 w-full items-center gap-2 rounded-lg px-4 py-4 text-left text-title focus-visible:outline-2 focus-visible:outline-on-surface"
              >
                {hasSummary && (
                  <ChevronIcon className={`h-6 w-6 ${isDetailOpen ? "rotate-90" : ""}`} />
                )}
                詳しく見る（入力されたとおりの回答すべて）
              </button>
            </h2>
            {isDetailOpen && (
              <div id="original-answers" className="px-4 pb-4">
                <h3 className="flex flex-wrap items-center gap-2 border-t border-outline-variant pt-4 text-title">
                  本人の回答
                  <Badge kind="patient">本人</Badge>
                </h3>
                {canSelfReport === "difficult" && (
                  <p className="mt-2 text-support text-on-surface-variant">
                    最初の質問で「お子さんが答えるのは難しい」が選ばれたため、本人の回答はすべて「回答困難」です。
                  </p>
                )}
                <RowList rows={[patientChief, ...patientRows]} />

                <h3 className="flex flex-wrap items-center gap-2 border-t border-outline-variant pt-4 text-title">
                  保護者の回答
                  <Badge kind="family">保護者</Badge>
                </h3>
                <RowList rows={[familyChief, ...familyRows]} />
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
