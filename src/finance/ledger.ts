import type { LedgerTransaction } from "./finance.types";
import { summarizeLedger, validateTransaction } from "./finance-core";

export const buildFinanceOverview = (transactions: readonly LedgerTransaction[]) => ({
  currencies: summarizeLedger(transactions),
  transactionCount: transactions.length,
  validationErrors: transactions.flatMap(transaction => validateTransaction(transaction))
});

export const getMonthlyTotals = (transactions: readonly LedgerTransaction[], month: string) =>
  summarizeLedger(transactions.filter(transaction => transaction.date.startsWith(month)));
