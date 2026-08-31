import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { createRosterVersion, readRosterWorkbook } from '../lib/rosterImport';
import { diffRosterVersions, localDateKey, parseRosterWorkbook, phaseLabel, resolveShiftPhase } from '../lib/roster';
import type {
  RosterAliasMap,
  RosterSettings,
  RosterVersion,
  ShiftPhase,
  WorkbookSheetData,
} from '../types';

interface RosterPanelProps {
  settings: RosterSettings;
  activeVersion: RosterVersion | null;
  versions: readonly RosterVersion[];
  onSaveVersion: (version: RosterVersion) => Promise<void>;
  onSetActiveVersion: (versionId: string | null) => void;
  onSetEmployee: (employeeId: string | null) => void;
  onSetAutoMode: (enabled: boolean) => void;
  onSetAliases: (aliases: RosterAliasMap) => void;
  onSetOverride: (date: string, phase: ShiftPhase | null) => void;
}

const overrideOptions: readonly { value: ShiftPhase; label: string }[] = [
  { value: 'day', label: '주간 근무' },
  { value: 'dayDedicated', label: '주간 전담' },
  { value: 'dayToNight1', label: '주→야 전환 1일차' },
  { value: 'dayToNight2', label: '주→야 전환 2일차' },
  { value: 'dayToNight3', label: '주→야 전환 3일차' },
  { value: 'night', label: '야간 근무' },
  { value: 'nightRecovery1', label: '야간 사이 회복 1일차' },
  { value: 'nightRecovery2', label: '야간 사이 회복 2일차' },
  { value: 'nightToDay1', label: '야→주 전환 1일차' },
  { value: 'nightToDay2', label: '야→주 전환 2일차' },
  { value: 'nightToDay3', label: '야→주 전환 3일차' },
  { value: 'off', label: '일반 비번' },
];

function formatImportedAt(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthCalendarDates(value: string): readonly (string | null)[] {
  const [yearText, monthText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const dates: (string | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= lastDay; day += 1) {
    dates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  while (dates.length % 7 !== 0) dates.push(null);
  return dates;
}

function moveMonth(value: string, delta: number): string {
  const [yearText, monthText] = value.split('-');
  const date = new Date(Number(yearText), Number(monthText) - 1 + delta, 1);
  return monthKey(date);
}

export function RosterPanel(props: RosterPanelProps) {
  const { settings, activeVersion, versions, onSaveVersion, onSetActiveVersion, onSetEmployee, onSetAutoMode, onSetAliases, onSetOverride } = props;
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<readonly WorkbookSheetData[] | null>(null);
  const [draftAliases, setDraftAliases] = useState<RosterAliasMap>(settings.aliases);
  const [selectedPreviewEmployee, setSelectedPreviewEmployee] = useState<string | null>(settings.selectedEmployeeId);
  const [status, setStatus] = useState<'idle' | 'reading' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(monthKey(new Date()));

  const preview = useMemo(() => {
    if (!workbook) return null;
    try {
      return parseRosterWorkbook(workbook, draftAliases);
    } catch {
      return null;
    }
  }, [draftAliases, workbook]);

  const previewEmployeeId = preview?.employees.some((employee) => employee.id === selectedPreviewEmployee)
    ? selectedPreviewEmployee
    : preview?.employees[0]?.id ?? null;

  const diff = useMemo(() => {
    if (!preview || !activeVersion || !previewEmployeeId) return null;
    return diffRosterVersions(activeVersion.assignments, preview.assignments, previewEmployeeId);
  }, [activeVersion, preview, previewEmployeeId]);

  const activeEmployee = activeVersion?.employees.find((employee) => employee.id === settings.selectedEmployeeId) ?? null;
  const calendarDates = monthCalendarDates(calendarMonth);
  const todayKey = localDateKey(new Date());

  const handleFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const nextFile = event.currentTarget.files?.[0] ?? null;
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().endsWith('.xlsx')) {
      setError('현재 importer는 .xlsx 파일만 지원합니다. 기존 .xls 파일은 Excel에서 .xlsx로 저장한 뒤 다시 선택하세요.');
      return;
    }
    setStatus('reading');
    setError(null);
    try {
      const nextWorkbook = await readRosterWorkbook(nextFile);
      const parsed = parseRosterWorkbook(nextWorkbook, settings.aliases);
      setFile(nextFile);
      setWorkbook(nextWorkbook);
      setDraftAliases(settings.aliases);
      const preferred = parsed.employees.some((employee) => employee.id === settings.selectedEmployeeId)
        ? settings.selectedEmployeeId
        : parsed.employees.find((employee) => employee.source === 'master')?.id ?? parsed.employees[0]?.id ?? null;
      setSelectedPreviewEmployee(preferred);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '근무표를 읽지 못했습니다.');
      setFile(null);
      setWorkbook(null);
    } finally {
      setStatus('idle');
      event.currentTarget.value = '';
    }
  };

  const applyImport = async (): Promise<void> => {
    if (!file || !workbook || !previewEmployeeId) return;
    setStatus('saving');
    setError(null);
    try {
      const version = await createRosterVersion(file, workbook, draftAliases);
      await onSaveVersion(version);
      onSetAliases(draftAliases);
      onSetEmployee(previewEmployeeId);
      onSetActiveVersion(version.id);
      setFile(null);
      setWorkbook(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '근무표 적용에 실패했습니다.');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="roster-heading">
      <div className="rounded-3xl border border-white/8 bg-white/[0.025] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200/70">Roster sync</p>
            <h2 id="roster-heading" className="mt-1 text-xl font-semibold text-white">근무표 자동 세팅</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Excel 파일은 브라우저 안에서만 분석하고 IndexedDB에 정규화된 근무표를 저장합니다. 공개 GitHub 저장소로 근무표 파일을 전송하지 않습니다.</p>
          </div>
          <label className="inline-flex min-h-12 cursor-pointer items-center rounded-2xl bg-indigo-300 px-4 text-sm font-bold text-indigo-950">
            {status === 'reading' ? '분석 중…' : '새 근무표 가져오기'}
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => void handleFile(event)} disabled={status !== 'idle'} />
          </label>
        </div>
        {error ? <div role="alert" className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/[0.05] px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      </div>

      {activeVersion ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-5" aria-labelledby="active-roster-heading">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Active roster</p>
                <h3 id="active-roster-heading" className="mt-1 font-semibold text-white">{activeVersion.fileName}</h3>
              </div>
              <label className="flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-300">
                <input type="checkbox" checked={settings.autoMode} onChange={(event: ChangeEvent<HTMLInputElement>) => onSetAutoMode(event.currentTarget.checked)} />
                자동 모드
              </label>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-black/15 p-3"><dt className="text-xs text-slate-500">기간</dt><dd className="mt-1 font-mono text-xs text-slate-200">{activeVersion.coverage.from}<br />→ {activeVersion.coverage.to}</dd></div>
              <div className="rounded-2xl bg-black/15 p-3"><dt className="text-xs text-slate-500">업데이트</dt><dd className="mt-1 text-xs text-slate-200">{formatImportedAt(activeVersion.importedAt)}</dd></div>
            </dl>
            <label className="mt-4 grid gap-2 text-sm text-slate-300">
              내 근무자
              <select value={settings.selectedEmployeeId ?? ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => onSetEmployee(event.currentTarget.value || null)} className="min-h-12 rounded-xl border border-white/10 bg-[#0d1119] px-3 text-base text-white">
                <option value="">선택</option>
                {activeVersion.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.canonicalName}{employee.source === 'schedule' ? ' · 근무표 발견' : ''}</option>)}
              </select>
            </label>
            {activeVersion.conflicts.length > 0 ? <p className="mt-3 text-xs text-amber-200">확인 필요한 중복 근무 {activeVersion.conflicts.length}건</p> : null}
            {activeVersion.unresolvedTokens.length > 0 ? <p className="mt-1 text-xs text-amber-200">미매핑 이름 표현 {activeVersion.unresolvedTokens.length}건</p> : null}
          </section>

          <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-5" aria-labelledby="today-override-heading">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Today override</p>
            <h3 id="today-override-heading" className="mt-1 font-semibold text-white">오늘만 근무 모드 변경</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">근무표 원본은 바꾸지 않고 오늘의 자동 판정 위에만 override를 적용합니다.</p>
            <select value={settings.overrides[todayKey] ?? ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => onSetOverride(todayKey, overrideOptions.find((option) => option.value === event.currentTarget.value)?.value ?? null)} className="mt-4 min-h-12 w-full rounded-xl border border-white/10 bg-[#0d1119] px-3 text-sm text-white">
              <option value="">자동 판정 사용</option>
              {overrideOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </section>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.015] p-8 text-center">
          <p className="font-semibold text-slate-200">연결된 근무표가 없습니다.</p>
          <p className="mt-2 text-sm text-slate-500">근무표를 가져오면 선택한 근무자의 오늘 근무와 전환 단계가 자동 계산됩니다.</p>
        </div>
      )}

      {preview && file ? (
        <section className="rounded-3xl border border-indigo-300/15 bg-indigo-300/[0.035] p-5 sm:p-6" aria-labelledby="import-preview-heading">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200/70">Import preview</p>
              <h3 id="import-preview-heading" className="mt-1 text-lg font-semibold text-white">{file.name}</h3>
              <p className="mt-1 font-mono text-xs text-slate-400">{preview.coverage.from} → {preview.coverage.to}</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full border border-white/8 px-2.5 py-1 text-slate-300">직원 {preview.employees.length}</span>
              <span className="rounded-full border border-white/8 px-2.5 py-1 text-slate-300">배정 {preview.assignments.length}</span>
              <span className={`rounded-full border px-2.5 py-1 ${preview.conflicts.length ? 'border-amber-300/20 text-amber-200' : 'border-emerald-300/20 text-emerald-200'}`}>충돌 {preview.conflicts.length}</span>
            </div>
          </div>

          <label className="mt-5 grid gap-2 text-sm text-slate-300">
            이 대시보드에서 사용할 근무자
            <select value={previewEmployeeId ?? ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedPreviewEmployee(event.currentTarget.value || null)} className="min-h-12 rounded-xl border border-white/10 bg-[#0d1119] px-3 text-base text-white">
              {preview.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.canonicalName}{employee.source === 'schedule' ? ' · 근무표에서 발견' : ''}</option>)}
            </select>
          </label>

          {preview.unresolvedTokens.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
              <h4 className="text-sm font-semibold text-amber-100">이름 별칭 확인 · {preview.unresolvedTokens.length}건</h4>
              <p className="mt-1 text-xs leading-5 text-amber-100/60">성이 생략된 이름이나 미등록 표현은 임의 추론하지 않습니다. 해당되는 사람만 연결하세요.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {preview.unresolvedTokens.map((token) => (
                  <label key={token} className="grid gap-1 text-xs text-slate-300">
                    “{token}”
                    <select value={draftAliases[token] ?? ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDraftAliases((current) => ({ ...current, [token]: event.currentTarget.value }))} className="min-h-11 rounded-xl border border-white/10 bg-[#0d1119] px-3 text-sm text-white">
                      <option value="">매핑하지 않음</option>
                      {preview.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.canonicalName}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {diff ? (
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-emerald-300/[0.05] p-3 text-emerald-200">추가<br /><strong className="text-lg">{diff.added}</strong></div>
              <div className="rounded-xl bg-amber-300/[0.05] p-3 text-amber-200">변경<br /><strong className="text-lg">{diff.changed}</strong></div>
              <div className="rounded-xl bg-rose-300/[0.05] p-3 text-rose-200">삭제<br /><strong className="text-lg">{diff.removed}</strong></div>
            </div>
          ) : null}

          {preview.conflicts.length > 0 ? (
            <div className="mt-5 space-y-2">
              <h4 className="text-sm font-semibold text-amber-100">중복 근무 확인</h4>
              {preview.conflicts.slice(0, 8).map((conflict) => <div key={conflict.id} className="rounded-xl border border-amber-300/10 bg-black/10 px-3 py-2 text-xs text-amber-100/80">{conflict.employeeName} · {conflict.message}</div>)}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => { setFile(null); setWorkbook(null); }} className="min-h-12 rounded-2xl border border-white/10 px-4 text-sm font-semibold text-slate-300">취소</button>
            <button type="button" disabled={!previewEmployeeId || status !== 'idle'} onClick={() => void applyImport()} className="min-h-12 rounded-2xl bg-indigo-300 px-5 text-sm font-bold text-indigo-950 disabled:opacity-40">{status === 'saving' ? '저장 중…' : '근무표 적용'}</button>
          </div>
        </section>
      ) : null}

      {activeVersion && settings.selectedEmployeeId ? (
        <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-4 sm:p-5" aria-labelledby="roster-calendar-heading">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Resolved calendar</p><h3 id="roster-calendar-heading" className="mt-1 font-semibold text-white">{activeEmployee?.canonicalName ?? '내 근무'} · {calendarMonth}</h3></div>
            <div className="flex gap-1"><button type="button" onClick={() => setCalendarMonth((current) => moveMonth(current, -1))} className="min-h-11 min-w-11 rounded-xl border border-white/8 text-slate-300" aria-label="이전 달">‹</button><button type="button" onClick={() => setCalendarMonth(monthKey(new Date()))} className="min-h-11 rounded-xl border border-white/8 px-3 text-xs text-slate-300">오늘</button><button type="button" onClick={() => setCalendarMonth((current) => moveMonth(current, 1))} className="min-h-11 min-w-11 rounded-xl border border-white/8 text-slate-300" aria-label="다음 달">›</button></div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] text-slate-600">{['일','월','화','수','목','금','토'].map((day) => <span key={day} className="py-1">{day}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDates.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} className="min-h-16" />;
              const resolved = resolveShiftPhase(activeVersion.assignments, activeVersion.conflicts, settings.selectedEmployeeId ?? '', date, settings.overrides);
              return <div key={date} className={`min-h-16 rounded-xl border p-1.5 ${date === todayKey ? 'border-indigo-300/30 bg-indigo-300/[0.07]' : 'border-white/6 bg-black/10'}`}><p className="text-[10px] text-slate-500">{Number(date.slice(-2))}</p><p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 text-slate-200">{phaseLabel(resolved.phase).replace(/^\S+\s/, '')}</p>{!resolved.isCanonicalPattern && resolved.phase !== 'day' && resolved.phase !== 'night' ? <span className="mt-1 block text-[9px] text-amber-300">예외</span> : null}</div>;
            })}
          </div>
        </section>
      ) : null}

      {versions.length > 1 ? (
        <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-5" aria-labelledby="roster-history-heading">
          <h3 id="roster-history-heading" className="font-semibold text-white">근무표 버전</h3>
          <div className="mt-3 space-y-2">
            {versions.slice(0, 3).map((version) => (
              <button key={version.id} type="button" onClick={() => onSetActiveVersion(version.id)} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 text-left text-xs ${version.id === settings.activeVersionId ? 'border-indigo-300/25 bg-indigo-300/[0.06] text-indigo-100' : 'border-white/7 text-slate-400'}`}>
                <span className="truncate">{version.fileName}</span><span className="shrink-0">{formatImportedAt(version.importedAt)}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
