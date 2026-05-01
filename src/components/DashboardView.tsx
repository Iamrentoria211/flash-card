import type { Deck } from '@/utils/srs';
import type { StudyMode } from '@/types';
import type { SessionHistoryItem } from '@/hooks/useFlashcardData';
import { Button } from "@/components/ui/button";
import { StudyHeatmap } from './StudyHeatmap';
import {
  Sparkles,
  TrendingUp,
  BookOpen,
  Calendar,
  Library,
  ChevronRight,
  CheckCircle2,
  Zap,
  Brain,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardViewProps {
  decks: Deck[];
  sessionHistory: SessionHistoryItem[];
  /** Average retention rate 0–100 derived from SRS ease factors */
  retentionRate?: number;
  /** Average review interval in days */
  avgIntervalDays?: number;
  onNavigateModules: () => void;
  onStartReview: (id: string, mode: StudyMode) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTimeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getRetentionLabel(rate: number): { text: string; color: string } {
  if (rate >= 85) return { text: "Optimal stability", color: "text-emerald-500" };
  if (rate >= 70) return { text: "Building nicely", color: "text-blue-500" };
  if (rate >= 50) return { text: "Needs attention", color: "text-amber-500" };
  return { text: "Start reviewing", color: "text-red-400" };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  unit,
  sub,
  subColor,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  subColor?: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6 flex flex-col justify-between gap-6 transition-colors duration-300",
        highlight
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-widest",
            highlight ? "opacity-50" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center",
            highlight ? "bg-white/15" : "bg-background"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tracking-tighter">{value}</span>
          {unit && (
            <span
              className={cn(
                "text-base font-semibold",
                highlight ? "opacity-40" : "text-muted-foreground"
              )}
            >
              {unit}
            </span>
          )}
        </div>
        {sub && (
          <p className={cn("text-xs font-medium mt-1", subColor ?? (highlight ? "opacity-60" : "text-muted-foreground"))}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function DistributionBar({
  mastered,
  active,
  newCards,
  total,
}: {
  mastered: number;
  active: number;
  newCards: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {mastered > 0 && (
          <div
            className="bg-emerald-400 dark:bg-emerald-500 rounded-l-full transition-all duration-700"
            style={{ width: pct(mastered) }}
          />
        )}
        {active > 0 && (
          <div
            className="bg-blue-400 dark:bg-blue-500 transition-all duration-700"
            style={{ width: pct(active) }}
          />
        )}
        {newCards > 0 && (
          <div
            className="bg-zinc-200 dark:bg-zinc-700 rounded-r-full transition-all duration-700"
            style={{ width: pct(newCards) }}
          />
        )}
      </div>
      <div className="flex items-center gap-5 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 dark:bg-emerald-500 inline-block" />
          Mastered · {mastered}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-500 inline-block" />
          Active · {active}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600 inline-block" />
          New · {newCards}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashboardView({
  decks,
  sessionHistory = [],
  retentionRate,
  avgIntervalDays,
  onNavigateModules,
  onStartReview,
}: DashboardViewProps) {

  // --- Derived stats -------------------------------------------------------
  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0);

  const totalDue = decks.reduce(
    (acc, d) =>
      acc + d.cards.filter((c) => new Date(c.srs.nextReview) <= new Date()).length,
    0
  );

  const masteredCards = decks.reduce(
    (acc, d) => acc + d.cards.filter((c) => c.srs.repetitions >= 5).length,
    0
  );

  // "Active" = seen at least once but not yet mastered
  const activeCards = decks.reduce(
    (acc, d) =>
      acc +
      d.cards.filter((c) => c.srs.repetitions > 0 && c.srs.repetitions < 5).length,
    0
  );

  const newCards = totalCards - masteredCards - activeCards;

  const masteringProgress = totalCards
    ? Math.round((masteredCards / totalCards) * 100)
    : 0;

  const retentionLabel = getRetentionLabel(retentionRate ?? masteringProgress);
  const allCaughtUp = totalDue === 0 && totalCards > 0;

  // -------------------------------------------------------------------------
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-12">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground tracking-wide">
            {getGreeting()}
          </p>
          <h2 className="text-5xl font-bold tracking-tighter leading-tight">
            {allCaughtUp ? (
              <>You're all caught up.</>
            ) : totalCards === 0 ? (
              <>Let's get started.</>
            ) : (
              <>Focus on what<br />matters today.</>
            )}
          </h2>
          <p className="text-base text-muted-foreground max-w-md font-medium pt-1">
            {allCaughtUp
              ? "Nothing due right now. Great work keeping up with your reviews."
              : totalCards === 0
                ? "Create your first deck and add cards to begin learning."
                : <>You have <span className="text-foreground font-bold">{totalDue} {totalDue === 1 ? "card" : "cards"}</span> waiting for review.</>
            }
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button
            size="lg"
            className="h-13 px-7 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
            onClick={() => onStartReview("", "srs")}
            disabled={totalDue === 0}
          >
            Start Session
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-13 px-7 rounded-2xl text-base font-bold"
            onClick={() => onStartReview("", "anytime")}
            disabled={totalCards === 0}
          >
            Quick Review
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Row 1: Memory Stability hero + Retention Rate + Avg Interval */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">

          {/* Memory Stability — hero card */}
          <div className="col-span-2 rounded-3xl p-7 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl relative overflow-hidden group">
            <Sparkles className="absolute -right-6 -top-6 h-40 w-40 opacity-10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col h-full justify-between gap-8">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                  Memory Stability
                </span>
                <div className="h-8 w-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <Brain className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-6xl font-bold tracking-tighter">
                  {masteringProgress}%
                </div>
                <p className="text-sm font-medium opacity-60 mt-1">
                  {masteredCards} of {totalCards} cards mastered
                </p>
              </div>
            </div>
          </div>

          {/* Retention Rate */}
          <StatCard
            label="Retention Rate"
            value={retentionRate != null ? retentionRate.toFixed(1) : masteringProgress}
            unit="%"
            sub={retentionLabel.text}
            subColor={retentionLabel.color}
            icon={TrendingUp}
          />

          {/* Avg Interval */}
          <StatCard
            label="Avg. Interval"
            value={avgIntervalDays != null ? avgIntervalDays.toFixed(1) : "—"}
            unit={avgIntervalDays != null ? "days" : undefined}
            sub={avgIntervalDays != null ? "before next review" : "No data yet"}
            icon={Clock}
          />
        </div>

        {/* Row 2: Total Cards | Due Today | Knowledge Distribution */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard
            label="Total Cards"
            value={totalCards}
            sub={`across ${decks.length} ${decks.length === 1 ? "module" : "modules"}`}
            icon={BookOpen}
          />
          <StatCard
            label="Due Today"
            value={totalDue}
            sub={totalDue === 0 ? "All clear!" : `${totalDue === 1 ? "card needs" : "cards need"} review`}
            subColor={totalDue > 0 ? "text-primary font-semibold" : "text-emerald-500"}
            icon={Calendar}
            highlight={totalDue > 0}
          />

          {/* Study Heatmap — spans remaining 2 cols */}
          <div className="col-span-2 rounded-3xl p-6 bg-zinc-100 dark:bg-zinc-900 flex flex-col justify-center">
            <StudyHeatmap history={sessionHistory} />
          </div>
        </div>
      </div>

      {/* ── Active Modules + Session History ─────────────────────────────── */}
      <div className="grid gap-10 md:grid-cols-2">

        {/* Active Modules */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">Active Modules</h3>
            <Button variant="link" onClick={onNavigateModules} className="font-bold text-sm p-0 h-auto">
              See all
            </Button>
          </div>

          <div className="space-y-3">
            {decks.length === 0 ? (
              <div className="flex items-center justify-center h-28 rounded-3xl border border-dashed text-muted-foreground text-sm font-medium">
                No modules yet — create your first deck.
              </div>
            ) : (
              decks.slice(0, 4).map((deck) => {
                const due = deck.cards.filter(
                  (c) => new Date(c.srs.nextReview) <= new Date()
                ).length;
                const mastered = deck.cards.filter((c) => c.srs.repetitions >= 5).length;
                const pctMastered = deck.cards.length
                  ? Math.round((mastered / deck.cards.length) * 100)
                  : 0;

                return (
                  <div
                    key={deck.id}
                    className="group flex items-center justify-between p-4 rounded-2xl border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Library className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-sm tracking-tight truncate">{deck.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                          {" · "}
                          <span className={cn(due > 0 ? "text-primary font-bold" : "")}>
                            {due > 0 ? `${due} due` : "up to date"}
                          </span>
                          {" · "}
                          <span className="text-emerald-600 dark:text-emerald-400">{pctMastered}% mastered</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full h-9 w-9 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onStartReview(deck.id, "srs")}
                      disabled={due === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Session History */}
        <div className="space-y-5">
          <h3 className="text-lg font-bold tracking-tight">Session History</h3>

          {sessionHistory.length === 0 ? (
            <div className="flex items-center justify-center h-28 rounded-3xl border border-dashed text-muted-foreground text-sm font-medium">
              No sessions yet — complete your first review.
            </div>
          ) : (
            <div className="space-y-1">
              {sessionHistory.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0",
                      session.status === "completed"
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                        : session.status === "failed"
                          ? "bg-red-100 dark:bg-red-900/40 text-red-500"
                          : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"
                    )}
                  >
                    {session.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : session.status === "failed" ? (
                      <Zap className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">
                      {session.status === "completed"
                        ? "Session Completed"
                        : session.status === "failed"
                          ? "Session Abandoned"
                          : "Session Skipped"}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {session.itemCount} {session.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium flex-shrink-0">
                    {getTimeAgo(session.completedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}