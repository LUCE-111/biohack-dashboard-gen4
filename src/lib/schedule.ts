import { schedules } from '../data/schedules.ts';
import { formatMinutesToTime, parseTimeToMinutes } from './time.ts';
import type {
  Schedule,
  ScheduleChange,
  ScheduleKey,
  ShiftKind,
  SleepOpportunity,
  TransitionSnapshot,
  ValidationIssue,
  WorkSettings,
} from '../types';

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

function replaceTaskTimes(
  schedule: Schedule,
  replacements: Readonly<Record<string, { start: string; end: string }>>,
  eyebrow: string,
): Schedule {
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
  const day = settings.day;
  const workStart = parseTimeOrDefault(day.workStart, '07:40');
  const workEnd = parseTimeOrDefault(day.workEnd, '18:00');
  const commuteStart = workStart - day.commuteToMinutes;
  const bufferStart = commuteStart - day.departureBufferMinutes;
  const prepStart = bufferStart - day.preShiftPrepMinutes;
  const leaveWork = workEnd + day.postShiftPrepMinutes;
  const homeArrival = leaveWork + day.commuteFromMinutes;
  const windDownEnd = homeArrival + day.postCommuteWindDownMinutes;
  const workoutEnd = windDownEnd + 90;
  const dinnerEnd = workoutEnd + 120;

  return replaceTaskTimes(base, {
    'day-sleep-main': { start: '00:00', end: formatClock(prepStart) },
    'day-wake': { start: formatClock(prepStart), end: formatClock(bufferStart) },
    'day-departure-buffer': { start: formatClock(bufferStart), end: formatClock(commuteStart) },
    'day-commute-in': { start: formatClock(commuteStart), end: formatClock(workStart) },
    'day-work-am': { start: formatClock(workStart), end: '12:00' },
    'day-work-pm': { start: '13:00', end: formatClock(workEnd) },
    'day-postshift-prep': { start: formatClock(workEnd), end: formatClock(leaveWork) },
    'day-commute-out': { start: formatClock(leaveWork), end: formatClock(homeArrival) },
    'day-winddown': { start: formatClock(homeArrival), end: formatClock(windDownEnd) },
    'day-workout': { start: formatClock(windDownEnd), end: formatClock(workoutEnd) },
    'day-dinner': { start: formatClock(workoutEnd), end: formatClock(dinnerEnd) },
    'day-sleep-entry': { start: formatClock(dinnerEnd), end: '24:00' },
  }, `DAY SHIFT · ${formatClock(workStart)}–${formatClock(workEnd)}`);
}

function resolveNightSchedule(settings: WorkSettings): Schedule {
  const base = schedules.night;
  const night = settings.night;
  const workStart = parseTimeOrDefault(night.workStart, '17:40');
  const workEnd = parseTimeOrDefault(night.workEnd, '08:00');
  const napEnd = parseTimeToMinutes('15:30');
  const napBufferEnd = napEnd + night.postNapBufferMinutes;
  const commuteStart = workStart - night.commuteToMinutes;
  const bufferStart = commuteStart - night.departureBufferMinutes;
  const prepStart = bufferStart - night.preShiftPrepMinutes;
  const leaveWork = workEnd + night.postShiftPrepMinutes;
  const homeArrival = leaveWork + night.commuteFromMinutes;
  const windDownEnd = homeArrival + night.postCommuteWindDownMinutes;

  return replaceTaskTimes(base, {
    'night-nap-buffer': { start: '15:30', end: formatClock(napBufferEnd) },
    'night-prep': { start: formatClock(prepStart), end: formatClock(bufferStart) },
    'night-departure-buffer': { start: formatClock(bufferStart), end: formatClock(commuteStart) },
    'night-commute-in': { start: formatClock(commuteStart), end: formatClock(workStart) },
    'night-work-front': { start: formatClock(workStart), end: '22:00' },
    'night-work-late': { start: '04:00', end: formatClock(workEnd) },
    'night-postshift-prep': { start: formatClock(workEnd), end: formatClock(leaveWork) },
    'night-commute-out': { start: formatClock(leaveWork), end: formatClock(homeArrival) },
    'night-winddown': { start: formatClock(homeArrival), end: formatClock(windDownEnd) },
  }, `NIGHT SHIFT · ${formatClock(workStart)}–${formatClock(workEnd)}`);
}

function resolveRecoverySchedule(settings: WorkSettings): Schedule {
  const base = schedules.recovery;
  const night = settings.night;
  const workEnd = parseTimeOrDefault(night.workEnd, '08:00');
  const homeArrival = workEnd + night.postShiftPrepMinutes + night.commuteFromMinutes;
  const sleepStart = homeArrival + night.postCommuteWindDownMinutes;
  const sleepEnd = sleepStart + 4 * 60;
  const sunEnd = sleepEnd + 30;
  const antioxidantEnd = sunEnd + 3 * 60;

  return replaceTaskTimes(base, {
    'recovery-home': { start: formatClock(homeArrival), end: formatClock(sleepStart) },
    'recovery-sleep': { start: formatClock(sleepStart), end: formatClock(sleepEnd) },
    'recovery-sun': { start: formatClock(sleepEnd), end: formatClock(sunEnd) },
    'recovery-antioxidant': { start: formatClock(sunEnd), end: formatClock(antioxidantEnd) },
    'recovery-light': { start: formatClock(antioxidantEnd), end: '22:00' },
  }, `RECOVERY · SLEEP ${formatClock(sleepStart)}`);
}

export function resolveSchedule(scheduleKey: ScheduleKey, settings: WorkSettings): Schedule {
  if (scheduleKey === 'day') {
    return resolveDaySchedule(settings);
  }
  if (scheduleKey === 'night') {
    return resolveNightSchedule(settings);
  }
  if (scheduleKey === 'recovery') {
    return resolveRecoverySchedule(settings);
  }
  return schedules[scheduleKey];
}

function validateDuration(value: number, label: string, shift: ShiftKind, issues: ValidationIssue[], max = 240): void {
  if (!Number.isFinite(value) || value < 0 || value > max) {
    issues.push({ shift, message: `${label}은 0–${max}분 범위여야 합니다.` });
  }
}

export function validateWorkSettings(settings: WorkSettings): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const day = settings.day;
  const dayStart = tryParseTime(day.workStart);
  const dayEnd = tryParseTime(day.workEnd);

  if (dayStart === null || dayEnd === null) {
    issues.push({ shift: 'day', message: '주간 근무 시작·종료 시각을 올바르게 입력하세요.' });
  }
  validateDuration(day.preShiftPrepMinutes, '주간 출근 준비', 'day', issues);
  validateDuration(day.departureBufferMinutes, '주간 출발 버퍼', 'day', issues, 120);
  validateDuration(day.commuteToMinutes, '주간 출근 이동', 'day', issues);
  validateDuration(day.postShiftPrepMinutes, '주간 퇴근 준비', 'day', issues, 120);
  validateDuration(day.commuteFromMinutes, '주간 퇴근 이동', 'day', issues);
  validateDuration(day.postCommuteWindDownMinutes, '주간 귀가 후 정리', 'day', issues, 180);

  if (dayStart !== null && dayEnd !== null) {
    const prepStart = dayStart - day.commuteToMinutes - day.departureBufferMinutes - day.preShiftPrepMinutes;
    const routineEnd = dayEnd + day.postShiftPrepMinutes + day.commuteFromMinutes + day.postCommuteWindDownMinutes + 90 + 120;

    if (dayStart >= 12 * 60) {
      issues.push({ shift: 'day', message: '주간 근무 시작이 12:00 이후면 고정 점심 구간과 충돌합니다.' });
    }
    if (dayEnd <= 13 * 60 || dayEnd <= dayStart) {
      issues.push({ shift: 'day', message: '주간 근무 종료는 13:00 이후이며 시작 시각보다 늦어야 합니다.' });
    }
    if (prepStart < 0) {
      issues.push({ shift: 'day', message: '출근 준비가 전날로 넘어갑니다. 근무 시작·준비·출근 이동시간을 조정하세요.' });
    }
    if (routineEnd > 24 * 60) {
      issues.push({ shift: 'day', message: '퇴근 후 준비·이동·운동·저녁 루틴이 자정을 넘습니다. 시간을 조정하세요.' });
    }
  }

  const night = settings.night;
  const nightStart = tryParseTime(night.workStart);
  const nightEnd = tryParseTime(night.workEnd);
  validateDuration(night.postNapBufferMinutes, '야간 낮잠 후 회복 버퍼', 'night', issues, 120);
  validateDuration(night.preShiftPrepMinutes, '야간 출근 준비', 'night', issues);
  validateDuration(night.departureBufferMinutes, '야간 출발 버퍼', 'night', issues, 120);
  validateDuration(night.commuteToMinutes, '야간 출근 이동', 'night', issues);
  validateDuration(night.postShiftPrepMinutes, '야간 퇴근 준비', 'night', issues, 120);
  validateDuration(night.commuteFromMinutes, '야간 퇴근 이동', 'night', issues);
  validateDuration(night.postCommuteWindDownMinutes, '야간 귀가 후 수면 준비', 'night', issues, 180);

  if (nightStart === null || nightEnd === null) {
    issues.push({ shift: 'night', message: '야간 근무 시작·종료 시각을 올바르게 입력하세요.' });
  }
  if (nightStart !== null && nightEnd !== null) {
    const prepStart = nightStart - night.commuteToMinutes - night.departureBufferMinutes - night.preShiftPrepMinutes;
    const napReady = parseTimeToMinutes('15:30') + night.postNapBufferMinutes;
    const windDownEnd = nightEnd + night.postShiftPrepMinutes + night.commuteFromMinutes + night.postCommuteWindDownMinutes;

    if (nightStart >= 22 * 60) {
      issues.push({ shift: 'night', message: '야간 근무 시작이 22:00 이후면 전반 근무/간식 구간과 충돌합니다.' });
    }
    if (nightEnd <= 4 * 60) {
      issues.push({ shift: 'night', message: '야간 근무 종료가 04:00 이전이면 새벽 근무 구간과 충돌합니다.' });
    }
    if (nightEnd >= nightStart) {
      issues.push({ shift: 'night', message: '야간 근무는 자정을 넘기는 일정으로 설정해야 합니다.' });
    }
    if (prepStart < napReady) {
      issues.push({ shift: 'night', message: '낮잠 후 회복 버퍼가 끝나기 전에 출근 준비가 시작됩니다. 관련 시간을 조정하세요.' });
    }
    if (windDownEnd >= prepStart) {
      issues.push({ shift: 'night', message: '퇴근 후 귀가·수면 준비가 다음 출근 준비 시간과 겹칩니다.' });
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

export function getTransitionSnapshot(settings: WorkSettings, shift: ShiftKind): TransitionSnapshot {
  const value = settings[shift];
  const workStart = parseTimeOrDefault(value.workStart, shift === 'day' ? '07:40' : '17:40');
  const workEnd = parseTimeOrDefault(value.workEnd, shift === 'day' ? '18:00' : '08:00');
  const commuteStart = workStart - value.commuteToMinutes;
  const departureTime = commuteStart;
  const prepStart = commuteStart - value.departureBufferMinutes - value.preShiftPrepMinutes;
  const leaveWork = workEnd + value.postShiftPrepMinutes;
  const homeArrival = leaveWork + value.commuteFromMinutes;
  const windDownEnd = homeArrival + value.postCommuteWindDownMinutes;

  return {
    shift,
    prepStart: formatClock(prepStart),
    departureTime: formatClock(departureTime),
    workStart: formatClock(workStart),
    workEnd: formatClock(workEnd),
    leaveWorkTime: formatClock(leaveWork),
    homeArrivalTime: formatClock(homeArrival),
    windDownEndTime: formatClock(windDownEnd),
    commuteToTransport: value.commuteToTransport,
    commuteFromTransport: value.commuteFromTransport,
  };
}

export function getSleepOpportunity(settings: WorkSettings, shift: ShiftKind): SleepOpportunity {
  const value = settings[shift];
  const workStart = parseTimeOrDefault(value.workStart, shift === 'day' ? '07:40' : '17:40');
  const prepStart = workStart - value.commuteToMinutes - value.departureBufferMinutes - value.preShiftPrepMinutes;

  if (shift === 'day') {
    const resolved = resolveDaySchedule(settings);
    const sleepStartText = resolved.tasks.find((task) => task.id === 'day-sleep-entry')?.start ?? '22:30';
    const sleepStart = parseTimeToMinutes(sleepStartText);
    const duration = prepStart + 24 * 60 - sleepStart;
    return {
      start: sleepStartText,
      end: formatClock(prepStart),
      durationMinutes: Math.max(0, duration),
      label: '다음 주간 근무 전 수면 기회',
    };
  }

  const workEnd = parseTimeOrDefault(value.workEnd, '08:00');
  const sleepStart = workEnd + value.postShiftPrepMinutes + value.commuteFromMinutes + value.postCommuteWindDownMinutes;
  let duration = prepStart - sleepStart;
  if (duration < 0) {
    duration += 24 * 60;
  }
  return {
    start: formatClock(sleepStart),
    end: formatClock(prepStart),
    durationMinutes: duration,
    label: '야간 근무 후 다음 준비 전 수면 기회',
  };
}
