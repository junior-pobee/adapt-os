"use client";

import { useEffect, useState } from "react";
import { messages, type Locale } from "@/i18n/messages";
import { FinanceWorkspace } from "@/components/finance-workspace";
import { WorkspaceModules } from "@/components/workspace-modules";
import { supportedCurrencies } from "@/platform/currency";
import { localeDirection, resolveLocale } from "@/platform/locale";
import { isSupportedCurrency } from "@/platform/currency";

const navigation: [string, string, string][] = [
  ["dashboard","Dashboard","⌂"],["finance","Finance","◈"],["learning","Learning Studio","⌘"],
  ["files","File Vault","▤"],["tasks","Tasks & Projects","✓"],["research","Research Desk","⌕"],
  ["notes","Notes","▧"],["ai","AI Centre","✧"],["profile","My Profile","◎"],["settings","Settings","⚙"]
];

export function WorkspaceShell() {
  const [locale, setLocale] = useState<Locale>("en");
  const [currency, setCurrency] = useState("GHS");
  const [active, setActive] = useState("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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

  return (
    <div className="shell" dir={direction}>
      <aside className="sidebar">
        <button className="brand brand-button" onClick={() => setActive("dashboard")} aria-label="ADAPT OS home">
          <div className="brand-mark">A</div>
          <div><strong>ADAPT OS</strong><small>GLOBAL WORKSPACE</small></div>
        </button>
        <div>
          <div className="nav-label">YOUR WORKSPACE</div>
          <nav className="nav-list" aria-label="Main navigation">
            {navigation.map(([id,label,icon]) => (
              <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => setActive(id)} aria-current={active === id ? "page" : undefined}>
                <span className="nav-symbol" aria-hidden="true">{icon}</span><span>{id === "dashboard" ? copy.dashboard : id === "finance" ? copy.finance : id === "learning" ? copy.learning : id === "files" ? copy.files : id === "tasks" ? copy.tasks : id === "settings" ? copy.settings : label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-foot">Local-first by design.<br/>Your workspace remains on this device until you choose to connect a cloud account.</div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">ADAPTIVE PRODUCTIVITY PLATFORM</div><h1>{active === "dashboard" ? copy.dashboardTitle : title}</h1></div>
          <div className="top-actions">
            <label className="sr-only" htmlFor="locale-select">Language</label>
            <select id="locale-select" className="select" value={locale} onChange={event => setLocale(event.target.value as Locale)}>
              <option value="en">English</option><option value="fr">Français</option><option value="es">Español</option><option value="ar">العربية</option>
            </select>
            <label className="sr-only" htmlFor="currency-select">Currency</label>
            <select id="currency-select" className="select" value={currency} onChange={event => setCurrency(event.target.value)}>
              {supportedCurrencies.map(code => <option key={code} value={code}>{code}</option>)}
            </select>
            <button className="theme-toggle" onClick={() => setTheme(current => current === "dark" ? "light" : "dark")} aria-label={"Switch to " + (theme === "dark" ? "light" : "dark") + " theme"} title={"Switch to " + (theme === "dark" ? "light" : "dark") + " theme"}>{theme === "dark" ? "☼" : "☾"}</button>
            <button className="profile-shortcut" onClick={() => setActive("profile")} aria-label="Open profile">◎</button>
          </div>
        </header>
        {active === "finance" ? <FinanceWorkspace locale={locale} currency={currency} onCurrencyChange={setCurrency}/> : <WorkspaceModules active={active} locale={locale} currency={currency} onNavigate={setActive}/>}
      </main>
    </div>
  );
}
