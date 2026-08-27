import { ShieldIcon } from './Icons';

interface SafetyPanelProps {
  items: readonly string[];
}

export function SafetyPanel({ items }: SafetyPanelProps) {
  return (
    <section aria-labelledby="safety-heading" className="rounded-3xl border border-rose-300/12 bg-rose-300/[0.035] p-5 sm:p-6">
      <div className="flex items-center gap-3 text-rose-200">
        <ShieldIcon />
        <h2 id="safety-heading" className="text-sm font-semibold">Safety check</h2>
      </div>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-slate-300">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-300/70" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">등록된 안전 메모가 없습니다.</p>
      )}
    </section>
  );
}
