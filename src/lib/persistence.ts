import { copyWorkSettings, defaultWorkSettings } from '../data/settings.ts';
import type { Mode, PendingWorkSettings, PersistedState, WorkSettings } from '../types';

export const STORAGE_KEY = 'biohack_gen4_state';
export const SCHEMA_VERSION = 2;

export const initialPersistedState: PersistedState = {
  schemaVersion: SCHEMA_VERSION,
  mode: 'day',
  offDay: 1,
  checkedTaskIds: [],
  workSettings: copyWorkSettings(defaultWorkSettings),
  pendingWorkSettings: null,
};

function isMode(value: unknown): value is Mode {
  return value === 'day' || value === 'off' || value === 'night' || value === 'recovery';
}

function isOffDay(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function isShiftTimeSettings(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const workStart = 'workStart' in value ? value.workStart : undefined;
  const workEnd = 'workEnd' in value ? value.workEnd : undefined;
  const commuteToMinutes = 'commuteToMinutes' in value ? value.commuteToMinutes : undefined;
  const commuteFromMinutes = 'commuteFromMinutes' in value ? value.commuteFromMinutes : undefined;

  return (
    typeof workStart === 'string'
    && typeof workEnd === 'string'
    && typeof commuteToMinutes === 'number'
    && Number.isFinite(commuteToMinutes)
    && typeof commuteFromMinutes === 'number'
    && Number.isFinite(commuteFromMinutes)
  );
}

function readShiftTimeSettings(value: unknown, fallback: WorkSettings['day']): WorkSettings['day'] {
  if (!isShiftTimeSettings(value) || typeof value !== 'object' || value === null) {
    return { ...fallback };
  }

  const workStart = 'workStart' in value && typeof value.workStart === 'string' ? value.workStart : fallback.workStart;
  const workEnd = 'workEnd' in value && typeof value.workEnd === 'string' ? value.workEnd : fallback.workEnd;
  const commuteToMinutes = 'commuteToMinutes' in value && typeof value.commuteToMinutes === 'number' ? value.commuteToMinutes : fallback.commuteToMinutes;
  const commuteFromMinutes = 'commuteFromMinutes' in value && typeof value.commuteFromMinutes === 'number' ? value.commuteFromMinutes : fallback.commuteFromMinutes;

  return { workStart, workEnd, commuteToMinutes, commuteFromMinutes };
}

function readWorkSettings(value: unknown): WorkSettings {
  if (typeof value !== 'object' || value === null) {
    return copyWorkSettings(defaultWorkSettings);
  }

  const day = 'day' in value ? value.day : undefined;
  const night = 'night' in value ? value.night : undefined;

  return {
    day: readShiftTimeSettings(day, defaultWorkSettings.day),
    night: readShiftTimeSettings(night, defaultWorkSettings.night),
  };
}

function readPending(value: unknown): PendingWorkSettings | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const pendingValue = 'value' in value ? value.value : undefined;
  const activateAfter = 'activateAfterShiftInstance' in value ? value.activateAfterShiftInstance : undefined;
  if (typeof activateAfter !== 'string') {
    return null;
  }

  return {
    value: readWorkSettings(pendingValue),
    activateAfterShiftInstance: activateAfter,
  };
}

export function parsePersistedState(raw: string | null): PersistedState {
  if (!raw) {
    return {
      ...initialPersistedState,
      workSettings: copyWorkSettings(initialPersistedState.workSettings),
    };
  }

  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    return {
      ...initialPersistedState,
      workSettings: copyWorkSettings(initialPersistedState.workSettings),
    };
  }

  const modeValue = 'mode' in parsed ? parsed.mode : undefined;
  const offDayValue = 'offDay' in parsed ? parsed.offDay : undefined;
  const checkedValue = 'checkedTaskIds' in parsed ? parsed.checkedTaskIds : undefined;
  const workSettingsValue = 'workSettings' in parsed ? parsed.workSettings : undefined;
  const pendingValue = 'pendingWorkSettings' in parsed ? parsed.pendingWorkSettings : undefined;

  return {
    schemaVersion: SCHEMA_VERSION,
    mode: isMode(modeValue) ? modeValue : initialPersistedState.mode,
    offDay: isOffDay(offDayValue) ? offDayValue : initialPersistedState.offDay,
    checkedTaskIds: Array.isArray(checkedValue)
      ? checkedValue.filter((value): value is string => typeof value === 'string')
      : [],
    workSettings: readWorkSettings(workSettingsValue),
    pendingWorkSettings: readPending(pendingValue),
  };
}

export function serializePersistedState(state: PersistedState): string {
  return JSON.stringify(state);
}
