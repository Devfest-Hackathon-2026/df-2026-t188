import type { ReactNode } from "react";

// 入力の1項目のまとまり。
// 見直し画面の「編集」から来たときに、この位置まで表示してフォーカスを移せるよう、
// 項目の名前を id に持つ
export function fieldId(field: string): string {
  return `field-${field}`;
}

export function FieldCard({
  field,
  bare = false,
  children,
}: {
  field: string;
  bare?: boolean; // true のときは白いカードにしない（中に並べるカードと二重の枠にならないように）
  children: ReactNode;
}) {
  return (
    <section
      id={fieldId(field)}
      tabIndex={-1}
      className={`scroll-mt-32 outline-none ${
        bare ? "" : "rounded-lg bg-surface-container-lowest p-4 shadow-card"
      }`}
    >
      {children}
    </section>
  );
}
