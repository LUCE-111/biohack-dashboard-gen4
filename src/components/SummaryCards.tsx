import type { Schedule } from '../types';

interface SummaryCardsProps {
  schedule: Schedule;
  completed: number;
  total: number;
}

export function SummaryCards({ schedule, completed, total }: SummaryCardsProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <section aria-label="오늘 요약" className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
        <p className="text-xs font-medium text-slate-500">운동</p>
        <p className="mt-2 text-sm font-semibold text-slate-100">{schedule.info.exercise}</p>
      </article>
      <article className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
        <p className="text-xs font-medium text-slate-500">식단</p>
        <p className="mt-2 text-sm font-semibold text-slate-100">{schedule.info.diet}</p>
      </article>
      <article className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-500">루틴 완료</p>
          <span className="text-xs font-semibold tabular-nums text-slate-300">{completed}/{total}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-label="루틴 완료율" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
          <div className="h-full rounded-full bg-slate-200 transition-[width]" style={{ width: `${percentage}%` }} />
        </div>
      </article>
    </section>
  );
}
