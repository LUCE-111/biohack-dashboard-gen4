# Bio-Hack Dashboard Gen 4.2

첨부된 Gen 3.0 일정과 현재 영양제 루틴을 바탕으로 재구성한 React + strict TypeScript + Tailwind CSS 모바일 우선 PWA입니다.

## 먼저 설치

Node.js 22 이상을 권장합니다.

```bash
npm install
```

최초 설치 후 생성되는 `package-lock.json`을 저장소에 포함하고, 이후에는 `npm ci`로 동일한 의존성을 재현하는 것을 권장합니다.

## 개발 실행

```bash
npm run dev
```

같은 Wi-Fi의 휴대폰에서 UI를 확인하려면:

```bash
npm run dev:mobile
```

## 모바일 단독 실행(PWA)

```bash
npm run build
```

생성된 `dist/`를 HTTPS 정적 호스팅에 배포합니다. GitHub Pages 배포 시 기존 Actions workflow를 그대로 사용할 수 있습니다.

- Android Chrome: 메뉴 → **앱 설치 / 홈 화면에 추가**
- iPhone Safari: 공유 → **홈 화면에 추가**

Service Worker 캐시는 Gen 4.2로 갱신되어 기존 설치본에서도 업데이트를 감지합니다.

## Gen 4.2 주요 변경

- 주간/야간 **출근 준비 · 출발 버퍼 · 출근 이동**을 별도 설정
- **퇴근 준비 · 퇴근 이동 · 귀가 후 전환/수면 준비**를 별도 설정
- 출근/퇴근 이동수단: 자가운전, 대중교통, 도보, 자전거, 기타
- 야간근무 **낮잠 후 회복 버퍼** 설정
- 모든 설정을 근무 시작/종료 anchor와 연결해 타임라인 자동 재계산
- 야간 Shift Instance를 귀가 후 수면 준비 종료까지 유지
- **Sleep Opportunity**: 실제 수면시간과 구분된 일정상 수면 가능시간 표시
- **Shift Transition**: 준비 시작, 출발 권장, 귀가 예상, 전환 종료 요약
- 야간근무 후 자가운전 시 **퇴근 안전 자가체크**
- 근거 수준을 `Guideline / Conditional / General principle / Personal routine`으로 구분
- 빛, 카페인, 계획된 야간 전 낮잠에 대한 상황별 과학 패널
- Gen 4.1 저장값을 `schemaVersion: 3`으로 자동 migration
- 영양제 문구는 첨부 자료 기반 **Personal routine**으로 과학 가이드와 분리

## 과학 패널 원칙

과학 패널은 일반적인 근무·수면 관리 정보를 제공하며 개인 의료 진단이나 운전 가능 판정을 하지 않습니다. 주요 근거 프레임은 AASM shift-work guidance, NIOSH fatigue/drowsy-driving guidance, NHLBI healthy-sleep guidance입니다.

특히:

- 카페인은 충분한 수면을 대체하는 수단으로 표현하지 않습니다.
- 야간 전 낮잠, 밝은 빛 등은 근거 수준이 조건부인 경우 그대로 표시합니다.
- Sleep Opportunity는 실제 수면시간이나 수면의 질을 의미하지 않습니다.
- 심한 졸림을 선택하면 앱은 운전을 권하지 않고 휴식 또는 대체 교통수단을 제안합니다.

## 검증 순서

완료 판정 전 반드시 아래 순서로 실행합니다.

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

직접 작성하는 소스는 TypeScript/TSX만 사용합니다. 빌드 과정에서 Vite가 생성하는 JavaScript 산출물은 정상적인 배포 artifact입니다.
