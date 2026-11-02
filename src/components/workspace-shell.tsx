"use client";

import { useMemo, useState } from "react";
import { messages, type Locale } from "@/i18n/messages";
import { formatMoney } from "@/finance/finance-core";
import { FinanceWorkspace } from "@/components/finance-workspace";
import { supportedCurrencies } from "@/platform/currency";
import { localeDirection } from "@/platform/locale";

const modules = [
  { id: "finance", icon: "◈", title: "Finance", description: "Budgets, ledger insights and multi-currency tracking." },
  { id: "learning", icon: "⌘", title: "Learning", description: "Study spaces, revision plans and learning resources." },
  { id: "research", icon: "⌕", title: "Research", description: "Organise research, references and discoveries." },
  { id: "files", icon: "▤", title: "File Vault", description: "A structured home for documents and personal files." },
  { id: "tasks", icon: "✓", title: "Tasks & Projects", description: "Plan work, manage priorities and track progress." },
  { id: "ai", icon: "✧", title: "AI Centre", description: "A future-ready home for connected AI assistants." },
  { id: "notes", icon: "▧", title: "Notes", description: "Capture ideas and keep knowledge organised." },
  { id: "settings", icon: "⚙", title: "Workspace settings", description: "Language, region, accessibility and privacy controls." }
];

export function WorkspaceShell() {
  const [locale, setLocale] = useState<Locale>("en");
  const [currency, setCurrency] = useState("GHS");
  const [active, setActive] = useState("dashboard");
  const copy = messages[locale];
  const direction = localeDirection(locale);
  const preview = useMemo(() => formatMoney(1280.5, currency, locale), [currency, locale]);

  return (
    <div className="shell" dir={direction}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div><strong>ADAPT OS</strong><small>GLOBAL WORKSPACE</small></div>
        </div>
        <div>
          <div className="nav-label">WORKSPACE</div>
          <nav className="nav-list" aria-label="Main navigation">
            {[["dashboard", copy.dashboard, "⌂"], ["finance", copy.finance, "◈"], ["learning", copy.learning, "⌘"], ["files", copy.files, "▤"], ["tasks", copy.tasks, "✓"], ["settings", copy.settings, "⚙"]].map(([id, label, icon]) => (
              <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => setActive(id)}>
                <span className="nav-symbol" aria-hidden="true">{icon}</span>{label}
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-foot">Local-first by design.<br />Your workspace remains on this device until you choose to connect a cloud account.</div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">ADAPTIVE PRODUCTIVITY PLATFORM</div><h1>{active === "dashboard" ? copy.dashboardTitle : modules.find(item => item.id === active)?.title ?? copy.workspace}</h1></div>
          <div className="top-actions">
            <label className="sr-only" htmlFor="locale-select">Language</label>
            <select id="locale-select" className="select" value={locale} onChange={event => setLocale(event.target.value as Locale)}>
              <option value="en">English</option><option value="fr">Français</option><option value="es">Español</option><option value="ar">العربية</option>
            </select>
            <label className="sr-only" htmlFor="currency-select">Currency</label>
            <select id="currency-select" className="select" value={currency} onChange={event => setCurrency(event.target.value)}>
              {supportedCurrencies.map(code => <option key={code} value={code}>{code}</option>)}
            </select>
          </div>
        </header>
        {active === "finance" ? (
          <FinanceWorkspace locale={locale} />
        ) : active === "dashboard" ? (
          <>
            <section className="hero">
              <div className="eyebrow">{copy.welcomeEyebrow}</div>
              <h2>{copy.welcomeTitle}</h2>
              <p>{copy.welcomeDescription}</p>
              <button className="primary" onClick={() => setActive("finance")}>{copy.openFinance}</button>
            </section>
            <section className="metrics" aria-label="Workspace overview">
              <div className="metric"><span>{copy.availableModules}</span><strong>08</strong><small>Modular workspace</small></div>
              <div className="metric"><span>{copy.currencyPreview}</span><strong>{preview}</strong><small>Locale-aware formatting</small></div>
              <div className="metric"><span>{copy.languages}</span><strong>04</strong><small>English · French · Spanish · Arabic</small></div>
              <div className="metric"><span>{copy.storageMode}</span><strong>Local</strong><small>Offline-first foundation</small></div>
            </section>
            <div className="section-head"><div><div className="eyebrow">YOUR TOOLKIT</div><h2>{copy.modulesTitle}</h2></div><p>Built to expand across regions</p></div>
            <section className="module-grid">
              {modules.map(item => <button key={item.id} className="module-card" onClick={() => setActive(item.id)}><span className="module-icon">{item.icon}</span><strong>{item.title}</strong><small>{item.description}</small></button>)}
            </section>
            <div className="footer-note">ADAPT OS Global Edition · React · TypeScript · Next.js</div>
          </>
        ) : (
          <>
            <div className="section-head"><div><div className="eyebrow">MODULE WORKSPACE</div><h2>{modules.find(item => item.id === active)?.title ?? copy.workspace}</h2></div><button className="secondary" onClick={() => setActive("dashboard")}>{copy.backToDashboard}</button></div>
            <div className="workspace-grid">
              <section className="panel"><h3>{copy.moduleFoundation}</h3><p>{modules.find(item => item.id === active)?.description ?? copy.moduleDescription}</p><div className="notice">{copy.migrationNotice}</div></section>
              <section className="panel"><h3>{copy.platformStatus}</h3><div className="status-line"><span>React interface</span><span className="status-pill">Ready</span></div><div className="status-line"><span>TypeScript domain layer</span><span className="status-pill">Ready</span></div><div className="status-line"><span>Cloud services</span><span>Not connected</span></div><div className="status-line"><span>Provider integrations</span><span>Not connected</span></div></section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
