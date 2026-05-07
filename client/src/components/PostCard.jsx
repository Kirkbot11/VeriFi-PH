import FlagBadge from './FlagBadge';

function formatSignalValue(value) {
  if (value === null || value === undefined) return 'N/A';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `${Math.round(numeric * 100)}%`;
}

function PostCard({ post, onPostClick }) {
  const legitimacy = Number(post.legitimacyScore ?? post.credibilityScore ?? 0);
  const score = Math.max(0, Math.min(100, Number(post.credibilityScore ?? 0)));
  const breakdown = post.credibilityBreakdown || post.analysis?.credibility_breakdown || null;
  const safeTone = score >= 60;
  const ringColor = score >= 60 ? '#06b6d4' : score >= 40 ? '#f59e0b' : '#ef4444';
  const ringStyle = {
    background: `conic-gradient(${ringColor} ${score * 3.6}deg, #d1d5db 0deg)`,
  };

  const signalItems = breakdown
    ? [
        { label: 'Source trust', value: breakdown.source },
        { label: 'Content match', value: breakdown.content },
        { label: 'Fact-check', value: breakdown.fact_check?.score },
        { label: 'Sentiment', value: breakdown.sentiment },
      ]
    : [];

  return (
    <article
      onClick={() => onPostClick(post)}
      className={[
        'rounded-2xl border bg-[#f5f5f0] p-4 shadow-card transition duration-200 sm:p-5',
        post.isFlagged
          ? 'cursor-pointer border-red-300 hover:-translate-y-0.5 hover:shadow-xl'
          : 'border-slate-300 hover:border-slate-400',
      ].join(' ')}
    >
      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <section>
          <header className="mb-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-full bg-cyan-500" />
            <div>
              <p className="font-display text-3xl font-bold leading-none text-slate-900">VeriFI</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                {post.platform?.toUpperCase() || 'Source'}
              </p>
            </div>
          </header>

          <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full p-4" style={ringStyle}>
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#f5f5f0] text-5xl font-bold text-slate-900">
              {score}%
            </div>
          </div>

          <ul className="mt-4 list-disc pl-6 text-3xl font-semibold leading-tight text-slate-800">
            <li className="text-base font-medium">
              Legitimacy: <span className="font-semibold">{legitimacy}%</span>
            </li>
          </ul>

          {signalItems.length ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Signal Breakdown</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                {signalItems.map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-100 px-2 py-2">
                    <span className="block text-[10px] uppercase tracking-wide text-slate-500">{item.label}</span>
                    <span className="mt-1 block text-sm text-slate-900">{formatSignalValue(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-4">
          <div className="min-h-24 rounded-3xl border-2 border-slate-300 bg-slate-100 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Verdict</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{post.reason}</p>
              </div>
              {post.isFlagged ? (
                <FlagBadge />
              ) : (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    safeTone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {safeTone ? 'High Credibility' : 'Moderate Credibility'}
                </span>
              )}
            </div>
          </div>

          <div className="min-h-48 rounded-3xl border-2 border-slate-300 bg-slate-100 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Analysis Summary</p>
            <p className="mt-2 line-clamp-6 text-sm leading-relaxed text-slate-700">{post.content}</p>

            {post.fetchWarning ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                {post.fetchWarning}
              </p>
            ) : null}

            {post.sourceUrl ? (
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="mt-3 inline-block text-xs font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
              >
                Open source post
              </a>
            ) : null}

            {post.cacheHit ? (
              <p className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-800">
                Cached analysis loaded instantly.
              </p>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-300 pt-3">
              <span className="text-sm font-semibold text-slate-800">Credibility: {score}/100</span>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

export default PostCard;
