'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

interface NHSService {
  id: string;
  name: string;
  icbArea: string;
  region: string;
  phone: string;
  website: string;
  selfReferralUrl: string;
  postcodeAreas: string[];
  serviceTypes: string[];
  waitTimeWeeks: { min: number; max: number };
  description: string;
}

export function FindTherapistContent() {
  const [postcode, setPostcode] = useState('');
  const [searching, setSearching] = useState(false);
  const [localServices, setLocalServices] = useState<NHSService[]>([]);
  const [nationalServices, setNationalServices] = useState<NHSService[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionServices, setRegionServices] = useState<NHSService[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);

  const handleSearch = async () => {
    if (!postcode.trim()) return;
    setSearching(true);
    setError(null);
    setSelectedRegion(null);

    try {
      const res = await fetch(`/api/find-therapist?postcode=${encodeURIComponent(postcode.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Search failed. Please try again.');
        return;
      }

      setLocalServices(data.localServices || []);
      setNationalServices(data.nationalServices || []);
      setSearched(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const loadRegions = async () => {
    if (regions.length > 0) return;
    setLoadingRegions(true);
    try {
      const res = await fetch('/api/find-therapist?list=regions');
      const data = await res.json();
      setRegions(data.regions || []);
    } catch {
      setError('Could not load regions.');
    } finally {
      setLoadingRegions(false);
    }
  };

  const browseRegion = async (region: string) => {
    setSelectedRegion(region);
    setSearched(false);
    setError(null);

    try {
      const res = await fetch(`/api/find-therapist?region=${encodeURIComponent(region)}`);
      const data = await res.json();
      setRegionServices(data.services || []);
    } catch {
      setError('Could not load services for this region.');
    }
  };

  const ServiceCard = ({ service }: { service: NHSService }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-raised border border-border rounded-lg p-5 hover:border-teal/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-cinzel text-base text-text-main">{service.name}</h3>
          <p className="text-xs text-teal mt-1">{service.icbArea}</p>
        </div>
        {service.serviceTypes.includes('crisis') && (
          <span className="shrink-0 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
            Crisis
          </span>
        )}
        {service.serviceTypes.includes('talking-therapies') && service.waitTimeWeeks.max > 0 && (
          <span className="shrink-0 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400">
            {service.waitTimeWeeks.min}–{service.waitTimeWeeks.max} weeks
          </span>
        )}
      </div>

      <p className="text-sm text-text-mid mt-3">{service.description}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={`tel:${service.phone.replace(/\s/g, '')}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-main hover:border-teal/50 transition-colors"
        >
          <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {service.phone}
        </a>

        <a
          href={service.selfReferralUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal/10 border border-teal rounded-lg text-sm text-teal hover:bg-teal hover:text-void transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Self-Refer
        </a>

        <a
          href={service.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text-muted hover:border-text-muted transition-colors"
        >
          Website
        </a>
      </div>
    </motion.div>
  );

  return (
    <main className="min-h-screen bg-void py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <a href="/" className="font-cinzel text-gold tracking-[0.3em] text-sm uppercase">
            Sorca
          </a>
          <h1 className="font-cinzel text-3xl text-text-main mt-4">
            Find NHS Talking Therapies
          </h1>
          <p className="text-text-mid mt-3 max-w-xl mx-auto">
            Search by postcode to find free NHS psychological therapy near you.
            You can self-refer — no GP referral needed.
          </p>
        </div>

        {/* Search */}
        <div className="bg-raised border border-border rounded-lg p-6 mb-6">
          <label className="block text-xs text-text-muted mb-2 font-cinzel tracking-widest uppercase">
            Your Postcode
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. SW1A 1AA"
              className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50 focus:border-teal/50 focus:outline-none transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !postcode.trim()}
              className="px-6 py-3 bg-teal text-void font-cinzel text-sm tracking-widest rounded-lg hover:bg-teal-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          <p className="text-xs text-text-muted mt-3">
            Enter the first part of your postcode (e.g. SW1A, M1, LS2) or your full postcode.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {searched && (
          <div className="space-y-6">
            {localServices.length > 0 ? (
              <>
                <div>
                  <h2 className="font-cinzel text-lg text-text-main mb-4">
                    Local Services ({localServices.length})
                  </h2>
                  <div className="space-y-4">
                    {localServices.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-raised border border-border rounded-lg p-6 text-center">
                <p className="text-text-mid mb-2">
                  No local services found for <strong className="text-text-main">{postcode}</strong>.
                </p>
                <p className="text-sm text-text-muted">
                  Try a different postcode, or browse by region below. You can also
                  call <strong className="text-text-main">111</strong> and select the mental health option.
                </p>
              </div>
            )}

            {nationalServices.length > 0 && (
              <div>
                <h2 className="font-cinzel text-lg text-text-main mb-4">
                  National Support Services
                </h2>
                <div className="space-y-4">
                  {nationalServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Browse by Region */}
        <div className="mt-10">
          <button
            onClick={loadRegions}
            className="w-full text-center py-4 border border-border rounded-lg text-text-muted hover:border-teal/30 hover:text-text-mid transition-colors font-cinzel text-sm tracking-widest"
          >
            {loadingRegions ? 'Loading...' : 'Browse by Region'}
          </button>

          {regions.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => browseRegion(region)}
                  className={`p-3 rounded-lg border text-sm transition-colors ${
                    selectedRegion === region
                      ? 'border-teal bg-teal/10 text-teal'
                      : 'border-border text-text-mid hover:border-teal/30'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          )}

          {selectedRegion && regionServices.length > 0 && (
            <div className="mt-6 space-y-4">
              <h2 className="font-cinzel text-lg text-text-main">
                {selectedRegion} ({regionServices.length} services)
              </h2>
              {regionServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>

        {/* Self-Referral CTA */}
        <div className="mt-10 bg-teal/5 border border-teal/20 rounded-lg p-6 text-center">
          <h3 className="font-cinzel text-base text-teal mb-2">
            Already Using Sorca?
          </h3>
          <p className="text-sm text-text-mid mb-4">
            Self-refer through Sorca for enhanced triage and automatic PHQ-9/GAD-7 scoring.
          </p>
          <a
            href="/refer"
            className="inline-block px-8 py-3 bg-teal text-void font-cinzel text-sm tracking-widest rounded-lg hover:bg-teal-bright transition-colors"
          >
            Self-Refer via Sorca
          </a>
        </div>

        {/* Info Section */}
        <div className="mt-10 bg-raised border border-border rounded-lg p-6">
          <h3 className="font-cinzel text-base text-text-main mb-4">About NHS Talking Therapies</h3>
          <div className="space-y-3 text-sm text-text-mid">
            <p>
              <strong className="text-text-main">What is it?</strong> NHS Talking Therapies (formerly IAPT)
              provides free, evidence-based psychological therapy for common mental health conditions
              like depression, anxiety, PTSD, and OCD.
            </p>
            <p>
              <strong className="text-text-main">Do I need a GP referral?</strong> No. You can self-refer
              directly to your local service. Just search by postcode above.
            </p>
            <p>
              <strong className="text-text-main">How long is the wait?</strong> Wait times vary by area,
              typically 4–18 weeks. Many services offer guided self-help or online support while you wait.
            </p>
            <p>
              <strong className="text-text-main">What therapies are available?</strong> CBT, counselling,
              EMDR, IPT, behavioural activation, and guided self-help — depending on your needs.
            </p>
            <p>
              <strong className="text-text-main">Is it really free?</strong> Yes. NHS Talking Therapies
              are completely free at the point of use for anyone registered with a GP in England.
            </p>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-text-muted hover:text-gold transition-colors font-cinzel text-xs tracking-widest uppercase"
          >
            ← Back to Sorca
          </a>
        </div>
      </div>
    </main>
  );
}
