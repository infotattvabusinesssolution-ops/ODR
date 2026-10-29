import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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
    if (location.hash) {
      const scrollToTarget = () => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
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
          <Route path="/odr-act" element={<OdrAct />} />
          <Route path="/rules" element={<OdrRules />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>

      <Footer />
      
      {/* Floating WhatsApp CTA */}
      <a href="https://wa.me/919187102299" className="whatsapp-float" target="_blank" aria-label="Chat on WhatsApp">
          <i className="fab fa-whatsapp"></i>
      </a>

      {/* Hidden Google Translate Element */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>
    </div>
  );
}

export default App;
