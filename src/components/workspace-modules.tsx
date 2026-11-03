"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { localWorkspaceStorage } from "@/platform/storage";
import type { Locale } from "@/i18n/messages";
import { normalizeExternalUrl, validateUploadBatch } from "@/platform/workspace-validation";
import { CloudAccountPanel } from "@/components/cloud-account-panel";
import { AccountWorkspace } from "@/components/account-workspace";
import type { CloudWorkspaceSnapshot } from "@/platform/cloud-sync";

type Task = { id: string; title: string; detail: string; due: string; priority: "Low" | "Medium" | "High"; done: boolean; createdAt: string };
type Note = { id: string; title: string; body: string; updatedAt: string };
type ResearchItem = { id: string; title: string; url: string; summary: string; createdAt: string };
type StudyItem = { id: string; subject: string; topic: string; date: string; duration: number; completed: boolean };
type StoredFile = { id: string; name: string; type: string; size: number; updatedAt: string; blob: Blob };
type Profile = { displayName: string; role: string; location: string; bio: string; email: string };
type WorkspaceData = { tasks: Task[]; notes: Note[]; research: ResearchItem[]; study: StudyItem[]; files: StoredFile[]; profile: Profile };
const DATA_KEY = "adapt-global-workspace-v1";
const emptyData: WorkspaceData = { tasks: [], notes: [], research: [], study: [], files: [], profile: { displayName: "", role: "", location: "", bio: "", email: "" } };
const normalizeWorkspaceData = (value: unknown): WorkspaceData => {
  if (!value || typeof value !== "object") return emptyData;
  const saved = value as Partial<WorkspaceData>;
  return {
    tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
    notes: Array.isArray(saved.notes) ? saved.notes : [],
    research: Array.isArray(saved.research) ? saved.research : [],
    study: Array.isArray(saved.study) ? saved.study : [],
    files: Array.isArray(saved.files) ? saved.files.filter(file => file && typeof file.id === "string" && typeof file.name === "string" && file.blob instanceof Blob) : [],
    profile: saved.profile && typeof saved.profile === "object" ? { ...emptyData.profile, ...saved.profile } : emptyData.profile
  };
};

const uid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const prettySize = (size: number) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
const companionTools = [
  { id: "tool-commerce", label: "Commerce", path: "commerce.html", description: "Product discovery, storefront and shopping workspace", icon: "🛍" },
  { id: "tool-snake", label: "Snake", path: "snake.html", description: "Classic arcade game with touch and keyboard controls", icon: "◉" },
  { id: "tool-chess", label: "Chess", path: "chess.html", description: "Play against the bot or challenge another player", icon: "♟" },
  { id: "tool-students", label: "Student Edition", path: "students.html", description: "Academic planning, practice and student tools", icon: "▣" },
  { id: "tool-studio", label: "Studio", path: "studio.html", description: "Creative media and design workspace", icon: "✦" },
  { id: "tool-translate", label: "Translator", path: "translate.html", description: "Translate text between supported languages", icon: "文" },
  { id: "tool-google", label: "Google Mode", path: "google.html", description: "Search and web utility experience", icon: "⌕" },
  { id: "tool-lumen", label: "Lumen", path: "Lumen.html", description: "Search, research, images and code tools", icon: "✧" }
];

export function WorkspaceModules({ active, locale, currency, onNavigate }: { active: string; locale: Locale; currency: string; onNavigate: (id: string) => void }) {
  const [data, setData] = useState<WorkspaceData>(emptyData);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDetail, setTaskDetail] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("Medium");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [researchTitle, setResearchTitle] = useState("");
  const [researchUrl, setResearchUrl] = useState("");
  const [researchSummary, setResearchSummary] = useState("");
  const [studySubject, setStudySubject] = useState("");
  const [studyTopic, setStudyTopic] = useState("");
  const [studyDate, setStudyDate] = useState(new Date().toISOString().slice(0, 10));
  const [studyDuration, setStudyDuration] = useState("30");
  const [profile, setProfile] = useState<Profile>(emptyData.profile);
  const [aiPrompt, setAiPrompt] = useState("");
  const [search, setSearch] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    void localWorkspaceStorage.get<WorkspaceData>(DATA_KEY).then(saved => {
      if (!live) return;
      if (saved) {
        const normalized = normalizeWorkspaceData(saved);
        setData(normalized);
        setProfile(normalized.profile);
      }
      setReady(true);
    }).catch(() => {
      if (live) {
        setNotice("Local workspace storage is unavailable in this browser.");
        setReady(true);
      }
    });
    return () => { live = false; };
  }, []);

  const persist = async (next: WorkspaceData) => {
    setData(next);
    setProfile(next.profile);
    try {
      await localWorkspaceStorage.set(DATA_KEY, next);
      setNotice("Saved securely in this browser on this device.");
    } catch {
      setNotice("Could not save. Check browser storage permissions.");
    }
  };

  const addTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    const task: Task = { id: uid(), title: taskTitle.trim(), detail: taskDetail.trim(), due: taskDue, priority: taskPriority, done: false, createdAt: new Date().toISOString() };
    await persist({ ...data, tasks: [task, ...data.tasks] });
    setTaskTitle(""); setTaskDetail(""); setTaskDue("");
  };

  const addNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!noteTitle.trim() && !noteBody.trim()) return;
    const note: Note = { id: uid(), title: noteTitle.trim() || "Untitled note", body: noteBody, updatedAt: new Date().toISOString() };
    await persist({ ...data, notes: [note, ...data.notes] });
    setNoteTitle(""); setNoteBody("");
  };

  const addResearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!researchTitle.trim()) return;
    const safeUrl = normalizeExternalUrl(researchUrl);
    if (safeUrl === null) {
      setNotice("Enter a valid HTTP or HTTPS web address.");
      return;
    }
    const item: ResearchItem = { id: uid(), title: researchTitle.trim(), url: safeUrl, summary: researchSummary.trim(), createdAt: new Date().toISOString() };
    await persist({ ...data, research: [item, ...data.research] });
    setResearchTitle(""); setResearchUrl(""); setResearchSummary("");
  };

  const addStudy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studySubject.trim() || !studyTopic.trim()) return;
    const item: StudyItem = { id: uid(), subject: studySubject.trim(), topic: studyTopic.trim(), date: studyDate, duration: Math.max(5, Number(studyDuration) || 30), completed: false };
    await persist({ ...data, study: [item, ...data.study] });
    setStudyTopic("");
  };

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const selected = Array.from(list);
    const currentBytes = data.files.reduce((total, file) => total + file.size, 0);
    const validationError = validateUploadBatch(selected, currentBytes);
    if (validationError) {
      setNotice(validationError);
      if (uploadRef.current) uploadRef.current.value = "";
      return;
    }
    const additions: StoredFile[] = selected.map(file => ({ id: uid(), name: file.name, type: file.type || "application/octet-stream", size: file.size, updatedAt: new Date().toISOString(), blob: file }));
    await persist({ ...data, files: [...additions, ...data.files] });
    if (uploadRef.current) uploadRef.current.value = "";
  };

  const downloadFile = (file: StoredFile) => {
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportWorkspace = () => {
    const exportData = { exportedAt: new Date().toISOString(), version: 1, tasks: data.tasks, notes: data.notes, research: data.research, study: data.study, profile: data.profile, files: data.files.map(({ blob, ...file }) => file) };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "adapt-os-workspace-export.json"; anchor.click();
    URL.revokeObjectURL(url);
  };

  const toggleTask = (id: string) => void persist({ ...data, tasks: data.tasks.map(task => task.id === id ? { ...task, done: !task.done } : task) });
  const deleteTask = (id: string) => void persist({ ...data, tasks: data.tasks.filter(task => task.id !== id) });
  const deleteNote = (id: string) => void persist({ ...data, notes: data.notes.filter(note => note.id !== id) });
  const deleteResearch = (id: string) => void persist({ ...data, research: data.research.filter(item => item.id !== id) });
  const deleteStudy = (id: string) => void persist({ ...data, study: data.study.filter(item => item.id !== id) });
  const deleteFile = (id: string) => void persist({ ...data, files: data.files.filter(file => file.id !== id) });
  const filteredFiles = useMemo(() => data.files.filter(file => file.name.toLowerCase().includes(search.toLowerCase())), [data.files, search]);
  const filteredNotes = useMemo(() => data.notes.filter(note => `${note.title} ${note.body}`.toLowerCase().includes(search.toLowerCase())), [data.notes, search]);
  const completedTasks = data.tasks.filter(task => task.done).length;
  const pendingStudy = data.study.filter(item => !item.completed).length;
  const today = new Date();
  const todayKey = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  const openTasks = data.tasks.filter(task => !task.done);
  const overdueTasks = openTasks.filter(task => task.due && task.due < todayKey);
  const todayTasks = openTasks.filter(task => task.due === todayKey);
  const highPriorityTasks = openTasks.filter(task => task.priority === "High");
  const taskProgress = data.tasks.length ? Math.round(completedTasks / data.tasks.length * 100) : 0;
  const nextTasks = [...openTasks].sort((a, b) => (a.due || "9999-12-31").localeCompare(b.due || "9999-12-31")).slice(0, 5);
  const nextStudy = [...data.study].filter(item => !item.completed).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const recentNotes = [...data.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const recentResearch = [...data.research].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  if (!ready) return <section className="panel"><h2>Preparing your workspace</h2><p>Opening your saved local workspace…</p></section>;

  if (active === "dashboard") return (
    <div className="module-workspace dashboard-workspace">
      <section className="dashboard-command">
        <div className="dashboard-welcome">
          <div className="eyebrow">COMMAND OVERVIEW / GLOBAL WORKSPACE</div>
          <h2>Good {today.getHours() < 12 ? "morning" : today.getHours() < 18 ? "afternoon" : "evening"}{profile.displayName ? `, ${profile.displayName.split(" ")[0]}` : ""}. Your workspace is ready.</h2>
          <p>One operational view of your priorities, knowledge, learning, files and personal systems.</p>
        </div>
        <div className="dashboard-command-actions">
          <button className="primary" onClick={() => onNavigate("tasks")}>＋ Create task</button>
          <button className="secondary" onClick={() => onNavigate("learning")}>＋ Study session</button>
          <button className="secondary" onClick={() => onNavigate("files")}>⇧ Upload files</button>
        </div>
        <div className="dashboard-command-meta"><span><i/> WORKSPACE OVERVIEW</span><span>LOCAL-FIRST DATA CONTROL</span><span>LAST SESSION: THIS DEVICE</span></div>
      </section>

      <section className="metrics dashboard-metrics">
        <div className="metric"><div className="metric-topline"><span>OPEN WORK ITEMS</span><b className="metric-icon">✓</b></div><strong>{openTasks.length}</strong><small>{todayTasks.length} due today · {overdueTasks.length} overdue</small></div>
        <div className="metric"><div className="metric-topline"><span>COMPLETION RATE</span><b className="metric-icon">◌</b></div><strong>{taskProgress}%</strong><small>{completedTasks} completed of {data.tasks.length} tasks</small></div>
        <div className="metric"><div className="metric-topline"><span>STUDY QUEUE</span><b className="metric-icon">⌘</b></div><strong>{pendingStudy}</strong><small>{data.study.length - pendingStudy} sessions completed</small></div>
        <div className="metric"><div className="metric-topline"><span>FILE INVENTORY</span><b className="metric-icon">▤</b></div><strong>{data.files.length}</strong><small>{prettySize(data.files.reduce((sum, file) => sum + file.size, 0))} stored locally</small></div>
        <div className="metric"><div className="metric-topline"><span>KNOWLEDGE ASSETS</span><b className="metric-icon">▧</b></div><strong>{data.notes.length + data.research.length}</strong><small>{data.notes.length} notes · {data.research.length} sources</small></div>
        <div className="metric"><div className="metric-topline"><span>HIGH PRIORITY</span><b className="metric-icon">⌁</b></div><strong>{highPriorityTasks.length}</strong><small>Open high-priority work items</small></div>
      </section>

      <div className="dashboard-grid">
        <section className="panel dashboard-panel">
          <div className="panel-heading"><div><div className="eyebrow">EXECUTION CONTROL</div><h3>Priority work queue</h3><p>Upcoming tasks ordered by due date and urgency.</p></div><button className="text-link" onClick={() => onNavigate("tasks")}>Open planner ↗</button></div>
          <div className="queue-summary"><span><b>{openTasks.length}</b> active</span><span><b>{todayTasks.length}</b> due today</span><span className={overdueTasks.length ? "warning-text" : ""}><b>{overdueTasks.length}</b> overdue</span></div>
          {nextTasks.length ? <div className="dashboard-task-list">{nextTasks.map(task => <article className="dashboard-task" key={task.id}><input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} aria-label={`Complete ${task.title}`}/><div className="dashboard-task-copy"><strong>{task.title}</strong><small>{task.due ? task.due < todayKey ? `Overdue · ${task.due}` : task.due === todayKey ? "Due today" : `Due ${task.due}` : "No deadline"}{task.detail ? ` · ${task.detail}` : ""}</small></div><span className={`priority-tag priority-${task.priority.toLowerCase()}`}>{task.priority}</span></article>)}</div> : <div className="dashboard-empty"><span>✓</span><strong>No active tasks</strong><p>Your execution queue is clear. Add a task when something needs attention.</p><button className="secondary" onClick={() => onNavigate("tasks")}>Create a task</button></div>}
          <div className="queue-footer"><span>COMPLETION</span><strong>{taskProgress}%</strong><div className="queue-progress"><span style={{ width: `${taskProgress}%` }}/></div></div>
        </section>

        <div className="dashboard-side-stack">
          <section className="panel dashboard-panel">
            <div className="panel-heading"><div><div className="eyebrow">PERFORMANCE SIGNAL</div><h3>Execution health</h3></div><span className="live-indicator">LIVE DATA</span></div>
            <div className="execution-health"><div className="health-ring" style={{ background: `conic-gradient(var(--accent-2) ${taskProgress * 3.6}deg, var(--ring-track) 0deg)` }}><div><strong>{taskProgress}%</strong><small>DONE</small></div></div><div className="health-breakdown"><div><i className="dot dot-complete"/><span>Completed</span><b>{completedTasks}</b></div><div><i className="dot dot-open"/><span>In progress</span><b>{openTasks.length}</b></div><div><i className="dot dot-risk"/><span>Overdue</span><b>{overdueTasks.length}</b></div></div></div>
            <div className="health-foot"><span>Based on your saved task records</span><button className="text-link" onClick={() => onNavigate("tasks")}>View details</button></div>
          </section>
          <section className="panel dashboard-panel">
            <div className="panel-heading"><div><div className="eyebrow">LEARNING PIPELINE</div><h3>Next study sessions</h3></div><button className="text-link" onClick={() => onNavigate("learning")}>Study plan ↗</button></div>
            {nextStudy.length ? <div className="study-queue">{nextStudy.map(item => <article className="study-queue-item" key={item.id}><span className="study-date">{new Date(item.date + "T12:00:00").toLocaleDateString(locale, { day: "2-digit", month: "short" })}</span><div><strong>{item.subject}</strong><small>{item.topic} · {item.duration} min</small></div><span className="study-state">PLANNED</span></article>)}</div> : <div className="compact-empty">No upcoming sessions. <button className="text-link" onClick={() => onNavigate("learning")}>Build your study plan</button></div>}
          </section>
        </div>
      </div>

      <div className="dashboard-lower-grid">
        <section className="panel dashboard-panel">
          <div className="panel-heading"><div><div className="eyebrow">KNOWLEDGE MANAGEMENT</div><h3>Recent notes</h3><p>Your latest captured ideas and working knowledge.</p></div><button className="text-link" onClick={() => onNavigate("notes")}>Knowledge base ↗</button></div>
          {recentNotes.length ? <div className="knowledge-list">{recentNotes.map(note => <article key={note.id}><span className="knowledge-icon">▧</span><div><strong>{note.title}</strong><p>{note.body.slice(0, 116)}{note.body.length > 116 ? "…" : ""}</p><small>{new Date(note.updatedAt).toLocaleDateString(locale)}</small></div><button className="text-link" onClick={() => onNavigate("notes")}>Open</button></article>)}</div> : <div className="compact-empty">Your knowledge base is empty. <button className="text-link" onClick={() => onNavigate("notes")}>Capture an idea</button></div>}
        </section>
        <section className="panel dashboard-panel">
          <div className="panel-heading"><div><div className="eyebrow">RESEARCH INTELLIGENCE</div><h3>Saved discoveries</h3><p>References and source material kept together.</p></div><button className="text-link" onClick={() => onNavigate("research")}>Research desk ↗</button></div>
          {recentResearch.length ? <div className="research-feed">{recentResearch.map(item => <article key={item.id}><span className="research-source-icon">↗</span><div><strong>{item.title}</strong><small>{item.url || "No external URL"} · {new Date(item.createdAt).toLocaleDateString(locale)}</small></div></article>)}</div> : <div className="compact-empty">No saved research yet. <button className="text-link" onClick={() => onNavigate("research")}>Add a source</button></div>}
        </section>
        <section className="panel dashboard-panel system-overview">
          <div className="panel-heading"><div><div className="eyebrow">SYSTEM INVENTORY</div><h3>Workspace modules</h3><p>Jump directly into an operational area.</p></div></div>
          <div className="module-launch-grid">
            {([[ "finance","◈","Finance"],["files","▤","Files"],["tasks","✓","Projects"],["learning","⌘","Learning"],["notes","▧","Notes"],["research","⌕","Research"],["ai","✧","AI Centre"],["settings","⚙","Settings"]] as const).map(([id,icon,label]) => <button key={id} onClick={() => onNavigate(id)}><span>{icon}</span><strong>{label}</strong><i>↗</i></button>)}
          </div>
        </section>
        <section className="panel dashboard-panel companion-tools-panel">
          <div className="panel-heading"><div><div className="eyebrow">ADAPT OS ECOSYSTEM</div><h3>Companion tools</h3><p>Open the full working experiences without leaving your main workspace.</p></div><span className="status-pill">8 TOOLS</span></div>
          <div className="companion-tool-grid">{companionTools.map(tool => <button className="companion-tool-card" key={tool.id} onClick={() => onNavigate(tool.id)}><span className="companion-tool-icon">{tool.icon}</span><span className="companion-tool-copy"><strong>{tool.label}</strong><small>{tool.description}</small></span><span className="companion-tool-arrow">↗</span></button>)}</div>
        </section>
      </div>
      <div className="dashboard-system-footer"><span><i/> LOCAL WORKSPACE RECORDS</span><span>LOCAL FILES: {data.files.length}</span><span>WORK ITEMS: {data.tasks.length}</span><span>KNOWLEDGE RECORDS: {data.notes.length + data.research.length}</span><span className="dashboard-footer-spacer"/><button onClick={() => onNavigate("settings")}>DATA & PRIVACY CONTROLS ↗</button></div>
    </div>
  );

  if (active === "account") return <AccountWorkspace />;

  if (active.startsWith("tool-")) {
    const tool = companionTools.find(item => item.id === active);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    if (!tool) return <section className="panel"><h2>Tool unavailable</h2><p>This companion tool could not be found.</p></section>;
    return <div className="module-workspace companion-tool-view"><section className="companion-tool-toolbar"><div><div className="eyebrow">ADAPT OS COMPANION SUITE</div><h2>{tool.label}</h2><p>{tool.description}</p></div><button className="secondary" onClick={() => onNavigate("dashboard")}>← Workspace overview</button><a className="secondary" href={basePath + "/" + tool.path} target="_blank" rel="noreferrer">Open separately ↗</a></section><iframe className="companion-tool-frame" title={tool.label + " workspace"} src={basePath + "/" + tool.path} allow="clipboard-read; clipboard-write; fullscreen; camera; microphone" allowFullScreen /></div>;
  }

  if (active === "profile") return (
    <div className="module-workspace">
      <section className="profile-banner"><div className="profile-avatar">{(profile.displayName.trim()[0] || "A").toUpperCase()}</div><div><div className="eyebrow">PERSONAL WORKSPACE IDENTITY</div><h2>{profile.displayName || "Your profile"}</h2><p>{profile.role || "Add a role or occupation"}{profile.location ? ` · ${profile.location}` : ""}</p></div></section>
      <section className="panel"><div className="section-head"><div><div className="eyebrow">PROFILE DETAILS</div><h2>Manage your profile</h2></div></div><form className="module-form" onSubmit={event => { event.preventDefault(); void persist({ ...data, profile }); }}><label>Display name<input value={profile.displayName} onChange={event => setProfile({ ...profile, displayName: event.target.value })} maxLength={80} placeholder="Your name"/></label><label>Role or occupation<input value={profile.role} onChange={event => setProfile({ ...profile, role: event.target.value })} maxLength={100} placeholder="Student, developer, designer…"/></label><label>Location<input value={profile.location} onChange={event => setProfile({ ...profile, location: event.target.value })} maxLength={100} placeholder="City or region"/></label><label>Email address<input type="email" value={profile.email} onChange={event => setProfile({ ...profile, email: event.target.value })} maxLength={160} placeholder="name@example.com"/></label><label>About you<textarea rows={4} value={profile.bio} onChange={event => setProfile({ ...profile, bio: event.target.value })} maxLength={600} placeholder="A short introduction…"/></label><button className="primary" type="submit">Save profile</button></form></section>
    </div>
  );

  if (active === "files") return (
    <div className="module-workspace">
      <section className="hero compact-hero"><div className="eyebrow">PRIVATE DOCUMENT SPACE</div><h2>Your File Vault.</h2><p>Store files in this browser, search your collection and download them when needed.</p><div className="hero-actions"><button className="primary" onClick={() => uploadRef.current?.click()}>＋ Add files</button><input ref={uploadRef} className="sr-only" type="file" multiple onChange={event => void addFiles(event.target.files)}/></div></section>
      <section className="panel"><div className="section-head"><div><h2>My documents</h2><p>{data.files.length} stored files · {prettySize(data.files.reduce((sum,file) => sum + file.size,0))} total</p></div><input className="module-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search files"/></div>
        {filteredFiles.length ? <div className="vault-grid">{filteredFiles.map(file => <article className="vault-card" key={file.id}><div className="vault-file-icon">▤</div><strong title={file.name}>{file.name}</strong><small>{prettySize(file.size)} · {file.type.split("/")[0]}</small><div className="vault-actions"><button className="secondary" onClick={() => downloadFile(file)}>Download</button><button className="text-action" onClick={() => deleteFile(file.id)}>Delete</button></div></article>)}</div> : <div className="empty-state"><span>▤</span><h3>Your vault is ready</h3><p>Add documents, images, PDFs and other files to start your collection.</p><button className="secondary" onClick={() => uploadRef.current?.click()}>Choose files</button></div>}
      </section>
      <div className="notice">Files are stored in this browser's IndexedDB. They are not uploaded to a cloud server. Clearing browser site data may remove locally stored files, so keep separate backups.</div>
    </div>
  );

  if (active === "tasks") return (
    <div className="module-workspace">
      <section className="metrics"><div className="metric"><span>Total tasks</span><strong>{data.tasks.length}</strong></div><div className="metric"><span>Completed</span><strong>{completedTasks}</strong></div><div className="metric"><span>Remaining</span><strong>{data.tasks.length - completedTasks}</strong></div><div className="metric"><span>Progress</span><strong>{data.tasks.length ? Math.round(completedTasks / data.tasks.length * 100) : 0}%</strong></div></section>
      <section className="panel"><div className="eyebrow">PROJECT PLANNER</div><h2>Create a task</h2><form className="module-form" onSubmit={addTask}><label>Task title<input required value={taskTitle} onChange={event => setTaskTitle(event.target.value)} placeholder="What needs to get done?"/></label><label>Details<textarea rows={2} value={taskDetail} onChange={event => setTaskDetail(event.target.value)} placeholder="Add useful context"/></label><div className="module-form-row"><label>Due date<input type="date" value={taskDue} onChange={event => setTaskDue(event.target.value)}/></label><label>Priority<select value={taskPriority} onChange={event => setTaskPriority(event.target.value as Task["priority"])}><option>Low</option><option>Medium</option><option>High</option></select></label></div><button className="primary" type="submit">Add task</button></form></section>
      <section className="panel"><div className="section-head"><h2>Your tasks</h2><span className="status-pill">{data.tasks.length} total</span></div>{data.tasks.length ? <div className="item-list">{data.tasks.map(task => <article className={`task-row ${task.done ? "is-done" : ""}`} key={task.id}><input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} aria-label={`Mark ${task.title} complete`}/><div className="item-main"><strong>{task.title}</strong>{task.detail ? <p>{task.detail}</p> : null}<small>{task.due ? `Due ${task.due}` : "No due date"} · {task.priority} priority</small></div><button className="text-action" onClick={() => deleteTask(task.id)}>Delete</button></article>)}</div> : <div className="empty-state"><h3>No tasks yet</h3><p>Create your first task to begin planning.</p></div>}</section>
    </div>
  );

  if (active === "notes") return (
    <div className="module-workspace">
      <section className="panel"><div className="eyebrow">PERSONAL KNOWLEDGE BASE</div><h2>Capture an idea</h2><form className="module-form" onSubmit={addNote}><label>Title<input value={noteTitle} onChange={event => setNoteTitle(event.target.value)} placeholder="Give your note a title"/></label><label>Note<textarea rows={5} value={noteBody} onChange={event => setNoteBody(event.target.value)} placeholder="Write down your thoughts, plans or discoveries…"/></label><button className="primary" type="submit">Save note</button></form></section>
      <section className="panel"><div className="section-head"><h2>Saved notes</h2><input className="module-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search notes"/></div><div className="notes-grid">{filteredNotes.map(note => <article className="note-card" key={note.id}><h3>{note.title}</h3><p>{note.body}</p><small>Updated {new Date(note.updatedAt).toLocaleDateString(locale)}</small><button className="text-action" onClick={() => deleteNote(note.id)}>Delete note</button></article>)}</div>{!filteredNotes.length ? <div className="empty-state"><h3>Your notes will appear here</h3><p>Save useful thoughts and ideas for later.</p></div> : null}</section>
    </div>
  );

  if (active === "research") return (
    <div className="module-workspace">
      <section className="panel"><div className="eyebrow">RESEARCH LIBRARY</div><h2>Save a source or discovery</h2><form className="module-form" onSubmit={addResearch}><label>Title<input required value={researchTitle} onChange={event => setResearchTitle(event.target.value)} placeholder="Research title"/></label><label>Web address<input type="url" value={researchUrl} onChange={event => setResearchUrl(event.target.value)} placeholder="https://example.com"/></label><label>Summary or key findings<textarea rows={3} value={researchSummary} onChange={event => setResearchSummary(event.target.value)} placeholder="What makes this source useful?"/></label><button className="primary" type="submit">Save research item</button></form></section>
      <section className="panel"><div className="section-head"><h2>Research collection</h2><span className="status-pill">{data.research.length} sources</span></div>{data.research.length ? <div className="item-list">{data.research.map(item => <article className="research-row" key={item.id}><div className="item-main"><strong>{item.title}</strong>{item.summary ? <p>{item.summary}</p> : null}{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a> : null}<small>{new Date(item.createdAt).toLocaleDateString(locale)}</small></div><button className="text-action" onClick={() => deleteResearch(item.id)}>Remove</button></article>)}</div> : <div className="empty-state"><h3>No saved sources</h3><p>Keep your useful references and research notes together.</p></div>}</section>
    </div>
  );

  if (active === "learning") return (
    <div className="module-workspace">
      <section className="hero compact-hero"><div className="eyebrow">LEARNING STUDIO</div><h2>Make learning a habit.</h2><p>Plan revision sessions by subject, topic and date. Track the sessions you complete.</p></section>
      <section className="panel"><h2>Plan a study session</h2><form className="module-form" onSubmit={addStudy}><label>Subject<input required value={studySubject} onChange={event => setStudySubject(event.target.value)} placeholder="e.g. Mathematics"/></label><label>Topic<input required value={studyTopic} onChange={event => setStudyTopic(event.target.value)} placeholder="e.g. Logarithms"/></label><div className="module-form-row"><label>Study date<input type="date" value={studyDate} onChange={event => setStudyDate(event.target.value)}/></label><label>Duration in minutes<input type="number" min="5" max="600" value={studyDuration} onChange={event => setStudyDuration(event.target.value)}/></label></div><button className="primary" type="submit">Add to study plan</button></form></section>
      <section className="panel"><div className="section-head"><h2>My study plan</h2><span className="status-pill">{pendingStudy} remaining</span></div>{data.study.length ? <div className="item-list">{data.study.map(item => <article className={`task-row ${item.completed ? "is-done" : ""}`} key={item.id}><input type="checkbox" checked={item.completed} onChange={() => void persist({ ...data, study: data.study.map(entry => entry.id === item.id ? { ...entry, completed: !entry.completed } : entry) })} aria-label={`Mark ${item.topic} completed`}/><div className="item-main"><strong>{item.subject} · {item.topic}</strong><small>{item.date} · {item.duration} minutes</small></div><button className="text-action" onClick={() => deleteStudy(item.id)}>Remove</button></article>)}</div> : <div className="empty-state"><h3>Your study plan is waiting</h3><p>Add your first revision session above.</p></div>}</section>
    </div>
  );

  if (active === "ai") return (
    <div className="module-workspace">
      <section className="hero compact-hero"><div className="eyebrow">AI CENTRE</div><h2>Bring intelligent tools into your workflow.</h2><p>A secure home for future AI assistants, research support, writing tools and learning guidance.</p></section>
      <section className="panel"><div className="status-line"><span>AI provider connection</span><span className="status-pill">Not configured</span></div><div className="notice">No AI provider is connected yet. This workspace does not pretend to generate AI answers or send your information to an external service.</div><form className="module-form" onSubmit={event => { event.preventDefault(); if (!aiPrompt.trim()) return; void navigator.clipboard?.writeText(aiPrompt); setNotice("Prompt copied. Connect an approved AI provider to enable in-app responses."); }}><label>Prepare a prompt<textarea rows={5} value={aiPrompt} onChange={event => setAiPrompt(event.target.value)} placeholder="Describe what you want an AI assistant to help with…"/></label><button className="secondary" type="submit" disabled={!aiPrompt.trim()}>Copy prompt</button></form></section>
      <section className="workspace-grid"><article className="panel"><h3>Research assistant</h3><p>Designed for source summaries, comparisons and structured research.</p></article><article className="panel"><h3>Learning assistant</h3><p>Designed for explanations, revision questions and study plans.</p></article><article className="panel"><h3>Build assistant</h3><p>Designed for coding support, architecture reviews and debugging.</p></article></section>
    </div>
  );

  if (active === "settings") return (
    <div className="module-workspace">
      <CloudAccountPanel snapshot={{ tasks: data.tasks, notes: data.notes, research: data.research, study: data.study, profile: data.profile, updatedAt: new Date().toISOString() }} onRestore={async (snapshot: CloudWorkspaceSnapshot) => {
        await persist({ ...data, tasks: snapshot.tasks as Task[], notes: snapshot.notes as Note[], research: snapshot.research as ResearchItem[], study: snapshot.study as StudyItem[], profile: snapshot.profile as Profile });
      }}/>

      <section className="panel"><div className="eyebrow">PREFERENCES & PRIVACY</div><h2>Workspace settings</h2><div className="status-line"><span>Interface language</span><strong>{locale.toUpperCase()}</strong></div><div className="status-line"><span>Display currency</span><strong>{currency}</strong></div><div className="status-line"><span>Storage</span><strong>Local IndexedDB</strong></div><div className="status-line"><span>Cloud account</span><strong>Managed above</strong></div><p>Language and currency can be changed from the controls in the top navigation. Your local workspace remains on this device.</p><button className="primary" onClick={exportWorkspace}>Export workspace data</button></section>
      <section className="panel"><h3>Data management</h3><p>Export your profile, tasks, notes, research references and study plan as a JSON backup. File contents are stored separately in the File Vault and can be downloaded individually.</p><div className="notice">Keep your own backups. Removing browser site data may erase local workspace information.</div></section>
    </div>
  );

  return <section className="panel"><h2>Workspace module</h2><p>This module is not available.</p></section>;
}
