import Link from 'next/link';

export default function OrderSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-3xl bg-brand-500 flex items-center justify-center mx-auto mb-6 shadow-glow">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="bg-white border border-surface-3 rounded-2xl shadow-card px-8 py-8">
          <h1 className="font-display text-2xl text-ink-primary mb-2">Payment Received!</h1>
          <p className="text-ink-muted text-sm mb-6">
            Your order has been logged and automatically routed to the supplier. Fulfillment will begin shortly.
          </p>

          <div className="bg-surface-1 border border-surface-3 rounded-xl px-5 py-4 text-left mb-6">
            <div className="flex items-center gap-2 mb-1">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#22a06b" strokeWidth="1.5"/>
                <path d="M5 8l2.5 2.5L11 5" stroke="#22a06b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-brand-600 font-semibold text-sm">Order logged to database</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#22a06b" strokeWidth="1.5"/>
                <path d="M5 8l2.5 2.5L11 5" stroke="#22a06b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-brand-600 font-semibold text-sm">Supplier notified automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#22a06b" strokeWidth="1.5"/>
                <path d="M5 8l2.5 2.5L11 5" stroke="#22a06b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-brand-600 font-semibold text-sm">Status set to &ldquo;Sent to Supplier&rdquo;</span>
            </div>
          </div>

          <Link
            href="/"
            className="block w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm text-center transition-colors"
          >
            Start New Recommendation
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="w-5 h-5 rounded-md bg-brand-500 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L14.5 5.5V12.5L9 16L3.5 12.5V5.5L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="font-display text-lg text-ink-primary">Revytal</span>
        </div>
      </div>
    </div>
  );
}
