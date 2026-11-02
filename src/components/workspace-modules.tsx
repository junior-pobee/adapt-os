"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { localWorkspaceStorage } from "@/platform/storage";
import type { Locale } from "@/i18n/messages";
import { normalizeExternalUrl, validateUploadBatch } from "@/platform/workspace-validation";

type Task = { id: string; title: string; detail: string; due: string; priority: "Low" | "Medium" | "High"; done: boolean; createdAt: string };
type Note = { id: string; title: string; body: string; updatedAt: string };
type ResearchItem = { id: string; title: string; url: string; summary: string; createdAt: string };
type StudyItem = { id: string; subject: string; topic: string; date: string; duration: number; completed: boolean };
type StoredFile = { id: string; name: string; type: string; size: number; updatedAt: string; blob: Blob };
type Profile = { displayName: string; role: string; location: string; bio: string; email: string };
type WorkspaceData = { tasks: Task[]; notes: Note[]; research: ResearchItem[]; study: StudyItem[]; files: StoredFile[]; profile: Profile };
const DATA_KEY = "adapt-global-workspace-v1";
const emptyData: WorkspaceData = { tasks: [], notes: [], research: [], study: [], files: [], profile: { displayName: "", role: "", location: "", bio: "", email: "" } };
const uid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const prettySize = (size: number) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;

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
        setData(saved);
        setProfile(saved.profile ?? emptyData.profile);
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
    if (researchUrl && !/^https?:\/\//i.test(researchUrl)) {
      setNotice("Enter a complete web address beginning with http:// or https://.");
      return;
    }
    const item: ResearchItem = { id: uid(), title: researchTitle.trim(), url: researchUrl.trim(), summary: researchSummary.trim(), createdAt: new Date().toISOString() };
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
    const additions: StoredFile[] = Array.from(list).map(file => ({ id: uid(), name: file.name, type: file.type || "application/octet-stream", size: file.size, updatedAt: new Date().toISOString(), blob: file }));
    await persist({ ...data, files: [...additions, ...data.files] });
    if (uploadRef.current) uploadRef.current.value = "";
  };

  const downloadFile = (file: StoredFile) => {
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
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

  if (!ready) return <section className="panel"><h2>Preparing your workspace</h2><p>Opening your saved local workspace…</p></section>;

  if (active === "dashboard") return (
    <div className="module-workspace">
      <section className="hero"><div className="eyebrow">YOUR PERSONAL OPERATING SPACE</div><h2>One place for everything you are becoming.</h2><p>Your work, documents, learning plans and ideas are organised in a private local-first workspace.</p><div className="hero-actions"><button className="primary" onClick={() => onNavigate("tasks")}>Plan my day</button><button className="secondary" onClick={() => onNavigate("files")}>Open File Vault</button></div></section>
      <section className="metrics">
        <div className="metric"><span>Open tasks</span><strong>{data.tasks.length - completedTasks}</strong><small>{completedTasks} completed</small></div>
        <div className="metric"><span>Saved documents</span><strong>{data.files.length}</strong><small>Private local file vault</small></div>
        <div className="metric"><span>Study sessions</span><strong>{data.study.length}</strong><small>{pendingStudy} upcoming or unfinished</small></div>
        <div className="metric"><span>Knowledge notes</span><strong>{data.notes.length}</strong><small>{data.research.length} research references</small></div>
      </section>
      <div className="section-head"><div><div className="eyebrow">QUICK ACCESS</div><h2>Continue where you left off</h2></div></div>
      <section className="module-grid">
        {[["finance","◈","Finance","Track your money and budgets"],["files","▤","File Vault","Store and organise documents"],["tasks","✓","Tasks & Projects","Turn plans into progress"],["learning","⌘","Learning Studio","Build your study routine"],["notes","▧","Notes","Capture important ideas"],["research","⌕","Research Desk","Keep useful sources together"],["ai","✧","AI Centre","Prepare an AI-assisted workflow"],["profile","◎","My Profile","Manage your workspace identity"]].map(([id,icon,title,description]) => <button key={id} className="module-card" onClick={() => onNavigate(id)}><span className="module-icon">{icon}</span><strong>{title}</strong><small>{description}</small></button>)}
      </section>
      <div className="footer-note">ADAPT OS Global Edition · Your workspace is stored locally on this device.</div>
    </div>
  );

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
      <section className="panel"><div className="eyebrow">PREFERENCES & PRIVACY</div><h2>Workspace settings</h2><div className="status-line"><span>Interface language</span><strong>{locale.toUpperCase()}</strong></div><div className="status-line"><span>Display currency</span><strong>{currency}</strong></div><div className="status-line"><span>Storage</span><strong>Local IndexedDB</strong></div><div className="status-line"><span>Cloud account</span><strong>Not connected</strong></div><p>Language and currency can be changed from the controls in the top navigation. Your local workspace remains on this device.</p><button className="primary" onClick={exportWorkspace}>Export workspace data</button></section>
      <section className="panel"><h3>Data management</h3><p>Export your profile, tasks, notes, research references and study plan as a JSON backup. File contents are stored separately in the File Vault and can be downloaded individually.</p><div className="notice">Keep your own backups. Removing browser site data may erase local workspace information.</div></section>
    </div>
  );

  return <section className="panel"><h2>Workspace module</h2><p>This module is not available.</p></section>;
}
