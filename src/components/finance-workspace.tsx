"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { FinanceAccount, LedgerTransaction } from "@/finance/finance.types";
import { summarizeLedger, formatMoney } from "@/finance/finance-core";
import { localWorkspaceStorage } from "@/platform/storage";
import { supportedCurrencies } from "@/platform/currency";

type FinanceState = {
  transactions: LedgerTransaction[];
  accounts: FinanceAccount[];
  budgets: Record<string, number>;
};

const STORAGE_KEY = "finance-global-v1";
const LEGACY_KEY = "adaptOS_data_v3";
const emptyState: FinanceState = { transactions: [], accounts: [], budgets: {} };

const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : `adapt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const importLegacyFinance = (): FinanceState => {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return emptyState;
    const legacy = JSON.parse(raw) as { accounts?: Array<Record<string, unknown>>; transactions?: Array<Record<string, unknown>> };
    const accounts: FinanceAccount[] = (Array.isArray(legacy.accounts) ? legacy.accounts : []).map(account => ({
      id: String(account.id ?? makeId()),
      name: String(account.name ?? "Imported account"),
      type: ["Bank", "Mobile Money", "Cash", "Savings", "Business", "Other"].includes(String(account.type)) ? account.type as FinanceAccount["type"] : "Other",
      currency: "GHS",
      openingBalance: Number(account.balance) || 0,
      createdAt: typeof account.createdAt === "string" ? account.createdAt : undefined
    }));
    const transactions: LedgerTransaction[] = (Array.isArray(legacy.transactions) ? legacy.transactions : []).map(item => ({
      id: String(item.id ?? makeId()),
      description: String(item.description ?? "Imported transaction"),
      type: (item.type === "income" ? "income" : "expense") as LedgerTransaction["type"],
      category: String(item.category ?? "General"),
      amount: Math.max(0, Number(item.amount) || 0),
      currency: typeof item.currency === "string" ? item.currency : "GHS",
      accountId: typeof item.accountId === "string" ? item.accountId : undefined,
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(item.date ?? "")) ? String(item.date) : new Date().toISOString().slice(0, 10),
      createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined
    })).filter(item => item.amount > 0);
    return { transactions, accounts, budgets: {} };
  } catch {
    return emptyState;
  }
};

export function FinanceWorkspace({ locale }: { locale: string }) {
  const [ledger, setLedger] = useState<FinanceState>(emptyState);
  const [currency, setCurrency] = useState("GHS");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("General");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<FinanceAccount["type"]>("Cash");
  const [budgetInput, setBudgetInput] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      let saved = await localWorkspaceStorage.get<FinanceState>(STORAGE_KEY).catch(() => null);
      if (!saved) {
        saved = importLegacyFinance();
        await localWorkspaceStorage.set(STORAGE_KEY, saved).catch(() => undefined);
      }
      if (active) {
        setLedger(saved);
        setReady(true);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const save = async (next: FinanceState) => {
    setLedger(next);
    try {
      await localWorkspaceStorage.set(STORAGE_KEY, next);
      setMessage("Your finance workspace is saved on this device.");
    } catch {
      setMessage("Local storage is unavailable. Your latest changes may not persist.");
    }
  };

  const summaries = useMemo(() => summarizeLedger(ledger.transactions), [ledger.transactions]);
  const summary = summaries.find(item => item.currency === currency);
  const accountBalances = ledger.accounts.filter(item => item.currency === currency).map(account => {
    const activity = ledger.transactions.filter(item => item.accountId === account.id && item.currency === currency)
      .reduce((total, item) => total + (item.type === "income" ? item.amount : -item.amount), 0);
    return { ...account, balance: account.openingBalance + activity };
  });
  const monthlySpent = ledger.transactions.filter(item => item.currency === currency && item.type === "expense" && item.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((total, item) => total + item.amount, 0);
  const budget = ledger.budgets[currency] ?? 0;
  const currencyTransactions = ledger.transactions.filter(item => item.currency === currency).slice().sort((a, b) => b.date.localeCompare(a.date));

  const addTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("Enter a description and an amount greater than zero.");
      return;
    }
    const transaction: LedgerTransaction = {
      id: makeId(), description: description.trim(), type, category, amount: numericAmount,
      currency, accountId: accountId || undefined, date, createdAt: new Date().toISOString()
    };
    await save({ ...ledger, transactions: [transaction, ...ledger.transactions] });
    setDescription("");
    setAmount("");
  };

  const addAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountName.trim()) return;
    const account: FinanceAccount = {
      id: makeId(), name: accountName.trim(), type: accountType, currency,
      openingBalance: 0, createdAt: new Date().toISOString()
    };
    await save({ ...ledger, accounts: [...ledger.accounts, account] });
    setAccountName("");
  };

  const removeTransaction = (id: string) => {
    void save({ ...ledger, transactions: ledger.transactions.filter(item => item.id !== id) });
  };

  const removeAccount = (id: string) => {
    void save({
      ...ledger,
      accounts: ledger.accounts.filter(item => item.id !== id),
      transactions: ledger.transactions.map(item => item.accountId === id ? { ...item, accountId: undefined } : item)
    });
  };

  const saveBudget = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(budgetInput);
    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Enter a monthly budget greater than zero.");
      return;
    }
    void save({ ...ledger, budgets: { ...ledger.budgets, [currency]: value } });
    setBudgetInput("");
  };

  const exportCsv = () => {
    const headings = ["Description", "Type", "Category", "Amount", "Currency", "Account ID", "Date"];
    const cell = (value: unknown) => {
      let text = String(value ?? "");
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const rows = [headings, ...currencyTransactions.map(item => [item.description, item.type, item.category, item.amount, item.currency, item.accountId ?? "", item.date])];
    const blob = new Blob(["\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `adapt-os-${currency.toLowerCase()}-ledger.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!ready) return <section className="panel"><h3>Preparing finance workspace</h3><p>Loading your local finance records…</p></section>;

  return (
    <div className="finance-workspace">
      <div className="finance-toolbar">
        <div><div className="eyebrow">GLOBAL FINANCE</div><h2>Finance command centre</h2><p>Multi-currency records, budgets and account tracking.</p></div>
        <label className="finance-field">Display currency<select className="select" value={currency} onChange={event => setCurrency(event.target.value)}>{supportedCurrencies.map(code => <option key={code}>{code}</option>)}</select></label>
      </div>
      <section className="metrics">
        <div className="metric"><span>Income</span><strong>{formatMoney(summary?.income ?? 0, currency, locale)}</strong><small>{summary?.transactionCount ?? 0} ledger records</small></div>
        <div className="metric"><span>Expenses</span><strong>{formatMoney(summary?.expenses ?? 0, currency, locale)}</strong><small>Recorded spending</small></div>
        <div className="metric"><span>Net position</span><strong>{formatMoney(summary?.net ?? 0, currency, locale)}</strong><small>Income less expenses</small></div>
        <div className="metric"><span>Monthly budget</span><strong>{budget ? formatMoney(budget, currency, locale) : "Not set"}</strong><small>{budget ? formatMoney(Math.max(0, budget - monthlySpent), currency, locale) + " remaining" : "Set a spending plan"}</small></div>
      </section>
      <div className="finance-columns">
        <section className="panel">
          <h3>Record a transaction</h3>
          <form className="finance-form" onSubmit={addTransaction}>
            <div className="finance-type-switch"><button type="button" className={type === "income" ? "active" : ""} onClick={() => setType("income")}>Income</button><button type="button" className={type === "expense" ? "active" : ""} onClick={() => setType("expense")}>Expense</button></div>
            <label>Description<input required value={description} onChange={event => setDescription(event.target.value)} placeholder="e.g. Project payment" maxLength={100}/></label>
            <div className="finance-form-row"><label>Amount<input required type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)}/></label><label>Category<select value={category} onChange={event => setCategory(event.target.value)}><option>General</option><option>Food</option><option>Transport</option><option>Education</option><option>Business</option><option>Housing</option><option>Health</option><option>Salary</option><option>Other</option></select></label></div>
            <div className="finance-form-row"><label>Date<input required type="date" value={date} onChange={event => setDate(event.target.value)}/></label><label>Account<select value={accountId} onChange={event => setAccountId(event.target.value)}><option value="">Cash / Unassigned</option>{accountBalances.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label></div>
            <button className="primary" type="submit">Save transaction</button>
          </form>
        </section>
        <div className="finance-side-stack">
          <section className="panel">
            <h3>Monthly spending plan</h3>
            <p>{formatMoney(monthlySpent, currency, locale)} spent this month</p>
            <div className="budget-track"><span style={{ width: `${budget ? Math.min(100, monthlySpent / budget * 100) : 0}%` }}/></div>
            <p>{budget ? monthlySpent > budget ? `${formatMoney(monthlySpent - budget, currency, locale)} over budget` : `${formatMoney(budget - monthlySpent, currency, locale)} remaining` : "Set a budget to track spending."}</p>
            <form className="budget-form" onSubmit={saveBudget}><input aria-label="Monthly budget" type="number" min="0.01" step="0.01" placeholder={budget ? String(budget) : "Set monthly budget"} value={budgetInput} onChange={event => setBudgetInput(event.target.value)}/><button className="secondary" type="submit">Save</button></form>
          </section>
          <section className="panel">
            <h3>Accounts in {currency}</h3>
            <form className="account-form" onSubmit={addAccount}><input aria-label="Account name" required value={accountName} onChange={event => setAccountName(event.target.value)} placeholder="New account name"/><select aria-label="Account type" value={accountType} onChange={event => setAccountType(event.target.value as FinanceAccount["type"])}><option>Cash</option><option>Bank</option><option>Mobile Money</option><option>Savings</option><option>Business</option><option>Other</option></select><button className="secondary" type="submit">Add</button></form>
            {accountBalances.length ? accountBalances.map(account => <div className="status-line" key={account.id}><span>{account.name} · {account.type}<br/><small>{formatMoney(account.balance, currency, locale)}</small></span><button className="text-action" onClick={() => removeAccount(account.id)}>Remove</button></div>) : <p>No accounts in this currency yet.</p>}
          </section>
        </div>
      </div>
      <section className="panel finance-ledger">
        <div className="section-head"><div><div className="eyebrow">TRANSACTION HISTORY</div><h2>{currency} ledger</h2></div><button className="secondary" onClick={exportCsv}>Export CSV</button></div>
        {currencyTransactions.length ? <div className="ledger-list">{currencyTransactions.slice(0, 100).map(item => <div className="ledger-row" key={item.id}><div><strong>{item.description}</strong><small>{item.category} · {item.date}</small></div><span className={item.type === "income" ? "income-value" : "expense-value"}>{item.type === "income" ? "+" : "−"}{formatMoney(item.amount, currency, locale)}</span><button className="text-action" onClick={() => removeTransaction(item.id)} aria-label={`Delete ${item.description}`}>Delete</button></div>)}</div> : <p>No transactions recorded in {currency} yet.</p>}
      </section>
      <div className="notice">Local-first finance workspace. Records are stored in this browser. No bank or mobile-money account is connected, and no provider credentials are requested.</div>
      {message ? <p className="finance-message" role="status">{message}</p> : null}
    </div>
  );
}
