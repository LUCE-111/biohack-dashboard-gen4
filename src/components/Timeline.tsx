import { useEffect, useRef } from 'react';
import { supplementById } from '../data/supplements';
import type { ActiveTask, Schedule, TaskFilter, TaskTag } from '../types';
import { CheckIcon } from './Icons';

interface TimelineProps {
  schedule: Schedule;
  activeTask: ActiveTask | null;
  filter: TaskFilter;
  shiftInstanceKey: string;
  checkedTaskIds: ReadonlySet<string>;
  onToggleTask: (taskId: string) => void;
}

const tagLabel: Readonly<Record<TaskTag, string>> = {
  supp: '영양제',
  food: '식사',
  rest: '회복',
  work: '업무',
  transit: '이동',
  sleep: '수면',
  alert: '주의',
};

const tagClass: Readonly<Record<TaskTag, string>> = {
  supp: 'border-indigo-300/20 bg-indigo-300/10 text-indigo-200',
  food: 'border-teal-300/20 bg-teal-300/10 text-teal-200',
  rest: 'border-slate-300/15 bg-slate-300/8 text-slate-300',
  work: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  transit: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  sleep: 'border-blue-300/20 bg-blue-300/10 text-blue-200',
  alert: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
};

function isVisible(tag: TaskTag, filter: TaskFilter): boolean {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'supp') {
    return tag === 'supp' || tag === 'food';
  }
  return tag === filter;
}

export function Timeline({ schedule, activeTask, filter, shiftInstanceKey, checkedTaskIds, onToggleTask }: TimelineProps) {
  const activeRef = useRef<HTMLElement | null>(null);
  const initialScrollKey = useRef<string | null>(null);
  const visibleTasks = schedule.tasks.map((task, index) => ({ task, index })).filter(({ task }) => isVisible(task.tag, filter));

  const scrollToNow = (): void => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    if (filter !== 'all' || !activeTask || initialScrollKey.current === schedule.key) {
      return;
    }
    initialScrollKey.current = schedule.key;
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeTask, filter, schedule.key]);

  if (visibleTasks.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/12 px-5 py-12 text-center">
        <p className="text-sm font-semibold text-slate-300">표시할 일정이 없습니다.</p>
        <p className="mt-1 text-sm text-slate-500">다른 필터를 선택해 보세요.</p>
      </div>
    );
  }

  return (
    <div>
      {activeTask && filter === 'all' ? (
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={scrollToNow} className="min-h-11 rounded-xl border border-white/8 bg-white/[0.03] px-3 text-xs font-semibold text-slate-400 hover:text-slate-100">
            ↓ NOW로 이동
          </button>
        </div>
      ) : null}

      <ol className="relative ml-2 border-l border-white/10 pl-6 sm:pl-8" aria-label={`${schedule.title} 타임라인`}>
        {visibleTasks.map(({ task, index }) => {
          const taskId = `${shiftInstanceKey}_${task.id}`;
          const checked = checkedTaskIds.has(taskId);
          const active = activeTask?.index === index;
          const supplementNames = task.supplementIds?.map((id) => supplementById.get(id)).filter((item) => item !== undefined) ?? [];

          return (
            <li key={task.id} className="relative pb-4 last:pb-0">
              <span
                aria-hidden="true"
                className={`absolute -left-[31px] top-6 h-3 w-3 rounded-full border-2 border-[#080a0f] sm:-left-[39px] ${active ? 'bg-emerald-300 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]' : 'bg-slate-600'}`}
              />
              <article
                ref={active ? (node) => { activeRef.current = node; } : undefined}
                className={`group rounded-2xl border p-4 transition sm:p-5 ${
                  active
                    ? 'border-emerald-300/30 bg-emerald-300/[0.07] shadow-[0_18px_55px_-38px_rgba(52,211,153,0.8)]'
                    : checked
                      ? 'border-white/6 bg-white/[0.02] opacity-55'
                      : 'border-white/8 bg-white/[0.035] hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <time className="font-mono text-xs font-semibold tabular-nums text-slate-400">{task.start}–{task.end}</time>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tagClass[task.tag]}`}>{tagLabel[task.tag]}</span>
                      {active ? <span className="rounded-full bg-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-950">Now</span> : null}
                    </div>
                    <h3 className={`mt-2 text-base font-semibold ${checked ? 'text-slate-400 line-through decoration-slate-500/60' : 'text-slate-100'}`}>{task.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{task.description}</p>

                    {supplementNames.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="관련 영양제">
                        {supplementNames.map((supplement) => (
                          <span key={supplement.id} className="rounded-lg bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-300">
                            {supplement.number} {supplement.shortName}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    aria-label={`${task.title} ${checked ? '완료 취소' : '완료 처리'}`}
                    aria-pressed={checked}
                    onClick={() => onToggleTask(taskId)}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition ${
                      checked ? 'border-emerald-300/40 bg-emerald-300 text-emerald-950' : 'border-white/12 bg-white/[0.03] text-slate-500 hover:border-white/25 hover:text-slate-200'
                    }`}
                  >
                    <CheckIcon />
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
