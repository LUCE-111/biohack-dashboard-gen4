import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { copyWorkSettings, defaultWorkSettings, transportOptions } from '../data/settings';
import { getScheduleChanges, getTransitionSnapshot, resolveSchedule, validateWorkSettings } from '../lib/schedule';
import type {
  PendingWorkSettings,
  SettingsApplyMode,
  ShiftKind,
  ShiftTimeSettings,
  TransportMode,
  WorkSettings,
} from '../types';

interface SettingsPanelProps {
  settings: WorkSettings;
  pending: PendingWorkSettings | null;
  onSave: (settings: WorkSettings, applyMode: SettingsApplyMode) => void;
}

interface ShiftEditorProps {
  shift: ShiftKind;
  title: string;
  value: ShiftTimeSettings;
  onChange: (value: ShiftTimeSettings) => void;
}

type MinuteField =
  | 'preShiftPrepMinutes'
  | 'departureBufferMinutes'
  | 'commuteToMinutes'
  | 'postShiftPrepMinutes'
  | 'commuteFromMinutes'
  | 'postCommuteWindDownMinutes'
  | 'postNapBufferMinutes';

function NumberField({
  id,
  label,
  value,
  max,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  max: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300" htmlFor={id}>
      <span>{label}</span>
      <span className="relative">
        <input
          id={id}
          type="number"
          min="0"
          max={max}
          step="5"
          inputMode="numeric"
          value={value}
          onChange={onChange}
          className="min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-3 pr-12 text-base text-white"
        />
        <span className="pointer-events-none absolute right-3 top-3 text-sm text-slate-500">분</span>
      </span>
      {hint ? <span className="text-xs leading-5 text-slate-600">{hint}</span> : null}
    </label>
  );
}

function TransportField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: TransportMode;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300" htmlFor={id}>
      {label}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="min-h-12 rounded-xl border border-white/10 bg-[#0d1119] px-3 text-base text-white"
      >
        {transportOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function ShiftEditor({ shift, title, value, onChange }: ShiftEditorProps) {
  const prefix = `settings-${shift}`;

  const updateTime = (field: 'workStart' | 'workEnd', event: ChangeEvent<HTMLInputElement>): void => {
    onChange({ ...value, [field]: event.currentTarget.value });
  };

  const updateMinutes = (field: MinuteField, event: ChangeEvent<HTMLInputElement>): void => {
    const numberValue = Number(event.currentTarget.value);
    onChange({ ...value, [field]: Number.isFinite(numberValue) ? numberValue : 0 });
  };

  const updateTransport = (field: 'commuteToTransport' | 'commuteFromTransport', event: ChangeEvent<HTMLSelectElement>): void => {
    const selected = transportOptions.find((option) => option.value === event.currentTarget.value);
    if (selected) {
      onChange({ ...value, [field]: selected.value });
    }
  };

  const transition = getTransitionSnapshot({
    day: shift === 'day' ? value : defaultWorkSettings.day,
    night: shift === 'night' ? value : defaultWorkSettings.night,
  }, shift);

  return (
    <fieldset className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:p-5">
      <legend className="px-1 text-base font-semibold text-white">{title}</legend>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-300" htmlFor={`${prefix}-start`}>
          근무 시작
          <input
            id={`${prefix}-start`}
            type="time"
            step="300"
            value={value.workStart}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateTime('workStart', event)}
            className="min-h-12 rounded-xl border border-white/10 bg-black/20 px-3 text-base text-white"
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-300" htmlFor={`${prefix}-end`}>
          근무 종료
          <input
            id={`${prefix}-end`}
            type="time"
            step="300"
            value={value.workEnd}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateTime('workEnd', event)}
            className="min-h-12 rounded-xl border border-white/10 bg-black/20 px-3 text-base text-white"
          />
        </label>
      </div>

      <div className="mt-5 border-t border-white/7 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200/70">출근 전</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shift === 'night' ? (
            <NumberField
              id={`${prefix}-nap-buffer`}
              label="낮잠 후 회복 버퍼"
              value={value.postNapBufferMinutes}
              max={120}
              onChange={(event) => updateMinutes('postNapBufferMinutes', event)}
              hint="낮잠 직후 중요 활동으로 바로 연결하지 않기 위한 여유시간"
            />
          ) : null}
          <NumberField
            id={`${prefix}-prep`}
            label="출근 준비"
            value={value.preShiftPrepMinutes}
            max={240}
            onChange={(event) => updateMinutes('preShiftPrepMinutes', event)}
          />
          <NumberField
            id={`${prefix}-departure-buffer`}
            label="출발 버퍼"
            value={value.departureBufferMinutes}
            max={120}
            onChange={(event) => updateMinutes('departureBufferMinutes', event)}
            hint="준비 지연·엘리베이터·주차·교통 변수용"
          />
          <NumberField
            id={`${prefix}-commute-to`}
            label="출근 이동"
            value={value.commuteToMinutes}
            max={240}
            onChange={(event) => updateMinutes('commuteToMinutes', event)}
          />
          <TransportField
            id={`${prefix}-transport-to`}
            label="출근 이동수단"
            value={value.commuteToTransport}
            onChange={(event) => updateTransport('commuteToTransport', event)}
          />
        </div>
      </div>

      <div className="mt-5 border-t border-white/7 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200/70">퇴근 후</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            id={`${prefix}-postshift-prep`}
            label="퇴근 준비"
            value={value.postShiftPrepMinutes}
            max={120}
            onChange={(event) => updateMinutes('postShiftPrepMinutes', event)}
          />
          <NumberField
            id={`${prefix}-commute-from`}
            label="퇴근 이동"
            value={value.commuteFromMinutes}
            max={240}
            onChange={(event) => updateMinutes('commuteFromMinutes', event)}
          />
          <TransportField
            id={`${prefix}-transport-from`}
            label="퇴근 이동수단"
            value={value.commuteFromTransport}
            onChange={(event) => updateTransport('commuteFromTransport', event)}
          />
          <NumberField
            id={`${prefix}-winddown`}
            label={shift === 'night' ? '귀가 후 수면 준비' : '귀가 후 전환'}
            value={value.postCommuteWindDownMinutes}
            max={180}
            onChange={(event) => updateMinutes('postCommuteWindDownMinutes', event)}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/6 bg-black/15 p-3 text-xs sm:grid-cols-4">
        <div><p className="text-slate-600">준비 시작</p><p className="mt-1 font-mono font-semibold text-slate-200">{transition.prepStart}</p></div>
        <div><p className="text-slate-600">출발 권장</p><p className="mt-1 font-mono font-semibold text-slate-200">{transition.departureTime}</p></div>
        <div><p className="text-slate-600">귀가 예상</p><p className="mt-1 font-mono font-semibold text-slate-200">{transition.homeArrivalTime}</p></div>
        <div><p className="text-slate-600">전환 종료</p><p className="mt-1 font-mono font-semibold text-slate-200">{transition.windDownEndTime}</p></div>
      </div>
    </fieldset>
  );
}

function settingsEqual(left: WorkSettings, right: WorkSettings): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function SettingsPanel({ settings, pending, onSave }: SettingsPanelProps) {
  const [draft, setDraft] = useState<WorkSettings>(() => copyWorkSettings(settings));
  const [applyMode, setApplyMode] = useState<SettingsApplyMode>('next');

  useEffect(() => {
    setDraft(copyWorkSettings(settings));
  }, [settings]);

  const issues = useMemo(() => validateWorkSettings(draft), [draft]);
  const currentDaySchedule = useMemo(() => resolveSchedule('day', settings), [settings]);
  const currentNightSchedule = useMemo(() => resolveSchedule('night', settings), [settings]);
  const dayPreview = useMemo(() => getScheduleChanges(currentDaySchedule, resolveSchedule('day', draft)), [currentDaySchedule, draft]);
  const nightPreview = useMemo(() => getScheduleChanges(currentNightSchedule, resolveSchedule('night', draft)), [currentNightSchedule, draft]);
  const changed = !settingsEqual(settings, draft);

  return (
    <section aria-labelledby="settings-heading" className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Shift transition</p>
        <h2 id="settings-heading" className="mt-1 text-2xl font-semibold tracking-tight text-white">근무 · 준비 · 이동 설정</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          근무시간만 저장하지 않고 출근 준비, 출발 여유, 이동, 퇴근 준비, 귀가 후 전환을 각각 분리합니다. 야간은 낮잠 후 회복 버퍼도 별도로 관리합니다.
        </p>
      </div>

      {pending ? (
        <div className="rounded-2xl border border-sky-300/20 bg-sky-300/[0.06] px-4 py-3 text-sm leading-6 text-sky-100">
          다음 Shift부터 적용할 변경이 대기 중입니다. 다른 Shift instance로 전환되면 새 준비·이동 설정까지 함께 적용됩니다.
        </div>
      ) : null}

      <ShiftEditor
        shift="day"
        title="☀ 주간 근무"
        value={draft.day}
        onChange={(value) => setDraft((current) => ({ ...current, day: value }))}
      />
      <ShiftEditor
        shift="night"
        title="🌑 야간 근무"
        value={draft.night}
        onChange={(value) => setDraft((current) => ({ ...current, night: value }))}
      />

      <section aria-labelledby="preview-heading" className="rounded-3xl border border-white/8 bg-black/15 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Preview</p>
            <h3 id="preview-heading" className="mt-1 text-base font-semibold text-white">변경 영향</h3>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${issues.length === 0 ? 'border-emerald-300/20 bg-emerald-300/8 text-emerald-200' : 'border-rose-300/20 bg-rose-300/8 text-rose-200'}`}>
            {issues.length === 0 ? '충돌 없음' : `${issues.length}개 확인 필요`}
          </span>
        </div>

        {issues.length > 0 ? (
          <ul className="mt-4 space-y-2" aria-label="일정 충돌">
            {issues.map((issue) => (
              <li key={`${issue.shift}-${issue.message}`} className="rounded-xl border border-rose-300/15 bg-rose-300/[0.04] px-3 py-2 text-sm leading-6 text-rose-100">
                <strong className="mr-2 font-semibold">{issue.shift === 'day' ? '주간' : '야간'}</strong>
                {issue.message}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-300">주간 타임라인 영향 · {dayPreview.length}개</h4>
            <div className="mt-2 space-y-2">
              {dayPreview.length > 0 ? dayPreview.map((change) => (
                <div key={change.taskId} className="rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2">
                  <p className="text-xs font-semibold text-slate-300">{change.title}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">{change.before} → <span className="text-slate-300">{change.after}</span></p>
                </div>
              )) : <p className="text-xs text-slate-600">시간 변경 없음</p>}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-300">야간 타임라인 영향 · {nightPreview.length}개</h4>
            <div className="mt-2 space-y-2">
              {nightPreview.length > 0 ? nightPreview.map((change) => (
                <div key={change.taskId} className="rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2">
                  <p className="text-xs font-semibold text-slate-300">{change.title}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">{change.before} → <span className="text-slate-300">{change.after}</span></p>
                </div>
              )) : <p className="text-xs text-slate-600">시간 변경 없음</p>}
            </div>
          </div>
        </div>
      </section>

      <fieldset className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
        <legend className="px-1 text-sm font-semibold text-slate-200">적용 시점</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/7 px-3 text-sm text-slate-300">
            <input type="radio" name="apply-mode" value="next" checked={applyMode === 'next'} onChange={() => setApplyMode('next')} />
            다음 Shift부터 적용
          </label>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/7 px-3 text-sm text-slate-300">
            <input type="radio" name="apply-mode" value="now" checked={applyMode === 'now'} onChange={() => setApplyMode('now')} />
            현재 일정에 즉시 적용
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => setDraft(copyWorkSettings(defaultWorkSettings))}
          className="min-h-12 rounded-2xl border border-white/8 px-4 text-sm font-semibold text-slate-400 hover:text-slate-100"
        >
          Gen 4.2 기본값으로 되돌리기
        </button>
        <button
          type="button"
          disabled={issues.length > 0 || !changed}
          onClick={() => onSave(copyWorkSettings(draft), applyMode)}
          className="min-h-12 rounded-2xl bg-indigo-300 px-5 text-sm font-bold text-indigo-950 disabled:cursor-not-allowed disabled:opacity-35"
        >
          변경 적용
        </button>
      </div>
    </section>
  );
}
