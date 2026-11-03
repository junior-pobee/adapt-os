import type { CurrencyCode, CurrencySummary, LedgerTransaction } from "./finance.types";

const isValidAmount = (amount: number): boolean => Number.isFinite(amount) && amount >= 0;

export const summarizeLedger = (transactions: readonly LedgerTransaction[]): CurrencySummary[] => {
    const summaries = new Map<CurrencyCode, CurrencySummary>();
    for (const transaction of transactions) {
        if (!isValidAmount(transaction.amount)) continue;
        const summary = summaries.get(transaction.currency) ?? {
            currency: transaction.currency,
            income: 0,
            expenses: 0,
            net: 0,
            transactionCount: 0
        };
        if (transaction.type === "income") summary.income += transaction.amount;
        if (transaction.type === "expense") summary.expenses += transaction.amount;
        summary.net = summary.income - summary.expenses;
        summary.transactionCount += 1;
        summaries.set(transaction.currency, summary);
    }
    return [...summaries.values()].sort((a, b) => a.currency.localeCompare(b.currency));
};

export const formatMoney = (amount: number, currency: CurrencyCode, locale = "en"): string => {
    if (!Number.isFinite(amount)) throw new TypeError("Amount must be a finite number.");
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: "symbol",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

const csvCell = (value: unknown): string => {
    let text = String(value ?? "");
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
};

export const exportLedgerCsv = (transactions: readonly LedgerTransaction[]): string => {
    const headings = ["id", "description", "type", "category", "amount", "currency", "accountId", "date"];
    const rows = transactions.map(transaction => headings.map(key => csvCell(transaction[key as keyof LedgerTransaction])));
    return "\uFEFF" + [headings.map(csvCell).join(","), ...rows.map(row => row.join(","))].join("\r\n");
};

export const validateTransaction = (transaction: LedgerTransaction): string[] => {
    const errors: string[] = [];
    if (!transaction.id.trim()) errors.push("A transaction identifier is required.");
    if (!transaction.description.trim()) errors.push("A description is required.");
    if (!isValidAmount(transaction.amount) || transaction.amount === 0) errors.push("Amount must be greater than zero.");
    if (transaction.type !== "income" && transaction.type !== "expense") errors.push("Transaction type is invalid.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) errors.push("Date must use YYYY-MM-DD format.");
    return errors;
};
