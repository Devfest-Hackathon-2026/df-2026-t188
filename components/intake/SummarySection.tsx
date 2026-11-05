import { useEffect, useState } from "react";
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
    <p className="mt-1 text-lg text-zinc-600">{emptyText}</p>
  ) : (
    <p className="mt-1 text-lg break-words whitespace-pre-wrap">{text}</p>
  );
}

export function SummarySection({ status }: { status: SummaryStatus }) {
  return (
    <section className="rounded-xl border-2 border-zinc-400 p-4">
      <h2 className="text-xl font-bold">AIによる要約</h2>
      <p className="mt-2 rounded-lg bg-zinc-200 p-2 text-base font-bold text-zinc-900">
        患者・家族が入力した内容を AI が整理したものです。診断ではありません。
      </p>

      {status.kind === "loading" && (
        <p role="status" className="mt-3 text-lg">
          要約を作っています…
        </p>
      )}

      {status.kind === "empty" && (
        <p className="mt-3 text-lg">要約する回答がありません。</p>
      )}

      {status.kind === "failed" && (
        <div role="alert" className="mt-3 flex flex-col gap-3">
          <p className="text-lg font-bold text-red-700">
            要約を作れませんでした。下の元の回答をご覧ください
          </p>
          <button
            type="button"
            onClick={status.retry}
            className="min-h-14 rounded-xl border-2 border-zinc-400 bg-background px-3 py-2 text-lg font-medium"
          >
            もう一度試す
          </button>
        </div>
      )}

      {status.kind === "over_limit" && (
        <div role="alert" className="mt-3">
          <p className="text-lg font-bold text-red-700">
            文字数が上限（{SUMMARY_TEXT_LIMIT}
            文字）を超えている欄があるため、要約を作っていません。下の元の回答をご覧ください
          </p>
          <ul className="mt-2 list-disc pl-6 text-lg">
            {status.fields.map((field) => (
              <li key={`${field.respondent}-${field.label}`}>
                {RESPONDENT_LABEL[field.respondent]}：{field.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status.kind === "ready" && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="rounded-xl border-l-8 border-blue-700 bg-blue-700/10 px-4 py-3">
            <h3 className="text-base font-bold text-blue-700">
              本人の回答の要約
            </h3>
            <SummaryText
              text={status.summary.patientSummary}
              emptyText="要約する本人の回答がありません。"
            />
          </div>
          <div className="rounded-xl border-l-8 border-emerald-700 bg-emerald-700/10 px-4 py-3">
            <h3 className="text-base font-bold text-emerald-700">
              介在者（家族・介護者）の回答の要約
            </h3>
            <SummaryText
              text={status.summary.familySummary}
              emptyText="要約する介在者の回答がありません。"
            />
          </div>
          <div className="rounded-xl border-2 border-zinc-400 px-4 py-3">
            <h3 className="text-base font-bold">
              本人と介在者で食い違っている点（AIが見つけたもの）
            </h3>
            {status.summary.discrepancies.length === 0 ? (
              <p className="mt-1 text-lg text-zinc-600">なし</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-3 text-lg">
                {status.summary.discrepancies.map((item, index) => (
                  <li key={index} className="break-words whitespace-pre-wrap">
                    <span className="font-bold">{item.topic}</span>
                    <br />
                    <span className="text-blue-700">本人：</span>
                    {item.patient}
                    <br />
                    <span className="text-emerald-700">介在者：</span>
                    {item.family}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
