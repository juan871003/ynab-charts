import { z } from "zod";

export const rawRegisterRowSchema = z.object({
  Account: z.string(),
  Flag: z.string().optional(),
  Date: z.string(),
  Payee: z.string(),
  "Category Group/Category": z.string(),
  "Category Group": z.string(),
  Category: z.string(),
  Memo: z.string(),
  Outflow: z.string(),
  Inflow: z.string(),
  Cleared: z.string(),
});

export type RawRegisterRow = z.infer<typeof rawRegisterRowSchema>;

export interface NormalizedTransaction {
  account: string;
  date: Date;
  payee: string;
  categoryGroupCategory: string;
  categoryGroup: string;
  category: string;
  memo: string;
  outflow: number;
  inflow: number;
  cleared: string;
}

export const rawPlanRowSchema = z.object({
  Month: z.string(),
  "Category Group/Category": z.string(),
  "Category Group": z.string(),
  Category: z.string(),
  Assigned: z.string(),
  Activity: z.string(),
  Available: z.string(),
});

export type RawPlanRow = z.infer<typeof rawPlanRowSchema>;

export interface PlanRow {
  monthLabel: string;
  monthDate: Date;
  categoryGroupCategory: string;
  categoryGroup: string;
  category: string;
  assigned: number;
  activity: number;
  available: number;
}

/** Treemap / table filter from chart interaction */
export interface CategorySelection {
  categoryGroup?: string;
  category?: string;
}
