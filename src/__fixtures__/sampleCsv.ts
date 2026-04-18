/** Minimal CSV fragments for tests (derived from YNAB export shape). */

export const REGISTER_FIXTURE = `"Account","Flag","Date","Payee","Category Group/Category","Category Group","Category","Memo","Outflow","Inflow","Cleared"
"Checking","","15/01/2024","Employer","Inflow: Ready to Assign","Inflow","Ready to Assign","Paycheck",$0.00,$5000.00,"Cleared"
"Checking","","16/01/2024","Store","Food: Groceries","Food","Groceries","",$50.00,$0.00,"Cleared"
"Checking","","16/01/2024","Cafe","Food: Groceries","Food","Groceries","",$12.00,$0.00,"Cleared"
`;

export const PLAN_FIXTURE = `"Month","Category Group/Category","Category Group","Category","Assigned","Activity","Available"
"Jan 2024","Food: Groceries","Food","Groceries",$100.00,-$62.00,$38.00
"Feb 2024","Food: Groceries","Food","Groceries",$100.00,-$40.00,$60.00
`;
