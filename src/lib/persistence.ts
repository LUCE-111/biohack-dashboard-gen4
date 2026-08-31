import { copyWorkSettings, defaultWorkSettings } from '../data/settings.ts';
import type {
  Mode,
  PendingWorkSettings,
  PersistedState,
  RosterSettings,
  ShiftPhase,
  TransportMode,
  WorkSettings,
} from '../types.ts';

export const STORAGE_KEY = 'biohack_gen4_state';
export const SCHEMA_VERSION = 4;

export const defaultRosterSettings: RosterSettings = {
  selectedEmployeeId: null,
  activeVersionId: null,
  autoMode: true,
  aliases: {},
  overrides: {},
};

export const initialPersistedState: PersistedState = {
  schemaVersion: SCHEMA_VERSION,
  mode: 'day',
  offDay: 1,
  nightRecoveryDay: 1,
  nightToDayDay: 1,
  checkedTaskIds: [],
  workSettings: copyWorkSettings(defaultWorkSettings),
  pendingWorkSettings: null,
  rosterSettings: { ...defaultRosterSettings },
};

function isMode(value: unknown): value is Mode {
  return value === 'day'
    || value === 'off'
    || value === 'night'
    || value === 'nightRecovery'
    || value === 'nightToDay'
    || value === 'recovery'
    || value === 'rest';
}

function isOffDay(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function isRecoveryDay(value: unknown): value is 1 | 2 {
  return value === 1 || value === 2;
}

function isTransportMode(value: unknown): value is TransportMode {
  return value === 'drive' || value === 'transit' || value === 'walk' || value === 'bike' || value === 'other';
}

function isShiftPhase(value: unknown): value is ShiftPhase {
  return value === 'day'
    || value === 'dayDedicated'
    || value === 'dayToNight1'
    || value === 'dayToNight2'
    || value === 'dayToNight3'
    || value === 'night'
    || value === 'nightRecovery1'
    || value === 'nightRecovery2'
    || value === 'nightToDay1'
    || value === 'nightToDay2'
    || value === 'nightToDay3'
    || value === 'transitionExtraOff'
    || value === 'transitionIrregular'
    || value === 'off'
    || value === 'pl';
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
  return { value: readWorkSettings(pendingValue), activateAfterShiftInstance: activateAfter };
}

function readAliases(value: unknown): Readonly<Record<string, string>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  Object.entries(value).forEach(([key, mapped]) => {
    if (typeof mapped === 'string' && key.trim()) {
      result[key] = mapped;
    }
  });
  return result;
}

function readOverrides(value: unknown): Readonly<Record<string, ShiftPhase>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, ShiftPhase> = {};
  Object.entries(value).forEach(([key, phase]) => {
    if (isShiftPhase(phase)) {
      result[key] = phase;
    }
  });
  return result;
}

function readRosterSettings(value: unknown): RosterSettings {
  if (typeof value !== 'object' || value === null) {
    return { ...defaultRosterSettings };
  }
  const selectedEmployeeId = 'selectedEmployeeId' in value && typeof value.selectedEmployeeId === 'string' ? value.selectedEmployeeId : null;
  const activeVersionId = 'activeVersionId' in value && typeof value.activeVersionId === 'string' ? value.activeVersionId : null;
  const autoMode = 'autoMode' in value && typeof value.autoMode === 'boolean' ? value.autoMode : true;
  const aliases = 'aliases' in value ? readAliases(value.aliases) : {};
  const overrides = 'overrides' in value ? readOverrides(value.overrides) : {};
  return { selectedEmployeeId, activeVersionId, autoMode, aliases, overrides };
}

function cloneInitialState(): PersistedState {
  return {
    ...initialPersistedState,
    checkedTaskIds: [],
    workSettings: copyWorkSettings(initialPersistedState.workSettings),
    rosterSettings: { ...defaultRosterSettings, aliases: {}, overrides: {} },
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
  const nightRecoveryDayValue = 'nightRecoveryDay' in parsed ? parsed.nightRecoveryDay : undefined;
  const nightToDayDayValue = 'nightToDayDay' in parsed ? parsed.nightToDayDay : undefined;
  const checkedValue = 'checkedTaskIds' in parsed ? parsed.checkedTaskIds : undefined;
  const workSettingsValue = 'workSettings' in parsed ? parsed.workSettings : undefined;
  const pendingValue = 'pendingWorkSettings' in parsed ? parsed.pendingWorkSettings : undefined;
  const rosterValue = 'rosterSettings' in parsed ? parsed.rosterSettings : undefined;

  return {
    schemaVersion: SCHEMA_VERSION,
    mode: isMode(modeValue) ? modeValue : initialPersistedState.mode,
    offDay: isOffDay(offDayValue) ? offDayValue : 1,
    nightRecoveryDay: isRecoveryDay(nightRecoveryDayValue) ? nightRecoveryDayValue : 1,
    nightToDayDay: isOffDay(nightToDayDayValue) ? nightToDayDayValue : 1,
    checkedTaskIds: Array.isArray(checkedValue) ? checkedValue.filter((value): value is string => typeof value === 'string') : [],
    workSettings: readWorkSettings(workSettingsValue),
    pendingWorkSettings: readPending(pendingValue),
    rosterSettings: readRosterSettings(rosterValue),
  };
}

export function serializePersistedState(state: PersistedState): string {
  return JSON.stringify(state);
}
