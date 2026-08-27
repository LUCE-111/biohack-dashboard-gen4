import type { ActiveTask, NextTask, ScheduleKey, ScheduleTask, WorkSettings } from '../types';

export function parseTimeToMinutes(value: string): number {
  const [hourText, minuteText] = value.split(':');
  const hours = Number(hourText);
  const minutes = Number(minuteText);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time value: ${value}`);
  }

  if (hours === 24 && minutes !== 0) {
    throw new Error(`Invalid time value: ${value}`);
  }

  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number, preserveEndOfDay = false): string {
  if (preserveEndOfDay && totalMinutes === 24 * 60) {
    return '24:00';
  }

  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isMinuteInRange(currentMinutes: number, start: string, end: string): boolean {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function getRemainingMinutes(currentMinutes: number, end: string): number {
  const endMinutes = parseTimeToMinutes(end);
  let difference = endMinutes - currentMinutes;

  if (difference < 0) {
    difference += 24 * 60;
  }

  return difference;
}

export function findActiveTask(tasks: readonly ScheduleTask[], now: Date): ActiveTask | null {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let activeIndex = -1;

  tasks.forEach((task, index) => {
    if (isMinuteInRange(currentMinutes, task.start, task.end)) {
      activeIndex = index;
    }
  });

  if (activeIndex < 0) {
    return null;
  }

  const task = tasks[activeIndex];
  if (!task) {
    return null;
  }

  return {
    index: activeIndex,
    task,
    remainingMinutes: getRemainingMinutes(currentMinutes, task.end),
  };
}

export function findNextTask(tasks: readonly ScheduleTask[], now: Date, activeIndex: number | null): NextTask | null {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let best: NextTask | null = null;

  tasks.forEach((task, index) => {
    if (index === activeIndex) {
      return;
    }

    const startMinutes = parseTimeToMinutes(task.start) % (24 * 60);
    let minutesUntil = startMinutes - currentMinutes;
    if (minutesUntil <= 0) {
      minutesUntil += 24 * 60;
    }

    if (!best || minutesUntil < best.minutesUntil) {
      best = { index, task, minutesUntil };
    }
  });

  return best;
}

export function formatRemainingTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}분 남음`;
  }

  return `${hours}시간 ${minutes}분 남음`;
}

export function formatClock(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getShiftInstanceKey(scheduleKey: ScheduleKey, now: Date, settings: WorkSettings): string {
  const shiftDate = new Date(now);

  if (scheduleKey === 'night') {
    const workStart = parseTimeToMinutes(settings.night.workStart);
    const workEnd = parseTimeToMinutes(settings.night.workEnd);
    const shiftCrossesMidnight = workEnd <= workStart;
    const closeMinutes = workEnd + settings.night.commuteFromMinutes;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (shiftCrossesMidnight && currentMinutes < closeMinutes) {
      shiftDate.setDate(shiftDate.getDate() - 1);
    }
  }

  return `${scheduleKey}_${getLocalDateKey(shiftDate)}`;
}
