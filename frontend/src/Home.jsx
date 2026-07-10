import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const Navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const Styles = {
    home: {
      width: "99.8%",
      height: "99.5vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    button: {
      border: "none",
      borderRadius: "7px",
      fontSize: "1rem",
      color: "white",
      backgroundColor: "blue",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.7rem 1.3rem",
      cursor: "pointer",
    },
    buttonSpan: {
      display: "flex",
      alignItems: "center",
    },
    loadingSpin: {
      width: "16px",
      height: "16px",
      border: "3px solid white",
      borderTop: "3px solid transparent",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
  };

  const handleClick = () => {
    setLoading(true);
    const role = localStorage.getItem("userRole");
    setTimeout(() => {
      setLoading(false);
      if (role && role !== "undefined") {
        Navigate(`/${role}`);
      } else {
        Navigate("/login");
      }
    }, 2000);
  };

  return (
    <div style={Styles.home}>
      {!loading ? (
        <button style={Styles.button} onClick={handleClick}>
          <p>Let's Go</p>
          <span style={Styles.buttonSpan}>
            <ChevronRight size={24} strokeWidth={2.5} />
          </span>
        </button>
      ) : (
        <button style={Styles.button} onClick={handleClick} disabled>
          <span style={Styles.loadingSpin}></span>
          Redirecting...
        </button>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
