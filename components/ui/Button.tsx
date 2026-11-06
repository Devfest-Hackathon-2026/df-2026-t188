import type { ComponentProps } from "react";

// ボタン。filled＝主な操作（緑）、tonal＝選択済み、outlined＝控えめな操作、text＝もっと控えめな操作。
// filled・tonal・outlined には、デザイン案の「下だけ厚い縁」を付ける
type Variant = "filled" | "tonal" | "outlined" | "text";

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: "md" | "lg";
};

const VARIANT_CLASS: Record<Variant, string> = {
  filled:
    "chunky bg-primary text-on-primary font-bold [--chunky-edge:var(--color-primary-shade)]",
  tonal:
    "chunky border-2 border-primary bg-primary-container text-on-primary-container font-bold [--chunky-edge:var(--color-primary-shade)]",
  outlined:
    "chunky border-2 border-card-line bg-surface-container-lowest text-on-surface font-bold",
  text: "text-primary font-bold",
};

const SIZE_CLASS = {
  md: "min-h-14 text-label",
  lg: "min-h-18 text-title",
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
      className={`press-feedback inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
}
