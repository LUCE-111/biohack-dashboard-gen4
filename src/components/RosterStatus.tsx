import { phaseLabel, resolveShiftPhase } from '../lib/roster';
import type { ResolvedShiftPhase, RosterVersion } from '../types';

interface RosterStatusProps {
  version: RosterVersion;
  employeeId: string;
  resolved: ResolvedShiftPhase;
  overrides: Readonly<Record<string, import('../types').ShiftPhase>>;
}

function nextAssignment(version: RosterVersion, employeeId: string, date: string) {
  return version.assignments
    .filter((assignment) => assignment.employeeId === employeeId && assignment.date > date && assignment.shiftType !== 'pl')
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

export function RosterStatus({ version, employeeId, resolved, overrides }: RosterStatusProps) {
  const employee = version.employees.find((item) => item.id === employeeId);
  const next = nextAssignment(version, employeeId, resolved.date);
  const nextResolved = next ? resolveShiftPhase(version.assignments, version.conflicts, employeeId, next.date, overrides) : null;
  return (
    <section className="rounded-3xl border border-indigo-300/12 bg-indigo-300/[0.035] p-5 sm:p-6" aria-labelledby="roster-status-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200/60">Roster resolved</p>
          <h2 id="roster-status-heading" className="mt-1 text-base font-semibold text-white">{employee?.canonicalName ?? '선택 근무자'} · {phaseLabel(resolved.phase)}</h2>
          <p className="mt-1 text-xs text-slate-500">{resolved.date} · {resolved.source === 'override' ? '오늘 override' : '근무표에서 자동 설정'}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${resolved.isCanonicalPattern ? 'border-emerald-300/20 bg-emerald-300/8 text-emerald-200' : 'border-amber-300/20 bg-amber-300/8 text-amber-100'}`}>
          {resolved.isCanonicalPattern ? '정상 패턴' : '예외/확인'}
        </span>
      </div>
      {resolved.offRunLength ? <p className="mt-3 text-xs leading-5 text-slate-400">비번 구간 {resolved.offRunPosition}/{resolved.offRunLength}일 · 다음 실제 근무와의 거리를 기준으로 전환 단계를 정했습니다.</p> : null}
      {next && nextResolved ? (
        <div className="mt-4 rounded-2xl border border-white/7 bg-black/15 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Next shift</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{next.date} · {phaseLabel(nextResolved.phase)}</p>
          <p className="mt-1 font-mono text-xs text-slate-500">{next.startTime} → {next.endTime}</p>
        </div>
      ) : null}
      {resolved.conflict ? <p className="mt-3 text-xs font-semibold text-amber-100">{resolved.conflict.message}</p> : null}
    </section>
  );
}
