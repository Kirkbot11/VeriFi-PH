function formatSignalValue(value) {
  if (value === null || value === undefined) return 'N/A';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `${Math.round(numeric * 100)}%`;
}

function getCredibilityBand(score) {
  if (score <= 39) {
    return {
      label: 'Low Credibility',
      textClass: 'text-red-700',
      bgClass: 'bg-red-100',
      borderClass: 'border-red-200',
      ringColor: '#ef4444',
    };
  }

  if (score <= 69) {
    return {
      label: 'Moderate Credibility',
      textClass: 'text-amber-700',
      bgClass: 'bg-amber-100',
      borderClass: 'border-amber-200',
      ringColor: '#f59e0b',
    };
  }

  return {
    label: 'High Credibility',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-100',
    borderClass: 'border-emerald-200',
    ringColor: '#22c55e',
  };
}

function PostCard({ post, onPostClick }) {
  const legitimacy = Number(post.legitimacyScore ?? post.credibilityScore ?? 0);
  const score = Math.max(0, Math.min(100, Number(post.credibilityScore ?? 0)));
  const breakdown = post.credibilityBreakdown || post.analysis?.credibility_breakdown || null;
  const credibilityBand = getCredibilityBand(score);
  const isLowCredibility = score < 40;
  const ringStyle = {
    background: `conic-gradient(${credibilityBand.ringColor} ${score * 3.6}deg, #d1d5db 0deg)`,
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
      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:items-stretch">
        <section>
          <header className="mb-4 flex items-center gap-3">
            <div>
              <p className="font-display text-3xl font-bold leading-none text-slate-900">VeriFI</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                {post.platform?.toUpperCase() || 'Source'}
              </p>
            </div>
          </header>

          <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full p-4" style={ringStyle}>
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#f5f5f0]">
              <p className="text-5xl font-bold text-slate-900">{score}%</p>
            </div>
          </div>

          <ul className="mt-4 list-disc pl-6 text-3xl font-semibold leading-tight text-slate-800">
            <li className="text-base font-medium">
              Legitimacy: <span className="font-semibold">{legitimacy}%</span>
            </li>
          </ul>

          {signalItems.length ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Score Breakdown</p>
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

        <section className="flex h-full flex-col gap-4">
          <div className="min-h-24 rounded-3xl border-2 border-slate-300 bg-slate-100 p-4 flex items-center">
            <div className="flex w-full items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Verdict</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{post.reason}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${credibilityBand.bgClass} ${credibilityBand.textClass} ${credibilityBand.borderClass}`}
              >
                {credibilityBand.label}
              </span>
            </div>
          </div>

          <div className="flex min-h-48 flex-1 flex-col rounded-3xl border-2 border-slate-300 bg-slate-100 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Analysis Summary</p>
            <p className="mt-2 line-clamp-6 flex-1 text-sm leading-relaxed text-slate-700">{post.content}</p>

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
          </div>
        </section>
      </div>
    </article>
  );
}

export default PostCard;
