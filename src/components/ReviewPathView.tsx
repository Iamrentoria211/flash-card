import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Deck, Card, Grade } from '@/utils/srs';
import type { StudyMode } from '@/types';
import { Button } from "@/components/ui/button";
import { FlashcardSurface } from './FlashcardSurface';
import { Sparkles, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewPathViewProps {
  decks: Deck[];
  selectedDeckId: string | null;
  mode: StudyMode;
  onReview: (did: string, cid: string, grade: Grade) => void;
  onFinish: (count: number) => void;
}

// Grade button config
const GRADE_BUTTONS = [
  { label: 'Again', grade: 0 as Grade, key: '1', style: 'bg-red-50   dark:bg-red-950/40  text-red-700  dark:text-red-400  hover:bg-red-100  dark:hover:bg-red-900/60' },
  { label: 'Hard', grade: 1 as Grade, key: '2', style: 'bg-zinc-100 dark:bg-zinc-800     text-foreground                      hover:bg-zinc-200 dark:hover:bg-zinc-700' },
  { label: 'Good', grade: 2 as Grade, key: '3', style: 'bg-primary  text-primary-foreground                                   hover:bg-primary/90' },
  { label: 'Easy', grade: 3 as Grade, key: '4', style: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60' },
] as const;

export function ReviewPathView({
  decks,
  selectedDeckId,
  mode,
  onReview,
  onFinish,
}: ReviewPathViewProps) {

  // Build initial queue
  const initialCards = useMemo(() => {
    if (selectedDeckId) {
      const d = decks.find(d => d.id === selectedDeckId);
      if (!d) return [];
      const due = d.cards.filter(c => new Date(c.srs.nextReview) <= new Date()).map(c => ({ ...c, deckId: d.id, deckName: d.name }));
      const all = d.cards.map(c => ({ ...c, deckId: d.id, deckName: d.name }));
      return mode === 'srs' ? (due.length > 0 ? due : all) : all;
    }
    const allDue = decks.flatMap(d =>
      d.cards.filter(c => new Date(c.srs.nextReview) <= new Date()).map(c => ({ ...c, deckId: d.id, deckName: d.name }))
    );
    const everything = decks.flatMap(d =>
      d.cards.map(c => ({ ...c, deckId: d.id, deckName: d.name }))
    );
    return mode === 'srs' ? (allDue.length > 0 ? allDue : everything) : everything;
  }, [decks, selectedDeckId, mode]);

  type QueueCard = Card & { deckId: string; deckName: string };

  const [sessionQueue, setSessionQueue] = useState<QueueCard[]>(initialCards as QueueCard[]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fix: track total separately from correct so Again cards are still counted
  const [sessionStats, setSessionStats] = useState({ correct: 0, hard: 0, again: 0, total: 0 });

  const currentCard = sessionQueue[currentIndex] as QueueCard | undefined;
  const isSessionComplete = !currentCard || currentIndex >= sessionQueue.length;

  // Advance to next card with a short transition delay
  const advanceCard = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsFlipped(false);
      setCurrentIndex(i => i + 1);
      setIsAnimating(false);
    }, 200);
  }, []);

  const handleReview = useCallback((grade: Grade) => {
    if (!currentCard) return;

    onReview(currentCard.deckId, currentCard.id, grade);

    // Always increment total — even Again
    setSessionStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (grade >= 2 ? 1 : 0),
      hard: prev.hard + (grade === 1 ? 1 : 0),
      again: prev.again + (grade === 0 ? 1 : 0),
    }));

    // Re-queue failed cards a few positions ahead
    if (grade === 0) {
      setSessionQueue(prev => {
        const next = [...prev];
        const targetIndex = Math.min(currentIndex + 4, next.length);
        next.splice(targetIndex, 0, currentCard);
        return next;
      });
    }

    advanceCard();
  }, [currentCard, currentIndex, onReview, advanceCard]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSessionComplete || isAnimating) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
        return;
      }

      if (isFlipped) {
        const btn = GRADE_BUTTONS.find(b => b.key === e.key);
        if (btn) handleReview(btn.grade);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isSessionComplete, isAnimating, handleReview]);

  // ── Session complete screen ──────────────────────────────────────────────
  if (isSessionComplete) {
    const accuracy = sessionStats.total > 0
      ? Math.round((sessionStats.correct / sessionStats.total) * 100)
      : 0;

    return (
      <div className="flex flex-col items-center justify-center py-40 text-center max-w-xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="h-28 w-28 rounded-[3rem] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl font-bold tracking-tighter">
            {sessionStats.total > 0 ? 'Session Complete!' : 'You\'re all caught up.'}
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            {sessionStats.total > 0
              ? `${sessionStats.total} cards reviewed`
              : 'No more reviews scheduled for today.'}
          </p>
        </div>

        {/* Stats summary */}
        {sessionStats.total > 0 && (
          <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{accuracy}%</div>
              <div className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mt-1">Accuracy</div>
            </div>
            <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-4 text-center">
              <div className="text-2xl font-bold">{sessionStats.correct}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Good</div>
            </div>
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{sessionStats.again}</div>
              <div className="text-xs font-bold text-red-400/70 uppercase tracking-widest mt-1">Again</div>
            </div>
          </div>
        )}

        <Button
          size="lg"
          onClick={() => onFinish(sessionStats.total)}
          className="h-14 px-10 rounded-[2rem] text-base font-bold shadow-lg shadow-primary/20"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // ── Session progress ─────────────────────────────────────────────────────
  const progressPercent = sessionQueue.length > 0
    ? Math.round((currentIndex / sessionQueue.length) * 100)
    : 0;

  const isCrossDecks = !selectedDeckId && decks.length > 1;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-3xl mx-auto py-8 flex flex-col gap-8 min-h-[80vh] justify-center">

      {/* Session header */}
      <div className="flex justify-between items-center px-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Focus Session
            </span>
          </div>
          <p className="text-sm font-bold tracking-tight">
            {currentIndex + 1}{' '}
            <span className="text-muted-foreground font-medium">of {sessionQueue.length}</span>
          </p>
        </div>

        {/* Progress bar — always visible in header */}
        <div className="flex-1 mx-8 space-y-1">
          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFinish(sessionStats.total)}
          className="rounded-full font-bold h-10 px-5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          End Session
        </Button>
      </div>

      {/* Flashcard */}
      <div
        className={cn(
          "relative perspective-1000 h-[460px] w-full cursor-pointer select-none transition-opacity duration-200",
          isAnimating && "opacity-0"
        )}
        onClick={() => !isAnimating && setIsFlipped(f => !f)}
      >
        <div className={cn(
          "relative h-full w-full transition-all duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] [transform-style:preserve-3d]",
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        )}>

          {/* Front — Question */}
          <div className="absolute inset-0 flex flex-col [backface-visibility:hidden] bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden">

            {/* Card top bar */}
            <div className="flex items-center justify-between px-10 pt-10 pb-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Question
              </span>
              {isCrossDecks && currentCard.deckName && (
                <span className="text-[10px] font-bold uppercase tracking-widest bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                  {currentCard.deckName}
                </span>
              )}
            </div>

            {/* Card content */}
            <div className="flex-1 flex items-center justify-center px-12 py-8">
              <FlashcardSurface
                content={currentCard.front}
                className="text-3xl font-bold leading-tight tracking-tighter text-balance text-center"
              />
            </div>

            {/* Reveal hint — always visible, not hidden */}
            <div className="flex items-center justify-center gap-2 pb-10 text-xs font-semibold text-muted-foreground/60">
              <Keyboard className="h-3.5 w-3.5" />
              Click or press Space to reveal
            </div>
          </div>

          {/* Back — Answer */}
          <div className="absolute inset-0 flex flex-col [backface-visibility:hidden] [transform:rotateY(180deg)] bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-10 pt-10 pb-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
                Answer
              </span>
              {isCrossDecks && currentCard.deckName && (
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 dark:bg-zinc-900/10 px-2.5 py-1 rounded-full opacity-60">
                  {currentCard.deckName}
                </span>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center px-12 py-8">
              <FlashcardSurface
                content={currentCard.back}
                className="text-2xl font-semibold leading-relaxed text-balance text-center"
              />
            </div>

            {/* Keyboard hint on back */}
            <div className="flex items-center justify-center gap-2 pb-10 text-xs font-semibold opacity-30">
              <Keyboard className="h-3.5 w-3.5" />
              Rate with 1 · 2 · 3 · 4
            </div>
          </div>
        </div>
      </div>

      {/* Grade buttons — fixed height container, no layout shift */}
      <div className="h-28 flex flex-col items-center justify-center">
        {isFlipped ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-wrap justify-center gap-3">
            {GRADE_BUTTONS.map(btn => (
              <Button
                key={btn.label}
                size="lg"
                className={cn(
                  "h-14 px-8 rounded-2xl font-bold shadow-none border-0 relative group/btn transition-transform duration-150 hover:scale-105 active:scale-95",
                  btn.style
                )}
                onClick={e => { e.stopPropagation(); handleReview(btn.grade); }}
              >
                {btn.label}
                {/* Keyboard key badge */}
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background border text-[10px] font-bold flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity shadow-sm">
                  {btn.key}
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
            {progressPercent}% complete
          </p>
        )}
      </div>
    </div>
  );
}