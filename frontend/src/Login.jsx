import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, CircleUserRound, ChevronDown, Phone, Box, MapPin, Search, Scale, FileText, Video, FileCheck, Infinity, Gavel, BookOpen, Briefcase, Landmark } from "lucide-react";
import { toast } from "react-toastify";
import { authApi } from "./api/authApi";
import { API_BASE_URL } from "./api/axiosConfig";
import { useAuth } from "./context/AuthContext";
import { auth, googleProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "./config/firebase";
import "./Login.css";

export default function Login({ getRole }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Select Role");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Firebase specific states
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phoneForLogin, setPhoneForLogin] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  const roles = [
    { id: "admin", label: "Admin" },
    { id: "claimant", label: "Claimant" },
    { id: "respondent", label: "Respondent" },
    { id: "neutral", label: "Mediator" },
  ];

  const getRoleDisplayLabel = (rId) => {
    if (rId === "Select Role") return "Select Role";
    const found = roles.find((r) => r.id === rId);
    return found ? found.label : (rId === "neutral" ? "Mediator" : rId);
  };

  useEffect(() => {
    getRole(selectedRole);
  }, [getRole, selectedRole]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (selectedRole === "Select Role") {
      setError("Please select a role");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authApi.login(email, password, selectedRole);

      if (result.success) {
        // Store user data in AuthContext (syncs localStorage for compatibility)
        login(result.data, result.token);
        if (result.data.caseId) {
          localStorage.setItem("caseId", result.data.caseId);
        }
        getRole(selectedRole);
        toast.success("Login successful!");
        navigate(
          selectedRole === "admin"
            ? "/admin"
            : selectedRole === "claimant"
              ? "/claimant"
              : selectedRole === "respondent"
                ? "/respondent"
                : selectedRole === "neutral"
                  ? "/neutral"
                  : "/"
        );
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseLogin = async (idToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/firebase-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, role: selectedRole })
      });
      const result = await response.json();

      if (result.success) {
        login(result.user, result.token);
        getRole(result.role);
        toast.success("Firebase Login successful!");
        navigate(
          result.role === "admin"
            ? "/admin"
            : result.role === "claimant"
              ? "/claimant"
              : result.role === "respondent"
                ? "/respondent"
                : result.role === "neutral"
                  ? "/neutral"
                  : "/"
        );
      } else {
        setError(result.message || "Firebase login failed");
      }
    } catch (err) {
      setError(err.message || "Firebase login error");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (e) => {
    e.preventDefault();
    if (selectedRole === "Select Role") return setError("Please select a role");
    if (selectedRole === "admin") return setError("Admins cannot login via Firebase");

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await handleFirebaseLogin(idToken);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getRecaptchaContainer = () => {
    let container = document.getElementById("recaptcha-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "recaptcha-container";
      document.body.appendChild(container);
    }
    return container;
  };

  const clearRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (err) {
        console.warn("Error clearing RecaptchaVerifier:", err);
      }
      window.recaptchaVerifier = null;
    }
    if (window.grecaptcha && typeof window.grecaptcha.reset === "function") {
      try {
        window.grecaptcha.reset();
      } catch (err) {
        // ignore
      }
    }
    const container = document.getElementById("recaptcha-container");
    if (container) {
      container.innerHTML = "";
    }
  };

  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, []);

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      return window.recaptchaVerifier;
    }
    clearRecaptcha();
    let container = document.getElementById("recaptcha-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "recaptcha-container";
      document.body.appendChild(container);
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "normal",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        toast.warn("reCAPTCHA expired. Please check again.");
        clearRecaptcha();
      }
    });

    return window.recaptchaVerifier;
  };

  useEffect(() => {
    if (showPhoneLogin && !isOtpSent) {
      const timer = setTimeout(() => {
        try {
          const verifier = setupRecaptcha();
          if (verifier && typeof verifier.render === "function") {
            verifier.render().catch(() => {});
          }
        } catch (e) {
          console.warn("reCAPTCHA render notice:", e);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showPhoneLogin, isOtpSent]);

  const loginWithPhone = async (e) => {
    if (e) e.preventDefault();
    if (selectedRole === "Select Role") return setError("Please select a role");
    if (selectedRole === "admin") return setError("Admins cannot login via Firebase");
    if (!phoneForLogin) return setError("Please enter your phone number");

    const digitsOnly = phoneForLogin.replace(/\D/g, "");
    const cleanNumber = digitsOnly.startsWith("91") && digitsOnly.length > 10 ? digitsOnly.slice(2) : digitsOnly;

    if (cleanNumber.length !== 10) {
      return setError("Please enter a valid 10-digit mobile number");
    }

    const fullPhoneNumber = `+91${cleanNumber}`;

    setError("");

    try {
      const verifier = setupRecaptcha();
      setLoading(true);
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      toast.success(`OTP sent to ${fullPhoneNumber}`);
    } catch (err) {
      console.error("Phone sign-in error:", err);
      clearRecaptcha();

      if (err.code === "auth/invalid-app-credential") {
        setError(
          `Firebase app verification failed (auth/invalid-app-credential). Please ensure: 1) "${window.location.hostname}" is added to Firebase Console -> Authentication -> Settings -> Authorized Domains. 2) If using Firebase free Spark plan, use a registered test phone number (e.g. +91 99999 99999 with OTP 123456).`
        );
      } else if (err.code === "auth/captcha-check-failed" || (err.message && err.message.includes("Hostname match not found"))) {
        setError(
          `reCAPTCHA verification failed for hostname "${window.location.hostname}". Please ensure this domain is added to Firebase Console -> Authentication -> Settings -> Authorized Domains.`
        );
      } else if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format. Please enter a valid 10-digit number.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests from this device. Please wait a few moments before trying again.");
      } else if (err.code === "auth/quota-exceeded") {
        setError("SMS quota exceeded. Please check Firebase SMS quota or test phone numbers.");
      } else {
        setError(err.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length === 0) {
      return setError("Please enter the OTP");
    }

    setLoading(true);
    setError("");

    try {
      if (!window.confirmationResult) {
        throw new Error("Session expired. Please request a new OTP.");
      }
      const result = await window.confirmationResult.confirm(otp.trim());
      const idToken = await result.user.getIdToken();
      await handleFirebaseLogin(idToken);
    } catch (err) {
      console.error("OTP verification error:", err);
      if (err.code === "auth/invalid-verification-code") {
        setError("Invalid OTP entered. Please check and try again.");
      } else if (err.code === "auth/code-expired") {
        setError("OTP has expired. Please request a new one.");
      } else {
        setError(err.message || "Invalid OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPhoneLogin = () => {
    setShowPhoneLogin(false);
    setIsOtpSent(false);
    setPhoneForLogin("");
    setOtp("");
    clearRecaptcha();
    setError("");
  };

  const handleResendOtp = () => {
    setIsOtpSent(false);
    setOtp("");
    clearRecaptcha();
    setError("");
  };

  const isDisabled = selectedRole === "Select Role";

  return (
    <div className="login-container">
      <div className="login-box">

        {/* LEFT SIDE - Info Section */}
        <div className="login-left">
          {/* Top: Logo */}
          <div className="left-top">
            <div className="brand-header-light">
              <img
                src="/logo.png"
                alt="Utkal ODR - Online Dispute Resolution"
                style={{
                  width: "280px",
                  maxHeight: "100px",
                  maxWidth: "100%",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: "6px",
                  filter: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.45))"
                }}
              />
            </div>
          </div>

          {/* Middle: Hero Text */}
          <div className="left-middle">
            <h2 className="hero-title" style={{ fontSize: '44px', lineHeight: '1.2' }}>
              Dispute Resolution at Less Cost and Time 
            </h2>
            <p className="hero-subtitle" style={{ fontSize: '26px', lineHeight: '1.6', maxWidth: '600px', marginTop: '24px', color: '#ffffff', opacity: '1', fontWeight: '500' }}>
              Online Mediation Platform
            </p>
          </div>

        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="login-right">
          <div className="login-card">
            <div className="card-header">
              <h2>Welcome Back</h2>
              <p>Login to your UTKAL ODR account</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form className="form-group" onSubmit={handleLogin}>

              {/* Role Dropdown */}
              <div className="dropdown-container">
                <div
                  className="dropdown-toggle"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <CircleUserRound size={17} className="input-icon" />
                    <span style={{ color: selectedRole === "Select Role" ? "#94a3b8" : "#0f172a", textTransform: 'capitalize', fontWeight: '500' }}>
                      {getRoleDisplayLabel(selectedRole)}
                    </span>
                  </span>
                  <ChevronDown size={15} className="input-icon" style={{ transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", margin: 0 }} />
                </div>
                <div className={`dropdown-menu ${isDropdownOpen ? "open" : ""}`}>
                  {roles.map((r, index) => (
                    <div
                      key={index}
                      className="dropdown-item"
                      onClick={() => { setSelectedRole(r.id); setIsDropdownOpen(false); }}
                    >
                      {r.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Input */}
              <div className="input-wrapper">
                <Mail size={17} className="input-icon" />
                <input
                  className="input-field"
                  type="email"
                  placeholder="Username or Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isDisabled}
                />
              </div>

              {/* Password Input */}
              <div className="input-wrapper">
                <Lock size={17} className="input-icon" />
                <input
                  className="input-field"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isDisabled}
                />
              </div>

              {/* Remember me & Forgot Password */}
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox-input" />
                  Remember me
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>

              {/* Sign In / Login Button */}
              <button
                type="submit"
                className="btn-primary"
                disabled={isDisabled || loading}
              >
                {loading ? "Logging in..." : "Login"}
                {!loading && <span style={{ fontSize: '16px' }}>→</span>}
              </button>

              <div className="divider">
                <div className="divider-line"></div>
                <div className="divider-text">OR</div>
                <div className="divider-line"></div>
              </div>

              {/* Firebase Login Section */}
              {selectedRole !== "admin" && (
                <div className="sso-buttons">
                  {!showPhoneLogin ? (
                    <>
                      <button type="button" onClick={loginWithGoogle} className="btn-outline" disabled={loading || isDisabled}>
                        <svg width="18" height="18" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        Sign in with Google
                      </button>

                      <button type="button" onClick={() => setShowPhoneLogin(true)} className="btn-outline" disabled={loading || isDisabled}>
                        <Phone size={18} />
                        Sign in with Phone Number
                      </button>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {!isOtpSent ? (
                        <>
                          <div className="otp-input-group">
                            <span style={{ color: "#64748b", marginRight: "0.5rem", fontWeight: "700" }}>+91</span>
                            <input
                              className="input-field"
                              type="tel"
                              maxLength={10}
                              placeholder="10-digit Phone Number"
                              value={phoneForLogin}
                              onChange={(e) => setPhoneForLogin(e.target.value)}
                              disabled={loading}
                            />
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b", margin: "-4px 0 6px", textAlign: "center", backgroundColor: "#f1f5f9", padding: "6px", borderRadius: "6px" }}>
                            Firebase Test Login: <strong>9999999999</strong> (OTP: <strong>000000</strong>)
                          </div>
                          <div id="recaptcha-container" style={{ display: "flex", justifyContent: "center", margin: "6px 0", minHeight: "78px" }}></div>
                          <button type="button" onClick={loginWithPhone} className="btn-success" disabled={loading}>
                            {loading ? "Sending OTP..." : "Send OTP"}
                          </button>
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <button
                              type="button"
                              onClick={handleCancelPhoneLogin}
                              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "13px", padding: "4px" }}
                            >
                              ← Back to Login Options
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: "13px", color: "#475569", textAlign: "center" }}>
                            Enter the code sent to <strong>+91 {phoneForLogin}</strong>
                          </div>
                          <div className="otp-input-group">
                            <input
                              className="input-field"
                              type="text"
                              placeholder="Enter OTP"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              disabled={loading}
                            />
                          </div>
                          <button type="button" onClick={verifyOTP} className="btn-success" disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP & Login"}
                          </button>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                            <button
                              type="button"
                              onClick={handleResendOtp}
                              style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: "4px" }}
                            >
                              Change Number / Resend
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelPhoneLogin}
                              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                      <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", marginTop: "4px" }}>
                        Protected by reCAPTCHA (<a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{ color: "#64748b" }}>Privacy</a> &amp; <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" style={{ color: "#64748b" }}>Terms</a>)
                      </div>
                    </div>
                  )}
                </div>
              )}


              <div className="register-prompt">
                <span>Don't have an account?</span>
                <a href="/register">Create an account</a>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
