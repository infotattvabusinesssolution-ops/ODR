import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./App.css";
import Home from "./Home";
import Login from "./Login";
import Admin from "./admin/admin";
import Claimant from "./claimant/Claimant";
import { useState, useCallback, useEffect } from "react";
import Respondent from "./respondent/Respondent";
import Neutral from "./neutral/Neutral";
import Register from "./Register";
import LegalAiHub from "./components/LegalAiHub";
import { Agentation } from "agentation";



function App() {
  const [role, setRole] = useState(null);

  const getRole = useCallback((newRole) => {
    setRole(newRole);
  }, []);

  // Restore role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/register"
          element={<Register getRole={getRole} role={role} />}
        />
        <Route
          path="/login"
          element={<Login getRole={getRole} role={role} />}
        />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/claimant/*" element={<Claimant />} />
        <Route path="/respondent/*" element={<Respondent />} />
        <Route path="/neutral/*" element={<Neutral />} />
        <Route path="/legal-ai" element={<LegalAiHub />} />
      </Routes>

      {/* Toast Container */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {import.meta.env.DEV && <Agentation />}
    </Router>
  );
}

export default App;

