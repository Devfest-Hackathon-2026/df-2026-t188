// ブラウザの履歴と、問診の画面の並びをそろえる。
// 履歴の並びを通る画面の順番と同じに保つので、ブラウザの「戻る」やスワイプが、
// 左上の「もどる」と同じ戻り先になる。
//
// 履歴に入れるのは、起動ごとの番号、何番目か、画面の名前だけ。
// 回答は履歴にも URL にも入れない（URL は変えない）
import { useEffect, useEffectEvent, useRef } from "react";

const HISTORY_KEY = "intakeStep";

type StepEntry<S extends string> = {
  run: string; // 起動ごとの番号。再読み込みの前の履歴と見分ける
  position: number; // 履歴の中で何番目か（最初の画面が 0）
  step: S;
  sheet?: boolean; // シートを開いたときに積んだ履歴。「戻る」でシートを閉じるためのもの
};

function readEntry<S extends string>(state: unknown): StepEntry<S> | null {
  if (typeof state !== "object" || state === null) return null;
  const entry = (state as Record<string, unknown>)[HISTORY_KEY];
  return typeof entry === "object" && entry !== null
    ? (entry as StepEntry<S>)
    : null;
}

// Next.js が履歴に入れている内容を消さないよう、足す形で書く
function withEntry<S extends string>(entry: StepEntry<S>) {
  return { ...window.history.state, [HISTORY_KEY]: entry };
}

type StepHistoryOptions<S extends string> = {
  firstStep: S;
  // その画面に移ってよいか。いまは通れない画面なら、履歴を元の位置に戻して何もしない
  canArrive: (step: S) => boolean;
  // ブラウザの「戻る」「進む」や goBack の結果、その画面に着いたとき
  onArrive: (step: S) => void;
  // 入力があるか。あれば、ページを離れる前に確認を出す
  hasInput: boolean;
};

export function useStepHistory<S extends string>({
  firstStep,
  canArrive,
  onArrive,
  hasInput,
}: StepHistoryOptions<S>) {
  const runRef = useRef<string | null>(null);
  const positionRef = useRef(0);
  const isRewinding = useRef(false); // 再読み込みのあと、最初の位置まで戻している最中か
  const ignoreNextPop = useRef(false); // 通れない画面から元の位置に戻している最中か

  const markFirstEntry = useEffectEvent((run: string) => {
    positionRef.current = 0;
    window.history.replaceState(
      withEntry({ run, position: 0, step: firstStep }),
      "",
    );
  });

  const handlePopState = useEffectEvent((event: PopStateEvent) => {
    const run = runRef.current;
    if (run === null) return;

    if (isRewinding.current) {
      isRewinding.current = false;
      markFirstEntry(run);
      return;
    }
    if (ignoreNextPop.current) {
      ignoreNextPop.current = false;
      return;
    }

    const entry = readEntry<S>(event.state);
    if (!entry) return;

    // 再読み込みの前の履歴や、いまは通れない画面には移らず、元の位置に戻す。
    // シートの履歴にも「進む」では移らない（閉じたシートを開き直さない）
    if (entry.run !== run || entry.sheet || !canArrive(entry.step)) {
      const delta = positionRef.current - entry.position;
      if (delta !== 0) {
        ignoreNextPop.current = true;
        window.history.go(delta);
      }
      return;
    }

    positionRef.current = entry.position;
    onArrive(entry.step);
  });

  useEffect(() => {
    // 画面の切り替えのときに一番上を表示する作りなので、ブラウザの自動の位置戻しは切る
    window.history.scrollRestoration = "manual";

    const listener = (event: PopStateEvent) => handlePopState(event);
    window.addEventListener("popstate", listener);

    // 開発モードでは、この処理が2回走る。起動の番号が同じなら、もう準備は済んでいる
    if (runRef.current === null) {
      const run = Math.random().toString(36).slice(2);
      runRef.current = run;
      const previous = readEntry<S>(window.history.state);
      if (previous && previous.position > 0) {
        // 再読み込みのあとは最初の画面から始まるので、履歴も最初の位置に戻す
        isRewinding.current = true;
        window.history.go(-previous.position);
      } else {
        markFirstEntry(run);
      }
    }

    return () => window.removeEventListener("popstate", listener);
  }, []);

  // 再読み込み、タブを閉じる、最初の画面でさらに「戻る」のとき。文言はブラウザが決める
  useEffect(() => {
    if (!hasInput) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasInput]);

  return {
    // 先の画面へ進むとき。間の画面も順番に積む
    pushSteps(steps: S[]) {
      const run = runRef.current;
      if (run === null) return;
      for (const step of steps) {
        const position = positionRef.current + 1;
        window.history.pushState(withEntry({ run, position, step }), "");
        positionRef.current = position;
      }
    },
    // シートを開くとき。今の画面の上に履歴を1つ積む。閉じるときは goBack(1) で戻す
    pushSheet(step: S) {
      const run = runRef.current;
      if (run === null) return;
      const position = positionRef.current + 1;
      window.history.pushState(
        withEntry({ run, position, step, sheet: true }),
        "",
      );
      positionRef.current = position;
    },
    // 前の画面へ戻るとき。履歴が戻った結果として onArrive が呼ばれる
    goBack(count: number) {
      window.history.go(-count);
    },
  };
}
