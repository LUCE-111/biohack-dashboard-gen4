import assert from 'node:assert/strict';
import test from 'node:test';
import { schedules } from '../data/schedules.ts';
import { defaultWorkSettings } from '../data/settings.ts';
import type { ScheduleTask } from '../types.ts';
import { findActiveTask, findNextTask, formatRemainingTime, getShiftInstanceKey, isMinuteInRange, parseTimeToMinutes } from './time.ts';

const exampleTasks: readonly ScheduleTask[] = [
  { id: 'work', start: '07:00', end: '09:00', tag: 'work', type: 'work', title: '집중', description: '테스트' },
  { id: 'rest', start: '09:00', end: '10:00', tag: 'rest', type: 'normal', title: '휴식', description: '테스트' },
];

test('24:00 is parsed as end of day', () => {
  assert.equal(parseTimeToMinutes('24:00'), 1440);
});

test('midnight-crossing ranges are handled', () => {
  assert.equal(isMinuteInRange(23 * 60, '18:00', '01:30'), true);
  assert.equal(isMinuteInRange(60, '18:00', '01:30'), true);
  assert.equal(isMinuteInRange(8 * 60, '18:00', '01:30'), false);
});

test('current task and remaining time are resolved', () => {
  const now = new Date(2026, 7, 28, 8, 30, 0);
  const active = findActiveTask(exampleTasks, now);

  assert.equal(active?.task.title, '집중');
  assert.equal(active?.remainingMinutes, 30);
});

test('next task is resolved without selecting the active task again', () => {
  const now = new Date(2026, 7, 28, 8, 30, 0);
  const next = findNextTask(exampleTasks, now, 0);
  assert.equal(next?.task.title, '휴식');
  assert.equal(next?.minutesUntil, 30);
});


test('night after-midnight work takes precedence over the pre-shift sleep block', () => {
  const now = new Date(2026, 7, 29, 2, 15, 0);
  const active = findActiveTask(schedules.night.tasks, now);
  assert.equal(active?.task.id, 'night-fast');
});

test('night shift instance stays on the previous date after midnight', () => {
  const now = new Date(2026, 7, 29, 2, 15, 0);
  assert.equal(getShiftInstanceKey('night', now, defaultWorkSettings), 'night_2026-08-28');
});

test('remaining time is formatted in Korean', () => {
  assert.equal(formatRemainingTime(45), '45분 남음');
  assert.equal(formatRemainingTime(125), '2시간 5분 남음');
});
