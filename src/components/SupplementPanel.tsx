import { supplementById, supplementRoutine } from '../data/supplements';
import { PillIcon } from './Icons';

export function SupplementPanel() {
  return (
    <section aria-labelledby="supplement-heading" className="rounded-3xl border border-white/8 bg-white/[0.035] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-300/10 text-indigo-200">
          <PillIcon />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Supplement routine</p>
          <h2 id="supplement-heading" className="mt-0.5 text-lg font-semibold text-white">현재 영양제 루틴</h2>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {supplementRoutine.map((routine) => {
          const items = routine.supplementIds.map((id) => supplementById.get(id)).filter((item) => item !== undefined);
          return (
            <article key={routine.id} className="rounded-2xl border border-white/7 bg-black/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-100">{routine.timing}</h3>
                {routine.optional ? <span className="rounded-full border border-slate-400/15 px-2 py-0.5 text-[10px] font-medium text-slate-400">선택</span> : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <span key={item.id} className="rounded-lg bg-indigo-300/8 px-2 py-1 text-[11px] font-medium text-indigo-100">
                    {item.number} {item.shortName}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{routine.reason}</p>
            </article>
          );
        })}
      </div>

      <details className="mt-4 rounded-2xl border border-white/7 bg-black/15 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">제품 구성 메모 보기</summary>
        <div className="mt-4 space-y-4">
          {[...supplementById.values()].map((supplement) => (
            <div key={supplement.id}>
              <p className="text-xs font-semibold text-slate-200">{supplement.number} {supplement.productName}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{supplement.mainIngredient} · {supplement.assessment}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{supplement.note}</p>
            </div>
          ))}
        </div>
      </details>

      <p className="mt-4 text-[11px] leading-5 text-slate-600">표시된 효능·평가·보완 문구는 첨부 문서의 내용을 UI에 옮긴 것이며, 이 화면에서 별도 의학적 검증을 추가하지 않았습니다.</p>
    </section>
  );
}
