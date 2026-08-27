import { supplementById } from '../data/supplements';
import { formatRemainingTime } from '../lib/time';
import type { ActiveTask, NextTask } from '../types';
import { CheckIcon, ClockIcon } from './Icons';

interface CurrentStatusProps {
  activeTask: ActiveTask | null;
  nextTask: NextTask | null;
  activeChecked: boolean;
  onToggleActive: () => void;
}

export function CurrentStatus({ activeTask, nextTask, activeChecked, onToggleActive }: CurrentStatusProps) {
  if (!activeTask) {
    return (
      <section aria-labelledby="current-status-heading" className="rounded-3xl border border-white/8 bg-white/[0.035] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live status</p>
        <h2 id="current-status-heading" className="mt-2 text-lg font-semibold text-white">현재 일정 없음</h2>
        {nextTask ? (
          <div className="mt-4 rounded-2xl border border-white/8 bg-black/15 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Next</p>
            <div className="mt-1 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-100">{nextTask.task.title}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">{nextTask.task.start} · {formatRemainingTime(nextTask.minutesUntil)}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm leading-6 text-slate-400">선택한 모드에 표시할 일정이 없습니다.</p>
        )}
      </section>
    );
  }

  const supplements = activeTask.task.supplementIds?.map((id) => supplementById.get(id)).filter((item) => item !== undefined) ?? [];

  return (
    <section aria-labelledby="current-status-heading" className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/12 to-cyan-400/[0.04] p-5 shadow-[0_24px_80px_-45px_rgba(52,211,153,0.7)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300" aria-live="polite">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </span>
            Now
          </div>
          <h2 id="current-status-heading" className="mt-3 text-2xl font-semibold tracking-tight text-white">{activeTask.task.title}</h2>
          <p className="mt-1 font-mono text-xs font-semibold tabular-nums text-emerald-100/70">{activeTask.task.start}–{activeTask.task.end}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{activeTask.task.description}</p>

          {supplements.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="현재 관련 영양제">
              {supplements.map((supplement) => (
                <span key={supplement.id} className="rounded-lg border border-indigo-200/10 bg-indigo-200/8 px-2 py-1 text-[11px] font-medium text-indigo-100">
                  {supplement.number} {supplement.shortName}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-black/20 px-3 py-2 text-xs font-medium text-emerald-100">
            <ClockIcon />
            <span className="tabular-nums">{formatRemainingTime(activeTask.remainingMinutes)}</span>
          </div>
          <button
            type="button"
            aria-pressed={activeChecked}
            onClick={onToggleActive}
            className={`flex min-h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
              activeChecked
                ? 'border-emerald-300/40 bg-emerald-300 text-emerald-950'
                : 'border-white/12 bg-white/[0.05] text-slate-100 hover:border-white/25'
            }`}
          >
            <CheckIcon />
            {activeChecked ? '완료됨' : '완료'}
          </button>
        </div>
      </div>

      {nextTask ? (
        <div className="mt-5 border-t border-emerald-200/10 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Next</p>
          <div className="mt-1 flex items-center justify-between gap-4">
            <p className="min-w-0 truncate text-sm font-semibold text-slate-200">{nextTask.task.title}</p>
            <p className="shrink-0 font-mono text-xs text-slate-500">{nextTask.task.start} · {formatRemainingTime(nextTask.minutesUntil)}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
