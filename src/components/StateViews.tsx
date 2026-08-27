export function LoadingState() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" role="status" aria-live="polite">
      <span className="sr-only">대시보드를 불러오는 중입니다.</span>
      <div className="animate-pulse space-y-4">
        <div className="h-36 rounded-3xl bg-white/5" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-2xl bg-white/5" />
          <div className="h-24 rounded-2xl bg-white/5" />
          <div className="h-24 rounded-2xl bg-white/5" />
        </div>
        <div className="h-80 rounded-3xl bg-white/5" />
      </div>
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100">
      <span><strong className="font-semibold">저장 상태 오류:</strong> {message}</span>
      {onDismiss ? <button type="button" onClick={onDismiss} className="min-h-11 rounded-xl px-3 font-semibold text-rose-100 hover:bg-rose-100/8">닫기</button> : null}
    </div>
  );
}
