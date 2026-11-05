import { useState } from "react";
import {
  SummarySection,
  useSummary,
  type SummaryCache,
} from "@/components/intake/SummarySection";
import { DoctorSkeleton } from "@/components/intake/DoctorSkeleton";
import { Card } from "@/components/ui/Card";
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

const RESPONDENT_LABEL = { patient: "本人", family: "家族・介護者" } as const;

// AI に送らず、入力どおりに表示する項目
const VERBATIM_KEYS = ["medications", "conditions", "allergies"];

// 未回答・回答困難・わからない（と回答）の表示。必須の項目は「不明」として注意の色にする
function MissingLabel({ row, asUnknown }: { row: AnswerRow; asUnknown: boolean }) {
  if (row.state === "answered") return null;
  return asUnknown ? (
    <span className="inline-block rounded-sm bg-caution-container px-2 py-1 text-label font-bold text-on-caution-container">
      {missingStateLabel(row.state, true)}
    </span>
  ) : (
    <span className="text-on-surface-variant">
      {missingStateLabel(row.state, false)}
    </span>
  );
}

// 回答は入力どおりに表示する。言い換えや要約はしない
function RowView({ row, asUnknown }: { row: AnswerRow; asUnknown: boolean }) {
  return (
    <div className="py-4">
      <dt className="text-label font-bold">{row.label}</dt>
      <dd className="mt-1 text-body break-words whitespace-pre-wrap">
        {row.state === "answered" ? (
          row.text
        ) : (
          <MissingLabel row={row} asUnknown={asUnknown} />
        )}
      </dd>
    </div>
  );
}

// 主訴。入力された文章をそのまま、一番大きな文字で表示する（AI の要約は使わない）
function ChiefView({ row, tone }: { row: AnswerRow; tone: "primary" | "secondary" }) {
  return (
    <Card tone={tone} as="div">
      <dt
        className={`text-label font-bold ${
          tone === "primary"
            ? "text-on-primary-container"
            : "text-on-secondary-container"
        }`}
      >
        {row.label}
      </dt>
      <dd className="mt-2 text-headline break-words whitespace-pre-wrap">
        {row.state === "answered" ? (
          row.text
        ) : (
          <MissingLabel row={row} asUnknown />
        )}
      </dd>
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
  const familyRows = buildFamilyRows(family);
  const verbatimRows = VERBATIM_KEYS.flatMap((key) =>
    familyRows.filter((row) => row.key === key),
  );

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
  // スケルトンを出したあとだけ、ふわっと切り替える
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
      <TopBar tone="inverse">医師に見せる画面</TopBar>
      {/* 読み上げ機能に、要約の作成中と完了を伝える */}
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
      {isLoading ? (
        <DoctorSkeleton />
      ) : (
      <div
        className={`flex flex-col gap-6 px-4 py-6 ${
          hasShownSkeleton ? "fade-in" : ""
        }`}
      >
        <section>
          <h2 className="mb-2 text-title">主訴（入力されたとおり）</h2>
          <dl className="flex flex-col gap-2">
            <ChiefView row={patientChiefRow(patient)} tone="primary" />
            <ChiefView row={familyChiefRow(family)} tone="secondary" />
          </dl>
        </section>

        <SummarySection status={summaryStatus} />

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

        <Card tone="secondary">
          <h2 className="text-title text-on-secondary-container">
            薬・持病・アレルギー
          </h2>
          <p className="mt-1 text-support text-on-surface-variant">
            家族・介護者が入力したとおりに表示しています。AIは通していません。
          </p>
          <dl className="divide-y divide-outline-variant">
            {verbatimRows.map((row) => (
              <RowView key={row.key} row={row} asUnknown={row.required} />
            ))}
          </dl>
        </Card>

        <Card tone="outlined" className="p-0">
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
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className={`h-6 w-6 shrink-0 ${isDetailOpen ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              )}
              詳しく見る（入力されたとおりの回答）
            </button>
          </h2>
          {isDetailOpen && (
            <div id="original-answers" className="flex flex-col gap-4 px-4 pb-4">
              <Card tone="primary">
                <h3 className="text-title text-on-primary-container">
                  本人の回答
                </h3>
                {canSelfReport === "difficult" && (
                  <p className="mt-2 text-support text-on-surface-variant">
                    最初の質問で「本人が説明するのは難しい」が選ばれたため、本人の回答はすべて「回答困難」です。
                  </p>
                )}
                <dl className="divide-y divide-outline-variant">
                  {buildPatientRows(patient).map((row) => (
                    <RowView key={row.key} row={row} asUnknown={row.required} />
                  ))}
                </dl>
              </Card>

              <Card tone="secondary">
                <h3 className="text-title text-on-secondary-container">
                  家族・介護者の回答
                </h3>
                <dl className="divide-y divide-outline-variant">
                  {familyRows.map((row) => (
                    <RowView key={row.key} row={row} asUnknown={row.required} />
                  ))}
                </dl>
              </Card>
            </div>
          )}
        </Card>

      </div>
      )}
    </>
  );
}
