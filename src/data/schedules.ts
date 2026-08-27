import type { Mode, Schedule, ScheduleKey } from '../types';

export const schedules: Readonly<Record<ScheduleKey, Schedule>> = {
  day: {
    key: 'day',
    theme: 'day',
    eyebrow: 'DAY SHIFT · 07:40–18:00',
    title: '주간 근무',
    tasks: [
      { id: 'day-sleep-main', start: '00:00', end: '05:40', tag: 'sleep', type: 'sleep', title: '수면', description: '전날 22:30부터 이어진 수면.' },
      { id: 'day-wake', start: '05:40', end: '06:25', tag: 'prep', type: 'normal', title: '출근 준비 & 아침 루틴', description: '기상 후 물 한 잔과 ⑥ 유산균. 아침 식사 후 ③A · ④Bone · ⑦O3 · ⑧B를 챙기고 출근 준비.', supplementIds: ['6', '3', '4', '7', '8'] },
      { id: 'day-departure-buffer', start: '06:25', end: '06:40', tag: 'prep', type: 'normal', title: '출발 버퍼', description: '예상치 못한 준비 지연과 교통 변수를 흡수하는 여유시간.' },
      { id: 'day-commute-in', start: '06:40', end: '07:40', tag: 'transit', type: 'transit', title: '출근 이동', description: '설정한 교통수단으로 이동. 카페인은 예정 수면을 고려해 근무 전반부 중심으로 계획.' },
      { id: 'day-work-am', start: '07:40', end: '12:00', tag: 'work', type: 'work', title: '오전 업무 집중', description: '코르티솔 피크. 물 자주 마시기.' },
      { id: 'day-lunch', start: '12:00', end: '13:00', tag: 'food', type: 'normal', title: '점심 & 휴식', description: '12시 이후 카페인 금지. ⑤Zn-Cu · ②Mg 100mg.', supplementIds: ['5', '2'] },
      { id: 'day-work-pm', start: '13:00', end: '18:00', tag: 'work', type: 'work', title: '오후 업무 집중', description: '나른하면 스트레칭. 카페인 대신 산책.' },
      { id: 'day-postshift-prep', start: '18:00', end: '18:10', tag: 'prep', type: 'normal', title: '퇴근 준비', description: '업무를 정리하고 이동 전 필요한 준비를 마무리.' },
      { id: 'day-commute-out', start: '18:10', end: '19:10', tag: 'transit', type: 'transit', title: '퇴근 이동', description: '귀가 이동. 운전 시 졸림이 느껴지면 일정 준수보다 안전을 우선.' },
      { id: 'day-winddown', start: '19:10', end: '19:30', tag: 'rest', type: 'normal', title: '귀가 후 전환', description: '이동에서 운동·저녁 루틴으로 전환하는 정리 시간.' },
      { id: 'day-workout', start: '19:30', end: '21:00', tag: 'rest', type: 'normal', title: '고강도 운동', description: '무산소(어깨/등/가슴) + 유산소.' },
      { id: 'day-dinner', start: '20:30', end: '22:30', tag: 'supp', type: 'normal', title: '저녁 & 항산화', description: '식사 후 ①Vit C · ②Mg 100mg. 휴식.', supplementIds: ['1', '2'] },
      { id: 'day-sleep-entry', start: '22:30', end: '24:00', tag: 'sleep', type: 'sleep', title: '수면 진입', description: '내일 기상에 대비. 암막커튼.' },
    ],
    info: { exercise: '고강도 (100%)', diet: '일반식 (단백질 위주)' },
    safety: ['내일 야간 근무면, 오늘 아침 B-Complex 생략'],
  },
  off1: {
    key: 'off1',
    theme: 'off',
    eyebrow: 'OFF DAY 1 · REST',
    title: '전환기 1일차 · 휴식',
    tasks: [
      { id: 'off1-sleep', start: '00:00', end: '08:30', tag: 'sleep', type: 'sleep', title: '회복 수면', description: '주간 근무 피로 해소. 9시간 수면 목표.' },
      { id: 'off1-breakfast', start: '08:30', end: '09:30', tag: 'food', type: 'normal', title: '기상 & 아침', description: '자연스러운 기상. 일반 루틴 유지.' },
      { id: 'off1-free-am', start: '09:30', end: '14:00', tag: 'rest', type: 'normal', title: '자유 시간', description: '가벼운 활동. 햇빛 쬐기.' },
      { id: 'off1-free-pm', start: '14:00', end: '21:00', tag: 'rest', type: 'normal', title: '휴식 & 사회활동', description: '무리하지 않는 선에서 활동.' },
      { id: 'off1-winddown', start: '21:00', end: '23:30', tag: 'supp', type: 'normal', title: '취침 준비', description: '①Vit C · ②Mg 100mg. 스마트폰 자제.', supplementIds: ['1', '2'] },
      { id: 'off1-sleep-entry', start: '23:30', end: '24:00', tag: 'sleep', type: 'sleep', title: '수면 시작', description: '내일 08:30 기상을 위한 취침.' },
    ],
    info: { exercise: '완전 휴식 또는 산책', diet: '자유식 (과식 주의)' },
    safety: ['피로하면 운동을 쉬는 것이 이득입니다.'],
  },
  off2: {
    key: 'off2',
    theme: 'off',
    eyebrow: 'OFF DAY 2 · DELAY',
    title: '전환기 2일차 · 리듬 밀기',
    tasks: [
      { id: 'off2-sleep', start: '00:00', end: '08:30', tag: 'sleep', type: 'sleep', title: '수면 중', description: '전날 23:30부터 이어진 수면 (9h).' },
      { id: 'off2-wake', start: '08:30', end: '09:30', tag: 'rest', type: 'normal', title: '기상', description: 'B-Complex 섭취 금지. 오후로 미룸.' },
      { id: 'off2-active', start: '09:30', end: '14:00', tag: 'rest', type: 'normal', title: '활동 시간', description: '낮잠 자지 않도록 주의.' },
      { id: 'off2-b', start: '14:00', end: '16:00', tag: 'supp', type: 'normal', title: '지연된 B-Complex', description: '오후 2시 B-Complex 섭취로 각성 연장.', supplementIds: ['8'] },
      { id: 'off2-workout', start: '16:00', end: '18:00', tag: 'rest', type: 'normal', title: '고강도 운동', description: '체온 유지를 위해 오후 늦게 운동.' },
      { id: 'off2-owl', start: '18:00', end: '01:30', tag: 'rest', type: 'normal', title: '올빼미 모드', description: '밝은 조명 유지. 01:30까지 깨어있기.' },
      { id: 'off2-sleep-entry', start: '01:30', end: '24:00', tag: 'sleep', type: 'sleep', title: '늦은 취침', description: '내일 09:30 기상 목표.' },
    ],
    info: { exercise: '고강도 무산소 (80%)', diet: '야식 금지 (20시 마감)' },
    safety: ['일찍 잠들면 내일 리듬이 꼬입니다.'],
  },
  off3: {
    key: 'off3',
    theme: 'off',
    eyebrow: 'OFF DAY 3 · ADAPT',
    title: '전환기 3일차 · 야간 적응',
    tasks: [
      { id: 'off3-sleep', start: '00:00', end: '09:30', tag: 'sleep', type: 'sleep', title: '수면 중', description: '전날 01:30부터 이어진 수면 (8h).' },
      { id: 'off3-wake', start: '09:30', end: '10:30', tag: 'rest', type: 'normal', title: '기상', description: '아침 B-Complex 섭취 금지.' },
      { id: 'off3-active', start: '10:30', end: '16:00', tag: 'rest', type: 'normal', title: '활동 시간', description: '최대한 빛을 많이 보기.' },
      { id: 'off3-preheat', start: '16:00', end: '17:00', tag: 'supp', type: 'normal', title: '야간 모드 예열', description: '오후 4시 ⑧B-Complex + ⑦O3.', supplementIds: ['8', '7'] },
      { id: 'off3-workout', start: '17:00', end: '18:30', tag: 'rest', type: 'normal', title: '유산소 운동', description: '복근 + 하체. 체온 상승.' },
      { id: 'off3-night-ready', start: '18:30', end: '03:30', tag: 'rest', type: 'normal', title: '야간 대기', description: '03:30까지 버티기. 조명 밝게.' },
      { id: 'off3-sleep-entry', start: '03:30', end: '24:00', tag: 'sleep', type: 'sleep', title: '야간형 취침', description: '내일 10:30 기상 목표.' },
    ],
    info: { exercise: '유산소 위주 (60%)', diet: '소화 잘되는 음식' },
    safety: ['내일 앵커 낮잠을 위해 늦게 자야 합니다.'],
  },
  night: {
    key: 'night',
    theme: 'night',
    eyebrow: 'NIGHT SHIFT · 17:40–08:00',
    title: '야간 근무',
    tasks: [
      { id: 'night-sleep', start: '00:00', end: '10:30', tag: 'sleep', type: 'sleep', title: '수면 중', description: '전날 03:30부터 이어진 수면 (7h).' },
      { id: 'night-wake', start: '10:30', end: '11:30', tag: 'food', type: 'normal', title: '기상 & 식사', description: '가벼운 식사. 활동 시작.' },
      { id: 'night-free', start: '11:30', end: '14:00', tag: 'rest', type: 'normal', title: '자유 시간', description: '낮잠 금지 (14시까지).' },
      { id: 'night-nap', start: '14:00', end: '15:30', tag: 'sleep', type: 'sleep', title: '앵커 낮잠', description: '야간근무 전 계획된 낮잠. 깬 직후에는 sleep inertia를 고려해 즉시 운전·중요 활동으로 연결하지 않음.' },
      { id: 'night-nap-buffer', start: '15:30', end: '15:50', tag: 'rest', type: 'normal', title: '낮잠 후 회복 버퍼', description: '기상 직후의 멍함과 반응 저하가 가라앉을 시간을 확보.' },
      { id: 'night-prep', start: '15:50', end: '16:30', tag: 'prep', type: 'normal', title: '출근 준비', description: '식사·위생·업무 준비. ⑧B-Complex는 기존 사용자 루틴에 따라 준비 단계에서 관리.', supplementIds: ['8'] },
      { id: 'night-departure-buffer', start: '16:30', end: '16:40', tag: 'prep', type: 'normal', title: '출발 버퍼', description: '준비 지연과 교통 변수를 흡수하는 여유시간.' },
      { id: 'night-commute-in', start: '16:40', end: '17:40', tag: 'transit', type: 'transit', title: '출근 이동', description: '설정한 교통수단으로 이동. 자가운전이면 낮잠 직후 충분히 깨어 있는지 먼저 확인.' },
      { id: 'night-work-front', start: '17:40', end: '22:00', tag: 'work', type: 'work', title: '야간 근무 · 전반', description: '카페인 섭취 적기 (22시까지).' },
      { id: 'night-snack', start: '22:00', end: '22:30', tag: 'food', type: 'normal', title: '단백질 간식', description: '계란, 견과류. ②Mg 100mg.', supplementIds: ['2'] },
      { id: 'night-work-mid', start: '22:30', end: '02:00', tag: 'work', type: 'work', title: '야간 근무 · 중반', description: '02시 이후 금식 / 금카페인.' },
      { id: 'night-fast', start: '02:00', end: '04:00', tag: 'alert', type: 'work', title: '금식 존', description: '물만 섭취. 인슐린 휴식.' },
      { id: 'night-work-late', start: '04:00', end: '08:00', tag: 'work', type: 'work', title: '새벽 근무 · 후반', description: '마이크로 쪽잠 20분 활용.' },
      { id: 'night-postshift-prep', start: '08:00', end: '08:15', tag: 'prep', type: 'normal', title: '퇴근 준비', description: '근무를 정리하고 귀가 전 졸림 상태와 이동수단을 확인.' },
      { id: 'night-commute-out', start: '08:15', end: '09:15', tag: 'transit', type: 'transit', title: '퇴근 이동', description: '야간근무 후 이동은 안전 우선. 심한 졸림이 있으면 운전을 시작하지 않고 대체 이동수단이나 충분한 휴식을 고려.' },
      { id: 'night-winddown', start: '09:15', end: '09:45', tag: 'rest', type: 'normal', title: '귀가 후 수면 준비', description: '강한 빛과 자극을 줄이고 주간 수면 환경을 준비. ②Mg는 기존 사용자 루틴으로 관리.', supplementIds: ['2'] },
    ],
    info: { exercise: '운동 금지', diet: '2:5:3 (02시 이후 금식)' },
    safety: ['퇴근길 졸음 쉼터 활용 필수.'],
  },
  recovery: {
    key: 'recovery',
    theme: 'recovery',
    eyebrow: 'RECOVERY · RESET',
    title: '리커버리',
    tasks: [
      { id: 'recovery-home', start: '09:00', end: '09:30', tag: 'rest', type: 'normal', title: '귀가 & 수면 준비', description: '암막커튼, 귀마개.' },
      { id: 'recovery-sleep', start: '09:30', end: '13:30', tag: 'sleep', type: 'sleep', title: '앵커 슬립', description: '4시간만 자고 13:30 강제 기상.' },
      { id: 'recovery-sun', start: '13:30', end: '14:00', tag: 'rest', type: 'normal', title: '햇빛 샤워', description: '일어나자마자 밖으로 나가 햇빛 15분.' },
      { id: 'recovery-antioxidant', start: '14:00', end: '17:00', tag: 'supp', type: 'normal', title: '항산화 & 회복', description: '①Vit C 1000mg + ⑦O3. B군 생략.', supplementIds: ['1', '7'] },
      { id: 'recovery-light', start: '17:00', end: '22:00', tag: 'rest', type: 'normal', title: '저강도 활동', description: '카페인 금지. 가벼운 걷기. 저녁 식사.' },
      { id: 'recovery-sleep-entry', start: '22:00', end: '24:00', tag: 'sleep', type: 'sleep', title: '조기 취침', description: '②Mg 200mg 섭취 후 딥슬립.', supplementIds: ['2'] },
    ],
    info: { exercise: '걷기 (20%)', diet: '소화 잘되는 음식' },
    safety: ['낮잠을 더 자면 밤에 잠을 못 잡습니다.'],
  },
};

export const modeTabs: readonly { mode: Mode; label: string; meta: string }[] = [
  { mode: 'day', label: '주간', meta: 'Day' },
  { mode: 'off', label: '전환기', meta: 'Off' },
  { mode: 'night', label: '야간', meta: 'Night' },
  { mode: 'recovery', label: '회복', meta: 'Reset' },
];

export function getScheduleKey(mode: Mode, offDay: 1 | 2 | 3): ScheduleKey {
  if (mode === 'off') {
    return `off${offDay}`;
  }
  return mode;
}
