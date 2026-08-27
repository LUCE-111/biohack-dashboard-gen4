import type { TaskFilter } from '../types';

interface FilterBarProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

const filters: readonly { value: TaskFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'supp', label: '영양제' },
  { value: 'work', label: '업무' },
  { value: 'sleep', label: '수면' },
];

export function FilterBar({ filter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="일정 필터">
      {filters.map((item) => {
        const active = item.value === filter;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onFilterChange(item.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active ? 'border-slate-400/40 bg-slate-200 text-slate-950' : 'border-white/8 bg-white/[0.035] text-slate-400 hover:border-white/15 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
