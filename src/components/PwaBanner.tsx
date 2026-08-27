import { WifiOffIcon } from './Icons';

interface PwaBannerProps {
  isOnline: boolean;
  updateAvailable: boolean;
  onUpdate: () => void;
}

export function PwaBanner({ isOnline, updateAvailable, onUpdate }: PwaBannerProps) {
  if (!isOnline) {
    return (
      <div role="status" className="mb-4 flex min-h-11 items-center gap-2 rounded-2xl border border-amber-300/18 bg-amber-300/[0.05] px-4 text-sm text-amber-100">
        <WifiOffIcon />
        오프라인 모드 · 저장된 일정과 체크 기능은 계속 사용할 수 있습니다.
      </div>
    );
  }

  if (updateAvailable) {
    return (
      <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-300/18 bg-sky-300/[0.05] px-4 py-2 text-sm text-sky-100">
        <span>새 버전이 준비되었습니다.</span>
        <button type="button" onClick={onUpdate} className="min-h-11 rounded-xl border border-sky-200/20 bg-sky-200/10 px-3 font-semibold">업데이트</button>
      </div>
    );
  }

  return null;
}
