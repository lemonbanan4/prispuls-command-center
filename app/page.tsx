'use client';
import { type ReactNode, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/fZu9ATgylbtP2Yc5T0g7e00';
const PASS_STORAGE_KEY = 'prispuls_pass_unlocked';
const VIP_ACCESS_CODE = 'VIP2026';

const inputClass =
  'w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30';
const labelClass = 'block text-xs uppercase tracking-widest text-white/50 mb-2';

function CommandCenterContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState('');
  const [maxPrice, setMaxPrice] = useState('200');
  const [targetLoadedFromQuery, setTargetLoadedFromQuery] = useState(false);
  const [passUnlocked, setPassUnlocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [email, setEmail] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const [status, setStatus] = useState<'idle' | 'hunting' | 'success' | 'error'>('idle');
  const [log, setLog] = useState('');

  const API_BASE = 'https://prispuls-agent-backend-production.up.railway.app';

  const checkoutReady =
    url.trim() !== '' &&
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    phone.trim() !== '' &&
    street.trim() !== '' &&
    email.trim() !== '' &&
    postalCode.trim() !== '' &&
    cardNumber.trim() !== '' &&
    cardExpiry.trim() !== '' &&
    cardCvc.trim() !== '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(PASS_STORAGE_KEY) === 'true') {
      setPassUnlocked(true);
    }
  }, []);

  useEffect(() => {
    const urlParam = searchParams.get('url');
    const maxPriceParam = searchParams.get('maxPrice');
    if (urlParam) {
      setUrl(urlParam);
      setTargetLoadedFromQuery(true);
    }
    if (maxPriceParam) {
      setMaxPrice(maxPriceParam);
    }
    if (searchParams.get('paid') === 'true') {
      localStorage.setItem(PASS_STORAGE_KEY, 'true');
      setPassUnlocked(true);
    }
  }, [searchParams]);

  const tryAccessCode = () => {
    if (accessCode.trim() === VIP_ACCESS_CODE) {
      localStorage.setItem(PASS_STORAGE_KEY, 'true');
      setPassUnlocked(true);
    }
  };

  const executeHunt = async () => {
    if (!passUnlocked) return;

    setStatus('hunting');
    setLog('Dispatching autonomous agent to cloud worker...');

    try {
      const res = await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          max_price: parseInt(maxPrice, 10),
          first_name: firstName,
          last_name: lastName,
          phone,
          street,
          email,
          postal_code: postalCode,
          card_number: cardNumber,
          card_expiry: cardExpiry,
          card_cvc: cardCvc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = data.detail;
        const message = Array.isArray(detail)
          ? detail
              .map((item: { loc?: string[]; msg?: string }) => {
                const field = item.loc?.filter((part) => part !== 'body').pop() ?? 'field';
                return `${field}: ${item.msg ?? 'invalid'}`;
              })
              .join('; ')
          : typeof detail === 'string'
            ? detail
            : 'Agent execution failed.';
        throw new Error(message);
      }

      const pollingInterval = setInterval(async () => {
        const statusRes = await fetch(`${API_BASE}/api/status/${data.job_id}`);
        const statusData = await statusRes.json();

        setLog(statusData.telemetry);

        if (statusData.status === 'success') {
          setStatus('success');
          clearInterval(pollingInterval);
        } else if (statusData.status === 'error') {
          setStatus('error');
          clearInterval(pollingInterval);
        }
      }, 5000);
    } catch (error) {
      setStatus('error');
      setLog(
        error instanceof Error
          ? `Critical failure: ${error.message}`
          : 'Critical failure: Could not connect to execution engine.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-8 mt-12">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-400/80 mb-3">
            Limited release
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            PRISPULS PRO // BLACK FRIDAY AUTO-SNIPER
          </h1>
          <p className="text-white/55 text-sm mt-3 max-w-3xl leading-relaxed">
            Autonomous AI checkout agent for Webhallen, Inet, Komplett, Elgiganten & NetOnNet. Beats scalpers
            and flash-sale sellouts.
          </p>
        </header>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] space-y-6">
          {targetLoadedFromQuery && (
            <p className="inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Target loaded from Prispuls
            </p>
          )}

          <FormSection title="Target">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Target URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.webhallen.com/se/product/..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Max Price (SEK)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Checkout profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+46 70 123 45 67"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Street address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Postal code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="111 22"
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Payment card">
            <div>
              <label className={labelClass}>Card number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelClass}>Expiry</label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>CVC</label>
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>

          {!passUnlocked && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-white/10">
              <label className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">
                Have an access code?
              </label>
              <div className="flex gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && tryAccessCode()}
                  placeholder="Enter code"
                  className={`${inputClass} py-2 text-xs`}
                />
                <button
                  type="button"
                  onClick={tryAccessCode}
                  className="px-4 py-2 rounded-xl border border-white/15 text-xs uppercase tracking-wider text-white/70 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {passUnlocked ? (
          <button
            type="button"
            onClick={executeHunt}
            disabled={status === 'hunting' || !checkoutReady}
            className="w-full bg-white text-black px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-gray-200 disabled:opacity-50 transition-all shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1"
          >
            {status === 'hunting' ? 'Agent Active: Checking Price & DOM...' : 'Deploy Autonomous Agent'}
          </button>
        ) : (
          <a
            href={STRIPE_PAYMENT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-cyan-500/20 border border-cyan-400/60 text-cyan-100 px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-cyan-500/30 hover:shadow-[0_0_32px_rgba(34,211,238,0.5)] hover:border-cyan-300/80"
          >
            Unlock Black Friday Pass — 79 kr
          </a>
        )}

        <div className="bg-black border border-white/10 p-6 rounded-xl font-mono text-sm shadow-inner">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
            <div
              className={`w-2 h-2 rounded-full ${
                status === 'hunting'
                  ? 'bg-yellow-500 animate-pulse'
                  : status === 'success'
                    ? 'bg-green-500'
                    : status === 'error'
                      ? 'bg-red-500'
                      : 'bg-white/20'
              }`}
            />
            <span className="text-white/50 uppercase tracking-widest text-xs">Mission Telemetry</span>
          </div>
          <p
            className={`whitespace-pre-wrap ${
              status === 'error' ? 'text-red-400' : status === 'success' ? 'text-green-400' : 'text-white/70'
            }`}
          >
            {log || '> Awaiting target configuration...'}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-500/70">{title}</h2>
      {children}
    </div>
  );
}

function CommandCenterFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-mono">
      <div className="max-w-4xl mx-auto mt-12 text-white/50 text-sm">Loading command center…</div>
    </div>
  );
}

export default function CommandCenter() {
  return (
    <Suspense fallback={<CommandCenterFallback />}>
      <CommandCenterContent />
    </Suspense>
  );
}