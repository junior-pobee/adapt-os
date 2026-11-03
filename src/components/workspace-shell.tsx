"use client";

import { useEffect, useState } from "react";
import { messages, type Locale } from "@/i18n/messages";
import { FinanceWorkspace } from "@/components/finance-workspace";
import { WorkspaceModules } from "@/components/workspace-modules";
import { supportedCurrencies, isSupportedCurrency } from "@/platform/currency";
import { localeDirection, resolveLocale } from "@/platform/locale";

const navigation: [string, string, string, string][] = [
  ["dashboard","Overview","⌂","COMMAND"],
  ["tasks","Tasks & Projects","✓","COMMAND"],
  ["learning","Learning Studio","⌘","COMMAND"],
  ["finance","Finance & Ledger","◈","MANAGE"],
  ["files","File Vault","▤","MANAGE"],
  ["research","Research Desk","⌕","KNOWLEDGE"],
  ["notes","Knowledge Base","▧","KNOWLEDGE"],
  ["ai","AI Centre","✧","INTELLIGENCE"],
  ["profile","Identity & Profile","◎","SYSTEM"],
  ["settings","System Settings","⚙","SYSTEM"]
];

export function WorkspaceShell() {
  const [locale, setLocale] = useState<Locale>("en");
  const [currency, setCurrency] = useState("GHS");
  const [active, setActive] = useState("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [commandQuery, setCommandQuery] = useState("");

  useEffect(() => {
    try {
      setLocale(resolveLocale(localStorage.getItem("adapt-os-locale")));
      const savedCurrency = localStorage.getItem("adapt-os-currency");
      if (savedCurrency && isSupportedCurrency(savedCurrency)) setCurrency(savedCurrency);
      const savedTheme = localStorage.getItem("adapt-os-theme");
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    } catch {
      setLocale("en");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute("content", theme === "light" ? "#f4f6fb" : "#090d18");
    try {
      localStorage.setItem("adapt-os-theme", theme);
    } catch {
      return;
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection(locale);
    try {
      localStorage.setItem("adapt-os-locale", locale);
    } catch {
      return;
    }
  }, [locale]);

  useEffect(() => {
    try {
      localStorage.setItem("adapt-os-currency", currency);
    } catch {
      return;
    }
  }, [currency]);

  const copy = messages[locale];
  const direction = localeDirection(locale);
  const title = navigation.find(item => item[0] === active)?.[1] ?? copy.workspace;
  const runCommand = () => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return;
    const match = navigation.find(item => item[0].includes(query) || item[1].toLowerCase().includes(query));
    if (match) {
      setActive(match[0]);
      setCommandQuery("");
    }
  };

  return (
    <div className="shell" dir={direction}>
      <aside className="sidebar">
        <button className="brand brand-button" onClick={() => setActive("dashboard")} aria-label="ADAPT OS home">
          <div className="brand-mark">A<span>+</span></div>
          <div><strong>ADAPT OS</strong><small>OPERATING ENVIRONMENT <i>v3.0.0</i></small></div>
        </button>
        <div className="sidebar-identity"><span className="identity-pulse"/><span>PERSONAL WORKSPACE</span><strong>LOCAL INSTANCE</strong></div>
        <nav className="nav-list" aria-label="Main navigation">
          {(["COMMAND","MANAGE","KNOWLEDGE","INTELLIGENCE","SYSTEM"] as const).map(group => (
            <div className="nav-group" key={group}>
              <div className="nav-label">{group}</div>
              {navigation.filter(item => item[3] === group).map(([id,label,icon]) => (
                <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => setActive(id)} aria-current={active === id ? "page" : undefined}>
                  <span className="nav-symbol" aria-hidden="true">{icon}</span><span>{id === "dashboard" ? copy.dashboard : id === "finance" ? copy.finance : id === "learning" ? copy.learning : id === "files" ? copy.files : id === "tasks" ? copy.tasks : id === "settings" ? copy.settings : label}</span>
                  {active === id ? <span className="nav-active-mark"/> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-system">
          <div className="system-heading"><span>DATA MODE</span><b>LOCAL-FIRST</b></div>
          <div className="system-foot"><span><i/> Device storage</span><span>Private</span></div>
          <div className="sidebar-version">ADAPT OS GLOBAL EDITION <span>v3.0.0</span></div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-heading"><div className="breadcrumb"><span>ADAPT OS</span><b>/</b><strong>{title.toUpperCase()}</strong></div><h1>{active === "dashboard" ? copy.dashboardTitle : title}</h1><p className="topbar-date">{new Date().toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p></div>
          <div className="top-actions">
            <form className="command-search" onSubmit={event => { event.preventDefault(); runCommand(); }}>
              <span>⌕</span><input aria-label="Find a workspace" value={commandQuery} onChange={event => setCommandQuery(event.target.value)} placeholder="Jump to a workspace…"/><kbd>↵</kbd>
            </form>
            <label className="sr-only" htmlFor="locale-select">Language</label>
            <select id="locale-select" className="select" value={locale} onChange={event => setLocale(event.target.value as Locale)}><option value="en">EN</option><option value="fr">FR</option><option value="es">ES</option><option value="ar">AR</option></select>
            <label className="sr-only" htmlFor="currency-select">Currency</label>
            <select id="currency-select" className="select" value={currency} onChange={event => setCurrency(event.target.value)}>{supportedCurrencies.map(code => <option key={code} value={code}>{code}</option>)}</select>
            <button className="theme-toggle" onClick={() => setTheme(current => current === "dark" ? "light" : "dark")} aria-label={"Switch to " + (theme === "dark" ? "light" : "dark") + " theme"} title={"Switch to " + (theme === "dark" ? "light" : "dark") + " theme"}>{theme === "dark" ? "☼" : "☾"}</button>
            <button className="profile-shortcut" onClick={() => setActive("profile")} aria-label="Open profile">◎</button>
          </div>
        </header>
        <div className="workspace-statusbar"><span><i/> WORKSPACE MODE: LOCAL</span><span>SECURE LOCAL SESSION</span><span>REGION-AWARE WORKSPACE</span><span className="statusbar-spacer"/><span>ACTIVE MODULE <b>{title.toUpperCase()}</b></span></div>
        {active === "finance" ? <FinanceWorkspace locale={locale} currency={currency} onCurrencyChange={setCurrency}/> : <WorkspaceModules active={active} locale={locale} currency={currency} onNavigate={setActive}/>}
      </main>
    </div>
  );
}
