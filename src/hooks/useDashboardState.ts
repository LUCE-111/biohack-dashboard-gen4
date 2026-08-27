import { useEffect, useMemo, useState } from 'react';
import { copyWorkSettings } from '../data/settings';
import { initialPersistedState, parsePersistedState, serializePersistedState, STORAGE_KEY } from '../lib/persistence';
import type { Mode, PendingWorkSettings, PersistedState, SettingsApplyMode, WorkSettings } from '../types';

interface DashboardStateResult {
  mode: Mode;
  offDay: 1 | 2 | 3;
  checkedTaskIds: ReadonlySet<string>;
  workSettings: WorkSettings;
  pendingWorkSettings: PendingWorkSettings | null;
  isLoading: boolean;
  error: string | null;
  canUndoReset: boolean;
  setMode: (mode: Mode) => void;
  setOffDay: (day: 1 | 2 | 3) => void;
  toggleTask: (taskId: string) => void;
  resetChecksForShift: (shiftInstanceKey: string) => void;
  undoReset: () => void;
  saveWorkSettings: (settings: WorkSettings, applyMode: SettingsApplyMode, currentShiftInstance: string) => void;
  activatePendingSettings: (currentShiftInstance: string) => void;
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

  const setMode = (mode: Mode): void => {
    setState((current) => ({ ...current, mode }));
  };

  const setOffDay = (offDay: 1 | 2 | 3): void => {
    setState((current) => ({ ...current, offDay }));
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
      return {
        ...current,
        checkedTaskIds: current.checkedTaskIds.filter((taskId) => !taskId.startsWith(prefix)),
      };
    });
  };

  const undoReset = (): void => {
    if (!resetSnapshot) {
      return;
    }

    setState((current) => ({
      ...current,
      checkedTaskIds: [...new Set([...current.checkedTaskIds, ...resetSnapshot.ids])],
    }));
    setResetSnapshot(null);
  };

  const saveWorkSettings = (settings: WorkSettings, applyMode: SettingsApplyMode, currentShiftInstance: string): void => {
    setState((current) => {
      if (applyMode === 'now') {
        return {
          ...current,
          workSettings: copyWorkSettings(settings),
          pendingWorkSettings: null,
        };
      }

      return {
        ...current,
        pendingWorkSettings: {
          value: copyWorkSettings(settings),
          activateAfterShiftInstance: currentShiftInstance,
        },
      };
    });
  };

  const activatePendingSettings = (currentShiftInstance: string): void => {
    setState((current) => {
      if (!current.pendingWorkSettings || current.pendingWorkSettings.activateAfterShiftInstance === currentShiftInstance) {
        return current;
      }

      return {
        ...current,
        workSettings: copyWorkSettings(current.pendingWorkSettings.value),
        pendingWorkSettings: null,
      };
    });
  };

  return {
    mode: state.mode,
    offDay: state.offDay,
    checkedTaskIds: checkedSet,
    workSettings: state.workSettings,
    pendingWorkSettings: state.pendingWorkSettings,
    isLoading,
    error,
    canUndoReset: resetSnapshot !== null,
    setMode,
    setOffDay,
    toggleTask,
    resetChecksForShift,
    undoReset,
    saveWorkSettings,
    activatePendingSettings,
    dismissError: () => setError(null),
  };
}
