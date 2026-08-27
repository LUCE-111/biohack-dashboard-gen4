# Bio-Hack Dashboard Gen 4.1.1

첨부된 Gen 3.0 일정과 현재 영양제 루틴을 바탕으로 재구성한 React + strict TypeScript + Tailwind CSS 모바일 우선 PWA입니다.

## 먼저 설치

Node.js 22 이상을 권장합니다.

```bash
npm install
```

`tsc`를 찾을 수 없다는 메시지는 의존성이 아직 설치되지 않았다는 의미입니다. `npm install` 후 로컬 `node_modules/.bin/tsc`가 자동 사용됩니다. 저장소의 `typecheck` 래퍼는 정상 설치 환경에서는 공식 `@types/react`를 사용하고, 의존성을 받을 수 없는 제한된 검증 환경에서만 별도 fallback 선언을 사용합니다.

최초 `npm install`이 성공하면 `package-lock.json`이 생성됩니다. 이후에는 그 lockfile을 함께 보관하고 `npm ci`로 동일한 의존성을 재현하는 것을 권장합니다.

## 개발 실행

```bash
npm run dev
```

같은 Wi-Fi의 휴대폰에서 UI를 확인하려면:

```bash
npm run dev:mobile
```

터미널에 표시된 PC의 LAN 주소로 접속합니다. 단, 일반 HTTP LAN 주소에서는 모바일 브라우저의 보안 정책 때문에 PWA 설치/Service Worker가 제한될 수 있습니다.

## 모바일 단독 실행(PWA)

프로덕션 빌드:

```bash
npm run build
```

생성된 `dist/`를 HTTPS 정적 호스팅에 배포한 뒤 모바일에서 한 번 접속합니다.

- Android Chrome: 메뉴 → **앱 설치 / 홈 화면에 추가**
- iPhone Safari: 공유 → **홈 화면에 추가**

설치 후에는 홈 화면 아이콘으로 standalone 실행되며, 첫 온라인 로드 이후 핵심 일정/체크/설정 화면은 오프라인에서도 동작하도록 Service Worker가 캐시합니다.

## 검증 순서

반드시 아래 순서로 실행합니다.

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Gen 4.1 주요 변경

- 주간/야간 근무 시작·종료 및 출퇴근 소요시간 설정
- 변경 Preview와 충돌 차단
- `다음 Shift부터` / `즉시 적용` 선택
- 주간 출근·퇴근·운동·저녁 루틴 자동 재계산
- 야간 출근·퇴근 및 전/후반 업무 구간 자동 재계산
- 야간 자정 이후에도 같은 `Shift Instance`로 체크 기록 유지
- 모바일 Today 중심 UX와 하단 4탭 내비게이션
- NOW + NEXT, 48px 완료 버튼, 수동 `NOW로 이동`
- 체크 초기화 Undo
- PWA manifest, standalone/safe-area, 오프라인 캐시, 업데이트 배너
- persisted state `schemaVersion: 2`와 Gen 4 상태 migration
- 직접 작성하는 소스는 TypeScript/TSX만 사용하며 빌드 산출물의 JavaScript는 허용
