// だれの回答か、要確認かを示す小さなバッジ。色と文字の両方で区別する
type Kind = "patient" | "family" | "confirm";

const KIND_CLASS: Record<Kind, string> = {
  patient: "bg-primary-container text-on-primary-container", // 本人
  family: "bg-secondary-container text-on-secondary-container", // 家族
  confirm: "bg-caution-container text-on-caution-container", // 要確認・不明
};

export const RESPONDENT_BADGE = {
  patient: { kind: "patient", label: "本人" },
  family: { kind: "family", label: "家族" },
} as const;

export function Badge({ kind, children }: { kind: Kind; children: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-sm px-2 py-0.5 text-support font-bold ${KIND_CLASS[kind]}`}
    >
      {children}
    </span>
  );
}
