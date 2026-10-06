import type { ButtonHTMLAttributes } from "react";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" | "danger" };
const variants = { primary: "button primary", secondary: "button secondary", quiet: "button quiet", danger: "button danger" } as const;
export function Button({ variant = "secondary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`${variants[variant]} ${className}`.trim()} {...props} />;
}
