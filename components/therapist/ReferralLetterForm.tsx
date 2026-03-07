'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface ReferralLetterFormProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
}

export function ReferralLetterForm({ clientId, clientName, onClose }: ReferralLetterFormProps) {
  const { getIdToken } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);

  // Form fields
  const [clientDOB, setClientDOB] = useState('');
  const [clientNHSNumber, setClientNHSNumber] = useState('');
  const [recipientType, setRecipientType] = useState<'gp' | 'psychiatrist' | 'specialist' | 'other'>('gp');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [letterType, setLetterType] = useState<'referral' | 'update' | 'discharge'>('referral');
  const [presentingProblem, setPresentingProblem] = useState('');
  const [treatmentSummary, setTreatmentSummary] = useState('');
  const [reasonForReferral, setReasonForReferral] = useState('');
  const [riskLevel, setRiskLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [riskDetails, setRiskDetails] = useState('');
  const [medicationNotes, setMedicationNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  const handleGenerate = async () => {
    if (!recipientName || !presentingProblem || !treatmentSummary) return;
    setGenerating(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/referral-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientId,
          clientName,
          clientDOB,
          clientNHSNumber: clientNHSNumber || undefined,
          recipientType,
          recipientName,
          recipientAddress: recipientAddress || undefined,
          letterType,
          presentingProblem,
          treatmentSummary,
          reasonForReferral: reasonForReferral || undefined,
          riskLevel,
          riskDetails: riskDetails || undefined,
          medicationNotes: medicationNotes || undefined,
          recommendations: recommendations || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedLetter(data.letter);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate letter');
      }
    } catch (e) {
      console.error('Failed to generate letter:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedLetter) navigator.clipboard.writeText(generatedLetter);
  };

  const handlePrint = () => {
    if (!generatedLetter) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Referral Letter</title>
      <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;line-height:1.7;font-size:13px;white-space:pre-wrap;}
      @media print{body{margin:20px;}}</style></head>
      <body>${generatedLetter}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (generatedLetter) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel text-sm text-text-main">Generated Letter</h3>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="px-3 py-1.5 border border-gold/30 text-gold text-[10px] font-cinzel rounded hover:bg-gold/10">Copy</button>
            <button onClick={handlePrint} className="px-3 py-1.5 bg-gold/10 text-gold text-[10px] font-cinzel rounded hover:bg-gold/20">Print</button>
            <button onClick={() => setGeneratedLetter(null)} className="px-3 py-1.5 border border-border text-text-muted text-[10px] font-cinzel rounded hover:text-text-main">Edit</button>
          </div>
        </div>

        <pre className="bg-raised border border-border rounded-lg p-4 text-xs text-text-main whitespace-pre-wrap font-serif leading-relaxed max-h-[60vh] overflow-y-auto">
          {generatedLetter}
        </pre>

        <p className="text-[9px] text-text-muted">
          Always review and edit before sending. Clinical content is your responsibility as the treating therapist.
        </p>
      </motion.div>
    );
  }

  const inputClass = "w-full bg-raised border border-border rounded px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none";
  const labelClass = "block text-[10px] text-text-muted font-cinzel tracking-wider uppercase mb-1";

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {/* Letter type */}
      <div>
        <label className={labelClass}>Letter Type</label>
        <div className="flex gap-2">
          {[
            { value: 'referral' as const, label: 'Referral' },
            { value: 'update' as const, label: 'Progress Update' },
            { value: 'discharge' as const, label: 'Discharge Summary' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setLetterType(opt.value)}
              className={`px-4 py-2 rounded-lg border text-xs transition-all ${
                letterType === opt.value
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-border text-text-mid hover:border-gold/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipient */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Recipient Type</label>
          <div className="flex gap-1.5">
            {[
              { value: 'gp' as const, label: 'GP' },
              { value: 'psychiatrist' as const, label: 'Psychiatrist' },
              { value: 'specialist' as const, label: 'Specialist' },
              { value: 'other' as const, label: 'Other' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setRecipientType(opt.value)}
                className={`px-2.5 py-1.5 rounded border text-[10px] transition-all ${
                  recipientType === opt.value
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-border text-text-mid hover:border-gold/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Recipient Name</label>
          <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="e.g. Smith" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Recipient Address (optional)</label>
        <textarea value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} rows={2} placeholder="Practice/hospital address..." className={inputClass + ' resize-none'} />
      </div>

      {/* Client details */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Client DOB</label>
          <input type="date" value={clientDOB} onChange={e => setClientDOB(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>NHS Number (optional)</label>
          <input type="text" value={clientNHSNumber} onChange={e => setClientNHSNumber(e.target.value)} placeholder="Optional" className={inputClass} />
        </div>
      </div>

      {/* Clinical content */}
      <div>
        <label className={labelClass}>Presenting Problem</label>
        <textarea value={presentingProblem} onChange={e => setPresentingProblem(e.target.value)} rows={3} placeholder="Describe the client's presenting difficulties..." className={inputClass + ' resize-none'} />
      </div>

      <div>
        <label className={labelClass}>Treatment Summary</label>
        <textarea value={treatmentSummary} onChange={e => setTreatmentSummary(e.target.value)} rows={3} placeholder="Summary of treatment provided..." className={inputClass + ' resize-none'} />
      </div>

      {letterType === 'referral' && (
        <div>
          <label className={labelClass}>Reason for Referral</label>
          <textarea value={reasonForReferral} onChange={e => setReasonForReferral(e.target.value)} rows={3} placeholder="Why are you referring this client?" className={inputClass + ' resize-none'} />
        </div>
      )}

      {/* Risk */}
      <div>
        <label className={labelClass}>Risk Level</label>
        <div className="flex gap-2">
          {[
            { value: 'none' as const, label: 'None' },
            { value: 'low' as const, label: 'Low' },
            { value: 'medium' as const, label: 'Medium' },
            { value: 'high' as const, label: 'High' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setRiskLevel(opt.value)}
              className={`px-3 py-1.5 rounded border text-xs transition-all ${
                riskLevel === opt.value
                  ? opt.value === 'high' ? 'border-red-500 bg-red-500/10 text-red-400' :
                    opt.value === 'medium' ? 'border-amber-500 bg-amber-500/10 text-amber-400' :
                    'border-gold bg-gold/10 text-gold'
                  : 'border-border text-text-mid hover:border-gold/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {riskLevel !== 'none' && (
          <textarea value={riskDetails} onChange={e => setRiskDetails(e.target.value)} rows={2} placeholder="Risk details..." className={inputClass + ' resize-none mt-2'} />
        )}
      </div>

      {/* Optional fields */}
      <div>
        <label className={labelClass}>Medication Notes (optional)</label>
        <textarea value={medicationNotes} onChange={e => setMedicationNotes(e.target.value)} rows={2} placeholder="Known medications or medication concerns..." className={inputClass + ' resize-none'} />
      </div>

      <div>
        <label className={labelClass}>Recommendations (optional)</label>
        <textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} rows={2} placeholder="Recommendations for ongoing care..." className={inputClass + ' resize-none'} />
      </div>

      {/* Generate */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleGenerate}
          disabled={generating || !recipientName || !presentingProblem || !treatmentSummary}
          className="flex-1 py-3 bg-gold/10 text-gold border border-gold/30 font-cinzel text-sm tracking-widest rounded-lg hover:bg-gold/20 disabled:opacity-50 transition-colors"
        >
          {generating ? 'Generating...' : 'Generate Letter'}
        </button>
        <button onClick={onClose} className="px-6 py-3 border border-border text-text-muted font-cinzel text-sm tracking-widest rounded-lg hover:text-text-main">
          Cancel
        </button>
      </div>
    </div>
  );
}
