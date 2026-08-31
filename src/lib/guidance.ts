import { formatMinutesToTime, parseTimeToMinutes } from './time.ts';
import { getSleepOpportunity } from './schedule.ts';
import type { GuidanceItem, ScheduleKey, ShiftKind, WorkSettings } from '../types';

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest}분`;
  }
  if (rest === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${rest}분`;
}

export function formatOpportunity(minutes: number): string {
  return formatDuration(minutes);
}

export function getCaffeineReferenceTime(settings: WorkSettings, shift: ShiftKind): string {
  const opportunity = getSleepOpportunity(settings, shift);
  const sleepStart = parseTimeToMinutes(opportunity.start);
  return formatMinutesToTime(sleepStart - 8 * 60);
}

export function getGuidanceItems(scheduleKey: ScheduleKey, settings: WorkSettings): readonly GuidanceItem[] {
  if (scheduleKey === 'night') {
    const cutoff = getCaffeineReferenceTime(settings, 'night');
    return [
      {
        id: 'night-nap',
        title: '계획된 야간 전 낮잠',
        body: '첫 야간근무 전 계획된 낮잠은 근무 중 졸림과 경계도 저하를 줄이는 데 도움이 될 수 있습니다. 최적의 길이와 시각은 개인차가 있습니다.',
        evidence: 'conditional',
      },
      {
        id: 'night-light',
        title: '야간 근무 중 빛',
        body: '근무 중 밝은 환경은 각성 유지에 도움이 될 수 있습니다. 퇴근 후에는 안전을 우선하면서 강한 빛과 자극을 줄여 주간 수면을 준비하세요.',
        evidence: 'conditional',
      },
      {
        id: 'night-caffeine',
        title: `카페인 참고선 · ${cutoff}`,
        body: '카페인은 충분한 수면을 대체하지 않습니다. 예정 수면까지 남은 시간과 개인 반응을 고려하고, 야간 근무에서는 근무 전반부 중심으로 계획하는 편이 수면 방해를 줄이는 데 유리할 수 있습니다.',
        evidence: 'general',
      },
    ];
  }

  if (scheduleKey === 'day') {
    const cutoff = getCaffeineReferenceTime(settings, 'day');
    return [
      {
        id: 'day-light',
        title: '기상 후 빛과 활동',
        body: '기상 후 밝은 환경과 규칙적인 활동은 주간 각성과 수면-각성 리듬 유지에 도움이 될 수 있습니다.',
        evidence: 'general',
      },
      {
        id: 'day-caffeine',
        title: `카페인 참고선 · ${cutoff}`,
        body: '예정 취침 약 8시간 전을 하나의 참고선으로 표시합니다. 개인별 카페인 민감도와 실제 취침 시각에 맞춰 더 보수적으로 조정할 수 있습니다.',
        evidence: 'general',
      },
    ];
  }

  if (scheduleKey === 'recovery') {
    return [
      {
        id: 'recovery-light',
        title: '회복일 빛 관리',
        body: '야간근무 직후에는 주간 수면을 방해할 수 있는 강한 빛과 자극을 줄이고, 회복 수면 후에는 다시 빛과 활동을 이용해 목표 리듬으로 전환할 수 있습니다.',
        evidence: 'conditional',
      },
    ];
  }

  if (scheduleKey === 'off1' || scheduleKey === 'off2' || scheduleKey === 'off3') {
    return [
      {
        id: 'day-to-night-direction',
        title: '주 → 야 전환 방향',
        body: '다음 야간근무에 가까워질수록 수면·활동 시각을 늦추고, 마지막 전환일에는 계획된 낮잠과 낮잠 후 충분히 깨는 시간을 고려할 수 있습니다. 개인차가 커서 고정 시각을 처방하지 않습니다.',
        evidence: 'conditional',
      },
    ];
  }

  if (scheduleKey === 'nightRecovery1' || scheduleKey === 'nightRecovery2') {
    return [
      {
        id: 'night-recovery-purpose',
        title: '야간 사이 회복',
        body: '다음 근무도 야간이므로 완전한 주간형 복귀보다 수면기회 확보와 누적 피로 감소를 우선하는 단계입니다.',
        evidence: 'general',
      },
    ];
  }

  if (scheduleKey === 'nightToDay1' || scheduleKey === 'nightToDay2' || scheduleKey === 'nightToDay3') {
    return [
      {
        id: 'night-to-day-light',
        title: '야 → 주 복귀',
        body: '주간근무가 가까워질수록 기상과 활동 시간을 앞당기는 방향으로 계획합니다. 기상 후 빛과 주간 활동은 목표 리듬으로 접근하는 데 활용할 수 있습니다.',
        evidence: 'conditional',
      },
      {
        id: 'night-to-day-caffeine',
        title: '늦은 카페인·낮잠 주의',
        body: '다음 취침을 앞당겨야 하는 단계에서는 늦은 카페인과 긴 늦은 낮잠이 수면 진입을 방해할 수 있으므로 실제 취침 목표를 기준으로 보수적으로 조정합니다.',
        evidence: 'general',
      },
    ];
  }

  return [];
}
