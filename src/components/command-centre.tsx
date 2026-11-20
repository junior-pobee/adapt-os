"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CommandModule = { id: string; label: string; group: string; icon: string };

export function CommandCentre({ modules, onNavigate, theme, onThemeToggle }: { modules: CommandModule[]; onNavigate: (id: string) => void; theme: "dark" | "light"; onThemeToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const actions = useMemo(() => [
    { id: "action-theme", label: theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance", group: "SYSTEM ACTIONS", icon: "◐" },
    { id: "action-home", label: "Return to Overview", group: "SYSTEM ACTIONS", icon: "⌂" }
  ], [theme]);
  const results = useMemo(() => [...modules, ...actions].filter(item => `${item.label} ${item.group}`.toLowerCase().includes(query.trim().toLowerCase())), [modules, actions, query]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(value => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const run = (id: string) => {
    if (id === "action-theme") onThemeToggle();
    else onNavigate(id === "action-home" ? "dashboard" : id);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button className="command-centre-trigger" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        <span>⌘</span><span>Command centre</span><kbd>Ctrl K</kbd>
      </button>
      {open ? (
        <div className="command-centre-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="command-centre-dialog" role="dialog" aria-modal="true" aria-label="Universal command centre">
            <div className="command-centre-search"><span>⌕</span><input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search modules and system actions…" aria-label="Search commands"/><kbd>ESC</kbd></div>
            <div className="command-centre-results">
              {results.length ? results.map(item => (
                <button key={item.id} type="button" className="command-centre-result" onClick={() => run(item.id)}>
                  <span className="command-centre-result-icon">{item.icon}</span><span className="command-centre-result-copy"><strong>{item.label}</strong><small>{item.group}</small></span><span className="command-centre-result-arrow">↵</span>
                </button>
              )) : <div className="command-centre-empty">No matching modules or actions.</div>}
            </div>
            <footer className="command-centre-footer"><span>UNIVERSAL COMMAND CENTRE</span><span>Navigate · Search · Control</span></footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
