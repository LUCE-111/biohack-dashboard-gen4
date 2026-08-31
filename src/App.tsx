import { useEffect, useMemo, useState } from 'react';
import { CurrentStatus } from './components/CurrentStatus';
import { ErrorBanner, LoadingState } from './components/StateViews';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { RotateIcon } from './components/Icons';
import { PrimaryNavigation } from './components/PrimaryNavigation';
import { PwaBanner } from './components/PwaBanner';
import { RosterPanel } from './components/RosterPanel';
import { RosterStatus } from './components/RosterStatus';
import { SafetyPanel } from './components/SafetyPanel';
import { DrivingSafetyPanel, ScientificGuidancePanel, SleepOpportunityPanel, TransitionPanel } from './components/SciencePanels';
import { SettingsPanel } from './components/SettingsPanel';
import { SummaryCards } from './components/SummaryCards';
import { SupplementPanel } from './components/SupplementPanel';
import { Timeline } from './components/Timeline';
import { getScheduleKey } from './data/schedules';
import { useClock } from './hooks/useClock';
import { useDashboardState } from './hooks/useDashboardState';
import { usePwaStatus } from './hooks/usePwaStatus';
import { useRosterData } from './hooks/useRosterData';
import { phaseLabel, phaseToSchedule, resolveCurrentShiftPhase } from './lib/roster';
import { resolveSchedule } from './lib/schedule';
import { findActiveTask, findNextTask, getShiftInstanceKey } from './lib/time';
import type { Mode, PrimaryView, ResolvedShiftPhase, SettingsApplyMode, TaskFilter, WorkSettings } from './types';

export default function App() {
  const now = useClock();
  const dashboard = useDashboardState();
  const roster = useRosterData(dashboard.rosterSettings.activeVersionId);
  const pwa = usePwaStatus();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [view, setView] = useState<PrimaryView>('today');

  const rosterPhase: ResolvedShiftPhase | null = useMemo(() => {
    if (!dashboard.rosterSettings.autoMode || !roster.activeVersion || !dashboard.rosterSettings.selectedEmployeeId) {
      return null;
    }
    return resolveCurrentShiftPhase(
      roster.activeVersion.assignments,
      roster.activeVersion.conflicts,
      dashboard.rosterSettings.selectedEmployeeId,
      now,
      dashboard.rosterSettings.overrides,
      dashboard.workSettings.night.postShiftPrepMinutes
        + dashboard.workSettings.night.commuteFromMinutes
        + dashboard.workSettings.night.postCommuteWindDownMinutes,
    );
  }, [dashboard.rosterSettings.autoMode, dashboard.rosterSettings.overrides, dashboard.rosterSettings.selectedEmployeeId, dashboard.workSettings.night.commuteFromMinutes, dashboard.workSettings.night.postCommuteWindDownMinutes, dashboard.workSettings.night.postShiftPrepMinutes, now, roster.activeVersion]);

  const autoMapping = rosterPhase ? phaseToSchedule(rosterPhase.phase) : null;
  const scheduleKey = autoMapping?.scheduleKey ?? getScheduleKey(dashboard.mode, dashboard.offDay, dashboard.nightRecoveryDay, dashboard.nightToDayDay);
  const displayMode = autoMapping?.mode ?? dashboard.mode;
  const displayOffDay = autoMapping?.offDay ?? dashboard.offDay;
  const displayNightRecoveryDay = autoMapping?.nightRecoveryDay ?? dashboard.nightRecoveryDay;
  const displayNightToDayDay = autoMapping?.nightToDayDay ?? dashboard.nightToDayDay;

  const effectiveWorkSettings = useMemo<WorkSettings>(() => {
    const assignment = rosterPhase?.assignment;
    if (!assignment || (assignment.shiftType !== 'day' && assignment.shiftType !== 'dayDedicated' && assignment.shiftType !== 'night')) {
      return dashboard.workSettings;
    }
    if (assignment.shiftType === 'night') {
      return { day: { ...dashboard.workSettings.day }, night: { ...dashboard.workSettings.night, workStart: assignment.startTime, workEnd: assignment.endTime } };
    }
    return { day: { ...dashboard.workSettings.day, workStart: assignment.startTime, workEnd: assignment.endTime }, night: { ...dashboard.workSettings.night } };
  }, [dashboard.workSettings, rosterPhase?.assignment]);

  const schedule = useMemo(() => {
    const resolved = resolveSchedule(scheduleKey, effectiveWorkSettings);
    if (rosterPhase?.phase === 'dayDedicated') {
      return { ...resolved, title: '주간 전담', eyebrow: `DAY DEDICATED · ${rosterPhase.assignment?.startTime ?? '09:00'}–${rosterPhase.assignment?.endTime ?? '18:00'}` };
    }
    return resolved;
  }, [effectiveWorkSettings, rosterPhase, scheduleKey]);

  const shiftInstanceKey = getShiftInstanceKey(scheduleKey, now, effectiveWorkSettings);
  const activeTask = useMemo(() => findActiveTask(schedule.tasks, now), [now, schedule.tasks]);
  const nextTask = useMemo(() => findNextTask(schedule.tasks, now, activeTask?.index ?? null), [activeTask?.index, now, schedule.tasks]);
  const taskIds = useMemo(() => schedule.tasks.map((task) => `${shiftInstanceKey}_${task.id}`), [schedule.tasks, shiftInstanceKey]);
  const completed = taskIds.filter((taskId) => dashboard.checkedTaskIds.has(taskId)).length;
  const activeTaskId = activeTask ? `${shiftInstanceKey}_${activeTask.task.id}` : null;
  const activeChecked = activeTaskId ? dashboard.checkedTaskIds.has(activeTaskId) : false;
  const scienceShift = scheduleKey === 'day' ? 'day' : scheduleKey === 'night' ? 'night' : null;
  const showDrivingSafety = scheduleKey === 'night' && (
    activeTask?.task.id === 'night-work-late'
    || activeTask?.task.id === 'night-postshift-prep'
    || activeTask?.task.id === 'night-commute-out'
    || activeTask?.task.id === 'night-winddown'
  );

  useEffect(() => {
    dashboard.activatePendingSettings(shiftInstanceKey);
  }, [dashboard.pendingWorkSettings, shiftInstanceKey]);

  if (dashboard.isLoading || roster.isLoading) {
    return <LoadingState />;
  }

  const handleSettingsSave = (settings: WorkSettings, applyMode: SettingsApplyMode): void => {
    dashboard.saveWorkSettings(settings, applyMode, shiftInstanceKey);
    if (applyMode === 'now') setView('today');
  };

  const switchToManual = (mode: Mode): void => {
    if (dashboard.rosterSettings.autoMode && roster.activeVersion) {
      dashboard.setRosterAutoMode(false);
    }
    dashboard.setMode(mode);
    setFilter('all');
  };

  const selectedRosterEmployee = roster.activeVersion?.employees.find((employee) => employee.id === dashboard.rosterSettings.selectedEmployeeId) ?? null;
  const rosterSourceLabel = rosterPhase && selectedRosterEmployee
    ? `${selectedRosterEmployee.canonicalName} · 근무표 자동 · ${phaseLabel(rosterPhase.phase)}`
    : dashboard.rosterSettings.activeVersionId && !dashboard.rosterSettings.autoMode
      ? '근무표 자동 모드 꺼짐 · 수동 모드 사용 중'
      : null;

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <Header
        now={now}
        title={schedule.title}
        eyebrow={schedule.eyebrow}
        mode={displayMode}
        offDay={displayOffDay}
        nightRecoveryDay={displayNightRecoveryDay}
        nightToDayDay={displayNightToDayDay}
        rosterSourceLabel={rosterSourceLabel}
        onModeChange={switchToManual}
        onOffDayChange={(day) => { dashboard.setRosterAutoMode(false); dashboard.setOffDay(day); setFilter('all'); }}
        onNightRecoveryDayChange={(day) => { dashboard.setRosterAutoMode(false); dashboard.setNightRecoveryDay(day); setFilter('all'); }}
        onNightToDayDayChange={(day) => { dashboard.setRosterAutoMode(false); dashboard.setNightToDayDay(day); setFilter('all'); }}
      />

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <PrimaryNavigation view={view} onChange={setView} />
        <PwaBanner isOnline={pwa.isOnline} updateAvailable={pwa.updateAvailable} onUpdate={pwa.applyUpdate} />

        {dashboard.error ? <div className="mb-4"><ErrorBanner message={dashboard.error} onDismiss={dashboard.dismissError} /></div> : null}
        {roster.error ? <div className="mb-4"><ErrorBanner message={roster.error} onDismiss={roster.dismissError} /></div> : null}

        {dashboard.canUndoReset ? (
          <div role="status" className="mb-4 flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
            <span>현재 Shift의 완료 기록을 초기화했습니다.</span>
            <button type="button" onClick={dashboard.undoReset} className="min-h-11 rounded-xl px-3 font-semibold text-indigo-200 hover:bg-white/5">되돌리기</button>
          </div>
        ) : null}

        {view === 'today' ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
            <div className="min-w-0 space-y-5">
              {rosterPhase && roster.activeVersion && dashboard.rosterSettings.selectedEmployeeId ? <RosterStatus version={roster.activeVersion} employeeId={dashboard.rosterSettings.selectedEmployeeId} resolved={rosterPhase} overrides={dashboard.rosterSettings.overrides} /> : null}
              <CurrentStatus activeTask={activeTask} nextTask={nextTask} activeChecked={activeChecked} onToggleActive={() => { if (activeTaskId) dashboard.toggleTask(activeTaskId); }} />
              {scheduleKey === 'day' || scheduleKey === 'night' ? <TransitionPanel shift={scheduleKey} settings={effectiveWorkSettings} /> : null}
              <SummaryCards schedule={schedule} completed={completed} total={schedule.tasks.length} />
              <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-5 sm:p-6" aria-labelledby="today-guide-heading">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Shift instance</p>
                <h2 id="today-guide-heading" className="mt-1 text-base font-semibold text-white">오늘 기록 기준</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">체크 기록은 <span className="font-mono text-xs text-slate-300">{shiftInstanceKey}</span>에 저장됩니다. 야간 근무는 자정을 지나도 같은 Shift 기록으로 유지됩니다.</p>
                <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setView('schedule')} className="min-h-12 rounded-2xl border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:bg-white/5">전체 일정 보기</button>{roster.activeVersion ? <button type="button" onClick={() => setView('roster')} className="min-h-12 rounded-2xl border border-indigo-300/15 px-4 text-sm font-semibold text-indigo-200 hover:bg-indigo-300/5">근무표 보기</button> : null}</div>
              </section>
            </div>
            <aside className="space-y-5 lg:sticky lg:top-48 lg:self-start" aria-label="오늘 상세">
              {showDrivingSafety ? <DrivingSafetyPanel settings={effectiveWorkSettings} /> : null}
              {scienceShift ? <SleepOpportunityPanel shift={scienceShift} settings={effectiveWorkSettings} /> : null}
              <ScientificGuidancePanel scheduleKey={scheduleKey} settings={effectiveWorkSettings} />
              <SafetyPanel items={schedule.safety} />
              <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-5">
                <p className="text-xs font-semibold text-slate-300">시간 변경이 필요하신가요?</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">근무, 준비, 출발 버퍼, 이동, 귀가 후 전환 시간을 각각 바꾸면 연결 일정을 자동 계산합니다.</p>
                <button type="button" onClick={() => setView('settings')} className="mt-3 min-h-12 w-full rounded-2xl bg-white/8 px-4 text-sm font-semibold text-white hover:bg-white/12">준비 · 이동 설정</button>
              </section>
            </aside>
          </div>
        ) : null}

        {view === 'schedule' ? (
          <section aria-labelledby="timeline-heading" className="rounded-3xl border border-white/8 bg-black/10 p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Shift timeline</p><h2 id="timeline-heading" className="mt-1 text-xl font-semibold tracking-tight text-white">전체 타임라인</h2></div><FilterBar filter={filter} onFilterChange={setFilter} /></div>
            <Timeline schedule={schedule} activeTask={activeTask} filter={filter} shiftInstanceKey={shiftInstanceKey} checkedTaskIds={dashboard.checkedTaskIds} onToggleTask={dashboard.toggleTask} />
            <div className="mt-5 flex justify-end border-t border-white/7 pt-4"><button type="button" onClick={() => dashboard.resetChecksForShift(shiftInstanceKey)} className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-xs font-medium text-slate-500 transition hover:bg-white/5 hover:text-slate-300"><RotateIcon />현재 Shift 체크 초기화</button></div>
          </section>
        ) : null}

        {view === 'roster' ? (
          <RosterPanel settings={dashboard.rosterSettings} activeVersion={roster.activeVersion} versions={roster.versions} onSaveVersion={roster.saveVersion} onSetActiveVersion={dashboard.setRosterActiveVersion} onSetEmployee={dashboard.setRosterEmployee} onSetAutoMode={dashboard.setRosterAutoMode} onSetAliases={dashboard.setRosterAliases} onSetOverride={dashboard.setRosterOverride} />
        ) : null}

        {view === 'supplements' ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]"><SupplementPanel /><SafetyPanel items={schedule.safety} /></div> : null}
        {view === 'settings' ? <SettingsPanel settings={dashboard.workSettings} pending={dashboard.pendingWorkSettings} onSave={handleSettingsSave} /> : null}
      </main>

      <footer className="mx-auto hidden max-w-6xl px-4 pb-10 pt-2 text-center text-[11px] text-slate-600 md:block sm:px-6 lg:px-8"><p>Bio-Hack Dashboard Gen 4.3 · Roster-aware shift cycle PWA</p></footer>
    </div>
  );
}
