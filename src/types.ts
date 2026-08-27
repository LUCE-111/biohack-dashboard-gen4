export type Mode = 'day' | 'off' | 'night' | 'recovery';
export type ScheduleKey = 'day' | 'off1' | 'off2' | 'off3' | 'night' | 'recovery';
export type ThemeTone = 'day' | 'off' | 'night' | 'recovery';
export type TaskTag = 'supp' | 'food' | 'rest' | 'work' | 'transit' | 'sleep' | 'alert';
export type TaskType = 'normal' | 'work' | 'transit' | 'sleep';
export type TaskFilter = 'all' | 'supp' | 'work' | 'sleep';
export type PrimaryView = 'today' | 'schedule' | 'supplements' | 'settings';
export type ShiftKind = 'day' | 'night';
export type SettingsApplyMode = 'now' | 'next';

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
  commuteToMinutes: number;
  commuteFromMinutes: number;
}

export interface WorkSettings {
  day: ShiftTimeSettings;
  night: ShiftTimeSettings;
}

export interface PendingWorkSettings {
  value: WorkSettings;
  activateAfterShiftInstance: string;
}

export interface PersistedState {
  schemaVersion: 2;
  mode: Mode;
  offDay: 1 | 2 | 3;
  checkedTaskIds: readonly string[];
  workSettings: WorkSettings;
  pendingWorkSettings: PendingWorkSettings | null;
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
