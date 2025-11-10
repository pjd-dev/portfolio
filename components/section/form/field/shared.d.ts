export interface FieldConfig {
  label: string;
  placeholder: string;
  error?: string;
  options?: Array<{ value: string; label: string }>;
}
