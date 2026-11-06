import type { ReactNode } from "react";

// 入力の1項目のまとまり
export function FieldCard({
  bare = false,
  children,
}: {
  bare?: boolean; // true のときは白いカードにしない（中に並べるカードと二重の枠にならないように）
  children: ReactNode;
}) {
  return (
    <section
      className={
        bare ? "" : "card-frame rounded-lg bg-surface-container-lowest p-4"
      }
    >
      {children}
    </section>
  );
}
