import { schedules } from '../data/schedules.ts';
import { formatMinutesToTime, parseTimeToMinutes } from './time.ts';
import type { Schedule, ScheduleChange, ScheduleKey, ValidationIssue, WorkSettings } from '../types';

function formatClock(totalMinutes: number): string {
  return formatMinutesToTime(totalMinutes, totalMinutes === 24 * 60);
}

function tryParseTime(value: string): number | null {
  try {
    return parseTimeToMinutes(value);
  } catch {
    return null;
  }
}

function parseTimeOrDefault(value: string, fallback: string): number {
  return tryParseTime(value) ?? parseTimeToMinutes(fallback);
}

function replaceTaskTimes(schedule: Schedule, replacements: Readonly<Record<string, { start: string; end: string }>>, eyebrow: string): Schedule {
  return {
    ...schedule,
    eyebrow,
    tasks: schedule.tasks.map((task) => {
      const replacement = replacements[task.id];
      return replacement ? { ...task, ...replacement } : task;
    }),
  };
}

function resolveDaySchedule(settings: WorkSettings): Schedule {
  const base = schedules.day;
  const workStart = parseTimeOrDefault(settings.day.workStart, base.tasks.find((task) => task.id === 'day-work-am')?.start ?? '07:40');
  const workEnd = parseTimeOrDefault(settings.day.workEnd, base.tasks.find((task) => task.id === 'day-work-pm')?.end ?? '18:00');
  const commuteStart = workStart - settings.day.commuteToMinutes;
  const wakeStart = commuteStart - 60;
  const commuteEnd = workEnd + settings.day.commuteFromMinutes;
  const workoutEnd = commuteEnd + 90;
  const dinnerEnd = workoutEnd + 120;

  return replaceTaskTimes(base, {
    'day-sleep-main': { start: '00:00', end: formatClock(wakeStart) },
    'day-wake': { start: formatClock(wakeStart), end: formatClock(commuteStart) },
    'day-commute-in': { start: formatClock(commuteStart), end: formatClock(workStart) },
    'day-work-am': { start: formatClock(workStart), end: '12:00' },
    'day-work-pm': { start: '13:00', end: formatClock(workEnd) },
    'day-commute-out': { start: formatClock(workEnd), end: formatClock(commuteEnd) },
    'day-workout': { start: formatClock(commuteEnd), end: formatClock(workoutEnd) },
    'day-dinner': { start: formatClock(workoutEnd), end: formatClock(dinnerEnd) },
    'day-sleep-entry': { start: formatClock(dinnerEnd), end: '24:00' },
  }, `DAY SHIFT · ${formatClock(workStart)}–${formatClock(workEnd)}`);
}

function resolveNightSchedule(settings: WorkSettings): Schedule {
  const base = schedules.night;
  const workStart = parseTimeOrDefault(settings.night.workStart, base.tasks.find((task) => task.id === 'night-work-front')?.start ?? '17:40');
  const workEnd = parseTimeOrDefault(settings.night.workEnd, base.tasks.find((task) => task.id === 'night-work-late')?.end ?? '08:00');
  const commuteStart = workStart - settings.night.commuteToMinutes;
  const prepStart = commuteStart - 60;
  const commuteEnd = workEnd + settings.night.commuteFromMinutes;

  return replaceTaskTimes(base, {
    'night-prep': { start: formatClock(prepStart), end: formatClock(commuteStart) },
    'night-commute-in': { start: formatClock(commuteStart), end: formatClock(workStart) },
    'night-work-front': { start: formatClock(workStart), end: '22:00' },
    'night-work-late': { start: '04:00', end: formatClock(workEnd) },
    'night-commute-out': { start: formatClock(workEnd), end: formatClock(commuteEnd) },
  }, `NIGHT SHIFT · ${formatClock(workStart)}–${formatClock(workEnd)}`);
}

export function resolveSchedule(scheduleKey: ScheduleKey, settings: WorkSettings): Schedule {
  if (scheduleKey === 'day') {
    return resolveDaySchedule(settings);
  }
  if (scheduleKey === 'night') {
    return resolveNightSchedule(settings);
  }
  return schedules[scheduleKey];
}

export function validateWorkSettings(settings: WorkSettings): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dayStart = tryParseTime(settings.day.workStart);
  const dayEnd = tryParseTime(settings.day.workEnd);

  if (dayStart === null || dayEnd === null) {
    issues.push({ shift: 'day', message: '주간 근무 시작·종료 시각을 올바르게 입력하세요.' });
  }
  if (settings.day.commuteToMinutes < 0 || settings.day.commuteToMinutes > 180 || settings.day.commuteFromMinutes < 0 || settings.day.commuteFromMinutes > 180) {
    issues.push({ shift: 'day', message: '주간 이동시간은 0–180분 범위여야 합니다.' });
  }
  if (dayStart !== null && dayEnd !== null) {
    const dayWake = dayStart - settings.day.commuteToMinutes - 60;
    const dayRoutineEnd = dayEnd + settings.day.commuteFromMinutes + 90 + 120;

    if (dayStart >= 12 * 60) {
      issues.push({ shift: 'day', message: '주간 근무 시작이 12:00 이후면 고정 점심 구간과 충돌합니다.' });
    }
    if (dayEnd <= 13 * 60 || dayEnd <= dayStart) {
      issues.push({ shift: 'day', message: '주간 근무 종료는 13:00 이후이며 시작 시각보다 늦어야 합니다.' });
    }
    if (dayWake < 0) {
      issues.push({ shift: 'day', message: '출근 준비 시간이 전날로 넘어갑니다. 근무 시작 또는 출근 소요시간을 조정하세요.' });
    }
    if (dayRoutineEnd > 24 * 60) {
      issues.push({ shift: 'day', message: '퇴근 후 운동·저녁 루틴이 자정을 넘습니다. 근무 종료 또는 퇴근 소요시간을 조정하세요.' });
    }
  }

  const nightStart = tryParseTime(settings.night.workStart);
  const nightEnd = tryParseTime(settings.night.workEnd);

  if (nightStart === null || nightEnd === null) {
    issues.push({ shift: 'night', message: '야간 근무 시작·종료 시각을 올바르게 입력하세요.' });
  }
  if (settings.night.commuteToMinutes < 0 || settings.night.commuteToMinutes > 180 || settings.night.commuteFromMinutes < 0 || settings.night.commuteFromMinutes > 180) {
    issues.push({ shift: 'night', message: '야간 이동시간은 0–180분 범위여야 합니다.' });
  }
  if (nightStart !== null && nightEnd !== null) {
    const nightPrep = nightStart - settings.night.commuteToMinutes - 60;
    const nightHome = nightEnd + settings.night.commuteFromMinutes;

    if (nightStart >= 22 * 60) {
      issues.push({ shift: 'night', message: '야간 근무 시작이 22:00 이후면 전반 근무/간식 구간과 충돌합니다.' });
    }
    if (nightEnd <= 4 * 60) {
      issues.push({ shift: 'night', message: '야간 근무 종료가 04:00 이전이면 새벽 근무 구간과 충돌합니다.' });
    }
    if (nightEnd >= nightStart) {
      issues.push({ shift: 'night', message: '야간 근무는 자정을 넘기는 일정으로 설정해야 합니다.' });
    }
    if (nightPrep < 14 * 60) {
      issues.push({ shift: 'night', message: '출근 준비가 14:00 앵커 낮잠과 겹칩니다. 근무 시작 또는 출근 소요시간을 조정하세요.' });
    }
    if (nightHome >= nightStart) {
      issues.push({ shift: 'night', message: '야간 퇴근 이동이 다음 근무 시작 구간까지 이어집니다.' });
    }
  }

  return issues;
}

export function getScheduleChanges(base: Schedule, resolved: Schedule): readonly ScheduleChange[] {
  const changes: ScheduleChange[] = [];

  for (const task of resolved.tasks) {
    const before = base.tasks.find((candidate) => candidate.id === task.id);
    if (!before || (before.start === task.start && before.end === task.end)) {
      continue;
    }

    changes.push({
      taskId: task.id,
      title: task.title,
      before: `${before.start}–${before.end}`,
      after: `${task.start}–${task.end}`,
    });
  }

  return changes;
}
