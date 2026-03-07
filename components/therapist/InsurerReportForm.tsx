'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface Insurer {
  id: string;
  name: string;
  shortName: string;
}

interface InsurerReportFormProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
}

export function InsurerReportForm({ clientId, clientName, onClose }: InsurerReportFormProps) {
  const { getIdToken } = useAuth();
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [selectedInsurer, setSelectedInsurer] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [insurerNotes, setInsurerNotes] = useState<string | null>(null);

  // Form fields
  const [clientDOB, setClientDOB] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [referralDate, setReferralDate] = useState('');
  const [presentingProblem, setPresentingProblem] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentModality, setTreatmentModality] = useState('');
  const [sessionFrequency, setSessionFrequency] = useState('Weekly');
  const [sessionsAttended, setSessionsAttended] = useState(0);
  const [sessionsAuthorised, setSessionsAuthorised] = useState(0);
  const [sessionsRequested, setSessionsRequested] = useState(0);
  const [initialPHQ9, setInitialPHQ9] = useState<number | ''>('');
  const [currentPHQ9, setCurrentPHQ9] = useState<number | ''>('');
  const [initialGAD7, setInitialGAD7] = useState<number | ''>('');
  const [currentGAD7, setCurrentGAD7] = useState<number | ''>('');
  const [progressSummary, setProgressSummary] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('No current risk concerns identified.');
  const [treatmentStartDate, setTreatmentStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');

  useEffect(() => {
    const loadInsurers = async () => {
      try {
        const token = await getIdToken();
        const res = await fetch('/api/therapist/insurer-report?action=list', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setInsurers(data.insurers || []);
        }
      } catch (e) {
        console.error('Failed to load insurers:', e);
      } finally {
        setLoading(false);
      }
    };
    loadInsurers();
  }, [getIdToken]);

  const handleGenerate = async () => {
    if (!selectedInsurer || !policyNumber || !presentingProblem || !progressSummary) return;
    setGenerating(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/therapist/insurer-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          insurerId: selectedInsurer,
          clientId,
          clientName,
          clientDOB,
          policyNumber,
          claimNumber: claimNumber || undefined,
          referralDate,
          presentingProblem,
          diagnosis: diagnosis || undefined,
          treatmentModality,
          sessionFrequency,
          sessionsAttended,
          sessionsAuthorised: sessionsAuthorised || undefined,
          sessionsRequested: sessionsRequested || undefined,
          initialPHQ9: initialPHQ9 !== '' ? initialPHQ9 : undefined,
          currentPHQ9: currentPHQ9 !== '' ? currentPHQ9 : undefined,
          initialGAD7: initialGAD7 !== '' ? initialGAD7 : undefined,
          currentGAD7: currentGAD7 !== '' ? currentGAD7 : undefined,
          progressSummary,
          treatmentPlan,
          riskAssessment,
          treatmentStartDate,
          expectedEndDate: expectedEndDate || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedReport(data.report);
        setInsurerNotes(data.notes);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate report');
      }
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedReport) navigator.clipboard.writeText(generatedReport);
  };

  const handlePrint = () => {
    if (!generatedReport) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Insurer Report</title>
      <style>body{font-family:'Courier New',monospace;max-width:700px;margin:40px auto;padding:20px;line-height:1.6;font-size:12px;white-space:pre-wrap;}
      @media print{body{margin:20px;}}</style></head>
      <body>${generatedReport}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (generatedReport) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel text-sm text-text-main">Generated Report</h3>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="px-3 py-1.5 border border-gold/30 text-gold text-[10px] font-cinzel rounded hover:bg-gold/10">Copy</button>
            <button onClick={handlePrint} className="px-3 py-1.5 bg-gold/10 text-gold text-[10px] font-cinzel rounded hover:bg-gold/20">Print</button>
            <button onClick={() => setGeneratedReport(null)} className="px-3 py-1.5 border border-border text-text-muted text-[10px] font-cinzel rounded hover:text-text-main">Edit</button>
          </div>
        </div>

        {insurerNotes && (
          <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-[10px] text-amber-400 font-cinzel tracking-wider mb-1">Insurer Notes</p>
            <p className="text-xs text-text-mid">{insurerNotes}</p>
          </div>
        )}

        <pre className="bg-raised border border-border rounded-lg p-4 text-xs text-text-main whitespace-pre-wrap font-mono leading-relaxed max-h-[60vh] overflow-y-auto">
          {generatedReport}
        </pre>

        <p className="text-[9px] text-text-muted">
          Always review and edit the report before submitting to the insurer. This is a template — clinical content is your responsibility.
        </p>
      </motion.div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  const inputClass = "w-full bg-raised border border-border rounded px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-gold/50 focus:outline-none";
  const labelClass = "block text-[10px] text-text-muted font-cinzel tracking-wider uppercase mb-1";

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {/* Insurer selection */}
      <div>
        <label className={labelClass}>Select Insurer</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {insurers.map(ins => (
            <button
              key={ins.id}
              onClick={() => setSelectedInsurer(ins.id)}
              className={`p-2.5 rounded-lg border text-xs text-center transition-all ${
                selectedInsurer === ins.id
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-border text-text-mid hover:border-gold/30'
              }`}
            >
              {ins.shortName}
            </button>
          ))}
        </div>
      </div>

      {selectedInsurer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Client details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Client DOB</label>
              <input type="date" value={clientDOB} onChange={e => setClientDOB(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Policy Number</label>
              <input type="text" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} placeholder="Policy/Member number" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Claim Number (if applicable)</label>
              <input type="text" value={claimNumber} onChange={e => setClaimNumber(e.target.value)} placeholder="Optional" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Referral Date</label>
              <input type="date" value={referralDate} onChange={e => setReferralDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Clinical details */}
          <div>
            <label className={labelClass}>Presenting Problem</label>
            <textarea value={presentingProblem} onChange={e => setPresentingProblem(e.target.value)} rows={3} placeholder="Describe the presenting difficulties..." className={inputClass + ' resize-none'} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Diagnosis (ICD-10, if applicable)</label>
              <input type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. F41.1 Generalised anxiety" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Treatment Modality</label>
              <input type="text" value={treatmentModality} onChange={e => setTreatmentModality(e.target.value)} placeholder="e.g. CBT, Integrative" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Session Frequency</label>
              <input type="text" value={sessionFrequency} onChange={e => setSessionFrequency(e.target.value)} placeholder="e.g. Weekly" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Treatment Start Date</label>
              <input type="date" value={treatmentStartDate} onChange={e => setTreatmentStartDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Sessions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Sessions Attended</label>
              <input type="number" value={sessionsAttended} onChange={e => setSessionsAttended(parseInt(e.target.value) || 0)} min={0} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Sessions Authorised</label>
              <input type="number" value={sessionsAuthorised} onChange={e => setSessionsAuthorised(parseInt(e.target.value) || 0)} min={0} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Sessions Requested</label>
              <input type="number" value={sessionsRequested} onChange={e => setSessionsRequested(parseInt(e.target.value) || 0)} min={0} className={inputClass} />
            </div>
          </div>

          {/* Outcome measures */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Initial PHQ-9</label>
              <input type="number" value={initialPHQ9} onChange={e => setInitialPHQ9(e.target.value ? parseInt(e.target.value) : '')} min={0} max={27} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Current PHQ-9</label>
              <input type="number" value={currentPHQ9} onChange={e => setCurrentPHQ9(e.target.value ? parseInt(e.target.value) : '')} min={0} max={27} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Initial GAD-7</label>
              <input type="number" value={initialGAD7} onChange={e => setInitialGAD7(e.target.value ? parseInt(e.target.value) : '')} min={0} max={21} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Current GAD-7</label>
              <input type="number" value={currentGAD7} onChange={e => setCurrentGAD7(e.target.value ? parseInt(e.target.value) : '')} min={0} max={21} className={inputClass} />
            </div>
          </div>

          {/* Progress & Plan */}
          <div>
            <label className={labelClass}>Progress Summary</label>
            <textarea value={progressSummary} onChange={e => setProgressSummary(e.target.value)} rows={4} placeholder="Summarise the client's progress..." className={inputClass + ' resize-none'} />
          </div>
          <div>
            <label className={labelClass}>Treatment Plan</label>
            <textarea value={treatmentPlan} onChange={e => setTreatmentPlan(e.target.value)} rows={3} placeholder="Ongoing treatment goals and approach..." className={inputClass + ' resize-none'} />
          </div>
          <div>
            <label className={labelClass}>Risk Assessment</label>
            <textarea value={riskAssessment} onChange={e => setRiskAssessment(e.target.value)} rows={2} className={inputClass + ' resize-none'} />
          </div>
          <div>
            <label className={labelClass}>Expected End Date (optional)</label>
            <input type="date" value={expectedEndDate} onChange={e => setExpectedEndDate(e.target.value)} className={inputClass} />
          </div>

          {/* Generate */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGenerate}
              disabled={generating || !policyNumber || !presentingProblem || !progressSummary}
              className="flex-1 py-3 bg-gold/10 text-gold border border-gold/30 font-cinzel text-sm tracking-widest rounded-lg hover:bg-gold/20 disabled:opacity-50 transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
            <button onClick={onClose} className="px-6 py-3 border border-border text-text-muted font-cinzel text-sm tracking-widest rounded-lg hover:text-text-main">
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
