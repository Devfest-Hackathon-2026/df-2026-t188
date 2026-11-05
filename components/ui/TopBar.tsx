// 画面の上に常に出す帯。だれが答えている画面かを、色と文字の両方で示す
type Tone = "primary" | "secondary" | "inverse";

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary text-on-primary", // 本人
  secondary: "bg-secondary text-on-secondary", // 家族・介護者
  inverse: "bg-inverse-surface text-inverse-on-surface", // 医師に見せる画面
};

export function TopBar({ tone, children }: { tone: Tone; children: string }) {
  return (
    <p
      className={`sticky top-0 z-10 px-4 py-4 text-center text-title ${TONE_CLASS[tone]}`}
    >
      {children}
    </p>
  );
}
