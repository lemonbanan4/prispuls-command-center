'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function CommandCenterContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState('');
  const [maxPrice, setMaxPrice] = useState('200');
  const [targetLoadedFromQuery, setTargetLoadedFromQuery] = useState(false);

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
  }, [searchParams]);
  const [email, setEmail] = useState('test@cogcoretech.com');
  const [postalCode, setPostalCode] = useState('11122');

  // Payment state
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const [status, setStatus] = useState<'idle' | 'hunting' | 'success' | 'error'>('idle');
  const [log, setLog] = useState('');

  const API_BASE = 'https://prispuls-agent-backend-production.up.railway.app';

  const executeHunt = async () => {
    setStatus('hunting');
    setLog('Dispatching autonomous agent to cloud worker...');

    try {
      const res = await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          max_price: parseInt(maxPrice),
          email,
          postal_code: postalCode,
          card_number: cardNumber,
          card_expiry: cardExpiry,
          card_cvc: cardCvc
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Agent execution failed.');

      // 2. Start polling for status using the job_id
      const pollingInterval = setInterval(async () => {
        const statusRes = await fetch(`${API_BASE}/api/status/${data.job_id}`);
        const statusData = await statusRes.json();

        // Update log
        setLog(statusData.telemetry);

        if (statusData.status === 'success') {
          setStatus('success');
          clearInterval(pollingInterval);
        } else if (statusData.status === 'error') {
          setStatus('error');
          clearInterval(pollingInterval);
        }
      }, 2000); // Poll every 2 seconds

    } catch (error) {
      setStatus('error');
      setLog('Critical failure: Could not connect to execution engine.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-8 mt-12">

        <header className="border-b border-white/10 pb-4">
          <h1 className="text-3xl font-bold tracking-tighter">PRISPULS // AGENT COMMAND</h1>
          <p className="text-white/50 text-sm mt-2">LLM-Vision Purchasing Pipeline</p>
        </header>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] space-y-6">
          {targetLoadedFromQuery && (
            <p className="inline-flex items-center self-start rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Target loaded from Prispuls
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Target URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.webhallen.com/se/product/..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Max Price (SEK)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Target Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Payment inputs */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Card Number</label>
            <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Expiry</label>
              <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">CVC</label>
              <input type="text" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30" />
            </div>
          </div>
        </div>

        <button
          onClick={executeHunt}
          disabled={status === 'hunting' || !url}
          className="w-full bg-white text-black px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-gray-200 disabled:opacity-50 transition-all shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1"
        >
          {status === 'hunting' ? 'Agent Active: Checking Price & DOM...' : 'Deploy Autonomous Agent'}
        </button>
      </div>

      <div className="bg-black border border-white/10 p-6 rounded-xl font-mono text-sm shadow-inner">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
          <div className={`w-2 h-2 rounded-full ${status === 'hunting' ? 'bg-yellow-500 animate-pulse' :
            status === 'success' ? 'bg-green-500' :
              status === 'error' ? 'bg-red-500' : 'bg-white/20'
            }`} />
          <span className="text-white/50 uppercase tracking-widest text-xs">Mission Telemetry</span>
        </div>
        <p className={`whitespace-pre-wrap ${status === 'error' ? 'text-red-400' : status === 'success' ? 'text-green-400' : 'text-white/70'}`}>
          {log || '> Awaiting target configuration...'}
        </p>
      </div>

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