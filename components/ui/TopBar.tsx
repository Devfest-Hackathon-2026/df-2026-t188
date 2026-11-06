// 画面名の帯。だれが答えている画面かを、色と文字の両方で示す。
// 画面の見出しでもあり、画面が切り替わったときにフォーカスを受け取る
export type TopBarTone = "patient" | "family" | "neutral";

const TONE_CLASS: Record<TopBarTone, string> = {
  patient: "bg-patient text-on-patient", // 本人（青系）
  family: "bg-family text-on-family", // 保護者（紫系）
  neutral: "bg-inverse-surface text-inverse-on-surface", // そのほかの画面
};

export function TopBar({
  tone,
  children,
}: {
  tone: TopBarTone;
  children: string;
}) {
  return (
    <h1
      tabIndex={-1}
      data-screen-heading
      className={`px-4 py-2 text-center text-title outline-none ${TONE_CLASS[tone]}`}
    >
      {children}
    </h1>
  );
}
