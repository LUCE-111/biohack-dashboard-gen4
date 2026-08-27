import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Mode } from '../types';

interface ModePickerProps {
  mode: Mode;
  offDay: 1 | 2 | 3;
  onModeChange: (mode: Mode) => void;
  onOffDayChange: (day: 1 | 2 | 3) => void;
}

interface ModeOption {
  mode: Mode;
  offDay: 1 | 2 | 3;
  label: string;
  meta: string;
}

const options: readonly ModeOption[] = [
  { mode: 'day', offDay: 1, label: '☀ 주간 근무', meta: 'Day shift' },
  { mode: 'off', offDay: 1, label: '🌿 전환 Day 1', meta: '휴식' },
  { mode: 'off', offDay: 2, label: '🌙 전환 Day 2', meta: '리듬 밀기' },
  { mode: 'off', offDay: 3, label: '🦇 전환 Day 3', meta: '야간 적응' },
  { mode: 'night', offDay: 1, label: '🌑 야간 근무', meta: 'Night shift' },
  { mode: 'recovery', offDay: 1, label: '🌱 회복', meta: 'Reset' },
];

function currentLabel(mode: Mode, offDay: 1 | 2 | 3): string {
  const option = options.find((item) => item.mode === mode && (mode !== 'off' || item.offDay === offDay));
  return option?.label ?? '근무 모드';
}

export function ModePicker({ mode, offDay, onModeChange, onOffDayChange }: ModePickerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const choose = (option: ModeOption): void => {
    onModeChange(option.mode);
    if (option.mode === 'off') {
      onOffDayChange(option.offDay);
    }
    setOpen(false);
  };

  const dialog = open ? createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:justify-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="근무 모드 선택 닫기"
        onClick={() => setOpen(false)}
        className="absolute inset-0 min-h-full w-full bg-black/70 backdrop-blur-sm"
      />
      <section
        id="mode-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-picker-title"
        className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#11141b] shadow-2xl sm:max-h-[min(42rem,calc(100dvh-2rem))]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/8 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Shift mode</p>
            <h2 id="mode-picker-title" className="mt-0.5 text-base font-semibold text-white">근무 모드 선택</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 min-w-11 shrink-0 rounded-full text-xl text-slate-400 transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          <div className="grid gap-2">
            {options.map((option) => {
              const selected = option.mode === mode && (option.mode !== 'off' || option.offDay === offDay);
              return (
                <button
                  key={`${option.mode}-${option.offDay}`}
                  type="button"
                  aria-pressed={selected}
                  autoFocus={selected}
                  onClick={() => choose(option)}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ${
                    selected ? 'border-indigo-300/35 bg-indigo-300/12 text-white' : 'border-white/7 bg-white/[0.025] text-slate-300 hover:bg-white/[0.055]'
                  }`}
                >
                  <span className="font-semibold">{option.label}</span>
                  <span className="shrink-0 text-xs text-slate-500">{option.meta}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="mode-picker-dialog"
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-left text-sm font-semibold text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
      >
        <span>{currentLabel(mode, offDay)}</span>
        <span aria-hidden="true" className="text-slate-500">⌄</span>
      </button>
      {dialog}
    </div>
  );
}
