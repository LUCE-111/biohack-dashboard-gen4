import { useEffect, useMemo, useState } from 'react';
import { copyWorkSettings } from '../data/settings';
import { initialPersistedState, parsePersistedState, serializePersistedState, STORAGE_KEY } from '../lib/persistence';
import type {
  Mode,
  PendingWorkSettings,
  PersistedState,
  RosterAliasMap,
  RosterSettings,
  SettingsApplyMode,
  ShiftPhase,
  WorkSettings,
} from '../types';

interface DashboardStateResult {
  mode: Mode;
  offDay: 1 | 2 | 3;
  nightRecoveryDay: 1 | 2;
  nightToDayDay: 1 | 2 | 3;
  checkedTaskIds: ReadonlySet<string>;
  workSettings: WorkSettings;
  pendingWorkSettings: PendingWorkSettings | null;
  rosterSettings: RosterSettings;
  isLoading: boolean;
  error: string | null;
  canUndoReset: boolean;
  setMode: (mode: Mode) => void;
  setOffDay: (day: 1 | 2 | 3) => void;
  setNightRecoveryDay: (day: 1 | 2) => void;
  setNightToDayDay: (day: 1 | 2 | 3) => void;
  toggleTask: (taskId: string) => void;
  resetChecksForShift: (shiftInstanceKey: string) => void;
  undoReset: () => void;
  saveWorkSettings: (settings: WorkSettings, applyMode: SettingsApplyMode, currentShiftInstance: string) => void;
  activatePendingSettings: (currentShiftInstance: string) => void;
  setRosterActiveVersion: (versionId: string | null) => void;
  setRosterEmployee: (employeeId: string | null) => void;
  setRosterAutoMode: (enabled: boolean) => void;
  setRosterAliases: (aliases: RosterAliasMap) => void;
  setRosterOverride: (date: string, phase: ShiftPhase | null) => void;
  dismissError: () => void;
}

interface ResetSnapshot {
  ids: readonly string[];
}

export function useDashboardState(): DashboardStateResult {
  const [state, setState] = useState<PersistedState>(initialPersistedState);
  const [resetSnapshot, setResetSnapshot] = useState<ResetSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const persisted = parsePersistedState(window.localStorage.getItem(STORAGE_KEY));
      setState(persisted);
    } catch {
      setError('저장된 대시보드 상태를 불러오지 못했습니다. 기본 설정으로 시작합니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, serializePersistedState(state));
    } catch {
      setError('브라우저 저장소에 진행 상태를 저장하지 못했습니다.');
    }
  }, [isLoading, state]);

  const checkedSet = useMemo(() => new Set(state.checkedTaskIds), [state.checkedTaskIds]);

  const updateRoster = (updater: (settings: RosterSettings) => RosterSettings): void => {
    setState((current) => ({ ...current, rosterSettings: updater(current.rosterSettings) }));
  };

  const toggleTask = (taskId: string): void => {
    setResetSnapshot(null);
    setState((current) => {
      const next = new Set(current.checkedTaskIds);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return { ...current, checkedTaskIds: [...next] };
    });
  };

  const resetChecksForShift = (shiftInstanceKey: string): void => {
    const prefix = `${shiftInstanceKey}_`;
    setState((current) => {
      const removed = current.checkedTaskIds.filter((taskId) => taskId.startsWith(prefix));
      setResetSnapshot({ ids: removed });
      return { ...current, checkedTaskIds: current.checkedTaskIds.filter((taskId) => !taskId.startsWith(prefix)) };
    });
  };

  const undoReset = (): void => {
    if (!resetSnapshot) {
      return;
    }
    setState((current) => ({ ...current, checkedTaskIds: [...new Set([...current.checkedTaskIds, ...resetSnapshot.ids])] }));
    setResetSnapshot(null);
  };

  const saveWorkSettings = (settings: WorkSettings, applyMode: SettingsApplyMode, currentShiftInstance: string): void => {
    setState((current) => {
      if (applyMode === 'now') {
        return { ...current, workSettings: copyWorkSettings(settings), pendingWorkSettings: null };
      }
      return {
        ...current,
        pendingWorkSettings: { value: copyWorkSettings(settings), activateAfterShiftInstance: currentShiftInstance },
      };
    });
  };

  const activatePendingSettings = (currentShiftInstance: string): void => {
    setState((current) => {
      if (!current.pendingWorkSettings || current.pendingWorkSettings.activateAfterShiftInstance === currentShiftInstance) {
        return current;
      }
      return { ...current, workSettings: copyWorkSettings(current.pendingWorkSettings.value), pendingWorkSettings: null };
    });
  };

  return {
    mode: state.mode,
    offDay: state.offDay,
    nightRecoveryDay: state.nightRecoveryDay,
    nightToDayDay: state.nightToDayDay,
    checkedTaskIds: checkedSet,
    workSettings: state.workSettings,
    pendingWorkSettings: state.pendingWorkSettings,
    rosterSettings: state.rosterSettings,
    isLoading,
    error,
    canUndoReset: resetSnapshot !== null,
    setMode: (mode) => setState((current) => ({ ...current, mode })),
    setOffDay: (offDay) => setState((current) => ({ ...current, offDay })),
    setNightRecoveryDay: (nightRecoveryDay) => setState((current) => ({ ...current, nightRecoveryDay })),
    setNightToDayDay: (nightToDayDay) => setState((current) => ({ ...current, nightToDayDay })),
    toggleTask,
    resetChecksForShift,
    undoReset,
    saveWorkSettings,
    activatePendingSettings,
    setRosterActiveVersion: (activeVersionId) => updateRoster((settings) => ({ ...settings, activeVersionId })),
    setRosterEmployee: (selectedEmployeeId) => updateRoster((settings) => ({ ...settings, selectedEmployeeId })),
    setRosterAutoMode: (autoMode) => updateRoster((settings) => ({ ...settings, autoMode })),
    setRosterAliases: (aliases) => updateRoster((settings) => ({ ...settings, aliases: { ...aliases } })),
    setRosterOverride: (date, phase) => updateRoster((settings) => {
      const overrides = { ...settings.overrides };
      if (phase) {
        overrides[date] = phase;
      } else {
        delete overrides[date];
      }
      return { ...settings, overrides };
    }),
    dismissError: () => setError(null),
  };
}
