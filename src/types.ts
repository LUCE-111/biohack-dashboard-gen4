export type Mode = 'day' | 'off' | 'night' | 'nightRecovery' | 'nightToDay' | 'recovery' | 'rest';
export type ScheduleKey =
  | 'day'
  | 'off1'
  | 'off2'
  | 'off3'
  | 'night'
  | 'nightRecovery1'
  | 'nightRecovery2'
  | 'nightToDay1'
  | 'nightToDay2'
  | 'nightToDay3'
  | 'recovery'
  | 'rest'
  | 'irregular';
export type ThemeTone = 'day' | 'off' | 'night' | 'recovery';
export type TaskTag = 'supp' | 'food' | 'rest' | 'work' | 'transit' | 'sleep' | 'alert' | 'prep';
export type TaskType = 'normal' | 'work' | 'transit' | 'sleep';
export type TaskFilter = 'all' | 'supp' | 'work' | 'sleep';
export type PrimaryView = 'today' | 'schedule' | 'roster' | 'supplements' | 'settings';
export type ShiftKind = 'day' | 'night';
export type SettingsApplyMode = 'now' | 'next';
export type TransportMode = 'drive' | 'transit' | 'walk' | 'bike' | 'other';
export type EvidenceLevel = 'guideline' | 'conditional' | 'general' | 'personal';
export type DrowsinessState = 'okay' | 'sleepy' | 'unsafe';

export interface ScheduleTask {
  id: string;
  start: string;
  end: string;
  tag: TaskTag;
  type: TaskType;
  title: string;
  description: string;
  supplementIds?: readonly SupplementId[];
}

export interface ScheduleInfo {
  exercise: string;
  diet: string;
}

export interface Schedule {
  key: ScheduleKey;
  theme: ThemeTone;
  title: string;
  eyebrow: string;
  tasks: readonly ScheduleTask[];
  info: ScheduleInfo;
  safety: readonly string[];
}

export type SupplementId = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export interface Supplement {
  id: SupplementId;
  number: string;
  shortName: string;
  productName: string;
  mainIngredient: string;
  assessment: string;
  note: string;
}

export interface SupplementRoutineItem {
  id: string;
  timing: string;
  reason: string;
  supplementIds: readonly SupplementId[];
  optional?: boolean;
}

export interface ShiftTimeSettings {
  workStart: string;
  workEnd: string;
  preShiftPrepMinutes: number;
  departureBufferMinutes: number;
  commuteToMinutes: number;
  commuteToTransport: TransportMode;
  postShiftPrepMinutes: number;
  commuteFromMinutes: number;
  commuteFromTransport: TransportMode;
  postCommuteWindDownMinutes: number;
  postNapBufferMinutes: number;
}

export interface WorkSettings {
  day: ShiftTimeSettings;
  night: ShiftTimeSettings;
}

export interface PendingWorkSettings {
  value: WorkSettings;
  activateAfterShiftInstance: string;
}

export type ImportedShiftType = 'day' | 'dayDedicated' | 'night' | 'pl';
export type ShiftPhase =
  | 'day'
  | 'dayDedicated'
  | 'dayToNight1'
  | 'dayToNight2'
  | 'dayToNight3'
  | 'night'
  | 'nightRecovery1'
  | 'nightRecovery2'
  | 'nightToDay1'
  | 'nightToDay2'
  | 'nightToDay3'
  | 'transitionExtraOff'
  | 'transitionIrregular'
  | 'off'
  | 'pl';

export interface RosterEmployee {
  id: string;
  canonicalName: string;
  aliases: readonly string[];
  source: 'master' | 'schedule';
}

export interface RosterAssignment {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  shiftType: ImportedShiftType;
  startTime: string;
  endTime: string;
  rawValue: string;
  source: {
    sheet: string;
    cells: readonly string[];
  };
  confidence: 'exact' | 'alias' | 'reviewRequired';
}

export interface RosterConflict {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  shiftTypes: readonly ImportedShiftType[];
  message: string;
}

export interface RosterCoverage {
  from: string;
  to: string;
}

export interface RosterVersion {
  id: string;
  fileName: string;
  importedAt: string;
  rawHash: string;
  scheduleHash: string;
  parserVersion: number;
  coverage: RosterCoverage;
  employees: readonly RosterEmployee[];
  assignments: readonly RosterAssignment[];
  conflicts: readonly RosterConflict[];
  unresolvedTokens: readonly string[];
}

export interface RosterAliasMap {
  readonly [alias: string]: string;
}

export interface RosterSettings {
  selectedEmployeeId: string | null;
  activeVersionId: string | null;
  autoMode: boolean;
  aliases: RosterAliasMap;
  overrides: Readonly<Record<string, ShiftPhase>>;
}

export interface PersistedState {
  schemaVersion: 4;
  mode: Mode;
  offDay: 1 | 2 | 3;
  nightRecoveryDay: 1 | 2;
  nightToDayDay: 1 | 2 | 3;
  checkedTaskIds: readonly string[];
  workSettings: WorkSettings;
  pendingWorkSettings: PendingWorkSettings | null;
  rosterSettings: RosterSettings;
}

export interface ActiveTask {
  index: number;
  task: ScheduleTask;
  remainingMinutes: number;
}

export interface NextTask {
  index: number;
  task: ScheduleTask;
  minutesUntil: number;
}

export interface ScheduleChange {
  taskId: string;
  title: string;
  before: string;
  after: string;
}

export interface ValidationIssue {
  shift: ShiftKind;
  message: string;
}

export interface SleepOpportunity {
  start: string;
  end: string;
  durationMinutes: number;
  label: string;
}

export interface TransitionSnapshot {
  shift: ShiftKind;
  prepStart: string;
  departureTime: string;
  workStart: string;
  workEnd: string;
  leaveWorkTime: string;
  homeArrivalTime: string;
  windDownEndTime: string;
  commuteToTransport: TransportMode;
  commuteFromTransport: TransportMode;
}

export interface GuidanceItem {
  id: string;
  title: string;
  body: string;
  evidence: EvidenceLevel;
}

export interface ResolvedShiftPhase {
  date: string;
  phase: ShiftPhase;
  previousShift?: ImportedShiftType;
  nextShift?: ImportedShiftType;
  offRunLength?: number;
  offRunPosition?: number;
  isCanonicalPattern: boolean;
  source: 'roster' | 'override' | 'manual';
  assignment?: RosterAssignment;
  conflict?: RosterConflict;
}

export interface RosterDiffItem {
  date: string;
  kind: 'added' | 'removed' | 'changed';
  before: readonly ImportedShiftType[];
  after: readonly ImportedShiftType[];
}

export interface RosterDiffSummary {
  added: number;
  removed: number;
  changed: number;
  items: readonly RosterDiffItem[];
}

export type WorkbookCell = string | number | boolean | Date | null;
export interface WorkbookSheetData {
  name: string;
  rows: readonly (readonly WorkbookCell[])[];
}

export interface ParsedRosterWorkbook {
  employees: readonly RosterEmployee[];
  assignments: readonly RosterAssignment[];
  conflicts: readonly RosterConflict[];
  unresolvedTokens: readonly string[];
  coverage: RosterCoverage;
}
