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
import GoogleMeet from "./components/GoogleMeet/GoogleMeet";
import { Agentation } from "agentation";
import { ALLOWED_LANGUAGES, clearTranslationCookies } from "./utils/translationUtils";



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

  // Sync language from URL parameter or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let lang = urlParams.get('lang');
    
    if (lang) {
      if (lang === 'en' || !ALLOWED_LANGUAGES.includes(lang)) {
        clearTranslationCookies();
        lang = null;
      } else {
        localStorage.setItem('odrLangCode', lang);
      }
    } else {
      lang = localStorage.getItem('odrLangCode');
    }

    if (lang && lang !== 'en' && ALLOWED_LANGUAGES.includes(lang)) {
      const setGoogleLang = () => {
        const selectField = document.querySelector(".goog-te-combo");
        // Ensure the select field has options loaded by Google Translate
        if (selectField && selectField.options && selectField.options.length > 0) {
          selectField.value = lang;
          const event = document.createEvent("HTMLEvents");
          event.initEvent("change", true, true);
          selectField.dispatchEvent(event);
        } else {
          // Retry if the Google Translate element is not yet fully loaded
          setTimeout(setGoogleLang, 500);
        }
      };
      setGoogleLang();
    } else if (lang === 'en') {
      clearTranslationCookies();
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
        <Route path="/meet" element={<GoogleMeet />} />
        <Route path="/meet/:roomId" element={<GoogleMeet />} />
        <Route path="/chamber/:roomId" element={<GoogleMeet />} />
        <Route path="/google-meet" element={<GoogleMeet />} />
        <Route path="/online-meeting" element={<GoogleMeet />} />
        <Route path="/online-hearing" element={<GoogleMeet />} />
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

