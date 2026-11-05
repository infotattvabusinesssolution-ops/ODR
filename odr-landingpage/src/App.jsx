import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./Style.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Blogs from "./pages/Blogs";
import OdrAct from "./pages/OdrAct";
import OdrRules from "./pages/OdrRules";
import Contact from "./pages/Contact";

function App() {
  const location = useLocation();

  useEffect(() => {
    // Disable browser auto scroll restoration so external clicks always start at top
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (location.hash) {
      // If the link has a Google text fragment (#:~:text=) or mentions footer/about, keep at top
      if (
        location.hash.includes(":~:text=") ||
        location.hash.toLowerCase().includes("footer") ||
        location.hash.toLowerCase() === "#about" ||
        location.hash.toLowerCase() === "#home"
      ) {
        window.scrollTo(0, 0);
        return;
      }

      const scrollToTarget = () => {
        const id = location.hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          return true;
        }
        return false;
      };

      const timer1 = setTimeout(() => {
        if (!scrollToTarget()) {
          setTimeout(scrollToTarget, 200);
        }
      }, 100);

      return () => clearTimeout(timer1);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="app-container">
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blogs />} />
          <Route path="/blogs" element={<Navigate to="/blog" replace />} />
          <Route path="/odr-blogs.html" element={<Navigate to="/blog" replace />} />
          <Route path="/odr-act" element={<OdrAct />} />
          <Route path="/odr-act.html" element={<Navigate to="/odr-act" replace />} />
          <Route path="/rules" element={<OdrRules />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<Navigate to="/" replace />} />
          <Route path="/services" element={<Navigate to="/#services" replace />} />

          {/* Catch-all: ANY unmatched link always redirects to Home page, avoiding empty main with only footer */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Floating WhatsApp CTA */}
      <a
        href="https://wa.me/919187102299"
        className="whatsapp-float"
        target="_blank"
        aria-label="Chat on WhatsApp"
      >
        <i className="fab fa-whatsapp"></i>
      </a>

      {/* Hidden Google Translate Element */}
      <div id="google_translate_element" style={{ display: "none" }}></div>
    </div>
  );
}

export default App;
