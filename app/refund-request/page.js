'use client';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RefundRequestPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    payment_date: '',
    plan: 'pro_monthly',
    reason: '',
    evidence_description: '',
    confirmed: false,
  });

  if (!isLoaded) return null;
  if (!user) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 18 }}>Please <a href="/sign-in" style={{ color: '#4f6ef7' }}>sign in</a> to submit a refund request.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.reason.trim().length < 50) {
      setError('Please describe the service loss in at least 50 characters.');
      return;
    }
    if (!form.confirmed) {
      setError('Please confirm you have read the refund policy.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/refund-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.fullName || user.firstName || '',
          email: user.primaryEmailAddress?.emailAddress || '',
          payment_date: form.payment_date,
          plan: form.plan,
          reason: form.reason,
          evidence_description: form.evidence_description,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Submission failed');
      }
      router.push('/refund-request/success');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
    borderRadius: 6, fontSize: 15, boxSizing: 'border-box', marginTop: 6,
    fontFamily: 'inherit',
  };
  const labelStyle = { display: 'block', fontWeight: 600, marginTop: 20, fontSize: 14 };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px', fontFamily: 'system-ui, sans-serif', color: '#1a1a2e' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Request a Refund</h1>
      <p style={{ color: '#666', marginBottom: 32, lineHeight: 1.6 }}>
        Refunds are available within 14 days of your charge date if you experienced a loss of service.
        Please <a href="/refund-policy" style={{ color: '#4f6ef7' }}>review our policy</a> before submitting.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Your Name</label>
        <input style={{ ...inputStyle, background: '#f5f5f5' }} value={user.fullName || user.firstName || ''} readOnly />

        <label style={labelStyle}>Email Address</label>
        <input style={{ ...inputStyle, background: '#f5f5f5' }} value={user.primaryEmailAddress?.emailAddress || ''} readOnly />

        <label style={labelStyle}>Date of Charge *</label>
        <input type="date" name="payment_date" required style={inputStyle} value={form.payment_date} onChange={handleChange} />

        <label style={labelStyle}>Subscription Plan *</label>
        <select name="plan" required style={inputStyle} value={form.plan} onChange={handleChange}>
          <option value="pro_monthly">CivicWatch Pro — Monthly</option>
          <option value="pro_annual">CivicWatch Pro — Annual</option>
        </select>

        <label style={labelStyle}>Describe the Loss of Service * <span style={{ fontWeight: 400, color: '#888' }}>(min 50 characters)</span></label>
        <textarea name="reason" required rows={5} style={inputStyle} placeholder="What was not working? When did it start? What did you try?" value={form.reason} onChange={handleChange} />
        <div style={{ fontSize: 12, color: form.reason.length < 50 ? '#e05' : '#4caf50', marginTop: 4 }}>
          {form.reason.length} / 50 characters minimum
        </div>

        <label style={labelStyle}>Supporting Evidence <span style={{ fontWeight: 400, color: '#888' }}>(optional)</span></label>
        <textarea name="evidence_description" rows={3} style={inputStyle} placeholder="Screenshots, error messages, dates/times, etc." value={form.evidence_description} onChange={handleChange} />

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 24, cursor: 'pointer' }}>
          <input type="checkbox" name="confirmed" checked={form.confirmed} onChange={handleChange} style={{ marginTop: 3 }} />
          <span style={{ fontSize: 14, lineHeight: 1.5 }}>
            I have read and understand the <a href="/refund-policy" style={{ color: '#4f6ef7' }}>CivicWatch Refund Policy</a> and confirm this request is based on a genuine loss of service.
          </span>
        </label>

        {error && <p style={{ color: '#e05', marginTop: 16, fontSize: 14 }}>{error}</p>}

        <button type="submit" disabled={submitting} style={{
          marginTop: 28, width: '100%', padding: '14px', background: submitting ? '#aaa' : '#4f6ef7',
          color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}>
          {submitting ? 'Submitting\u2026' : 'Submit Refund Request'}
        </button>
      </form>
    </div>
  );
}
