// パンくずリスト。進んだ分だけ項目が増える。
// 今いる画面と、それまでに通った画面だけを出し、通った画面へは押して移れる。
// 画面には短い名前を出し、読み上げ機能には正式な名前を伝える。
// 1つ前の画面に戻るボタンは、別に左上の「もどる」（BackButton）がある
export type BreadcrumbItem<K extends string> = {
  key: K;
  label: string; // 画面に出す短い名前（例：「確認」）
  fullName: string; // 読み上げ機能に伝える正式な名前（例：「説明できるか」）
  isCurrent: boolean;
};

type BreadcrumbProps<K extends string> = {
  items: BreadcrumbItem<K>[];
  onSelect: (key: K) => void;
};

// 押せる場所は縦横 48px 以上にする。
// 5つ並んでも幅 375px で1行に収まるよう、区切りの「＞」の左右の余白は 2px にしている。
// 名前の途中で折り返さない
const ITEM_CLASS =
  "inline-flex min-h-12 min-w-12 items-center justify-center px-1 text-support whitespace-nowrap";

function ItemName({ item }: { item: BreadcrumbItem<string> }) {
  return (
    <>
      <span aria-hidden="true">{item.label}</span>
      <span className="sr-only">{item.fullName}</span>
    </>
  );
}

export function Breadcrumb<K extends string>({
  items,
  onSelect,
}: BreadcrumbProps<K>) {
  return (
    <nav aria-label="いまの場所" className="px-3">
      <ol className="flex items-center">
        {items.map((item, index) => (
          <li key={item.key} className="crumb-enter flex items-center">
            {index > 0 && (
              <span aria-hidden="true" className="px-0.5 text-on-surface-variant">
                ＞
              </span>
            )}
            {item.isCurrent ? (
              <span
                aria-current="step"
                className={`${ITEM_CLASS} font-bold text-on-surface`}
              >
                <ItemName item={item} />
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSelect(item.key)}
                className={`${ITEM_CLASS} press-feedback rounded-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-on-surface`}
              >
                <ItemName item={item} />
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
