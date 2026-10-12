type InputKind = "text" | "number" | "password" | "email" | "select" | "textarea" | "datetime-local";
export type Field = { name: string; label: string; kind?: InputKind; required?: boolean; min?: number; max?: number; step?: string; minLength?: number; options?: Array<{ label: string; value: string }>; pathOnly?: boolean };
export type Resource = {
  key: string; title: string; description: string; helpText?: string; path: string; method?: "POST" | "PUT" | "PATCH";
  writePath?: (values: Record<string, string>) => string; fields?: Field[]; body?: (values: Record<string, string>) => unknown;
};

