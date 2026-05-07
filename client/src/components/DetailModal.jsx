import CredibilityScore from './CredibilityScore';
import LegalInsight from './LegalInsight';

function highlightPhrase(text, phrase) {
  if (!phrase) return text;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.split(regex);
}

function DetailModal({ post, onClose }) {
  if (!post) return null;

  const paragraphs = (post.explanation || post.content || '')
    .split(/\n\n|\.|\n/)
    .map(p => p.trim())
    .filter(Boolean);

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
            <p className="mt-2 text-sm text-slate-700">{post.content}</p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-display text-base font-semibold text-slate-900">Fact Check</h3>
            <p className="mt-2 text-sm text-slate-700">
              Verdict: <span className="font-semibold text-slate-900">{post.factCheck}</span>
            </p>
          </section>

          <LegalInsight
            law={post.law}
            explanation={post.lawExplanation}
            riskLevel={post.riskLevel}
          />

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-display text-base font-semibold text-slate-900">Analysis</h3>
            <div className="mt-2 text-sm text-slate-700 space-y-2">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;