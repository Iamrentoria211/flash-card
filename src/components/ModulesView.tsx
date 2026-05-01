import { useState } from 'react';
import type { Deck } from '@/utils/srs';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Library, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModulesViewProps {
  decks: Deck[];
  onAddModule: (n: string, d: string) => void;
  onSelect: (id: string) => void;
}

export function ModulesView({ decks, onAddModule, onSelect }: ModulesViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddModule(name.trim(), desc.trim());
      setName('');
      setDesc('');
      setShowAdd(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tighter">Your Library</h2>
          <p className="text-muted-foreground font-medium">
            {decks.length === 0
              ? "Create your first module to get started."
              : `${decks.length} ${decks.length === 1 ? "module" : "modules"} · ${decks.reduce((a, d) => a + d.cards.length, 0)} total cards`
            }
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(!showAdd)}
          className="h-12 px-6 rounded-2xl font-bold"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Module
        </Button>
      </div>

      {/* Add Module Form */}
      {showAdd && (
        <Card className="rounded-[2rem] border-2 border-dashed bg-muted/30 shadow-none animate-in slide-in-from-top-4 duration-300 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Module Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Computer Science 101"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                    className="h-12 rounded-xl bg-background border-none shadow-sm focus-visible:ring-1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Description <span className="text-muted-foreground/50 normal-case font-normal">(optional)</span>
                  </label>
                  <Input
                    placeholder="What are you learning?"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    className="h-12 rounded-xl bg-background border-none shadow-sm focus-visible:ring-1"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl px-6 font-bold" disabled={!name.trim()}>
                  Create Module
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowAdd(false); setName(''); setDesc(''); }}
                  className="rounded-xl px-6 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      {/* Empty state */}
      {decks.length === 0 && !showAdd && (
        <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed rounded-[3rem] opacity-50">
          <Library className="h-12 w-12 mb-4" />
          <p className="font-bold text-lg">No modules yet</p>
          <p className="text-muted-foreground text-sm mt-1">Click "New Module" to create your first one.</p>
        </div>
      )}

      {/* Module Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map(deck => {
          const dueCount = deck.cards.filter(
            c => new Date(c.srs.nextReview) <= new Date()
          ).length;
          const mastery = deck.cards.length
            ? Math.round(
              (deck.cards.filter(c => c.srs.repetitions >= 5).length / deck.cards.length) * 100
            )
            : 0;
          const activeCount = deck.cards.filter(
            c => c.srs.repetitions > 0 && c.srs.repetitions < 5
          ).length;

          return (
            <Card
              key={deck.id}
              className="group border bg-background rounded-[2rem] p-7 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              onClick={() => onSelect(deck.id)}
            >
              <div className="flex flex-col h-full gap-5">

                {/* Top row: icon + due badge */}
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                    <Library className="h-5 w-5" />
                  </div>
                  {dueCount > 0 ? (
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {dueCount} due
                    </div>
                  ) : deck.cards.length > 0 ? (
                    <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Up to date
                    </div>
                  ) : null}
                </div>

                {/* Name + description */}
                <div className="space-y-1 flex-1">
                  <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors leading-tight">
                    {deck.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                    {deck.description || 'No description.'}
                  </p>
                </div>

                {/* Footer: mastery + card count */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Mastery
                    </span>
                    <span className={cn(
                      "text-xs font-bold",
                      mastery >= 80 ? "text-emerald-500" :
                        mastery >= 40 ? "text-blue-500" :
                          "text-muted-foreground"
                    )}>
                      {mastery}%
                    </span>
                  </div>
                  {/* Visible track even at 0% */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        mastery >= 80 ? "bg-emerald-500" :
                          mastery >= 40 ? "bg-blue-500" :
                            mastery > 0 ? "bg-primary" :
                              "bg-transparent"
                      )}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-medium">
                      {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                      {activeCount > 0 && ` · ${activeCount} in progress`}
                    </span>
                    <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}