// パンくずリスト。いまの場所を示し、すでに通った画面へ移れるようにする
export type BreadcrumbItem<K extends string> = {
  key: K;
  label: string;
  state:
    | "current" // 今いる画面（強調して表示し、押せない）
    | "visited" // すでに通った画面（押すと移れる）
    | "upcoming" // まだ進んでいない画面（押せない）
    | "skipped"; // 飛ばした画面（押せない）
};

type BreadcrumbProps<K extends string> = {
  items: BreadcrumbItem<K>[];
  onSelect: (key: K) => void;
};

// 押せる場所は 48px 以上の高さにする
const ITEM_CLASS = "inline-flex min-h-12 items-center px-1 text-support";

export function Breadcrumb<K extends string>({
  items,
  onSelect,
}: BreadcrumbProps<K>) {
  return (
    <nav aria-label="いまの場所" className="px-3 pt-2">
      <ol className="flex flex-wrap items-center">
        {items.map((item, index) => (
          <li key={item.key} className="flex items-center">
            {index > 0 && (
              <span aria-hidden="true" className="px-1 text-on-surface-variant">
                ＞
              </span>
            )}
            {item.state === "visited" && (
              <button
                type="button"
                onClick={() => onSelect(item.key)}
                className={`${ITEM_CLASS} press-feedback rounded-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-on-surface`}
              >
                {item.label}
              </button>
            )}
            {item.state === "current" && (
              <span
                aria-current="step"
                className={`${ITEM_CLASS} font-bold text-on-surface`}
              >
                {item.label}
              </span>
            )}
            {item.state === "upcoming" && (
              <span className={`${ITEM_CLASS} text-on-surface-variant`}>
                {item.label}
              </span>
            )}
            {item.state === "skipped" && (
              <span className={`${ITEM_CLASS} text-on-surface-variant`}>
                <span className="line-through">{item.label}</span>
                （とばしました）
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
