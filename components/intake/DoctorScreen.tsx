import { useEffect, useRef, useState } from "react";
import { AnswerValue } from "@/components/intake/AnswerValue";
import { DoctorSkeleton } from "@/components/intake/DoctorSkeleton";
import {
  SummarySection,
  useSummary,
  type SummaryCache,
} from "@/components/intake/SummarySection";
import { Badge } from "@/components/ui/Badge";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
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
  getUnknownRows,
  missingStateLabel,
  safetyNotice,
  type SafetyNotice,
} from "@/lib/intake/unknowns";
import type { PatientSymptoms } from "@/lib/intake/symptoms";
import { withComposedConcern } from "@/lib/intake/concern";
import { buildSummaryInput } from "@/lib/summary/input";

type DoctorScreenProps = {
  canSelfReport: IntakeState["canSelfReport"];
  patient: PatientAnswers;
  symptoms: PatientSymptoms; // こどもの主症状と「ほかに きになること」（言葉で出すだけ。Gemini には送らない）
  family: FamilyAnswers;
  summaryCache: SummaryCache | null;
  onSummaryReady: (cache: SummaryCache) => void;
  onFinish: () => void; // 終了の画面へ
};

const RESPONDENT_LABEL = { patient: "本人", family: "保護者" } as const;

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

// アレルギーと飲んでいる薬の1行。AI を通さず、ルールだけで出す。
// 「ある」は目立たせ、長い内容は切らずに折り返す。「未確認」は小さめの1行
function SafetyLine({ notice }: { notice: SafetyNotice }) {
  return notice.kind === "present" ? (
    <p className="rounded-md bg-caution-container px-3 py-2 text-body font-bold break-words whitespace-pre-wrap text-on-caution-container">
      {notice.text}
    </p>
  ) : (
    <p className="px-1 text-support text-on-surface-variant">{notice.text}</p>
  );
}

export function DoctorScreen({
  canSelfReport,
  patient,
  symptoms,
  family,
  summaryCache,
  onSummaryReady,
  onFinish,
}: DoctorScreenProps) {
  const unknownRows = getUnknownRows(patient, family);
  const notices = [
    safetyNotice("アレルギー", family.allergies),
    safetyNotice("飲んでいる薬", family.medications),
  ].filter((notice) => notice !== null);

  const summaryStatus = useSummary(
    // 保護者から見た気になる症状は、選択肢と自由記載を1つの文にまとめて、今までの自由記載の欄として送る
    buildSummaryInput(patient, withComposedConcern(family)),
    summaryCache,
    onSummaryReady,
  );

  // 要約があるときは閉じておく。要約がないとき（失敗など）は最初から開いておく
  const hasSummary = summaryStatus.kind === "ready";
  const [isOpenedByUser, setIsOpenedByUser] = useState(false);
  const isDetailOpen = !hasSummary || isOpenedByUser;

  // 下のボタンで開いたら、開いた内容の先頭まで表示する
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpenedByUser) detailRef.current?.scrollIntoView({ block: "start" });
  }, [isOpenedByUser]);

  // 要約の作成中は、要約と「詳しく見る」の代わりにスケルトンを出す。
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
      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        {/* 読み上げ機能に、要約の作成中と完了を伝える */}
        <p role="status" aria-live="polite" className="sr-only">
          {statusMessage}
        </p>

        {notices.length > 0 && (
          <div className="flex flex-col gap-2">
            {notices.map((notice) => (
              <SafetyLine key={notice.text} notice={notice} />
            ))}
          </div>
        )}

        {isLoading ? (
          <DoctorSkeleton />
        ) : (
          <div className="stagger flex flex-col gap-4">
            <SummarySection status={summaryStatus} />

            {/* 要約がないときは下のボタンを出さないので、ここに見出しを置く */}
            {!hasSummary && <h2 className="text-title">詳しく見る</h2>}

            {isDetailOpen && (
              <div
                ref={detailRef}
                id="original-answers"
                className="flex scroll-mt-32 flex-col gap-4"
              >
                <Card tone="caution">
                  <h3 className="text-title">
                    不明の項目（{unknownRows.length}件）
                  </h3>
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
                  <h3 className="flex flex-wrap items-center gap-2 text-title">
                    本人の回答
                    <Badge kind="patient">本人</Badge>
                  </h3>
                  {canSelfReport === "difficult" && (
                    <p className="mt-2 text-support text-on-surface-variant">
                      最初の質問で「お子さんが答えるのは難しい」が選ばれたため、本人の回答はすべて「回答困難」です。
                    </p>
                  )}
                  <RowList rows={buildPatientRows(patient, symptoms)} />
                </Card>

                <Card>
                  <h3 className="flex flex-wrap items-center gap-2 text-title">
                    保護者の回答
                    <Badge kind="family">保護者</Badge>
                  </h3>
                  <p className="mt-1 text-support text-on-surface-variant">
                    入力されたとおりに表示しています。AIは通していません。
                  </p>
                  <RowList rows={buildFamilyRows(family)} />
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
      {/* 「詳しく見る」と「おわる」は下に固定する。要約が長くても、スクロールせずに押せる。
          要約の作成中は「おわる」を出さない（作成中の画面から離れないように） */}
      {!isLoading && (
        <BottomBar>
          {hasSummary && (
            <Button
              variant="outlined"
              aria-expanded={isDetailOpen}
              aria-controls="original-answers"
              onClick={() => setIsOpenedByUser((isOpen) => !isOpen)}
            >
              <ChevronIcon
                className={`h-6 w-6 ${isDetailOpen ? "-rotate-90" : "rotate-90"}`}
              />
              {isDetailOpen ? "閉じる" : "詳しく見る"}
            </Button>
          )}
          <Button onClick={onFinish}>問診をおわる</Button>
        </BottomBar>
      )}
    </>
  );
}
