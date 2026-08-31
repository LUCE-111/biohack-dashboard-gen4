import assert from 'node:assert/strict';
import test from 'node:test';
import { diffRosterVersions, parseRosterWorkbook, resolveCurrentShiftPhase, resolveShiftPhase } from './roster.ts';
import type { RosterAssignment, WorkbookSheetData } from '../types.ts';

const workbook: readonly WorkbookSheetData[] = [
  {
    name: '비고',
    rows: [
      [null, null, '이름'],
      [247, 'mzc', '김현중'],
      [247, 'mzc', '윤동규'],
    ],
  },
  {
    name: '247_근무표',
    rows: [
      [null, 2026, '일', null, '월', null, '화'],
      [null, null, '12월 27일', null, '12월 28일', null, '12월 29일'],
      [null, '주간 근무(08~18)', '김현중', null, '김현중/윤동규', null, '현중'],
      [null, '야간 근무(18~08)', null, null, null, null, '윤동규'],
      [null, null, '1월 3일', null, '1월 4일', null, '1월 5일'],
      [null, '주간전담', '김현중', null, null, null, '윤동규'],
    ],
  },
];

function assignment(date: string, shiftType: RosterAssignment['shiftType'], employeeId = 'employee:테스트'): RosterAssignment {
  return {
    id: `${date}-${shiftType}`,
    date,
    employeeId,
    employeeName: '테스트',
    shiftType,
    startTime: shiftType === 'night' ? '18:00' : shiftType === 'dayDedicated' ? '09:00' : '08:00',
    endTime: shiftType === 'night' ? '08:00' : '18:00',
    rawValue: '테스트',
    source: { sheet: 'fixture', cells: ['C1'] },
    confidence: 'exact',
  };
}

test('roster parser recognizes date rows, split cells, aliases and year rollover', () => {
  const parsed = parseRosterWorkbook(workbook);
  assert.ok(parsed.employees.some((employee) => employee.canonicalName === '김현중'));
  assert.ok(parsed.assignments.some((item) => item.date === '2026-12-28' && item.employeeName === '윤동규' && item.shiftType === 'day'));
  assert.ok(parsed.assignments.some((item) => item.date === '2027-01-03' && item.shiftType === 'dayDedicated'));
  assert.ok(parsed.unresolvedTokens.includes('현중'));

  const mapped = parseRosterWorkbook(workbook, { 현중: 'employee:김현중' });
  assert.ok(mapped.assignments.some((item) => item.date === '2026-12-29' && item.employeeName === '김현중' && item.confidence === 'alias'));
  assert.equal(mapped.unresolvedTokens.includes('현중'), false);
});

test('canonical cycle resolves day-to-night, night recovery and night-to-day phases', () => {
  const employeeId = 'employee:테스트';
  const assignments = [
    assignment('2026-08-01', 'day'), assignment('2026-08-02', 'day'), assignment('2026-08-03', 'day'), assignment('2026-08-04', 'day'),
    assignment('2026-08-08', 'night'), assignment('2026-08-11', 'night'), assignment('2026-08-14', 'night'), assignment('2026-08-17', 'night'),
    assignment('2026-08-21', 'day'), assignment('2026-08-22', 'day'), assignment('2026-08-23', 'day'), assignment('2026-08-24', 'day'),
  ];
  assert.equal(resolveShiftPhase(assignments, [], employeeId, '2026-08-05').phase, 'dayToNight1');
  assert.equal(resolveShiftPhase(assignments, [], employeeId, '2026-08-06').phase, 'dayToNight2');
  assert.equal(resolveShiftPhase(assignments, [], employeeId, '2026-08-07').phase, 'dayToNight3');
  assert.equal(resolveShiftPhase(assignments, [], employeeId, '2026-08-09').phase, 'nightRecovery1');
  assert.equal(resolveShiftPhase(assignments, [], employeeId, '2026-08-10').phase, 'nightRecovery2');
  assert.equal(resolveShiftPhase(assignments, [], employeeId, '2026-08-18').phase, 'nightToDay1');
  assert.equal(resolveShiftPhase(assignments, [], employeeId, '2026-08-19').phase, 'nightToDay2');
  assert.equal(resolveShiftPhase(assignments, [], employeeId, '2026-08-20').phase, 'nightToDay3');
  assert.equal(resolveShiftPhase(assignments, [], employeeId, '2026-08-20').isCanonicalPattern, true);
});

test('short and long transition gaps anchor stages to the next shift', () => {
  const employeeId = 'employee:테스트';
  const short = [assignment('2026-08-01', 'day'), assignment('2026-08-04', 'night')];
  assert.equal(resolveShiftPhase(short, [], employeeId, '2026-08-02').phase, 'dayToNight2');
  assert.equal(resolveShiftPhase(short, [], employeeId, '2026-08-03').phase, 'dayToNight3');
  assert.equal(resolveShiftPhase(short, [], employeeId, '2026-08-02').isCanonicalPattern, false);

  const long = [assignment('2026-08-01', 'night'), assignment('2026-08-06', 'day')];
  assert.equal(resolveShiftPhase(long, [], employeeId, '2026-08-02').phase, 'transitionExtraOff');
  assert.equal(resolveShiftPhase(long, [], employeeId, '2026-08-03').phase, 'nightToDay1');
  assert.equal(resolveShiftPhase(long, [], employeeId, '2026-08-05').phase, 'nightToDay3');
});

test('after-midnight time remains attached to previous night roster through post-shift transition', () => {
  const assignments = [assignment('2026-08-08', 'night')];
  const activeDuringWork = resolveCurrentShiftPhase(assignments, [], 'employee:테스트', new Date(2026, 7, 9, 3, 0, 0));
  assert.equal(activeDuringWork.phase, 'night');
  assert.equal(activeDuringWork.date, '2026-08-08');

  const activeDuringCommute = resolveCurrentShiftPhase(assignments, [], 'employee:테스트', new Date(2026, 7, 9, 9, 30, 0), {}, 105);
  assert.equal(activeDuringCommute.phase, 'night');
  assert.equal(activeDuringCommute.date, '2026-08-08');

  const afterTransition = resolveCurrentShiftPhase(assignments, [], 'employee:테스트', new Date(2026, 7, 9, 10, 0, 0), {}, 105);
  assert.equal(afterTransition.phase, 'off');
  assert.equal(afterTransition.date, '2026-08-09');
});

test('roster diff separates added, removed and changed dates', () => {
  const employeeId = 'employee:테스트';
  const before = [assignment('2026-08-01', 'day'), assignment('2026-08-02', 'night')];
  const after = [assignment('2026-08-01', 'night'), assignment('2026-08-03', 'day')];
  const diff = diffRosterVersions(before, after, employeeId);
  assert.equal(diff.changed, 1);
  assert.equal(diff.removed, 1);
  assert.equal(diff.added, 1);
});
