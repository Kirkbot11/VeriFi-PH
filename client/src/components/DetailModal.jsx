import CredibilityScore from './CredibilityScore';
import LegalInsight from './LegalInsight';

function formatReadableSections(text, maxItems = 8) {
  if (!text) return [];

  const cleaned = String(text).replace(/\s+/g, ' ').trim();
  const rawSentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);

  return rawSentences.slice(0, maxItems).map((sentence) => {
    const matched = sentence.match(/^([A-Za-z][A-Za-z\s-]{2,32}):\s*(.+)$/);

    if (matched) {
      return {
        label: matched[1].trim(),
        text: matched[2].trim(),
      };
    }

    return {
      label: null,
      text: sentence.trim(),
    };
  });
}

function DetailModal({ post, onClose }) {
  if (!post) return null;

  const breakdown = post.credibilityBreakdown || post.analysis?.credibility_breakdown || null;

  const breakdownRows = breakdown
    ? [
        { label: 'Source trust', value: breakdown.source },
        { label: 'Content alignment', value: breakdown.content },
        { label: 'Fact-check support', value: breakdown.fact_check?.score, detail: breakdown.fact_check?.verdict },
        { label: 'Tone / sentiment', value: breakdown.sentiment },
        { label: 'AI resistance', value: breakdown.ai },
      ]
    : [];

  const summarySections = formatReadableSections(post.content || post.explanation || '', 6);
  const analysisSections = formatReadableSections(post.explanation || post.content || '', 10);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
        {/* Header – always at top, button always accessible */}
        <header className="sticky top-0 bg-white border-b border-slate-200 rounded-t-2xl flex items-start justify-between gap-3 p-5 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {post.platform?.toUpperCase() || 'Social Post'} Analysis
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900">
              {post.user}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 shrink-0"
          >
            Close
          </button>
        </header>

        {/* Scrollable content area */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
          {post.sourceUrl && (
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
            >
              View original link
            </a>
          )}

          <CredibilityScore score={post.credibilityScore} reason={post.reason} />

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-display text-base font-semibold text-slate-900">Summary</h3>
            <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-800">
              {(summarySections.length ? summarySections : [{ label: null, text: post.content }]).map((section, index) => (
                <p key={`${section.label || 'summary'}-${index}`}>
                  {section.label ? <span className="font-semibold text-slate-900">{section.label}: </span> : null}
                  {section.text}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-display text-base font-semibold text-slate-900">Fact Check</h3>
            <p className="mt-2 text-sm text-slate-700">
              Verdict: <span className="font-semibold text-slate-900">{post.factCheck}</span>
            </p>
          </section>

          {breakdownRows.length ? (
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-display text-base font-semibold text-slate-900">Score Breakdown</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {breakdownRows.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {typeof item.value === 'number' ? `${Math.round(item.value * 100)}%` : 'N/A'}
                    </p>
                    {item.detail ? (
                      <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <LegalInsight
            law={post.law}
            explanation={post.lawExplanation}
            riskLevel={post.riskLevel}
          />

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-display text-base font-semibold text-slate-900">Analysis</h3>
            <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-800">
              {(analysisSections.length ? analysisSections : [{ label: null, text: post.explanation || post.content }]).map((section, index) => (
                <p key={`${section.label || 'analysis'}-${index}`}>
                  {section.label ? <span className="font-semibold text-slate-900">{section.label}: </span> : null}
                  {section.text}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-display text-base font-semibold text-amber-900">Important Note</h3>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              VeriFi-PH provides risk signals, not absolute truth. Results may be incorrect or incomplete. Always verify with trusted sources before sharing.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;