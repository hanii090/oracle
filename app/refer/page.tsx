'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { PHQ9_QUESTIONS, PHQ9_OPTIONS, GAD7_QUESTIONS, GAD7_OPTIONS, PROBLEM_DESCRIPTORS, EMPLOYMENT_STATUS } from '@/lib/iapt-dataset';
import { UK_CRISIS_CONTACTS } from '@/lib/risk-assessment';

type Step = 'personal' | 'gp' | 'clinical' | 'phq9' | 'gad7' | 'consent' | 'submitted';

interface FormData {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  nhsNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  gpPracticeName: string;
  gpName: string;
  gpAddressLine1: string;
  gpCity: string;
  gpPostcode: string;
  presentingProblems: string[];
  mainConcern: string;
  durationOfProblem: string;
  previousTherapy: boolean;
  previousTherapyDetails: string;
  currentMedication: boolean;
  medicationDetails: string;
  employmentStatus: string;
  phq9Scores: number[];
  gad7Scores: number[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  consentToProcess: boolean;
  consentToContactGP: boolean;
  consentToEmergencyContact: boolean;
}

export default function SelfReferralPage() {
  const [step, setStep] = useState<Step>('personal');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ referralId: string; triage: { phq9Severity: string; gad7Severity: string; stepName: string }; riskAlert: { message: string; contacts: { name: string; phone: string }[] } | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    nhsNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    gpPracticeName: '',
    gpName: '',
    gpAddressLine1: '',
    gpCity: '',
    gpPostcode: '',
    presentingProblems: [],
    mainConcern: '',
    durationOfProblem: '',
    previousTherapy: false,
    previousTherapyDetails: '',
    currentMedication: false,
    medicationDetails: '',
    employmentStatus: '',
    phq9Scores: Array(9).fill(-1),
    gad7Scores: Array(7).fill(-1),
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    consentToProcess: false,
    consentToContactGP: false,
    consentToEmergencyContact: false,
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const steps: Step[] = ['personal', 'gp', 'clinical', 'phq9', 'gad7', 'consent'];
  const currentStepIndex = steps.indexOf(step);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/self-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit referral');
        return;
      }

      setResult(data);
      setStep('submitted');
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-cinzel ${
              i < currentStepIndex
                ? 'bg-teal-500 text-void'
                : i === currentStepIndex
                ? 'bg-teal-500/20 border-2 border-teal-500 text-teal-400'
                : 'bg-border text-text-muted'
            }`}
          >
            {i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 ${i < currentStepIndex ? 'bg-teal-500' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPersonalStep = () => (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl text-text-main mb-4">Your Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">Full Name *</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Date of Birth *</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Phone *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="07xxx xxxxxx"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">NHS Number (optional)</label>
        <input
          type="text"
          value={formData.nhsNumber}
          onChange={(e) => updateField('nhsNumber', e.target.value)}
          className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
          placeholder="XXX XXX XXXX"
        />
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">Address Line 1 *</label>
        <input
          type="text"
          value={formData.addressLine1}
          onChange={(e) => updateField('addressLine1', e.target.value)}
          className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
          placeholder="Street address"
        />
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">Address Line 2</label>
        <input
          type="text"
          value={formData.addressLine2}
          onChange={(e) => updateField('addressLine2', e.target.value)}
          className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
          placeholder="Flat, building, etc."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">City *</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => updateField('city', e.target.value)}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="City"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Postcode *</label>
          <input
            type="text"
            value={formData.postcode}
            onChange={(e) => updateField('postcode', e.target.value.toUpperCase())}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="SW1A 1AA"
          />
        </div>
      </div>

      <h3 className="font-cinzel text-lg text-text-main mt-8 mb-4">Emergency Contact</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">Name *</label>
          <input
            type="text"
            value={formData.emergencyContactName}
            onChange={(e) => updateField('emergencyContactName', e.target.value)}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="Contact name"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Phone *</label>
          <input
            type="tel"
            value={formData.emergencyContactPhone}
            onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="07xxx xxxxxx"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Relationship *</label>
          <input
            type="text"
            value={formData.emergencyContactRelationship}
            onChange={(e) => updateField('emergencyContactRelationship', e.target.value)}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="e.g. Partner, Parent"
          />
        </div>
      </div>
    </div>
  );

  const renderGPStep = () => (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl text-text-main mb-4">Your GP Details</h2>
      <p className="text-sm text-text-muted mb-6">
        We may need to contact your GP to coordinate your care. This is standard practice in NHS services.
      </p>

      <div>
        <label className="block text-xs text-text-muted mb-1">GP Practice Name *</label>
        <input
          type="text"
          value={formData.gpPracticeName}
          onChange={(e) => updateField('gpPracticeName', e.target.value)}
          className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
          placeholder="e.g. Riverside Medical Centre"
        />
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">GP Name (if known)</label>
        <input
          type="text"
          value={formData.gpName}
          onChange={(e) => updateField('gpName', e.target.value)}
          className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
          placeholder="Dr Smith"
        />
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">Practice Address *</label>
        <input
          type="text"
          value={formData.gpAddressLine1}
          onChange={(e) => updateField('gpAddressLine1', e.target.value)}
          className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
          placeholder="Street address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">City *</label>
          <input
            type="text"
            value={formData.gpCity}
            onChange={(e) => updateField('gpCity', e.target.value)}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="City"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Postcode *</label>
          <input
            type="text"
            value={formData.gpPostcode}
            onChange={(e) => updateField('gpPostcode', e.target.value.toUpperCase())}
            className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="SW1A 1AA"
          />
        </div>
      </div>
    </div>
  );

  const renderClinicalStep = () => (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl text-text-main mb-4">About Your Difficulties</h2>

      <div>
        <label className="block text-xs text-text-muted mb-2">What are you experiencing? (select all that apply) *</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PROBLEM_DESCRIPTORS.map((problem) => (
            <button
              key={problem.code}
              onClick={() => {
                const current = formData.presentingProblems;
                if (current.includes(problem.code)) {
                  updateField('presentingProblems', current.filter(p => p !== problem.code));
                } else {
                  updateField('presentingProblems', [...current, problem.code]);
                }
              }}
              className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                formData.presentingProblems.includes(problem.code)
                  ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                  : 'border-border text-text-mid hover:border-teal-500/50'
              }`}
            >
              {problem.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-1">Tell us more about your main concern *</label>
        <textarea
          value={formData.mainConcern}
          onChange={(e) => updateField('mainConcern', e.target.value)}
          className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50 min-h-[120px]"
          placeholder="What's been troubling you? How is it affecting your life?"
        />
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-2">How long have you been experiencing this? *</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { value: 'less_than_month', label: '< 1 month' },
            { value: '1_3_months', label: '1-3 months' },
            { value: '3_6_months', label: '3-6 months' },
            { value: '6_12_months', label: '6-12 months' },
            { value: 'over_year', label: '> 1 year' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateField('durationOfProblem', option.value)}
              className={`p-3 rounded-lg border text-center text-xs transition-colors ${
                formData.durationOfProblem === option.value
                  ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                  : 'border-border text-text-mid hover:border-teal-500/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-2">Have you had therapy before?</label>
        <div className="flex gap-4">
          <button
            onClick={() => updateField('previousTherapy', true)}
            className={`px-6 py-2 rounded-lg border text-sm ${
              formData.previousTherapy
                ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                : 'border-border text-text-mid'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => updateField('previousTherapy', false)}
            className={`px-6 py-2 rounded-lg border text-sm ${
              !formData.previousTherapy
                ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                : 'border-border text-text-mid'
            }`}
          >
            No
          </button>
        </div>
        {formData.previousTherapy && (
          <textarea
            value={formData.previousTherapyDetails}
            onChange={(e) => updateField('previousTherapyDetails', e.target.value)}
            className="w-full mt-3 bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="What type of therapy? When? Was it helpful?"
          />
        )}
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-2">Are you currently taking any medication for mental health?</label>
        <div className="flex gap-4">
          <button
            onClick={() => updateField('currentMedication', true)}
            className={`px-6 py-2 rounded-lg border text-sm ${
              formData.currentMedication
                ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                : 'border-border text-text-mid'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => updateField('currentMedication', false)}
            className={`px-6 py-2 rounded-lg border text-sm ${
              !formData.currentMedication
                ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                : 'border-border text-text-mid'
            }`}
          >
            No
          </button>
        </div>
        {formData.currentMedication && (
          <input
            type="text"
            value={formData.medicationDetails}
            onChange={(e) => updateField('medicationDetails', e.target.value)}
            className="w-full mt-3 bg-raised border border-border rounded-lg px-4 py-3 text-text-main placeholder:text-text-muted/50"
            placeholder="What medication?"
          />
        )}
      </div>

      <div>
        <label className="block text-xs text-text-muted mb-2">Employment Status *</label>
        <select
          value={formData.employmentStatus}
          onChange={(e) => updateField('employmentStatus', e.target.value)}
          className="w-full bg-raised border border-border rounded-lg px-4 py-3 text-text-main"
        >
          <option value="">Select...</option>
          {EMPLOYMENT_STATUS.map((status) => (
            <option key={status.code} value={status.code}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderPHQ9Step = () => (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl text-text-main mb-2">PHQ-9 Questionnaire</h2>
      <p className="text-sm text-text-muted mb-6">
        Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following problems?
      </p>

      {PHQ9_QUESTIONS.map((question, i) => (
        <div key={question.id} className="border-b border-border pb-4">
          <p className="text-sm text-text-main mb-3">
            {i + 1}. {question.text}
          </p>
          {i === 8 && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-3">
              <p className="text-xs text-amber-400">
                This question asks about thoughts of self-harm. Your honest answer helps us understand how to best support you.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PHQ9_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const newScores = [...formData.phq9Scores];
                  newScores[i] = option.value;
                  updateField('phq9Scores', newScores);
                }}
                className={`p-2 rounded-lg border text-center text-xs transition-colors ${
                  formData.phq9Scores[i] === option.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-border text-text-mid hover:border-blue-500/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderGAD7Step = () => (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl text-text-main mb-2">GAD-7 Questionnaire</h2>
      <p className="text-sm text-text-muted mb-6">
        Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following problems?
      </p>

      {GAD7_QUESTIONS.map((question, i) => (
        <div key={question.id} className="border-b border-border pb-4">
          <p className="text-sm text-text-main mb-3">
            {i + 1}. {question.text}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {GAD7_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const newScores = [...formData.gad7Scores];
                  newScores[i] = option.value;
                  updateField('gad7Scores', newScores);
                }}
                className={`p-2 rounded-lg border text-center text-xs transition-colors ${
                  formData.gad7Scores[i] === option.value
                    ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                    : 'border-border text-text-mid hover:border-violet-500/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderConsentStep = () => (
    <div className="space-y-6">
      <h2 className="font-cinzel text-xl text-text-main mb-4">Consent & Privacy</h2>

      <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentToProcess}
            onChange={(e) => updateField('consentToProcess', e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-border bg-raised text-teal-500 focus:ring-teal-500"
          />
          <div>
            <p className="text-sm text-text-main">I consent to my data being processed *</p>
            <p className="text-xs text-text-muted mt-1">
              Your data will be stored securely in the UK and used only to provide psychological therapy services. 
              You can request deletion at any time under GDPR.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentToContactGP}
            onChange={(e) => updateField('consentToContactGP', e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-border bg-raised text-teal-500 focus:ring-teal-500"
          />
          <div>
            <p className="text-sm text-text-main">I consent to my GP being contacted</p>
            <p className="text-xs text-text-muted mt-1">
              We may send your GP a letter to inform them of your referral and treatment progress.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentToEmergencyContact}
            onChange={(e) => updateField('consentToEmergencyContact', e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-border bg-raised text-teal-500 focus:ring-teal-500"
          />
          <div>
            <p className="text-sm text-text-main">I consent to my emergency contact being contacted if needed</p>
            <p className="text-xs text-text-muted mt-1">
              Only in situations where we are concerned about your immediate safety.
            </p>
          </div>
        </label>
      </div>

      <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
        <h3 className="font-cinzel text-sm text-amber-400 mb-2">Important Information</h3>
        <p className="text-xs text-text-mid">
          If you are in crisis or having thoughts of harming yourself, please contact one of these services immediately:
        </p>
        <div className="mt-3 space-y-2">
          {UK_CRISIS_CONTACTS.slice(0, 3).map((contact, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-text-main">{contact.name}</span>
              <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-amber-400 hover:underline">
                {contact.phone}
              </a>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );

  const renderSubmittedStep = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="font-cinzel text-2xl text-text-main mb-4">Referral Submitted</h2>
      <p className="text-text-mid mb-8 max-w-md mx-auto">
        Thank you for your referral. We will contact you within 5 working days to discuss next steps.
      </p>

      {result && (
        <div className="bg-surface border border-border rounded-lg p-6 max-w-md mx-auto mb-8">
          <p className="text-xs text-text-muted mb-2">Reference Number</p>
          <p className="font-mono text-lg text-teal-400 mb-4">{result.referralId.slice(0, 8).toUpperCase()}</p>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-xs text-text-muted">Depression (PHQ-9)</p>
              <p className="text-sm text-text-main">{result.triage.phq9Severity}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Anxiety (GAD-7)</p>
              <p className="text-sm text-text-main">{result.triage.gad7Severity}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-text-muted">Recommended Treatment</p>
            <p className="text-sm text-teal-400">{result.triage.stepName}</p>
          </div>
        </div>
      )}

      {result?.riskAlert && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-6 max-w-md mx-auto mb-8">
          <h3 className="font-cinzel text-sm text-amber-400 mb-3">Support Available Now</h3>
          <p className="text-xs text-text-mid mb-4">{result.riskAlert.message}</p>
          <div className="space-y-2">
            {result.riskAlert.contacts.map((contact, i) => (
              <a
                key={i}
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="block p-3 bg-amber-500/10 rounded-lg text-center hover:bg-amber-500/20 transition-colors"
              >
                <span className="text-sm text-amber-400">{contact.name}: {contact.phone}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <a
        href="/"
        className="inline-block px-8 py-3 bg-teal-500/10 border border-teal-500 text-teal-400 font-cinzel text-sm tracking-widest rounded-lg hover:bg-teal-500 hover:text-void transition-colors"
      >
        Return Home
      </a>
    </div>
  );

  const canProceed = () => {
    switch (step) {
      case 'personal':
        return formData.fullName && formData.dateOfBirth && formData.email && formData.phone &&
               formData.addressLine1 && formData.city && formData.postcode &&
               formData.emergencyContactName && formData.emergencyContactPhone && formData.emergencyContactRelationship;
      case 'gp':
        return formData.gpPracticeName && formData.gpAddressLine1 && formData.gpCity && formData.gpPostcode;
      case 'clinical':
        return formData.presentingProblems.length > 0 && formData.mainConcern && formData.durationOfProblem && formData.employmentStatus;
      case 'phq9':
        return formData.phq9Scores.every(s => s >= 0);
      case 'gad7':
        return formData.gad7Scores.every(s => s >= 0);
      case 'consent':
        return formData.consentToProcess;
      default:
        return false;
    }
  };

  if (step === 'submitted') {
    return (
      <main className="min-h-screen bg-void py-12 px-6">
        <div className="max-w-2xl mx-auto">
          {renderSubmittedStep()}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <a href="/" className="font-cinzel text-gold tracking-[0.3em] text-sm uppercase">
            Sorca
          </a>
          <h1 className="font-cinzel text-3xl text-text-main mt-4">Self-Referral</h1>
          <p className="text-text-muted mt-2">
            Complete this form to refer yourself for psychological therapy support
          </p>
        </div>

        {renderStepIndicator()}

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-raised border border-border rounded-lg p-6 md:p-8"
        >
          {step === 'personal' && renderPersonalStep()}
          {step === 'gp' && renderGPStep()}
          {step === 'clinical' && renderClinicalStep()}
          {step === 'phq9' && renderPHQ9Step()}
          {step === 'gad7' && renderGAD7Step()}
          {step === 'consent' && renderConsentStep()}

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            {currentStepIndex > 0 ? (
              <button
                onClick={() => setStep(steps[currentStepIndex - 1])}
                className="px-6 py-3 border border-border text-text-muted font-cinzel text-sm tracking-widest rounded-lg hover:border-text-muted transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step === 'consent' ? (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="px-8 py-3 bg-teal-500 text-void font-cinzel text-sm tracking-widest rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Referral'}
              </button>
            ) : (
              <button
                onClick={() => setStep(steps[currentStepIndex + 1])}
                disabled={!canProceed()}
                className="px-8 py-3 bg-teal-500/10 border border-teal-500 text-teal-400 font-cinzel text-sm tracking-widest rounded-lg hover:bg-teal-500 hover:text-void transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
