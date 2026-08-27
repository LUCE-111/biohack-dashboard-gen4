import { copyWorkSettings, defaultWorkSettings } from '../data/settings.ts';
import type { Mode, PendingWorkSettings, PersistedState, TransportMode, WorkSettings } from '../types';

export const STORAGE_KEY = 'biohack_gen4_state';
export const SCHEMA_VERSION = 3;

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

function isTransportMode(value: unknown): value is TransportMode {
  return value === 'drive' || value === 'transit' || value === 'walk' || value === 'bike' || value === 'other';
}

function readFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readShiftTimeSettings(value: unknown, fallback: WorkSettings['day']): WorkSettings['day'] {
  if (typeof value !== 'object' || value === null) {
    return { ...fallback };
  }

  const workStart = 'workStart' in value && typeof value.workStart === 'string' ? value.workStart : fallback.workStart;
  const workEnd = 'workEnd' in value && typeof value.workEnd === 'string' ? value.workEnd : fallback.workEnd;
  const preShiftPrepMinutes = 'preShiftPrepMinutes' in value ? readFiniteNumber(value.preShiftPrepMinutes, fallback.preShiftPrepMinutes) : fallback.preShiftPrepMinutes;
  const departureBufferMinutes = 'departureBufferMinutes' in value ? readFiniteNumber(value.departureBufferMinutes, fallback.departureBufferMinutes) : fallback.departureBufferMinutes;
  const commuteToMinutes = 'commuteToMinutes' in value ? readFiniteNumber(value.commuteToMinutes, fallback.commuteToMinutes) : fallback.commuteToMinutes;
  const commuteToTransportValue = 'commuteToTransport' in value ? value.commuteToTransport : undefined;
  const postShiftPrepMinutes = 'postShiftPrepMinutes' in value ? readFiniteNumber(value.postShiftPrepMinutes, fallback.postShiftPrepMinutes) : fallback.postShiftPrepMinutes;
  const commuteFromMinutes = 'commuteFromMinutes' in value ? readFiniteNumber(value.commuteFromMinutes, fallback.commuteFromMinutes) : fallback.commuteFromMinutes;
  const commuteFromTransportValue = 'commuteFromTransport' in value ? value.commuteFromTransport : undefined;
  const postCommuteWindDownMinutes = 'postCommuteWindDownMinutes' in value ? readFiniteNumber(value.postCommuteWindDownMinutes, fallback.postCommuteWindDownMinutes) : fallback.postCommuteWindDownMinutes;
  const postNapBufferMinutes = 'postNapBufferMinutes' in value ? readFiniteNumber(value.postNapBufferMinutes, fallback.postNapBufferMinutes) : fallback.postNapBufferMinutes;

  return {
    workStart,
    workEnd,
    preShiftPrepMinutes,
    departureBufferMinutes,
    commuteToMinutes,
    commuteToTransport: isTransportMode(commuteToTransportValue) ? commuteToTransportValue : fallback.commuteToTransport,
    postShiftPrepMinutes,
    commuteFromMinutes,
    commuteFromTransport: isTransportMode(commuteFromTransportValue) ? commuteFromTransportValue : fallback.commuteFromTransport,
    postCommuteWindDownMinutes,
    postNapBufferMinutes,
  };
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

function cloneInitialState(): PersistedState {
  return {
    ...initialPersistedState,
    checkedTaskIds: [...initialPersistedState.checkedTaskIds],
    workSettings: copyWorkSettings(initialPersistedState.workSettings),
  };
}

export function parsePersistedState(raw: string | null): PersistedState {
  if (!raw) {
    return cloneInitialState();
  }

  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) {
    return cloneInitialState();
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
