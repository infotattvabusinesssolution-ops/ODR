import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalhost) {
      return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3636';
    }
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.replace(/\/$/, '');
    }
    return 'https://gokulanandachaudhurifoundation.com';
  }
  return 'https://gokulanandachaudhurifoundation.com';
};

function Contact() {
  const location = useLocation();
  const prefill = location.state || {};
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    disputeType: prefill.subject || 'Commercial Dispute',
    disputeName: '',
    disputeAmount: 'Below ₹1,00,000',
    customerName: prefill.name || '',
    customerEmail: prefill.email || '',
    customerMobile: prefill.phone || '',
    customerAadhar: '',
    oppositeName: '',
    oppositeEmail: '',
    oppositeMobile: '',
    consent: 'Yes',
  });

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Sync state if navigation state changes
  useEffect(() => {
    if (location.state) {
      setFormData((prev) => ({
        ...prev,
        customerName: location.state.name || prev.customerName,
        customerEmail: location.state.email || prev.customerEmail,
        customerMobile: location.state.phone || prev.customerMobile,
        disputeType: location.state.subject || prev.disputeType,
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName.trim()) {
      setError('Please enter your full name as Claimant.');
      return;
    }
    if (!formData.customerEmail.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formData.customerMobile.trim()) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }
    if (!formData.disputeName.trim()) {
      setError('Please provide a title or brief summary of the dispute.');
      return;
    }
    if (!formData.oppositeName.trim()) {
      setError('Please specify the name of the opposite party / organization.');
      return;
    }
    if (!formData.oppositeMobile.trim()) {
      setError('Please enter the contact phone number for the opposite party.');
      return;
    }
    if (formData.consent !== 'Yes') {
      setError('You must grant consent under the Digital Personal Data Protection Act to proceed.');
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const sendData = new FormData();
      Object.keys(formData).forEach((key) => {
        sendData.append(key, formData[key]);
      });
      if (file) {
        sendData.append('file', file);
      }

      const response = await fetch(`${API_BASE_URL}/api/landing/contact`, {
        method: 'POST',
        body: sendData,
      });

      const result = await response.json();

      if (response.ok && (result.success || result.caseId)) {
        setSuccessData(result);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(result.error || result.message || 'Failed to submit dispute. Please check your connection and try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Could not reach the Utkal ODR registry server. Please make sure the service is active and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0b1e33 0%, #0f2438 280px, #f4f7fb 280px, #f4f7fb 100%)',
        fontFamily: "'Poppins', sans-serif",
        paddingBottom: '80px',
      }}
    >
      {/* Top Hero Banner */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '30px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '500',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'translateX(-3px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateX(0)'; }}
          >
            <span>←</span> Back to Main Site
          </Link>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(43, 165, 215, 0.15)',
              border: '1px solid rgba(43, 165, 215, 0.3)',
              color: '#7dd3fc',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }}></span>
            Utkal Institutional ODR Portal
          </div>
        </div>

        <div style={{ textAlign: 'center', color: '#ffffff', maxWidth: '750px', margin: '0 auto 20px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '12px', color: '#ffffff' }}>
            {successData ? 'Dispute Registered Successfully' : 'Dispute Intake & Arbitration Filing'}
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
            {successData
              ? 'Your filing has been recorded into the live registry. Below are your case details and next action steps.'
              : 'Submit formal dispute particulars for institutional mediation and arbitrator review under the ODR Rules.'}
          </p>
        </div>

        {/* Visual Multi-step Progression Ribbon */}
        {!successData && (
          <div
            style={{
              maxWidth: '680px',
              margin: '25px auto 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              padding: '12px 24px',
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontSize: '12px', fontWeight: '600' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>✓</span>
              <span>1. Contact Initiate</span>
            </div>
            <div style={{ flex: '1', height: '2px', backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: '0 12px' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '12px', fontWeight: '700' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)' }}>2</span>
              <span>2. Dispute Specifics</span>
            </div>
            <div style={{ flex: '1', height: '2px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 12px' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>3</span>
              <span>3. Neutral Hearing</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Container Card */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 45px rgba(15, 36, 56, 0.08), 0 4px 12px rgba(15, 36, 56, 0.04)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            overflow: 'hidden',
          }}
        >
          {successData ? (
            /* SUCCESS CELEBRATION CARD */
            <div style={{ padding: '60px 32px', textAlign: 'center' }}>
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '44px',
                  boxShadow: '0 12px 30px rgba(16, 185, 129, 0.35)',
                  marginBottom: '24px',
                }}
              >
                ✓
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Dispute Lodged in ODR Registry
              </h2>
              <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '580px', margin: '0 auto 30px', lineHeight: '1.6' }}>
                Your dispute submission has been authenticated and entered into the docket. Our registrar will issue an initial dispute notification to the opposite party.
              </p>

              {/* Case ID Highlight Card */}
              <div
                style={{
                  maxWidth: '520px',
                  margin: '0 auto 36px',
                  padding: '24px 28px',
                  backgroundColor: '#f8fafc',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '18px',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '8px' }}>
                  Your Official Case Tracking ID
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <span style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '800', fontFamily: 'monospace', color: '#0f2438', letterSpacing: '1px' }}>
                    {successData.caseId}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(successData.caseId)}
                    style={{
                      background: copied ? '#10b981' : '#0f2438',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    }}
                  >
                    {copied ? '✓ Copied' : '📋 Copy ID'}
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>
                  Use this ID to track hearing dates, mediation schedule, or submit supplementary evidence.
                </div>
              </div>

              {/* Next Steps Infographic */}
              <div style={{ maxWidth: '640px', margin: '0 auto 40px', textAlign: 'left', backgroundColor: '#f1f5f9', borderRadius: '16px', padding: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>What happens next?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>1</div>
                    <div style={{ fontSize: '13px', color: '#334155' }}><strong>Registrar Review:</strong> Case intake officers will review dispute documents within 24 business hours.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>2</div>
                    <div style={{ fontSize: '13px', color: '#334155' }}><strong>Opposite Party Notice:</strong> Automated electronic notice delivered via WhatsApp, SMS, and registered email.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>3</div>
                    <div style={{ fontSize: '13px', color: '#334155' }}><strong>Neutral Assignment:</strong> An accredited arbiter or mediator is assigned to conduct the online resolution.</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Link
                  to="/"
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    backgroundColor: '#0f2438',
                    color: '#ffffff',
                    fontWeight: '600',
                    textDecoration: 'none',
                    fontSize: '14px',
                    boxShadow: '0 4px 14px rgba(15, 36, 56, 0.25)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  ← Return to Home
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSuccessData(null);
                    setFormData({
                      disputeType: 'Commercial Dispute',
                      disputeName: '',
                      disputeAmount: 'Below ₹1,00,000',
                      customerName: '',
                      customerEmail: '',
                      customerMobile: '',
                      customerAadhar: '',
                      oppositeName: '',
                      oppositeEmail: '',
                      oppositeMobile: '',
                      consent: 'Yes',
                    });
                    setFile(null);
                  }}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    color: '#0f2438',
                    border: '2px solid #cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  + File Another Dispute
                </button>
              </div>
            </div>
          ) : (
            /* DISPUTE FORM */
            <form onSubmit={handleSubmit} style={{ padding: '40px 36px' }}>
              {/* Error banner */}
              {error && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* BLOCK 1: DISPUTE PARTICULARS */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                    ⚖️
                  </div>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Dispute Particulars</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Categorize the conflict for correct legal panel routing</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  {/* Dispute Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Dispute Type <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      id="disputeType"
                      value={formData.disputeType}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        color: '#0f172a',
                        backgroundColor: '#f8fafc',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#2ba5d7'; e.currentTarget.style.backgroundColor = '#fff'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      required
                    >
                      <option value="Commercial Dispute">Commercial Dispute</option>
                      <option value="Contract Dispute">Contract Dispute</option>
                      <option value="Property Dispute">Property Dispute</option>
                      <option value="Family / Matrimonial Dispute">Family / Matrimonial Dispute</option>
                      <option value="Consumer Dispute">Consumer Dispute</option>
                      <option value="Employment / Labour Dispute">Employment / Labour Dispute</option>
                      <option value="Banking & Finance Dispute">Banking & Finance Dispute</option>
                      <option value="Insurance Dispute">Insurance Dispute</option>
                      <option value="Intellectual Property Dispute">Intellectual Property Dispute</option>
                      <option value="Other">Other Dispute</option>
                    </select>
                  </div>

                  {/* Dispute Amount Range */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Estimated Dispute Amount (INR)
                    </label>
                    <select
                      id="disputeAmount"
                      value={formData.disputeAmount}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        color: '#0f172a',
                        backgroundColor: '#f8fafc',
                        outline: 'none',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#2ba5d7'; e.currentTarget.style.backgroundColor = '#fff'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    >
                      <option value="Below ₹1,00,000">Below ₹1,00,000</option>
                      <option value="₹1,00,000 - ₹5,00,000">₹1,00,000 - ₹5,00,000</option>
                      <option value="₹5,00,000 - ₹25,00,000">₹5,00,000 - ₹25,00,000</option>
                      <option value="Above ₹25,00,000">Above ₹25,00,000</option>
                    </select>
                  </div>

                  {/* Dispute Title */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Dispute Title / Subject Matter <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="disputeName"
                      placeholder="e.g. Non-Payment of Invoices / Breach of Services / Property Division Claim"
                      value={formData.disputeName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        color: '#0f172a',
                        backgroundColor: '#f8fafc',
                        outline: 'none',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#2ba5d7'; e.currentTarget.style.backgroundColor = '#fff'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* BLOCK 2: CLAIMANT DETAILS */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                    👤
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e1b4b', margin: 0 }}>Claimant / Applicant Details</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Your personal/business contact information</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Your Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      placeholder="Enter Your Legal Name"
                      value={formData.customerName}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Your Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      id="customerEmail"
                      placeholder="name@example.com"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Your Mobile Number (with WhatsApp) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      id="customerMobile"
                      placeholder="e.g. 9876543210"
                      value={formData.customerMobile}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Aadhar / ID Number <span style={{ fontSize: '11px', color: '#94a3b8' }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="customerAadhar"
                      placeholder="12-digit number (if available)"
                      value={formData.customerAadhar}
                      onChange={handleChange}
                      maxLength={12}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff' }}
                    />
                  </div>
                </div>
              </div>

              {/* BLOCK 3: OPPOSITE PARTY DETAILS */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                    🏢
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#7f1d1d', margin: 0 }}>Opposite Party / Respondent Details</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Contact coordinates for formal dispatch of arbitration notice</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Opposite Party / Entity Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="oppositeName"
                      placeholder="Individual or Company Name"
                      value={formData.oppositeName}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Opposite Party Email <span style={{ fontSize: '11px', color: '#94a3b8' }}>(If known)</span>
                    </label>
                    <input
                      type="email"
                      id="oppositeEmail"
                      placeholder="respondent@organization.com"
                      value={formData.oppositeEmail}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff' }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Opposite Party Mobile Number (for SMS / WhatsApp dispatch) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      id="oppositeMobile"
                      placeholder="e.g. 9876543210"
                      value={formData.oppositeMobile}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff' }}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* BLOCK 4: DOCUMENT UPLOAD & LEGAL CONSENT */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {/* File Upload Zone */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Attach Evidence / Agreement <span style={{ fontSize: '11px', color: '#94a3b8' }}>(PDF, Word, Images)</span>
                  </label>
                  <div
                    style={{
                      border: dragActive ? '2px dashed #0284c7' : '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      backgroundColor: dragActive ? '#f0f9ff' : file ? '#f0fdf4' : '#fafafa',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>{file ? '📄' : '📁'}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: file ? '#15803d' : '#334155' }}>
                      {file ? file.name : 'Click or Drag files to attach'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {file ? `${(file.size / 1024).toFixed(1)} KB • Click to replace` : 'Up to 25MB • Encrypted Storage'}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: '500', cursor: 'pointer', marginTop: '4px', padding: 0 }}
                    >
                      ✕ Remove attached file
                    </button>
                  )}
                </div>

                {/* Consent Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Data Protection Act Consent <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="consent"
                    value={formData.consent}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      color: '#0f172a',
                      backgroundColor: '#f8fafc',
                      outline: 'none',
                    }}
                    required
                  >
                    <option value="Yes">Yes, I grant consent as per DPDP Act</option>
                    <option value="No">No</option>
                  </select>

                  <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '12px', color: '#166534', lineHeight: '1.5' }}>
                    🔒 <strong>Confidentiality Assurance:</strong> All communications, pleadings, and proceedings remain private, legally protected, and admissible under the Arbitration and Conciliation Act, 1996.
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0f2438 0%, #1e4976 50%, #2ba5d7 100%)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 25px rgba(15, 36, 56, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(43, 165, 215, 0.4)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(15, 36, 56, 0.3)'; }}
              >
                {loading ? (
                  <>
                    <span style={{ width: '18px', height: '18px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
                    <span>Securing Docket & Registering Dispute...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Dispute for Resolution</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Security & Regulatory Footer Marks */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '28px', color: '#64748b', fontSize: '12px' }}>
          <span>🛡️ 256-Bit SSL Data Encryption</span>
          <span>•</span>
          <span>⚖️ Arbitration & Conciliation Act 1996 Governed</span>
          <span>•</span>
          <span>📜 Digital Personal Data Protection (DPDP) Act Compliant</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Contact;
