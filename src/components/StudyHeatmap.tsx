import { useMemo } from 'react';
import { cn } from "@/lib/utils";
import type { SessionHistoryItem } from '../hooks/useFlashcardData';

interface StudyHeatmapProps {
  history: SessionHistoryItem[];
  className?: string;
}

export function StudyHeatmap({ history, className }: StudyHeatmapProps) {
  const days = 140; // Approx 20 weeks
  
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    history.forEach(session => {
      const date = new Date(session.completedAt);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString();
      data[key] = (data[key] || 0) + session.itemCount;
    });

    return Array.from({ length: days }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - i));
      const key = date.toISOString();
      const count = data[key] || 0;
      
      let intensity = 0;
      if (count > 0) intensity = 1;
      if (count > 10) intensity = 2;
      if (count > 25) intensity = 3;
      if (count > 50) intensity = 4;

      return {
        date,
        count,
        intensity
      };
    });
  }, [history]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; index: number }[] = [];
    let lastMonth = -1;

    heatmapData.forEach((day, i) => {
      const month = day.date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: day.date.toLocaleDateString(undefined, { month: 'short' }),
          index: i
        });
        lastMonth = month;
      }
    });

    return labels;
  }, [heatmapData]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Study Consistency
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Less
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-sm bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-2 w-2 rounded-sm bg-primary/20" />
            <div className="h-2 w-2 rounded-sm bg-primary/50" />
            <div className="h-2 w-2 rounded-sm bg-primary/80" />
            <div className="h-2 w-2 rounded-sm bg-primary" />
          </div>
          More
        </div>
      </div>

      <div className="relative pt-4">
        {/* Month Labels */}
        <div className="absolute top-0 left-0 w-full flex text-[10px] font-bold text-muted-foreground/50 uppercase">
          {monthLabels.map((m, i) => (
            <span 
              key={i} 
              className="absolute whitespace-nowrap"
              style={{ left: `${(m.index / days) * 100}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* The Grid */}
        <div className="flex gap-1 h-20 items-end">
          {heatmapData.map((day, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-sm transition-all duration-500 hover:ring-2 ring-primary ring-offset-2 ring-offset-background cursor-help",
                day.intensity === 0 && "bg-zinc-100 dark:bg-zinc-900 h-1/4",
                day.intensity === 1 && "bg-primary/20 h-1/3",
                day.intensity === 2 && "bg-primary/50 h-1/2",
                day.intensity === 3 && "bg-primary/80 h-3/4",
                day.intensity === 4 && "bg-primary h-full"
              )}
              title={`${day.count} cards on ${day.date.toLocaleDateString()}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
