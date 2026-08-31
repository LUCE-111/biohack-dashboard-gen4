import type { PrimaryView } from '../types';
import { CalendarIcon, HomeIcon, ListIcon, PillIcon, SettingsIcon } from './Icons';

interface PrimaryNavigationProps {
  view: PrimaryView;
  onChange: (view: PrimaryView) => void;
}

const items: readonly { view: PrimaryView; label: string }[] = [
  { view: 'today', label: '오늘' },
  { view: 'schedule', label: '일정' },
  { view: 'roster', label: '근무표' },
  { view: 'supplements', label: '영양제' },
  { view: 'settings', label: '설정' },
];

function NavigationIcon({ view }: { view: PrimaryView }) {
  if (view === 'today') return <HomeIcon />;
  if (view === 'schedule') return <ListIcon />;
  if (view === 'roster') return <CalendarIcon />;
  if (view === 'supplements') return <PillIcon className="h-5 w-5" />;
  return <SettingsIcon />;
}

export function PrimaryNavigation({ view, onChange }: PrimaryNavigationProps) {
  return (
    <>
      <nav aria-label="주요 화면" className="mb-5 hidden rounded-2xl border border-white/8 bg-white/[0.025] p-1.5 md:grid md:grid-cols-5">
        {items.map((item) => {
          const active = item.view === view;
          return (
            <button key={item.view} type="button" aria-current={active ? 'page' : undefined} onClick={() => onChange(item.view)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${active ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}>
              <NavigationIcon view={item.view} />{item.label}
            </button>
          );
        })}
      </nav>

      <nav aria-label="주요 화면" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#0b0e14]/95 px-1 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-1.5 backdrop-blur-xl md:hidden">
        {items.map((item) => {
          const active = item.view === view;
          return (
            <button key={item.view} type="button" aria-current={active ? 'page' : undefined} onClick={() => onChange(item.view)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold ${active ? 'text-indigo-200' : 'text-slate-500'}`}>
              <NavigationIcon view={item.view} />{item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
