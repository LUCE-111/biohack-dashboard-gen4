import { formatClock, formatDate } from '../lib/time';
import type { Mode } from '../types';
import { ModePicker } from './ModePicker';
import { ModeTabs } from './ModeTabs';

interface HeaderProps {
  now: Date;
  title: string;
  eyebrow: string;
  mode: Mode;
  offDay: 1 | 2 | 3;
  nightRecoveryDay: 1 | 2;
  nightToDayDay: 1 | 2 | 3;
  rosterSourceLabel?: string | null;
  onModeChange: (mode: Mode) => void;
  onOffDayChange: (day: 1 | 2 | 3) => void;
  onNightRecoveryDayChange: (day: 1 | 2) => void;
  onNightToDayDayChange: (day: 1 | 2 | 3) => void;
}

export function Header(props: HeaderProps) {
  const { now, title, eyebrow, mode, offDay, nightRecoveryDay, nightToDayDay, rosterSourceLabel, onModeChange, onOffDayChange, onNightRecoveryDayChange, onNightToDayDayChange } = props;
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#080a0f]/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 md:py-4 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4 md:mb-4">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-[11px]">{eyebrow}</p>
            <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-white sm:text-xl md:text-2xl">{title}</h1>
            {rosterSourceLabel ? <p className="mt-1 truncate text-[11px] font-medium text-indigo-200/80">{rosterSourceLabel}</p> : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-slate-500 sm:text-xs">{formatDate(now)}</p>
            <time dateTime={now.toISOString()} className="mt-0.5 block font-mono text-base font-semibold tabular-nums text-slate-100 sm:text-lg" aria-label={`현재 시각 ${formatClock(now)}`}>{formatClock(now)}</time>
          </div>
        </div>

        <ModePicker mode={mode} offDay={offDay} nightRecoveryDay={nightRecoveryDay} nightToDayDay={nightToDayDay} onModeChange={onModeChange} onOffDayChange={onOffDayChange} onNightRecoveryDayChange={onNightRecoveryDayChange} onNightToDayDayChange={onNightToDayDayChange} />
        <div className="hidden md:block">
          <ModeTabs mode={mode} offDay={offDay} nightRecoveryDay={nightRecoveryDay} nightToDayDay={nightToDayDay} onModeChange={onModeChange} onOffDayChange={onOffDayChange} onNightRecoveryDayChange={onNightRecoveryDayChange} onNightToDayDayChange={onNightToDayDayChange} />
        </div>
      </div>
    </header>
  );
}
