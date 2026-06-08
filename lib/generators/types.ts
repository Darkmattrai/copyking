export type GeneratorCategory =
  | "foundation"
  | "lead-gen"
  | "traffic-system"
  | "sales-system";

export interface ParamDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface GeneratorDef {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: GeneratorCategory;
  params?: ParamDef[];
  outputFormat: "markdown" | "structured";
}

export interface CategoryMeta {
  key: GeneratorCategory;
  label: string;
  icon: string;
}

export const GENERATOR_CATEGORIES: CategoryMeta[] = [
  { key: "foundation", label: "Foundation", icon: "target" },
  { key: "lead-gen", label: "Lead Gen", icon: "funnel" },
  { key: "traffic-system", label: "Traffic System", icon: "megaphone" },
  { key: "sales-system", label: "Sales System", icon: "sales" },
];
