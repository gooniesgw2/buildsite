import { useState } from 'react';
import { useBuildStore } from '../store/buildStore';
import { getShareableUrl, type BuildUrlFormat } from '../lib/buildEncoder';

export default function BuildExport() {
  const buildData = useBuildStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleCopyUrl = async (format: BuildUrlFormat) => {
    const url = await getShareableUrl(buildData as any, format);
    navigator.clipboard.writeText(url);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_18px_50px_-28px_rgba(14,22,40,1)]">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Sharing</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Build export</h2>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`h-4 w-4 transition-transform ${expanded ? '' : '-rotate-90'}`}
          >
            <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-slate-900/70 p-5">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-white">Shareable link</h3>
              <p className="text-sm text-slate-400">Generate a URL to share this build.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCopyUrl('compressed')}
                className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-left transition hover:border-slate-600 hover:bg-slate-900"
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-200">Compressed (shortest)</div>
                  <div className="text-xs text-slate-500">Binary encoded, smallest URL size</div>
                </div>
                <span className="ml-3 rounded-full border border-sky-500/60 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
                  {copied === 'compressed' ? '✓ Copied' : 'Copy'}
                </span>
              </button>

              <button
                onClick={() => handleCopyUrl('readable')}
                className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-left transition hover:border-slate-600 hover:bg-slate-900"
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-200">Human-readable</div>
                  <div className="text-xs text-slate-500">Query params with trait/skill IDs visible</div>
                </div>
                <span className="ml-3 rounded-full border border-sky-500/60 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
                  {copied === 'readable' ? '✓ Copied' : 'Copy'}
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-slate-500">
            <h3 className="text-base font-semibold text-slate-300">In-game template code</h3>
            <p className="mt-1 text-sm">
              Coming soon — we&apos;re working on automatic chat code export once the encoder is finalised.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
