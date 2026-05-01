import { useState, useMemo, useEffect } from 'react';
import { useFlashcardData } from './hooks/useFlashcardData';
import { useNotesData } from './hooks/useNotesData';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Library,
  BrainCircuit,
  Settings,
  Sparkles,
  StickyNote,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import type { View, StudyMode } from './types';

// Components
import { DashboardView } from './components/DashboardView';
import { ModulesView } from './components/ModulesView';
import { ModuleDetailView } from './components/ModuleDetailView';
import { ReviewPathView } from './components/ReviewPathView';
import { NotesView } from './components/NotesView';

export default function App() {
  const {
    decks, sessionHistory, addDeck, deleteDeck,
    addCard, deleteCard,
    reviewCard, recordSession
  } = useFlashcardData();

  const {
    notes, addNote, updateNote, deleteNote
  } = useNotesData();

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !isNaN(Number(e.key))) {
        const key = Number(e.key);
        if (key === 1) setCurrentView('dashboard');
        if (key === 2) setCurrentView('modules');
        if (key === 3) setCurrentView('review');
        if (key === 4) setCurrentView('notes');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('srs');

  const selectedDeck = useMemo(() =>
    decks.find(d => d.id === selectedDeckId), [decks, selectedDeckId]
  );

  const navigateToModule = (id: string) => {
    setSelectedDeckId(id);
    setCurrentView('module-detail');
  };

  const startReview = (id: string, mode: StudyMode = 'srs') => {
    setSelectedDeckId(id || null);
    setStudyMode(mode);
    setCurrentView('review');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'modules', label: 'Modules', icon: Library },
    { id: 'review', label: 'Practice', icon: BrainCircuit },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ];

  const isNotesView = currentView === 'notes';

  return (
    <div className="flex min-h-screen w-full bg-[#FAFAFA] dark:bg-[#09090B] text-foreground font-sans selection:bg-primary/10">
      {/* Slim Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-20 flex-col border-r bg-background/50 backdrop-blur-xl">
        <div className="flex h-20 items-center justify-center border-b">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-4 py-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
                (currentView === item.id || (item.id === 'modules' && currentView === 'module-detail'))
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="absolute left-16 scale-0 rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-xl transition-all group-hover:scale-100 font-medium">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-4 border-t py-8">
          <button className="flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
            <Settings className="h-5 w-5" />
          </button>
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">JS</AvatarFallback>
          </Avatar>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex flex-1 flex-col pl-20">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between bg-background/50 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold tracking-tight capitalize">
              {currentView === 'dashboard' ? 'Overview' : currentView.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground transition-all duration-300"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden flex flex-col">
          {/* Notes gets full bleed — no padding, no max-width */}
          {isNotesView ? (
            <NotesView
              notes={notes}
              decks={decks}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              onCreateCard={addCard}
            />
          ) : (
            <div className="p-8">
              <div className="mx-auto max-w-6xl">
                {currentView === 'dashboard' && (
                  <DashboardView
                    decks={decks}
                    sessionHistory={sessionHistory}
                    onNavigateModules={() => setCurrentView('modules')}
                    onStartReview={startReview}
                  />
                )}
                {currentView === 'modules' && (
                  <ModulesView
                    decks={decks}
                    onAddModule={addDeck}
                    onSelect={navigateToModule}
                  />
                )}
                {currentView === 'module-detail' && selectedDeck && (
                  <ModuleDetailView
                    deck={selectedDeck}
                    notes={notes}
                    onBack={() => setCurrentView('modules')}
                    onAddCard={(f, b, t) => addCard(selectedDeck.id, f, b, t)}
                    onDeleteCard={(cid) => deleteCard(selectedDeck.id, cid)}
                    onDeleteModule={() => { deleteDeck(selectedDeck.id); setCurrentView('modules'); }}
                    onStudy={(mode) => startReview(selectedDeck.id, mode)}
                  />
                )}
                {currentView === 'review' && (
                  <ReviewPathView
                    decks={decks}
                    selectedDeckId={selectedDeckId}
                    mode={studyMode}
                    onReview={(did, cid, grade) => reviewCard(did, cid, grade)}
                    onFinish={(count) => {
                      if (count > 0) recordSession(count, 'completed');
                      setCurrentView('dashboard');
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}