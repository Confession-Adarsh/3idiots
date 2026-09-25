export default function InjectionBanner() {
  return (
    <div className="mt-6 p-5 bg-red-950/40 border border-red-800/60 rounded-2xl">
      <div className="flex items-start gap-4">
        <span className="text-3xl flex-shrink-0 shield-animate">🛡️</span>
        <div>
          <h3 className="font-semibold text-red-300 text-base">
            This query was flagged and blocked for safety
          </h3>
          <p className="text-sm text-red-400/70 mt-1.5 leading-relaxed">
            kavach-search detected a potential prompt injection attempt.
            No results have been returned. Embedded instructions are never
            executed, and private information is never disclosed.
          </p>
          <p className="text-xs text-red-500/50 mt-3">
            If this is a false positive, rephrase using natural search
            terms instead of directive language.
          </p>
        </div>
      </div>
    </div>
  )
}
