import type { ComponentProps } from "react";

// M3 のボタン。filled＝主な操作、tonal＝選択済み、outlined＝戻るなど、text＝控えめな操作
type Variant = "filled" | "tonal" | "outlined" | "text";
type Tone = "primary" | "secondary";

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  tone?: Tone;
  size?: "md" | "lg";
};

const VARIANT_CLASS: Record<Variant, Record<Tone, string>> = {
  filled: {
    primary: "bg-primary text-on-primary",
    secondary: "bg-secondary text-on-secondary",
  },
  tonal: {
    primary: "bg-primary-container text-on-primary-container",
    secondary: "bg-secondary-container text-on-secondary-container",
  },
  outlined: {
    primary: "border border-outline text-primary",
    secondary: "border border-outline text-secondary",
  },
  text: {
    primary: "text-primary",
    secondary: "text-secondary",
  },
};

const SIZE_CLASS = {
  md: "min-h-14 text-label",
  lg: "min-h-18 text-title",
};

export function Button({
  variant = "filled",
  tone = "primary",
  size = "md",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`press-feedback inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant][tone]} ${className}`}
      {...props}
    />
  );
}
