import type {
  ImportedShiftType,
  ParsedRosterWorkbook,
  ResolvedShiftPhase,
  RosterAliasMap,
  RosterAssignment,
  RosterConflict,
  RosterDiffSummary,
  RosterEmployee,
  ShiftPhase,
  WorkbookCell,
  WorkbookSheetData,
} from '../types.ts';

export const ROSTER_PARSER_VERSION = 1;

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/;
const KOREAN_NAME_PATTERN = /^[가-힣]{2,4}$/;
const NON_NAME_TOKENS = new Set([
  '투입', '신규', '대체', '지원', '교육', '휴가', '연차', '반차', '공가', '검진', '예정', '사용',
  '노동절', '어린이', '어린이날', '설날', '추석', '공휴일', '대체공휴일', '삼일절', '개천절', '한글날',
  '현충일', '광복절', '성탄절', '부처님오신날', '부처님', '오신', '제헌절', '선거', '지방', '휴일',
  '긴급', '변경', '근무변경', '대체휴무', '대체휴일', '근무시간', '동시에', '반차는', '사용가능', '사용할',
  '주간에', '주전에', '추가근무', '휴가와', '휴무는', '건강검진', '경조사', '민방위', '예비군',
  'NEW', 'PM', 'PL', 'DAY', 'NIGHT',
]);

interface DateColumn {
  date: string;
  leftIndex: number;
}

interface ShiftRow {
  rowIndex: number;
  shiftType: ImportedShiftType;
  startTime: string;
  endTime: string;
}

function text(value: WorkbookCell | undefined): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeName(value: string): string {
  return value.replace(/\s+/g, '').trim();
}

function employeeId(name: string): string {
  return `employee:${normalizeName(name)}`;
}

function columnLetters(index: number): string {
  let value = index + 1;
  let result = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDateText(value: WorkbookCell | undefined): { month: number; day: number } | null {
  const match = text(value).match(DATE_PATTERN);
  if (!match) {
    return null;
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return { month, day };
}

function isDateRow(row: readonly WorkbookCell[]): boolean {
  let count = 0;
  row.forEach((value) => {
    if (parseDateText(value)) {
      count += 1;
    }
  });
  return count >= 3;
}

function normalizeShiftLabel(value: WorkbookCell | undefined): ShiftRow['shiftType'] | null {
  const label = text(value).replace(/\s+/g, '');
  if (!label) {
    return null;
  }
  if (label.includes('주간전담') || label.includes('주전담')) {
    return 'dayDedicated';
  }
  if (label.includes('주간근무')) {
    return 'day';
  }
  if (label.includes('야간근무')) {
    return 'night';
  }
  if (label === 'PL' || label.includes('PM,PL')) {
    return 'pl';
  }
  return null;
}

function shiftTimes(shiftType: ImportedShiftType, label: string): { startTime: string; endTime: string } {
  const match = label.match(/(\d{1,2})\s*[~～-]\s*(\d{1,2})/);
  if (match) {
    return {
      startTime: `${String(Number(match[1])).padStart(2, '0')}:00`,
      endTime: `${String(Number(match[2])).padStart(2, '0')}:00`,
    };
  }
  if (shiftType === 'dayDedicated') {
    return { startTime: '09:00', endTime: '18:00' };
  }
  if (shiftType === 'day') {
    return { startTime: '08:00', endTime: '18:00' };
  }
  if (shiftType === 'night') {
    return { startTime: '18:00', endTime: '08:00' };
  }
  return { startTime: '09:00', endTime: '18:00' };
}

function tokenizeNames(raw: string): readonly string[] {
  const cleaned = raw
    .replace(/[()\[\]{}]/g, ' ')
    .replace(/[·,;|/+&]/g, ' ')
    .replace(/\bNEW\b/gi, ' ')
    .replace(/\d+/g, ' ');
  return cleaned
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function looksLikeName(token: string): boolean {
  return KOREAN_NAME_PATTERN.test(token) && !NON_NAME_TOKENS.has(token);
}

function getRosterSheet(workbook: readonly WorkbookSheetData[]): WorkbookSheetData | null {
  return workbook.find((sheet) => sheet.name === '247_근무표')
    ?? workbook.find((sheet) => sheet.name.includes('근무표') && !sheet.name.includes('등록'))
    ?? null;
}

function getMasterSheet(workbook: readonly WorkbookSheetData[]): WorkbookSheetData | null {
  return workbook.find((sheet) => sheet.name === '비고')
    ?? workbook.find((sheet) => sheet.name.includes('비고'))
    ?? null;
}

function extractMasterEmployees(workbook: readonly WorkbookSheetData[]): RosterEmployee[] {
  const sheet = getMasterSheet(workbook);
  if (!sheet) {
    return [];
  }
  const names = new Set<string>();
  sheet.rows.forEach((row) => {
    const affiliation = text(row[0]);
    const name = text(row[2]);
    if ((affiliation === '247' || affiliation === '247.0' || affiliation === '247') && looksLikeName(name)) {
      names.add(name);
    }
  });
  return [...names].map((name) => ({ id: employeeId(name), canonicalName: name, aliases: [], source: 'master' as const }));
}

function discoverScheduleEmployees(sheet: WorkbookSheetData, existing: readonly RosterEmployee[]): RosterEmployee[] {
  const names = new Set(existing.map((employee) => employee.canonicalName));
  sheet.rows.forEach((row) => {
    if (!normalizeShiftLabel(row[1])) {
      return;
    }
    row.slice(2, 16).forEach((value) => {
      const raw = text(value);
      tokenizeNames(raw).forEach((token) => {
        if (token.length >= 3 && looksLikeName(token)) {
          names.add(token);
        }
      });
    });
  });
  const existingNames = new Set(existing.map((employee) => employee.canonicalName));
  return [...names]
    .filter((name) => !existingNames.has(name))
    .map((name) => ({ id: employeeId(name), canonicalName: name, aliases: [], source: 'schedule' as const }));
}

function baseYearFromSheet(sheet: WorkbookSheetData): number {
  for (const row of sheet.rows.slice(0, 6)) {
    for (const value of row.slice(0, 5)) {
      const numeric = typeof value === 'number' ? value : Number(text(value));
      if (Number.isInteger(numeric) && numeric >= 2020 && numeric <= 2100) {
        return numeric;
      }
    }
  }
  return new Date().getFullYear();
}

function buildDateRows(sheet: WorkbookSheetData): ReadonlyMap<number, readonly DateColumn[]> {
  const result = new Map<number, readonly DateColumn[]>();
  let year = baseYearFromSheet(sheet);
  let previousMonth: number | null = null;

  sheet.rows.forEach((row, rowIndex) => {
    if (!isDateRow(row)) {
      return;
    }
    const columns: DateColumn[] = [];
    row.forEach((value, index) => {
      const parsed = parseDateText(value);
      if (!parsed) {
        return;
      }
      if (previousMonth !== null && previousMonth === 12 && parsed.month === 1) {
        year += 1;
      }
      previousMonth = parsed.month;
      columns.push({ date: toDateKey(year, parsed.month, parsed.day), leftIndex: index });
    });
    result.set(rowIndex, columns);
  });
  return result;
}

function buildShiftRows(sheet: WorkbookSheetData): ReadonlyMap<number, ShiftRow> {
  const rows = new Map<number, ShiftRow>();
  sheet.rows.forEach((row, rowIndex) => {
    const shiftType = normalizeShiftLabel(row[1]);
    if (!shiftType) {
      return;
    }
    const label = text(row[1]);
    const times = shiftTimes(shiftType, label);
    rows.set(rowIndex, { rowIndex, shiftType, ...times });
  });
  return rows;
}

function resolveCellEmployees(
  raw: string,
  employees: readonly RosterEmployee[],
  aliases: RosterAliasMap,
): { matches: readonly { employee: RosterEmployee; confidence: 'exact' | 'alias' }[]; unresolved: readonly string[] } {
  const matches = new Map<string, { employee: RosterEmployee; confidence: 'exact' | 'alias' }>();
  employees.forEach((employee) => {
    if (raw.includes(employee.canonicalName)) {
      matches.set(employee.id, { employee, confidence: 'exact' });
    }
  });

  const tokens = tokenizeNames(raw);
  tokens.forEach((token) => {
    const employeeIdValue = aliases[token];
    if (!employeeIdValue) {
      return;
    }
    const employee = employees.find((candidate) => candidate.id === employeeIdValue);
    if (employee && !matches.has(employee.id)) {
      matches.set(employee.id, { employee, confidence: 'alias' });
    }
  });

  const unresolved = tokens.filter((token) => {
    if (!looksLikeName(token) || token.length !== 2) {
      return false;
    }
    if (aliases[token]) {
      return false;
    }
    return !employees.some((employee) => raw.includes(employee.canonicalName) && employee.canonicalName.includes(token));
  });

  return { matches: [...matches.values()], unresolved };
}

function buildConflicts(assignments: readonly RosterAssignment[]): RosterConflict[] {
  const groups = new Map<string, RosterAssignment[]>();
  assignments.forEach((assignment) => {
    const key = `${assignment.date}|${assignment.employeeId}`;
    const group = groups.get(key) ?? [];
    group.push(assignment);
    groups.set(key, group);
  });

  const conflicts: RosterConflict[] = [];
  groups.forEach((group, key) => {
    const types = [...new Set(group.map((item) => item.shiftType))];
    if (types.length <= 1) {
      return;
    }
    const first = group[0];
    if (!first) {
      return;
    }
    conflicts.push({
      id: `conflict:${key}`,
      date: first.date,
      employeeId: first.employeeId,
      employeeName: first.employeeName,
      shiftTypes: types,
      message: `${first.date}에 ${types.join(' + ')} 근무가 동시에 배정되어 있습니다.`,
    });
  });
  return conflicts.sort((a, b) => a.date.localeCompare(b.date));
}

export function parseRosterWorkbook(workbook: readonly WorkbookSheetData[], aliases: RosterAliasMap = {}): ParsedRosterWorkbook {
  const sheet = getRosterSheet(workbook);
  if (!sheet) {
    throw new Error('근무표 시트를 찾을 수 없습니다.');
  }

  const master = extractMasterEmployees(workbook);
  const discovered = discoverScheduleEmployees(sheet, master);
  const employees = [...master, ...discovered].sort((a, b) => a.canonicalName.localeCompare(b.canonicalName, 'ko'));
  if (employees.length === 0) {
    throw new Error('근무자 이름을 찾을 수 없습니다.');
  }

  const dateRows = buildDateRows(sheet);
  if (dateRows.size === 0) {
    throw new Error('근무표에서 날짜 행을 찾을 수 없습니다.');
  }
  const shiftRows = buildShiftRows(sheet);
  const assignments: RosterAssignment[] = [];
  const unresolved = new Set<string>();
  const seen = new Set<string>();
  const dateRowIndexes = [...dateRows.keys()].sort((a, b) => a - b);

  dateRowIndexes.forEach((dateRowIndex, dateRowPosition) => {
    const dateColumns = dateRows.get(dateRowIndex) ?? [];
    const nextDateRowIndex = dateRowIndexes[dateRowPosition + 1] ?? sheet.rows.length;
    for (let rowIndex = dateRowIndex + 1; rowIndex < nextDateRowIndex; rowIndex += 1) {
      const shift = shiftRows.get(rowIndex);
      if (!shift) {
        continue;
      }
      const row = sheet.rows[rowIndex] ?? [];
      dateColumns.forEach((dateColumn) => {
        const pairIndexes = [dateColumn.leftIndex, dateColumn.leftIndex + 1];
        pairIndexes.forEach((cellIndex) => {
          const raw = text(row[cellIndex]);
          if (!raw) {
            return;
          }
          const resolved = resolveCellEmployees(raw, employees, aliases);
          resolved.unresolved.forEach((token) => unresolved.add(token));
          resolved.matches.forEach(({ employee, confidence }) => {
            const dedupeKey = `${dateColumn.date}|${employee.id}|${shift.shiftType}`;
            if (seen.has(dedupeKey)) {
              return;
            }
            seen.add(dedupeKey);
            assignments.push({
              id: `assignment:${dateColumn.date}:${employee.id}:${shift.shiftType}`,
              date: dateColumn.date,
              employeeId: employee.id,
              employeeName: employee.canonicalName,
              shiftType: shift.shiftType,
              startTime: shift.startTime,
              endTime: shift.endTime,
              rawValue: raw,
              source: {
                sheet: sheet.name,
                cells: [`${columnLetters(cellIndex)}${rowIndex + 1}`],
              },
              confidence,
            });
          });
        });
      });
    }
  });

  assignments.sort((a, b) => a.date.localeCompare(b.date) || a.employeeName.localeCompare(b.employeeName, 'ko'));
  if (assignments.length === 0) {
    throw new Error('근무 배정을 추출하지 못했습니다.');
  }
  const calendarDates = [...dateRows.values()].flatMap((columns) => columns.map((column) => column.date)).sort();
  return {
    employees,
    assignments,
    conflicts: buildConflicts(assignments),
    unresolvedTokens: [...unresolved].sort((a, b) => a.localeCompare(b, 'ko')),
    coverage: { from: calendarDates[0] ?? '', to: calendarDates[calendarDates.length - 1] ?? '' },
  };
}

function dateToUtc(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function addDays(dateKey: string, days: number): string {
  const value = new Date(dateToUtc(dateKey) + days * DAY_MS);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

function diffDays(from: string, to: string): number {
  return Math.round((dateToUtc(to) - dateToUtc(from)) / DAY_MS);
}

function isDayFamily(shift: ImportedShiftType): boolean {
  return shift === 'day' || shift === 'dayDedicated';
}

function assignmentMap(assignments: readonly RosterAssignment[], employeeId: string): ReadonlyMap<string, readonly RosterAssignment[]> {
  const map = new Map<string, RosterAssignment[]>();
  assignments.filter((assignment) => assignment.employeeId === employeeId).forEach((assignment) => {
    const group = map.get(assignment.date) ?? [];
    group.push(assignment);
    map.set(assignment.date, group);
  });
  return map;
}

function directPhase(assignments: readonly RosterAssignment[], conflict: RosterConflict | undefined): ShiftPhase | null {
  if (conflict || assignments.length > 1) {
    return 'transitionIrregular';
  }
  const assignment = assignments[0];
  if (!assignment) {
    return null;
  }
  if (assignment.shiftType === 'day') {
    return 'day';
  }
  if (assignment.shiftType === 'dayDedicated') {
    return 'dayDedicated';
  }
  if (assignment.shiftType === 'night') {
    return 'night';
  }
  return 'pl';
}

function nearestAssignment(
  map: ReadonlyMap<string, readonly RosterAssignment[]>,
  date: string,
  direction: -1 | 1,
  maxDays = 14,
): { date: string; assignments: readonly RosterAssignment[] } | null {
  for (let distance = 1; distance <= maxDays; distance += 1) {
    const candidateDate = addDays(date, direction * distance);
    const candidates = map.get(candidateDate);
    if (candidates && candidates.length > 0) {
      return { date: candidateDate, assignments: candidates };
    }
  }
  return null;
}

function singleShift(assignments: readonly RosterAssignment[]): ImportedShiftType | null {
  const types = [...new Set(assignments.map((assignment) => assignment.shiftType))];
  return types.length === 1 ? types[0] ?? null : null;
}

function transitionStage(daysUntilNext: number, stages: number): number | null {
  if (daysUntilNext > stages) {
    return null;
  }
  return stages - daysUntilNext + 1;
}

export function resolveShiftPhase(
  assignments: readonly RosterAssignment[],
  conflicts: readonly RosterConflict[],
  employeeId: string,
  date: string,
  overrides: Readonly<Record<string, ShiftPhase>> = {},
): ResolvedShiftPhase {
  const override = overrides[date];
  if (override) {
    return { date, phase: override, isCanonicalPattern: false, source: 'override' };
  }

  const map = assignmentMap(assignments, employeeId);
  const todayAssignments = map.get(date) ?? [];
  const conflict = conflicts.find((item) => item.date === date && item.employeeId === employeeId);
  const direct = directPhase(todayAssignments, conflict);
  if (direct) {
    return { date, phase: direct, isCanonicalPattern: !conflict, source: 'roster', assignment: todayAssignments[0], conflict };
  }

  const previous = nearestAssignment(map, date, -1);
  const next = nearestAssignment(map, date, 1);
  if (!previous || !next) {
    return { date, phase: 'off', isCanonicalPattern: false, source: 'roster' };
  }
  const previousShift = singleShift(previous.assignments);
  const nextShift = singleShift(next.assignments);
  const offRunLength = diffDays(previous.date, next.date) - 1;
  const offRunPosition = diffDays(previous.date, date);
  const daysUntilNext = diffDays(date, next.date);

  if (!previousShift || !nextShift || previousShift === 'pl' || nextShift === 'pl') {
    return {
      date,
      phase: 'transitionIrregular',
      previousShift: previousShift ?? undefined,
      nextShift: nextShift ?? undefined,
      offRunLength,
      offRunPosition,
      isCanonicalPattern: false,
      source: 'roster',
    };
  }

  if (isDayFamily(previousShift) && nextShift === 'night') {
    const stage = transitionStage(daysUntilNext, 3);
    const phase = stage === 1 ? 'dayToNight1' : stage === 2 ? 'dayToNight2' : stage === 3 ? 'dayToNight3' : 'transitionExtraOff';
    return { date, phase, previousShift, nextShift, offRunLength, offRunPosition, isCanonicalPattern: offRunLength === 3, source: 'roster' };
  }

  if (previousShift === 'night' && isDayFamily(nextShift)) {
    const stage = transitionStage(daysUntilNext, 3);
    const phase = stage === 1 ? 'nightToDay1' : stage === 2 ? 'nightToDay2' : stage === 3 ? 'nightToDay3' : 'transitionExtraOff';
    return { date, phase, previousShift, nextShift, offRunLength, offRunPosition, isCanonicalPattern: offRunLength === 3, source: 'roster' };
  }

  if (previousShift === 'night' && nextShift === 'night') {
    const stage = transitionStage(daysUntilNext, 2);
    const phase = stage === 1 ? 'nightRecovery1' : stage === 2 ? 'nightRecovery2' : 'transitionExtraOff';
    return { date, phase, previousShift, nextShift, offRunLength, offRunPosition, isCanonicalPattern: offRunLength === 2, source: 'roster' };
  }

  return { date, phase: 'off', previousShift, nextShift, offRunLength, offRunPosition, isCanonicalPattern: true, source: 'roster' };
}

export function resolveCurrentShiftPhase(
  assignments: readonly RosterAssignment[],
  conflicts: readonly RosterConflict[],
  employeeId: string,
  now: Date,
  overrides: Readonly<Record<string, ShiftPhase>> = {},
  nightPostShiftMinutes = 0,
): ResolvedShiftPhase {
  const today = localDateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (currentMinutes < 12 * 60) {
    const yesterday = addDays(today, -1);
    const yesterdayNight = assignments.find((assignment) => assignment.employeeId === employeeId && assignment.date === yesterday && assignment.shiftType === 'night');
    if (yesterdayNight) {
      const endHour = Number(yesterdayNight.endTime.split(':')[0] ?? '8');
      const endMinute = Number(yesterdayNight.endTime.split(':')[1] ?? '0');
      const endMinutes = endHour * 60 + endMinute + Math.max(0, nightPostShiftMinutes);
      if (currentMinutes < endMinutes) {
        return { date: yesterday, phase: 'night', isCanonicalPattern: true, source: 'roster', assignment: yesterdayNight };
      }
    }
  }
  return resolveShiftPhase(assignments, conflicts, employeeId, today, overrides);
}

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function phaseToSchedule(phase: ShiftPhase): { mode: import('../types.ts').Mode; scheduleKey: import('../types.ts').ScheduleKey; offDay: 1 | 2 | 3; nightRecoveryDay: 1 | 2; nightToDayDay: 1 | 2 | 3 } {
  const base = { offDay: 1 as const, nightRecoveryDay: 1 as const, nightToDayDay: 1 as const };
  if (phase === 'day' || phase === 'dayDedicated') {
    return { ...base, mode: 'day', scheduleKey: 'day' };
  }
  if (phase === 'dayToNight1' || phase === 'dayToNight2' || phase === 'dayToNight3') {
    const day = phase === 'dayToNight1' ? 1 : phase === 'dayToNight2' ? 2 : 3;
    return { ...base, mode: 'off', scheduleKey: `off${day}` as 'off1' | 'off2' | 'off3', offDay: day };
  }
  if (phase === 'night') {
    return { ...base, mode: 'night', scheduleKey: 'night' };
  }
  if (phase === 'nightRecovery1' || phase === 'nightRecovery2') {
    const day = phase === 'nightRecovery1' ? 1 : 2;
    return { ...base, mode: 'nightRecovery', scheduleKey: `nightRecovery${day}` as 'nightRecovery1' | 'nightRecovery2', nightRecoveryDay: day };
  }
  if (phase === 'nightToDay1' || phase === 'nightToDay2' || phase === 'nightToDay3') {
    const day = phase === 'nightToDay1' ? 1 : phase === 'nightToDay2' ? 2 : 3;
    return { ...base, mode: 'nightToDay', scheduleKey: `nightToDay${day}` as 'nightToDay1' | 'nightToDay2' | 'nightToDay3', nightToDayDay: day };
  }
  if (phase === 'transitionIrregular' || phase === 'pl') {
    return { ...base, mode: 'rest', scheduleKey: 'irregular' };
  }
  return { ...base, mode: 'rest', scheduleKey: 'rest' };
}

export function phaseLabel(phase: ShiftPhase): string {
  const labels: Record<ShiftPhase, string> = {
    day: '☀ 주간 근무',
    dayDedicated: '☀ 주간 전담',
    dayToNight1: '🌙 주→야 전환 · 1일차',
    dayToNight2: '🌙 주→야 전환 · 2일차',
    dayToNight3: '🌙 주→야 전환 · 3일차',
    night: '🌑 야간 근무',
    nightRecovery1: '🌑 야간 사이 회복 · 1일차',
    nightRecovery2: '🌑 야간 사이 회복 · 2일차',
    nightToDay1: '☀ 야→주 전환 · 1일차',
    nightToDay2: '☀ 야→주 전환 · 2일차',
    nightToDay3: '☀ 야→주 전환 · 3일차',
    transitionExtraOff: '↔ 전환 여유 비번',
    transitionIrregular: '⚠ 비표준 전환',
    off: '○ 비번',
    pl: 'PL',
  };
  return labels[phase];
}

export function diffRosterVersions(before: readonly RosterAssignment[], after: readonly RosterAssignment[], employeeId: string): RosterDiffSummary {
  const toMap = (items: readonly RosterAssignment[]) => {
    const map = new Map<string, ImportedShiftType[]>();
    items.filter((item) => item.employeeId === employeeId).forEach((item) => {
      const values = map.get(item.date) ?? [];
      if (!values.includes(item.shiftType)) {
        values.push(item.shiftType);
      }
      map.set(item.date, values.sort());
    });
    return map;
  };
  const beforeMap = toMap(before);
  const afterMap = toMap(after);
  const dates = [...new Set([...beforeMap.keys(), ...afterMap.keys()])].sort();
  const items = dates.flatMap((date) => {
    const previous = beforeMap.get(date) ?? [];
    const next = afterMap.get(date) ?? [];
    if (previous.join('|') === next.join('|')) {
      return [];
    }
    const kind = previous.length === 0 ? 'added' : next.length === 0 ? 'removed' : 'changed';
    return [{ date, kind, before: previous, after: next }] as const;
  });
  return {
    added: items.filter((item) => item.kind === 'added').length,
    removed: items.filter((item) => item.kind === 'removed').length,
    changed: items.filter((item) => item.kind === 'changed').length,
    items,
  };
}

export function stableSchedulePayload(assignments: readonly RosterAssignment[]): string {
  return JSON.stringify(assignments.map((item) => [item.date, item.employeeId, item.shiftType, item.startTime, item.endTime]));
}
