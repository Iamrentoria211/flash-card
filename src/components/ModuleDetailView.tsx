import { useState, useMemo } from 'react';
import type { Deck } from '@/utils/srs';
import type { StudyMode } from '@/types';
import type { Note } from '@/hooks/useNotesData';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FlashcardSurface } from './FlashcardSurface';
import {
  ArrowLeft,
  Trash2,
  Search,
  Library,
  AlertTriangle,
  Tag as TagIcon,
  X,
  FileText,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleDetailViewProps {
  deck: Deck;
  notes: Note[];
  onBack: () => void;
  onAddCard: (f: string, b: string, t: string[]) => void;
  onDeleteCard: (id: string) => void;
  onDeleteModule: () => void;
  onStudy: (mode: StudyMode) => void;
}

export function ModuleDetailView({
  deck,
  notes,
  onBack,
  onAddCard,
  onDeleteCard,
  onDeleteModule,
  onStudy,
}: ModuleDetailViewProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const filteredCards = useMemo(() => {
    if (!searchQuery) return deck.cards;
    const query = searchQuery.toLowerCase();
    return deck.cards.filter(c =>
      c.front.toLowerCase().includes(query) ||
      c.back.toLowerCase().includes(query) ||
      (c.tags && c.tags.some(t => t.toLowerCase().includes(query)))
    );
  }, [deck.cards, searchQuery]);

  const dueCount = deck.cards.filter(
    c => new Date(c.srs.nextReview) <= new Date()
  ).length;

  const masteredCount = deck.cards.filter(c => c.srs.repetitions >= 5).length;
  const mastery = deck.cards.length
    ? Math.round((masteredCount / deck.cards.length) * 100)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (front.trim() && back.trim()) {
      onAddCard(front.trim(), back.trim(), tags);
      setFront('');
      setBack('');
      setTags([]);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleDeleteCard = (id: string) => {
    if (deletingCardId === id) {
      onDeleteCard(id);
      setDeletingCardId(null);
    } else {
      setDeletingCardId(id);
    }
  };

  const getRelatedNotes = (cardTags: string[] = []) => {
    if (!cardTags.length) return [];
    return notes.filter(note => 
      note.tags && note.tags.some(t => cardTags.includes(t))
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-24">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="rounded-full h-10 px-4 -ml-4 text-muted-foreground font-bold hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
          <div className="space-y-1.5">
            <h1 className="text-5xl font-bold tracking-tighter">{deck.name}</h1>
            {deck.description && (
              <p className="text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed">
                {deck.description}
              </p>
            )}
            <div className="flex items-center gap-4 pt-1 text-sm font-medium text-muted-foreground">
              <span>{deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}</span>
              {dueCount > 0 && (
                <span className="text-primary font-bold">{dueCount} due for review</span>
              )}
              {mastery > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400">{mastery}% mastered</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <Button
            onClick={() => onStudy('srs')}
            size="lg"
            className="h-13 px-7 rounded-2xl font-bold shadow-lg shadow-primary/20"
            disabled={dueCount === 0}
          >
            Start Review
            {dueCount > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {dueCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-13 px-5 rounded-2xl font-bold"
            onClick={() => onStudy('anytime')}
            disabled={deck.cards.length === 0}
          >
            Quick Review
          </Button>

          {confirmDelete ? (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-2xl px-4">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <span className="text-sm font-semibold text-destructive whitespace-nowrap">Delete module?</span>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-xl h-8 px-3 font-bold ml-1"
                onClick={onDeleteModule}
              >
                Yes, delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl h-8 px-3 font-bold"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="h-13 px-5 rounded-2xl font-bold hover:border-destructive/50 hover:text-destructive transition-colors"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Body: Add Card form + Card List */}
      <div className="grid gap-10 lg:grid-cols-5">

        {/* Add Card — sticky sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-28 space-y-6">
            <h3 className="text-lg font-bold tracking-tight">Add a Card</h3>
            <Card className="rounded-[2rem] border-none bg-zinc-100 dark:bg-zinc-900 shadow-none">
              <form onSubmit={handleSubmit}>
                <CardContent className="p-7 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Question
                    </label>
                    <Textarea
                      placeholder="What do you want to remember?"
                      value={front}
                      onChange={e => setFront(e.target.value)}
                      required
                      className="min-h-[100px] rounded-2xl bg-background border-none shadow-sm focus-visible:ring-1 resize-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Answer
                    </label>
                    <Textarea
                      placeholder="The answer or explanation..."
                      value={back}
                      onChange={e => setBack(e.target.value)}
                      required
                      className="min-h-[100px] rounded-2xl bg-background border-none shadow-sm focus-visible:ring-1 resize-none text-sm"
                    />
                  </div>
                  
                  {/* Tag Input for Card */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                      <TagIcon className="h-3 w-3" /> Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-background shadow-sm min-h-[44px]">
                      {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-lg border border-primary/20">
                          #{tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="bg-transparent text-xs font-bold outline-none placeholder:text-muted-foreground/40 flex-1 min-w-[60px]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/10"
                    disabled={!front.trim() || !back.trim()}
                  >
                    Add Card
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>
        </div>

        {/* Card List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold tracking-tight">
              Cards
              {searchQuery && filteredCards.length !== deck.cards.length && (
                <span className="text-muted-foreground font-normal ml-2 text-base">
                  {filteredCards.length} of {deck.cards.length}
                </span>
              )}
            </h3>
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cards or tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-52 rounded-full bg-zinc-100 dark:bg-zinc-900 border-none text-xs font-medium"
              />
            </div>
          </div>

          {deck.cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-[3rem] opacity-40">
              <Library className="h-10 w-10 mb-3" />
              <p className="font-bold">No cards yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first card using the form.</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-[3rem] opacity-40">
              <Search className="h-8 w-8 mb-3" />
              <p className="font-bold">No matches for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCards.map(card => {
                const mastered = card.srs.repetitions >= 5;
                const seen = card.srs.repetitions > 0;
                const isConfirmingDelete = deletingCardId === card.id;
                const isSelected = selectedCardId === card.id;
                const relatedNotes = getRelatedNotes(card.tags);

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(isSelected ? null : card.id)}
                    className={cn(
                      "group relative flex flex-col p-5 rounded-[1.5rem] border bg-background transition-all duration-200 cursor-pointer",
                      isConfirmingDelete
                        ? "border-destructive/40 bg-destructive/5"
                        : isSelected 
                          ? "border-primary/40 ring-1 ring-primary/20 shadow-lg"
                          : "hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <FlashcardSurface
                          content={card.front}
                          className="text-sm font-bold tracking-tight leading-snug"
                        />
                        <FlashcardSurface
                          content={card.back}
                          className="text-sm text-muted-foreground font-medium leading-relaxed"
                        />
                        
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.tags.map(tag => (
                              <span key={tag} className="text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-muted-foreground px-1.5 py-0.5 rounded-md">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {isConfirmingDelete ? (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="rounded-lg h-7 px-2.5 text-xs font-bold"
                              onClick={() => handleDeleteCard(card.id)}
                            >
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-lg h-7 px-2.5 text-xs font-bold"
                              onClick={() => setDeletingCardId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Related Notes Section */}
                    {isSelected && relatedNotes.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Related Notes</span>
                        </div>
                        <div className="space-y-2">
                          {relatedNotes.map(note => (
                            <div key={note.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 group/note border border-transparent hover:border-primary/20 transition-all">
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{note.title || 'Untitled'}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{note.content.slice(0, 50)}...</p>
                              </div>
                              <ChevronRight className="h-3 w-3 text-muted-foreground group-hover/note:text-primary transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      <div className={cn(
                        "h-1.5 w-8 rounded-full",
                        mastered ? "bg-emerald-500" :
                          seen ? "bg-blue-400" :
                            "bg-muted"
                      )} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {mastered ? "Mastered" : seen ? "In progress" : "New"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
