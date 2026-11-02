export type CurrencyCode = string;
export type TransactionType = "income" | "expense";
export interface LedgerTransaction {
    id: string;
    description: string;
    type: TransactionType;
    category: string;
    amount: number;
    currency: CurrencyCode;
    accountId?: string;
    date: string;
    createdAt?: string;
}
export interface FinanceAccount {
    id: string;
    name: string;
    type: "Bank" | "Mobile Money" | "Cash" | "Savings" | "Business" | "Other";
    currency: CurrencyCode;
    openingBalance: number;
    createdAt?: string;
}
export interface MonthlyBudget {
    id: string;
    category: string;
    amount: number;
    currency: CurrencyCode;
    month: string;
}
export interface CurrencySummary {
    currency: CurrencyCode;
    income: number;
    expenses: number;
    net: number;
    transactionCount: number;
}
