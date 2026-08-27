import type { Supplement, SupplementRoutineItem } from '../types';

export const supplements: readonly Supplement[] = [
  {
    id: '1',
    number: '①',
    shortName: '비타민 C',
    productName: 'Solaray 비타민C 서방형',
    mainIngredient: '1,000mg + 로즈힙·아세로라',
    assessment: '흡수 지속성과 항산화력 최상',
    note: '🟢',
  },
  {
    id: '2',
    number: '②',
    shortName: '마그네슘',
    productName: 'Doctor’s Best Mg',
    mainIngredient: 'Mg Bisglycinate 200mg/일',
    assessment: '흡수율 최고, 위장 자극 적음',
    note: '추가량 고려 (원문 목표 300–400mg/일)',
  },
  {
    id: '3',
    number: '③',
    shortName: '비타민 A',
    productName: 'Solgar 비타민A',
    mainIngredient: '5,000 IU (Retinyl Palmitate)',
    assessment: '면역·생식·피부·호르몬 안정화에 적절',
    note: '원문은 베타카로틴 대신 해당 제형 선택을 긍정적으로 평가',
  },
  {
    id: '4',
    number: '④',
    shortName: 'Bone Restore',
    productName: 'Life Extension Bone Restore with K2',
    mainIngredient: 'K2(MK-7), D3 포함',
    assessment: '칼슘 대사 최적화, 혈관석회 방지',
    note: '고용량 D3 중복 확인 필요',
  },
  {
    id: '5',
    number: '⑤',
    shortName: 'Zn-Cu',
    productName: 'Solaray 징크 코퍼',
    mainIngredient: 'Zn 50mg : Cu 2mg',
    assessment: '면역, 테스토스테론, 산화 방지 밸런스 좋음',
    note: '원문 조건: 간 기능 문제 없으면 적절',
  },
  {
    id: '6',
    number: '⑥',
    shortName: 'Probiotic',
    productName: 'NOW 프로바이오틱-10',
    mainIngredient: '250억 CFU, 10종 균주',
    assessment: '장내 미생물군 균형에 효과적',
    note: '원문은 공복 복용 유지 권장',
  },
  {
    id: '7',
    number: '⑦',
    shortName: '오메가3',
    productName: 'Sports Research 오메가3',
    mainIngredient: '고함량 EPA:DHA 비율',
    assessment: '항염·혈관·뇌 보호에 필수',
    note: '고순도 + IFOS 인증 여부 확인',
  },
  {
    id: '8',
    number: '⑧',
    shortName: 'B Complex',
    productName: 'Thorne B Complex',
    mainIngredient: '활성형 B군 전반',
    assessment: '미토콘드리아 대사, 부신, 신경 보호에 핵심',
    note: '원문에서 이상적 구성으로 평가',
  },
];

export const supplementRoutine: readonly SupplementRoutineItem[] = [
  {
    id: 'wake',
    timing: '기상 직후 공복',
    reason: '장내 도달률 ↑, 산도 ↓',
    supplementIds: ['6'],
  },
  {
    id: 'breakfast',
    timing: '아침 식사 직후',
    reason: '지용성 흡수↑, 대사 초기화, 뼈·호르몬·혈관 보호',
    supplementIds: ['3', '4', '7', '8'],
  },
  {
    id: 'lunch',
    timing: '점심 식사 직후',
    reason: '위장 자극 방지, 흡수 최적화',
    supplementIds: ['5', '2'],
  },
  {
    id: 'dinner',
    timing: '저녁 식사 직후',
    reason: '항산화 지속성, 수면 안정',
    supplementIds: ['1', '2'],
  },
  {
    id: 'post-workout',
    timing: '운동 직후',
    reason: '고강도 회복 보조 시 사용 가능',
    supplementIds: ['8'],
    optional: true,
  },
];

export const supplementById = new Map(supplements.map((supplement) => [supplement.id, supplement]));
