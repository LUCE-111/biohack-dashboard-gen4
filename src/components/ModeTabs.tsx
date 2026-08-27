import { modeTabs } from '../data/schedules';
import type { Mode } from '../types';

interface ModeTabsProps {
  mode: Mode;
  offDay: 1 | 2 | 3;
  onModeChange: (mode: Mode) => void;
  onOffDayChange: (day: 1 | 2 | 3) => void;
}

const accentByMode: Readonly<Record<Mode, string>> = {
  day: 'data-[active=true]:border-amber-400/40 data-[active=true]:bg-amber-400/12 data-[active=true]:text-amber-100',
  off: 'data-[active=true]:border-sky-400/40 data-[active=true]:bg-sky-400/12 data-[active=true]:text-sky-100',
  night: 'data-[active=true]:border-violet-400/40 data-[active=true]:bg-violet-400/12 data-[active=true]:text-violet-100',
  recovery: 'data-[active=true]:border-emerald-400/40 data-[active=true]:bg-emerald-400/12 data-[active=true]:text-emerald-100',
};

const offDays: readonly (1 | 2 | 3)[] = [1, 2, 3];

export function ModeTabs({ mode, offDay, onModeChange, onOffDayChange }: ModeTabsProps) {
  return (
    <div className="space-y-2">
      <nav aria-label="근무 모드" className="grid grid-cols-4 gap-2">
        {modeTabs.map((tab) => {
          const isActive = tab.mode === mode;
          return (
            <button
              key={tab.mode}
              type="button"
              data-active={isActive}
              aria-pressed={isActive}
              onClick={() => onModeChange(tab.mode)}
              className={`min-h-14 rounded-2xl border border-white/8 bg-white/[0.035] px-2 py-2 text-left text-slate-400 transition hover:border-white/15 hover:bg-white/[0.06] ${accentByMode[tab.mode]}`}
            >
              <span className="block text-sm font-semibold text-inherit">{tab.label}</span>
              <span className="mt-0.5 block text-[11px] uppercase tracking-[0.16em] text-inherit/70">{tab.meta}</span>
            </button>
          );
        })}
      </nav>

      {mode === 'off' ? (
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/8 bg-black/20 p-1.5" role="group" aria-label="전환기 날짜">
          {offDays.map((day) => {
            const selected = day === offDay;
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selected}
                onClick={() => onOffDayChange(day)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  selected ? 'bg-sky-400/15 text-sky-100 ring-1 ring-inset ring-sky-300/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                Day {day}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
