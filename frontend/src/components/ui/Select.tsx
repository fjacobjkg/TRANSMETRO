import type { SelectHTMLAttributes } from "react";
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string };
export function Select({ placeholder, children, ...props }: SelectProps) {
  return <select {...props}>{placeholder && <option value="">{placeholder}</option>}{children}</select>;
}
