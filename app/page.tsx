'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

type Product = {
  product_name: string;
  sku: string;
  supplier: string;
  price: number;
  cost: number;
  url: string;
  tags: string;
};

type Screen = 'search' | 'results' | 'qr' | 'confirmation';

type QRData = {
  checkout_url: string;
  qr_code: string; // data URI
  product: Product;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function supplierColor(supplier: string) {
  const map: Record<string, string> = {
    meyerpt:      'bg-blue-50 text-blue-700 border-blue-200',
    'brace direct': 'bg-violet-50 text-violet-700 border-violet-200',
    bracedirect:  'bg-violet-50 text-violet-700 border-violet-200',
  };
  return map[supplier.toLowerCase()] ?? 'bg-surface-2 text-ink-secondary border-surface-3';
}

// ─── Screen 1: Search ─────────────────────────────────────────────────────────
function SearchScreen({ onResults }: { onResults: (q: string, products: Product[]) => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onResults(query, data.products);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const suggestions = ['knee brace', 'ankle brace', 'biofreeze', 'compression sleeve', 'elbow brace', 'wrist support'];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      {/* Logo / wordmark */}
      <div className="mb-10 text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L14.5 5.5V12.5L9 16L3.5 12.5V5.5L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="9" cy="9" r="2.5" fill="white"/>
            </svg>
          </span>
          <span className="font-display text-2xl text-ink-primary tracking-tight">Revytal</span>
        </div>
        <p className="text-ink-muted text-sm font-medium tracking-wide uppercase letter-spacing-widest">
          Automated Checkout
        </p>
      </div>

      <div className="w-full max-w-lg animate-fade-up-delay">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card border border-surface-3 overflow-hidden">
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-8 py-6">
            <h1 className="font-display text-2xl text-white leading-snug">
              What product are you<br />recommending today?
            </h1>
            <p className="text-brand-100 text-sm mt-1.5">
              Type a product name or category to find matching SKUs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-ink-muted">
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11.5 11.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. knee brace, biofreeze…"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-surface-3 bg-surface-1
                  text-ink-primary text-sm placeholder:text-ink-faint
                  focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                  transition-all"
                autoFocus
              />
            </div>

            {error && (
              <p className="mt-3 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="mt-4 w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600
                text-white font-semibold text-sm tracking-wide
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all active:scale-[.98] shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/>
                    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Searching…
                </span>
              ) : 'Find Products →'}
            </button>
          </form>
        </div>

        {/* Quick suggestions */}
        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setQuery(s); setTimeout(() => inputRef.current?.focus(), 0); }}
              className="px-3 py-1.5 rounded-full border border-surface-3 bg-white text-ink-secondary
                text-xs font-medium hover:border-brand-300 hover:text-brand-600
                transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Screen 2: Results ────────────────────────────────────────────────────────
function ResultsScreen({
  query,
  products,
  onSelect,
  onBack,
}: {
  query: string;
  products: Product[];
  onSelect: (product: Product) => void;
  onBack: () => void;
}) {
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleSelect(product: Product) {
    setSelecting(product.sku);
    setError('');
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onSelect({ ...product, _checkoutData: data } as Product & { _checkoutData: QRData });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout.');
    } finally {
      setSelecting(null);
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-fade-up">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-surface-3 bg-white flex items-center justify-center hover:bg-surface-2 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="#3d5448" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L14.5 5.5V12.5L9 16L3.5 12.5V5.5L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="font-display text-xl text-ink-primary">Revytal</span>
            </div>
          </div>
        </div>

        <div className="animate-fade-up">
          <h2 className="font-display text-2xl text-ink-primary mb-1">
            Results for &ldquo;{query}&rdquo;
          </h2>
          <p className="text-ink-muted text-sm mb-6">
            {products.length} matching SKU{products.length !== 1 ? 's' : ''} found. Select one to generate a patient checkout.
          </p>

          {error && (
            <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {products.length === 0 ? (
            <div className="bg-white border border-surface-3 rounded-2xl px-8 py-12 text-center shadow-card">
              <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="#7a9488" strokeWidth="1.5"/>
                  <path d="M17 17l3 3" stroke="#7a9488" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M11 8v6M8 11h6" stroke="#7a9488" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="font-semibold text-ink-primary mb-1">No products found</p>
              <p className="text-ink-muted text-sm">Try a different keyword like &ldquo;knee brace&rdquo; or &ldquo;ankle support&rdquo;.</p>
              <button onClick={onBack} className="mt-6 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">
                Search Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {products.map((product, i) => (
                <div
                  key={product.sku}
                  className="bg-white border border-surface-3 rounded-2xl p-5 shadow-card
                    hover:border-brand-300 hover:shadow-glow transition-all group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon placeholder */}
                    <div className="w-14 h-14 rounded-xl bg-surface-2 flex-shrink-0 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="6" width="18" height="14" rx="2" stroke="#7a9488" strokeWidth="1.5"/>
                        <path d="M8 6V5a4 4 0 018 0v1" stroke="#7a9488" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-ink-primary leading-tight">
                            {product.product_name}
                          </h3>
                          <p className="text-ink-muted text-xs font-mono mt-0.5">{product.sku}</p>
                        </div>
                        <span className="text-brand-600 font-bold text-lg whitespace-nowrap">
                          {formatPrice(product.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${supplierColor(product.supplier)}`}>
                          {product.supplier}
                        </span>
                        {product.url && (
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-ink-muted hover:text-brand-600 underline underline-offset-2 transition-colors"
                          >
                            View product ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-surface-2">
                    <button
                      onClick={() => handleSelect(product)}
                      disabled={selecting !== null}
                      className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600
                        text-white font-semibold text-sm
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all active:scale-[.98]"
                    >
                      {selecting === product.sku ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/>
                            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                          Generating Checkout…
                        </span>
                      ) : 'Select → Generate QR'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Screen 3: QR Code ────────────────────────────────────────────────────────
function QRScreen({
  product,
  checkoutData,
  onBack,
  onNewOrder,
}: {
  product: Product;
  checkoutData: { checkout_url: string; qr_code: string };
  onBack: () => void;
  onNewOrder: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(checkoutData.checkout_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 bg-ink-primary">
      {/* Dark full-screen QR display */}
      <div className="w-full max-w-sm text-center animate-fade-up">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L14.5 5.5V12.5L9 16L3.5 12.5V5.5L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="font-display text-xl text-white tracking-tight">Revytal</span>
        </div>

        {/* Product info */}
        <h2 className="text-white font-display text-2xl leading-snug mb-1">
          {product.product_name}
        </h2>
        <p className="text-brand-400 font-bold text-xl mb-6">
          {formatPrice(product.price)}
        </p>

        {/* QR code */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Pulse ring */}
          <div className="absolute w-[280px] h-[280px] rounded-3xl bg-brand-500 opacity-20 ping-slow" />
          <div className="relative bg-white rounded-3xl p-5 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={checkoutData.qr_code}
              alt="Checkout QR Code"
              width={240}
              height={240}
              className="block"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 mb-6">
          <p className="text-white font-semibold mb-1">Scan to Checkout</p>
          <p className="text-white/60 text-sm">
            Show this screen to your patient. They scan the QR code with their phone camera and complete payment securely.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={copyLink}
            className="flex-1 py-3 rounded-xl border border-white/20 text-white text-sm font-medium
              hover:bg-white/10 transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={onNewOrder}
            className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold
              transition-colors"
          >
            New Order
          </button>
        </div>

        <button
          onClick={onBack}
          className="mt-3 w-full py-2.5 text-white/40 text-xs hover:text-white/60 transition-colors"
        >
          ← Back to results
        </button>
      </div>
    </div>
  );
}

// ─── Main orchestrator ────────────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState<Screen>('search');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutData, setCheckoutData] = useState<{ checkout_url: string; qr_code: string } | null>(null);

  function handleResults(q: string, prods: Product[]) {
    setQuery(q);
    setProducts(prods);
    setScreen('results');
  }

  function handleSelect(product: Product & { _checkoutData?: { checkout_url: string; qr_code: string; session_id: string } }) {
    const cd = product._checkoutData;
    if (!cd) return;
    setSelectedProduct(product);
    setCheckoutData({ checkout_url: cd.checkout_url, qr_code: cd.qr_code });
    setScreen('qr');
  }

  function handleNewOrder() {
    setScreen('search');
    setQuery('');
    setProducts([]);
    setSelectedProduct(null);
    setCheckoutData(null);
  }

  return (
    <>
      {screen === 'search' && (
        <SearchScreen onResults={handleResults} />
      )}
      {screen === 'results' && (
        <ResultsScreen
          query={query}
          products={products}
          onSelect={handleSelect as (p: Product) => void}
          onBack={() => setScreen('search')}
        />
      )}
      {screen === 'qr' && selectedProduct && checkoutData && (
        <QRScreen
          product={selectedProduct}
          checkoutData={checkoutData}
          onBack={() => setScreen('results')}
          onNewOrder={handleNewOrder}
        />
      )}
    </>
  );
}
