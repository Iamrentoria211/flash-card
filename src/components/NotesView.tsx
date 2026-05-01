import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Trash2, FileText, Clock,
  Sparkles, X, Tag as TagIcon, Layout, Bold, Italic, Code,
  Highlighter, Palette, RotateCcw, Underline,
  Strikethrough
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from '../hooks/useNotesData';
import type { Deck } from '../utils/srs';

interface NotesViewProps {
  notes: Note[];
  decks: Deck[];
  onAddNote: (title: string, content: string, tags: string[]) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onCreateCard: (deckId: string, front: string, back: string) => void;
}

const COLORS = [
  { label: 'Default', fg: 'inherit', bg: 'transparent' },
  { label: 'Blue', fg: '#3b82f6', bg: 'transparent' },
  { label: 'Red', fg: '#ef4444', bg: 'transparent' },
  { label: 'Green', fg: '#10b981', bg: 'transparent' },
  { label: 'Amber', fg: '#f59e0b', bg: 'transparent' },
  { label: 'Purple', fg: '#8b5cf6', bg: 'transparent' },
  { label: 'BG Yellow', fg: 'inherit', bg: '#fef08a' },
  { label: 'BG Blue', fg: 'inherit', bg: '#bfdbfe' },
  { label: 'BG Green', fg: 'inherit', bg: '#bbf7d0' },
];

const SLASH_COMMANDS = [
  { id: 'h1', label: 'Heading 1', icon: 'H1', description: 'Big section heading', action: (e: HTMLDivElement) => insertBlock(e, 'h1') },
  { id: 'h2', label: 'Heading 2', icon: 'H2', description: 'Medium section heading', action: (e: HTMLDivElement) => insertBlock(e, 'h2') },
  { id: 'h3', label: 'Heading 3', icon: 'H3', description: 'Small section heading', action: (e: HTMLDivElement) => insertBlock(e, 'h3') },
  { id: 'bullet', label: 'Bullet List', icon: '•', description: 'Unordered list', action: (e: HTMLDivElement) => insertBlock(e, 'ul') },
  { id: 'numbered', label: 'Numbered List', icon: '1.', description: 'Ordered list', action: (e: HTMLDivElement) => insertBlock(e, 'ol') },
  { id: 'quote', label: 'Quote', icon: '"', description: 'Capture a quote', action: (e: HTMLDivElement) => insertBlock(e, 'blockquote') },
  { id: 'code', label: 'Code Block', icon: '</>', description: 'Capture a code snippet', action: (e: HTMLDivElement) => insertBlock(e, 'pre') },
  { id: 'divider', label: 'Divider', icon: '—', description: 'Visual divider', action: (e: HTMLDivElement) => insertBlock(e, 'hr') },
  { id: 'callout', label: 'Callout', icon: '💡', description: 'Highlighted callout box', action: (e: HTMLDivElement) => insertBlock(e, 'callout') },
];

function insertBlock(editor: HTMLDivElement, type: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const node = range.startContainer;

  // Remove the slash + query text
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    const slashIdx = text.lastIndexOf('/');
    if (slashIdx !== -1) node.textContent = text.slice(0, slashIdx);
  }

  if (type === 'hr') {
    const hr = document.createElement('hr');
    hr.className = 'notion-hr';
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    range.insertNode(p);
    range.insertNode(hr);
    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    return;
  }

  let el: HTMLElement;

  if (type === 'callout') {
    el = document.createElement('div');
    el.className = 'notion-callout';
    el.contentEditable = 'true';
    el.innerHTML = '💡 ';
  } else if (type === 'pre') {
    el = document.createElement('pre');
    el.className = 'notion-code';
    const code = document.createElement('code');
    code.innerHTML = '<br>';
    el.appendChild(code);
  } else if (type === 'ul') {
    el = document.createElement('ul');
    el.className = 'notion-ul';
    const li = document.createElement('li');
    li.innerHTML = '<br>';
    el.appendChild(li);
  } else if (type === 'ol') {
    el = document.createElement('ol');
    el.className = 'notion-ol';
    const li = document.createElement('li');
    li.innerHTML = '<br>';
    el.appendChild(li);
  } else if (type === 'blockquote') {
    el = document.createElement('blockquote');
    el.className = 'notion-blockquote';
    el.innerHTML = '<br>';
  } else {
    el = document.createElement(type);
    el.className = `notion-${type}`;
    el.innerHTML = '<br>';
  }

  const p = document.createElement('p');
  p.innerHTML = '<br>';
  range.insertNode(p);
  range.insertNode(el);

  const target = type === 'pre' ? el.querySelector('code')! : el;
  const newRange = document.createRange();
  newRange.setStart(target, 0);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

function ToolbarBtn({
  children, onClick, title, className
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "h-7 w-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}

export function NotesView({
  notes, decks, onAddNote, onUpdateNote, onDeleteNote, onCreateCard
}: NotesViewProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Floating toolbar
  const [toolbar, setToolbar] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Slash command menu
  const [slashMenu, setSlashMenu] = useState<{ x: number; y: number; visible: boolean; query: string }>({
    x: 0, y: 0, visible: false, query: ''
  });
  const [slashIndex, setSlashIndex] = useState(0);

  // Bridge / flashcard modal
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeFront, setBridgeFront] = useState('');
  const [bridgeBack, setBridgeBack] = useState('');
  const [targetDeckId, setTargetDeckId] = useState('');

  // Form state — title & tags only; body lives in the DOM
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const lastLoadedNoteId = useRef<string | null>(null);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const selectedNote = useMemo(() =>
    notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]
  );

  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
    );
  }, [notes, searchQuery]);

  const filteredSlashCommands = useMemo(() =>
    SLASH_COMMANDS.filter(c =>
      c.label.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
      c.description.toLowerCase().includes(slashMenu.query.toLowerCase())
    ), [slashMenu.query]
  );

  // ─── Save — always reads live from the DOM ref ──────────────────────────
  const handleSave = useCallback(() => {
    const currentContent = editorRef.current?.innerHTML ?? '';
    if (!title.trim() && !currentContent.trim()) return;

    if (isCreating) {
      onAddNote(title || 'Untitled', currentContent, tags);
      setIsCreating(false);
    } else if (selectedNoteId) {
      onUpdateNote(selectedNoteId, { title: title || 'Untitled', content: currentContent, tags });
    }
  }, [title, tags, isCreating, selectedNoteId, onAddNote, onUpdateNote]);

  // Auto-save debounce — no `content` state in deps
  useEffect(() => {
    if (!selectedNoteId && !isCreating) return;
    const timer = setTimeout(handleSave, 1500);
    return () => clearTimeout(timer);
  }, [title, tags, handleSave, selectedNoteId, isCreating]);

  // Ctrl+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave]);

  // ─── Load note into editor ONCE per note switch ─────────────────────────
  useEffect(() => {
    const id = selectedNoteId ?? (isCreating ? '__new__' : null);
    if (!id || lastLoadedNoteId.current === id) return;
    lastLoadedNoteId.current = id;

    if (editorRef.current) {
      const note = notes.find(n => n.id === selectedNoteId);
      editorRef.current.innerHTML = isCreating ? '' : (note?.content ?? '');
    }
  }, [selectedNoteId, isCreating, notes]);

  // ─── Hide toolbar / slash on outside mousedown ──────────────────────────
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setToolbar(p => ({ ...p, visible: false }));
        setShowColorPicker(false);
      }
      if (slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node)) {
        setSlashMenu(p => ({ ...p, visible: false }));
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, []);

  // ─── Floating toolbar on selection ──────────────────────────────────────
  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setToolbar(p => ({ ...p, visible: false }));
      return;
    }
    if (!editorRef.current?.contains(sel.anchorNode)) return;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setToolbar({ x: rect.left + rect.width / 2, y: rect.top - 8, visible: true });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  // ─── Format helpers — never touch innerHTML ─────────────────────────────
  const applyFormat = (command: string, value = '') => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const wrapSelectionWith = (tag: string, styleFn?: (el: HTMLElement) => void) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const el = document.createElement(tag);
    if (styleFn) styleFn(el);
    try {
      range.surroundContents(el);
    } catch {
      el.appendChild(range.extractContents());
      range.insertNode(el);
    }
    sel.removeAllRanges();
    editorRef.current?.focus();
  };

  const applyColor = (fg: string, bg: string) => {
    wrapSelectionWith('span', el => {
      if (fg !== 'inherit') el.style.color = fg;
      if (bg !== 'transparent') el.style.backgroundColor = bg;
    });
    setShowColorPicker(false);
    setToolbar(p => ({ ...p, visible: false }));
  };

  // ─── Paste — strip styles, preserve structure ───────────────────────────
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const plain = e.clipboardData.getData('text/plain');

    if (html) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const clean = (node: Element) => {
        node.removeAttribute('style');
        node.removeAttribute('class');
        node.removeAttribute('id');
        Array.from(node.children).forEach(clean);
      };
      clean(doc.body);
      document.execCommand('insertHTML', false, doc.body.innerHTML);
    } else {
      const lines = plain.split('\n');
      document.execCommand(
        'insertHTML', false,
        lines.map(l => `<p>${l || '<br>'}</p>`).join('')
      );
    }
  }, []);

  // ─── Keyboard ────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Slash menu navigation
    if (slashMenu.visible) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex(i => Math.min(i + 1, filteredSlashCommands.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Escape') { setSlashMenu(p => ({ ...p, visible: false })); return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filteredSlashCommands[slashIndex];
        if (cmd && editorRef.current) {
          cmd.action(editorRef.current);
          setSlashMenu(p => ({ ...p, visible: false }));
        }
        return;
      }
    }

    // Tab in code block → two spaces
    if (e.key === 'Tab') {
      let cur: Node | null = window.getSelection()?.anchorNode ?? null;
      while (cur) {
        const tag = (cur as Element).tagName;
        if (tag === 'PRE' || tag === 'CODE') {
          e.preventDefault();
          document.execCommand('insertText', false, '  ');
          return;
        }
        cur = cur.parentNode;
      }
    }

    // Bold / italic / underline shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); applyFormat('bold'); }
      if (e.key === 'i') { e.preventDefault(); applyFormat('italic'); }
      if (e.key === 'u') { e.preventDefault(); applyFormat('underline'); }
      // Ctrl+Z / Ctrl+Y — let the browser handle natively, do NOT intercept
    }
  }, [slashMenu.visible, slashIndex, filteredSlashCommands]);

  // ─── Input — slash command detection only, no setContent ────────────────
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const node = sel.anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const before = text.slice(0, sel.anchorOffset);
      const slashIdx = before.lastIndexOf('/');

      if (
        slashIdx !== -1 &&
        (slashIdx === 0 || before[slashIdx - 1] === '\n' || before[slashIdx - 1] === ' ')
      ) {
        const query = before.slice(slashIdx + 1);
        if (!query.includes(' ')) {
          const rect = sel.getRangeAt(0).getBoundingClientRect();
          setSlashMenu({ x: rect.left, y: rect.bottom + 4, visible: true, query });
          setSlashIndex(0);
          return;
        }
      }
    }
    setSlashMenu(p => ({ ...p, visible: false }));
  }, []);

  // ─── Tags ────────────────────────────────────────────────────────────────
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setTagInput('');
    }
  };
  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  // ─── Extract to card ────────────────────────────────────────────────────
  const handleCreateCardFromNote = () => {
    const sel = window.getSelection()?.toString();
    if (sel) {
      setBridgeFront(sel);
    } else {
      const tmp = document.createElement('div');
      tmp.innerHTML = editorRef.current?.innerHTML ?? '';
      setBridgeFront((tmp.textContent || '').slice(0, 100));
    }
    setIsBridging(true);
    if (decks.length > 0) setTargetDeckId(decks[0].id);
    setToolbar(p => ({ ...p, visible: false }));
  };

  const handleBridgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetDeckId && bridgeFront.trim() && bridgeBack.trim()) {
      onCreateCard(targetDeckId, bridgeFront, bridgeBack);
      setIsBridging(false);
      setBridgeBack('');
    }
  };

  // ─── Note switching ──────────────────────────────────────────────────────
  const startNewNote = () => {
    lastLoadedNoteId.current = null;
    setSelectedNoteId(null);
    setIsCreating(true);
    setTitle('');
    setTags([]);
  };

  const selectNote = (note: Note) => {
    lastLoadedNoteId.current = null;
    setIsCreating(false);
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setTags(note.tags || []);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .notion-editor { position: relative; }
        .notion-editor:empty:before {
          content: attr(data-placeholder);
          color: rgba(128,128,128,0.3);
          pointer-events: none;
          position: absolute;
        }
        .notion-editor h1.notion-h1 { font-size:1.875rem; font-weight:800; line-height:1.2; margin:1.5rem 0 0.5rem; }
        .notion-editor h2.notion-h2 { font-size:1.375rem; font-weight:700; line-height:1.3; margin:1.25rem 0 0.4rem; }
        .notion-editor h3.notion-h3 { font-size:1.1rem;   font-weight:600; line-height:1.4; margin:1rem 0 0.3rem; }
        .notion-editor ul.notion-ul { list-style:disc;    padding-left:1.5rem; margin:0.5rem 0; }
        .notion-editor ol.notion-ol { list-style:decimal; padding-left:1.5rem; margin:0.5rem 0; }
        .notion-editor li { margin:0.2rem 0; }
        .notion-editor blockquote.notion-blockquote {
          border-left:3px solid hsl(var(--primary));
          padding:0.5rem 1rem;
          margin:0.75rem 0;
          color:hsl(var(--muted-foreground));
          font-style:italic;
          background:hsl(var(--muted)/0.3);
          border-radius:0 6px 6px 0;
        }
        .notion-editor pre.notion-code {
          background:hsl(var(--muted));
          border:1px solid hsl(var(--border));
          border-radius:8px;
          padding:1rem 1.25rem;
          margin:0.75rem 0;
          overflow-x:auto;
          font-family:'JetBrains Mono','Fira Code','Cascadia Code',monospace;
          font-size:0.8rem;
          line-height:1.6;
          white-space:pre;
        }
        .notion-editor pre.notion-code code { background:none; padding:0; font-size:inherit; }
        .notion-editor code:not(pre code) {
          background:hsl(var(--muted));
          border:1px solid hsl(var(--border)/0.6);
          border-radius:4px;
          padding:0.1em 0.4em;
          font-family:'JetBrains Mono',monospace;
          font-size:0.82em;
        }
        .notion-editor mark {
          background:#fef08a; color:#713f12;
          border-radius:2px; padding:0 2px;
        }
        .notion-editor hr.notion-hr {
          border:none; border-top:1px solid hsl(var(--border)); margin:1.5rem 0;
        }
        .notion-editor div.notion-callout {
          display:flex; gap:0.75rem;
          padding:0.875rem 1rem;
          background:hsl(var(--muted)/0.5);
          border:1px solid hsl(var(--border)/0.6);
          border-radius:8px; margin:0.75rem 0;
          font-size:0.9rem; line-height:1.6;
        }
        .notion-editor p  { margin:0.2rem 0; min-height:1.5em; }
        .notion-editor a  { color:hsl(var(--primary)); text-decoration:underline; }
        .notion-editor b, .notion-editor strong { font-weight:700; }
        .notion-editor i, .notion-editor em     { font-style:italic; }
        .notion-editor u  { text-decoration:underline; }
        .notion-editor s  { text-decoration:line-through; }
      `}</style>

      <div className="animate-in fade-in duration-700 h-[calc(100vh-5rem)] w-full">
        <div className="flex h-full border-t border-border/40">

          {/* ── Sidebar ── */}
          <div className="w-72 flex flex-col border-r border-border/40 bg-zinc-50/50 dark:bg-zinc-950/20 backdrop-blur-sm shrink-0">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Workspace</h2>
                <button onClick={startNewNote} className="h-6 w-6 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="relative group px-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                <input
                  placeholder="Quick find..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 h-9 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50 border-none text-xs font-medium outline-none focus:ring-1 ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar space-y-0.5">
              {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                  <FileText className="h-8 w-8 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Empty</p>
                </div>
              ) : filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg transition-all duration-150 group flex items-center gap-3",
                    selectedNoteId === note.id
                      ? "bg-zinc-200 dark:bg-zinc-800/80 text-foreground"
                      : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    selectedNoteId === note.id ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground/60"
                  )} />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-[13px] truncate leading-none mb-1">{note.title || 'Untitled'}</h4>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-medium opacity-50 shrink-0">{formatDate(note.updatedAt)}</span>
                      {note.tags && note.tags.length > 0 && (
                        <span className="text-[9px] font-bold text-primary/60 truncate">#{note.tags[0]}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Editor ── */}
          <div className="flex-1 min-w-0 bg-background flex flex-col overflow-hidden">
            {(selectedNoteId || isCreating) ? (
              <>
                {/* Top bar */}
                <div className="h-12 px-6 flex items-center justify-between border-b border-border/40 shrink-0">
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground/60">
                    <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md">
                      <Layout className="h-3 w-3" /><span>Private</span>
                    </div>
                    <span className="h-3 w-[1px] bg-border/60" />
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Edited {selectedNote ? formatDate(selectedNote.updatedAt) : 'now'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 rounded-md px-3 text-[11px] font-bold gap-2 text-primary hover:bg-primary/5"
                      onClick={handleCreateCardFromNote}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Extract to Card
                    </Button>
                    <button
                      onClick={() => { onDeleteNote(selectedNoteId!); setSelectedNoteId(null); }}
                      className="h-8 w-8 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Document area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="max-w-4xl mx-auto px-12 py-10 lg:px-24 space-y-6">
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      <TagIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
                      <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                        {tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-md hover:text-primary transition-all">
                            #{tag}
                            <button onClick={() => removeTag(tag)}><X className="h-2.5 w-2.5" /></button>
                          </span>
                        ))}
                        <input
                          type="text" placeholder="Add tag..." value={tagInput}
                          onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag}
                          className="bg-transparent text-[11px] font-bold outline-none placeholder:text-muted-foreground/20 w-24"
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <input
                      type="text" placeholder="Untitled" value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-transparent text-3xl font-extrabold tracking-tight outline-none placeholder:opacity-10"
                    />

                    {/* Hint */}
                    <p className="text-[11px] text-muted-foreground/30 -mt-2 select-none">
                      Type <kbd className="font-mono bg-muted px-1 rounded text-[10px]">/</kbd> for blocks · Select text for formatting
                    </p>

                    {/* Rich text editor */}
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleInput}
                      onKeyDown={handleKeyDown}
                      onPaste={handlePaste}
                      data-placeholder="Start writing..."
                      className="notion-editor w-full bg-transparent outline-none text-sm leading-relaxed min-h-[60vh] text-foreground/90 selection:bg-primary/20"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-20">
                <FileText className="h-16 w-16 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Select a document</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating Toolbar ── */}
      {toolbar.visible && (
        <div
          ref={toolbarRef}
          className="fixed z-[200] animate-in fade-in zoom-in-95 duration-150"
          style={{ left: toolbar.x, top: toolbar.y, transform: 'translate(-50%, -100%)' }}
          onMouseDown={e => e.preventDefault()}
        >
          <div className="flex items-center gap-0.5 bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 rounded-xl px-1.5 py-1 shadow-2xl">
            <ToolbarBtn onClick={() => applyFormat('bold')} title="Bold (Ctrl+B)"><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => applyFormat('italic')} title="Italic (Ctrl+I)"><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => applyFormat('underline')} title="Underline (Ctrl+U)"><Underline className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => applyFormat('strikeThrough')} title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></ToolbarBtn>
            <div className="w-[1px] h-4 bg-zinc-600 mx-0.5" />
            <ToolbarBtn onClick={() => wrapSelectionWith('mark')} title="Highlight">
              <Highlighter className="h-3.5 w-3.5 text-yellow-400" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => wrapSelectionWith('code')} title="Inline Code">
              <Code className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <div className="w-[1px] h-4 bg-zinc-600 mx-0.5" />
            <div className="relative">
              <ToolbarBtn onClick={() => setShowColorPicker(p => !p)} title="Color">
                <Palette className="h-3.5 w-3.5" />
              </ToolbarBtn>
              {showColorPicker && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-zinc-900 border border-zinc-700 rounded-xl p-2 shadow-2xl grid grid-cols-3 gap-1 animate-in fade-in zoom-in-95 duration-150">
                  {COLORS.map(c => (
                    <button
                      key={c.label}
                      onMouseDown={e => { e.preventDefault(); applyColor(c.fg, c.bg); }}
                      className="px-2 py-1.5 rounded-lg hover:bg-zinc-700 text-[10px] font-bold transition-colors text-center"
                      style={{
                        color: c.fg !== 'inherit' ? c.fg : '#fff',
                        backgroundColor: c.bg !== 'transparent' ? c.bg : undefined
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-[1px] h-4 bg-zinc-600 mx-0.5" />
            <ToolbarBtn onClick={handleCreateCardFromNote} title="Extract to Flashcard" className="text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </ToolbarBtn>
          </div>
        </div>
      )}

      {/* ── Slash Command Menu ── */}
      {slashMenu.visible && filteredSlashCommands.length > 0 && (
        <div
          ref={slashMenuRef}
          className="fixed z-[200] w-72 bg-background border border-border/60 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          style={{ left: slashMenu.x, top: slashMenu.y }}
        >
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Blocks</p>
          {filteredSlashCommands.map((cmd, i) => (
            <button
              key={cmd.id}
              onMouseDown={e => {
                e.preventDefault();
                if (editorRef.current) {
                  cmd.action(editorRef.current);
                  setSlashMenu(p => ({ ...p, visible: false }));
                }
              }}
              className={cn(
                "w-full text-left px-3 py-2 flex items-center gap-3 transition-colors",
                i === slashIndex ? "bg-muted" : "hover:bg-muted/60"
              )}
            >
              <div className="h-8 w-8 rounded-lg bg-muted border border-border/60 flex items-center justify-center text-sm font-bold shrink-0">
                {cmd.icon}
              </div>
              <div>
                <p className="text-sm font-semibold leading-none mb-0.5">{cmd.label}</p>
                <p className="text-[11px] text-muted-foreground/60">{cmd.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Bridge Modal ── */}
      {isBridging && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-background/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-2xl shadow-2xl border border-border/50 bg-background overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleBridgeSubmit}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold tracking-tight">Convert to Flashcard</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsBridging(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Module</p>
                    <select
                      value={targetDeckId} onChange={e => setTargetDeckId(e.target.value)} required
                      className="w-full h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-none px-3 text-xs font-bold outline-none"
                    >
                      <option value="" disabled>Select...</option>
                      {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Question</p>
                    <Textarea value={bridgeFront} onChange={e => setBridgeFront(e.target.value)} required className="min-h-[80px] rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none shadow-none text-sm font-medium resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Answer</p>
                    <Textarea value={bridgeBack} onChange={e => setBridgeBack(e.target.value)} required autoFocus className="min-h-[80px] rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none shadow-none text-sm font-medium resize-none" />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-lg font-bold shadow-lg shadow-primary/20"
                  disabled={!targetDeckId || !bridgeFront.trim() || !bridgeBack.trim()}
                >
                  Create Flashcard
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}