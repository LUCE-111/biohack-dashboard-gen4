import { useState } from 'react';
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

  const choose = (option: ModeOption): void => {
    onModeChange(option.mode);
    if (option.mode === 'off') {
      onOffDayChange(option.offDay);
    }
    setOpen(false);
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-left text-sm font-semibold text-slate-100"
      >
        <span>{currentLabel(mode, offDay)}</span>
        <span aria-hidden="true" className="text-slate-500">⌄</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/65 p-3 backdrop-blur-sm" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mode-picker-title"
            className="w-full rounded-[28px] border border-white/10 bg-[#11141b] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="mode-picker-title" className="text-base font-semibold text-white">근무 모드 선택</h2>
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 min-w-11 rounded-full text-xl text-slate-400 hover:bg-white/5" aria-label="닫기">×</button>
            </div>
            <div className="grid gap-2">
              {options.map((option) => {
                const selected = option.mode === mode && (option.mode !== 'off' || option.offDay === offDay);
                return (
                  <button
                    key={`${option.mode}-${option.offDay}`}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(option)}
                    className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left transition ${
                      selected ? 'border-indigo-300/35 bg-indigo-300/12 text-white' : 'border-white/7 bg-white/[0.025] text-slate-300'
                    }`}
                  >
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-xs text-slate-500">{option.meta}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
