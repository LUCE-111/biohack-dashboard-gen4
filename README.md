# Bio-Hack Dashboard Gen 4.3

5조 2교대 근무, 준비·이동·수면 기회·영양제 루틴에 더해 **Excel 근무표를 로컬에서 분석해 오늘의 근무/전환 모드를 자동 결정**하는 React + strict TypeScript + Tailwind CSS 모바일 우선 PWA입니다.

## 설치

Node.js 22 이상을 권장합니다.

```bash
npm install
```

`package-lock.json`을 저장소에 포함하고 이후 CI/GitHub Actions에서는 `npm ci`로 동일한 의존성 버전을 재현하세요.

## 개발 실행

```bash
npm run dev
```

같은 Wi-Fi의 휴대폰에서 확인하려면:

```bash
npm run dev:mobile
```

## 모바일 단독 실행(PWA)

```bash
npm run build
```

생성된 `dist/`를 HTTPS 정적 호스팅(GitHub Pages 등)에 배포합니다.

- Android Chrome: 메뉴 → **앱 설치 / 홈 화면에 추가**
- iPhone Safari: 공유 → **홈 화면에 추가**

Service Worker 캐시 버전은 Gen 4.3입니다.

## Gen 4.3 근무표 사용법

1. 하단 **근무표** 탭을 엽니다.
2. **새 근무표 가져오기**에서 `.xlsx` 파일을 선택합니다.
3. Import Preview에서 기간, 직원, 배정 건수, 충돌/별칭 후보를 확인합니다.
4. 이름이 축약된 표현은 앱이 임의 추정하지 않으므로 실제 근무자와 직접 연결합니다.
5. **이 대시보드에서 사용할 근무자**를 선택하고 **근무표 적용**을 누릅니다.
6. **자동 모드**가 켜져 있으면 오늘 날짜와 전후 근무를 기준으로 주간/야간/전환/회복 모드가 자동 설정됩니다.
7. 새 근무표를 다시 가져오면 선택 근무자 기준 추가/변경/삭제 diff를 먼저 보여준 뒤 새 버전으로 저장합니다.

Excel 원본 파일 자체는 서버나 공개 GitHub 저장소로 업로드하지 않습니다. 브라우저에서 읽고 정규화한 결과를 IndexedDB에 저장하며 최근 근무표 버전 3개를 유지합니다.

## 자동 교대 패턴

정상 패턴은 다음 주기를 기준으로 해석합니다.

```text
주간 ×4
→ 비번 ×3
→ 야간
→ 비번 ×2
→ 야간
→ 비번 ×2
→ 야간
→ 비번 ×2
→ 야간
→ 비번 ×3
→ 주간 ×4
```

비번은 모두 같은 OFF가 아니라 전후 실제 근무를 보고 다음 phase로 정규화합니다.

- `DAY_TO_NIGHT_1/2/3`: 주간 → 야간 전환 3일
- `NIGHT_RECOVERY_1/2`: 야간 사이 회복 2일
- `NIGHT_TO_DAY_1/2/3`: 야간 → 주간 전환 3일
- `TRANSITION_EXTRA_OFF`: 정상보다 긴 간격의 추가 비번
- `TRANSITION_IRREGULAR`: PL/중복 근무 등 자동 확정하면 안 되는 예외

간격이 정확히 3일/2일이 아니어도 다음 실제 근무에 가까운 날부터 최종 transition stage를 맞춥니다. 예를 들어 `DAY → OFF×2 → NIGHT`은 `DAY_TO_NIGHT_2`, `DAY_TO_NIGHT_3`으로 처리하고 비표준 전환으로 표시합니다.

## Excel parser 원칙

근무표의 특정 셀 좌표를 고정하지 않고 다음 구조를 탐색합니다.

- `근무표` 시트 탐색
- `n월 n일` 날짜행 탐색 및 12월→1월 year rollover
- `주간 근무`, `주간 전담/주전담`, `야간 근무`, `PL/PM,PL` 의미 정규화
- 날짜별 2열 블록의 양쪽 셀 모두 확인하여 split-cell 변경 근무 지원
- 셀 내부 복수 이름 및 `/` 구분 이름 지원
- `비고` 시트를 우선 직원 master로 사용
- 축약 이름/별칭은 사용자 매핑 후 재사용
- 동일 날짜에 한 직원이 복수 근무유형에 잡히면 conflict로 표시하고 임의 선택하지 않음

## Today 자동 모드

근무표 자동 모드가 활성화되면:

- `DAY` / `DAY_DEDICATED` → 주간 profile
- `NIGHT` → 야간 profile
- 주→야 3일 → 기존 야간 적응 timeline
- 야간 사이 2일 → Night Recovery timeline
- 야→주 3일 → Day Return timeline
- 비표준/충돌 → 예외 확인 timeline

`DAY_DEDICATED`는 Excel에 기록된 09–18 등 실제 근무 시작/종료 anchor를 사용합니다. 준비/출퇴근 이동 시간은 Gen 4.2 사용자 설정을 그대로 역산합니다.

야간은 자정을 지난 다음날에도 전날 Night Shift에 귀속되며, **근무 종료뿐 아니라 퇴근 준비 + 퇴근 이동 + 귀가 후 수면 준비가 끝날 때까지** 같은 Shift Instance를 유지합니다.

상단 근무 타입을 사용자가 직접 선택하면 자동 모드를 끄고 수동 모드로 전환합니다. **근무표 → 오늘만 근무 모드 변경**은 Excel 원본을 건드리지 않는 날짜별 override입니다.

## 월간 근무 캘린더

근무표 탭에서 선택 근무자의 월간 resolved calendar를 확인할 수 있습니다. 직접 근무일뿐 아니라 주→야 전환, 야간 사이 회복, 야→주 전환, 비표준 예외까지 표시합니다.

## 근무표 버전 / 최신화

새 Excel을 가져올 때 원본 파일 SHA-256과 정규화 일정 SHA-256을 저장합니다. 선택 근무자 기준으로 기존 version과 비교해:

- 추가
- 변경
- 삭제

건수를 Import Preview에 표시합니다. 최근 3개 version을 IndexedDB에 보관해 이전 근무표를 다시 활성화할 수 있습니다.

브라우저 보안상 로컬 파일이 바뀌었는지를 PWA가 자동 감시하지는 않습니다. 새 근무표가 배포되면 사용자가 다시 파일을 선택해 최신화하는 방식입니다.

## Gen 4.2 기능 유지

- 주간/야간 출근 준비 · 출발 버퍼 · 출근 이동
- 퇴근 준비 · 퇴근 이동 · 귀가 후 전환/수면 준비
- 자가운전/대중교통/도보/자전거/기타 이동수단
- 야간 낮잠 후 회복 버퍼
- Sleep Opportunity
- Shift Transition
- 야간근무 후 자가운전 안전 자가체크
- 빛/카페인/낮잠 Evidence-aware panel
- 영양제 Personal routine

## 저장 데이터

Dashboard 설정은 `schemaVersion: 4`를 사용합니다. 기존 Gen 4.x 설정과 완료 체크는 migration 후 유지됩니다.

근무표 version은 별도 IndexedDB에 저장합니다.

## 검증 순서

완료 판정 전 반드시 다음 순서로 실행합니다.

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

직접 작성하는 source는 TypeScript/TSX만 사용합니다. Vite가 production build에서 생성하는 JavaScript bundle은 정상적인 배포 산출물입니다.
