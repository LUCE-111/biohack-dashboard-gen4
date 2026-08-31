import { modeTabs } from '../data/schedules';
import type { Mode } from '../types';

interface ModeTabsProps {
  mode: Mode;
  offDay: 1 | 2 | 3;
  nightRecoveryDay: 1 | 2;
  nightToDayDay: 1 | 2 | 3;
  onModeChange: (mode: Mode) => void;
  onOffDayChange: (day: 1 | 2 | 3) => void;
  onNightRecoveryDayChange: (day: 1 | 2) => void;
  onNightToDayDayChange: (day: 1 | 2 | 3) => void;
}

const accentByMode: Readonly<Record<Mode, string>> = {
  day: 'data-[active=true]:border-amber-400/40 data-[active=true]:bg-amber-400/12 data-[active=true]:text-amber-100',
  off: 'data-[active=true]:border-sky-400/40 data-[active=true]:bg-sky-400/12 data-[active=true]:text-sky-100',
  night: 'data-[active=true]:border-violet-400/40 data-[active=true]:bg-violet-400/12 data-[active=true]:text-violet-100',
  nightRecovery: 'data-[active=true]:border-violet-300/40 data-[active=true]:bg-violet-300/10 data-[active=true]:text-violet-100',
  nightToDay: 'data-[active=true]:border-emerald-300/40 data-[active=true]:bg-emerald-300/10 data-[active=true]:text-emerald-100',
  recovery: 'data-[active=true]:border-emerald-400/40 data-[active=true]:bg-emerald-400/12 data-[active=true]:text-emerald-100',
  rest: 'data-[active=true]:border-slate-300/30 data-[active=true]:bg-slate-300/10 data-[active=true]:text-slate-100',
};

function SubDays({ count, selected, onSelect, label }: { count: 2 | 3; selected: number; onSelect: (day: number) => void; label: string }) {
  const days = count === 2 ? [1, 2] : [1, 2, 3];
  return (
    <div className={`grid ${count === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-2 rounded-2xl border border-white/8 bg-black/20 p-1.5`} role="group" aria-label={label}>
      {days.map((day) => (
        <button
          key={day}
          type="button"
          aria-pressed={day === selected}
          onClick={() => onSelect(day)}
          className={`min-h-11 rounded-xl px-3 py-2 text-xs font-semibold transition ${day === selected ? 'bg-white/10 text-white ring-1 ring-inset ring-white/15' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
        >
          Day {day}
        </button>
      ))}
    </div>
  );
}

export function ModeTabs(props: ModeTabsProps) {
  const { mode, offDay, nightRecoveryDay, nightToDayDay, onModeChange, onOffDayChange, onNightRecoveryDayChange, onNightToDayDayChange } = props;
  return (
    <div className="space-y-2">
      <nav aria-label="근무 모드" className="grid grid-cols-3 gap-2 xl:grid-cols-7">
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

      {mode === 'off' ? <SubDays count={3} selected={offDay} onSelect={(day) => onOffDayChange(day === 1 || day === 2 ? day : 3)} label="주간에서 야간 전환 날짜" /> : null}
      {mode === 'nightRecovery' ? <SubDays count={2} selected={nightRecoveryDay} onSelect={(day) => onNightRecoveryDayChange(day === 1 ? 1 : 2)} label="야간 사이 회복 날짜" /> : null}
      {mode === 'nightToDay' ? <SubDays count={3} selected={nightToDayDay} onSelect={(day) => onNightToDayDayChange(day === 1 || day === 2 ? day : 3)} label="야간에서 주간 전환 날짜" /> : null}
    </div>
  );
}
