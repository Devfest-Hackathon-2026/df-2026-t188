import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  findOverLimitFields,
  isEmptySummaryInput,
  type OverLimitField,
} from "@/lib/summary/input";
import {
  SUMMARY_TEXT_LIMIT,
  type Summary,
  type SummaryInput,
} from "@/lib/summary/types";
import { parseSummary } from "@/lib/summary/validate";

const CLIENT_TIMEOUT_MS = 25_000;

// 同じ内容を送り直さないよう、送った内容（key）と要約をセットで持つ
export type SummaryCache = { key: string; summary: Summary };

export type SummaryStatus =
  | { kind: "over_limit"; fields: OverLimitField[] }
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "failed"; retry: () => void }
  | { kind: "ready"; summary: Summary };

async function requestSummary(
  input: SummaryInput,
  signal: AbortSignal,
): Promise<Summary | null> {
  const response = await fetch("/api/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) return null;
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("summary" in body)) {
    return null;
  }
  return parseSummary(body.summary);
}

// 画面4を開いたときに要約を作る。送る内容が前回と同じなら、前の要約を使う
export function useSummary(
  input: SummaryInput,
  cache: SummaryCache | null,
  onReady: (cache: SummaryCache) => void,
): SummaryStatus {
  const key = JSON.stringify(input);
  const overLimitFields = findOverLimitFields(input);
  const isEmpty = isEmptySummaryInput(input);
  const cached = cache?.key === key ? cache.summary : null;
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const hasFailed = failedKey === key;
  const shouldRequest =
    overLimitFields.length === 0 && !isEmpty && !cached && !hasFailed;

  useEffect(() => {
    if (!shouldRequest) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    let isCurrent = true;

    requestSummary(JSON.parse(key) as SummaryInput, controller.signal)
      .catch(() => null)
      .then((summary) => {
        if (!isCurrent) return;
        if (summary) {
          onReady({ key, summary });
        } else {
          setFailedKey(key);
        }
      })
      .finally(() => clearTimeout(timer));

    // 作成中に別の画面へ移ったとき（または送る内容が変わったとき）は、
    // 通信を中止し、あとから届いても使わない。古い回答で作った要約を表示しないため
    return () => {
      isCurrent = false;
      clearTimeout(timer);
      controller.abort();
    };
    // onReady は毎回作り直されるので、依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, shouldRequest, attempt]);

  if (overLimitFields.length > 0) {
    return { kind: "over_limit", fields: overLimitFields };
  }
  if (isEmpty) return { kind: "empty" };
  if (cached) return { kind: "ready", summary: cached };
  if (hasFailed) {
    return {
      kind: "failed",
      retry: () => {
        setFailedKey(null);
        setAttempt((count) => count + 1);
      },
    };
  }
  return { kind: "loading" };
}

const RESPONDENT_LABEL = { patient: "本人", family: "家族・介護者" } as const;

function SummaryText({ text, emptyText }: { text: string; emptyText: string }) {
  return text === "" ? (
    <p className="mt-1 text-body text-on-surface-variant">{emptyText}</p>
  ) : (
    <p className="mt-1 text-body break-words whitespace-pre-wrap">{text}</p>
  );
}

// AI の要約。画面の中で一番目立つカード（青い枠）。
// 中は線と余白で区切り、カードの中にカードは入れない
export function SummarySection({ status }: { status: SummaryStatus }) {
  return (
    <Card tone="highlight">
      <h2 className="flex items-center gap-2 text-title">
        <span className="rounded-sm bg-inverse-surface px-2 py-1 text-label font-bold text-inverse-on-surface">
          AI
        </span>
        AIによる要約
      </h2>
      <p className="mt-2 rounded-sm bg-surface-container-highest p-2 text-body font-bold">
        患者・家族が入力した内容を AI が整理したものです。診断ではありません。
      </p>

      {status.kind === "empty" && (
        <p className="mt-4 text-body">要約する回答がありません。</p>
      )}

      {status.kind === "failed" && (
        <div role="alert" className="mt-4 flex flex-col gap-2">
          <p className="rounded-sm bg-caution-container p-2 text-body font-bold text-on-caution-container">
            要約を作れませんでした。下の元の回答をご覧ください
          </p>
          <Button variant="text" onClick={status.retry}>
            もう一度試す
          </Button>
        </div>
      )}

      {status.kind === "over_limit" && (
        <div
          role="alert"
          className="mt-4 rounded-sm bg-error-container p-3 text-on-error-container"
        >
          <p className="text-body font-bold">
            文字数が上限（{SUMMARY_TEXT_LIMIT}
            文字）を超えている欄があるため、要約を作っていません。下の元の回答をご覧ください
          </p>
          <ul className="mt-2 list-disc pl-6 text-body">
            {status.fields.map((field) => (
              <li key={`${field.respondent}-${field.label}`}>
                {RESPONDENT_LABEL[field.respondent]}：{field.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status.kind === "ready" && (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <h3 className="flex flex-wrap items-center gap-2 text-label font-bold">
              <Badge kind="patient">本人</Badge>
              本人の回答の要約
            </h3>
            <SummaryText
              text={status.summary.patientSummary}
              emptyText="要約する本人の回答がありません。"
            />
          </div>
          <div className="border-t border-outline-variant pt-4">
            <h3 className="flex flex-wrap items-center gap-2 text-label font-bold">
              <Badge kind="family">家族</Badge>
              介在者（家族・介護者）の回答の要約
            </h3>
            <SummaryText
              text={status.summary.familySummary}
              emptyText="要約する介在者の回答がありません。"
            />
          </div>
          <div className="border-t border-outline-variant pt-4">
            <h3 className="text-label font-bold">
              本人と介在者で食い違っている点（AIが見つけたもの）
            </h3>
            {status.summary.discrepancies.length === 0 ? (
              <p className="mt-1 text-body text-on-surface-variant">なし</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-4 text-body">
                {status.summary.discrepancies.map((item, index) => (
                  <li key={index} className="break-words whitespace-pre-wrap">
                    <span className="font-bold">{item.topic}</span>
                    <br />
                    <span className="font-bold text-patient">本人：</span>
                    {item.patient}
                    <br />
                    <span className="font-bold text-family">介在者：</span>
                    {item.family}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
