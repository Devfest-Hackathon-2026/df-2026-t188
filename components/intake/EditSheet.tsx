// 見直しの「編集」で画面の真ん中に開くシート。その項目の質問を、元の画面と同じ部品で出す。
// 閉じられるのは「なおす」「やめる」、Esc、ブラウザの「戻る」やスワイプだけ。
// シートの外を押しても、下に引いても閉じない。
// 標準の <dialog> の showModal を使うので、開いている間は後ろの画面を押せず、
// 読み上げ機能でも移れない
import { useEffect, useRef, useState } from "react";
import { FieldCard } from "@/components/intake/FieldCard";
import { FamilyField, type FamilyFieldKey } from "@/components/intake/IntakeField";
import { Button } from "@/components/ui/Button";
import type { FamilyAnswers } from "@/lib/intake/types";

// シートで直せるのは、保護者の項目だけ。こどもの項目は「こども」の画面で、お子さんと一緒に直す
export type EditTarget = { title: string; field: FamilyFieldKey };

// 見直しの「編集」で、押した項目と一緒に保存する項目
const SAVED_TOGETHER: Partial<Record<FamilyFieldKey, FamilyFieldKey[]>> = {
  chiefConcern: ["chiefConcern", "concernChoices"],
};

// 閉じる動きの時間。globals.css の .edit-sheet[data-closing] と合わせる
const CLOSE_ANIMATION_MS = 180;

type EditSheetProps = {
  target: EditTarget;
  isClosing: boolean; // 履歴が戻り、閉じる動きの最中
  family: FamilyAnswers;
  onSave: (update: Partial<FamilyAnswers>) => void;
  onRequestClose: () => void; // 履歴を1つ戻す。戻った結果として閉じる
  onClosed: () => void; // 閉じる動きが終わった
};

export function EditSheet({
  target,
  isClosing,
  family,
  onSave,
  onRequestClose,
  onClosed,
}: EditSheetProps) {
  // 下書き。「なおす」を押すまで、本当の回答は変えない
  const [draft, setDraft] = useState(family);
  const [hasInvalidInput, setHasInvalidInput] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 開く。フォーカスは入力欄ではなくシートの先頭に置く（開いた瞬間にキーボードを出さない）
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // 片付けで dialog.close() は呼ばない。close の知らせが「閉じる操作」として届いてしまう。
    // シートが画面から消えれば、dialog も一緒に消える
    if (!dialog.open) dialog.showModal();
    contentRef.current?.focus({ preventScroll: true });
  }, []);

  // 開いている間は、後ろの画面をスクロールさせない。iPhone でも効くよう body を固定する
  useEffect(() => {
    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // キーボードが出ても、入力欄と「なおす」が隠れないようにする。
  // iPhone の Safari は画面の高さを変えないので、実際に見えている範囲（visualViewport）に合わせる
  useEffect(() => {
    const viewport = window.visualViewport;
    const dialog = dialogRef.current;
    const content = contentRef.current;
    if (!viewport || !dialog || !content) return;

    const showFocusedInput = () => {
      const active = document.activeElement;
      if (
        !(active instanceof HTMLInputElement) &&
        !(active instanceof HTMLTextAreaElement)
      ) {
        return;
      }
      const inputRect = active.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      if (inputRect.top < contentRect.top) {
        content.scrollTop -= contentRect.top - inputRect.top + 16;
      } else if (inputRect.bottom > contentRect.bottom) {
        content.scrollTop += inputRect.bottom - contentRect.bottom + 16;
      }
    };

    const fitToViewport = () => {
      // 見えている範囲の真ん中に置き、高さは範囲の 85% までにする
      const hiddenBelow =
        window.innerHeight - viewport.height - viewport.offsetTop;
      dialog.style.top = `${viewport.offsetTop}px`;
      dialog.style.bottom = `${Math.max(0, hiddenBelow)}px`;
      dialog.style.maxHeight = `${viewport.height * 0.85}px`;
      showFocusedInput();
    };

    fitToViewport();
    viewport.addEventListener("resize", fitToViewport);
    viewport.addEventListener("scroll", fitToViewport);
    dialog.addEventListener("focusin", showFocusedInput);
    return () => {
      viewport.removeEventListener("resize", fitToViewport);
      viewport.removeEventListener("scroll", fitToViewport);
      dialog.removeEventListener("focusin", showFocusedInput);
    };
  }, []);

  // 閉じる動きが終わったら、シートを消す。動きを減らす設定のときは、すぐに消す
  useEffect(() => {
    if (!isClosing) return;
    const reducesMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = setTimeout(onClosed, reducesMotion ? 0 : CLOSE_ANIMATION_MS);
    return () => clearTimeout(timer);
    // onClosed は毎回作り直されるので、依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClosing]);

  const save = () => {
    // 形の違う入力があるときは閉じない。前の正しい値を消さないため
    if (hasInvalidInput) {
      dialogRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
      return;
    }
    // 1つの項目でも、一緒に保存する項目がある（気になる症状は、選択肢とその他の自由記載）
    onSave(
      Object.fromEntries(
        (SAVED_TOGETHER[target.field] ?? [target.field]).map((field) => [field, draft[field]]),
      ),
    );
    onRequestClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${target.title}をなおす`}
      data-closing={isClosing || undefined}
      className="edit-sheet"
      // Esc は「やめる」と同じ。dialog が自分で閉じないよう止めて、履歴を戻す
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      // ブラウザが cancel を止めさせずに閉じたときも、履歴を戻してそろえる
      onClose={onRequestClose}
    >
      {/* flex-1 を使わない。高さを決めていない入れ物の中で flex-1 にすると、
          iPhone の Safari ではこの部分の高さが 0 につぶれる。
          中身の高さのままにして、入りきらないときだけ縮めてスクロールする */}
      <div
        ref={contentRef}
        tabIndex={-1}
        className="min-h-0 overflow-y-auto overscroll-contain p-4 outline-none"
      >
        <FieldCard bare>
          <FamilyField
            field={target.field}
            answers={draft}
            onChange={(update) => setDraft((prev) => ({ ...prev, ...update }))}
            onInvalidChange={setHasInvalidInput}
          />
        </FieldCard>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-outline-variant bg-surface-container-lowest px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button variant="outlined" onClick={onRequestClose}>
          やめる
        </Button>
        <Button onClick={save}>なおす</Button>
      </div>
    </dialog>
  );
}
