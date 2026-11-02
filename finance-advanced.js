(() => {
    "use strict";
    const STORAGE_KEY = "adaptOS_data_v3";
    const BUDGET_STORAGE_KEY = "adaptOS_finance_budget_v1";
    const readData = () => {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            return value && typeof value === "object" ? value : {};
        } catch {
            return {};
        }
    };
    const money = value => new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
    const monthKey = value => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
    };
    const getMonthlyExpenses = data => {
        const currentMonth = monthKey(new Date());
        return (Array.isArray(data.transactions) ? data.transactions : []).filter(item => item && item.type === "expense" && monthKey(item.date) === currentMonth).reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
    };
    const renderBudget = () => {
        const form = document.getElementById("financeBudgetForm");
        if (!form) return;
        const data = readData();
        const budget = Math.max(0, Number(localStorage.getItem(BUDGET_STORAGE_KEY)) || 0);
        const spent = getMonthlyExpenses(data);
        const percentage = budget > 0 ? Math.min(100, spent / budget * 100) : 0;
        const amount = document.getElementById("financeBudgetAmount");
        const status = document.getElementById("financeBudgetStatus");
        const progress = document.getElementById("financeBudgetProgress");
        const spentLabel = document.getElementById("financeBudgetSpent");
        const remainingLabel = document.getElementById("financeBudgetRemaining");
        if (amount && document.activeElement !== amount) amount.value = budget ? String(budget) : "";
        if (status) status.textContent = budget ? Math.round(spent / budget * 100) + "% used" : "Not set";
        if (progress) {
            progress.style.width = percentage + "%";
            progress.classList.toggle("is-over", budget > 0 && spent > budget);
        }
        if (spentLabel) spentLabel.textContent = money(spent) + " spent this month";
        if (remainingLabel) remainingLabel.textContent = budget ? spent > budget ? money(spent - budget) + " over plan" : money(budget - spent) + " remaining" : "Set a budget to begin";
    };
    const safeCsvValue = value => {
        let text = String(value ?? "");
        if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    };
    const exportTransactions = () => {
        const data = readData();
        const transactions = Array.isArray(data.transactions) ? data.transactions : [];
        if (!transactions.length) {
            window.alert("There are no transactions to export yet.");
            return;
        }
        const rows = [["Description", "Type", "Category", "Amount (GHS)", "Account ID", "Date"], ...transactions.map(item => [item.description, item.type, item.category, Number(item.amount) || 0, item.accountId, item.date])];
        const csv = "\uFEFF" + rows.map(row => row.map(safeCsvValue).join(",")).join("\r\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "adapt-os-transactions-" + new Date().toISOString().slice(0, 10) + ".csv";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };
    const initialize = () => {
        const form = document.getElementById("financeBudgetForm");
        const exportButton = document.getElementById("financeExportButton");
        if (form) form.addEventListener("submit", event => {
            event.preventDefault();
            const input = document.getElementById("financeBudgetAmount");
            const budget = Number(input?.value);
            if (!Number.isFinite(budget) || budget <= 0) {
                window.alert("Enter a monthly budget greater than zero.");
                return;
            }
            try {
                localStorage.setItem(BUDGET_STORAGE_KEY, String(budget));
                renderBudget();
            } catch {
                window.alert("Your browser could not save this budget.");
            }
        });
        exportButton?.addEventListener("click", exportTransactions);
        window.addEventListener("storage", renderBudget);
        renderBudget();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
