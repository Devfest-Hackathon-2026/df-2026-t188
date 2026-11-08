import type { ComponentProps } from "react";

// ボタン。filled＝主な操作（青）、tonal＝選択済み、outlined＝控えめな操作、text＝もっと控えめな操作、
// light＝全面が青い画面の上の白いボタン。
// filled・tonal・outlined・light には、デザイン案の「下だけ厚い縁」を付ける
type Variant = "filled" | "tonal" | "outlined" | "text" | "light";

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: "md" | "lg";
};

// filled の白い文字は、大きい文字（title、22px の太字）だけにする。青との比が 4.10:1 のため
const VARIANT_CLASS: Record<Variant, string> = {
  filled:
    "chunky bg-primary text-on-primary text-title shadow-button [--chunky-edge:var(--color-primary-shade)]",
  tonal:
    "chunky border-2 border-primary bg-primary-container text-on-primary-container font-bold [--chunky-edge:var(--color-primary-shade)]",
  outlined:
    "chunky border-2 border-card-line bg-surface-container-lowest text-on-surface font-bold",
  text: "text-link font-bold",
  light:
    "chunky bg-surface-container-lowest text-link text-title [--chunky-edge:rgb(0_88_128/0.25)]",
};

const SIZE_CLASS = {
  md: "min-h-14",
  lg: "min-h-18",
};

// filled と light は文字の大きさが決まっている。それ以外は size で変える
const TEXT_CLASS: Record<"md" | "lg", string> = {
  md: "text-label",
  lg: "text-title",
};

export function Button({
  variant = "filled",
  size = "md",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`press-feedback inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${SIZE_CLASS[size]} ${
        variant === "filled" || variant === "light" ? "" : TEXT_CLASS[size]
      } ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
}
