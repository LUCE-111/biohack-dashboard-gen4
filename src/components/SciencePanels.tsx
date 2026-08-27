import { useState } from 'react';
import { transportOptions } from '../data/settings';
import { formatOpportunity, getGuidanceItems } from '../lib/guidance';
import { getSleepOpportunity, getTransitionSnapshot } from '../lib/schedule';
import type {
  DrowsinessState,
  EvidenceLevel,
  ScheduleKey,
  ShiftKind,
  TransportMode,
  WorkSettings,
} from '../types';
import { ClockIcon, ShieldIcon } from './Icons';

const evidenceLabel: Readonly<Record<EvidenceLevel, string>> = {
  guideline: 'Guideline',
  conditional: 'Conditional',
  general: 'General principle',
  personal: 'Personal routine',
};

const evidenceClass: Readonly<Record<EvidenceLevel, string>> = {
  guideline: 'border-emerald-300/20 bg-emerald-300/8 text-emerald-200',
  conditional: 'border-amber-300/20 bg-amber-300/8 text-amber-100',
  general: 'border-sky-300/20 bg-sky-300/8 text-sky-200',
  personal: 'border-violet-300/20 bg-violet-300/8 text-violet-200',
};

const drowsinessOptions: readonly { value: DrowsinessState; label: string }[] = [
  { value: 'okay', label: '괜찮음' },
  { value: 'sleepy', label: '약간 졸림' },
  { value: 'unsafe', label: '운전 어려움' },
];

function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${evidenceClass[level]}`}>
      {evidenceLabel[level]}
    </span>
  );
}

function transportLabel(mode: TransportMode): string {
  return transportOptions.find((option) => option.value === mode)?.label ?? '기타';
}

export function TransitionPanel({ shift, settings }: { shift: ShiftKind; settings: WorkSettings }) {
  const snapshot = getTransitionSnapshot(settings, shift);
  const value = settings[shift];

  return (
    <section aria-labelledby="transition-heading" className="rounded-3xl border border-indigo-300/12 bg-indigo-300/[0.035] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200/60">Shift transition</p>
          <h2 id="transition-heading" className="mt-1 text-base font-semibold text-white">
            {shift === 'day' ? '주간 출퇴근 플랜' : '야간 출퇴근 플랜'}
          </h2>
        </div>
        <span className="rounded-full border border-white/8 bg-black/15 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
          {transportLabel(snapshot.commuteToTransport)} → {transportLabel(snapshot.commuteFromTransport)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/6 bg-black/15 p-3">
          <dt className="text-[11px] text-slate-500">준비 시작</dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-white">{snapshot.prepStart}</dd>
        </div>
        <div className="rounded-2xl border border-white/6 bg-black/15 p-3">
          <dt className="text-[11px] text-slate-500">출발 권장</dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-white">{snapshot.departureTime}</dd>
        </div>
        <div className="rounded-2xl border border-white/6 bg-black/15 p-3">
          <dt className="text-[11px] text-slate-500">귀가 예상</dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-white">{snapshot.homeArrivalTime}</dd>
        </div>
        <div className="rounded-2xl border border-white/6 bg-black/15 p-3">
          <dt className="text-[11px] text-slate-500">전환 종료</dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-white">{snapshot.windDownEndTime}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
        <span>준비 {value.preShiftPrepMinutes}분</span>
        <span>출발 버퍼 {value.departureBufferMinutes}분</span>
        <span>출근 {value.commuteToMinutes}분</span>
        <span>퇴근 준비 {value.postShiftPrepMinutes}분</span>
        <span>퇴근 {value.commuteFromMinutes}분</span>
        <span>귀가 후 {value.postCommuteWindDownMinutes}분</span>
      </div>
    </section>
  );
}

export function SleepOpportunityPanel({ shift, settings }: { shift: ShiftKind; settings: WorkSettings }) {
  const opportunity = getSleepOpportunity(settings, shift);
  const hours = opportunity.durationMinutes / 60;
  const status = hours >= 7 ? '7시간 이상 확보' : hours >= 6 ? '여유가 크지 않음' : '수면 기회가 짧음';
  const statusClass = hours >= 7 ? 'text-emerald-200' : hours >= 6 ? 'text-amber-100' : 'text-rose-200';

  return (
    <section aria-labelledby="sleep-opportunity-heading" className="rounded-3xl border border-blue-300/12 bg-blue-300/[0.035] p-5">
      <div className="flex items-center gap-2 text-blue-200">
        <ClockIcon />
        <h2 id="sleep-opportunity-heading" className="text-sm font-semibold">Sleep opportunity</h2>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{opportunity.label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{formatOpportunity(opportunity.durationMinutes)}</p>
      <p className="mt-1 font-mono text-xs text-slate-500">{opportunity.start} → {opportunity.end}</p>
      <p className={`mt-3 text-xs font-semibold ${statusClass}`}>{status}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        이 값은 실제 수면시간이 아니라 일정상 확보 가능한 시간입니다. 잠들기까지 걸리는 시간과 중간 각성은 포함하지 않습니다.
      </p>
    </section>
  );
}

export function ScientificGuidancePanel({ scheduleKey, settings }: { scheduleKey: ScheduleKey; settings: WorkSettings }) {
  const items = getGuidanceItems(scheduleKey, settings);
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="science-guidance-heading" className="rounded-3xl border border-white/8 bg-white/[0.025] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Evidence-aware</p>
      <h2 id="science-guidance-heading" className="mt-1 text-sm font-semibold text-white">상황별 과학 패널</h2>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <article key={item.id} className="border-t border-white/6 pt-4 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
              <EvidenceBadge level={item.evidence} />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.body}</p>
          </article>
        ))}
      </div>
      <div className="mt-4 border-t border-white/6 pt-3 text-[10px] leading-4 text-slate-600">
        <p>과학 패널은 일반적인 근무·수면 관리 원칙을 설명하며 개인 진단이나 운전 가능 판정을 제공하지 않습니다.</p>
        <p className="mt-1">근거 프레임: AASM shift-work guidance · NIOSH fatigue/driving safety · NHLBI healthy sleep guidance.</p>
      </div>
    </section>
  );
}

export function DrivingSafetyPanel({ settings }: { settings: WorkSettings }) {
  const [state, setState] = useState<DrowsinessState | null>(null);
  const night = settings.night;

  if (night.commuteFromTransport !== 'drive') {
    return (
      <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-5" aria-labelledby="commute-safety-heading">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldIcon />
          <h2 id="commute-safety-heading" className="text-sm font-semibold">야간 퇴근 이동</h2>
        </div>
        <p className="mt-3 text-sm text-slate-300">{transportLabel(night.commuteFromTransport)} · {night.commuteFromMinutes}분</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">자가운전이 아니므로 운전 안전 자가체크는 표시하지 않습니다.</p>
      </section>
    );
  }

  const feedback = state === 'unsafe'
    ? '운전을 시작하지 않는 편이 안전합니다. 충분한 휴식, 대중교통, 택시·픽업 등 대체 이동을 우선 고려하세요.'
    : state === 'sleepy'
      ? '졸림이 증가하거나 집중이 어려워지면 운전을 계속하지 마세요. 일정 준수보다 안전이 우선입니다.'
      : state === 'okay'
        ? '자가평가는 순간 상태만 반영합니다. 운전 중 졸림이나 집중 저하가 생기면 즉시 안전한 대안을 선택하세요.'
        : '야간근무 종료 후 자가운전 전 현재 졸림을 직접 확인하세요. 앱은 운전 가능 여부를 판정하지 않습니다.';

  return (
    <section aria-labelledby="driving-safety-heading" className="rounded-3xl border border-rose-300/14 bg-rose-300/[0.04] p-5">
      <div className="flex items-center gap-2 text-rose-200">
        <ShieldIcon />
        <h2 id="driving-safety-heading" className="text-sm font-semibold">퇴근 안전 체크</h2>
      </div>
      <p className="mt-3 text-sm font-semibold text-white">자가운전 · {night.commuteFromMinutes}분</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">졸림 상태는 어떤가요?</p>
      <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="현재 졸림 상태">
        {drowsinessOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={state === option.value}
            onClick={() => setState(option.value)}
            className={`min-h-12 rounded-xl border px-2 text-xs font-semibold ${state === option.value ? 'border-rose-200/40 bg-rose-200/15 text-rose-100' : 'border-white/8 bg-black/15 text-slate-400'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p role="status" className={`mt-3 text-xs leading-5 ${state === 'unsafe' ? 'font-semibold text-rose-100' : 'text-slate-400'}`}>{feedback}</p>
      <div className="mt-3"><EvidenceBadge level="guideline" /></div>
    </section>
  );
}
