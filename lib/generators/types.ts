export type GeneratorCategory =
  | "social"
  | "funnels"
  | "email"
  | "sales"
  | "ads"
  | "video"
  | "offers";

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
  { key: "social", label: "Social Media", icon: "instagram" },
  { key: "funnels", label: "Funnels", icon: "funnel" },
  { key: "email", label: "Email", icon: "email" },
  { key: "sales", label: "Sales", icon: "sales" },
  { key: "ads", label: "Ads", icon: "ad" },
  { key: "video", label: "Video", icon: "video" },
  { key: "offers", label: "Offers", icon: "offer" },
];
