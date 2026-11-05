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

type DoctorScreenProps = {
  canSelfReport: IntakeState["canSelfReport"];
  patient: PatientAnswers;
  family: FamilyAnswers;
  onEditPatient: () => void;
  onEditFamily: () => void;
};

const RESPONDENT_LABEL = { patient: "本人", family: "家族・介護者" } as const;

// 回答は入力どおりに表示する。言い換えや要約はしない
function RowView({ row, asUnknown }: { row: AnswerRow; asUnknown: boolean }) {
  return (
    <div className="py-3">
      <dt className="text-base font-bold">{row.label}</dt>
      {row.state === "answered" ? (
        <dd className="mt-1 text-lg break-words whitespace-pre-wrap">
          {row.text}
        </dd>
      ) : (
        <dd
          className={`mt-1 text-lg font-bold ${
            asUnknown ? "text-red-700" : "text-zinc-600"
          }`}
        >
          {missingStateLabel(row.state, asUnknown)}
        </dd>
      )}
    </div>
  );
}

export function DoctorScreen({
  canSelfReport,
  patient,
  family,
  onEditPatient,
  onEditFamily,
}: DoctorScreenProps) {
  const unknownRows = getUnknownRows(patient, family);

  return (
    <>
      <p className="sticky top-0 z-10 bg-zinc-800 px-4 py-3 text-center text-xl font-bold text-white">
        医師に見せる画面
      </p>
      <div className="flex flex-col gap-6 px-4 py-6">
        <section className="rounded-xl border-2 border-dashed border-zinc-400 p-4">
          <h2 className="text-xl font-bold">AIによる要約（準備中）</h2>
        </section>

        <details open className="rounded-xl border-2 border-zinc-400">
          <summary className="min-h-14 cursor-pointer px-4 py-3 text-xl font-bold">
            詳しく見る（入力されたとおりの回答）
          </summary>
          <div className="flex flex-col gap-6 px-4 pb-4">
            <section className="rounded-xl border-4 border-red-700 p-4">
              <h2 className="text-xl font-bold text-red-700">
                不明の項目（{unknownRows.length}件）
              </h2>
              {unknownRows.length === 0 ? (
                <p className="mt-2 text-lg">必須の項目に不明はありません。</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2 text-lg">
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
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold">主訴</h2>
              <dl className="flex flex-col gap-3">
                <div className="rounded-xl border-l-8 border-blue-700 bg-blue-700/10 px-4">
                  <RowView row={patientChiefRow(patient)} asUnknown />
                </div>
                <div className="rounded-xl border-l-8 border-emerald-700 bg-emerald-700/10 px-4">
                  <RowView row={familyChiefRow(family)} asUnknown />
                </div>
              </dl>
            </section>

            <section className="rounded-xl border-l-8 border-blue-700 bg-blue-700/10 px-4 py-3">
              <h2 className="text-xl font-bold text-blue-700">本人の回答</h2>
              {canSelfReport === "difficult" && (
                <p className="mt-2 text-base">
                  最初の質問で「本人が説明するのは難しい」が選ばれたため、本人の回答はすべて「回答困難」です。
                </p>
              )}
              <dl className="divide-y divide-blue-700/30">
                {buildPatientRows(patient).map((row) => (
                  <RowView key={row.key} row={row} asUnknown={row.required} />
                ))}
              </dl>
            </section>

            <section className="rounded-xl border-l-8 border-emerald-700 bg-emerald-700/10 px-4 py-3">
              <h2 className="text-xl font-bold text-emerald-700">
                家族・介護者の回答
              </h2>
              <dl className="divide-y divide-emerald-700/30">
                {buildFamilyRows(family).map((row) => (
                  <RowView key={row.key} row={row} asUnknown={row.required} />
                ))}
              </dl>
            </section>
          </div>
        </details>

        <div className="flex flex-col gap-3">
          <p className="text-lg font-bold">戻って直す</p>
          <button
            type="button"
            onClick={onEditPatient}
            className="min-h-14 rounded-xl border-2 border-blue-700 bg-background px-3 py-2 text-lg font-medium"
          >
            本人の回答を直す
          </button>
          <button
            type="button"
            onClick={onEditFamily}
            className="min-h-14 rounded-xl border-2 border-emerald-700 bg-background px-3 py-2 text-lg font-medium"
          >
            家族・介護者の回答を直す
          </button>
        </div>
      </div>
    </>
  );
}
