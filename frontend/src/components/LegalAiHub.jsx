import React, { useState, useEffect, useRef } from "react";
import { 
  Search, ShieldAlert, FileText, CheckCircle2, 
  TrendingUp, Gauge, FolderPlus, Languages, 
  FileCheck, AlertTriangle, Play, HelpCircle, Copy, Check, Send, Sparkles, Trash2
} from "lucide-react";
import axiosInstance from "../api/axiosConfig";
import "./LegalAiHub.css";

export default function LegalAiHub() {
  const [activeTab, setActiveTab] = useState("research");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // States for inputs & outputs
  const [researchQuery, setResearchQuery] = useState("");
  const [researchResult, setResearchResult] = useState(null);

  // Contract Audit & Comparison States
  const [contractText, setContractText] = useState("");
  const [contractBText, setContractBText] = useState("");
  const [contractResult, setContractResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [compareMode, setCompareMode] = useState(false); // true for comparison, false for audit

  const [summarizeText, setSummarizeText] = useState("");
  const [summarizeResult, setSummarizeResult] = useState(null);

  const [complianceText, setComplianceText] = useState("");
  const [complianceType, setComplianceType] = useState("Corporate Regulations");
  const [complianceResult, setComplianceResult] = useState(null);

  const [strategyText, setStrategyText] = useState("");
  const [strategyResult, setStrategyResult] = useState(null);

  const [predictType, setPredictType] = useState("Commercial Contract");
  const [predictAmount, setPredictAmount] = useState("");
  const [predictResult, setPredictResult] = useState(null);

  const [docType, setDocType] = useState("Legal Notice");
  const [docParams, setDocParams] = useState({
    partyA: "",
    partyB: "",
    details: "",
    amount: ""
  });
  const [docResult, setDocResult] = useState(null);

  const [translateText, setTranslateText] = useState("");
  const [translateLang, setTranslateLang] = useState("Hindi");
  const [translateAction, setTranslateAction] = useState("explain");
  const [translateResult, setTranslateResult] = useState(null);

  // AI Legal Chatbot States
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "assistant", text: "Hello! I am your AI Legal Procedure Advisor. I can guide you through legal procedures, arbitration, mediation, or how to schedule hearings. How can I help you today?" }
  ]);
  const chatEndRef = useRef(null);

  // Auto scroll to chat window bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, loading]);

  // E-Discovery States
  const [discoveryText, setDiscoveryText] = useState("");
  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [discoveryResult, setDiscoveryResult] = useState(null);

  // Helpers
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerApi = async (endpoint, payload, setter) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(`/api/legal-ai${endpoint}`, payload);
      if (response.data && response.data.success) {
        setter(response.data);
      } else {
        alert("Failed to analyze data.");
      }
    } catch (err) {
      console.error(err);
      alert("AI Service error. Check API credentials or server status.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { sender: "user", text: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage("");
    setLoading(true);

    try {
      const payload = {
        message: userMsg.text,
        chatHistory: chatHistory.concat(userMsg)
      };
      const response = await axiosInstance.post("/api/legal-ai/chat", payload);
      if (response.data && response.data.success) {
        setChatHistory(prev => [...prev, { sender: "assistant", text: response.data.answer }]);
      } else {
        setChatHistory(prev => [...prev, { sender: "assistant", text: "Sorry, I could not compile an answer right now." }]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: "assistant", text: "Error connecting to AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  const loadFAQ = async (question) => {
    const userMsg = { sender: "user", text: question };
    setChatHistory(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const payload = {
        message: question,
        chatHistory: chatHistory.concat(userMsg)
      };
      const response = await axiosInstance.post("/api/legal-ai/chat", payload);
      if (response.data && response.data.success) {
        setChatHistory(prev => [...prev, { sender: "assistant", text: response.data.answer }]);
      } else {
        setChatHistory(prev => [...prev, { sender: "assistant", text: "Sorry, I could not compile an answer right now." }]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: "assistant", text: "Error connecting to AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([
      { sender: "assistant", text: "Hello! I am your AI Legal Procedure Advisor. I can guide you through legal procedures, arbitration, mediation, or how to schedule hearings. How can I help you today?" }
    ]);
    setChatMessage("");
  };

  return (
    <div className="legal-ai-container">
      {/* Header */}
      <div className="legal-ai-header glass-card">
        <div className="header-icon">⚖️</div>
        <div>
          <h1>Utkal AI Legal Tech Portal</h1>
          <p>Supercharge your litigation strategy, automate drafting, and audit contracts with instant legal intelligence.</p>
        </div>
      </div>

      <div className="legal-ai-workspace">
        {/* Sidebar Nav */}
        <div className="legal-ai-sidebar glass-card">
          <button 
            className={`nav-btn ${activeTab === "research" ? "active" : ""}`}
            onClick={() => setActiveTab("research")}
          >
            <Search size={18} />
            <span>Legal Research</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "contract" ? "active" : ""}`}
            onClick={() => setActiveTab("contract")}
          >
            <ShieldAlert size={18} />
            <span>Contract Auditor</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "summarize" ? "active" : ""}`}
            onClick={() => setActiveTab("summarize")}
          >
            <FileText size={18} />
            <span>Document Summarizer</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "compliance" ? "active" : ""}`}
            onClick={() => setActiveTab("compliance")}
          >
            <CheckCircle2 size={18} />
            <span>Compliance Checker</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "strategy" ? "active" : ""}`}
            onClick={() => setActiveTab("strategy")}
          >
            <TrendingUp size={18} />
            <span>Litigation Strategy</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "predictive" ? "active" : ""}`}
            onClick={() => setActiveTab("predictive")}
          >
            <Gauge size={18} />
            <span>Outcome Predictor</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "automation" ? "active" : ""}`}
            onClick={() => setActiveTab("automation")}
          >
            <FolderPlus size={18} />
            <span>Document Automation</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "translation" ? "active" : ""}`}
            onClick={() => setActiveTab("translation")}
          >
            <Languages size={18} />
            <span>Plain Language Hub</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "chatbot" ? "active" : ""}`}
            onClick={() => setActiveTab("chatbot")}
          >
            <HelpCircle size={18} />
            <span>AI Legal Chatbot</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "ediscovery" ? "active" : ""}`}
            onClick={() => setActiveTab("ediscovery")}
          >
            <FileCheck size={18} />
            <span>E-Discovery Search</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="legal-ai-content glass-card">
          {/* 1. LEGAL RESEARCH */}
          {activeTab === "research" && (
            <div className="tab-pane">
              <h2>🔍 Instant Legal Research</h2>
              <p className="tab-desc">Search thousands of case laws and verify precedents instantly utilizing semantic lookup.</p>
              
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Enter legal issue e.g., Unpaid cargo invoicing dispute precedents..." 
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                />
                <button 
                  disabled={loading || !researchQuery}
                  onClick={() => triggerApi("/research", { query: researchQuery }, setResearchResult)}
                >
                  {loading ? "Searching..." : "Search Laws"}
                </button>
              </div>

              {loading && <div className="skeleton-box"><div className="skeleton-shimmer" style={{height: "180px"}} /></div>}

              {researchResult && !loading && (
                <div className="result-container animate-fade">
                  <h3>Analysis Summary</h3>
                  <div className="analysis-text markdown-render" style={{ whiteSpace: "pre-line" }}>
                    {researchResult.analysis}
                  </div>

                  {researchResult.precedents && researchResult.precedents.length > 0 && (
                    <div className="precedents-list">
                      <h4>Verified Citations Matched</h4>
                      {researchResult.precedents.map((item, idx) => (
                        <div key={idx} className="precedent-card">
                          <h5>{item.caseTitle} ({item.judgmentYear})</h5>
                          <p><strong>Citation:</strong> {item.citations}</p>
                          <p>{item.judgmentSummary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. CONTRACT AUDITOR & COMPARISON */}
          {activeTab === "contract" && (
            <div className="tab-pane">
              <div className="tab-header-toggle">
                <h2>🔒 Intelligent Contract Auditor & Comparer</h2>
                <div className="toggle-mode-buttons">
                  <button 
                    className={`toggle-btn ${!compareMode ? "selected" : ""}`}
                    onClick={() => { setCompareMode(false); setCompareResult(null); }}
                  >
                    Clause Audit
                  </button>
                  <button 
                    className={`toggle-btn ${compareMode ? "selected" : ""}`}
                    onClick={() => { setCompareMode(true); setContractResult(null); }}
                  >
                    Compare Versions
                  </button>
                </div>
              </div>
              <p className="tab-desc">
                {!compareMode 
                  ? "Audits NDAs, employment deeds, or lease contracts to identify risk exposures and missing provisions."
                  : "Compare Contract Version A and Contract Version B side-by-side to highlight additions, deletions, and terms modifications."}
              </p>
              
              {!compareMode ? (
                // Clause Audit View
                <div>
                  <textarea 
                    placeholder="Paste the contract text or clauses here..." 
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    rows={8}
                  />
                  <button 
                    className="action-btn"
                    disabled={loading || !contractText}
                    onClick={() => triggerApi("/contract-review", { contractText }, setContractResult)}
                  >
                    {loading ? "Auditing Agreement..." : "Analyze Contract"}
                  </button>

                  {loading && <div className="skeleton-box"><div className="skeleton-shimmer" style={{height: "220px"}} /></div>}

                  {contractResult && !loading && (
                    <div className="result-container animate-fade">
                      <h3>Agreement Summary</h3>
                      <p className="summary-para">{contractResult.summary}</p>

                      <div className="contract-grid">
                        <div className="risks-column">
                          <h4>Identified Clause Exposures</h4>
                          {contractResult.risks?.map((risk, idx) => (
                            <div key={idx} className={`risk-card border-${risk.riskLevel.toLowerCase()}`}>
                              <span className={`badge bg-${risk.riskLevel.toLowerCase()}`}>{risk.riskLevel} Risk</span>
                              <h5>{risk.clause}</h5>
                              <p>{risk.explanation}</p>
                            </div>
                          ))}
                        </div>

                        <div className="missing-column">
                          <h4>Missing Recommended Provisions</h4>
                          {contractResult.missingClauses?.map((item, idx) => (
                            <div key={idx} className="missing-card">
                              <AlertTriangle className="missing-icon" size={16} />
                              <div>
                                <h5>{item.clause}</h5>
                                <p>{item.recommendation}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Contract Comparison View
                <div>
                  <div className="comparison-inputs-grid">
                    <div>
                      <label className="input-label">Contract Version A (Original)</label>
                      <textarea 
                        placeholder="Paste original contract Version A..." 
                        value={contractText}
                        onChange={(e) => setContractText(e.target.value)}
                        rows={6}
                      />
                    </div>
                    <div>
                      <label className="input-label">Contract Version B (Modified)</label>
                      <textarea 
                        placeholder="Paste modified contract Version B..." 
                        value={contractBText}
                        onChange={(e) => setContractBText(e.target.value)}
                        rows={6}
                      />
                    </div>
                  </div>
                  <button 
                    className="action-btn"
                    disabled={loading || !contractText || !contractBText}
                    onClick={() => triggerApi("/compare-contracts", { contractA: contractText, contractB: contractBText }, setCompareResult)}
                  >
                    {loading ? "Comparing Versions..." : "Compare Contracts"}
                  </button>

                  {loading && <div className="skeleton-box"><div className="skeleton-shimmer" style={{height: "220px"}} /></div>}

                  {compareResult && !loading && (
                    <div className="result-container animate-fade">
                      <h3>Comparison Summary</h3>
                      <p className="summary-para">{compareResult.summary}</p>

                      <div className="comparison-output-grid">
                        <div className="comp-col card-additions">
                          <h4>➕ Additions in Version B</h4>
                          <ul>
                            {compareResult.additions?.map((add, idx) => (
                              <li key={idx}>{add}</li>
                            ))}
                            {(!compareResult.additions || compareResult.additions.length === 0) && <li>No additions found.</li>}
                          </ul>
                        </div>
                        <div className="comp-col card-deletions">
                          <h4>➖ Deletions in Version B</h4>
                          <ul>
                            {compareResult.deletions?.map((del, idx) => (
                              <li key={idx}>{del}</li>
                            ))}
                            {(!compareResult.deletions || compareResult.deletions.length === 0) && <li>No deletions found.</li>}
                          </ul>
                        </div>
                      </div>

                      <div className="modifications-list" style={{marginTop: "1.5rem"}}>
                        <h4>✏️ Modifications & Term Adjustments</h4>
                        {compareResult.modifications?.map((mod, idx) => (
                          <div key={idx} className="modification-row">
                            <strong>{mod.clause}:</strong> {mod.change}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. DOCUMENT SUMMARIZER */}
          {activeTab === "summarize" && (
            <div className="tab-pane">
              <h2>📄 Judgment & File Summarizer</h2>
              <p className="tab-desc">Summarizes lengthy judgments or legal notices, instantly extracting parties, deadlines, and core obligations.</p>
              
              <textarea 
                placeholder="Paste court judgments, notices, or case logs here..." 
                value={summarizeText}
                onChange={(e) => setSummarizeText(e.target.value)}
                rows={8}
              />
              <button 
                className="action-btn"
                disabled={loading || !summarizeText}
                onClick={() => triggerApi("/summarize", { documentText: summarizeText }, setSummarizeResult)}
              >
                {loading ? "Extracting Details..." : "Summarize File"}
              </button>

              {loading && <div className="skeleton-box"><div className="skeleton-shimmer" style={{height: "200px"}} /></div>}

              {summarizeResult && !loading && (
                <div className="result-container animate-fade">
                  <div className="summarizer-grid">
                    <div className="summary-bullets">
                      <h4>Key-Point Takeaway</h4>
                      <ul>
                        {summarizeResult.summary?.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="meta-extracted">
                      <h4>Extracted Metadata</h4>
                      
                      <h5>Parties Involved</h5>
                      <div className="tag-cloud">
                        {summarizeResult.parties?.map((p, idx) => (
                          <span key={idx} className="tag-badge">{p}</span>
                        ))}
                      </div>

                      <h5 style={{marginTop: "1.5rem"}}>Key Obligations</h5>
                      <ul>
                        {summarizeResult.obligations?.map((o, idx) => (
                          <li key={idx} className="obligation-item">{o}</li>
                        ))}
                      </ul>

                      <h5 style={{marginTop: "1.5rem"}}>Important Milestones & Dates</h5>
                      <div className="timeline-dates">
                        {summarizeResult.dates?.map((d, idx) => (
                          <div key={idx} className="date-row">
                            <span className="date-badge">{d.date}</span>
                            <span className="date-desc">{d.event}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. COMPLIANCE CHECKER */}
          {activeTab === "compliance" && (
            <div className="tab-pane">
              <h2>✅ Compliance & Regulatory Risk Auditor</h2>
              <p className="tab-desc">Verifies company policies or operational documents against standard regulatory frameworks.</p>
              
              <div className="form-row">
                <label>Compliance Directive Checklist</label>
                <select 
                  value={complianceType}
                  onChange={(e) => setComplianceType(e.target.value)}
                >
                  <option value="Corporate Regulations">Corporate Regulations (Companies Act)</option>
                  <option value="Data Privacy & GDPR">Data Privacy & GDPR Standards</option>
                  <option value="Labour and Wages Regulations">Labour & Wages Regulations</option>
                  <option value="Environmental Compliance Standards">Environmental Compliance</option>
                </select>
              </div>

              <textarea 
                placeholder="Paste policy handbook or agreement clause text..." 
                value={complianceText}
                onChange={(e) => setComplianceText(e.target.value)}
                rows={6}
              />
              <button 
                className="action-btn"
                disabled={loading || !complianceText}
                onClick={() => triggerApi("/compliance", { documentText: complianceText, complianceType }, setComplianceResult)}
              >
                {loading ? "Auditing Directive..." : "Audit Compliance"}
              </button>

              {loading && <div className="skeleton-box"><div className="skeleton-shimmer" style={{height: "200px"}} /></div>}

              {complianceResult && !loading && (
                <div className="result-container animate-fade">
                  <div className="compliance-summary-header">
                    <div className="score-widget">
                      <span className="score-number">{complianceResult.score}%</span>
                      <span className="score-label">Compliance Score</span>
                    </div>
                    <div>
                      <h4>Compliance Audit Status</h4>
                      <p>Checked against: <strong>{complianceType}</strong></p>
                    </div>
                  </div>

                  <div className="violations-section">
                    <h4>Identified Regulatory Gaps</h4>
                    {complianceResult.violations?.length === 0 ? (
                      <p className="clean-status">🎉 No compliance violations detected in this text block!</p>
                    ) : (
                      complianceResult.violations?.map((v, idx) => (
                        <div key={idx} className={`violation-card severity-${v.severity.toLowerCase()}`}>
                          <h5>{v.clause}</h5>
                          <p><strong>Issue:</strong> {v.issue}</p>
                          <span className="severity-badge">{v.severity} Risk</span>
                        </div>
                      ))
                    )}
                  </div>

                  {complianceResult.recommendations && (
                    <div className="recs-section">
                      <h4>Recommended Fixes</h4>
                      <ul>
                        {complianceResult.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. LITIGATION STRATEGY */}
          {activeTab === "strategy" && (
            <div className="tab-pane">
              <h2>📈 AI Litigation Strategy Planner</h2>
              <p className="tab-desc">Input case facts and claim details to prepare legal defenses, arguments, and court evidence preparation lists.</p>
              
              <textarea 
                placeholder="Describe your dispute, amount claimed, opponent arguments, and evidence logs..." 
                value={strategyText}
                onChange={(e) => setStrategyText(e.target.value)}
                rows={8}
              />
              <button 
                className="action-btn"
                disabled={loading || !strategyText}
                onClick={() => triggerApi("/litigation-strategy", { caseDetails: strategyText }, setStrategyResult)}
              >
                {loading ? "Formulating Strategy..." : "Formulate Defence Strategy"}
              </button>

              {loading && <div className="skeleton-box"><div className="skeleton-shimmer" style={{height: "220px"}} /></div>}

              {strategyResult && !loading && (
                <div className="result-container animate-fade">
                  <h3>Defence & Strategy Blueprint</h3>
                  <div className="strategy-markdown markdown-render" style={{ whiteSpace: "pre-line" }}>
                    {strategyResult.strategy}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. OUTCOME PREDICTOR */}
          {activeTab === "predictive" && (
            <div className="tab-pane">
              <h2>📊 Predictive Litigation Analytics</h2>
              <p className="tab-desc">Estimate win likelihood, trial costs, and resolution timelines based on historical legal precedents.</p>
              
              <div className="predictor-form">
                <div className="form-group">
                  <label>Dispute Category</label>
                  <select 
                    value={predictType}
                    onChange={(e) => setPredictType(e.target.value)}
                  >
                    <option value="Commercial Contract">Commercial Contract</option>
                    <option value="Employment Agreement">Employment Agreement</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Consumer Dispute">Consumer Dispute</option>
                    <option value="NDA / IP">NDA / Intellectual Property</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Dispute Claim Amount (₹)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 500000" 
                    value={predictAmount}
                    onChange={(e) => setPredictAmount(e.target.value)}
                  />
                </div>

                <button 
                  disabled={loading || !predictAmount}
                  onClick={() => triggerApi("/predictive-analytics", { disputeType: predictType, claimAmount: predictAmount }, setPredictResult)}
                >
                  {loading ? "Analyzing Precedents..." : "Predict Win Probability"}
                </button>
              </div>

              {loading && <div className="skeleton-box"><div className="skeleton-shimmer" style={{height: "180px"}} /></div>}

              {predictResult && !loading && (
                <div className="result-container animate-fade">
                  <div className="prediction-dashboard">
                    <div className="dial-card">
                      <span className="probability-dial">{predictResult.winProbability}%</span>
                      <h4>Win Probability</h4>
                    </div>

                    <div className="stats-cards">
                      <div className="stat-card">
                        <h5>Estimated Trial Duration</h5>
                        <p>{predictResult.estimatedDuration}</p>
                      </div>
                      <div className="stat-card">
                        <h5>Estimated Legal Costs</h5>
                        <p>{predictResult.estimatedCost}</p>
                      </div>
                    </div>
                  </div>

                  <div className="prediction-justification">
                    <h4>Precedent-Based Justification</h4>
                    <p>{predictResult.justification}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. DOCUMENT AUTOMATION */}
          {activeTab === "automation" && (
            <div className="tab-pane">
              <h2>✍️ Legal Document Automation Studio</h2>
              <p className="tab-desc">Auto-generate professional, binding legal notices, affidavits, or agreements instantly from standard wizard forms.</p>
              
              <div className="automation-wizard">
                <div className="doc-select">
                  <label>Choose Asset Template</label>
                  <select 
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    <option value="Legal Notice">Legal Notice (Unpaid Dues)</option>
                    <option value="Non-Disclosure Agreement (NDA)">Non-Disclosure Agreement (NDA)</option>
                    <option value="Lease Agreement">Lease Agreement</option>
                    <option value="Affidavit Declaration">Affidavit Declaration</option>
                    <option value="Power of Attorney (POA)">Power of Attorney (POA)</option>
                    <option value="Petition Statement">Petition Statement</option>
                    <option value="Case Summary Brief">Case Summary Brief</option>
                  </select>
                </div>

                <div className="param-form">
                  <div className="form-group">
                    <label>First Party (Claimant/Licensor)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ranjan Kumar" 
                      value={docParams.partyA}
                      onChange={(e) => setDocParams({ ...docParams, partyA: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Second Party (Respondent/Licensee)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. TechSolutions Ltd" 
                      value={docParams.partyB}
                      onChange={(e) => setDocParams({ ...docParams, partyB: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Dispute details & Terms</label>
                    <textarea 
                      placeholder="e.g. Unpaid warehousing invoices for October 2025 under contract terms..." 
                      value={docParams.details}
                      onChange={(e) => setDocParams({ ...docParams, details: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Disputed Amount / Considerations (₹)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1850000" 
                      value={docParams.amount}
                      onChange={(e) => setDocParams({ ...docParams, amount: e.target.value })}
                    />
                  </div>
                </div>

                <button 
                  className="action-btn"
                  disabled={loading || !docParams.partyA || !docParams.partyB}
                  onClick={() => triggerApi("/generate-document", { docType, parameters: docParams }, setDocResult)}
                >
                  {loading ? "Drafting Document..." : "Generate Legal Draft"}
                </button>
              </div>

              {loading && <div className="skeleton-box"><div className="skeleton-shimmer" style={{height: "220px"}} /></div>}

              {docResult && !loading && (
                <div className="result-container animate-fade">
                  <div className="draft-header">
                    <h3>Generated Document Draft</h3>
                    <button 
                      className="copy-btn"
                      onClick={() => handleCopy(docResult.draftText)}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? "Copied" : "Copy text"}</span>
                    </button>
                  </div>
                  <pre className="draft-textarea">{docResult.draftText}</pre>
                </div>
              )}
            </div>
          )}

          {/* 8. PLAIN LANGUAGE HUB */}
          {activeTab === "translation" && (
            <div className="tab-pane">
              <h2>🗣️ Plain Language Advisor & Translator</h2>
              <p className="tab-desc">Translate complex legal texts into local languages or simplify complex legalese into user-friendly explanations.</p>
              
              <textarea 
                placeholder="Paste the legal clause, notification message, or court document snippet..." 
                value={translateText}
                onChange={(e) => setTranslateText(e.target.value)}
                rows={6}
              />

              <div className="action-row">
                <div className="action-group">
                  <label>Operation</label>
                  <select 
                    value={translateAction}
                    onChange={(e) => setTranslateAction(e.target.value)}
                  >
                    <option value="explain">Explain Complex Legalese Simply</option>
                    <option value="translate">Translate Legalese to Local Language</option>
                    <option value="email">Draft Professional Client Response Email</option>
                  </select>
                </div>

                {translateAction === "translate" && (
                  <div className="action-group">
                    <label>Target Language</label>
                    <select 
                      value={translateLang}
                      onChange={(e) => setTranslateLang(e.target.value)}
                    >
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                      <option value="Bengali">Bengali (বাংলা)</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                    </select>
                  </div>
                )}

                <button 
                  disabled={loading || !translateText}
                  onClick={() => triggerApi("/translate-explain", { text: translateText, action: translateAction, language: translateLang }, setTranslateResult)}
                >
                  {loading ? "Processing..." : "Process Text"}
                </button>
              </div>

              {loading && <div className="skeleton-box"><div className="skeleton-shimmer" style={{height: "180px"}} /></div>}

              {translateResult && !loading && (
                <div className="result-container animate-fade">
                  <h3>AI Assistant Output</h3>
                  <div className="output-content-box">
                    <p style={{whiteSpace: "pre-line"}}>{translateResult.processedText}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 9. AI LEGAL CHATBOT */}
          {activeTab === "chatbot" && (
            <div className="tab-pane">
              <h2>🗣️ AI Legal & Procedural Advisor</h2>
              <p className="tab-desc">Ask queries about arbitration guidelines, ODR regulations, case filing steps, or how to prepare disputes.</p>
              
              <div className="chatbot-workspace">
                <div className="faq-suggs">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h4 style={{ margin: 0 }}>Common Legal Procedures FAQs</h4>
                    <button 
                      onClick={clearChat}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        color: "#ef4444", 
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "4px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}
                      title="Clear Conversation"
                    >
                      <Trash2 size={14} /> Clear
                    </button>
                  </div>
                  <div className="faq-list">
                    <button onClick={() => loadFAQ("Explain the differences between Arbitration and Mediation in ODR.")}>⚖️ Arbitration vs Mediation</button>
                    <button onClick={() => loadFAQ("How can a claimant submit new evidence after filing a case?")}>📂 How to submit evidence</button>
                    <button onClick={() => loadFAQ("What is the average timeline for resolving commercial contract claims under ODR?")}>⏱️ ODR Claim Timeline</button>
                    <button onClick={() => loadFAQ("Guide me step-by-step through filing a real estate delay dispute.")}>🏠 Real estate delay guide</button>
                  </div>
                </div>

                <div className="chat-interface">
                  <div className="chat-window" style={{ overflowY: "auto", maxHeight: "400px" }}>
                    {chatHistory.map((chat, idx) => (
                      <div key={idx} className={`chat-bubble-row ${chat.sender}`}>
                        <div className="chat-bubble">
                          <p style={{ whiteSpace: "pre-line", wordBreak: "break-word", margin: 0 }}>{chat.text}</p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="chat-bubble-row assistant">
                        <div className="chat-bubble skeleton-bubble">
                          <div className="skeleton-shimmer" style={{width: "80px", height: "14px"}} />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form className="chat-input-form" onSubmit={handleSendChatMessage}>
                    <input 
                      type="text" 
                      placeholder="Type your legal procedure question here..." 
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                    />
                    <button type="submit" disabled={loading || !chatMessage.trim()}>
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 10. E-DISCOVERY SEARCH */}
          {activeTab === "ediscovery" && (
            <div className="tab-pane">
              <h2>🔍 E-Discovery Evidence Scanner</h2>
              <p className="tab-desc">Index and search through logs, emails, or transcripts using AI to identify relevant evidence and trace verbal/written commitments.</p>
              
              <div className="form-row">
                <label>Investigation Document Pool (Paste logs, emails, transcript dump)</label>
                <textarea 
                  placeholder="Paste email threads, meeting transcripts, or chat logs here..." 
                  value={discoveryText}
                  onChange={(e) => setDiscoveryText(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Enter evidence target e.g. verbal confirmation of delivery extension..." 
                  value={discoveryQuery}
                  onChange={(e) => setDiscoveryQuery(e.target.value)}
                />
                <button 
                  disabled={loading || !discoveryText || !discoveryQuery}
                  onClick={() => triggerApi("/e-discovery", { documentPool: discoveryText, searchTarget: discoveryQuery }, setDiscoveryResult)}
                >
                  {loading ? "Scanning..." : "Execute Scan"}
                </button>
              </div>

              {loading && <div className="skeleton-box"><div className="skeleton-shimmer" style={{height: "200px"}} /></div>}

              {discoveryResult && !loading && (
                <div className="result-container animate-fade">
                  <div className="compliance-summary-header">
                    <div className="score-widget" style={{ borderColor: "#8b5cf6" }}>
                      <span className="score-number" style={{ color: "#8b5cf6" }}>{discoveryResult.relevanceScore}%</span>
                      <span className="score-label">Match Score</span>
                    </div>
                    <div>
                      <h4>E-Discovery Search Findings</h4>
                      <p>{discoveryResult.summary}</p>
                    </div>
                  </div>

                  <div className="excerpts-list" style={{marginTop: "1.5rem"}}>
                    <h4>Relevant Excerpts Identified</h4>
                    {discoveryResult.excerpts?.map((ex, idx) => (
                      <div key={idx} className="precedent-card" style={{ borderLeftColor: "#8b5cf6" }}>
                        <h5>Source File / Segment Context</h5>
                        <blockquote style={{ fontStyle: "italic", margin: "0.5rem 0", color: "#334155", paddingLeft: "1rem", borderLeft: "2px solid #cbd5e1" }}>
                          "{ex.text}"
                        </blockquote>
                        <p><strong>Evidentiary Value:</strong> {ex.relevanceReason}</p>
                      </div>
                    ))}
                    {(!discoveryResult.excerpts || discoveryResult.excerpts.length === 0) && <p>No matching excerpts found.</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
