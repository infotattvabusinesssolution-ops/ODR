import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, CircleUserRound, ChevronDown, User } from "lucide-react";
import { toast } from "react-toastify";
import { authApi } from "./api/authApi";
import { useAuth } from "./context/AuthContext";

export default function Login({ getRole }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Select Role");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = ["admin", "claimant", "respondent", "neutral"];

  useEffect(() => {
    getRole(selectedRole);
  }, [getRole, selectedRole]);

  const Styles = {
    container: {
      width: "100%",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f5f5",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    wrapper: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2rem",
    },
    logo: {
      textAlign: "center",
    },
    logoTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#0066cc",
      margin: "0.5rem 0 0 0",
    },
    logoSubtitle: {
      fontSize: "14px",
      color: "#666",
      margin: "0.25rem 0 0 0",
    },
    formContainer: {
      width: "450px",
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      padding: "2.5rem",
      borderRadius: "12px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    },
    heading: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "1.5rem",
      textAlign: "center",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    inputContainer: {
      display: "flex",
      alignItems: "center",
      border: "1px solid #ddd",
      borderRadius: "6px",
      padding: "0.75rem",
      backgroundColor: "#fff",
      transition: "border-color 0.3s ease",
    },
    inputIcon: {
      display: "flex",
      alignItems: "center",
      color: "#999",
      marginRight: "0.75rem",
      flexShrink: 0,
    },
    input: {
      height: "100%",
      border: "none",
      outline: "none",
      flex: 1,
      fontSize: "14px",
      color: "#333",
      backgroundColor: "transparent",
      fontFamily: "inherit",
      padding: "0",
    },
    input_placeholder: {
      color: "#999",
    },
    dropdownContainer: {
      position: "relative",
      width: "100%",
    },
    dropdownToggle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      border: "1px solid #ddd",
      borderRadius: "6px",
      padding: "0.75rem",
      backgroundColor: "#fff",
      cursor: "pointer",
      transition: "border-color 0.3s ease",
    },
    dropdownLeft: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      flex: 1,
    },
    dropdownText: {
      fontSize: "14px",
      color: "#333",
    },
    dropdownIcon: {
      display: "flex",
      alignItems: "center",
      color: "#999",
      transition: "transform 0.3s ease",
      transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
    },
    dropdownContent: {
      position: "absolute",
      top: "100%",
      left: "0",
      right: "0",
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderTop: "none",
      borderRadius: "0 0 6px 6px",
      marginTop: "-1px",
      zIndex: 1000,
      maxHeight: isDropdownOpen ? "200px" : "0",
      overflow: "hidden",
      transition: "max-height 0.3s ease",
    },
    dropdownOption: {
      padding: "0.75rem 1rem",
      cursor: "pointer",
      fontSize: "14px",
      color: "#333",
      textTransform: "capitalize",
      borderBottom: "1px solid #f0f0f0",
      transition: "background-color 0.2s ease",
    },
    button: {
      backgroundColor: "#0066cc",
      color: "#fff",
      border: "none",
      padding: "0.875rem",
      borderRadius: "6px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "1rem",
      transition: "background-color 0.3s ease",
    },
    link: {
      textAlign: "center",
      marginTop: "1rem",
      fontSize: "14px",
    },
    linkAnchor: {
      color: "#0066cc",
      textDecoration: "none",
      cursor: "pointer",
    },
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validation
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

        // Toast
        toast.success("Login successful!");

        // Navigate after successful login
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

  const isDisabled = selectedRole === "Select Role";

  return (
    <div style={Styles.container}>
      <div style={Styles.wrapper}>
        {/* Logo Section */}
        <div style={Styles.logo}>
          <div style={{ fontSize: "48px" }}>⚖️</div>
          <h1 style={Styles.logoTitle}>UTKAL ODR</h1>
          <p style={Styles.logoSubtitle}>Utkrust Vivad Samadhan</p>
          <p style={Styles.logoSubtitle}>Online Dispute Resolution Platfrom</p>
        </div>

        {/* Login Form */}
        <div style={Styles.formContainer}>
          <h2 style={Styles.heading}>Sign In</h2>

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: "#fee",
                color: "#c33",
                padding: "0.75rem",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "1rem",
                border: "1px solid #fcc",
              }}
            >
              {error}
            </div>
          )}

          <form style={Styles.form} onSubmit={handleLogin}>
            {/* Role Dropdown */}
            <div style={Styles.dropdownContainer}>
              <div
                style={Styles.dropdownToggle}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span style={Styles.dropdownLeft}>
                  <span style={Styles.inputIcon}>
                    <CircleUserRound size={20} />
                  </span>
                  <span style={Styles.dropdownText}>{selectedRole}</span>
                </span>
                <span style={Styles.dropdownIcon}>
                  <ChevronDown size={18} />
                </span>
              </div>
              <div style={Styles.dropdownContent}>
                {roles.map((role, index) => (
                  <div
                    key={index}
                    style={Styles.dropdownOption}
                    onClick={() => {
                      setSelectedRole(role);
                      setIsDropdownOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#fff";
                    }}
                  >
                    {role}
                  </div>
                ))}
              </div>
            </div>

            <div style={Styles.inputContainer}>
              <span style={Styles.inputIcon}>
                <Mail size={20} />
              </span>
              <input
                style={Styles.input}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDisabled}
              />
            </div>

            {/* Password Input */}
            <div style={Styles.inputContainer}>
              <span style={Styles.inputIcon}>
                <Lock size={20} />
              </span>
              <input
                style={Styles.input}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isDisabled}
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              style={{
                ...Styles.button,
                backgroundColor: isDisabled || loading ? "#cccccc" : "#0066cc",
                cursor: isDisabled || loading ? "not-allowed" : "pointer",
              }}
              disabled={isDisabled || loading}
              onClick={handleLogin}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Create Account Link */}
          <div style={Styles.link}>
            <span style={{ color: "#666" }}>Don't have an account? </span>
            <a href="/register" style={Styles.linkAnchor}>
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
